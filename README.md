# AgentCore Schema

The canonical source of truth for Josh's AI agent stack — the **AgentCore Schema** repository.

## What this repo is

- **Schema** — the nine AgentCore Schema primitives: skills, rules, hooks, commands, MCP configs, subagents, custom tools, plugins, integrations (`schema/`)
- **Harness sync** — per-harness deployment scripts that copy+transform primitives to each AI harness (`harnesses/`)
- **Stack declaration** — what's installed, where, why (`stack.yaml`)
- **Institutional knowledge** — architectural decisions that shaped the system (`decisions/`)
- **Observability** — hooks and scripts that emit stack events (`observe/`)

## Mental model

Three questions, three places:
1. "What can agents do?" → `schema/`
2. "What's installed on the machine?" → `stack.yaml` (declared) / SurrealDB `stack/catalog` (observed)
3. "Why was this built this way?" → `decisions/`

## Navigation

| Directory | Purpose |
|---|---|
| `schema/` | The nine AgentCore Schema primitives (skills, rules, hooks, commands, MCP, subagents, plugins, integrations, agent-file) |
| `harnesses/` | Per-harness deployment: profile.json + HARNESS.md + sync.py |
| `stack.yaml` | Full stack declaration — daemons, ports, tools, integrations |
| `decisions/` | Architecture Decision Records (ADRs) |
| `observe/` | Observability hooks and SurrealDB sync scripts |
| `workspace/` | Current session context and handoffs |
| `docs/` | Reference documentation |

## Key commands

```bash
# Sync all primitives to all harnesses
bash ~/Documents/_agents/sync.sh

# Sync one harness only
python3 ~/Documents/_agents/harnesses/claude-code/sync.py

# Dry run (preview changes without writing)
bash ~/Documents/_agents/sync.sh --dry-run

# Audit primitive deployment across harnesses
bash ~/Documents/_agents/audit.sh

# Sync stack.yaml to SurrealDB catalog
bash ~/Documents/_agents/observe/sync-stack.sh
```

## Harness onboarding

Primitives are deployed to harnesses via per-harness `sync.py` scripts (copy+transform, no symlinks).
See `harnesses/_sop.md` for the research-first onboarding protocol.
Each harness directory has: `profile.json` (primitive mapping), `HARNESS.md` (docs), `sync.py` (deployer).

## Decisions index

See `decisions/` for Architecture Decision Records. Key decisions:
- ADR-001: Stack catalog uses SurrealDB graph model
- ADR-002: Declared intent (stack.yaml) vs observed state (SurrealDB) separation
- ADR-003: MCP servers always local
- ADR-004: Two-layer institutional knowledge (anima resonance + decisions/ ADRs)
- ADR-005: Anima is personal singleton; team-anima is net-new
- ADR-010: No symlinks — copy and transform

## Adding to the stack

When you install a new tool, daemon, or integration:
1. Add an entry to `stack.yaml`
2. Run `bash observe/sync-stack.sh` to sync to SurrealDB
3. Commit: `git commit stack.yaml -m "stack: add [name] — [why]"`

The git history of `stack.yaml` is your changelog.
