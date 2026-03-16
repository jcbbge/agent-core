# Primitive Lifecycle API

Documentation for managing T2 (on-demand) MCP services through the Executor universal orchestrator.

---

## Overview

The Primitive Lifecycle API provides programmatic control over Tier 2 (T2) MCP services — services that run on-demand rather than continuously. Through three executor tools, harnesses can start services when needed, stop them to free resources, and check their current status.

**Key capabilities:**
- Start T2 services with optional health check waiting
- Stop T2 services gracefully with process verification
- Query real-time status (running, healthy, PID, port)
- Automatic idle detection and resource optimization
- Intent-based activation through keyword classification

**Current T2 services:**
- `kotadb` — Code intelligence (symbols, dependencies, semantic search)
- `subagent-mcp` — Agent delegation (reviewer, test-writer, architect, debugger, sigil-distiller)

---

## Architecture: Service Tiers

The AgentCore MCP registry uses three tiers based on usage patterns and resource requirements:

### T1: Always-On

Services that run continuously across all sessions. These form the foundation of the agent harness.

| Service | Port | Purpose |
|---------|------|---------|
| `anima` | 3098 | Personal dev memory — identity, sessions, catalysts |
| `dev-brain` | 3097 | Dev intelligence — todos, threads, thoughts, workspace state |
| `executor` | 8000 | Universal primitive runtime — TypeScript execution |
| `surreal` | 8002 | Unified SurrealDB instance (all namespaces) |
| `ollama` | 11434 | Local LLM inference (optional, when available) |

**Characteristics:**
- Started at boot via launchd
- Never stopped during normal operation
- Required for basic harness functionality

### T2: On-Demand

Services that start when needed and can be stopped to conserve resources. Mediated through the executor orchestrator.

| Service | Port | Daemon Label | Purpose |
|---------|------|--------------|---------|
| `kotadb` | 3099 | `com.jcbbge.kotadb-app` | Code indexing and search |
| `subagent-mcp` | 3096 | `dev.brain.subagent-mcp` | Specialized agent delegation |

**Characteristics:**
- Started via `orchestrator/service_start`
- Stopped via `orchestrator/service_stop`
- Intent-classified activation through keyword triggers
- Automatic stop after idle timeout (configurable)

### T3: Project-Scoped

Services that are only available when working in specific project directories. Managed by external tools (not the executor).

| Service | Project | Purpose |
|---------|---------|---------|
| `HubSpotDev` | `/Users/jcbbge/Infinity/bento` | HubSpot CRM integration |

**Characteristics:**
- Activated by directory presence
- Configured in project `.mcp.json`
- Not controlled by lifecycle API

---

## Executor Tools

Three tools provide complete lifecycle control:

### orchestrator/service_start

Start a T2 service using launchctl.

**Schema:**
```json
{
  "name": "orchestrator/service_start",
  "description": "Start a T2 service (kotadb or subagent-mcp) using launchctl",
  "inputSchema": {
    "name": {
      "type": "string",
      "enum": ["kotadb", "subagent-mcp"]
    },
    "wait_for_healthy": {
      "type": "boolean",
      "default": false,
      "description": "Wait up to 15s for service to become healthy"
    }
  },
  "required": ["name"]
}
```

**Response (ServiceStatus):**
```typescript
{
  running: boolean;    // Process is active
  healthy: boolean;    // Responds to health check
  port: number;       // Service port
  pid?: number;       // Process ID (if running)
  error?: string;     // Error message (if failed)
}
```

**Example:**
```json
{
  "name": "kotadb",
  "wait_for_healthy": true
}
```

### orchestrator/service_stop

Stop a T2 service using launchctl.

**Schema:**
```json
{
  "name": "orchestrator/service_stop",
  "description": "Stop a T2 service (kotadb or subagent-mcp) using launchctl",
  "inputSchema": {
    "name": {
      "type": "string",
      "enum": ["kotadb", "subagent-mcp"]
    }
  },
  "required": ["name"]
}
```

**Response:** Same ServiceStatus format as start.

**Example:**
```json
{
  "name": "subagent-mcp"
}
```

### orchestrator/service_status

Check current status of a T2 service.

**Schema:**
```json
{
  "name": "orchestrator/service_status",
  "description": "Check status of a T2 service (kotadb or subagent-mcp)",
  "inputSchema": {
    "name": {
      "type": "string",
      "enum": ["kotadb", "subagent-mcp"]
    }
  },
  "required": ["name"]
}
```

**Response:** ServiceStatus with current state.

**Example output:**
```
Running: true
Healthy: true
Port: 3099
PID: 12345
```

---

## Adding New T2 Services

To add a new on-demand service, follow these steps:

### Step 1: Add to registry.json

Add a new entry in the `servers` array with `"tier": "T2"` and `triggers` for intent classification:

```json
{
  "name": "my-service",
  "description": "What this service does",
  "tool_count": 5,
  "transport": "http",
  "port": 3100,
  "url": "http://localhost:3100/",
  "source": "~/path/to/service.ts",
  "runtime": "bun",
  "daemon": "com.jcbbge.my-service",
  "status": "pending",
  "default_enabled": false,
  "harnesses": ["claude-code", "opencode", "omp", "slate"],
  "disable_when": "context for when to disable",
  "tier": "T2",
  "triggers": ["keyword1", "keyword2", "related-term"]
}
```

**Key fields:**
- `tier`: Must be `"T2"`
- `triggers`: Keywords that trigger auto-start via intent classification
- `daemon`: Unique launchd label (reverse DNS format)
- `port`: Unique port (check `port_allocation` section)
- `default_enabled`: Always `false` for T2 services

### Step 2: Add Daemon to Core Script

Add the service daemon to `~/.brain/core.sh` (or equivalent boot script):

```bash
# Add to DAEMONS array or start function
DAEMONS=(
  "com.jcbbge.anima-mcp"
  "com.jcbbge.dev-brain-mcp"
  "dev.brain.executor"
  "com.jcbbge.kotadb-app"
  "dev.brain.subagent-mcp"
  "com.jcbbge.my-service"  # <-- New service
)
```

Create the launchd plist at `~/Library/LaunchAgents/com.jcbbge.my-service.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.jcbbge.my-service</string>
  <key>ProgramArguments</key>
  <array>
    <string>/path/to/runtime</string>
    <string>/path/to/service.ts</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PORT</key>
    <string>3100</string>
  </dict>
  <key>RunAtLoad</key>
  <false/>
  <key>KeepAlive</key>
  <false/>
  <key>StandardOutPath</key>
  <string>/tmp/my-service.log</string>
  <key>StandardErrorPath</key>
  <string>/tmp/my-service.error.log</string>
</dict>
</plist>
```

**Note:** `RunAtLoad` and `KeepAlive` should be `false` for T2 services (started on-demand).

### Step 3: Add to orchestrator.ts serviceConfigs

Extend `T2_SERVICES` in `~/executor/packages/executor-mcp/src/orchestrator.ts`:

```typescript
const T2_SERVICES = {
  kotadb: {
    name: "kotadb",
    port: 3099,
    daemon: "com.jcbbge.kotadb-app",
  },
  "subagent-mcp": {
    name: "subagent-mcp",
    port: 3096,
    daemon: "dev.brain.subagent-mcp",
  },
  "my-service": {           // <-- New service
    name: "my-service",
    port: 3100,
    daemon: "com.jcbbge.my-service",
  },
} as const;
```

Update the schema to include the new service:

```typescript
const serviceNameSchema = z.enum([
  "kotadb",
  "subagent-mcp",
  "my-service"  // <-- Add here
]);
```

### Step 4: Create Toggle Command

Create `~/Documents/_agents/schema/commands/my-service.md`:

```yaml
---
name: myservice
description: Toggle MyService on/off and check status. Use '/myservice on' to start, '/myservice off' to stop, '/myservice status' for current state.
---

Toggle MyService (Tier 2 service) lifecycle.

## Usage

```
/myservice on      - Start the MyService
/myservice off     - Stop the MyService
/myservice status  - Show current state
```

## Implementation

The command calls executor lifecycle tools:
- `orchestrator/service_start` with `{ "name": "my-service" }`
- `orchestrator/service_stop` with `{ "name": "my-service" }`
- `orchestrator/service_status` with `{ "name": "my-service" }`

### Manual Fallback

If executor lifecycle tools are not available:

```bash
# Start manually
launchctl start com.jcbbge.my-service

# Stop manually
launchctl stop com.jcbbge.my-service

# Check status
curl http://localhost:3100/health
```
```

### Step 5: Add Health Check Method (if needed)

Most T2 services use one of two health check patterns:

**For MCP StreamableHTTP (ports 3096, 8000):**
- TCP port connect (not HTTP GET)
- Implemented in `tcpHealthCheck()` function

**For REST HTTP (ports 3097, 3098, 3099):**
- HTTP GET `/health` endpoint
- Returns 200 OK with JSON status

If your service uses a different protocol, add a new health check function to `orchestrator.ts`:

```typescript
const customHealthCheck = async (port: number): Promise<boolean> => {
  // Implementation for your protocol
};
```

---

## Health Check Methods

Different services use different health check strategies based on their transport protocol.

### MCP StreamableHTTP Services

Services using MCP StreamableHTTP transport (ports 3096, 8000):

**Method:** TCP port connect
**Why:** MCP StreamableHTTP uses Server-Sent Events (SSE) and POST requests. A simple TCP connect confirms the HTTP server is listening without triggering protocol errors.

**Implementation:**
```typescript
const tcpHealthCheck = async (port: number, timeoutMs = 5000): Promise<boolean> => {
  const { promise, resolve } = Promise.withResolvers<boolean>();
  const socket = createConnection({ port });
  
  const timeout = setTimeout(() => {
    socket.destroy();
    resolve(false);
  }, timeoutMs);
  
  socket.on("connect", () => {
    clearTimeout(timeout);
    socket.end();
    resolve(true);
  });
  
  socket.on("error", () => {
    clearTimeout(timeout);
    resolve(false);
  });
  
  return promise;
};
```

### REST HTTP Services

Services using standard REST HTTP (ports 3097, 3098, 3099):

**Method:** HTTP GET `/health`
**Why:** Standard REST endpoints expose health status via GET request.

**Example:**
```bash
curl http://localhost:3099/health
# Returns: {"status": "healthy", "timestamp": "..."}
```

---

## Intent Classification

T2 services support automatic activation based on user intent. The system uses keyword-based classification to determine when to auto-start a service.

### Current Trigger Patterns

| Service | Triggers |
|---------|----------|
| `kotadb` | `search`, `symbol`, `semantic`, `dependency`, `ast`, `code intelligence` |
| `subagent-mcp` | `delegate`, `review`, `test`, `architect`, `debug` |

### How It Works

1. User sends a message
2. System scans for trigger keywords
3. If trigger matches a stopped T2 service:
   - Auto-call `orchestrator/service_start`
   - Wait for healthy status
   - Proceed with original request

4. If no triggers match, service remains stopped (saving resources)

### Adding New Triggers

To add triggers for a new T2 service, include them in registry.json:

```json
{
  "name": "my-service",
  "tier": "T2",
  "triggers": ["feature1", "feature2", "use-case"]
}
```

### Future: Ollama-Based Classification

The current keyword system is a fast-path optimization. Future versions may use local LLM classification through Ollama for:
- Semantic intent understanding (beyond keyword matching)
- Confidence scoring for service activation
- Complex multi-service activation patterns
- Context-aware classification (previous messages, file types)

---

## Examples

### Start KotaDB Before Semantic Search

```typescript
// 1. Check current status
const status = await fetch('http://localhost:8000/tools/call', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'orchestrator/service_status',
    arguments: { name: 'kotadb' }
  })
}).then(r => r.json());

// 2. Start if not running
if (!status.structuredContent.running) {
  await fetch('http://localhost:8000/tools/call', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'orchestrator/service_start',
      arguments: { name: 'kotadb', wait_for_healthy: true }
    })
  });
}

// 3. Now safe to use KotaDB tools
const results = await fetch('http://localhost:8000/tools/call', {
  method: 'POST',
  body: JSON.stringify({
    name: 'kotadb/semantic_search',
    arguments: { query: 'authentication middleware' }
  })
});
```

### Stop KotaDB After 30min Idle

```typescript
// Track last query time
let lastQueryTime = Date.now();

// On each KotaDB tool call
lastQueryTime = Date.now();

// Background idle check (run periodically)
const checkIdle = async () => {
  const IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  const now = Date.now();
  
  if (now - lastQueryTime > IDLE_TIMEOUT) {
    await fetch('http://localhost:8000/tools/call', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'orchestrator/service_stop',
        arguments: { name: 'kotadb' }
      })
    });
  }
};

// Run every 5 minutes
setInterval(checkIdle, 5 * 60 * 1000);
```

### Delegate to Subagent, Auto-Start if Needed

```typescript
// 1. Try to delegate directly (fails if subagent-mcp not running)
const tryDelegate = async () => {
  try {
    return await fetch('http://localhost:8000/tools/call', {
      method: 'POST',
      body: JSON.stringify({
        name: 'subagent-mcp/subagents_delegate',
        arguments: {
          agent: 'reviewer',
          input: 'Review this code for security issues...'
        }
      })
    });
  } catch (err) {
    // 2. If failed, try starting the service
    const startResult = await fetch('http://localhost:8000/tools/call', {
      method: 'POST',
      body: JSON.stringify({
        name: 'orchestrator/service_start',
        arguments: { name: 'subagent-mcp', wait_for_healthy: true }
      })
    });
    
    if (startResult.structuredContent?.healthy) {
      // 3. Retry the delegation
      return await tryDelegate();
    }
    
    throw new Error('Failed to start subagent-mcp');
  }
};
```

---

## Error Handling

### Service Already Running

When starting a service that's already running:

**Response:**
```
Running: true
Healthy: true
Port: 3099
PID: 12345
```

**Behavior:** Not an error. Returns current status. Caller can proceed normally.

### Service Already Stopped

When stopping a service that's already stopped:

**Response:**
```
Running: false
Healthy: false
Port: 3099
```

**Behavior:** Not an error. Returns stopped status. Caller can proceed normally.

### Launchctl Failures

When launchctl start/stop fails:

**Response:**
```
Running: false
Healthy: false
Port: 3099
Error: launchctl start failed: service not found
```

**Possible causes:**
- Daemon label mismatch (check `daemon` field in registry.json)
- Missing launchd plist file
- Permission issues
- Port already in use by different process

**Resolution:** Check manual fallback commands.

### Health Check Timeout

When `wait_for_healthy: true` but service doesn't become healthy:

**Response:**
```
Running: true
Healthy: false
Port: 3099
PID: 12345
```

**Behavior:** Service started but not responding to health checks. May indicate:
- Service crashed after start
- Wrong health check method for protocol
- Service listening on wrong port

### Port Conflicts

When another process is using the service port:

**Detection:** `getPidForPort()` returns PID, but daemon check shows different state.

**Resolution:**
```bash
# Find process using the port
lsof -ti :3099

# Kill conflicting process (if safe)
kill -9 <PID>

# Restart service via executor
```

---

## Manual Fallback

When executor tools are unavailable, use direct launchctl commands:

### Start a Service

```bash
launchctl start com.jcbbge.kotadb-app
launchctl start dev.brain.subagent-mcp
```

### Stop a Service

```bash
launchctl stop com.jcbbge.kotadb-app
launchctl stop dev.brain.subagent-mcp
```

### Check Service Status

```bash
# Check launchd state
launchctl list com.jcbbge.kotadb-app

# Check if port is listening
lsof -ti :3099

# Check process
ps aux | grep kotadb

# Health check (for REST services)
curl http://localhost:3099/health
```

### Verify Launchd Configuration

```bash
# List all custom launchd services
launchctl list | grep com.jcbbge
launchctl list | grep dev.brain

# Load a plist (if not loaded)
launchctl load ~/Library/LaunchAgents/com.jcbbge.my-service.plist

# Unload a plist
launchctl unload ~/Library/LaunchAgents/com.jcbbge.my-service.plist
```

---

## Troubleshooting

### Service Won't Start

**Symptoms:** `orchestrator/service_start` returns `running: false`

**Checklist:**
1. Verify daemon label matches plist: `launchctl list | grep <daemon>`
2. Check plist exists: `ls ~/Library/LaunchAgents/<daemon>.plist`
3. Check port availability: `lsof -ti :<port>`
4. Review service logs: `tail /tmp/<service>.*.log`
5. Try manual start: `launchctl start <daemon>`

### Service Won't Stop

**Symptoms:** `orchestrator/service_stop` returns `running: true` after timeout

**Checklist:**
1. Force kill: `kill -9 <PID>`
2. Check for zombie processes: `ps aux | grep <service>`
3. Verify port released: `lsof -ti :<port>` (should return nothing)

### Health Check Fails

**Symptoms:** Service running (`running: true`) but not healthy (`healthy: false`)

**Checklist:**
1. Verify correct health check method:
   - MCP StreamableHTTP: TCP connect only
   - REST HTTP: GET /health
2. Check service logs for startup errors
3. Manual health check:
   ```bash
   # For REST
   curl -v http://localhost:<port>/health
   
   # For MCP StreamableHTTP
   nc -zv localhost <port>
   ```

### Executor Not Responding

**Symptoms:** All executor tool calls fail

**Checklist:**
1. Verify executor running: `curl http://localhost:8000/health`
2. Check executor logs: `tail /tmp/executor.log`
3. Restart executor: `launchctl stop dev.brain.executor && launchctl start dev.brain.executor`
4. Use manual fallback commands

### Intent Classification Not Working

**Symptoms:** Service doesn't auto-start on trigger keywords

**Checklist:**
1. Verify triggers in registry.json
2. Check keyword matches exactly (case-insensitive)
3. Verify classification logic is enabled in harness
4. Test with explicit `/kota on` or `/subagent on` command

---

## Port Allocation Reference

| Port | Service | Protocol |
|------|---------|----------|
| 8002 | SurrealDB | Database |
| 8000 | Executor | MCP StreamableHTTP |
| 3099 | KotaDB | REST HTTP |
| 3098 | Anima | REST HTTP |
| 3097 | Dev-Brain | REST HTTP |
| 3096 | Subagent-MCP | MCP StreamableHTTP |

**Adding new T2 services:** Use ports 3100+ to avoid conflicts.

---

*Last updated: 2026-03-16*
