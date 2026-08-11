# Brief: AGNT statem-names — glyph-only tab titles + the prefix rename pass
Date: 2026-08-10
Status: ready
Parent: ORCH ctl-tweaks (pane w1A:pF) · brief ~/agent-core/briefs/och-ctl-tweaks.md
Authority: ~/agent-core/primitives/rules/control-flow.md §Observability and
§"Prefix renames + CTRL-pane UX" — READ IT FIRST (95 lines). The rule is the
law; this brief is only the execution plan.

## What This Is

Two operator-mandated changes to the Made Well state tracker and its viewer:
1. Tab titles are **GLYPHS ONLY** — no phase words, no agent text, no task
   text. `OCH c004-ux ▰▰▱▱ Make ●2◐3` → `ORCH c004-ux ▰▰▱▱ ●2◐3`.
2. The **prefix rename** pass across everything you own, plus the live
   restamps that belong to your files.

## Your partition — the ONLY files you may write

- `/Users/jrg/agent-core/primitives/tools/statem/statem.ts` (164 lines)
- `/Users/jrg/agent-core/primitives/tools/statem/twr.ts` (91 lines)
- `/Users/jrg/agent-core/primitives/tools/statem/README.md`

A sibling worker, **AGNT ctrl-pane**, is editing `~/herdr-spine/bin/ctl-fleet`
and `~/herdr-spine/docs/{ctl-fleet,spawn}.md` in PARALLEL right now. Do not
touch `~/herdr-spine` — not even to read-and-fix. Do not touch
`/Users/jrg/future` or `/Users/jrg/.herdr/worktrees/` (another orchestrator's
fleet is live in there). Do not write anything under `~/.tower/`.

## Pre-Verified Facts (verified live by your parent, 2026-08-10)

### statem — exact shape of the glyphs-only change
- `statem.ts:101` defines `const cap = (s) => ...`, used in exactly two
  places, both inside `renameTabs()`:
  - `:114` `extra = [glyphs(state.outer, OUTER), cap(state.outer)];`
  - `:118` `extra = [glyphs(c.phase, INNER), cap(c.phase)];`
  Drop both `cap(...)` elements and delete the now-unused `cap` definition
  (verified: `grep -n 'cap(' statem.ts` → those 3 hits and nothing else).
  The `●done◐remaining` element at `:121` STAYS. `glyphs()` STAYS.
- `renameTabs()` runs ONLY when a poll yields ≥1 transition (`:149`), and a
  cold start (no baseline file) seeds silently with zero transitions — so a
  plain fresh run will NOT stamp anything. See Task 1 for how to drive it.
- Live Made Well state of `/Users/jrg/future` right now (verified by running
  `bun statem.ts /Users/jrg/future --once --no-tabs` with scratch paths):
  `{"outer":"build","cycles":{"c004":{"phase":"make","items":{"i001":"done","i002":"done","i003":"pending","i004":"done","i005":"pending"}}}}`
  → 3 done of 5 → counts render `●3◐2`; `glyphs("make", INNER)` → `▰▰▰▱`.
- `~/.tower/statem-tabs.json` holds `"/Users/jrg/future": []` — EMPTY — and
  NO statem process is running anywhere (`ps aux | grep statem` → none). So
  every live glyph title on this machine was stamped by hand.

### Live tabs (from `herdr tab list`, one JSON line, `.result.tabs`)
- `w1A:tB` — label `OCH c004-ux ▰▰▱▱ Make ●2` ← the one currently-stamped
  tab; your BEFORE evidence. Its pane holds a LIVE orchestrator: rename the
  TAB only, never touch the pane.
- `w1B:tK` — label `TWR future` ← the Tower tab that must become
  `TOWR future`.
- All other tabs are other agents' — leave them alone.

### Prefix set (operator, 2026-08-10, incl. the `CRD→CORD` correction)
`CORD · ORCH · AGNT · SAGT · CTRL · TOWR`; lowercase registration forms
`orch-`, `agnt-`, `sagt-`. Old → new: `CRD→CORD`, `OCH→ORCH`, `AGT→AGNT`,
`SUB→SAGT`, `CTL→CTRL`, `TWR→TOWR`. The coordinator pane is already
restamped live to `CORD future` (verified).

### Old prefixes in your files (verified by grep)
- `twr.ts:51` — ``const head = `TWR ${name}` ``
- `README.md:38` — ``Example rendered label: `OCH c004-ux ▰▰▱▱ Plan ●2◐3`.``
  (carries BOTH an old prefix and the banned phase word)
- `README.md:45` — ``ONE `TWR [project]` pane per project workspace``
- `README.md:70` — ``### Spawn recipe — `TWR future` pane …``
- `README.md:78` — ``herdr tab create … --label 'TWR future' …``
- `README.md:92` — ``its CLI is owned by AGT statem-core.``

### herdr CLI (verified this session)
`herdr tab list` · `herdr tab rename <TAB_ID> <LABEL>...` ·
`herdr pane list`. Both list commands emit one JSON line.

## Tasks

### Task 1 — glyphs only, proven through the real code path

Make the `statem.ts` change above. Then prove it with the CODE, not with a
hand-typed rename:

1. Capture BEFORE: `herdr tab list` → the `w1A:tB` label, verbatim.
2. Write a scratch tabs config in YOUR scratch dir (NOT `~/.tower/`):
   `{"/Users/jrg/future":[{"tab_id":"w1A:tB","label":"ORCH c004-ux","cycle":"c004"}]}`
   (note: the base label carries the NEW prefix — that is part of the rename
   pass, and the base label is the only alphabetic text a title may contain).
3. Write a scratch baseline that differs from live state so a transition
   fires — e.g. the live JSON above with `"phase":"plan"`.
4. Run once against scratch paths so nothing real is polluted:
   `bun statem.ts /Users/jrg/future --once --tabs <scratch tabs> --baseline <scratch baseline> --board <scratch board.jsonl>`
   It must log the `plan→make` transition and stamp the tab.
5. Capture AFTER: `herdr tab list` → the new `w1A:tB` label.

**Done when**:
- The AFTER label contains NO alphabetic text beyond the base label
  `ORCH c004-ux` — expected `ORCH c004-ux ▰▰▰▱ ●3◐2`. Verify mechanically:
  strip the base label; assert the remainder matches `^[\s▰▱●◐0-9]*$`.
- `~/.tower/board.jsonl`, `~/.tower/statem-tabs.json` and any
  `~/.tower/statem-*.json` are BYTE-UNCHANGED (compare `md5` before/after) —
  your run used scratch paths only.
- You did NOT populate `~/.tower/statem-tabs.json`. Live tab ids are the
  orchestrator's call, not yours.

### Task 2 — prefix rename pass

- `twr.ts:51`: `TWR` → `TOWR`. Check the rest of the file for any other
  prefix or width assumption that depends on that string.
- `README.md`: every hit listed above — `TWR`→`TOWR` (lines 45, 70, 78),
  `AGT`→`AGNT` (line 92), and line 38's example becomes the post-change
  truth: ``ORCH c004-ux ▰▰▰▱ ●3◐2`` (new prefix, NO phase word). If the
  README describes the label format in prose, make the prose say
  glyphs-only too.
- `statem.ts`: check for any prefix in comments/strings and update.
- Verify: `grep -nE '\b(CRD|CTL|TWR|OCH|AGT|SUB)\b|och-|agt-|sub-'` over your
  three files → zero hits.
- Live restamp: `herdr tab rename w1B:tK TOWR future` (the `TWR future` tab).
  Confirm with `herdr tab list`. Rename the TAB only; touch no pane.

### Task 3 — budget, commit

- Line budget: `statem.ts` net growth **≤ +15 lines** (the `cap` removal is
  net-negative, so this is easy). `twr.ts` is a rename — no growth. Report
  `wc -l` before → after for both.
- Commit in `~/agent-core` ONLY, staging ONLY your three files (`git add -A`
  is banned — the repo has a large unrelated dirty tree from other work).
  Format from `~/.claude/CLAUDE.md`:
  ```
  fix(statem): <summary>

  PHASE: Implement
  DONE: <what landed>
  TODO: <handoff, or —>
  ```

## Epistemics

Every fact you state comes from a file you read, a command you ran, or this
brief. If the live state has moved since this brief was written (another
fleet is actively changing `/Users/jrg/future/.madewell/`), report what you
actually observed and adapt the expected title — do not paste an expected
value you did not see. If a step can't be done as written, stop and report
rather than improvising around an operator rule.

## Report back with (exact completion contract)

One message in your pane, nothing else:
1. `wc -l` before → after for `statem.ts` and `twr.ts` (statem net ≤ +15).
2. The BEFORE and AFTER `w1A:tB` labels, verbatim, plus the exact command
   that produced the AFTER one.
3. The BEFORE/AFTER `w1B:tK` labels.
4. The `md5` before/after for the `~/.tower/` files you promised not to touch.
5. The `grep -nE '\b(CRD|CTL|TWR|OCH|AGT|SUB)\b'` result over your files.
6. The commit SHA.
7. Anything you could not do, stated plainly.

Then stop. Do not start new work. Your parent reaps your pane.
