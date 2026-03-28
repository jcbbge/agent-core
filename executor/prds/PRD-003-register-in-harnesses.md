# PRD-003: Register Executor as MCP Server in All Harnesses

**Task ID:** #4
**Wave:** 2 (requires PRD-001 / Task #2 complete)
**Blocks:** #6
**Runtime:** Config file editing

---

## Kotadb Code Intelligence

The executor repo is cloned and indexed at `/Users/jcbbge/executor`. Kotadb is running at `http://localhost:3099/`.

Use kotadb to inspect executor's MCP server implementation if you need to understand the `/mcp` endpoint transport or tool list:
```bash
curl -s -X POST http://localhost:3099/ \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"search_symbols","arguments":{"query":"StreamableHTTPServerTransport","repository":"RhysSullivan/executor"}}}'
```

Relevant confirmed facts:
- Executor's MCP endpoint: `http://127.0.0.1:8000/mcp`
- Transport: streamable HTTP
- Tools exposed: `execute`, `resume`
- omp auto-reads `~/.claude/` — may not need a separate omp config entry

---

## Overview

Register executor's `/mcp` endpoint as an MCP server in all three active harnesses: Claude Code, opencode, and omp. This gives every harness access to two new tools: `execute` (submit TypeScript that runs against the unified tool catalog) and `resume` (continue a paused execution). This is the primary mechanism by which agents in any harness invoke the executor runtime.

---

## Goals

- Executor available as an MCP tool in Claude Code, opencode, and omp
- Single registration point — `http://127.0.0.1:8000/mcp`
- Follows infrastructure rule: update registry.json first, then harness configs
- omp may auto-discover from Claude Code config (verify, don't assume)

## Non-Goals

- Do not change executor's port, transport, or behavior
- Do not remove or modify existing MCP server registrations
- Do not register project-scoped MCPs globally

---

## Technical Specification

### Step 1: Update registry.json

**File:** `~/Documents/_agents/primitives/mcp/registry.json`

Add executor entry to the `"servers"` array. Insert after the `dev-brain` entry:

```json
{
  "name": "executor",
  "description": "Universal primitive runtime — execute TypeScript against unified tool catalog. Tools: execute, resume.",
  "tool_count": 2,
  "transport": "http",
  "port": 8000,
  "url": "http://127.0.0.1:8000/mcp",
  "source": "npm:executor",
  "runtime": "node",
  "daemon": "dev.brain.executor",
  "status": "running",
  "default_enabled": true,
  "harnesses": ["claude-code", "opencode", "omp"],
  "disable_when": "never — universal runtime layer"
}
```

Also update `port_allocation` if not already done by Task #2:
```json
"8000": "executor daemon — http://127.0.0.1:8000 — label: dev.brain.executor"
```

---

### Step 2: Claude Code

**File:** `~/.claude.json`

Read the file first. In the `mcpServers` object, add:

```json
"executor": {
  "type": "http",
  "url": "http://127.0.0.1:8000/mcp"
}
```

Verify the existing entries (anima, kotadb, dev-brain, auggie) are untouched.

**Verify:** Start a new Claude Code session. Run `/mcp` to confirm executor appears in the MCP tool list with 2 tools: `execute` and `resume`.

---

### Step 3: opencode

**File:** `~/.config/opencode/opencode.json`

Read the file first. Locate the MCP servers section. Add executor using the same HTTP transport format already used by other servers in that file. Example pattern (adjust to match existing format in the file):

```json
{
  "name": "executor",
  "type": "http",
  "url": "http://127.0.0.1:8000/mcp"
}
```

**Verify:** Restart opencode. Confirm executor tools are visible.

---

### Step 4: omp

**Approach:** omp auto-discovers `~/.claude/` directory and reads Claude Code's MCP configs. It may already pick up executor after Step 2. Check first before writing a separate config.

**Check:**
```bash
cat ~/.omp/agent/mcp.json 2>/dev/null || echo "no omp config"
```

If omp already lists executor (auto-discovered from Claude Code), no action needed. Document this in registry.json note.

If not auto-discovered, create/edit `~/.omp/agent/mcp.json` and add:

```json
{
  "mcpServers": {
    "executor": {
      "type": "http",
      "url": "http://127.0.0.1:8000/mcp"
    }
  }
}
```

**Verify:** Run omp and confirm executor tools are available.

---

## Acceptance Criteria

- [ ] registry.json updated with executor entry before any harness config changes
- [ ] Claude Code `/mcp` shows `executor` with tools `execute` and `resume`
- [ ] opencode shows executor in MCP tool list
- [ ] omp has executor available (via auto-discovery or explicit config)
- [ ] All existing MCPs (anima, kotadb, dev-brain, auggie) still present and functional
- [ ] HubSpot MCP is NOT present in global configs (stays in bento/.mcp.json only)

---

## Notes

omp uses `pi-mcp-adapter` pattern for token efficiency if needed: if executor's catalog grows large (50+ tools after many sources connected), consider installing `pi-mcp-adapter` to collapse all tool schemas to a single 200-token proxy. Not needed initially with only 2 tools (`execute`, `resume`).
