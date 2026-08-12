# TESTER brief — ctl-fleet TASKS (U3 Verify)

You are the Tester (Aldebaran). Run the suite; do not edit code or tests.

## Context

- Repo: `~/herdr-spine` (MAIN checkout — implementation + tests already integrated, UNCOMMITTED)
- Suite: `bash test/ctl-fleet-tasks.sh`
- Human QA artifact (do NOT tick): `test/qa/ctl-fleet-tasks-human.md`
- Shared plan (for criterion names only): `~/agent-core/briefs/fleet-tasks/make/ctl-fleet-tasks.md`

## Run exactly

```bash
cd /Users/jrg/herdr-spine
bash test/ctl-fleet-tasks.sh
```

Capture full stdout/stderr and exit code.

## Report

- On pass: board finding on topic `agent-core/fleet-tasks` via CLI from agent-core cwd:
  `cd ~/agent-core && bun ~/.tower/cli.mjs post finding "agent-core/fleet-tasks" "<body>" --from "AGNT tester-ctl-fleet"`
  Body must include: PASS, command, Results line, note that A6 human box is unticked.
- On fail: same board finding with FAIL + failing criterion ids + verbatim failing output tail; this is a Q for the arbiter — do not diagnose or fix.
- Write `.done` at `~/agent-core/briefs/fleet-tasks/.done/tester-ctl-fleet.done` with command, exit code, pass/fail counts, and path to any saved log under `/tmp` if you write one.

Hard rules: never edit `bin/ctl-fleet`, never edit `test/**`, never tick human-class boxes.
