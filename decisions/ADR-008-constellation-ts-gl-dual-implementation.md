# ADR-008: Constellation TS/GL Dual-Implementation Strategy

**Date:** 2026-03-11
**Status:** Accepted

## Context

Constellation exists in two forms: a TypeScript/Bun implementation (v.01, v.02 archives) and a Gleam/BEAM rewrite (active, Phase 1 complete with Vega working). The Gleam version was started to get the benefits of BEAM (fault isolation, supervision trees, actor model, hot code loading) but Josh doesn't yet know Gleam well enough to move fast.

The TypeScript versions were abandoned in favor of Gleam, but the architecture (pheromones, nebula, four houses, six stars, stigmergy, nQ=0 protocol) is identical in both. A session of collaborative analysis found that the TS v.01 was 40% complete with all conceptual decisions locked.

## Decision

Maintain two parallel implementations with explicit separation:

- **`~/constellation-ts`** — TypeScript/Bun, daily driver. Build, stress test, and refine here. Provider-agnostic via OpenCode SDK (ADR-007). Nebula backed by SurrealDB.
- **`~/constellation-gl`** — Gleam/BEAM, future rewrite. Touch only when learning Gleam. Do not port features here until the TS version has been stress-tested.

The two repos are **exactly the same system** — same architecture, same named concepts, same four houses, same six stars — just different runtimes.

## Reasoning

- Moving fast on the architecture matters more right now than the runtime substrate
- TS allows immediate iteration with the existing stack (Bun, SurrealDB, OpenCode SDK)
- BEAM's fault isolation benefits are real but premature before the architecture is validated
- Stress testing TS will generate the feedback needed to inform the Gleam rewrite
- The Gleam version is preserved — no work is lost, it waits

## Rejected Alternatives

- **Continue Gleam only** — too slow while still learning the language
- **Merge back into one repo** — creates confusion about which runtime is active; clean separation is clearer
- **Abandon Gleam** — rejected; BEAM is the right long-term substrate once architecture is proven

## Consequences

- TS is the reference implementation for any agent working on Constellation
- Feature decisions made in TS should be documented in `docs/` so the Gleam rewrite can learn from them
- When Gleam rewrite begins, do a full retrospective on TS pain points first
