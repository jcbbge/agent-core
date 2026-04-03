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
- `8001` — Ollama
- `8000` — **executor gateway** (ONLY harness-registered MCP) — label: dev.brain.executor
- `3099` — kotadb MCP (internal brain-layer only — access via executor `tools["kotadb.*"]`)
- `3098` — anima MCP (internal brain-layer only — access via executor `tools["anima.*"]`)
- `3097` — dev-brain MCP (internal brain-layer only — access via executor `tools["devbrain.*"]`)
- `3096` — subagent-mcp (internal brain-layer only — access via executor `tools["subagent.*"]`)

## Daemon Management
- All daemons managed via launchctl: `launchctl start/stop [label]`
- If SurrealDB is down: `launchctl start dev.brain.surreal` — do this silently
- If executor is down: `launchctl start dev.brain.executor` — do this silently
- Never kill daemons with `pkill` without checking if they're launchctl-managed

## MCP Servers
- Adding a new MCP server: update `~/Documents/_agents/primitives/mcp/registry.json` first
- HTTP transport only for always-on servers — stdio spawns orphan processes
- After registry changes: manually update each harness config (`~/.claude.json`, `~/.config/opencode/opencode.json`, `~/.omp/agent/mcp.json`)

## Executor Runtime
- Executor is an MCP server at `http://127.0.0.1:8000/mcp` — registered in all three harnesses
- It exposes two tools: `execute` (run TypeScript against catalog) and `resume` (continue paused execution)
- Sources connected: dev-brain, anima, kotadb — accessible as `tools.dev-brain.*`, `tools.anima.*`, `tools.kotadb.*`
- Fork at `~/executor/` — content source kind added (enables rules/skills/commands as catalog sources)

## Plist Secret Hygiene

**NEVER put API keys or external service credentials in plist `EnvironmentVariables` dicts.**
Plists committed to git expose every value in `EnvironmentVariables` publicly.

Acceptable inline in a plist:
- `localhost`/`127.0.0.1` URLs
- Local dev defaults (`SURREAL_PASS=root` when SurrealDB runs default auth)
- Non-secret config: model names, namespace strings, dimension counts

**Not acceptable inline:**
- OpenRouter, OpenAI, Anthropic, or any external API key
- OAuth tokens, webhook secrets, bearer credentials of any kind

The application must load secrets from `.env` at runtime. The plist's job is to start the process — not to carry credentials.

**Gitignore rule for all repos with plists:**
```
*.plist
!*.plist.template
```
Committed templates contain placeholder values only. Real plists stay local.

**Pre-commit hook:** Install `git-secrets` on every repo that touches daemon config or has a `.env`. See `secrets.md`.
