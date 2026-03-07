# Harness: Claude Code

| Field | Value |
|-------|-------|
| Name | claude-code |
| Config dir | `~/.claude/` |
| Rules file | `~/.claude/CLAUDE.md` (global) + `CLAUDE.md` at project root |
| Status | active |
| Tested | 2026-03-07 |

## Primitive Support

| Primitive | Supported | Format | Deploy target |
|-----------|-----------|--------|---------------|
| Skills | yes | dir with `SKILL.md` + YAML frontmatter | `~/.claude/skills/[name]/` |
| Commands | yes | `.md` file, `/name` invocation | `~/.claude/commands/[name].md` |
| Rules | yes | `CLAUDE.md` always loaded | `~/.claude/CLAUDE.md` |
| Hooks | yes | shell scripts, config in `settings.json` | `~/.claude/hooks/` |
| MCP (HTTP) | yes | `type: "http"` in mcp.json | `~/.claude/mcp.json` |
| MCP (stdio) | yes | `type: "stdio"` — avoid, spawns orphans | `~/.claude/mcp.json` |
| Sub-agents | yes | `.md` files in `.claude/agents/` | project `.claude/agents/` |

## Config Files

```
~/.claude/CLAUDE.md          — global rules (always loaded)
~/.claude/mcp.json           — MCP server registrations
~/.claude/settings.json      — hooks, permissions
~/.claude/skills/            — skill library
~/.claude/commands/          — slash commands (create if missing)
~/.claude/hooks/             — hook shell scripts
```

## MCP Config Format (`~/.claude/mcp.json`)

```json
{
  "mcpServers": {
    "server-name": {
      "type": "http",
      "url": "http://localhost:PORT/path"
    }
  }
}
```

## How to Reload After Changes

Skills and commands: take effect in the next conversation (no restart needed).
MCP changes: restart Claude Code.
Hook changes: take effect in the next session.

## Rules Loading

`~/.claude/CLAUDE.md` is loaded for every conversation globally.
Project-level `CLAUDE.md` at the working directory is merged on top.
`~/INSTANCE.md` is referenced from CLAUDE.md — both are always in context.

## Quirks

- Skills directory must contain a subdirectory per skill (not flat .md files)
- `~/.claude/commands/` must be created manually — it doesn't exist by default
- HTTP MCP is strongly preferred over stdio — stdio spawns per-session orphan processes
- Hooks fire shell scripts defined in `settings.json` under `"hooks"` key
- Multiple instances (tabs/windows) share the same MCP connections

## Current MCP Servers

| Server | URL | Status |
|--------|-----|--------|
| anima | http://localhost:3098/ | running |
| kotadb-local | http://localhost:3099/mcp | running |
| dev-brain | — | MISSING — needs HTTP conversion |
