# PRD-002: Connect MCP Servers to Executor as Unified Gateway Sources

**Task ID:** #3
**Wave:** 2 (requires PRD-001 / Task #2 complete)
**Blocks:** #6
**Runtime:** Executor CLI / HTTP API

---

## Kotadb Code Intelligence

The executor repo is cloned and indexed at `/Users/jcbbge/executor`. Kotadb is running at `http://localhost:3099/`.

Use kotadb to inspect executor's source connection API if needed:
```bash
curl -s -X POST http://localhost:3099/ \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"search_symbols","arguments":{"query":"ConnectSourcePayload","repository":"RhysSullivan/executor"}}}'
```

Relevant confirmed facts:
- `ConnectSourcePayload` union is in `packages/control-plane/src/api/sources/api.ts` lines 132–157
- MCP source branch fields: `endpoint` (required) + optional `name`, `namespace`, `transport`, `queryParams`, `headers`
- `transport` field accepts `"streamable-http"` — use this explicitly since all 3 local MCPs use streamable HTTP

---

## Overview

Connect the three existing HTTP MCP servers (dev-brain, anima, kotadb) to executor as indexed sources. After this task, agents running TypeScript inside executor's sandbox can call any tool from any of the three servers through a unified typed catalog at `tools.dev-brain.*`, `tools.anima.*`, `tools.kotadb.*`.

---

## Goals

- All three MCPs connected and indexed in executor's tool catalog
- Tool discovery works across all three namespaces
- Agents can call tools via `tools.{namespace}.{tool}(args)` in TypeScript
- No changes to the upstream MCP servers themselves

## Non-Goals

- Do not modify anima, kotadb, or dev-brain source code
- Do not change their ports or transport
- Do not register executor in harnesses yet (that is Task #4)

---

## Context

The three servers all use **streamable HTTP transport** (not SSE, not stdio). From registry.json:

| Server | Port | URL | Tool Count |
|--------|------|-----|------------|
| dev-brain | 3097 | http://localhost:3097/ | 18 |
| anima | 3098 | http://localhost:3098/ | 7 |
| kotadb | 3099 | http://localhost:3099/ | 12 |

---

## Technical Specification

### Prerequisites

- Task #2 complete: executor running at `http://127.0.0.1:8000`
- All three MCP servers running (verify with `core status` or `launchctl list | grep -E "anima|kotadb|brain"`)

### Method: executor call

Use the `executor call` CLI to run TypeScript against the daemon. Each source addition is a single call.

**Connect dev-brain:**
```bash
executor --base-url http://127.0.0.1:8000 call '
  return await tools.executor.sources.add({
    kind: "mcp",
    endpoint: "http://localhost:3097/",
    name: "dev-brain",
    namespace: "dev-brain",
    transport: "streamable-http"
  });
'
```

**Connect anima:**
```bash
executor --base-url http://127.0.0.1:8000 call '
  return await tools.executor.sources.add({
    kind: "mcp",
    endpoint: "http://localhost:3098/",
    name: "anima",
    namespace: "anima",
    transport: "streamable-http"
  });
'
```

**Connect kotadb:**
```bash
executor --base-url http://127.0.0.1:8000 call '
  return await tools.executor.sources.add({
    kind: "mcp",
    endpoint: "http://localhost:3099/",
    name: "kotadb",
    namespace: "kotadb",
    transport: "streamable-http"
  });
'
```

> **Note on transport field:** The `transport` field may not be in the public API yet. If the `sources.add` call fails with an unknown field error, omit `transport` and let executor auto-detect. Executor's discovery probe (`tryDetectMcp`) will attempt streamable-http first. If auto-detect picks SSE instead, force it by inspecting the source after connection and checking `tools.executor.sources.list()`.

### Verify connection

After each add, verify the source is indexed:

```bash
executor --base-url http://127.0.0.1:8000 call '
  return await tools.executor.sources.list();
'
```

Expected: 3 sources with status `connected` or `indexed`.

### Verify tool discovery

```bash
executor --base-url http://127.0.0.1:8000 call '
  return await tools.discover({ query: "capture thought", limit: 3 });
'
# Should return dev-brain tools

executor --base-url http://127.0.0.1:8000 call '
  return await tools.discover({ query: "memory identity", limit: 3 });
'
# Should return anima tools

executor --base-url http://127.0.0.1:8000 call '
  return await tools.discover({ query: "symbol search code", limit: 3 });
'
# Should return kotadb tools
```

### Verify tool invocation

Smoke test one tool per server:

```bash
# dev-brain: list todos
executor --base-url http://127.0.0.1:8000 call '
  return await tools["dev-brain"].list_todos({});
'

# anima: ghost handshake
executor --base-url http://127.0.0.1:8000 call '
  return await tools.anima.ghost_handshake({});
'

# kotadb: (use a safe read-only tool from the kotadb tool list)
executor --base-url http://127.0.0.1:8000 call '
  return await tools.catalog.namespaces();
'
```

---

## Acceptance Criteria

- [ ] `tools.executor.sources.list()` returns 3 sources, all with connected/indexed status
- [ ] `tools.discover({ query: "..." })` returns results from all 3 namespaces
- [ ] At least one tool invocation succeeds per server (no auth errors, no transport errors)
- [ ] No upstream MCP servers restarted or modified
- [ ] Sources persist after `launchctl stop/start dev.brain.executor` (PGlite persistence)

---

## Troubleshooting

**Source shows `error` status:** Check that the upstream MCP server is running. Run `core status` or `curl http://localhost:3097/` to verify.

**Transport detection fails:** If executor probes via SSE and your servers don't speak SSE, add the `transport: "streamable-http"` field explicitly or check if executor v1.1.9+ supports the field.

**Tool names have collision:** Unlikely since namespaces are set, but if tool calls fail with "tool not found," check the exact path via `tools.catalog.tools({ namespace: "dev-brain" })`.
