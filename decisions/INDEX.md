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
| [ADR-007](ADR-007-opencode-sdk-as-provider-abstraction.md) | OpenCode SDK as provider abstraction for subagent delegation | 2026-03-11 | Accepted |
| [ADR-008](ADR-008-constellation-ts-gl-dual-implementation.md) | Constellation TS/GL dual-implementation strategy | 2026-03-11 | Accepted |
| [ADR-009](ADR-009-surrealdb-as-constellation-nebula.md) | SurrealDB as Constellation Nebula (persistent pheromone store) | 2026-03-11 | Accepted |
| [ADR-010](ADR-010-no-symlinks-copy-and-transform.md) | Primitive deployment uses copy-and-transform, not symlinks | 2026-03-11 | Accepted |
| [ADR-011](ADR-011-research-first-harness-onboarding.md) | Harness onboarding requires research-first documentation before deployment | 2026-03-11 | Accepted |
| [ADR-012](ADR-012-session-workflow-surrealdb.md) | Session workflow uses SurrealDB for cross-project context | 2026-03-12 | Accepted |
| [ADR-013](ADR-013-executor-mcp-gateway.md) | Executor as MCP gateway | 2026-03-12 | Accepted |
| [ADR-014](ADR-014-pheromone-is-event-unified-table.md) | Pheromone IS event — one unified cs_pheromone table | 2026-03-12 | Accepted |
| [ADR-015](ADR-015-manual-only-primitive-deployment.md) | Manual-only primitive deployment — scripts eliminated | 2026-03-16 | Accepted |
| [ADR-016](ADR-016-service-tier-classification.md) | Service tier classification (T1/T2/T3) for on-demand lifecycle | 2026-03-16 | Accepted |
| [ADR-017](ADR-017-program-md-jit-operating-contract.md) | PROGRAM.md is JIT-compiled from executables, not documentation | 2026-03-16 | Accepted |
| [ADR-018](ADR-018-surrealdb-client-reconnect-disabled.md) | Disable surrealdb client auto-reconnect in dev-brain MCP | 2026-03-17 | Accepted |

## Adding a new ADR

1. Copy ADR-000-template.md
2. Number sequentially (ADR-006, ADR-007...)
3. Add entry to this index
4. Commit with message: `decisions: ADR-XXX [title]`
| [ADR-019](ADR-019-structural-quality-gates.md) | Skill quality gates must be visible output, not internal checklists | 2026-03-21 | Accepted |
