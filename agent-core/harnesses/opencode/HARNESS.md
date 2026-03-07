# Harness: OpenCode

| Field | Value |
|-------|-------|
| Name | opencode |
| Config dir | `~/.config/opencode/` |
| Rules file | `~/.config/opencode/AGENTS.md` |
| Status | active |
| Tested | 2026-03-07 |

## Primitive Support

| Primitive | Supported | Format | Deploy target |
|-----------|-----------|--------|---------------|
| Skills | yes | dir with `SKILL.md` (same format as Claude Code) | symlinks in `~/.config/opencode/` → skills dir |
| Commands | unknown | TBD | TBD |
| Rules | yes | `AGENTS.md` always loaded | `~/.config/opencode/AGENTS.md` |
| Plugins | yes | TypeScript `.ts` files | `~/.config/opencode/plugins/` |
| MCP (HTTP) | yes | `type: "http"` | `~/.config/opencode/opencode.json` under `"mcp"` |
| MCP (stdio) | yes | `type: "local"` — avoid, spawns orphans | same |

## Config Files

```
~/.config/opencode/opencode.json     — main config (model, mcp, etc.)
~/.config/opencode/AGENTS.md        — global rules
~/.config/opencode/plugins/         — TypeScript event plugins
```

## MCP Config Format (`~/.config/opencode/opencode.json`)

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

## Plugin Format (`~/.config/opencode/plugins/name.ts`)

TypeScript file. Fires on session events. Used for bootstrap, logging, etc.
See `anima-bootstrap.ts` as the canonical example.

## How to Reload After Changes

MCP and config changes: take effect on next OpenCode session.
Plugin changes: take effect on next session.

## Quirks

- Skills were previously configured via broken symlinks to `Documents/metaprompts/_skills/` — fix in progress
- `type: "local"` = stdio MCP — spawns per-session processes, creates orphans. Use `type: "http"` always.
- Anima is now HTTP (`type: "http"`, url: `http://localhost:3098/`) — updated 2026-03-07
- dev-brain is still stdio — needs HTTP conversion

## Current MCP Servers

| Server | Type | Status |
|--------|------|--------|
| anima | http → :3098 | running |
| dev-brain | stdio (orphan risk) | running but not ideal |
| kotadb | — | MISSING |
