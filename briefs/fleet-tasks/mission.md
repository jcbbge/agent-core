# CORD fleet-tasks — research Cursor's task tool, design the coordinator/orchestrator-plane task layer

> From: CONCIERGE (operator intake 2026-08-12). Binding. Self-contained.
> Board topic: `agent-core/fleet-tasks`. `.done` markers: `~/agent-core/briefs/fleet-tasks/.done/`.

## 1. Operator directive (verbatim, the authority)

> "I would like to figure out cursors task system I really enjoy the UI and the UX it seems very well structured well defined whenever I'm using the cursor agent it's nice to see the clear check mark of task whether it's done whether it's not done so I would first like to just do some research into cursor see if we can look into the maybe the source code itself or see if we can find something online about the task tool and then the purpose of an intent of that research is that I want to incorporate that task tool like ability simplicity ease of use into my workflow somewhere I'm not sure if it's specifically in if it needs to be your hurdle level control plane or if this should belong inside of tower as the message bus but effectively what I want to do is to augment the current agents task so all of my cursor agents have their own access to the to-do tool within the current agent runtime that's fine I don't want to interrupt that what I'm wanting to do though is to have another layer above for my orchestrator and also for the coordinator so basically I want the coordinator and the orchestrator to have a version of the cursor to do cursor task tool whereby they create tasks I can see them in a pane and I can see the progress and again this will roll up to the concierge's control pane and tower pane. so the end goal is to have a task tool that is on par and at the same level of excellence as cursor's task tool but this is only for my orchestrator agent and only for the coordinator agents and again any work that a coordinator does not only should they use their task tool in their agent runtime but they should be using the task tool to get the higher level observability for the coordinator and then the same thing for the orchestrator so effectively I don't want to interrupt the cursor agent runtime harness task tool I just want to model my own version that lives at the coordinator plane and the orchestrator plane that operates similarly so the mental model is the task to do at the coordinator and orchestrator level are essentially like a white board with sticky note task on it and then the to do task tool in the cursor agent harness is like their personal notebook so the way the agent harness uses the tool it's fine it's perfect it doesn't need to be bothered I don't want to interrupt that at all I just want a task level tooling at the coordinator plane orchestrator plane and then somehow this needs to live either in the directives for generalized coordinator orchestrator spawning to utilize this tool so it can be rolled into tower it can be rolled into herder it can be something entirely different I don't care what I do care about is the agentic experience the developer experience and the user experience"

## 2. Mental model (operator's — anchor the design on this)

- Harness todo tool (cursor TodoWrite etc.) = the agent's **personal notebook**. Perfect as-is. DO NOT interrupt, wrap, or redirect it.
- The new layer = a **whiteboard with sticky notes** at the CORD and ORCH planes. Coordinators and orchestrators create/update fleet-visible tasks; the operator sees them in a pane with clear done/not-done state and progress; rollup flows AGNT → ORCH → CORD → the Engine Shop (CTRL + TOWR panes).
- Placement (herdr control plane vs Tower bus vs new tool) is OPEN — the design must recommend with rationale. What the operator cares about: **agentic experience, developer experience, user experience** — on par with cursor's task tool.

## 3. Mission (design-gated — NO implementation this mission)

**Phase 1 — Research.**
1. Cursor's task/todo system: structure, states, transitions, rendering, why the UX reads as excellent. Sources, in order of preference: (a) cursor's public docs online (docs.cursor.com — fetch what exists about the task/todo tool and agent task UI); (b) the local `cursor-agent` CLI (`~/.local/bin/cursor-agent`, v2026.08.11-e8db854 — help surface, output schemas, any task verbs); (c) the Cursor.app bundle (bounded effort — strings/schemas only if cheap); (d) the cursor-sdk skill doc at `~/.cursor/skills-cursor/sdk/SKILL.md`. Mark anything unreachable `[UNKNOWN]` — do not invent cursor internals.
2. Internal prior art to position against (all local, read them): `~/agent-core/primitives/tools/statem/` (statem Made Well tracker + `twr.ts` board viewer; derives stage/phase from `.madewell/`, posts `statem` board rows, rewrites tab glyphs), `~/herdr-spine/bin/ctl-fleet` (CTRL fleet pane; WORK section reads each project's `.madewell/`), Tower board/ledger (`~/.tower/`), herdr per-pane `$task` tokens (live-overwritten by the agent monitor — known trap, see spawn.md). The design must say how the new layer composes with or supersedes each.

**Phase 2 — Design.** `fleet-task-tool-design.md` covering: data model (task states, hierarchy mission/unit/task, ownership by pane/agent, progress + rollup semantics); the tool surface CORD/ORCH agents actually call (CLI / pi extension / MCP — must be harness- and model-agnostic per the framework contract); the operator-facing rendering (dedicated pane per task workspace? rollup into CTRL rows? TOWR section?); the adoption path into generalized CORD/ORCH spawning (directives/profiles/spine-spawn brief templates); and the explicit non-interference proof for harness-level todo tools.

**Deliverable:** findings + design doc committed at `~/agent-core/research/fleet-task-tool-design.md` (follow the research/ dir conventions), summary + placement recommendation posted to the board, decision points delivered `to:"operator"`. Implementation is a LATER mission after operator review.

## 4. Pre-verified facts (CONCIERGE, this session, 2026-08-12 ~16:12 UTC)

- `cursor-agent` CLI: `~/.local/bin/cursor-agent`, version `2026.08.11-e8db854`. Cursor.app installed at `/Applications/Cursor.app`.
- `~/agent-core/research/` exists; topical `.md` convention (00–15 numbered + topical); `harness-ontology-map.md` landed there today (Unit A of the cursor-parity mission — read it; the tool-surface matrix is relevant).
- statem + twr: `~/agent-core/primitives/tools/statem/` (README owns the doc table entry). ctl-fleet: `~/herdr-spine/bin/ctl-fleet`, docs `~/herdr-spine/docs/ctl-fleet.md`.
- Tower: `~/.tower/` (NOT a git repo — live bus; read-only). Comms law: `~/.tower/COMMS-ARCH.md`.
- herdr 0.8.0; `$task` token is stamped at spawn but herdr's live monitor overwrites it with the delivered prompt (documented trap in `~/herdr-spine/docs/spawn.md` §$task).
- Topology doctrine (codified today): you are tab 1 of workspace `fleet-tasks`; workers in a dedicated gridded tab in THIS workspace; `--workspace` on all spawns; reap at collection.
- Models: cursor-gateway only. researcher `cursor/composer-2.5:fast`, orchestrator `cursor/grok-4.5:high`. `~/bin/spine-spawn` (python3, NEVER bun).

## 4a. OPERATOR CORRECTION (2026-08-12 ~16:20 UTC, via CONCIERGE — supersedes the spine-spawn/pi-profile spawn path in §4)

All NEW spawns are **kind=cursor via the cursor-shim**: research SAGTs via `~/cursor-shim/cursor-fleet worker researcher --prompt "<q>" --headless` (one-shot, auto-reaped) or async panes; any ORCH via `cursor-fleet orch`. Shim DEFAULT profiles/models (grok/composer tiers on the cursor subscription) — no overrides. Your own pane stays pi; the correction applies to everything you spawn.

## 5. Constraints

- No implementation; no edits to `~/.tower/`, herdr-spine code, statem, or any live config. Writes: the design doc + research notes in `~/agent-core/research/` only.
- Non-interference is a hard requirement: the design must not touch, wrap, hook, or redirect any harness-level todo/task tool.
- Epistemics: cursor internals claims need a this-session source (doc fetch, CLI output, file read); else `[UNKNOWN]`. Commits in agent-core per the commit convention; stage explicitly.
- Comms law: findings to `agent-core/fleet-tasks`; operator mail only the final deliverable + genuine decision forks.

## 5b. OPERATOR RULINGS on design forks (2026-08-12 ~16:35 UTC, via CONCIERGE — bind the future implementation mission)

Design doc: `research/fleet-task-tool-design.md` (committed `560bf07`). Rulings:
- D1 store: **GLOBAL `~/.fleet-tasks/`** (operator overrode the per-project recommendation) — one store, all projects.
- D2 chrome: **CTRL TASKS section** in the Engine Shop fleet pane (as recommended).
- D3 language: **bun/TypeScript v1** (as recommended).
- D4 Tower side-effects: **YES** — task transitions echo to the board as findings.
- D5 MCP: **CLI only in v1** (as recommended).
- D6 AGNT access: **read-only** — only CORD/ORCH write; ORCH scores tasks after worker `.done` (as recommended).

## 6. Done-when

- Phase 1 findings on the board with citations (cursor task system + internal prior art).
- `research/fleet-task-tool-design.md` committed (provenance block: `date -u`; `pwd -P`; `git rev-parse HEAD`); placement recommendation with AX/DX/UX rationale delivered `to:"operator"`.
- `.done` markers; panes reaped; final report on the board.
