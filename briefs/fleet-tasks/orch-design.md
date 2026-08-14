# ORCH fleet-task-tool design — the CORD/ORCH-plane whiteboard

> From: CORD fleet-tasks (w2E:p2). Binding. Self-contained.
> Board topic: `agent-core/fleet-tasks`. `.done` marker: `~/agent-core/briefs/fleet-tasks/.done/orch-design.done`.

## Authority

Operator directive (verbatim) is in `~/agent-core/briefs/fleet-tasks/mission.md` §1 — read it first. Mental model (§2 of the mission) is the anchor:

- Harness todo tool (cursor TodoWrite etc.) = the agent's **personal notebook**. Perfect as-is. DO NOT interrupt, wrap, hook, or redirect it. (Hard requirement — the design must include an explicit non-interference proof.)
- The new layer = a **whiteboard with sticky notes** at the CORD and ORCH planes. CORD/ORCH agents create/update fleet-visible tasks; the operator sees them in a pane with clear done/not-done state and progress; rollup flows AGNT → ORCH → CORD → the Engine Shop (CTRL + TOWR panes in workspace `concierge`).
- Placement (herdr control plane vs Tower bus vs new tool) is OPEN — you must **recommend with AX/DX/UX rationale**. What the operator cares about: agentic experience, developer experience, user experience — on par with cursor's task tool.

## Inputs (all verified/read by CORD this session — read them yourself before designing)

**Research findings (Phase 1, produced by your predecessor SAGTs):**
- `~/agent-core/briefs/fleet-tasks/research-cursor-tasks.md` — cursor task/todo system ground truth.
- `~/agent-core/briefs/fleet-tasks/research-plane-surfaces.md` — Tower/herdr/statem/ctl-fleet code-level API ground truth.

**Prior art to position against (compose-with vs supersede verdict required for EACH):**
- `~/agent-core/primitives/tools/statem/` — statem (Made Well tracker, posts `statem` board rows, rewrites tab glyphs) + twr (read-only live board viewer). README owns the doc table entry.
- `~/herdr-spine/bin/ctl-fleet` — CTRL fleet pane; WORK section reads `.madewell/`; docs at `~/herdr-spine/docs/ctl-fleet.md`.
- Tower board/ledger — `~/.tower/` (READ-ONLY live bus; comms law `~/.tower/COMMS-ARCH.md`).
- herdr per-pane `$task` tokens — stamped at spawn but live-overwritten by herdr's agent monitor (documented trap, `~/herdr-spine/docs/spawn.md` §$task). Tokens do not survive server restart.
- `~/agent-core/research/harness-ontology-map.md` — tool-surface matrix across harnesses.

## Deliverable (the ONLY write target)

`~/agent-core/research/fleet-task-tool-design.md` — follow the research/ dir conventions (topical .md, provenance block: `date -u`; `pwd -P`; `git rev-parse HEAD`). Do NOT commit — CORD gates and commits. No other writes anywhere. No implementation, no code beyond illustrative sketches inside the doc.

The design doc must cover, at minimum:

1. **Data model** — task states (exact enum), hierarchy (mission / unit / task), ownership by pane/agent, progress + rollup semantics (how AGNT-level state rolls to ORCH, ORCH to CORD, CORD to Engine Shop).
2. **Tool surface** — what CORD/ORCH agents actually call (CLI / pi extension / MCP — must be harness- and model-agnostic per the framework contract: no provider names, capabilities by path and CLI).
3. **Operator-facing rendering** — dedicated pane per task workspace? rollup into CTRL rows? TOWR section? Recommend a primary + note what was rejected and why.
4. **Adoption path** — how this lands in generalized CORD/ORCH spawning: directives / profiles / spine-spawn brief templates. Concrete, named files.
5. **Non-interference proof** — explicit argument that harness-level todo tools are untouched (no hooks, no wrapping, no redirect; separate store, separate tool name, separate render).
6. **Placement recommendation** — herdr control plane vs Tower bus vs new standalone tool, with AX/DX/UX rationale and the compose-with/supersede verdict for each piece of prior art.
7. **Decision points for the operator** — the genuine forks only, each with a recommendation.

## Constraints

- Epistemics: cursor internals claims cite the Phase 1 research file (which carries this-session sources); anything it marked `[UNKNOWN]` stays `[UNKNOWN]` in the design.
- Comms law: findings to `agent-core/fleet-tasks`; no operator mail — CORD delivers the final recommendation.

## Done-when

- `research/fleet-task-tool-design.md` written, all 7 sections present, placement recommendation stated plainly.
- Summary finding (5-10 lines) posted to board topic `agent-core/fleet-tasks`.
- `.done` marker `~/agent-core/briefs/fleet-tasks/.done/orch-design.done` (one line: outcome + doc path).
- Report-back to CORD via board; pane ready to reap.
