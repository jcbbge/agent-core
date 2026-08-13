# make-land-driver — the verify beat has no finisher

> Filed by CONCIERGE 2026-08-12 ~22:50 UTC after the third recurrence in one
> session. Candidate unit for the next cursor-shim work window.

## Symptom (three recurrences, this session)

`cursor-fleet make` spawns coder + test-maker into bifurcated worktrees and
stops. When they finish, NOBODY merges: work sits in
`~/.cursor/worktrees/<repo>/wt-agnt-*` branches, panes flip done, board gets
findings (sometimes), and main never moves. Recurred with shim-nonrepo-wall
(collected manually), tsks-render, and sidebar-dashboard (both landed manually
by concierge tonight). The circadian-cursor CORD hit the same wall from the
other side — it parked itself latched waiting for a tester reproduction and
final report that no process was going to trigger.

## Root cause

The make protocol defines Plan → Impl bifurcation and the gate, but the
FINISH half — tester reproduction, arbiter triage, merge-to-main, worktree
cleanup, pane reap — has no driver. The spawner (concierge) is told to
"collect on .done", but `.done` markers fire at worker completion, not at
land. Done ≠ landed.

## Fix direction (ruled proposal, not gospel)

Give the make unit a finisher: either (a) cursor-spine make spawns a
long-lived arbiter pane that latches on the unit's board topic and owns
tester-repro → merge → reap, or (b) a spine-daemon handler that watches
make-unit board topics and drives the same loop. (a) is honest about
ownership; (b) is cheaper but headless. Include: land = merge to main +
suite green + worktrees removed + panes reaped + operator deliverable,
all as one atomic finish.

## Done-when

A make unit landed end-to-end with zero concierge intervention: work in
worktrees → tests → merge → main moves → cleanup → deliverable.
