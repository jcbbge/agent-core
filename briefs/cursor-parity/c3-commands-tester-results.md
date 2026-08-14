# C3-commands Tester Results — agnt-c3-commands-tester

**Verdict:** pass  
**Date (UTC):** Wed Aug 12 17:51 UTC 2026  
**Binary:** `/Users/jrg/agent-core/cli/zig-out/bin/agent-core`  
**CLI HEAD:** `1a8246e test(commands): C3 acceptance oracle for command/ deploy resolution`

## Build

```
cd /Users/jrg/agent-core/cli && zig build
exit 0
```

## Run 1 — authoritative (main cli tree, live deploy check)

**Command:**
```
AGENT_CORE_BIN=/Users/jrg/agent-core/cli/zig-out/bin/agent-core AGENT_CORE_LIVE=1 bash /Users/jrg/agent-core/cli/test/integration/c3_commands_acceptance.sh
```

**Exit code:** 0

| Criterion ID | Result |
|---|---|
| T-C3-CMD-RESOLVE-PI | PASS |
| T-C3-CMD-RESOLVE-CC | PASS |
| T-C3-CMD-RESOLVE-CURSOR | PASS |
| T-C3-CMD-STATUS-OK | PASS |
| T-C3-CMD-STATUS-MISSING | PASS |
| T-C3-CMD-IDENTITY-PORT | PASS |
| T-C3-CMD-LIVE-DEPLOYED | PASS |

**Suite summary:** `integration: 7 passed, 0 failed`

**Raw output:**
```
PASS: T-C3-CMD-RESOLVE-PI: command/tower resolves to pi prompts dir
PASS: T-C3-CMD-RESOLVE-CC: command/tower resolves to claude-code commands dir
PASS: T-C3-CMD-RESOLVE-CURSOR: command/tower resolves to cursor commands dir
PASS: T-C3-CMD-STATUS-OK: command/tower ok on pi, claude-code, cursor
PASS: T-C3-CMD-STATUS-MISSING: missing claude-code dest shows ?
PASS: T-C3-CMD-IDENTITY-PORT: synced command bytes match source on all harnesses
PASS: T-C3-CMD-LIVE-DEPLOYED: six command dest files are regular files
---
integration: 7 passed, 0 failed
```

## Run 2 — fixture-only (main cli tree, no live check)

**Command:**
```
AGENT_CORE_BIN=/Users/jrg/agent-core/cli/zig-out/bin/agent-core bash /Users/jrg/agent-core/cli/test/integration/c3_commands_acceptance.sh
```

**Exit code:** 0

| Criterion ID | Result |
|---|---|
| T-C3-CMD-RESOLVE-PI | PASS |
| T-C3-CMD-RESOLVE-CC | PASS |
| T-C3-CMD-RESOLVE-CURSOR | PASS |
| T-C3-CMD-STATUS-OK | PASS |
| T-C3-CMD-STATUS-MISSING | PASS |
| T-C3-CMD-IDENTITY-PORT | PASS |
| T-C3-CMD-LIVE-DEPLOYED | SKIP (AGENT_CORE_LIVE not set) |

**Suite summary:** `integration: 6 passed, 0 failed`

## Run 3 — test-maker worktree (fixture criteria, main binary)

**Command:**
```
AGENT_CORE_BIN=/Users/jrg/agent-core/cli/zig-out/bin/agent-core bash /Users/jrg/.cursor/worktrees/agent-core/wt-agnt-test-maker-w2b-pa/cli/test/integration/c3_commands_acceptance.sh
```

**Exit code:** 0

| Criterion ID | Result |
|---|---|
| T-C3-CMD-RESOLVE-PI | PASS |
| T-C3-CMD-RESOLVE-CC | PASS |
| T-C3-CMD-RESOLVE-CURSOR | PASS |
| T-C3-CMD-STATUS-OK | PASS |
| T-C3-CMD-STATUS-MISSING | PASS |
| T-C3-CMD-IDENTITY-PORT | PASS |
| T-C3-CMD-LIVE-DEPLOYED | SKIP (AGENT_CORE_LIVE not set) |

**Suite summary:** `integration: 6 passed, 0 failed`

## Human-QA checklist

No human-class boxes in the C3-commands acceptance suite — all criteria are mechanical/automated. Human sign-off items: none to tick.

## Q → arbiter

none

## Code/tests touched

none
