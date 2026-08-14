# C3-subagents Tester Results — agnt-c3-subagents-tester

**Verdict:** fail  
**Date (UTC):** Wed Aug 12 17:03 UTC 2026  
**Binary:** `/Users/jrg/agent-core/cli/zig-out/bin/agent-core`  
**CLI HEAD:** `c93c32d test(agents): C3 acceptance oracle for agents/ directory deploy`

## Build

```
cd /Users/jrg/agent-core/cli && zig build
exit 0
```

## Run 1 — authoritative (main cli tree, live deploy check)

**Command:**
```
AGENT_CORE_BIN=/Users/jrg/agent-core/cli/zig-out/bin/agent-core AGENT_CORE_LIVE=1 bash /Users/jrg/agent-core/cli/test/integration/c3_subagents_acceptance.sh
```

**Exit code:** 1

| Criterion ID | Result |
|---|---|
| T-C3-AG-RESOLVE (claude-code) | PASS |
| T-C3-AG-RESOLVE (cursor) | PASS |
| T-C3-AG-NO-PI (sync skip) | PASS |
| T-C3-AG-NO-PI (status omit pi) | **FAIL** |
| T-C3-AG-STATUS-OK | PASS |
| T-C3-AG-STATUS-MISSING | PASS |
| T-C3-AG-IDENTITY | PASS |
| T-C3-AG-LIVE-COUNT | PASS |

**Suite summary:** `integration: 7 passed, 1 failed`

**Raw output:**
```
PASS: T-C3-AG-RESOLVE: agents/foo resolves to claude-code agents dir
PASS: T-C3-AG-RESOLVE: agents/foo resolves to cursor agents dir
PASS: T-C3-AG-NO-PI: pi without agents field does not map agents/foo
  - pi           (no mapping for this type)
FAIL: T-C3-AG-NO-PI: status should omit pi deploy line when agents field absent
PASS: T-C3-AG-STATUS-OK: agents/foo ok on claude-code and cursor
PASS: T-C3-AG-STATUS-MISSING: absent cursor dest shows ?
PASS: T-C3-AG-IDENTITY: synced agents/foo bytes match source (frontmatter preserved)
PASS: T-C3-AG-LIVE-COUNT: 10×2 user-level agent files; project role stubs unchanged
---
integration: 7 passed, 1 failed
```

## Run 2 — fixture-only (main cli tree, no live check)

**Command:**
```
AGENT_CORE_BIN=/Users/jrg/agent-core/cli/zig-out/bin/agent-core bash /Users/jrg/agent-core/cli/test/integration/c3_subagents_acceptance.sh
```

**Exit code:** 1

| Criterion ID | Result |
|---|---|
| T-C3-AG-RESOLVE (claude-code) | PASS |
| T-C3-AG-RESOLVE (cursor) | PASS |
| T-C3-AG-NO-PI (sync skip) | PASS |
| T-C3-AG-NO-PI (status omit pi) | **FAIL** |
| T-C3-AG-STATUS-OK | PASS |
| T-C3-AG-STATUS-MISSING | PASS |
| T-C3-AG-IDENTITY | PASS |
| T-C3-AG-LIVE-COUNT | SKIP (AGENT_CORE_LIVE not set) |

**Suite summary:** `integration: 6 passed, 1 failed`

## Run 3 — test-maker worktree (fixture criteria, main binary)

**Command:**
```
AGENT_CORE_BIN=/Users/jrg/agent-core/cli/zig-out/bin/agent-core bash /Users/jrg/.cursor/worktrees/agent-core/wt-agnt-test-maker-w2b-pd/cli/test/integration/c3_subagents_acceptance.sh
```

**Exit code:** 1

| Criterion ID | Result |
|---|---|
| T-C3-AG-RESOLVE (claude-code) | PASS |
| T-C3-AG-RESOLVE (cursor) | PASS |
| T-C3-AG-NO-PI (sync skip) | PASS |
| T-C3-AG-NO-PI (status omit pi) | **FAIL** |
| T-C3-AG-STATUS-OK | PASS |
| T-C3-AG-STATUS-MISSING | PASS |
| T-C3-AG-IDENTITY | PASS |
| T-C3-AG-LIVE-COUNT | SKIP (AGENT_CORE_LIVE not set) |

**Suite summary:** `integration: 6 passed, 1 failed`

## Human-QA checklist

No human-class boxes in the C3-subagents acceptance suite — all criteria are mechanical/automated. Human sign-off items: none to tick.

## Q → arbiter

**Q1 (T-C3-AG-NO-PI):** `status` for `agents/foo` with pi-only deploy lists `pi (no mapping for this type)` in the status block. Oracle second sub-check expects the pi line to be omitted entirely when the pi harness profile has no `agents` field. Sync dry-run correctly skips mapping. Arbiter to rule: change status output vs relax oracle expectation.

## Code/tests touched

none

---

# RETest r1 — agnt-tester-w2b-ph

**Verdict:** pass  
**Date (UTC):** Wed Aug 12 17:12 UTC 2026  
**Binary:** `/Users/jrg/agent-core/cli/zig-out/bin/agent-core`  
**CLI HEAD:** `6746114 test(agents): relax T-C3-AG-NO-PI status sub-check per arbiter BAD TEST`  
**Context:** Arbiter nQ1 BAD TEST fix (test-maker commit `6746114`).

## Build

```
cd /Users/jrg/agent-core/cli && zig build
exit 0
```

## Run 1 — LIVE (authoritative)

**Command:**
```
AGENT_CORE_BIN=/Users/jrg/agent-core/cli/zig-out/bin/agent-core AGENT_CORE_LIVE=1 bash /Users/jrg/agent-core/cli/test/integration/c3_subagents_acceptance.sh
```

**Exit code:** 0

| Criterion ID | Result |
|---|---|
| T-C3-AG-RESOLVE (claude-code) | PASS |
| T-C3-AG-RESOLVE (cursor) | PASS |
| T-C3-AG-NO-PI (sync skip) | PASS |
| T-C3-AG-NO-PI (status no-mapping) | PASS |
| T-C3-AG-STATUS-OK | PASS |
| T-C3-AG-STATUS-MISSING | PASS |
| T-C3-AG-IDENTITY | PASS |
| T-C3-AG-LIVE-COUNT | PASS |

**Suite summary:** `integration: 8 passed, 0 failed`

## Run 2 — LIVE (repeat)

**Command:** same as Run 1  
**Exit code:** 0  
**Suite summary:** `integration: 8 passed, 0 failed`

## Run 3 — fixture-only (no LIVE)

**Command:**
```
AGENT_CORE_BIN=/Users/jrg/agent-core/cli/zig-out/bin/agent-core bash /Users/jrg/agent-core/cli/test/integration/c3_subagents_acceptance.sh
```

**Exit code:** 0

| Criterion ID | Result |
|---|---|
| T-C3-AG-RESOLVE (claude-code) | PASS |
| T-C3-AG-RESOLVE (cursor) | PASS |
| T-C3-AG-NO-PI (sync skip) | PASS |
| T-C3-AG-NO-PI (status no-mapping) | PASS |
| T-C3-AG-STATUS-OK | PASS |
| T-C3-AG-STATUS-MISSING | PASS |
| T-C3-AG-IDENTITY | PASS |
| T-C3-AG-LIVE-COUNT | SKIP (AGENT_CORE_LIVE not set) |

**Suite summary:** `integration: 7 passed, 0 failed`

## Human-QA checklist

No human-class boxes in the C3-subagents acceptance suite — all criteria are mechanical/automated. Human sign-off items: none to tick.

## Q → arbiter

none (all criteria green)

## Code/tests touched

none
