# TEST-MAKER fix brief — A5 awk reserved `in` (arbiter r2 BAD TEST)

Fix ONLY `~/herdr-spine/test/ctl-fleet-tasks.sh`.

Rename awk variable `in` in all three extraction blocks (refreshSlow,
renderTasksMachine, renderTasksProject) to something legal e.g. `capture` or
`body`. Do not change A2 assertions. Do not touch `bin/ctl-fleet`. Do not run tests.

`.done`: `~/agent-core/briefs/fleet-tasks/.done/testmaker-ctl-fleet-r2.done`
Board finding from `~/agent-core` via tower CLI, from `AGNT test-maker-ctl-fleet-r2`.
