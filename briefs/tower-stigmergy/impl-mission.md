# CORD tower-stigmergy — IMPLEMENT the stigmergic Tower (pheromone bus)

> From: CONCIERGE (operator go, 2026-08-12). Binding. Self-contained.
> Board topic: `constellation-zg/tower-stigmergy`. `.done` markers: `~/agent-core/briefs/tower-stigmergy/.done/impl-*.done`.

## 1. Authority chain

- **Design doc (the spec):** `~/constellation-zg/docs/TOWER_STIGMERGY_DESIGN_0812.md` — read it first; it is the binding design.
- **Operator rulings (bind, recorded at `~/agent-core/briefs/tower-stigmergy/mission.md` §5a):** D1 dedicated `~/.tower/pheromones.jsonl` stream · D2 COMMS-ARCH **Amendment A1** (fifth plane: STIGMERGIC FIELD — pheromones are environment, not messages) · D3 **idle-flip digest first** (reuse the existing herdr event edge; no new subscription machinery) · D4 **read-time evaporation** over the append-only log · D5 TTL defaults (work-available 15–60min, work-claimed 30s+heartbeat, work-done 24h, need-help nQ-bounded) · D6 **NO git-init of ~/.tower** (deferred by operator) · D7 **Tower fleet-scale only** (do NOT touch constellation-zg `src/`).

## 2. Scope and partitions (disjointness is law — a parallel mission is live)

YOU OWN:
- `~/.tower/` — `server.mjs`, `cli.mjs`, `lib.mjs`, `COMMS-ARCH.md` (amendment A1), new `pheromones.jsonl` machinery.
- `~/herdr-spine/bin/handlers/` — the idle-flip digest emitter (new handler; study existing `10-notify`, `40-tower-bridge`, `16-parent-wake` for the event-edge pattern).

YOU DO NOT TOUCH:
- `~/herdr-spine/bin/ctl-fleet*` — owned by the PARALLEL fleet-tasks-impl mission (board topic `agent-core/fleet-tasks`). File-partition is the coordination protocol.
- `~/agent-core/cli/`, `~/.agent-core/registry` — owned by the cursor-parity mission (cord-agent-core).
- constellation-zg `src/` — D7.
- Any harness config, any running pane.

## 3. Operational constraints (~/.tower is LIVE production)

- The running fleet depends on Tower RIGHT NOW. Before EVERY edit: timestamped backup (`cp <file> <file>.bak-$(date -u +%Y%m%dT%H%M%SZ)`) — matches the existing `.bak` convention in that dir.
- Pre-verify how `server.mjs` actually runs (MCP stdio per harness session vs daemon) BEFORE assuming any restart/deploy step — state lives in the jsonl files; document the activation model in your first board finding.
- Append-only truth: `pheromones.jsonl` is never rewritten; evaporation is derived at read time (D4).
- COMMS-ARCH amendment A1 is a doc edit with teeth: the fifth plane's semantics (emit/observe, no addressee, no relay, TTLs) must be written precisely enough that the cursor-parity and fleet-tasks missions can cite it.

## 4. Execution doctrine

- All spawns kind=cursor via `~/cursor-shim/cursor-fleet` (orch / worker / fanout / **make**). Implementation code goes through `cursor-fleet make` — the enforced Verify beat (bifurcated coder/test-maker worktrees, tester, arbiter, nQ≤3). Shim default profiles/models; no overrides.
- Topology: you are tab 1 of your workspace. ORCH(s) in a dedicated tab, workers gridded in a workers tab, all inside your workspace. Reap at collection — done = gone.
- Worktrees: `make` bifurcates into worktrees — for edits to `~/.tower` (NOT a git repo) worktrees don't apply; use `cursor-fleet worker` panes with the test-wall enforced by profile discipline (see cursor-fleet.md §Verify beat, raw-coder fallback) and keep the backup law.
- Suggested decomposition (your call to adjust): U1 pheromone stream + CLI verbs (emit/scan/read with read-time evaporation + TTLs) · U2 COMMS-ARCH A1 amendment · U3 idle-flip digest handler in herdr-spine · U4 end-to-end evidence (emit → field → digest observed by a second agent).

## 5. Comms + evidence

- Findings to `constellation-zg/tower-stigmergy` (this mission's topic — continuity with the design mission). Post from a real repo cwd (~/constellation-zg or ~/herdr-spine), never scratch.
- Provenance blocks on load-bearing evidence (`date -u`; `pwd -P`; file hashes for ~/.tower edits since there's no git: `shasum -a 256 <file>` before/after).
- Operator mail only for genuine external forks. Final report: board finding + `to:"operator"` deliverable summarizing what changed and how to observe it.

## 6. Done-when

- `pheromones.jsonl` live: emit + scan/read with TTL'd read-time evaporation working via `bun ~/.tower/cli.mjs` (evidence posted).
- COMMS-ARCH.md carries Amendment A1 (fifth plane) — committed nowhere (unversioned dir) but backed up and hash-evidenced.
- Idle-flip digest emitting from the herdr event edge (evidence: a real agent idle-flip produces a digest row).
- Tests green via the Verify beat; backups + hashes on the board; `.done` markers; panes reaped; operator deliverable sent.
