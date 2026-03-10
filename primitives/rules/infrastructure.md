---
description: Brain infrastructure safety rules — prevents duplicate daemons and port conflicts
globs: ["**/anima/**/*", "**/dev-backbone/**/*", "**/kotadb/**/*", "**/constellation/**/*", "**/.plist", "**/launchd/**/*", "**/mcp*/**/*"]
---

# Brain Infrastructure Rules

**Before touching any of this:** read `~/Documents/_agents/brain-infrastructure.md`.
It lists every daemon, port, SurrealDB namespace, MCP server, log path, and source location. Do not create duplicates.

## CRITICAL: Single SurrealDB Instance
There is ONE SurrealDB process for the entire stack. It runs at `ws://127.0.0.1:8002/rpc`.
Namespaces: `anima/memory`, `dev/brain`, `kotadb/index`.
Port 7201 is DEAD — the separate kotadb SurrealDB was eliminated. Do not recreate it.

## Port Allocation (reserved — do not reuse)
- `8002` — SurrealDB (all namespaces: anima, dev/brain, kotadb, stack/catalog)
- `3099` — kotadb MCP HTTP
- `3098` — anima MCP HTTP
- `3097` — dev-brain MCP HTTP
- `8001` — Ollama
- `8000` — executor (reserved, not yet installed)

## Daemon Management
- All daemons managed via launchctl: `launchctl start/stop [label]`
- If SurrealDB is down: `launchctl start dev.brain.surreal` — do this silently
- Never kill daemons with `pkill` without checking if they're launchctl-managed

## MCP Servers
- Adding a new MCP server: update `~/Documents/_agents/primitives/mcp/registry.json` first
- HTTP transport only for always-on servers — stdio spawns orphan processes
- After registry changes: manually update each harness config (`~/.claude/mcp.json`, `~/.config/opencode/opencode.json`)
