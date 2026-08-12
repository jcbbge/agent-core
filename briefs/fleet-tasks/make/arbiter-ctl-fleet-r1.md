# ARBITER brief — ctl-fleet TASKS Verify Q (nQ round 1/3)

You are the Arbiter (Polaris). Render exactly ONE ruling. Do not fix code or tests.

## Unit
ctl-fleet-tasks (U3). Plan: `~/agent-core/briefs/fleet-tasks/make/ctl-fleet-tasks.md`

## Failure evidence (reproduced)

Tester `.done`: `~/agent-core/briefs/fleet-tasks/.done/tester-ctl-fleet.done`
Log: `/tmp/tester-ctl-fleet-20260812-121659.log`

```
PASS: A4
FAIL: A5: tasks store load must be reachable from refreshSlow
FAIL: A1a/A1b/A1c/A2/A3: dump must exit 0 (rc=1)  [or store must not non-zero]
Results: 1 passed, 6 failed
```

ORCH re-ran `bash test/ctl-fleet-tasks.sh` in `~/herdr-spine` — same results.

## Facts acquired this session (use these)

1. Host bash is **3.2.57** (`bash --version`). Under `set -u`, `"${extra[@]}"` on an
   empty `local -a extra=()` errors: `extra[@]: unbound variable`. The suite's
   `run_dump` expands `"${extra[@]}"` for machine-plane (no args) → rc=1 with
   empty stdout — before ctl-fleet runs. Explains A1a/b/c and A2 dump rc=1.

2. Direct dump works: `FLEET_TASKS_STORE=test/fixtures/fleet-tasks/two-projects.json
   CTL_FLEET_DUMP=1 bun bin/ctl-fleet` → exit 0 and prints a TASKS block.

3. A5 awk extracts `refreshSlow` with range `/function refreshSlow/,/^function/`.
   On bash/awk, the start line itself matches `^function`, so the range ends on
   line 1; `slow_body` is only the signature — never sees `loadTasksStore();`
   which IS the first statement inside `refreshSlow` in `bin/ctl-fleet`.

4. Secondary (not yet asserted by green dump path): unit line uses
   `owner_agent` slug (`ORCH fleet-task`) not unit `title` (`ORCH fleet-task-cli`)
   per plan/fixture. Defer to a later round if still red after suite fix.

## Your job

Pick exactly one: BAD TEST | BAD IMPLEMENTATION | PRE-EXISTING/OUT-OF-SCOPE.
Write rationale (one paragraph). Route to test-maker / coder / human.

Post finding via:
`cd ~/agent-core && bun ~/.tower/cli.mjs post finding "agent-core/fleet-tasks" "<ruling>" --from "AGNT arbiter-ctl-fleet"`

Write `.done` at `~/agent-core/briefs/fleet-tasks/.done/arbiter-ctl-fleet-r1.done`
containing: ruling, rationale, route, nQ=1/3.
