# NEXTSTEPS — AgentCore Infrastructure

**Updated:** 2026-04-04  
**Context:** Architectural pivot to Substrate (Cognitive Terraform). Agentic entropy mitigated.

---

## Immediate

- [ ] Create `substrate` repo in GitHub UI and push local `~/substrate`
- [ ] Dogfood the Substrate: Take the first "Micro-Breath" using `bun run src/cli/breath.ts in`
- [ ] Reboot Executor daemon (`launchctl start dev.brain.executor`)
- [ ] Migrate subagent-mcp from OpenRouter to Perplexity (ADR pending) — descriptions, model listing, provider field
- [ ] Advance 5 Manifold silo artifacts from IMPLEMENT → TEST, emit AC-VAL contracts (or port them to Substrate)

## In Progress

- [ ] Tier 1 OpenCode plugins (Bootstrap Orchestrator + Session Close Orchestrator)

## Infrastructure State (2026-04-03)

| Component | Status |
|-----------|--------|
| Executor daemon | ✅ launchd-managed, stale-process fix, source reconnect on boot, artifact poll |
| Bootstrap capability surface | ✅ live from SurrealDB — 41 MCP tools, 91 primitives, 5 intent groups |
| Anima MCP | ✅ internal brain-layer only — executor gateway sole access point |
| All harness configs | ✅ executor-only MCP registration enforced (ADR-022) |
| Manifold mesh CLI | ✅ built, 5 silos in IMPLEMENT |
| subagent-mcp | ⚠️ OpenRouter refs in descriptions — migration todo |
| KotaDB semantic search | ⚠️ "no MATCHES clause" error — unresolved |

## Backlog

- [ ] Fix feature field MCP write (SurrealDB client quirk)
- [ ] Fix KotaDB semantic search index
- [ ] Implement idle auto-shutdown for T2 services (30min timeout)
- [ ] Submit Field Theory process leak bug report
- [ ] Design cross-project work primitive

## Anima Bugs

- [ ] BUG-001+006: Synthesis daemon zombie + dual workers (CRITICAL)
- [ ] BUG-002: Active tier depletion
- [ ] BUG-003: workspace/ gitignored, blocks handoff commits
- [ ] BUG-004: memory_versions table 0 records
- [ ] BUG-005: fold_model config mismatch
- [x] BUG-007: Curiosity worker threshold (fixed)

## Completed This Session (2026-04-04)

- [x] Defined "Cognitive Terraform" philosophy in `CORE.md` (Stacking Cups, The 5-Phase Breath, Zero Residue)
- [x] Built Substrate IPIT Framework (`intent` -> `state` -> `memory` -> `collapse`) in `~/substrate`
- [x] Wrote `src/cli/breath.ts` and `src/mcp/server.ts` to execute Phase 5 Collapse incinerations
- [x] Added "Circuit Breaker (Anti-Looping)" directive to `AGENTS.md` to stop agent `colgrep` spirals on conversational prompts

## Completed Prior Session (2026-04-03)

- [x] Diagnosed executor `rows.executions.insert` failure — stale process holding port 8000
- [x] Fixed executor-start.sh — kills stale port occupants, reconnects sources, polls artifact index
- [x] Enforced executor as sole harness MCP — removed all direct registrations (ADR-022)
- [x] Built dynamic bootstrap capability surface from SurrealDB + filesystem (ADR-023)
- [x] Identified and documented completion-memory discipline — close the loop in same breath
- [x] Full consistency audit — all docs aligned, committed, pushed to agent-core main
