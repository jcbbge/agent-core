# agent-core

The canonical source of truth for Josh's AI agent stack.

## What this repo is

- **Primitives** — everything agents know how to do (skills, rules, hooks, commands, MCP configs, subagents)
- **Stack declaration** — what's installed, where, why (`stack.yaml`)
- **Institutional knowledge** — architectural decisions that shaped the system (`decisions/`)
- **Harness configs** — how primitives deploy to each AI harness (`harnesses/`)
- **Observability** — hooks and scripts that emit stack events (`observe/`)

## Mental model

Three questions, three places:
1. "What can agents do?" → `primitives/`
2. "What's installed on the machine?" → `stack.yaml` (declared) / SurrealDB `stack/catalog` (observed)
3. "Why was this built this way?" → `decisions/`

## Navigation

| Directory | Purpose |
|---|---|
| `primitives/` | Skills, rules, hooks, commands, MCP, subagents, plugins |
| `stack.yaml` | Full stack declaration — daemons, ports, tools, integrations |
| `decisions/` | Architecture Decision Records (ADRs) |
| `harnesses/` | Per-harness deployment profiles |
| `observe/` | Observability hooks and SurrealDB sync scripts |
| `workspace/` | Current session context and handoffs |
| `docs/` | Reference documentation |

## Key commands

```bash
# Deploy primitives to all configured harnesses
bash ~/Documents/_agents/agent-core/deploy.sh claude-code

# Sync stack.yaml to SurrealDB catalog
bash ~/Documents/_agents/observe/sync-stack.sh

# Check stack health
bash ~/.claude/hooks/core-chain.sh
```

## Decisions index

See `decisions/` for Architecture Decision Records. Key decisions:
- ADR-001: Stack catalog uses SurrealDB graph model
- ADR-002: Declared intent (stack.yaml) vs observed state (SurrealDB) separation
- ADR-003: MCP servers always local
- ADR-004: Two-layer institutional knowledge (anima resonance + decisions/ ADRs)
- ADR-005: Anima is personal singleton; team-anima is net-new

## Adding to the stack

When you install a new tool, daemon, or integration:
1. Add an entry to `stack.yaml`
2. Run `bash observe/sync-stack.sh` to sync to SurrealDB
3. Commit: `git commit stack.yaml -m "stack: add [name] — [why]"`

The git history of `stack.yaml` is your changelog.
