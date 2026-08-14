# C3-hooks Retest r1 Results — agnt-c3-hooks-retest-tester

**Verdict:** pass  
**Date (UTC):** Wed Aug 12 17:25 UTC 2026  
**Binary:** `/Users/jrg/agent-core/cli/zig-out/bin/agent-core`  
**CLI HEAD:** `e244263 fix(hooks): arbiter r1 — canonical compare + script stale in status`

## Build

```
cd /Users/jrg/agent-core/cli && zig build
exit 0
```

## Run — authoritative (fixture oracle)

**Command:**
```
AGENT_CORE_BIN=/Users/jrg/agent-core/cli/zig-out/bin/agent-core bash /Users/jrg/agent-core/cli/test/integration/c3_hooks_acceptance.sh
```

### Run 1

**Exit code:** 0

| Criterion ID | Result |
|---|---|
| T-C3-HK-MERGE-UPSERT | PASS |
| T-C3-HK-MERGE-UPDATE | PASS |
| T-C3-HK-STATUS-OK | PASS |
| T-C3-HK-STATUS-STALE-MANAGED | PASS |
| T-C3-HK-STATUS-UNMANAGED-OK | PASS |
| T-C3-HK-SCRIPT-DEPLOYED | PASS |
| T-C3-HK-CC-UNCHANGED | PASS |

**Suite summary:** `integration: 7 passed, 0 failed`

**Raw output:**
```
PASS: T-C3-HK-MERGE-UPSERT: managed entry added; unmarked sessionStart preserved
PASS: T-C3-HK-MERGE-UPDATE: second sync repaired managed entry; unmarked preserved
PASS: T-C3-HK-STATUS-OK: hook/slim-guard ok on cursor after sync
PASS: T-C3-HK-STATUS-STALE-MANAGED: corrupt managed command path shows stale
PASS: T-C3-HK-STATUS-UNMANAGED-OK: unmarked sessionStart drift does not stale cursor
PASS: T-C3-HK-SCRIPT-DEPLOYED: script at hooks dir; status ok proves port digest match
PASS: T-C3-HK-CC-UNCHANGED: claude-code copy_file to hooks dir unchanged
---
integration: 7 passed, 0 failed
```

### Run 2 (confirmatory)

**Exit code:** 0

**Suite summary:** `integration: 7 passed, 0 failed`

**Raw output:**
```
PASS: T-C3-HK-MERGE-UPSERT: managed entry added; unmarked sessionStart preserved
PASS: T-C3-HK-MERGE-UPDATE: second sync repaired managed entry; unmarked preserved
PASS: T-C3-HK-STATUS-OK: hook/slim-guard ok on cursor after sync
PASS: T-C3-HK-STATUS-STALE-MANAGED: corrupt managed command path shows stale
PASS: T-C3-HK-STATUS-UNMANAGED-OK: unmarked sessionStart drift does not stale cursor
PASS: T-C3-HK-SCRIPT-DEPLOYED: script at hooks dir; status ok proves port digest match
PASS: T-C3-HK-CC-UNCHANGED: claude-code copy_file to hooks dir unchanged
---
integration: 7 passed, 0 failed
```

## Human-QA checklist

No human-class boxes in the C3-hooks acceptance suite — all criteria are mechanical/automated. Human sign-off items: none to tick.

## Q → arbiter

none (all criteria green)

## Code/tests touched

none
