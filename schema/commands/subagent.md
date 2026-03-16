---
name: subagent
description: Toggle Subagent-MCP service on/off, check status, or list available agents. Use '/subagent on' to start agent delegation, '/subagent off' to stop, '/subagent status' for stats, '/subagent list' for available agents.
---

Toggle Subagent-MCP (Tier 2 agent delegation service) lifecycle.

## Usage

```
/subagent on      - Start the Subagent-MCP service
/subagent off     - Stop the Subagent-MCP service
/subagent status  - Show current state, request count, and idle time
/subagent list    - Show available specialized agents
```

## Available Agents

When Subagent-MCP is running, the following agents are available:

| Agent | Purpose |
|-------|---------|
| `reviewer` | Code review for bugs, security issues, logic errors |
| `test-writer` | Write tests for completed implementations |
| `architect` | System design and architecture decisions |
| `debugger` | Investigate failing tests and error traces |
| `sigil-distiller` | Process inbox items into agent-core primitives |

## Implementation

The command calls executor lifecycle tools at `http://localhost:8000`:
- `orchestrator/service_start` with `{ "service": "subagent" }`
- `orchestrator/service_stop` with `{ "service": "subagent" }`
- `orchestrator/service_status` with `{ "service": "subagent" }`

### Tool Availability Check

Before calling, verify executor tools exist:
```javascript
// Check tools/list for orchestrator/service_start, orchestrator/service_stop
const tools = await fetch('http://localhost:8000/tools/list').then(r => r.json());
const hasLifecycle = tools.tools.some(t => t.name === 'orchestrator/service_start');
```

### Edge Cases

- **Already running** → Response: "Subagent-MCP is already running" (not an error)
- **Already stopped** → Response: "Subagent-MCP is already stopped" (not an error)
- **Executor not responding** → Show error with manual fallback

### Manual Fallback

If executor lifecycle tools are not available:

```bash
# Start Subagent-MCP manually
launchctl start dev.brain.subagent-mcp

# Stop Subagent-MCP manually
launchctl stop dev.brain.subagent-mcp

# Check status
curl http://localhost:3096/health
```

### Health Check

MCP StreamableHTTP health: TCP port connect to `localhost:3096` (not HTTP GET)

## Response Format

- `/subagent on`: "Subagent-MCP started" or "Subagent-MCP is already running"
- `/subagent off`: "Subagent-MCP stopped" or "Subagent-MCP is already stopped"
- `/subagent status`: State, request count since start, idle time since last request
- `/subagent list`: Table of 5 available agents with descriptions
