## Orchestrator Integration

OpenCode uses the **executor** (port 8000) as the primary gateway for all MCP services. The executor provides unified tool catalog access and lifecycle management for Tier 2 services.

### Service Tiers

| Tier | Services | Behavior |
|------|----------|----------|
| **T1** | anima, dev-brain, executor | Always-on, auto-discovered |
| **T2** | kotadb, subagent-mcp | On-demand, toggle via commands |
| **T3** | project-scoped | Auto-discovered per-project |

### Minimal opencode.json

Configure only the executor; other services auto-discover:

```json
{
  "mcp": {
    "executor": {
      "type": "http",
      "url": "http://127.0.0.1:8000/mcp",
      "enabled": true
    }
  }
}
```

### T2 Service Commands

Toggle on-demand services via slash commands:

```
/kota on       # Start KotaDB for code intelligence
/kota off      # Stop to free context window budget
/kota status   # Show query count and idle time

/subagent on   # Start agent delegation
/subagent off  # Stop subagent service
/subagent list # Show available specialized agents
```

The executor's orchestrator tools (`orchestrator/service_start`, `orchestrator/service_stop`, `orchestrator/service_status`) manage T2 service lifecycles.

### Health Checks

Executor uses TCP port connect (not HTTP GET) for MCP StreamableHTTP health checks on T2 services.

# Harness: OpenCode

| Field | Value |
|-------|-------|
| Name | opencode |
| Config dir | `~/.config/opencode/` |
| Status | active |
| Docs | https://opencode.ai/docs |

## Config Files

```
~/.config/opencode/AGENTS.md        — global agent identity + rules (always loaded)
~/.config/opencode/opencode.json    — main config: MCP, models, skills paths (JSONC)
~/.config/opencode/skills/          — skill library (one subdir per skill)
~/.config/opencode/commands/        — slash commands
~/.config/opencode/agents/          — subagent definitions
~/.config/opencode/plugins/*.ts     — TypeScript hooks
```

## Primitive Update Procedures

### Agent File + Rules (`~/.config/opencode/AGENTS.md`)
Copy `schema/agent-file/AGENTS.md` → `~/.config/opencode/AGENTS.md`. Straight copy.
Rules do not have a separate directory in OpenCode — all rules live in AGENTS.md.
To update rules: overwrite `~/.config/opencode/AGENTS.md`.

### MCP Servers (`~/.config/opencode/opencode.json` → `mcp`)
Format:
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
To add a server: edit `~/.config/opencode/opencode.json`, add entry under `mcp`.
Use `registry.json` for URL and port. `enabled: true` is required.
File is JSONC — comments allowed, but write valid JSON when editing programmatically.

### Skills (`~/.config/opencode/skills/[name]/`)
Each skill is a directory. Copy `schema/skills/[name]/` → `~/.config/opencode/skills/[name]/`.
Skills are also auto-discovered from `~/.claude/skills/` — Claude Code and OpenCode share the same skill library. Updating `~/.claude/skills/` covers both.

### Commands (`~/.config/opencode/commands/[name].md`)
OpenCode reads commands from `~/.claude/commands/` natively (shared with Claude Code).
Updating commands in `~/.claude/commands/` covers both harnesses. No separate copy needed.

### Hooks (`~/.config/opencode/plugins/*.ts`)
OpenCode hooks are TypeScript plugins, not shell scripts. Source: `schema/hooks/` (if OpenCode-specific `.ts` files exist there).
Format:
```typescript
export default function(ctx) {
  return {
    "UserPromptSubmit": async (event) => { /* ... */ },
    "Stop": async (event) => { /* ... */ }
  }
}
```

### Subagents (`~/.config/opencode/agents/[name].md`)
OpenCode reads agents from `~/.claude/agents/` natively (shared with Claude Code).
Updating `~/.claude/agents/` covers both harnesses. No separate copy needed.

## Reload Requirements

| Primitive | Takes effect |
|-----------|-------------|
| AGENTS.md (rules) | Next message — no restart |
| Skills | On startup — restart to pick up new skills |
| Commands | On startup |
| MCP servers | Restart OpenCode |
| Plugins (hooks) | Restart OpenCode |
| Subagents | On startup |

## Quirks

- JSONC format: `opencode.json` allows `//` comments. Valid JSON when reading programmatically — strip comments before parsing.
- Skills: OpenCode reads from both `~/.config/opencode/skills/` AND `~/.claude/skills/`. Prefer updating `~/.claude/skills/` since it covers both.
- Commands + agents: shared with Claude Code via `~/.claude/`. No duplication needed.
- MCP `enabled: true` is required — servers without it are ignored.
