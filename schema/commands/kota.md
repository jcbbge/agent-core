---
name: kota
description: Toggle KotaDB service on/off and check status. Use '/kota on' to start code intelligence, '/kota off' to stop, '/kota status' to see current state and usage stats.
---

Toggle KotaDB (Tier 2 code intelligence service) lifecycle.

## Usage

```
/kota on      - Start the KotaDB service
/kota off     - Stop the KotaDB service
/kota status  - Show current state, last query count, and idle time
```

## Implementation

The command calls executor lifecycle tools at `http://localhost:8000`:
- `orchestrator/service_start` with `{ "service": "kotadb" }`
- `orchestrator/service_stop` with `{ "service": "kotadb" }`
- `orchestrator/service_status` with `{ "service": "kotadb" }`

### Tool Availability Check

Before calling, verify executor tools exist:
```javascript
// Check tools/list for orchestrator/service_start, orchestrator/service_stop
const tools = await fetch('http://localhost:8000/tools/list').then(r => r.json());
const hasLifecycle = tools.tools.some(t => t.name === 'orchestrator/service_start');
```

### Edge Cases

- **Already running** → Response: "KotaDB is already running" (not an error)
- **Already stopped** → Response: "KotaDB is already stopped" (not an error)
- **Executor not responding** → Show error with manual fallback

### Manual Fallback

If executor lifecycle tools are not available:

```bash
# Start KotaDB manually
launchctl start com.jcbbge.kotadb-app

# Stop KotaDB manually
launchctl stop com.jcbbge.kotadb-app

# Check status
curl http://localhost:3099/health
```

### Health Check

MCP StreamableHTTP health: TCP port connect to `localhost:3099` (not HTTP GET)

## Response Format

- `/kota on`: "KotaDB started" or "KotaDB is already running"
- `/kota off`: "KotaDB stopped" or "KotaDB is already stopped"
- `/kota status`: State, query count since start, idle time since last query
