# Brief: OCH herdr-qol — legible sidebar + the control-plane execution pane
Date: 2026-08-10
Status: ready

## What This Is
The operator cannot tell who an agent is, what it's working on, or why it
matters from the herdr sidebar (rows like "done · c004-td-i004 · c004-ux /
Done. Wrote `/Users/jrg/...`"). Two deliverables, MINIMAL by operator mandate
("simplest, easiest, minimal, barebones"):
(A) Sidebar legibility using what herdr already provides — naming discipline
    (CRD/OCH/AGT/SUB prefixes) plus any leverage the research report finds.
(B) THE EXECUTION PANE: one always-on herdr pane ("CTL fleet") running a
    simple process (bun preferred; sh acceptable) that renders the ENTIRE
    control plane: every agent in flight machine-wide, grouped
    CRD > OCH > AGT/SUB per project, each row: prefixed name · status glyph
    (●working ◐blocked ○idle ✓done) · what it is working on · project.
You are an ORCHESTRATOR: plan, dispatch sonnet AGT workers in prefixed herdr
panes, verify, report to the coordinator (pane w1A:p1, "CRD future"). You
never implement.

## Pre-Verified Facts (coordinator, 2026-08-10)
- Law first: ~/agent-core/primitives/rules/control-flow.md (hierarchy, naming,
  observability spec) + ~/.tower/COMMS-ARCH.md.
- `herdr api snapshot` returns full tree JSON incl. per-pane: agent,
  agent_status, tokens ($task/$verdict preview strings), label/name, cwd,
  workspace/tab ids (verified live this session).
- Socket API supports events.subscribe for pane.agent_status_changed pushes
  (documented in the herdr skill; socket path ~/.config/herdr/herdr.sock).
- `herdr pane rename` + `herdr tab rename` exist and take effect immediately
  in the sidebar (verified: panes "CRD future", "OCH c004-ux" renamed live).
- A research agent is mapping the herdr codebase for leverage/extend/retrofit
  specifics; its report will land at ~/source/herdr-RETROFIT-MAP.md. START
  with what is verified above (renaming discipline + snapshot/subscribe pane);
  fold the report in when it exists — do NOT block waiting on it.
- bun installed (~/.bun/bin/bun). Do not touch herdr source (~/source/herdr
  is read-only reference).

## Finishing Point
1. `CTL fleet` pane live in the default session: hierarchy-grouped, live
   (event-driven with snapshot reconcile; poll fallback ≤2s), readable at a
   glance, survives detach. ≤ ~250 lines, zero deps beyond bun stdlib.
2. Renaming discipline codified where spawners read it: a short section
   appended to the spawn tooling docs (~/herdr-spine/docs/spawn.md) and, if
   the research report shows a config/token lever for richer sidebar rows
   (e.g. settable $task), a worked example applied to one live pane.
3. Anything requiring herdr source changes: DOCUMENT as a proposal, do not
   implement.

## How We'll Know It's Done
- [ ] Operator can glance at CTL fleet and answer: who is running, what each
      is doing, under which project/OCH — with zero prompting
- [ ] New agents spawned with prefixed names appear correctly grouped
- [ ] Pane survives client detach/reattach (herdr owns the process)
- [ ] No herdr fork; no new services

## Out of Scope
statem/Tower panes (OCH statem-tower owns those); the future repo; herdr
source modifications.

## Report back with (exact completion contract)
Board post topic "herdr-qol" from your OCH name: file paths + line counts,
CTL pane id, screenshot-equivalent (pane read capture), what the research
report added (or "not yet landed"), deviations or "none". Idle only with
wake signals armed on live workers.
