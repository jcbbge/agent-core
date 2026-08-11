# Brief: ORCH ctl-planes — two-plane CTRL + Tower project isolation
Date: 2026-08-10
Status: ready (DISPATCH GATED: wait for och-ctl-tweaks to land — it owns
ctl-fleet/statem/twr until its final report posts on topic ctl-tweaks)

## What This Is
Two operator mandates, codified and binding:
(A) ~/agent-core/primitives/rules/control-flow.md §Two-plane CTRL — the
    fractal applied to WORK: machine plane = per-project committed task
    items + owning ORCH; project plane = per-ORCH delegated item breakdown,
    rendered in that project workspace's tab-1 CTRL split.
(B) ~/.tower/COMMS-ARCH.md §Project isolation — namespaced fleet-mail
    topics (`<project-slug>/<topic>`), scoped reads everywhere project-level,
    no posting from scratch dirs, TOWR project-scoped by construction.
You are an ORCHESTRATOR (control-flow doctrine): sonnet AGNTs, isolation,
verified submits, reap on done. You never implement.

## Pre-Verified Facts (coordinator, 2026-08-10)
- Isolation audit (run this session): board topics ARE reused across many
  cwds today (e.g. one topic spanning /tmp scratch dirs and the repo);
  normCwd (in ~/.tower/lib.mjs) already collapses worktrees onto their repo;
  boardFor/inboxState are the scoped readers.
- Data sources: per-project .madewell/madewell.json (active/discovery) and
  .madewell/cycles/*.json (items+states) — statem.ts already reads them;
  ctl-fleet already reads `herdr api snapshot`. Live examples:
  /Users/jrg/future/.madewell/ and (new, may be sparse) ~/circadian.
- A NEW circadian workspace just opened with its own fleet — treat it as the
  second live project; nothing you build may leak future's mail into it or
  vice versa.
- File ownership: ctl-fleet, statem.ts, twr.ts, spawn docs are owned by
  och-ctl-tweaks UNTIL its DONE posts on board topic ctl-tweaks. Confirm
  that before your first edit; coordinate partitions from its final state.
- Minimality mandate stands: joins over new systems, ≤ ~150 new lines total,
  zero deps, zero services.

## Finishing Point
1. Machine CTRL (tab-1 split, machine session) gains the WORK section:
   project → committed items → owning ORCH (+ discovery count).
2. Per-project CTRL variant: launched as a tab-1 split in a project
   workspace, shows that project's ORCH → item breakdown with states.
3. Topic namespacing: spawn docs + brief templates updated so fleet mail
   uses `<project-slug>/<topic>`; scoped-read discipline documented; TOWR
   filter verified against the namespaced form (backward-compatible read of
   legacy topics is fine).
4. Cross-talk proof: with both future and circadian live, each project's
   TOWR/CTRL shows ONLY its own work; the machine plane shows both.

## How We'll Know It's Done
- [ ] Live capture: machine CTRL showing future + circadian work sections
- [ ] Live capture: project CTRL in one workspace showing only that project
- [ ] A test post under `future/<topic>` invisible to circadian's TOWR and
      vice versa
- [ ] Workers reaped; board post topic ctl-planes with evidence

## Report back with (exact completion contract)
Board post topic ctl-planes: files+line counts, the three captures,
deviations or "none".
