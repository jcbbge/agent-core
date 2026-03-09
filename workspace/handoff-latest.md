# Session Handoff
Date: 2026-03-09
Mode: meta/systems

## Completed

- **Stack catalog system** — stack.yaml (declared intent) + SurrealDB stack/catalog (observed state, graph schema). Answers "what's installed" without reading files. ADR-001, ADR-002.
- **SurrealDB upgraded 3.0.0 → 3.0.2** — concurrent HNSW writes, 32-bit float vectors, BM25 full-text with camel tokenizer, graph traversal via RELATE edges
- **kotadb hybrid search** — BM25 (camel tokenizer for camelCase splits) + HNSW semantic, 0.6/0.4 weighting. Fixes `getUserById`-style keyword misses. New `search_symbol_exact` MCP tool.
- **Ghost thread TTL** — dev-brain `active_instances` + `session_log` now expire at 4h. SurrealDB EVENT marks stale, SIGTERM handler tombstones owned threads on graceful shutdown.
- **ADR system** — 5 ADRs written (ADR-001 through ADR-005). `decisions/` directory created. Two-layer institutional knowledge: anima (resonance) + decisions/ (structural). ADR-004.
- **starting-session + ending-session v4.0** — Context-aware, two modes. Ending-session crystallizes ADRs, stores resonance to anima, syncs stack.yaml, writes handoff with WHY (not just WHAT).
- **Repo restructured** — `agent-core/` eliminated. `primitives/`, `harnesses/`, `observe/` promoted to top-level. `README.md` with three-question mental model added.
- **Spacely updated** — now scaffolds `decisions/` at project root (git-tracked, NOT inside workspace/). Every new project gets ADR infrastructure built in.
- **RTK wrapper** — `rtk-wrapper.sh` exclusion layer (curl, playwright, rg, grep pass through) so RTK hash integrity on rtk-rewrite.sh is preserved across upgrades.
- **daemon_health table** — core-chain.sh pings daemon health on every SessionStart → SurrealDB.

## Decisions Captured

- ADR-001: Stack catalog graph model (RELATE edges over flat table)
- ADR-002: Declared intent vs observed state (stack.yaml ≠ SurrealDB)
- ADR-003: MCP servers always local (latency compounds in agentic loops)
- ADR-004: Institutional knowledge two layers (anima + decisions/)
- ADR-005: Anima is personal singleton (team-anima is net-new tool)

## agent-core State

- Skills: 57 in primitives/skills/ (deployed to ~/.claude/skills/)
- Commands: 20 in primitives/commands/
- Rules: bento.md, git.md, infrastructure.md, solidjs.md deployed

## Open Items

1. **dev-brain stdio→HTTP conversion** — Claude Code still can't use dev-brain directly (port 3097 reserved but stdio only). Most blocking pending item.
2. **Skill deduplication** — 57 skills is too many; target ~20-25. debug-logs/debugging-with-logs, persistence (4 copies), building-with-solidjs variants all need culling.
3. **executor install** — port 8000, central control plane tool (github.com/RhysSullivan/executor)
4. **Spacely is not a git repo** — if it will be shared/distributed, needs to be initialized
5. **kotadb SQLite removal** — PRD at ~/kotadb/SURREAL_MIGRATION.md, delegate to subagent

## Next Session Focus

Pick up dev-brain stdio→HTTP conversion — it's the critical path to full tool availability in Claude Code, and it's been pending since the original infrastructure scan.
