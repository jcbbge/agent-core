# CORD constellation-zg — tower-stigmergy: research the baseline, design the stigmergic Tower

> From: CONCIERGE (operator intake 2026-08-12). Binding. Self-contained.
> Board topic: `constellation-zg/tower-stigmergy`. `.done` markers: `~/agent-core/briefs/tower-stigmergy/.done/`.

## 1. Operator directive (verbatim, the authority)

> "major updates to tower we need to figure out a better pattern because this is unsustainable too much work gets done and gets sent off into the void and nobody knows about anything so there needs to be a more structured system of tracking work and communicating to the correct agents who generated the work and the delegated agents who were doing the work so I would like to adopt a stigmatic pattern I've already established some of the baseline in the root directory constellation dash ZG so moving forward I'll need you to have some research agents do the research of constellation dash ZG and then we need to formulate some ideas around implementing tower in a way that it is more stigmatic and what I mean by that is when an agent agents give off pheromones for messaging so work done or work to be done and then tower will be the message bus that facilitates this knowledge of pheromones so knowing seeing the pheromone knowing who to route it to knowing who to delegate it to knowing what should happen in the same way that ants work together to find food source water find tunnels dig tunnels etc."

Pain points driving this (operator, this session): agents sit idle; completed work is not noticed until the operator manually pings or an agent polls on a timer. Work disappears into the void between the agent that generated it and the agents who should act on it.

## 2. Mission

Two phases, **design-gated** — this mission ends at an operator-reviewed design, NOT implementation:

- **Phase 1 — Research the baseline.** Research agents (SAGT, researcher profile) study `~/constellation-zg/` and extract the stigmergic machinery the operator has already established: concepts, data models, pheromone/signal types, decay/routing mechanics, and anything already built in `src/` (Zig). Start from its own docs: `PROGRAM.md`, `VISION.md`, `TAXONOMY.md`, `TELEMETRY.md`, `WORK.md`, `AGENTS.md`, `docs/`.
- **Phase 2 — Formulate the stigmergic Tower design.** How Tower (`~/.tower/`) becomes the pheromone bus: pheromone types (work-done, work-available, need-help, …), emission points (agent lifecycle events, board posts, `.done` markers, herdr `pane.agent_status_changed`), evaporation/decay, routing (who generated the work ↔ who should act), delegation triggers, and how idle agents discover work without polling. Must compose with comms law (`~/.tower/COMMS-ARCH.md` — four planes, one message/one audience/once/in full) or explicitly propose its amendment.

**Deliverable:** design doc committed at `~/constellation-zg/docs/tower-stigmergy-design.md` (or wherever the repo's own docs convention puts it — follow the repo), key findings + the proposal summary posted to the board, and a `to:"operator"` deliverable with the decision points. Implementation is a LATER mission after operator review.

## 3. Pre-verified facts (CONCIERGE, this session, 2026-08-12 ~16:05 UTC)

- `~/constellation-zg/` exists; git repo @ `ed6852f`. Top level: `AGENTS.md`, `PROGRAM.md`, `VISION.md`, `TAXONOMY.md`, `TELEMETRY.md`, `WORK.md`, `compare_orchestration.md`, `UI_visualization_notes.md`, `VISUAL.md`, `build.zig`/`build.zig.zon` (Zig project), `src/`, `docs/`, `harness/`, `nebula/`, `skills/`, `web/`, `journal/`, `ready/`, `bare/`, `main/`, `workspace/`, `test-*` scripts, `slate.json`.
- `~/.tower/` is the LIVE message bus and is **NOT a git repository** — `server.mjs`, `cli.mjs`, `lib.mjs`, `COMMS-ARCH.md`, state: `board.jsonl`, `ledger.jsonl`, `odometer.jsonl`, `deliverables/`, `flight/`, `hooks/`, plus `.bak` copies. The running fleet depends on it right now. **Read-only this mission** — no edits to anything under `~/.tower/`. The design doc should note the absence of version control as a finding and propose the migration path.
- Tower MCP tools (live): `send_to_user`, `ask_user`, `reply`, `check_inbox`, `mark_relayed`, `board_post`, `board_read`, `relay_inbox`. CLI: `bun ~/.tower/cli.mjs`.
- herdr 0.8.0 emits `pane.agent_status_changed` events over the socket (`~/.config/herdr/herdr.sock`, NDJSON, `events.subscribe`); `~/herdr-spine/bin/handlers/` already bridges some events to Tower (`10-notify` → board lines, `40-tower-bridge` → ledger questions). This is the existing emission edge — study it.
- Comms law today: `~/.tower/COMMS-ARCH.md`. Status flips are board-only; only `to:"operator"` mail reaches the operator plane. The operator's complaint IS the current pattern's failure mode — the design must close it without violating one-message/one-audience/once.
- Profiles (cursor-gateway only, per operator's standing model constraint): researcher default `cursor/composer-2.5:fast`; orchestrator `cursor/grok-4.5:high`; coder `cursor/composer-2.5`. Spawn via `~/bin/spine-spawn` (python3, NEVER bun).

## 3a. OPERATOR CORRECTION (2026-08-12 ~16:20 UTC, via CONCIERGE — supersedes the spine-spawn/pi-profile spawn path in §3/§4)

All NEW spawns are **kind=cursor via the cursor-shim**: research SAGTs via `~/cursor-shim/cursor-fleet worker researcher --prompt "<q>" --headless` (one-shot, auto-reaped) or async panes; any ORCH via `cursor-fleet orch`. Shim DEFAULT profiles/models (grok/composer tiers on the cursor subscription) — no overrides. Your own pane stays pi; the correction applies to everything you spawn.

## 4. Topology (new doctrine, applies to you)

You are tab 1 of task workspace `tower-stigmergy`. Research SAGTs go in a dedicated workers tab in THIS workspace (gridded, ≤4 per tab). All spawns `--kind pi --profile <role>` with `--workspace` targeting this workspace. Reap at collection — done = gone.

## 5. Constraints

- Read-only on `~/.tower/` and on the running fleet's config. constellation-zg writes: the design doc + research notes only.
- Epistemics: every claim about what constellation-zg already does must cite a file/command read this session. Mark `[UNKNOWN]` where the baseline is ambiguous; do not invent pheromone mechanics the repo doesn't have — the design may PROPOSE new mechanics, labeled as proposals.
- Comms law: findings to `constellation-zg/tower-stigmergy`; operator mail only the final deliverable + genuine decision forks.
- Commits in constellation-zg per the commit convention (`<type>(<scope>): <summary>` + PHASE/DONE/TODO); stage explicitly.

## 5a. OPERATOR RULINGS on design decision points (2026-08-12 ~16:40 UTC, via CONCIERGE — bind the future implementation mission)

Design doc: `~/constellation-zg/docs/TOWER_STIGMERGY_DESIGN_0812.md` (committed `a644987`). Rulings:
- D1 substrate: **dedicated `pheromones.jsonl` stream** in `~/.tower/` (as recommended).
- D2 plane law: **Amendment A1 adopted** — COMMS-ARCH gains a fifth plane, STIGMERGIC FIELD (pheromones are environment, not messages).
- D3 push sequencing: **idle-flip digest first** — reuse the existing herdr event edge (as recommended).
- D4 evaporation: **read-time derivation** over the append-only log (as recommended).
- D5 TTLs: **defaults accepted** (work-available 15–60min, work-claimed 30s+heartbeat, work-done 24h, need-help nQ-bounded).
- D6 Tower version control: **DEFERRED** by operator — not part of the stigmergy work (overrode the git-init recommendation).
- D7 scope: **Tower fleet-scale only** — constellation-zg `pheromone.zig` rewiring is a separate later mission (as recommended).

## 6. Done-when

- Phase 1: research findings posted to the board (what the baseline establishes, with file citations).
- Phase 2: `tower-stigmergy-design.md` committed in `~/constellation-zg` (provenance block: `date -u`; `pwd -P`; `git rev-parse HEAD`); proposal summary + decision points delivered `to:"operator"`.
- `.done` markers written; all panes reaped; final report on the board.
