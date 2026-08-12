# C3-hooks Tester Results — agnt-c3-hooks-tester

**Verdict:** fail  
**Date (UTC):** Wed Aug 12 17:19 UTC 2026  
**Binary:** `/Users/jrg/agent-core/cli/zig-out/bin/agent-core`  
**CLI HEAD:** `78c089f test(hooks): C3 acceptance oracle for cursor hooks.json merge`

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

**Exit code:** 1

| Criterion ID | Result |
|---|---|
| T-C3-HK-MERGE-UPSERT | PASS |
| T-C3-HK-MERGE-UPDATE | PASS |
| T-C3-HK-STATUS-OK | PASS |
| T-C3-HK-STATUS-STALE-MANAGED | PASS |
| T-C3-HK-STATUS-UNMANAGED-OK | **FAIL** |
| T-C3-HK-SCRIPT-DEPLOYED | **FAIL** |
| T-C3-HK-CC-UNCHANGED | PASS |

**Suite summary:** `integration: 5 passed, 2 failed`

**Raw output:**
```
PASS: T-C3-HK-MERGE-UPSERT: managed entry added; unmarked sessionStart preserved
PASS: T-C3-HK-MERGE-UPDATE: second sync repaired managed entry; unmarked preserved
PASS: T-C3-HK-STATUS-OK: hook/slim-guard ok on cursor after sync
PASS: T-C3-HK-STATUS-STALE-MANAGED: corrupt managed command path shows stale
  ? claude-code  /var/folders/fc/v5cb_rpj1vdg60sx65sdrrjr0000gn/T/tmp.4QG5YiYA7n/cc-hooks/slim-guard.sh
  ✗ cursor       /var/folders/fc/v5cb_rpj1vdg60sx65sdrrjr0000gn/T/tmp.4QG5YiYA7n/cursor-hooks/slim-guard.sh + /var/folders/fc/v5cb_rpj1vdg60sx65sdrrjr0000gn/T/tmp.4QG5YiYA7n/cursor-hooks.json [hooks-json]
FAIL: T-C3-HK-STATUS-UNMANAGED-OK: expected ok despite unmarked sessionStart change
expected stale after script tamper
  ? claude-code  /var/folders/fc/v5cb_rpj1vdg60sx65sdrrjr0000gn/T/tmp.sAuiKfLPaR/cc-hooks/slim-guard.sh
  ✓ cursor       /var/folders/fc/v5cb_rpj1vdg60sx65sdrrjr0000gn/T/tmp.sAuiKfLPaR/cursor-hooks/slim-guard.sh + /var/folders/fc/v5cb_rpj1vdg60sx65sdrrjr0000gn/T/tmp.sAuiKfLPaR/cursor-hooks.json [hooks-json]
FAIL: T-C3-HK-SCRIPT-DEPLOYED: script deploy/checksum semantics failed
PASS: T-C3-HK-CC-UNCHANGED: claude-code copy_file to hooks dir unchanged
---
integration: 5 passed, 2 failed
```

## Human-QA checklist

No human-class boxes in the C3-hooks acceptance suite — all criteria are mechanical/automated. Human sign-off items: none to tick.

## Q → arbiter

**Q1 (T-C3-HK-STATUS-UNMANAGED-OK):** After sync, changing unmarked `sessionStart` command to `bash '/tmp/user-changed-herdr.sh' session` — status block shows `✗ cursor` (stale) instead of expected `✓ cursor` (ok). See status block in raw output above.

**Q2 (T-C3-HK-SCRIPT-DEPLOYED):** After appending `# tamper` to deployed `slim-guard.sh`, status did not show stale (`✗ cursor`) as expected; re-sync path also failed checksum/tamper semantics. See raw output above.

## Code/tests touched

none
