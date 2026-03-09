# MCP Server Reference Guide

Framework-agnostic guide for building, installing, and using MCP servers. Special notes for Claude Code and Opencode included.

---

## 1. What is MCP

**Model Context Protocol (MCP)** is a standard for exposing tools to AI agents. Think of it as a plugin system that works across different harnesses/providers.

### Core Concepts

| Concept | Description |
|---------|-------------|
| **Server** | A persistent daemon that exposes tools |
| **Tool** | A callable function with JSON Schema input |
| **Transport** | How the agent talks to the server (HTTP or stdio) |
| **Registry** | The source-of-truth for which servers exist and where they deploy |

### HTTP vs STDIO Transport

| Transport | Persistence | Orphan Risk | Token Cost | Recommendation |
|-----------|-------------|-------------|------------|----------------|
| **HTTP** | Single daemon, all clients share | None | ~50 tokens/call | **Always use this** |
| **STDIO** | New process per session | High — hangs on crash | ~1050 tokens/call | Avoid if possible |

**Why HTTP wins:** STDIO spawns a new process for every client connection. If the client disconnects uncleanly (tab close, crash, signal), the process hangs indefinitely. With 4+ harnesses, 10 sessions/day = 40 orphaned processes consuming memory and file descriptors.

HTTP is one persistent daemon. All harness instances share it. Zero orphan risk. Lower token overhead.

---

## 2. MCP Server Architecture

### Required Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/health` | Health check — returns `{"status":"ok"}` |
| `POST` | `/` or `/mcp` | JSON-RPC 2.0 request handling |

### JSON-RPC Methods

| Method | Request | Response |
|--------|---------|----------|
| `initialize` | `{jsonrpc:"2.0",id,method:"initialize",params:{}}` | Protocol info |
| `tools/list` | `{jsonrpc:"2.0",id,method:"tools/list"}` | Array of tool definitions |
| `tools/call` | `{jsonrpc:"2.0",id,method:"tools/call",params:{name,arguments}}` | Tool result |

### Tool Definition Format

```json
{
  "name": "my_tool_name",
  "description": "What this tool does — visible to the AI",
  "inputSchema": {
    "type": "object",
    "properties": {
      "param1": {
        "type": "string",
        "description": "What this parameter does"
      }
    },
    "required": ["param1"]
  }
}
```

### Response Format

```json
{
  "jsonrpc": "2.0",
  "id": 123,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "JSON stringified result here"
      }
    ]
  }
}
```

---

## 3. Building an MCP Server

### Minimal Example (Deno/TypeScript)

```typescript
// ~/my-tool/mcp-server/index.ts
const PORT = 3097; // Pick from port allocation

const TOOLS = [
  {
    name: "my_tool",
    description: "Does something useful",
    inputSchema: {
      type: "object",
      properties: {
        input: { type: "string" }
      },
      required: ["input"]
    }
  }
];

async function dispatch(msg: Record<string, unknown>) {
  const { id, method, params } = msg as any;

  if (method === "initialize") {
    return {
      jsonrpc: "2.0", id,
      result: {
        protocolVersion: "2024-11-05",
        serverInfo: { name: "my-tool", version: "1.0.0" },
        capabilities: { tools: {} }
      }
    };
  }

  if (method === "tools/list") {
    return { jsonrpc: "2.0", id, result: { tools: TOOLS } };
  }

  if (method === "tools/call") {
    const toolName = params?.name;
    const args = params?.arguments ?? {};
    
    // Route to your handler
    const result = await handleTool(toolName, args);
    
    return {
      jsonrpc: "2.0", id,
      result: {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      }
    };
  }

  return null;
}

// HTTP server
Deno.serve({ port: PORT, hostname: "127.0.0.1" }, async (req) => {
  if (req.method === "GET" && new URL(req.url).pathname === "/health") {
    return new Response(JSON.stringify({ status: "ok" }), {
      headers: { "content-type": "application/json" }
    });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const body = await req.json();
  const response = await dispatch(body);
  
  if (response === null) {
    return new Response(null, { status: 204 });
  }

  return new Response(JSON.stringify(response), {
    headers: { "content-type": "application/json" }
  });
});
```

### Port Allocation (from registry.json)

| Port | Assigned |
|------|----------|
| 3099 | kotadb MCP |
| 3098 | anima MCP |
| 3097 | **Next available** |
| 3096 | Reserved |

---

## 4. Installation & Deployment

### Step 1: Create Launchd Plist

`~/Library/LaunchAgents/com.jcbbge.my-tool-mcp.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.jcbbge.my-tool-mcp</string>

  <key>ProgramArguments</key>
  <array>
    <string>/opt/homebrew/bin/deno</string>
    <string>run</string>
    <string>--allow-net</string>
    <string>--allow-env</string>
    <string>--allow-read</string>
    <string>/Users/jcbbge/my-tool/mcp-server/index.ts</string>
  </array>

  <key>EnvironmentVariables</key>
  <dict>
    <key>MY_TOOL_PORT</key>
    <string>3097</string>
    <key>SURREAL_URL</key>
    <string>ws://127.0.0.1:8000/rpc</string>
    <key>SURREAL_NS</key>
    <string>my-namespace</string>
    <key>SURREAL_DB</key>
    <string>my-db</string>
    <key>SURREAL_USER</key>
    <string>root</string>
    <key>SURREAL_PASS</key>
    <string>root</string>
  </dict>

  <key>WorkingDirectory</key>
  <string>/Users/jcbbge/my-tool</string>

  <key>RunAtLoad</key>
  <true/>

  <key>KeepAlive</key>
  <true/>

  <key>ThrottleInterval</key>
  <integer>5</integer>

  <key>StandardOutPath</key>
  <string>/Users/jcbbge/.my-tool/mcp.log</string>

  <key>StandardErrorPath</key>
  <string>/Users/jcbbge/.my-tool/mcp.log</string>
</dict>
</plist>
```

### Step 2: Load and Start

```bash
mkdir -p ~/.my-tool
launchctl load ~/Library/LaunchAgents/com.jcbbge.my-tool-mcp.plist
curl http://127.0.0.1:3097/health  # Should return {"status":"ok"}
```

### Bun Alternative (instead of Deno)

If using Bun:
```xml
<key>ProgramArguments</key>
<array>
  <string>/opt/homebrew/bin/bun</string>
  <string>run</string>
  <string>/Users/jcbbge/my-tool/src/index.ts</string>
</array>
```

---

## 5. Registration in Agent-Core

### Step 1: Add to Registry

Edit `/Users/jcbbge/Documents/_agents/primitives/mcp/registry.json`:

```json
{
  "servers": [
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
      "default_enabled": true,
      "harnesses": ["claude-code", "opencode"]
    }
  ],
  "port_allocation": {
    "3097": "my-tool MCP HTTP"
  }
}
```

### Step 2: Deploy

```bash
cd ~/Documents/_agents
bash deploy.sh
```

This updates:
- `~/.claude/mcp.json` (Claude Code)
- `~/.config/opencode/opencode.json` (Opencode)
- Any other configured harnesses

---

## 6. Framework-Specific Notes

### Claude Code

**Config location:** `~/.claude/mcp.json`

**Format:**
```json
{
  "mcpServers": {
    "server-name": {
      "type": "http",
      "url": "http://localhost:PORT/"
    }
  }
}
```

**Key notes:**
- HTTP strongly preferred; stdio spawns orphans
- `type: "http"` required
- URL must include trailing slash
- Restart Claude Code to pick up MCP changes

### Opencode

**Config location:** `~/.config/opencode/opencode.json` under `"mcp"` key

**Format:**
```json
{
  "mcp": {
    "server-name": {
      "type": "http",
      "url": "http://localhost:PORT/",
      "enabled": true
    }
  }
}
```

**Key notes:**
- HTTP type is `"http"`, stdio type is `"local"` (avoid)
- Must include `"enabled": true`
- Changes take effect on next session (no restart needed)
- Plugins are TypeScript files in `~/.config/opencode/plugins/`

### Other Frameworks

**General principles:**
1. Use HTTP transport when available
2. Register in `registry.json` under `"harnesses"` array
3. Create adapter in `harnesses/[name]/adapter.sh`
4. Format varies by framework but concept is identical

---

## 7. Testing & Verification

### Health Check

```bash
curl http://127.0.0.1:3097/health
# Expected: {"status":"ok"}
```

### Tool Listing

```bash
curl -X POST http://127.0.0.1:3097/ \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

### Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `Connection refused` | Daemon not running | Check launchctl status |
| `404 Not Found` | Wrong path | Verify POST to `/` or `/mcp` |
| `Invalid JSON` | Response formatting | Check jsonrpc, id, content array |
| Tools not appearing | Registry mismatch | Verify harness in registry.json |

---

## 8. Migration: STDIO → HTTP

### Why Migrate

- STDIO spawns per-session orphan processes
- HTTP is persistent, shared, zero orphan risk
- Lower token overhead per call

### Migration Steps

1. **Reserve port** in `registry.json` `port_allocation`
2. **Convert server** to HTTP (add Deno.serve or Bun.serve)
3. **Update launchd plist** — no command change needed, just the server code
4. **Update registry** — change `"transport": "stdio"` to `"transport": "http"`, add `"port": N`
5. **Add to harnesses** — ensure `"harnesses"` array includes all target harnesses
6. **Deploy** — run `bash deploy.sh`
7. **Clean up** — kill old stdio processes: `pkill -f "mcp-server/index.ts"`

---

## References

- `/Users/jcbbge/Documents/_agents/brain-infrastructure.md` — Architecture overview and SurrealDB patterns
- `/Users/jcbbge/Documents/_agents/primitives/mcp/registry.json` — Source of truth for all MCP servers
- `/Users/jcbbge/Documents/_agents/harnesses/claude-code/adapter.sh` — Working Claude Code adapter
- `/Users/jcbbge/Documents/_agents/harnesses/opencode/adapter.sh` — Working Opencode adapter