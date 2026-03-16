# Session Handoff
Date: 2026-03-16
Mode: meta/systems

## Completed

- **Executor Universal Orchestrator** — Extended Executor from MCP gateway to primitive orchestrator. Added 3 lifecycle tools (service_start, service_stop, service_status) enabling on-demand management of Tier 2 services (KotaDB, Subagent-MCP). Saves ~55MB when idle on 8GB system. (ADR-016)

- **Service Tier Classification** — Defined T1 (always-on: SurrealDB, Anima, Dev-Brain, Executor, Ollama), T2 (on-demand: KotaDB, Subagent-MCP), T3 (project-scoped). Implemented intent-based auto-triggering with keyword matching + explicit toggle commands (/kota, /subagent).

- **Field Theory Process Leak Investigation** — Root-cause analysis identified 26 leaked processes (18 whisper-servers) consuming 590MB over 90+ hours. Documented complete bug report at ~/Documents/field-theory-inquiry/process-leak-investigation.md ready for developer submission.

- **Documentation & Registry Updates** — Created primitive-lifecycle-api.md (18KB reference). Updated registry.json with tier classifications. Updated all 4 harness HARNESS.md files (claude-code, opencode, omp, slate) with orchestrator integration sections.

- **Commits** — executor: 01928ef (lifecycle tools), _agents: ae87498 (orchestrator integration + ADR-016)

## Decisions Captured

- ADR-016: Service tier classification (T1/T2/T3) for on-demand lifecycle — extends ADR-013

## Agent-Core State

- 38 skills · 9 rules deployed
- 5 MCP servers in registry: anima, kotadb, dev-brain, executor, subagent-mcp
- Executor now manages T2 service lifecycle
- Tier strategy: T1 always, T2 on-demand with intent classification, T3 project-scoped

## Open Items

1. **Submit Field Theory bug report** — Document ready at ~/Documents/field-theory-inquiry/process-leak-investigation.md. 26 leaked processes, 590MB, reproduction steps included.

2. **Fix KotaDB semantic search index** — "no MATCHES clause" error. Index may need rebuilding or query format changed. Code search works; semantic/symbol search broken.

3. **Implement idle auto-shutdown** — Add configurable timeout (30min) to executor orchestrator for T2 services.

4. **Design cross-project work primitive** — User needs unified tracking when work spans multiple repos (executor, _agents, etc.). Current system fragments by project.

## Next Session Focus

Submit Field Theory bug report to developer and investigate KotaDB semantic search index issue — the infrastructure orchestrator is ready, but search capabilities need restoration.
