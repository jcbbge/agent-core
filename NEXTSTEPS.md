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

## In Progress
- Work categorization workflow — classify completed work against 9 primitives

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

## Related
- roux: Classification/routing framework
- cortex: Analysis/design workspace
- sigil: Capture layer
- stack.yaml: MCP servers, daemons, ports

---

**Updated**: 2026-03-16
**Context**: Session workflow now connected to SurrealDB. Executor routes all MCP connections. Next: work categorization so I know what capability each task belongs to.
