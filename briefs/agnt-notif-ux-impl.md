# Brief: AGNT notif-ux-impl — 10-notify becomes a rare, readable summons
Date: 2026-08-10
Status: ready
Dispatched by: ORCH notif-ux (pane w1A:pK)

## What This Is
The operator's verdict on app notifications: "they fire too many times",
"content is unusable, not contextual", "they flash too fast", "I only really
care about task completion." The policy is codified in
`~/.tower/COMMS-ARCH.md` §Notifications (2026-08-10) — READ IT FIRST; it is
the acceptance rubric, and its Hard invariants section binds too.

You implement. One file is yours (plus one helper module). You produce LIVE
evidence, you commit, and you report back in the exact shape at the bottom.

## Pre-Verified Facts (ORCH notif-ux, 2026-08-10 — all verified this session)

**Your partition**
- `/Users/jrg/herdr-spine/bin/handlers/10-notify` (154 lines) — the whole job.
- `/Users/jrg/herdr-spine/bin/handlers/_spine_common.py` (350 lines) — shared
  helpers; edit ONLY if you need a new helper. Prefer adding to 10-notify.
- DO NOT TOUCH, another orchestrator (och-ctl-tweaks) is editing them right
  now: `bin/handlers/40-tower-bridge`, `docs/spawn.md`, `docs/ctl-fleet.md`,
  and anything under a `*.ts` path. Both 40-tower-bridge and docs/spawn.md
  are ALREADY dirty in the working tree — leave those diffs untouched and
  stage your files explicitly (never `git add -A`).
- `bin/handlers/10-notify` is ALSO already dirty: a +12-line bridge-exempt
  block at lines 84–95 (COMMS-ARCH migration step 1, DONE 2026-08-10). Keep
  it exactly as it is; it will ride along in your commit.

**The toast API (verified: `herdr notification show --help`, this session)**
```
herdr notification show <TITLE> [--body <TEXT>]
    [--position top-left|top-right|bottom-left|bottom-right]
    [--sound none|done|request]
```
There is NO duration/timeout option. **Display duration is NOT configurable**
at the CLI. `_spine_common.py:290-292` (`sc.notify`) additionally clamps
title to 80 chars and body to 240.

**Role identification (verified live, `herdr pane list`, 2026-08-10)**
Two signals, neither universally present:
- `tokens.role` — observed values `"2-OCH"`, `"3-AGNT"`, `"3-AGT"`.
- `label` — observed: `"CORD future"` (w1A:p1, bridge-exempt),
  `"OCH c004-ux-2"` (w1A:pE, role `2-OCH`), `"ORCH ctl-tweaks"` (w1A:pF,
  **no role token**), `"AGNT ctrl-pane"` (w1A:pG, `3-AGNT`),
  `"AGNT statem-names"` (w1A:pH, `3-AGNT`), `"ORCH notif-ux"` (w1A:pK,
  **no role token**), `"AGT c004-i002"` / `"AGT c004-i003"` /
  `"AGT c004-i005"` / `"AGT c004-td-i005"` / `"AGT c004-test-author"`
  (w1C:p5–pA, all `3-AGT`).
Read that evidence carefully: **every worker pane carries a worker signal
(role `3-*` or an `AGT`/`AGNT`/`SAGT`/`SUB` label prefix), while orchestrator
panes may carry NO role token at all.** The role vocabulary is mid-rename
(0-CTL/2-OCH/3-AGT → CORD/ORCH/AGNT/SAGT); key on BOTH old and new forms.
`sc.pane_name()` (`_spine_common.py:121`) already resolves label → title →
terminal title → id, so the label (which already reads "ORCH ctl-tweaks") is
what the operator sees.

**Truncation bug in the durable record (verified, real `~/.tower/board.jsonl`
tail)**: the done board line's body is the `verdict` token, which herdr caps
around 100 chars — a real line ends mid-word: ``...the cycle store reads
`verify` wi``. COMMS-ARCH Hard invariants: "No truncation… Preview tokens
(herdr `verdict`/`task`) are display strings and may never be stored as
message bodies," and migration item 6: "any surviving path that stores a
preview token as a body is a bug." The blocked branch already solves this
correctly via `sc.question_text()` (`_spine_common.py:261`), which ladders
`$q` headline + `sc.screen_tail(sc.pane_read(pane_id))`.

**Runtime / test facts**
- The dispatcher (`bin/spine-hook`) runs each handler as its own subprocess
  with `HERDR_PLUGIN_EVENT_JSON` in env; `sc.parse_event()` reads
  `data.pane_id`, `data.agent_status`, `data.agent`, `data.workspace_id`.
- `HERDR_SOCKET_PATH=/Users/jrg/.config/herdr/herdr.sock` (needed by
  `sc.set_title`; a title-refresh failure is logged, never fatal).
- `SPINE_BOARD_PATH` (`_spine_common.py:32`) redirects board writes — use it
  for EVERY live test so the real `~/.tower/board.jsonl` stays clean.
- There is no `tests/` directory in this repo. Evidence = real handler
  invocations against real pane ids, with stderr captured.
- Handler budget: 5s per handler (`bin/spine-hook:36`); `pane_read` uses a 3s
  timeout. Do not add unbounded work.

## Tower
TOWER-WAIVED: you post nothing to the board. Your report goes to your
orchestrator (ORCH notif-ux, pane w1A:pK), which posts board topic notif-ux
with your evidence. Escalate a blocker by returning early with BLOCKED and
the exact obstacle rather than guessing.

## Tasks (each carries an explicit done condition, marked DONE-WHEN)

**T1 — Toasts only for task completion, summonses, alerts.**
On `status == "done"`, classify the pane. If it is a WORKER
(`tokens.role` matching `3-*`/`AGNT`/`AGT`/`SAGT`/`SUB`, or a label whose
first whitespace-delimited token is one of `AGNT`/`AGT`/`SAGT`/`SUB`
case-insensitively), write the board line and NO toast. Otherwise (CORD /
OCH / ORCH / CTL / unclassifiable) toast once.
Default direction is deliberate: the suppression set is the precisely
evidenced one, and the operator's one stated interest is task completion — so
an unclassifiable pane still toasts. Document that reasoning in the module
docstring. Log the classification decision on every done event
(`sc.log`), e.g. `done: <name> classified worker (role=3-AGT) — board only`.
DONE-WHEN: a done event on a `3-AGT` pane produces a board line and a stderr
line proving suppression; a done event on an ORCH pane produces one toast.

**T2 — Contextual content.**
Toast title carries ROLE + HUMAN WORK NAME, body carries the OUTCOME —
rubric example: `ORCH c004-ux — cycle complete, gate green 450/0`. Concretely:
- Title from `sc.pane_name()` (labels already read `ORCH ctl-tweaks`). If the
  name does not already start with a role token, prefix the normalized role
  from `tokens.role`. Never emit `ORCH ORCH …`. Never emit the bare agent
  kind (`"claude done"` is the current text and is exactly the complaint).
- Body = a readable outcome distilled from the `verdict` token: strip
  markdown emphasis and newlines, collapse whitespace, then cut at the FIRST
  sentence/clause boundary within ~110 chars — never mid-word, never a
  dangling fragment. No verdict → `"finished — no verdict reported"`.
  Fabricate nothing: the words must come from the agent's own token.
DONE-WHEN: the captured toast strings read as sentences an operator can parse
at a glance, with no ids and no half-words.

**T3 — 60s per-source pacing.**
If a toast for the same source would fire within 60s of the previous one,
DROP the toast (the rubric permits coalesce-or-drop) and log it. Key on
`(pane_id, kind)` where kind ∈ {`blocked`, `done`}, so a done toast can never
swallow a subsequent operator summons from the same pane — document that
reading. State lives in one small JSON file (default under `~/.tower/`, e.g.
`notify-pace.json`), overridable by env (e.g. `SPINE_NOTIFY_PACE_PATH`) for
tests. Missing/corrupt/unwritable state must degrade to "no previous toast"
and never break the handler. **The board line is ALWAYS written, even when
the toast is dropped** — that is what makes a dropped flash free.
DONE-WHEN: two done events from one ORCH pane inside 60s → 1 toast, 2 board
lines, and a log line naming the drop.

**T4 — Duration: answer it in the code and in the report.**
Record in the module docstring: duration is not configurable
(`herdr notification show --help`, verified 2026-08-10 — options are
`--body`, `--position`, `--sound` only), therefore the durable record is the
contract: every toast has a corresponding untruncated board line.
DONE-WHEN: the docstring states it with the citation.

**T5 — The done board line stops storing a truncated token as its body.**
Mirror the blocked branch: the durable body becomes the `verdict` token as a
HEADLINE plus `sc.screen_tail(sc.pane_read(pane_id))` (the same ladder
`sc.question_text` uses), so the board carries real, whole context. Reuse the
existing helpers — do not write a second reader. Re-verify status from the
pane list read you already take (the done branch already reads it) and skip
the screen read if the pane is no longer `done`, exactly as the blocked
branch skips a pane that unblocked. Stay inside the 5s handler budget.
DONE-WHEN: a done event yields a board line whose body ends on a complete
line, not `…reads \`verify\` wi`.

**T6 — Do not regress the blocked summons.**
The blocked branch's summons SHAPE (one toast, `sound=request`, WHO + WHERE +
"prefix+i to open inbox", full context on the board) was accepted by the
operator on 2026-08-09 — keep it. One improvement is in scope and required by
the rubric: the title must name the role + human work name
(`ORCH ctl-tweaks needs you`) instead of the agent kind
(`claude needs you`). Everything else in that branch stays byte-identical.
DONE-WHEN: you can show the before and after blocked toast strings side by
side, with only the title's WHO changed.

**T7 — Verify for real, then commit.**
- `python3 -m py_compile` both files you touched.
- Live runs, each with `SPINE_BOARD_PATH` and `SPINE_NOTIFY_PACE_PATH`
  pointed into a scratch dir, `HERDR_SOCKET_PATH` exported, stderr captured,
  `HERDR_PLUGIN_EVENT_JSON` built from a REAL pane (use the live ids/labels
  in Pre-Verified Facts; re-read `herdr pane list` first — pane states move):
  1. done on a `3-AGT` worker pane → no toast, board line present.
  2. done on an ORCH pane → exactly one toast; capture title+body verbatim.
  3. the same ORCH done event again immediately → toast dropped, 2nd board
     line still written.
  4. blocked on a real pane → summons unchanged except the title's WHO.
  No mocks, no stubs, no fake pane ids. Real toasts will appear on the
  operator's screen during (2) and (4) — that is the point; keep the total
  under a handful.
- Commit, staging ONLY the files in your partition:
```
fix(spine): notifications become rare, readable summonses

PHASE: Implement
DONE: <what landed>
TODO: <specific handoff or ->
```
DONE-WHEN: `git log -1 --stat` shows only your partition's files.

## Constraints
- python3 stdlib only. No third-party imports.
- Every operator-facing string: no opaque ids, no truncated fragments.
- No fabrication: content comes from real tokens/screens or is omitted.
- Honor `~/.tower/bridge-exempt` (already implemented — do not weaken it).
- Failures in your new code must degrade to the old behavior, never raise out
  of the handler; the dispatcher treats a crashed handler as a lost event.

## Report back with (exact completion contract)
1. `git log -1 --oneline` + `git diff --stat HEAD~1` for your commit.
2. A short prose diff summary (what the policy now is, in five lines).
3. LIVE EVIDENCE, verbatim: for each of the four runs in T7, the stderr log
   lines and the exact toast title/body (or "no toast" with the suppression
   log line). Blocked = before/after pair.
4. The duration answer with its citation.
5. Deviations from this brief, or "none".
