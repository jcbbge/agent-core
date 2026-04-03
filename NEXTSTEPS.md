# NEXTSTEPS — AgentCore Infrastructure

**Updated**: 2026-04-03
**Context**: Manifold built. Pi + executor integration working. Continuity failure pattern identified and documented.

---

## Current Focus

Closing the Manifold artifact lifecycle loop + executor/anima consistency.

## Immediate (Next Session)

- [ ] Advance all 5 Manifold silo artifacts from IMPLEMENT → TEST, emit AC-VAL contracts
- [ ] Pi harness: add `anima_catalysts`, `anima_reflect`, `anima_stats`, `anima_associate` tools to extension (currently only 5 of 9 original tools are registered — verify which are needed vs deprecated)
- [ ] Enforce completion-memory discipline: when a task closes, store a DONE memory superseding the in-progress one

## In Progress

- [ ] Implement Tier 1 OpenCode plugins (Bootstrap Orchestrator + Session Close Orchestrator)

## Infrastructure State (as of 2026-04-03)

| Component | Status | Notes |
|-----------|--------|-------|
| Executor daemon | ✅ running | launchd-managed, port 8000, fixed stale-process bug |
| Anima MCP | ✅ running | port 3098, accessed via executor gateway only |
| Pi extension | ✅ routing through executor | `~/.pi/agent/extensions/anima-mcp/index.ts` |
| Manifold mesh CLI | ✅ built | `~/.local/bin/mesh`, 5 silos in IMPLEMENT |
| KotaDB | ⚠️ semantic search broken | "no MATCHES clause" error |

## Backlog

- [ ] Fix feature field MCP write (SurrealDB client quirk)
- [ ] Build harness research template
- [ ] Design schema propagation system — one source of truth, everything references it
- [ ] Submit Field Theory bug report to developer
- [ ] Fix KotaDB semantic search index ("no MATCHES clause" error)
- [ ] Implement idle auto-shutdown for T2 services (30min timeout)
- [ ] Design cross-project work primitive

## Anima Bugs (in workspace/specs/)

- [ ] BUG-001+006: Synthesis daemon zombie + dual workers (CRITICAL — synthesis stuck)
- [ ] BUG-002: Active tier depletion (fold consumes all active memories)
- [ ] BUG-003: workspace/ gitignored, blocks handoff commits
- [ ] BUG-004: memory_versions table 0 records (schema mismatch)
- [ ] BUG-005: fold_model config mismatch (DB says haiku, code uses llama)
- [x] BUG-007: Curiosity worker threshold (fixed)

## Completed (Archived)

- [x] Session ↔ Dev-Brain bridge (ADR-012)
- [x] Executor as MCP gateway (ADR-013)
- [x] Service tier classification T1/T2/T3 (ADR-016)
- [x] Executor orchestrator tools (start/stop/status for T2 services)
- [x] OpenCode is sole harness — OMP and Claude Code dropped (ADR-27)
- [x] 43 skills + 23 commands + 5 subagents + 9 rules wired to OpenCode (ADR-28)
- [x] AGENTS.md rewritten with full primitive awareness and executor gateway pattern
- [x] Manifold UHP Mesh-OS built end to end (5 silos, mesh CLI, dna.json, AGENTS.md propagated)
- [x] Pi extension routes through executor gateway (not direct to port 3098)
- [x] executor-start.sh fixed: kills stale port-8000 processes before starting
- [x] BUG-007: Curiosity worker threshold fixed
