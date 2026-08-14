# C2 Tester Results — agnt-c2-tester

**Verdict:** fail  
**Date (UTC):** Wed Aug 12 16:40:58 UTC 2026  
**Binary:** `/Users/jrg/agent-core/cli/zig-out/bin/agent-core`  
**CLI HEAD:** `b126d56 feat(directive): compose core+delta at deploy for directive/core`

## Build

```
cd /Users/jrg/agent-core/cli && zig build
exit 0
```

## Run 1 — coder worktree (authoritative; factored primitives)

**Command:**
```
AGENT_CORE_BIN=/Users/jrg/agent-core/cli/zig-out/bin/agent-core bash /Users/jrg/.cursor/worktrees/agent-core/wt-agnt-coder-w2b-p4/cli/test/integration/c2_acceptance.sh
```

**Exit code:** 1

| Criterion ID | Result |
|---|---|
| T-C2-STATUS-OK | PASS |
| T-C2-STATUS-STALE-MISMATCH | PASS |
| T-C2-STATUS-STALE-SYMLINK | PASS |
| T-C2-MISSING-DELTA-CLI | PASS |
| T-C2-DELTA-FILES-EXIST | PASS |
| T-C2-CANONICAL-POINTER | **FAIL** |
| T-C2-ENTRYPOINT-NOT-SYMLINK | PASS |
| T-C2-HAND-COMPOSED-BYTES | PASS |
| T-C2-STATUS-DIRECTIVE-CORE-ALL | PASS |

**Suite summary:** `integration: 8 passed, 1 failed`

**Raw failure output:**
```
FAIL: T-C2-CANONICAL-POINTER: canonical not factored per spec
```

## Run 2 — test-maker worktree (registry-fixture tests only)

**Command:**
```
AGENT_CORE_BIN=/Users/jrg/agent-core/cli/zig-out/bin/agent-core bash /Users/jrg/.cursor/worktrees/agent-core/wt-agnt-test-maker-w2b-p5/cli/test/integration/c2_acceptance.sh
```

**Exit code:** 1

| Criterion ID | Result | Counts against impl? |
|---|---|---|
| T-C2-STATUS-OK | PASS | yes |
| T-C2-STATUS-STALE-MISMATCH | PASS | yes |
| T-C2-STATUS-STALE-SYMLINK | PASS | yes |
| T-C2-MISSING-DELTA-CLI | PASS | yes |
| T-C2-DELTA-FILES-EXIST | FAIL | no (expected; unfactored primitives) |
| T-C2-CANONICAL-POINTER | FAIL | no (expected; unfactored primitives) |
| T-C2-ENTRYPOINT-NOT-SYMLINK | PASS | yes |
| T-C2-HAND-COMPOSED-BYTES | PASS | yes |
| T-C2-STATUS-DIRECTIVE-CORE-ALL | PASS | yes |

**Suite summary:** `integration: 7 passed, 2 failed`

**Raw failure output (repo-content; not counted):**
```
FAIL: T-C2-DELTA-FILES-EXIST: missing delta file(s)
FAIL: T-C2-CANONICAL-POINTER: canonical not factored per spec
```

## Human-QA checklist

No human-class boxes in the C2 acceptance suite — all criteria are mechanical/automated. Human sign-off items: none to tick.

## Q → arbiter

**T-C2-CANONICAL-POINTER** failed in Run 1 (coder worktree). Raw output above only.

## Code/tests touched

none
