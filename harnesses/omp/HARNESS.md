## Orchestrator Integration

OMP uses **executor-mediated MCP** — no native MCP support. All tool access routes through the executor at port 8000, which provides unified catalog access and T2 service lifecycle management.

### Service Tiers

| Tier | Services | Behavior |
|------|----------|----------|
| **T1** | anima, dev-brain, executor | Always-on, core substrate |
| **T2** | kotadb, subagent-mcp | On-demand, toggle via commands |
| **T3** | project-scoped | Auto-discovered per-project |

### mcp.json Configuration

OMP's `~/.omp/agent/mcp.json` configures only the executor:

```json
{
  "mcpServers": {
    "executor": {
      "type": "http",
      "url": "http://127.0.0.1:8000/mcp"
    }
  }
}
```

Tier 2 services (kotadb, subagent-mcp) are not declared here — they are discovered and started on-demand via executor orchestration.

### Toggle Commands

Deploy these commands from `schema/commands/` to `~/.claude/commands/` (shared with Claude Code):

| Command | Purpose |
|---------|---------|
| `/kota on` | Start KotaDB code intelligence |
| `/kota off` | Stop KotaDB to free context budget |
| `/kota status` | Show running state and query stats |
| `/subagent on` | Start agent delegation service |
| `/subagent off` | Stop subagent service |
| `/subagent list` | Show available agents (reviewer, debugger, etc.) |

These commands call executor lifecycle tools: `orchestrator/service_start`, `orchestrator/service_stop`, `orchestrator/service_status`.

### MCP Restart Required

Updating `mcp.json` requires OMP restart. T2 service toggles take effect immediately via executor.

# Harness: OMP (Oh My Pi)

| Field | Value |
|-------|-------|
| Name | omp |
| Config dir | `~/.omp/agent/` |
| Status | active |
| Docs | https://omp.dev/docs |

## Config Files

```
~/.omp/agent/AGENTS.md       — global agent identity + rules (always loaded)
~/.omp/agent/mcp.json        — MCP server registrations
~/.omp/agent/rules/          — additional rule files (*.md, *.mdc)
~/.omp/agent/skills/         — skill library (one subdir per skill)
~/.omp/agent/agents/         — subagent definitions
~/.omp/agent/extensions/     — TypeScript hook/extension modules
~/.omp/agent/tools/          — custom tool modules
~/.omp/agent/config.yml      — main config (model, tools, etc.)
```

## Primitive Update Procedures

### Agent File (`~/.omp/agent/AGENTS.md`)
Copy `schema/agent-file/AGENTS.md` → `~/.omp/agent/AGENTS.md`. Straight copy.

### Rules (`~/.omp/agent/rules/`)
Each file in `schema/rules/*.md` → `~/.omp/agent/rules/[same-filename].md`. Straight copy.
OMP also supports `.mdc` frontmatter format, but plain `.md` works.
To add a rule: copy the `.md` from schema to `~/.omp/agent/rules/`.
To update a rule: overwrite the matching file.

### MCP Servers (`~/.omp/agent/mcp.json` → `mcpServers`)
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
To add a server: edit `~/.omp/agent/mcp.json`, add entry under `mcpServers`.
Same format as Claude Code's `~/.claude.json`.

### Skills (`~/.omp/agent/skills/[name]/`)
Each skill is a directory. Copy `schema/skills/[name]/` → `~/.omp/agent/skills/[name]/`.

### Commands
OMP reads commands natively from `~/.claude/commands/` (shared with Claude Code).
No separate copy needed — updating `~/.claude/commands/` covers OMP.

### Subagents (`~/.omp/agent/agents/`)
OMP reads agents from both `~/.omp/agent/agents/` and `~/.claude/agents/`.
Updating `~/.claude/agents/` covers both. To deploy OMP-specific agent format variants, copy to `~/.omp/agent/agents/` separately.

### Hooks (`~/.omp/agent/extensions/*.ts`)
OMP hooks are TypeScript extension modules. Extensions are a superset of hooks — they can also register tools and commands.

## Reload Requirements

| Primitive | Takes effect |
|-----------|-------------|
| AGENTS.md / rules | Next message |
| Skills | Next message |
| Commands | Next message |
| MCP servers | Restart OMP |
| Extensions | Restart OMP |
| Subagents | Next message |

## Quirks

- OMP reads `~/.claude/commands/` and `~/.claude/agents/` natively — shared with Claude Code
- Also reads `.cursor/rules/` and Windsurf memories — don't put sensitive info there
- Extensions are a superset of hooks — can register tools, slash commands, and keyboard shortcuts
- `config.yml` `tools:` section supports declarative shell-command tools without TypeScript
