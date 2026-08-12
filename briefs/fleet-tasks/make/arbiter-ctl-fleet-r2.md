# ARBITER brief — ctl-fleet TASKS Verify Q (nQ round 2/3)

You are the Arbiter. Exactly ONE ruling. Do not fix anything.

## Prior
- r1: BAD TEST → test-maker fixed CAPTURE_DUMP_RC subshell + attempted A5 awk
- Retest r1: 5 pass / 2 fail — `.done` `~/agent-core/briefs/fleet-tasks/.done/tester-ctl-fleet-r1.done`
  Log: `/tmp/tester-ctl-fleet-r1-20260812-123849.log`

## Remaining failures

### A5 — awk syntax error
Test-maker used `in` as an awk variable (`{ in=1; ... }`). On macOS awk,
`in` is reserved → `syntax error`. Extraction never runs; criterion falsely fails.
Implementation still has `loadTasksStore()` as first line of `refreshSlow`
(`bin/ctl-fleet` ~380). This is a residual harness bug from the r1 BAD TEST fix.

### A2 — unit line label
Dump works now. Assertion expects:
`ORCH fleet-task-cli  ◐ Drafting the CLI core`
Actual render (verified):
`ORCH fleet-task  ◐ Drafting the CLI core`
Plan/spec: unit line is `ORCH <unit title>` (title in fixture = `fleet-task-cli`).
Implementation `unitLabel()` prefers `owner_agent` slug (`orch-fleet-task` →
`fleet-task`) over `unit.title`. This matches the r1 watch item.

## Plan cite
`~/agent-core/briefs/fleet-tasks/make/ctl-fleet-tasks.md` — unit line uses unit title.
ORCH brief render spec: `ORCH <unit title>`.

## Pick ONE ruling
If you choose BAD TEST → route test-maker (rename awk var; leave A2 for next).
If you choose BAD IMPLEMENTATION → route coder (unitLabel → prefer `unit.title`).
If both feel equally load-bearing, prefer the ruling that unmutes the oracle first
OR the clear product defect — state why in one sentence.

Post finding:
`cd ~/agent-core && bun ~/.tower/cli.mjs post finding "agent-core/fleet-tasks" "<ruling>" --from "AGNT arbiter-ctl-fleet-r2"`

`.done`: `~/agent-core/briefs/fleet-tasks/.done/arbiter-ctl-fleet-r2.done`
(ruling, rationale, route, nQ=2/3)
