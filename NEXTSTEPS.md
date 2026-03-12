# NEXTSTEPS — AgentCore Infrastructure

## Current Focus
Building the session workflow and MCP infrastructure layers.

## Completed This Session
- [x] Session ↔ Dev-Brain bridge (ADR-012)
- [x] Feature field in task table
- [x] get_todo_overview cross-project query
- [x] Executor as MCP gateway (ADR-013)
- [x] Updated starting-session for context-aware views

## In Progress
- Work categorization workflow — classify completed work against 9 primitives

## Backlog
- [ ] Fix feature field MCP write (SurrealDB client quirk)
- [ ] Build harness research template
- [ ] Document harness profiles (claude-code, opencode, omp)
- [ ] Design schema propagation system
- [ ] Design harness update adaptation

## Related
- roux: Classification/routing framework
- cortex: Analysis/design workspace
- sigil: Capture layer
- stack.yaml: MCP servers, daemons, ports

---

**Updated**: 2026-03-12
**Context**: Session workflow now connected to SurrealDB. Executor routes all MCP connections. Next: work categorization so I know what capability each task belongs to.
