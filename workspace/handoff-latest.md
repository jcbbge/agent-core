# Session Handoff
Date: 2026-03-12
Mode: meta/systems + constellation-ts project work

## Completed

- **constellation-ts schema migrated to cs_ prefix** — 7 tables defined in `constellation/nebula` SurrealDB: `cs_trajectory`, `cs_pheromone` (unified event log), `cs_consumption`, `cs_session`, `cs_star`, `cs_telemetry`, `cs_project`. Clean slate, no migration needed.

- **Pheromone = Event unification (ADR-014)** — One table. `cs_pheromone` carries `session_id`, `harness_id`, `project_id`. System scents `session_start`/`session_end`/`session_heartbeat` added. The handoff file is replaced by the pheromone trail.

- **constellation-ts end-to-end working** — Vega fires, calls LLM via direct Anthropic fetch (removed Vercel AI SDK dependency), emits `orbit_question`, trajectory enters `awaiting_orbit`. nQ=0 protocol live and confirmed.

- **SurrealDB v3 patterns locked in** — `type::record('table', $id)` for lookups; `CREATE CONTENT $data` respects `id` field; `WHERE id = $string_param` does NOT work (RecordId vs string); `DEFINE ... OVERWRITE` for idempotent schema; `TYPE object FLEXIBLE` for arbitrary payloads.

- **ARCH.md written at ~/ARCH.md** — Full ecosystem architecture with 10 prioritized improvement opportunities.

## Decisions Captured

- ADR-014: Pheromone IS Event — unified table (accepted)

## Current State

constellation-ts is live. Trajectory `01KKHR9P6WP1AJSQXZ9PHFT9T9` in `awaiting_orbit` — Vega asked about dark mode persistence strategy. Debug trajectory debris in `constellation/nebula` needs cleanup.

agent-core state:
- 37 skills · 8 rules deployed
- MCP: executor routes to anima, dev-brain, kotadb, subagent

## Open Items (priority order)

1. **`constellation answer <id> "<text>"` command** — Vega is blocked, can't complete a trajectory without it
2. **Seed `cs_star` registry on startup** — `ensureSchema` should upsert all 6 star configs
3. **Wire `ending-session` / `starting-session` to `cs_session`** — functions exist, skills still write markdown
4. **Telemetry writes in `runStellarCycle`** — `cs_telemetry` is a ghost table; nothing writes to it
5. **Fix `upsertStar` logic bug** — UPDATE before existence check is backwards
6. **Delete stale PostgreSQL docs** in `constellation-ts/docs/architecture.md`
7. **kotadb indexing** — separate agent working on this; check status

## Next Session Focus

Implement `constellation answer` command + seed `cs_star` registry — unblocks full pipeline from `orbit_question` through `gate_open` to house advancement. First complete Dawn→Night run proves the system.
