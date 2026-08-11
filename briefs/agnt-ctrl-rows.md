# Brief: AGNT ctrl-rows — two-line CTRL rows, real human names, honest telemetry
Date: 2026-08-10
Status: ready
Parent: ORCH ctl-tweaks (pane w1A:pF) · brief ~/agent-core/briefs/och-ctl-tweaks.md
Authority: ~/agent-core/primitives/rules/control-flow.md — read §"Prefix
renames + CTRL-pane UX" and §"CTRL-pane row enrichment" (the last two
sections). The rule is the law; this brief is the execution.

## What This Is

`bin/ctl-fleet` just landed its 10X row pass (commit `8f5343a`, file is now
exactly 300 lines). The operator has extended it: rows become TWO LINES, and
carry cheap telemetry. You also fix the one thing the first pass got wrong.

## Your partition — the ONLY files you may write

- `/Users/jrg/herdr-spine/bin/ctl-fleet` (300 lines today, cap now **340**)
- `/Users/jrg/herdr-spine/docs/ctl-fleet.md`

Nothing else. No other repo, no `/Users/jrg/future`, no
`/Users/jrg/.herdr/worktrees/`, no `~/.tower/`. Other fleets are live in all
of those. Read whatever you need; write only these two files.

Read `bin/ctl-fleet` end to end before you touch it — a sibling agent wrote
the current version an hour ago and its structure is the starting point, not
something to redo.

## Pre-Verified Facts (verified live by your parent, 2026-08-10 — do not re-derive)

### The live CTRL pane
- `w1A:pN`, label `CTRL fleet`, in tab `w1A:t1` beside `CORD future`
  (`w1A:p1`, focused — untouchable, focus must survive your work).
- Spawn path already exists in the file: `bun bin/ctl-fleet --spawn [ws]`.
  Use it to restart CTRL after your change; do NOT hand-place a pane.
- Its render right now (`herdr pane read w1A:pN --source visible`), verbatim:
```
3● 0◐ 7✓  ·  12 agents  ·  updated 15:54:31

future
  ● ORCH ctl-tweaks                    running cd ~/herdr-spine
  ● ORCH notif-ux                      done: You are ORCH notif-ux. Read and exe…
    ● AGNT running export PATH=~/.rust…  running export PATH=~/.rustup/toolchai…
○ CORD future                        Dispatched (verified). What the enriched r…
  ✓ ORCH All five items                All five items are implemented, committe…
    ○ AGNT Both tasks are                Both tasks are complete and reported pe…
    ✓ AGNT Done. Wrote .madewell/specs…  Done. Wrote .madewell/specs/2026-08-10-…
```

### THE DEFECT you are fixing (read this twice)
For panes the spawner never stamped with a title, the current code derives
the "human work name" from the SAME activity text it then prints in the
activity column. Result: `AGNT Both tasks are`, `ORCH All five items`,
`AGNT running export PATH=~/.rust…` — the name is a sentence fragment, and
it duplicates the column beside it. Under the new two-line row that becomes
line 1 and line 2 saying the same thing. That is the opposite of
"memorable and lovable".

The real human name exists on disk. Made Well items carry it (verified in
`/Users/jrg/future/.madewell/cycles/c004.json`): each `imagine[]` entry is
`{"id": "i005", "item": "Client scroll UI (d016): scroll offset state for the
focused pane, keybindings …"}`. The leading clause of `item` — up to the
first `:` or ` (` — IS the human name: `Client scroll UI`,
`Unmissable focus indication`, `Focus model made explicit`.

So the name resolution ladder becomes:
1. A title/name the spawner stamped at birth (`tokens`/`display_agent`/
   `label` minus role prefix) — unchanged, still first.
2. If what remains looks like a raw item id (`c004-i005`, `c004-td-i005`,
   `i003`): look that id up in the pane's project `.madewell/cycles/*.json`
   `imagine[]` and use the leading clause of `item`, trimmed to fit.
   Read those files on the SLOW tick (the existing 5s snapshot timer) and
   cache by file mtime — never per render, never on the 250ms path.
   The project root is the pane's `cwd`; worktree cwds
   (`/Users/jrg/.herdr/worktrees/future/c004-ux`) have their own `.madewell`.
   Read-only. Never write into `.madewell`.
3. Only if BOTH fail: fall back to a short activity-derived headline as
   today — but cap it hard and never let it be the whole first line's width.

### Two-line row (§"CTRL-pane row enrichment")
- Line 1 = identity: status glyph · role prefix · human work name (+ the
  telemetry you land, see below).
- Line 2 = underneath, indented under line 1: the current operation/status —
  the live activity text, humanized by the rules already in the file (ANSI
  strip, spinner/notification-fragment strip, verb phrasing, clean `…` cap).
- Keep: project grouping, rank indent, live-above-done ordering, the header
  summary, `-- reconnecting --`, and the whole socket/snapshot architecture.
  This is presentation only.
- The pane is ~60 rows tall and shows 12 agents today; two lines per agent
  must still fit without the header scrolling off. If it can't, prefer
  dropping the blank line between project groups over dropping information.

### Telemetry — what is actually available (I checked; these are the facts)

**DURATION — pane birth is NOT in herdr.** Verified: `herdr api snapshot`
exposes exactly these pane keys — `agent`, `agent_session`, `agent_status`,
`cwd`, `focused`, `foreground_cwd`, `label`, `pane_id`, `revision`, `scroll`,
`tab_id`, `terminal_id`, `terminal_title`, `terminal_title_stripped`,
`tokens`, `workspace_id`. No timestamp of any kind, on panes or on
`snapshot.agents`. Do not go looking for one.

Two real sources, in order of quality:

1. **The Claude session transcript** (best; verified live).
   `p.agent_session.value` is a session UUID, e.g. `w1A:pG` →
   `46c12c4d-40f9-462f-998c-0389318d09ba`, and the transcript is
   `~/.claude/projects/<cwd-slug>/<uuid>.jsonl` — verified present for two
   live panes. The slug is the cwd with `/`→`-`
   (`/Users/jrg/herdr-spine` → `-Users-jrg-herdr-spine`), but a glob over
   `~/.claude/projects/*/<uuid>.jsonl` is the safe lookup (verified).
   - START TIME: the FIRST record often has no `timestamp` (it is a
     `{leafUuid, sessionId, type}` header — verified). Scan for the first
     record that HAS `timestamp` (ISO 8601). That is session start →
     duration = now − start. It never changes: read once per session id and
     cache forever.
   - TOKENS: assistant records carry `message.usage`. Verified totals on one
     live 525-line transcript: `{input_tokens: 358,
     cache_creation_input_tokens: 404045, cache_read_input_tokens: 24461975,
     output_tokens: 196368}`. Summing requires a full file scan — 525 lines
     today and growing. That is NOT free. Acceptable: on the 5s tick at
     most, or incrementally from a remembered byte offset, or not at all.
     Your call within budget — but if you land it, land it honestly.
   - `agent_session.source` is `herdr:claude` for Claude panes. Panes from
     other harnesses (pi, codex, …) were NOT investigated — for them, show
     nothing and say so in the docs. Do not invent a parser you can't test.

2. **Board CLAIM rows** (weaker; verified). `~/.tower/board.jsonl`, 2690
   parseable rows (26 malformed — parse tolerantly, skip bad lines), of
   which 114 are `type: "claim"` with an ISO `ts`. The pane id appears only
   inside free-text `body` (`"CLAIM test design i005 — pane w1C:p9 — writes
   …"`), and some claims say `pane (agent, no herdr pane id assigned)`.
   Usable as a fallback via a `pane (w\d+:\w+)` regex; not authoritative.
   Read-only — CTRL never writes to the board.

**Rules for all of it**: never fabricate a number; show nothing rather than
a guess; a missing source is a blank column, not a zero. If a source turns
out to cost more than it's worth, document it in `docs/ctl-fleet.md` as
investigated-and-not-available and move on. Do not overbuild — this is a
status pane, not a metrics pipeline.

## Done when

- `bin/ctl-fleet` ≤ **340** lines (`wc -l`).
- CTRL restarted via its own `--spawn` path; `herdr pane list` shows it in
  `w1A:t1`, and `CORD future` (`w1A:p1`) is still there and still
  `"focused":true` (capture before AND after).
- `herdr pane read <new CTRL pane> --source visible` shows: two-line rows,
  NO pane/tab ids, NO sentence-fragment names for the live `c004-*` workers
  (they must read as real item titles pulled from `.madewell`, e.g.
  `AGNT Client scroll UI`), and whatever telemetry you landed.
- `docs/ctl-fleet.md` describes the two-line row, the name-resolution ladder
  including the `.madewell` lookup, and exactly which telemetry is available
  from which source — including what you investigated and rejected, and why.
- One commit in `~/herdr-spine`, staging ONLY your two files (`git add -A`
  is banned — the repo has unrelated dirty files from other agents):
  ```
  feat(spine): <summary>

  PHASE: Implement
  DONE: <what landed>
  TODO: <handoff, or —>
  ```

## Epistemics

Every fact you state comes from a file you read, a command you ran, or this
brief. Token and duration numbers must come from a file you parsed — if you
cannot parse it, print nothing and say so. If a step can't be done as
written, stop and report what you saw rather than improvising around an
operator rule.

## Report back with (exact completion contract)

One message in your pane, nothing else:
1. `wc -l bin/ctl-fleet` before → after (cap 340).
2. 12-16 lines of `herdr pane read <CTRL pane> --source visible` — the live
   proof of two-line rows, real names, and telemetry.
3. The `herdr pane list` line for `CORD future` before and after.
4. Which telemetry you landed, from which source, and what you rejected as
   too costly or unavailable.
5. The commit SHA.
6. Anything you could not do, stated plainly.

Then stop. Do not start new work. Your parent reaps your pane.
