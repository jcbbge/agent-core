# Brief: OCH ctl-tweaks — two small operator-mandated adjustments
Date: 2026-08-10
Status: ready

## What This Is
Two scoped tweaks to just-landed observability code, both operator-mandated
(recorded in ~/agent-core/primitives/rules/control-flow.md §Observability):
(1) CTL fleet placement: spawns as a SPLIT of tab 1 beside the concierge/
    coordinator pane, never an isolated tab.
(2) statem tab titles: GLYPHS ONLY — no phase words, no agent/task text
    (e.g. `c004-ux ▰▰▱▱ ●2◐1`).
You are an ORCHESTRATOR (control-flow doctrine): dispatch one sonnet AGT
(these two changes are one small partition), verify, reap, report. You never
implement.

## Pre-Verified Facts (coordinator, 2026-08-10)
- CTL pane already MOVED live into tab 1 by the coordinator via
  `herdr pane move w1A:pD --tab w1A:t1 --split right --target-pane w1A:p1
  --ratio 0.62 --no-focus` (verified: pane now in w1A:t1; old tab
  auto-closed). The CODE/DOCS still describe tab placement — that is the gap.
- CTL fleet code: ~/herdr-spine/bin/ctl-fleet (250 lines); its docs
  ~/herdr-spine/docs/ctl-fleet.md describe how it is spawned. Whatever
  spawn/bootstrap path exists there must produce the tab-1 split (use
  `pane move`/split-with-target semantics as above; ratio ~0.62).
- statem code: ~/agent-core/primitives/tools/statem/statem.ts (164 lines) —
  it composes tab titles via `herdr tab rename`; current format includes a
  phase word (e.g. `▰▰▱▱ Plan ●2◐3`). Strip words: keep base label + ▰▱
  progression + ●◐ counts only. Restamp any currently-stamped tabs after
  the change (mapping file ~/.tower/statem-tabs.json).
- Reaping rule applies: collect, verify, close your worker's pane and empty
  tabs, then report and exit-idle with nothing armed (no live workers).
- Line budgets stand: no growth beyond +15 lines total across both files.

## How We'll Know It's Done
- [ ] ctl-fleet spawn path (code+docs) produces a tab-1 split, verified by
      killing and respawning the live CTL pane once (end state: CTL running
      as a split of w1A:t1, coordinator pane untouched, focus preserved)
- [ ] statem restamped titles contain NO alphabetic phase/agent/task words
      beyond the base tab label (live evidence: one stamped title before/after)
- [ ] Worker reaped; board post topic ctl-tweaks with the evidence

## Report back with (exact completion contract)
Board post topic ctl-tweaks: diffs summary, the before/after title, the
respawned CTL pane id. Nothing else.
