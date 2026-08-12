# CODER fix brief — unitLabel prefers unit.title (arbiter r3 BAD IMPLEMENTATION)

You are the Implementer. Fix code only. Do not write/run/edit tests.

## Fix
In `~/herdr-spine/bin/ctl-fleet`, change `unitLabel()` so it prefers
`unit.title` (non-empty string), then fallback owner_agent slug, then `unit.id`.

Plan golden: unit line is `ORCH <unit title>` e.g. `ORCH fleet-task-cli  ◐ …`.

Touch ONLY `bin/ctl-fleet`. Do not commit. Do not run the test suite.

Work in MAIN checkout `~/herdr-spine` (or your worktree if spawned with one —
then ORCH will copy). Prefer editing the main file path given.

`.done`: `~/agent-core/briefs/fleet-tasks/.done/coder-ctl-fleet-r3.done`
Board finding from `~/agent-core`, from `AGNT coder-ctl-fleet-r3`.
