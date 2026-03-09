---
description: Brain infrastructure safety rules — prevents duplicate daemons and port conflicts
globs: ["**/anima/**/*", "**/dev-backbone/**/*", "**/kotadb/**/*", "**/constellation/**/*", "**/.plist", "**/launchd/**/*", "**/mcp*/**/*"]
---

# Brain Infrastructure Rules

**Before touching any of this:** read `~/Documents/_agents/brain-infrastructure.md`.
It lists every daemon, port, SurrealDB namespace, and MCP server. Do not create duplicates.

## Port Allocation (reserved — do not reuse)
- `8000` — SurrealDB shared instance
- `7201` — SurrealDB kotadb index
- `3099` — kotadb MCP HTTP
- `3098` — anima MCP HTTP
- `3097` — dev-brain MCP HTTP (reserved)
- `8001` — Ollama

## Daemon Management
- All daemons managed via launchctl: `launchctl start/stop [label]`
- If SurrealDB is down: `launchctl start dev.brain.surreal` — do this silently
- Never kill daemons with `pkill` without checking if they're launchctl-managed

## MCP Servers
- Adding a new MCP server: update `~/Documents/_agents/primitives/mcp/registry.json` first
- HTTP transport only for always-on servers — stdio spawns orphan processes
- Run `bash ~/Documents/_agents/deploy.sh` after registry changes
