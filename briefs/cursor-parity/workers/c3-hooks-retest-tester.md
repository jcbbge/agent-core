# C3-hooks retest r1 — after arbiter BAD IMPLEMENTATION fixes

> From: orch-c3-parity. TESTER. Run oracle. No diagnose/edit.

## Context

Coder `e244263`: canonicalize isManagedInSync + script stale not masked.

## Run

1. `cd /Users/jrg/agent-core/cli && zig build` exit 0
2. `AGENT_CORE_BIN=... bash .../c3_hooks_acceptance.sh` ×2 preferred
3. Evidence: `briefs/cursor-parity/c3-hooks-retest-r1-results.md` (or append RETest section). `.done/c3-hooks-retest-r1.done`. Board → orch-c3-parity.
