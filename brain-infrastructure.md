# Brain Infrastructure

Local AI dev tooling — MCP daemons, SurrealDB instances, and how to extend them.

**Last updated:** 2026-03-07

---

## Current Architecture

```
Claude Code / Auggie / OpenCode / OMP
        │
        ├── HTTP POST → localhost:3098  (Anima MCP)
        │                   └── SurrealDB ws://127.0.0.1:8000
        │                       NS: anima  DB: memory
        │
        └── HTTP POST → localhost:3099  (Kotadb MCP)
                            └── SurrealDB ws://127.0.0.1:7201
                                NS: kotadb  DB: index
```

### Active Daemons

| Label | Port | Binary | Source |
|-------|------|--------|--------|
| `com.jcbbge.anima-mcp` | 3098 | deno | `~/anima/mcp-server/index.ts` |
| `com.jcbbge.kotadb-app` | 3099 | bun | `~/kotadb/app/src/index.ts` |
| `anima.synthesis` | — | deno | `~/anima/synthesis-worker/index.ts` |

### SurrealDB Instances

| Port | Namespace | Database | Purpose | Managed by |
|------|-----------|----------|---------|------------|
| 8000 | anima | memory | Personal dev memory — identity, sessions, catalysts | `dev.brain.surreal` (launchctl) |
| 7201 | kotadb | index | Code index — symbols, dependencies, embeddings | `com.jcbbge.kotadb-surreal` (or manual start) |

### MCP Registration (`~/.claude/mcp.json`)

```json
{
  "mcpServers": {
    "anima": {
      "type": "http",
      "url": "http://localhost:3098/"
    },
    "kotadb-local": {
      "type": "http",
      "url": "http://localhost:3099/mcp"
    }
  }
}
```

### Why HTTP, Not STDIO

STDIO MCP spawns a new process per client connection. If the client disconnects uncleanly (crash, signal, tab close), the process hangs indefinitely. With 4 harnesses (Claude Code, Auggie, OpenCode, OMP), each session could leave an orphan. At 10 sessions/day that's 40 orphaned Deno processes consuming memory and file descriptors.

HTTP MCP is one persistent daemon. All clients share it. Zero orphan risk. Token cost difference:

| Transport | Per-call overhead |
|-----------|-------------------|
| HTTP MCP (current) | ~50 tokens |
| STDIO MCP (old) | ~1050 tokens (process spawn metadata) |
| Direct SurrealQL via Bash | ~300 tokens |

**Rule:** Always use HTTP MCP for persistent dev tools. STDIO is only appropriate for one-shot CLI utilities.

---

## How to Add a New SurrealDB Namespace

If your new tool fits in an existing SurrealDB instance, add a namespace — no new process needed.

**Add Constellation to the Anima instance (port 8000):**

```bash
surreal import \
  --endpoint http://127.0.0.1:8000 \
  --username root --password root \
  --namespace constellation --database pheromones \
  ~/constellation/schema/schema.surql
```

In your new tool's code:

```typescript
// Point to the same instance, different namespace
const SURREAL_URL = "ws://127.0.0.1:8000/rpc";
const SURREAL_NS  = "constellation";
const SURREAL_DB  = "pheromones";
```

**When to add a new SurrealDB instance instead:**
- The data is large, mechanical, and frequently written (like a code index) — different I/O profile
- You need independent backup/restore without touching other namespaces
- You need different auth or network binding
- A crash in one genuinely shouldn't affect the other (e.g., memory vs indexing)

For everything that is "brain data" — memories, decisions, patterns, session context, agent state — add a namespace to port 8000. That's what it's for.

---

## How to Add a New MCP Tool Suite

### 1. Write the server

Create `~/your-tool/mcp-server/index.ts`:

```typescript
// Load .env first
await loadEnv();

import { Deno } from "...";

const PORT = Number(Deno.env.get("YOUR_TOOL_MCP_PORT") ?? "3097");

// Define your TOOLS array (JSON Schema)
const TOOLS = [
  {
    name: "your_tool_name",
    description: "...",
    inputSchema: {
      type: "object",
      properties: { /* ... */ },
      required: [],
    },
  },
];

// Implement dispatch() — same pattern as anima:
async function dispatch(msg: Record<string, unknown>): Promise<unknown> {
  const { id, method, params } = msg as any;

  if (method === "initialize") {
    return { jsonrpc: "2.0", id, result: {
      protocolVersion: "2024-11-05",
      serverInfo: { name: "your-tool", version: "1.0.0" },
      capabilities: { tools: {} },
    }};
  }
  if (method === "tools/list") {
    return { jsonrpc: "2.0", id, result: { tools: TOOLS } };
  }
  if (method === "tools/call") {
    const toolName = (params as any)?.name as string;
    const toolArgs = ((params as any)?.arguments ?? {}) as Record<string, unknown>;
    // route to handlers...
    const result = await yourHandler(toolArgs);
    return { jsonrpc: "2.0", id, result: {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    }};
  }
  return null;
}

// Start HTTP server
Deno.serve({ port: PORT, hostname: "127.0.0.1" }, async (req) => {
  if (req.method === "GET" && new URL(req.url).pathname === "/health") {
    return new Response(JSON.stringify({ status: "ok" }), {
      headers: { "content-type": "application/json" },
    });
  }
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  const body = await req.json();
  const response = await dispatch(body);
  if (response === null) return new Response(null, { status: 204 });
  return new Response(JSON.stringify(response), {
    headers: { "content-type": "application/json" },
  });
});
```

### 2. Create the launchd plist

`~/Library/LaunchAgents/com.jcbbge.your-tool-mcp.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.jcbbge.your-tool-mcp</string>

  <key>ProgramArguments</key>
  <array>
    <string>/opt/homebrew/bin/deno</string>
    <string>run</string>
    <string>--allow-net</string>
    <string>--allow-env</string>
    <string>--allow-read</string>
    <string>/Users/jcbbge/your-tool/mcp-server/index.ts</string>
  </array>

  <key>EnvironmentVariables</key>
  <dict>
    <key>YOUR_TOOL_MCP_PORT</key>
    <string>3097</string>
    <key>SURREAL_URL</key>
    <string>ws://127.0.0.1:8000/rpc</string>
    <key>SURREAL_NS</key>
    <string>your-namespace</string>
    <key>SURREAL_DB</key>
    <string>your-db</string>
    <key>SURREAL_USER</key>
    <string>root</string>
    <key>SURREAL_PASS</key>
    <string>root</string>
  </dict>

  <key>WorkingDirectory</key>
  <string>/Users/jcbbge/your-tool</string>

  <key>RunAtLoad</key>
  <true/>

  <key>KeepAlive</key>
  <true/>

  <key>ThrottleInterval</key>
  <integer>5</integer>

  <key>StandardOutPath</key>
  <string>/Users/jcbbge/.your-tool/mcp.log</string>

  <key>StandardErrorPath</key>
  <string>/Users/jcbbge/.your-tool/mcp.log</string>
</dict>
</plist>
```

**If your tool uses Bun (Node.js) instead of Deno:**

```xml
<key>ProgramArguments</key>
<array>
  <string>/opt/homebrew/bin/bun</string>
  <string>run</string>
  <string>/Users/jcbbge/your-tool/src/index.ts</string>
</array>
```

### 3. Register and start

```bash
mkdir -p ~/.your-tool
launchctl load ~/Library/LaunchAgents/com.jcbbge.your-tool-mcp.plist
curl http://127.0.0.1:3097/health   # verify
```

### 4. Add to `~/.claude/mcp.json`

```json
{
  "mcpServers": {
    "anima": { "type": "http", "url": "http://localhost:3098/" },
    "kotadb-local": { "type": "http", "url": "http://localhost:3099/mcp" },
    "your-tool": { "type": "http", "url": "http://localhost:3097/" }
  }
}
```

Restart Claude Code. The new tools appear as `mcp__your-tool__your_tool_name`.

---

## Port Allocation

| Port | Assigned |
|------|----------|
| 8000 | SurrealDB — Anima/brain namespace |
| 7201 | SurrealDB — Kotadb code index |
| 3099 | Kotadb MCP HTTP |
| 3098 | Anima MCP HTTP |
| 3097 | **next available** |
| 3096 | — |

---

## Daemon Operations

```bash
# Status
launchctl list | grep jcbbge

# Restart a daemon
launchctl unload ~/Library/LaunchAgents/com.jcbbge.anima-mcp.plist
launchctl load ~/Library/LaunchAgents/com.jcbbge.anima-mcp.plist

# View logs
tail -f ~/.anima/anima-mcp.log
tail -f ~/.kotadb/kotadb-app.log

# Health checks
curl http://127.0.0.1:3098/health    # anima
curl http://127.0.0.1:3099/health    # kotadb (if implemented)

# Kill all orphaned stdio MCP processes (emergency)
pkill -f "mcp-server/index.ts" 2>/dev/null
```

---

## The Consolidation Question

**Should you run one SurrealDB?**

Short answer: **keep the two you have, but don't add more.** Add namespaces to port 8000 for new brain tools.

The resource cost of a second SurrealDB on an M-series Mac is ~50-80MB RAM at idle and negligible CPU. That's not the issue.

The real question is data nature:

| | Anima (port 8000) | Kotadb (port 7201) |
|--|---|---|
| Data | Identity, memories, catalysts, session insight | Symbol tables, AST data, dependency graphs |
| Size | Small (~268 records) | Large (grows with codebase) |
| Reproducibility | **Irreproducible** — loss is permanent | Fully rebuildable from source |
| Backup strategy | Back up carefully, infrequently | Skip backup; reindex on demand |
| I/O pattern | Low-volume, high-meaning | High-volume, mechanical |

These have genuinely different durability requirements. Keeping them separate means you can back up Anima daily, wipe and rebuild Kotadb freely, without either affecting the other.

**For everything else** — Constellation pheromones, future agents, session state, workflow tracking — those are "brain data" and belong on port 8000 as new namespaces. One line change in the tool's `.env` or plist EnvironmentVariables.

**The single-brain model:**
```
port 8000 (SurrealDB)
  ├── NS: anima      DB: memory        → Anima MCP (3098)
  ├── NS: constellation DB: pheromones → Constellation (future)
  ├── NS: sigil      DB: workflows     → Sigil (future)
  └── NS: agents     DB: state         → Generic agent state (future)

port 7201 (SurrealDB) — code index only, rebuildable
  └── NS: kotadb     DB: index         → Kotadb MCP (3099)
```

This is the architecture to build toward. Two instances, not N.

---

## File Locations

```
~/anima/
  mcp-server/index.ts          — HTTP MCP daemon (port 3098)
  lib/memory.ts                — core memory operations
  lib/synthesize.ts            — fold engine
  deno.json                    — task definitions

~/kotadb/app/src/
  index.ts                     — HTTP daemon (port 3099)
  mcp/server.ts                — MCP server setup

~/Library/LaunchAgents/
  com.jcbbge.anima-mcp.plist   — Anima MCP daemon
  com.jcbbge.kotadb-app.plist  — Kotadb daemon
  dev.brain.surreal.plist      — SurrealDB port 8000 (Anima)

~/.claude/
  mcp.json                     — global MCP server registration
  docs/brain-infrastructure.md — this file
```
