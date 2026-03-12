# ADR-014: Pheromone IS Event — One Unified Table

**Date:** 2026-03-12
**Status:** Accepted

## Context

Constellation needed an event log for session handoffs (replacing `handoff-latest.md`) and a pheromone store for stigmergic coordination. These were designed as separate systems in two separate conversations (minimax + grok), with separate schemas being considered.

The question surfaced during implementation planning: should `cs_pheromone` (stigmergic coordination) and `cs_event` (session audit log) be separate tables, or one?

## Decision

One table. `cs_pheromone` IS the event log. A pheromone is an event. No separate audit table.

The `cs_pheromone` schema was extended with `session_id`, `harness_id`, and `project_id` fields. System scents `session_start`, `session_end`, and `session_heartbeat` were added to the `Scent` type. Session lifecycle events are now pheromones — they flow through the same append-only log as all other coordination events.

## Consequences

**Easier:**
- Single query surface for all historical data — one `SELECT` from `cs_pheromone` answers "what happened" across both agent coordination and harness sessions
- No write fan-out — one `emit()` call captures everything
- Cross-trajectory analysis is natural: `WHERE session_id = $s` shows all pheromones from a given harness session across all trajectories
- Ted Nelson's transclusion principle satisfied: no copies, no divergence

**Harder:**
- `cs_pheromone` will grow large — telemetry snapshots need careful frequency management
- The `orbit_question` / `session_start` distinction is semantic only — both are pheromones, consumers must filter by `scent`

**New problems created:**
- Accretion queries must explicitly exclude `session_start`/`session_end`/`session_heartbeat` scents from star consumption (add to all star `forbids` lists, or filter in `runStellarCycle`)

## Alternatives Rejected

| Alternative | Why rejected |
|---|---|
| Separate `cs_event` table for session/harness events | Two sources of truth. Writes must be duplicated. Queries span tables. Ted Nelson would object: it's a copy. |
| Keep `handoff-latest.md` as primary session record | Last-write-wins. Multi-harness trampling. No queryability. Already proven broken. |
| Snapshots on every pheromone (`state_snapshot` field) | Inconsistent across concurrent agents. Denormalizes derived state back into the event log. Expensive per-write. |

## Resonance

The moment of clarity was framing it through Xanadu: there should never be two representations of the same truth. The handoff document and the pheromone trail were always the same thing — one was just a degraded, overwritten copy of the other. Making them one table felt like removing a seam that shouldn't have existed.
