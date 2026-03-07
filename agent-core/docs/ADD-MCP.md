# How to Add an MCP Server

An MCP server is a persistent HTTP daemon that exposes tools agents can call.
Define it in the registry. Deploy pushes the registration to every configured harness.

## Steps

### 1. Build the server

See `~/Documents/_systems/brain-infrastructure.md` for the full HTTP server pattern.

Key requirements:
- HTTP transport only (not stdio — stdio spawns orphan processes)
- `GET /health` returns `{"status":"ok"}`
- `POST /` (or `/mcp`) handles JSON-RPC 2.0
- Runs as a launchd daemon (KeepAlive: true)

Pick the next available port from the registry.

### 2. Create the launchd plist

```bash
cp ~/Library/LaunchAgents/com.jcbbge.anima-mcp.plist \
   ~/Library/LaunchAgents/com.jcbbge.[name]-mcp.plist
# Edit: Label, ProgramArguments (binary + source path), EnvironmentVariables, log paths
mkdir -p ~/.[name]
launchctl load ~/Library/LaunchAgents/com.jcbbge.[name]-mcp.plist
curl http://127.0.0.1:[PORT]/health   # verify
```

### 3. Register in the MCP registry

Edit `~/Documents/_agents/agent-core/primitives/mcp/registry.json`:

```json
{
  "name": "my-tool",
  "description": "What this server does",
  "transport": "http",
  "port": 3097,
  "url": "http://localhost:3097/",
  "source": "~/my-tool/mcp-server/index.ts",
  "runtime": "deno",
  "daemon": "com.jcbbge.my-tool-mcp",
  "surreal_ns": "my-namespace",
  "surreal_db": "my-db",
  "surreal_port": 8000,
  "status": "running",
  "harnesses": ["claude-code", "opencode"]
}
```

Also update `port_allocation` in the registry.

### 4. Deploy

```bash
~/Documents/_agents/agent-core/deploy.sh
```

This updates `~/.claude/mcp.json` and `~/.config/opencode/opencode.json` automatically.

### 5. Update the brain infrastructure doc

`~/Documents/_systems/brain-infrastructure.md` — add the new server to the port allocation table.

---

## SurrealDB Namespace Decision

| Data type | Use |
|-----------|-----|
| Personal memory, identity, sessions | Existing port 8000, new namespace |
| Code index (large, rebuildable) | Separate instance on new port |
| Agent state, todos, workflows | Port 8000, new namespace |

**Rule:** Only create a new SurrealDB instance if the data has genuinely different durability requirements. Otherwise, add a namespace to port 8000.
