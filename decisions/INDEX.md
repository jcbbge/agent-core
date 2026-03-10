# Decisions Index

Architecture Decision Records for the agent-core stack.
One file per significant decision. Queryable via SurrealDB `stack/catalog`.

| ADR | Title | Date | Status |
|-----|-------|------|--------|
| [ADR-000](ADR-000-template.md) | Template | — | Template |
| [ADR-001](ADR-001-stack-catalog-graph-model.md) | Stack catalog uses SurrealDB graph model | 2026-03-09 | Accepted |
| [ADR-002](ADR-002-declared-intent-vs-observed-state.md) | Declared intent vs observed state separation | 2026-03-09 | Accepted |
| [ADR-003](ADR-003-mcp-servers-always-local.md) | MCP servers always stay local | 2026-03-09 | Accepted |
| [ADR-004](ADR-004-institutional-knowledge-two-layers.md) | Two-layer institutional knowledge architecture | 2026-03-09 | Accepted |
| [ADR-005](ADR-005-anima-is-personal-singleton.md) | Anima is personal singleton | 2026-03-09 | Accepted |

| [ADR-006](ADR-006-cross-harness-identity-architecture.md) | Cross-harness identity architecture required | 2026-03-10 | Draft |
## Adding a new ADR

1. Copy ADR-000-template.md
2. Number sequentially (ADR-006, ADR-007...)
3. Add entry to this index
4. Commit with message: `decisions: ADR-XXX [title]`
