# Pi + Anima Integration

**Date:** April 2, 2026 (updated April 3, 2026)
**Status:** ✅ Complete — routing through executor gateway
**Architecture:** Executor MCP gateway (port 8000)

---

## Current Architecture

```
┌──────────────────────────────────────┐
│  Pi Session                          │
│  ├─ Built-in tools (read/write/edit) │
│  └─ anima-mcp extension              │
│     └─ HTTP POST to executor :8000   │
└──────────────────────────────────────┘
                 ↓
┌──────────────────────────────────────┐
│  Executor MCP Gateway (port 8000)    │
│  ├─ execute (runs TS sandbox)        │
│  └─ tools["anima.*"] available       │
└──────────────────────────────────────┘
                 ↓
┌──────────────────────────────────────┐
│  Anima MCP Server (port 3098)        │
│  (registered as brain-layer source)  │
└──────────────────────────────────────┘
```

**Extension location:** `~/.pi/agent/extensions/anima-mcp/index.ts`
**Executor URL:** `http://127.0.0.1:8000/mcp`

## Registered Tools (5)

| Tool | Executor call |
|------|--------------|
| `anima_bootstrap` | `executor.primitives.bootstrap` |
| `anima_store` | `anima.anima_store` |
| `anima_query` | `anima.anima_query` |
| `anima_session_close` | `anima.anima_session_close` |
| `anima_inspect` | `anima.anima_inspect` |

## Deprecation Notice

Direct connection to Anima MCP (port 3098) from Pi is **deprecated**.
All access goes through executor gateway. Do not revert to direct connection.

## Executor Daemon

- **Daemon:** `dev.brain.executor` (launchd)
- **Start script:** `~/bin/executor-start.sh`
- **Startup:** kills stale port 8000 processes, starts executor, seeds brain layers

## Troubleshooting

### executor tools return "Control-plane persistence failed"
The executor process is stale (manually started, not launchd-managed). Fix:
```bash
pkill -f "executor.*main.ts"
launchctl unload ~/Library/LaunchAgents/dev.brain.executor.plist
launchctl load ~/Library/LaunchAgents/dev.brain.executor.plist
```

### Verify executor is up
```bash
curl -sf http://127.0.0.1:8000/v1/local/installation -H "Accept: application/json" && echo UP
```
