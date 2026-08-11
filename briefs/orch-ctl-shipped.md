# Brief: ORCH ctl-shipped — git change signal in the CTRL panes
Date: 2026-08-10
Status: ready

## What This Is
Operator saw the eng-manager diff view in the session rollup document and
wants it AS A LIVE SIGNAL in the CTRL fleet pane. Spec is codified:
~/agent-core/primitives/rules/control-flow.md §CTRL SHIPPED section. You are
an ORCHESTRATOR (control-flow doctrine): one sonnet AGNT (single-file
partition), stamped name at birth, verify with your own eyes, reap, report.
You never implement.

## Pre-Verified Facts (coordinator, 2026-08-10)
- File: ~/herdr-spine/bin/ctl-fleet (464 lines; owner: FREE — ctl-tweaks and
  ctl-planes both landed and are reaped). Docs: ~/herdr-spine/docs/ctl-fleet.md.
- Workspace→repo mapping already exists in ctl-fleet (it resolves project
  cwds for the WORK section); git is available in every relevant repo
  (future, herdr-spine, agent-core, circadian).
- `git log --since=24.hours --stat --format=...` is cheap; run it at refresh
  intervals, NOT per-event (git polling every event would be wasteful — a
  60s cache is fine and should be stated in the doc).
- Repos may be dirty: `git status --porcelain` count → `pending: N files`.
- Line budget: ctl-fleet may grow to 560 lines. Zero deps, zero services.
- Display rules (binding, from the codified spec): machine plane = rollup +
  sha·subject lines, cap ~5 commits/project; project plane adds per-commit
  one-line file summaries (`path +a −b`); NEVER raw diffs or code; honest
  `pending` for uncommitted tracked changes; repos with no commits in the
  window show nothing (silence over noise).

## Finishing Point
Both CTRL planes render the SHIPPED block live per spec; docs updated
(including the cache interval); the running CTRL panes respawned through
their own spawn path to pick it up.

## How We'll Know It's Done
- [ ] Live capture: machine CTRL showing SHIPPED for at least herdr-spine
      (9+ commits today) and agent-core, with correct +X −Y rollups matching
      `git log --stat` ground truth (verify numbers yourself against git)
- [ ] Project plane capture with file summaries
- [ ] Dirty-repo `pending:` line proven against a repo with uncommitted files
      (herdr-spine currently has 2 modified tracked files — use it)
- [ ] Worker reaped; board post topic herdr-spine/ctl-shipped with evidence

## Report back with (exact completion contract)
Board post topic herdr-spine/ctl-shipped: diff summary, line count, the two
captures, ground-truth check result, deviations or "none".
