# PRD-007: Wire the Full Agent-Runtime Layer

**Task ID:** #6
**Wave:** 3 (requires PRD-001, PRD-002, PRD-003, PRD-004, PRD-006 complete)
**Blocks:** nothing — this is the final integration task
**Runtime:** Executor CLI

---

## Kotadb Code Intelligence

The executor repo is cloned and indexed at `/Users/jcbbge/executor`. Kotadb is running at `http://localhost:3099/`.

This task is integration and verification — no code changes. If any source connection fails, use kotadb to diagnose:
```bash
# Check executor's source API for error details
curl -s -X POST http://localhost:3099/ \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"search_symbols","arguments":{"query":"connectContentSource","repository":"RhysSullivan/executor"}}}'
```

All upstream PRDs must be complete before this task begins. Verify each dependency explicitly before proceeding.

---

## Overview

With all building blocks in place, this task wires the complete agent-runtime layer by connecting all remaining sources to executor. The result is a fully operational universal primitive catalog where agents can discover and invoke tools from every registered primitive type.

This task is mostly configuration and verification — no new code. It connects content sources (rules, skills, commands) and the subagent delegation server to executor, then runs end-to-end smoke tests.

---

## Prerequisites

All of the following must be complete and verified:

- [ ] Task #2: Executor daemon running at port 8000
- [ ] Task #3: dev-brain, anima, kotadb connected as MCP sources
- [ ] Task #4: Executor registered in Claude Code, opencode, omp
- [ ] Task #8: Content source kind built and deployed in executor fork
- [ ] Task #9: Subagent delegation MCP server running at port 3096
- [ ] Task #12: Subagent definition files created in primitives/subagents/

---

## Technical Specification

### Step 1: Connect rules as content source

```bash
executor --base-url http://127.0.0.1:8000 call '
  return await tools.executor.sources.add({
    kind: "content",
    basePath: "/Users/jcbbge/Documents/_agents/primitives/rules",
    fileGlob: "**/*.md",
    namespace: "rules",
    indexStrategy: "flat"
  });
'
```

Verify:
```bash
executor --base-url http://127.0.0.1:8000 call '
  return await tools.rules.list();
'
# Expected: backend-first-security, solidjs, git, bento, infrastructure, README
```

### Step 2: Connect skills as content source

```bash
executor --base-url http://127.0.0.1:8000 call '
  return await tools.executor.sources.add({
    kind: "content",
    basePath: "/Users/jcbbge/Documents/_agents/primitives/skills",
    fileGlob: "**/*.md",
    namespace: "skills",
    indexStrategy: "flat"
  });
'
```

Verify:
```bash
executor --base-url http://127.0.0.1:8000 call '
  return await tools.skills.list();
'
# Expected: 57 skills returned

executor --base-url http://127.0.0.1:8000 call '
  return await tools.skills.search({ query: "solidjs reactivity components" });
'
# Expected: building-with-solidjs ranked first or second
```

### Step 3: Connect commands as content source

```bash
executor --base-url http://127.0.0.1:8000 call '
  return await tools.executor.sources.add({
    kind: "content",
    basePath: "/Users/jcbbge/Documents/_agents/primitives/commands",
    fileGlob: "**/*.md",
    namespace: "commands",
    indexStrategy: "flat"
  });
'
```

Verify:
```bash
executor --base-url http://127.0.0.1:8000 call '
  return await tools.commands.list();
'
# Expected: 20 commands
```

### Step 4: Connect subagent delegation server

```bash
executor --base-url http://127.0.0.1:8000 call '
  return await tools.executor.sources.add({
    kind: "mcp",
    endpoint: "http://localhost:3096/",
    name: "subagent-mcp",
    namespace: "subagents",
    transport: "streamable-http"
  });
'
```

Verify:
```bash
executor --base-url http://127.0.0.1:8000 call '
  return await tools.subagents.list();
'
# Expected: reviewer, test-writer, architect, debugger, sigil-distiller
```

### Step 5: Full catalog smoke test

Verify the complete namespace map:

```bash
executor --base-url http://127.0.0.1:8000 call '
  return await tools.catalog.namespaces();
'
```

Expected namespaces: `dev-brain`, `anima`, `kotadb`, `rules`, `skills`, `commands`, `subagents`, `executor`

### Step 6: Cross-namespace discovery test

```bash
executor --base-url http://127.0.0.1:8000 call '
  return await tools.discover({ query: "solidjs reactivity", limit: 5 });
'
# Expected: mix of skills.building-with-solidjs and rules.solidjs
```

```bash
executor --base-url http://127.0.0.1:8000 call '
  return await tools.discover({ query: "capture thought memory", limit: 5 });
'
# Expected: dev-brain and anima tools
```

### Step 7: End-to-end execution test (from harness)

In Claude Code, run:
```
Use the execute tool to: discover tools related to "code review", then delegate to the reviewer subagent to review this simple function: function add(a, b) { return a + b }
```

Expected: executor calls `tools.discover`, finds `subagents.delegate`, calls the reviewer, returns structured review.

---

## Final Namespace Map

After this task completes, the full catalog should be:

| Namespace | Source Kind | Tools |
|-----------|------------|-------|
| `dev-brain` | mcp | 18 tools |
| `anima` | mcp | 7 tools |
| `kotadb` | mcp | 12 tools |
| `rules` | content | list, search, {n}.get per rule |
| `skills` | content | list, search, {n}.get per skill |
| `commands` | content | list, search, {n}.get per command |
| `subagents` | mcp | list, delegate |
| `executor` | internal | sources.add, sources.list, etc. |

---

## Acceptance Criteria

- [ ] `tools.catalog.namespaces()` returns all 8 namespaces above
- [ ] `tools.rules.list()` returns at least 5 rules
- [ ] `tools.skills.list()` returns at least 50 skills
- [ ] `tools.skills.search({ query: "solidjs" })` returns building-with-solidjs in top 3
- [ ] `tools.commands.list()` returns at least 15 commands
- [ ] `tools.subagents.list()` returns 5 agents
- [ ] `tools.subagents.delegate({ agent: "reviewer", input: "..." })` returns a review
- [ ] Cross-namespace `tools.discover()` returns results from multiple namespaces
- [ ] End-to-end test from Claude Code passes (execute tool works)
- [ ] All sources persist after executor daemon restart

---

## Notes

- This task has no new code. If it fails, the failure points to an incomplete prerequisite task.
- If skills directory has nested subdirectories (indexStrategy: "directory-per-item"), and the "flat" strategy misses some skills, revisit PRD-004 to implement the directory-per-item variant.
- The context window budget note in registry.json applies: monitor total tool count. At 8 namespaces × avg 15 tools = ~120 tools, approaching the 80-tool active budget. Consider enabling/disabling namespaces per session context.
