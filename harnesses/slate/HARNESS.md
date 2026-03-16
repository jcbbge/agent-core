## Orchestrator Integration

Slate supports **remote MCP** connections. The executor at port 8000 provides unified tool access and Tier 2 service lifecycle management.

### Service Tiers

| Tier | Services | Behavior |
|------|----------|----------|
| **T1** | anima, dev-brain, executor | Always-on, core substrate |
| **T2** | kotadb, subagent-mcp | On-demand, toggle via commands |
| **T3** | project-scoped | Auto-discovered per-project |

### slate.json Configuration

Use `"type": "remote"` (Slate's HTTP MCP type):

```json
{
  "mcp": {
    "executor": {
      "type": "remote",
      "url": "http://127.0.0.1:8000/mcp",
      "enabled": true
    }
  }
}
```

### T2 Service Commands

Slate reads commands from `~/.claude/commands/` (shared with other harnesses):

```
/kota on       # Start KotaDB for code search, symbol lookup
/kota off      # Stop to reclaim context window space
/kota status   # Check running state and idle time

/subagent on   # Enable agent delegation
/subagent off  # Disable agent service
/subagent list # List available agents (reviewer, test-writer, etc.)
```

These invoke executor orchestrator tools to manage service lifecycles.

### Tier Strategy

- **T1 Always-on**: Identity (anima), workspace state (dev-brain), runtime (executor)
- **T2 On-demand**: Code intelligence (kotadb), delegation (subagent-mcp) — start only when needed
- **T3 Project-scoped**: Auto-enabled when working in specific project directories

This keeps the active tool count low, preserving context window for actual work.

# Harness: Slate

| Field | Value |
|-------|-------|
| Name | slate |
| Config dir | `~/.config/slate/` |
| Status | active |
| Docs | https://docs.randomlabs.ai |

## Config Files

```
~/.config/slate/AGENTS.md    — global agent identity + rules (checked before ~/.claude/CLAUDE.md)
~/.config/slate/slate.json   — MCP servers, custom commands, permissions, models
```

## Config Lookup Order

**Agent rules** — Slate checks these in order, uses first match:
1. Project `AGENTS.md` / `CLAUDE.md` (walks up to git root)
2. `~/.config/slate/AGENTS.md` ← global
3. `~/.claude/CLAUDE.md` ← fallback

**Config merging** — slate.json is merged, not replaced:
1. `~/.config/slate/slate.json` ← global
2. `slate.json` in project root ← project overrides
3. `SLATE_CONFIG_CONTENT` env var ← highest precedence

## Primitive Update Procedures

### Agent File + Rules (`~/.config/slate/AGENTS.md`)
Copy `schema/agent-file/AGENTS.md` → `~/.config/slate/AGENTS.md`. Straight copy.
Rules do not have a separate directory — all rules live in AGENTS.md.

### MCP Servers (`~/.config/slate/slate.json` → `mcp`)
Format:
```json
{
  "mcp": {
    "server-name": {
      "type": "remote",
      "url": "http://localhost:PORT/",
      "enabled": true
    }
  }
}
```
Slate uses `"type": "remote"` for HTTP MCP (not `"http"` like Claude Code / OpenCode).
To add a server: edit `~/.config/slate/slate.json`, add entry under `mcp`.

### Custom Commands (`~/.config/slate/slate.json` → `command`)
Format:
```json
{
  "command": {
    "cmd-name": {
      "description": "Short description shown in UI",
      "template": "The prompt sent when user types /cmd-name. $ARGUMENTS captures text after the command name.",
      "agent": "build"
    }
  }
}
```
To add a command for a schema procedure: set `template` to instruct Slate to read and execute the file:
```
"template": "Read ~/Documents/_agents/schema/commands/NAME.md and execute the procedure. $ARGUMENTS"
```
This keeps procedures in schema markdown — Slate reads them at invocation time.

### Skills
No skills directory. Slate reads skill files on-demand via terminal.
To use a skill: read `~/Documents/_agents/schema/skills/[name]/SKILL.md` and include its content in the task prompt.

### Permissions (`~/.config/slate/slate.json` → `permission`)
```json
{
  "permission": {
    "*": "allow",
    "bash": "ask"
  }
}
```

### Models (`~/.config/slate/slate.json` → `models`)
```json
{
  "models": {
    "main": { "default": "claude-sonnet-4-5" },
    "subagent": { "default": "claude-haiku-4-5" }
  }
}
```

## Reload Requirements

| Primitive | Takes effect |
|-----------|-------------|
| AGENTS.md | Next session |
| MCP servers | Restart Slate |
| Commands | Restart Slate |
| Permissions | Restart Slate |

## Full slate.json Example

```json
{
  "$schema": "https://randomlabs.ai/config.json",
  "mcp": {
    "anima":        { "type": "remote", "url": "http://localhost:3098/",        "enabled": true },
    "dev-brain":    { "type": "remote", "url": "http://localhost:3097/",        "enabled": true },
    "kotadb":       { "type": "remote", "url": "http://localhost:3099/",        "enabled": true },
    "executor":     { "type": "remote", "url": "http://127.0.0.1:8000/mcp",     "enabled": true },
    "subagent-mcp": { "type": "remote", "url": "http://localhost:3096/",        "enabled": true }
  },
  "command": {
    "anima-start": {
      "description": "Bootstrap Anima — load persistent memory substrate",
      "template": "Call anima_bootstrap now. Load persistent memory, surface top memories by phi resonance. Read the result carefully — it is your reconstituted context.",
      "agent": "build"
    },
    "anima-end": {
      "description": "Close Anima session — record reflection",
      "template": "Call anima_session_close now. Assess: context_quality (1-10), continuity_score (1-10), had_emergence_moment (bool), needed_correction (bool), general_notes. $ARGUMENTS",
      "agent": "build"
    }
  },
  "permission": {
    "*": "allow",
    "bash": "ask"
  }
}
```

## Quirks

- MCP type is `"remote"` not `"http"` — different from Claude Code and OpenCode
- No rules directory — everything goes in AGENTS.md
- No skills auto-load — skills are read on-demand via terminal (`cat schema/skills/NAME/SKILL.md`)
- Commands with complex logic: use `template` to reference the schema file path rather than embedding the full procedure inline
- `$ARGUMENTS` in template captures everything typed after `/cmd-name`
