> **DEPRECATED** — See `~/Documents/_agents/brain-infrastructure.md` for the current architecture.
> This document is retained for historical reference only.
> **Last fully updated:** 2026-03-09 (architecture migration day)

# Brain Infrastructure

Local AI dev tooling — MCP daemons, SurrealDB instances, and how to extend them.

**Last updated:** 2026-03-09 (migration to single SurrealDB)

---

## Current Architecture

```
Claude Code / OpenCode / OMP
        │
        ├── HTTP POST → localhost:8000/mcp  (Executor — universal runtime)
        │                   ├── sources: dev-brain, anima, kotadb, rules, skills, commands
        │                   └── tools: execute, resume
        │
        ├── HTTP POST → localhost:3098  (Anima MCP)
        │                   └── SurrealDB ws://127.0.0.1:8002
        │                       NS: anima  DB: memory
        │
        ├── HTTP POST → localhost:3097  (Dev-Brain MCP)
        │                   └── SurrealDB ws://127.0.0.1:8002
        │                       NS: dev  DB: brain
        │
        └── HTTP POST → localhost:3099  (Kotadb MCP)
                            └── SurrealDB ws://127.0.0.1:8002
                                NS: kotadb  DB: index
```

**NOTE:** As of 2026-03-09, all three MCP servers share a single SurrealDB instance at port 8002.
Port 7201 (the old kotadb-specific SurrealDB) has been decommissioned.

### Active Daemons

| Label | Port | Binary | Source |
|-------|------|--------|--------|
| `dev.brain.executor` | 8000 | node (npm) | `~/executor/` — `/opt/homebrew/bin/executor` |
| `dev.brain.subagent-mcp` | 3096 | bun | `~/dev-backbone/subagent-mcp/src/index.ts` |
| `com.jcbbge.anima-mcp` | 3098 | deno | `~/anima/mcp-server/index.ts` |
| `com.jcbbge.dev-brain-mcp` | 3097 | bun | `~/dev-backbone/mcp-server/index.js` |
| `com.jcbbge.kotadb-app` | 3099 | bun | `~/kotadb/app/src/index.ts` |
| `anima.synthesis` | — | deno | `~/anima/synthesis-worker/index.ts` |
| `dev.anima.synthesis-daemon` | — | deno | `~/anima/scripts/synthesis-daemon.ts` |
| `dev.anima.curiosity-worker` | — | deno | `~/anima/scripts/curiosity-worker.ts` |

### SurrealDB Instances

| Port | Namespace | Database | Purpose | Managed by |
|------|-----------|----------|---------|------------|
| 8002 | anima | memory | Personal dev memory — identity, sessions, catalysts | `dev.brain.surreal` (launchctl) |
| 8002 | dev | brain | Dev-brain — todos, threads, workspace | `dev.brain.surreal` (launchctl) |
| 8002 | kotadb | index | Code index — symbols, dependencies, embeddings | `dev.brain.surreal` (launchctl) |

**Note:** All namespaces share a single SurrealDB process at port 8002. No separate instances.

### MCP Registration (`~/.claude/mcp.json`)

```json
{
  "mcpServers": {
    "anima": {
      "type": "http",
      "url": "http://localhost:3098/"
    },
    "dev-brain": {
      "type": "http",
      "url": "http://localhost:3097/"
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

**Add a new namespace to the unified instance (port 8002):**

```bash
surreal import \
  --endpoint http://127.0.0.1:8000 \
  --username root --password root \
  --namespace <new-namespace> --database <new-database> \
  ~/path/to/schema.surql
```

In your new tool's code:

```typescript
// Point to the same instance, different namespace
const SURREAL_URL = "ws://127.0.0.1:8002/rpc";
const SURREAL_NS  = "<new-namespace>";
const SURREAL_DB  = "<new-database>";
```

**When to add a new SurrealDB instance instead:**
- The data is large, mechanical, and frequently written (like a code index) — different I/O profile
- You need independent backup/restore without touching other namespaces
- You need different auth or network binding
- A crash in one genuinely shouldn't affect the other (e.g., memory vs indexing)

For everything that is "brain data" — memories, decisions, patterns, session context, agent state — add a namespace to port 8002. That's what it's for.

---

## How to Add a New MCP Tool Suite

See `/Users/jcbbge/Documents/_agents/primitives/mcp/AGENT.md` for the complete guide to building and registering MCP servers.

Key points:
- Use HTTP transport only (not stdio)
- Register in `/Users/jcbbge/Documents/_agents/primitives/mcp/registry.json`
- After registry changes, manually update each harness config (`~/.claude/mcp.json`, `~/.config/opencode/opencode.json`)

---

## Port Allocation

| Port | Assigned |
|------|----------|
| 8002 | SurrealDB — unified (anima, dev, kotadb namespaces) |
| 7201 | ❌ DECOMMISSIONED — was kotadb, now nothing |
| 3099 | Kotadb MCP HTTP |
| 3098 | Anima MCP HTTP |
| 3097 | Dev-Brain MCP HTTP |
| 8001 | Ollama |
| 8000 | executor daemon (active) — http://127.0.0.1:8000 — label: dev.brain.executor |
| 3096 | **next available** |

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

**As of 2026-03-09: This is already done.**

We now run a single SurrealDB instance at port 8002 with three namespaces:

```
port 8002 (SurrealDB — unified)
  ├── ns: anima      db: memory        → Anima MCP (3098)
  ├── ns: dev        db: brain         → Dev-Brain MCP (3097)
  └── ns: kotadb    db: index         → Kotadb MCP (3099)
```

Port 7201 is dead and should not be used.

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
  dev.brain.surreal.plist      — SurrealDB port 8002 (unified instance)

~/.claude/
  mcp.json                     — global MCP server registration
  docs/brain-infrastructure.md — reference copy of the file in the repo
```
