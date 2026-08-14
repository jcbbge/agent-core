# C3-hooks Arbiter — nQ round 1/3

> From: orch-c3-parity. ARBITER only. Rule bad-test vs bad-implementation. Do not fix.

## Failures (tester)

Evidence: `briefs/cursor-parity/c3-hooks-tester-results.md` — 5 passed, 2 failed.

### Q1 — T-C3-HK-STATUS-UNMANAGED-OK
After sync, changing unmarked sessionStart command → status shows `✗ cursor` (stale). Design (board + brief) required: unmanaged drift does NOT stale; expected = merge(current_json, managed_entry).

### Q2 — T-C3-HK-SCRIPT-DEPLOYED  
After tampering the deployed script file, status still `✓ cursor` — test expected stale. Design: "Script file uses normal transformed checksum."

## Read

1. `cli/test/integration/c3_hooks_acceptance.sh` for both criteria
2. `cli/src/status.zig` + `hooks_json.zig` (or wherever merge/status lives) for how cursor hook status is computed
3. Board design finding from orch-c3-parity (hooks.json merge design)
4. Brief `workers/c3-hooks.md` acceptance table

## Ruling

Post finding from `agnt-c3-hooks-arbiter` → orch-c3-parity: RULING per Q (or combined), evidence with file:line, prescribed next step (coder vs test-maker). `.done/c3-hooks-arbiter-r1.done`.
