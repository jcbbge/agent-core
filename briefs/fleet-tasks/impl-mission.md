# CORD fleet-tasks — IMPLEMENT the fleet-task whiteboard (CORD/ORCH-plane task tool)

> From: CONCIERGE (operator go, 2026-08-12). Binding. Self-contained.
> Board topic: `agent-core/fleet-tasks`. `.done` markers: `~/agent-core/briefs/fleet-tasks/.done/impl-*.done`.

## 1. Authority chain

- **Design doc (the spec):** `~/agent-core/research/fleet-task-tool-design.md` (committed `560bf07`) — read it first; it is the binding design. Research basis: `briefs/fleet-tasks/research-cursor-tasks.md` + `research-plane-surfaces.md`.
- **Operator rulings (bind, recorded at `~/agent-core/briefs/fleet-tasks/mission.md` §5b):** D1 store = **GLOBAL `~/.fleet-tasks/state.json`** (operator overrode per-project) · D2 chrome = **CTRL TASKS section** in the Engine Shop fleet pane · D3 = **bun/TypeScript v1** · D4 = **Tower transition findings YES** · D5 = **CLI only, no MCP in v1** · D6 = **AGNT/SAGT read-only; only CORD/ORCH write** (ORCH scores tasks after worker `.done`).
- Mental model (operator): harness TodoWrite = personal notebook (UNTOUCHABLE — non-interference is a hard requirement); fleet-task = the whiteboard with sticky notes at the CORD/ORCH planes.

## 2. Scope and partitions (disjointness is law — parallel missions are live)

YOU OWN:
- `~/agent-core/primitives/tools/fleet-task/` — NEW tool (all of it).
- `~/.fleet-tasks/` — the global store (new).
- `~/herdr-spine/bin/ctl-fleet` (+ its lib if the design says so) — the TASKS section render.

YOU DO NOT TOUCH:
- `~/herdr-spine/bin/handlers/` — owned by the PARALLEL tower-stigmergy-impl mission (board topic `constellation-zg/tower-stigmergy`).
- `~/agent-core/cli/`, `~/.agent-core/registry`, `primitives/directives/`, `primitives/AGENTS.md` — owned by the cursor-parity mission (cord-agent-core). If you believe fleet-task needs registry registration, ESCALATE to CONCIERGE — do not edit the registry.
- `~/.tower/` code — you only APPEND findings via the normal board path (D4).
- Harness-level todo tools — never hook/wrap/redirect TodoWrite or any harness equivalent.

## 3. Execution doctrine

- All spawns kind=cursor via `~/cursor-shim/cursor-fleet` (orch / worker / fanout / **make**). Implementation code through `cursor-fleet make` (enforced Verify beat: bifurcated coder/test-maker worktrees, tester, arbiter, nQ≤3). Shim default profiles/models; no overrides.
- Topology: you are tab 1 of your workspace; ORCH tab + gridded workers tab inside it; reap at collection.
- Suggested decomposition (adjust as you see fit): U1 `fleet-task` CLI core (create/update/list/show; statuses pending|in_progress|completed|cancelled; mission→unit→task hierarchy; merge-by-id; one in_progress per CORD/ORCH scope; write-gate by caller role) · U2 Tower transition findings (D4) · U3 ctl-fleet TASKS section (Engine Shop render) · U4 dogfood + evidence (track THIS mission's remaining units with it, end-to-end, visible in CTRL).

## 4. Comms + evidence

- Findings to `agent-core/fleet-tasks`. Provenance blocks (`date -u`; `pwd -P`; `git rev-parse HEAD`) on load-bearing evidence.
- Commits: agent-core repo per commit convention (CORD gates; workers never commit). herdr-spine commits only your ctl-fleet partition.
- Operator mail only for genuine external forks. Final report: board finding + `to:"operator"` deliverable with a screenshot-equivalent (pane read) of the TASKS section rendering live tasks.

## 5. Done-when

- `fleet-task` CLI works end-to-end (create → in_progress → completed; list/show; hierarchy; role write-gate enforced; AGNT read path verified).
- Global store at `~/.fleet-tasks/state.json`; transitions post board findings (D4 evidence on the board).
- CTRL fleet pane renders the TASKS section with live data (evidence: `herdr pane read` of w29:p12).
- Verify beat green; commits landed; `.done` markers; panes reaped; operator deliverable sent.
