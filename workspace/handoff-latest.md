# Session Handoff
Date: 2026-03-25
Mode: meta/systems

## Completed

- **Brain-layer MCPs wired through executor permanently** — anima (3098), dev-brain (3097), kotadb (3099), subagent-mcp (3096) now auto-register on every executor boot via `executor-start.sh` + `seed-brain-layers` CLI command. `tools.anima.*`, `tools.devbrain.*`, `tools.kotadb.*`, `tools.subagent.*` all work inside executor.execute() context.

- **Primitives service fixed** — `packages/executor-mcp/src/primitives.ts` now uses filesystem discovery from `~/Documents/_agents/schema/` instead of querying dev-brain SurrealDB. primitives/list returns 40+ primitives with zero infrastructure dependencies.

- **executor-start.sh** — startup wrapper at `~/bin/executor-start.sh`. Starts bun executor, waits for reachability, seeds sources. launchd plist updated.

- **SurrealDB persistence fixed** — switched back to `surrealkv:///Users/jcbbge/dev-backbone/db` (persistent). Was in memory mode, causing state loss on every restart.

- **Deep architecture analysis** — ran 4 parallel subagents (fresh-eyes, big-brain-optimizer, challenging-assumptions, reframing) against the Tool Shed PRD. Key finding: gateway direction is right; SurrealDB + embeddings is premature at current scale; session lifecycle was always 40 lines from fixed.

## Decisions captured
- ADR: Brain-layer MCPs auto-registered with executor on boot
- ADR: Primitives service uses filesystem discovery, not SurrealDB

## agent-core state
- 43 skills · 15 rules · executor sources: anima, dev-brain, kotadb, subagent-mcp (all persistent)

## Open items
1. anima bootstrap `fold_config` table missing — anima internal issue, needs investigation
2. Build static capability `manifest.json` from schema dir — next primitive discovery step
3. Verify Claude Code + OpenCode harness configs are executor-only

## Next session focus
The executor gateway works. Next: build static `manifest.json` (generated from schema dir) so agents get full primitive awareness at bootstrap with zero query latency — no SurrealDB needed at current scale.
