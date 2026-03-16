## Orchestrator Integration

Claude Code has native MCP support via `~/.claude.json`. The **executor** (port 8000) provides lifecycle management for Tier 2 services.

### Service Tiers

| Tier | Services | Behavior |
|------|----------|----------|
| **T1** | anima, dev-brain, executor | Always-on, native MCP config |
| **T2** | kotadb, subagent-mcp | On-demand, toggle via executor commands |
| **T3** | project-scoped (e.g., HubSpotDev) | Auto-discovered per-project |

### T2 Service Toggling

Use toggle commands to start/stop Tier 2 services on-demand:

```
/kota on       # Start KotaDB code intelligence
/kota off      # Stop KotaDB to free context budget
/kota status   # Check if running, query count, idle time

/subagent on   # Start subagent delegation service
/subagent off  # Stop subagent service
/subagent list # Show available agents (reviewer, test-writer, etc.)
```

### Example: Code Search Session

Before searching code, ensure KotaDB is running:

```
/kota on
Search for symbol "createDatabase"
```

Claude Code's native MCP configuration remains the source of truth for T1 services. Tier 2 services are auto-discovered via executor when toggled on.

# Harness: Claude Code

| Field | Value |
|-------|-------|
| Name | claude-code |
| Config dir | `~/.claude/` |
| Status | active |
| Docs | https://docs.anthropic.com/en/docs/claude-code |

## Config Files

```
~/.claude/CLAUDE.md          — global agent identity (always loaded)
~/.claude/rules/*.md         — always-loaded rule files
~/.claude/settings.json      — hooks, permissions
~/.claude.json               — MCP server registrations
~/.claude/skills/            — skill library (one subdir per skill)
~/.claude/commands/          — slash commands
~/.claude/agents/            — subagent definitions
```

## Primitive Update Procedures

### Agent File (`~/.claude/CLAUDE.md`)
Copy `schema/agent-file/AGENTS.md` → `~/.claude/CLAUDE.md`. Straight copy — no format translation.

### Rules (`~/.claude/rules/`)
Each file in `schema/rules/*.md` → `~/.claude/rules/[same-filename].md`. Straight copy.
To add a new rule: copy the new `.md` from schema to `~/.claude/rules/`.
To update a rule: overwrite the matching file in `~/.claude/rules/`.

### MCP Servers (`~/.claude.json` → `mcpServers`)
Format:
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
To add a server: edit `~/.claude.json`, add an entry under `mcpServers`.
Use `registry.json` for URL and port. Use `type: "http"` for all AgentCore servers.

### Skills (`~/.claude/skills/[name]/`)
Each skill is a directory. Copy the whole dir: `schema/skills/[name]/` → `~/.claude/skills/[name]/`.
To add a skill: copy the skill directory.
To update a skill: overwrite the directory contents.

### Commands (`~/.claude/commands/[name].md`)
Each command is a single `.md` file. Copy `schema/commands/[name].md` → `~/.claude/commands/[name].md`.

### Hooks (`settings.json` → `hooks`)
Format in `~/.claude/settings.json`:
```json
{
  "hooks": {
    "EventName": [
      { "matcher": "", "hooks": [{ "type": "command", "command": "bash script" }] }
    ]
  }
}
```
Source: `schema/hooks/claude-code.json`. Merge the `hooks` key into `settings.json`.

### Subagents (`~/.claude/agents/[name].md`)
Copy `schema/subagents/[name].md` → `~/.claude/agents/[name].md`.
Skip: `AGENTS.md`, `README.md` — those are meta files, not agent definitions.

## Reload Requirements

| Primitive | Takes effect |
|-----------|-------------|
| CLAUDE.md / rules | Next conversation |
| Skills | Next conversation |
| Commands | Next conversation |
| Subagents | Next conversation |
| MCP servers | Restart Claude Code |
| Hooks | Next session |

## Quirks

- Skills must be in subdirectories — flat `.md` files in `skills/` are not discovered
- `~/.claude/commands/` does not exist by default — create it
- HTTP MCP strongly preferred over stdio — stdio spawns orphan processes per session
- `~/.claude.json` and `~/.claude/settings.json` are separate files; don't confuse them
- Rules in `~/.claude/rules/` are all loaded; there is no enable/disable mechanism
