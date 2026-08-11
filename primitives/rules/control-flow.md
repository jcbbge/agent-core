# CONTROL FLOW — the established pattern (operator law)

Codified 2026-08-10 from the operator's verbatim directive. This is the ONE
hierarchy for all agentic work on this machine. It is not a suggestion.

```
OPERATOR (Josh)
  └── CONCIERGE            — the operator's avatar; entry point; talks to coordinators
        └── COORDINATOR    — ONE per project; reads/verifies/briefs; never implements
              └── ORCHESTRATOR(S) — per feature/bug/chore; plan + decompose + dispatch
                    └── AGENT(S)      — focused implementation / testing / verification of the work at hand
                    └── SUBAGENT(S)   — async items: deferred or not immediately needed
```

## Tier duties + one-off assists (operator refinement, 2026-08-11)

The purpose of the whole hierarchy is CONTEXT WINDOW MANAGEMENT: every
agent focused and head-down on the specific task at hand, nothing else.

- CONCIERGE facilitates and ROUTES work to workspace coordinators — it does
  not manage projects. One herdr WORKSPACE per project, its CORD in tab 1.
- Any tier may spawn one-off assist subagents at any time (research, a
  verification pass, a measurement) instead of bloating its own context —
  the assist is briefed, does its unit, reports, and is reaped.
- Cache geometry (proem doctrine, 2026-08-11): a prompt is a cache key with
  a shape. Briefs and spawn prompts carry a byte-identical shared prefix
  across siblings; per-agent specifics (names, ids, paths) go at the TAIL.
  One brief file per fanout when workers share a mission; volatility never
  goes in the prefix.

## Naming convention (herdr pane names — MANDATORY)

| Prefix | Role | Scope |
|---|---|---|
| `CORD [project name]` | Coordinator | one per project |
| `ORCH [feature/bug/chore]` | Orchestrator | one per committed unit of work |
| `AGNT [Task]` | Agent | the work at hand (implementation, test design, test run, triage) |
| `SAGT [TODO]` | Subagent | async / deferred / not immediately needed |

Every spawned pane is renamed to its prefixed role BEFORE its agent starts.
The prefix is what makes the herdr sidebar legible — who it is, at a glance.

## Mapping to Made Well (this is why it's clean)

| Control flow | Made Well |
|---|---|
| Coordinator | the outer loop owner: Discovery → Commit → Build → Land |
| Orchestrator | one Cycle: Imagine → Plan → Make → Verify |
| Agent | one item in the imagine queue (with the Isolation Mandate roles) |
| Subagent | discovery-queue / deferred items run async |

## Substrate

herdr is the substrate: use, leverage, optimize, and extend it in every way
possible — with herdr's established names, conventions, and API surface.
Extend without forking; where the codebase limits us, retrofit our patterns
into what it offers. (Codebase map + leverage/extend/retrofit analysis:
see the herdr research report, dispatched 2026-08-10.)

## Communications

Governed by ~/.tower/COMMS-ARCH.md: one message, one audience, once, in
full. Status is not mail. Fleet mail flows up the hierarchy; only
operator-addressed mail reaches the operator. Stigmergy over interrogation:
work leaves visible traces (Tower planes, statem events) so the operator
NEVER has to ask "what's the latest?".

## Observability spec (operator answers, 2026-08-10)

- **Live state in the chrome**: orchestrator TAB TITLES carry real-time
  Made Well state glyphs — GLYPHS ONLY (operator, 2026-08-10): no phase
  words, no active agent, no task text. e.g. `c004-ux ▰▰▱▱ ●2◐1` — updated
  by the statem process via `herdr tab rename` on every transition.
- **Execution pane**: one pane showing ALL agents in flight machine-wide,
  grouped by the hierarchy, each row: prefixed name · status glyph · what
  it is working on · project. Simple process (sh/bun/go), fed by
  `herdr api snapshot` + socket `events.subscribe`. PLACEMENT (operator,
  2026-08-10): a SPLIT of tab 1 beside the concierge/coordinator pane —
  never an isolated tab; any CTL an orchestrator creates splits into tab 1.
- **Tower pane**: ONE per project workspace (`TOWR [project]`), streaming
  that project's tasks/agents/events. Not pane-per-agent.
- **statem**: a minimal gen_statem-style tracker per project for the Made
  Well outer loop (Discovery→Commit→Build→Land) and inner loop
  (Imagine→Plan→Make→Verify): explicit states, explicit logged transitions,
  every transition leaves a Tower trace WITHOUT being asked.

## Reaping (operator rule, 2026-08-10)

An agent that is TRULY DONE — report delivered, done-conditions verified by
its spawner — is SPAWNED DOWN: pane closed, process ended, empty tab closed.
No trophy panes. The spawner reaps its own agents at collection; the
coordinator reaps orchestrators after their final report lands. Exceptions:
infrastructure panes meant to run forever (CTRL fleet, TOWR viewers, statem),
and never the operator's focused pane. Durable state lives on disk and the
board — never in a dead pane's scrollback.

## Prefix renames + CTRL-pane UX (operator, 2026-08-10)

Prefixes are now: CORD · ORCH · AGNT · SAGT · CTRL (fleet pane) · TOWR
(tower pane). Lowercase registration forms: orch- agnt- sagt-.

CTRL-pane 10X rules (operator: "memorable and lovable"; opaque ids like
`c004-i005` and pane/tab ids are NOISE):
- A row is: status glyph · role prefix · HUMAN WORK NAME · plain-language
  activity. Example: `● AGNT scroll-ui   reading mod.rs`
- Human work name comes from the item's TITLE, stamped by the spawner into
  the agent's identity at birth (display name/$task) — never a raw item id.
- Activity text is humanized: strip markup/notification fragments, verb
  phrases over raw commands, hard cap with clean ellipsis.
- NO pane/tab ids in the default view (ops get them from snapshot).
- Live things sort above done things; done things disappear on reap.

## CTRL-pane row enrichment (operator, 2026-08-10)

- Each agent row gains a SECOND LINE underneath: the agent's current
  operation/status (the live activity), so line 1 is identity (glyph · role ·
  human name) and line 2 is what it is doing right now.
- Rows also surface helpful telemetry where cheaply available: DURATION, and
  tokens/spend IF a harness exposes them machine-readably — deliver what is
  cheap, document what is not; never fabricate numbers. CORRECTION
  (2026-08-10, verified against `session.snapshot` and ctl-fleet.md
  §Telemetry this session): herdr exposes NO pane-birth timestamp anywhere,
  and board CLAIM rows are too weak a source (pane id lives only in
  loose free-text `body`, not every claim carries one) — neither is
  actually used. The real DURATION proxy, as implemented, is the pane's own
  agent transcript: for `herdr:claude` panes, the first timestamped record
  in `~/.claude/projects/*/<agent_session.value>.jsonl` is session start.
  Panes from other harnesses show no duration — not guessed. See
  ctl-fleet.md §Telemetry for the full mechanism.

## Two-plane CTRL (operator, 2026-08-10 — the fractal applied to WORK)

Same grammar, two focal depths:
- **Machine plane (coordination above projects)**: CTRL fleet gains a WORK
  section — per project: committed task items (Made Well outer loop:
  active + discovery counts) and WHICH ORCH owns each. The operator's
  standing view of "what tasks exist and who is carrying them".
- **Project plane**: in each project workspace's tab-1 split, CTRL shows
  that project's ORCHs and their delegated item breakdown with states
  (from .madewell/cycles/*.json) — the orchestrator's decomposition made
  ambient.
Data sources already exist (statem reads .madewell; ctl-fleet reads the
snapshot); this is a join, not a new system. Isolation per COMMS-ARCH
§Project isolation.

## CTRL SHIPPED section (operator, 2026-08-10)

The CTRL panes carry eng-manager-grade change signal, sourced from git:
- Machine plane: per project, a SHIPPED block — recent commits (last ~24h,
  cap ~5) as `sha · subject`, with a rollup line `N commits · +X −Y · M files`.
- Project plane: same block plus per-commit one-line file summaries
  (`path +a −b`), never raw diffs, never code.
- Data source is the repo behind the workspace cwd (git log --stat); zero
  new state, zero services. Uncommitted tracked changes shown honestly as
  `pending: <n> files`.
