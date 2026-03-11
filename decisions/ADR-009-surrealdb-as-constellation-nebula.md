# ADR-009: SurrealDB as Constellation Nebula (Persistent Pheromone Store)

**Date:** 2026-03-11
**Status:** Accepted

## Context

Constellation's coordination model is stigmergic — agents (stars) don't call each other directly; they read and write pheromones to a shared store called the Nebula. In the Gleam implementation, the Nebula is ETS (in-memory, ephemeral, per-process). This works for single-trajectory local execution but has three gaps:

1. **No persistence** — Nebula dies when the process dies; no crash recovery
2. **No cross-harness visibility** — Claude Code, OpenCode, omp cannot see or emit pheromones
3. **No cross-trajectory coordination** — Macro-Trajectory decomposition requires shared state across multiple Micro-Trajectories

SurrealDB 3.0 (released Feb 17, 2026) was explicitly designed for AI agent memory. It ships: live queries, graph relations, async events, DEFINE API (HTTP endpoints in-DB), and SurrealMCP (official MCP server). It already runs in the stack at `ws://127.0.0.1:8002`.

## Decision

Constellation TS uses SurrealDB as the Nebula backend:

```
Namespace: constellation
Database:  nebula
Tables:    trajectory, pheromone, consumption
```

The schema is minimal and matches the Gleam pheromone taxonomy exactly. Pheromones are records with a `scent` field (typed string) and `payload` (object). Isolation walls are enforced at the query layer (forbids[] arrays, not in SELECT WHERE).

## Reasoning

- SurrealDB is already running — no new infrastructure
- `constellation/nebula` is a clean namespace isolated from `anima/memory`, `dev/brain`, `kotadb/index`
- Live queries enable future real-time dashboard (Three.js) over the Nebula
- DEFINE EVENT enables automatic phase advancement when trajectories complete
- Cross-harness pheromone emission becomes possible (any process can write to SurrealDB)
- Crash recovery is free — pheromones survive process restarts

## Rejected Alternatives

- **ETS (Gleam approach)** — ephemeral, not viable for TS runtime, no persistence
- **SQLite** — considered in v.01, upgraded away from it; not suitable for async multi-agent writes
- **Separate database** — rejected; shared SurrealDB instance is the pattern for the whole stack

## Consequences

- Nebula is persistent — agents can reconnect to an in-progress trajectory
- Any harness (Claude Code, OpenCode, omp) can emit pheromones by writing to SurrealDB
- The `constellation/nebula` namespace is now part of the shared brain infrastructure (see `brain-infrastructure.md`)
- Future: DEFINE EVENT triggers unlock dependent trajectories automatically when tests_passed is emitted
