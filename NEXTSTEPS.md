# NEXTSTEPS — AgentCore Infrastructure

## Current Focus
Building the session workflow and MCP infrastructure layers.

- [x] Session ↔ Dev-Brain bridge (ADR-012)
- [x] Feature field in task table
- [x] get_todo_overview cross-project query
- [x] Executor as MCP gateway (ADR-013)
- [x] Updated starting-session for context-aware views
- [x] Service tier classification (T1/T2/T3) for lifecycle management (ADR-016)
- [x] Executor orchestrator tools (start/stop/status for T2 services)
- [x] Field Theory process leak investigation (590MB, 26 processes documented)
- [x] BUG-007: Curiosity worker threshold (>= instead of >, lowered to 3.5)

## In Progress
- [ ] Implement Tier 1 OpenCode plugins (Bootstrap Orchestrator + Session Close Orchestrator)

## Completed This Session (2026-03-26)
- [x] OpenCode is sole harness — OMP and Claude Code dropped (ADR-27)
- [x] 43 skills + 23 commands + 5 subagents + 9 rules wired to OpenCode natively (ADR-28)
- [x] 200 OpenCode plugin ideas catalogued in docs/prd-opencode-plugin-system.md (ADR-29)
- [x] AGENTS.md rewritten with full primitive awareness and executor gateway pattern
- [x] PRDs written: prd-primitive-gateway.md, prd-opencode-harness-cleanup.md, prd-opencode-plugin-system.md

## Backlog
- [ ] Fix feature field MCP write (SurrealDB client quirk)
- [ ] Build harness research template
- [ ] Document harness profiles (claude-code, opencode, omp)
- [ ] Design schema propagation system
- [ ] Design harness update adaptation
- [x] Service tier classification (T1/T2/T3) for lifecycle management (ADR-016)
- [x] Executor orchestrator tools (start/stop/status for T2 services)
- [x] Field Theory process leak investigation (590MB, 26 processes documented)
- [ ] Submit Field Theory bug report to developer
- [ ] Fix KotaDB semantic search index ("no MATCHES clause" error)
- [ ] Implement idle auto-shutdown for T2 services (30min timeout)
- [ ] Design cross-project work primitive (unified tracking across repos)

## Anima Bugs (in workspace/specs/)
- [ ] BUG-001+006: Synthesis daemon zombie + dual workers (CRITICAL — synthesis stuck)
- [ ] BUG-002: Active tier depletion (fold consumes all active memories)
- [ ] BUG-003: workspace/ gitignored, blocks handoff commits
- [ ] BUG-004: memory_versions table 0 records (schema mismatch)
- [ ] BUG-005: fold_model config mismatch (DB says haiku, code uses llama)
- [x] BUG-007: Curiosity worker threshold (fixed)

## Related
- roux: Classification/routing framework
- cortex: Analysis/design workspace
- sigil: Capture layer
- stack.yaml: MCP servers, daemons, ports

---

**Updated**: 2026-03-26
**Context**: OpenCode fully configured — primitives wired, harness consolidated, 200 plugin ideas catalogued. Priority: Tier 1 plugins (Bootstrap Orchestrator + Session Close Orchestrator) + anima fold_config bug (BUG-005/related).
