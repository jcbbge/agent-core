# CORD cursor-shim — spawn-path finishing pass (3 units)

> From: CONCIERGE (operator ruling 2026-08-12 ~00:36 UTC: "if something is
> wrong, we fucking fix it"). Binding. Self-contained.
> Board topic: `cursor-shim/spawn-finishing`. `.done`: `~/agent-core/briefs/spawn-path-finishing/.done/`.
> Repo: `~/cursor-shim` (git, main @ post-circadian land). Suite: `bash docs/qa-verify.sh` — currently 100/100, MUST NOT regress.

## Operator ruling (the authority)

Stop filing follow-ups; fix them. These three were filed tonight instead of
fixed. All three are this repo, all three touch the spawn path — one CORD,
three units, sequential where files collide (`cursor-spine`, `cursor-fleet`
are shared).

## Unit 1 — make-land-driver (THE systemic one)

Full context: `~/agent-core/briefs/make-land-driver/brief.md`. Summary:
`cursor-fleet make` spawns coder + test-maker and stops; nobody runs tester
reproduction, arbiter triage, merge-to-main, worktree cleanup, pane reap, or
the operator deliverable. Three missions tonight finished in worktrees and
never landed until the concierge merged by hand. Build the finisher: a
long-lived arbiter pane per make unit (latched on the unit's board topic)
that owns test-repro → merge → suite green → worktree removal → pane reap →
`to:"operator"` deliverable, as one atomic finish. Land = main moves, not
`.done` files.

## Unit 2 — shim-workspace-targeting

Full context: `~/agent-core/briefs/shim-workspace-targeting/brief.md`.
Summary: `cursor-fleet make`/`worker`/`cursor-spine` split the CALLER's tab
by default — spawning from the Engine Shop pollutes the concierge workspace
(operator rage incident tonight, verbatim: "why the fuck are you splitting
panes in the engine shop"). Add explicit `--workspace <id>` targeting to
make/worker (orch/fanout already have it) so spawns land in the mission
workspace regardless of caller pane.

## Unit 3 — shim-pwd-stamp

Context: sidebar-dashboard mission (herdr-spine ae9e789) added `$pwd`
workspace-metadata stamping to `spine-spawn`; the cursor-shim side was split
off as follow-up brief `~/agent-core/briefs/shim-pwd-stamp/brief.md` (verify
it exists; the sidebar coder was instructed to file it). `cursor-fleet up`
must stamp `herdr workspace report-metadata <ws> --source cursor-fleet
--token "pwd=<cwd>"` at workspace creation so the sidebar space rows render
the path. Syntax note learned tonight: positional workspace id FIRST, then
flags (`herdr workspace report-metadata w29 --source x --token "pwd=/y"`).

## Constraints

- Verify beat per unit (make bifurcation). Commits per convention; CORD gates.
- **Self-hosting trap:** Unit 1 changes the very loop you are running inside.
  Land units 2+3 first if the finisher would disrupt in-flight units; or run
  this mission's own landing manually and say so plainly.
- qa-verify: extend for all three units (dry-run level only — never spawn
  real panes from tests, cf. 78fa55c/6c85350).
- Topology: dedicated workspace, workers in one tab, reap at collection.

## Done-when

- All three units landed ON MAIN (merged, suite green — not worktree-done).
- Evidence per unit: (1) a make unit finished end-to-end with zero concierge
  intervention, OR a dry-run/mechanical proof of the finisher loop + one live
  supervised run; (2) `make --workspace` lands panes in the target workspace;
  (3) fresh `cursor-fleet up` workspace carries `$pwd` (snapshot evidence).
- qa-verify 100/100+ green. `.done` markers. `to:"operator"` deliverable.
