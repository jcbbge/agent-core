# parent-wake handler + latch multi-until

## Shared law (identical for all workers in this wave)
You are a fleet AGENT (3-AGNT) under the concierge. Read first:
~/agent-core/primitives/rules/control-flow.md and ~/.tower/COMMS-ARCH.md.
- File partition is absolute — touch nothing outside your tail's list.
- Every task has a done-when; verify it yourself before claiming it.
- You never commit; the concierge integrates. Stage nothing.
- Tower: bun ~/.tower/cli.mjs post
  <claim|finding|note> <your-topic> "<body>" --from <your-name> — claim at
  start, finding per task, final finding starting DONE.
- Live-infra rule: any live hook/service you touch gets a pipe-test or
  smoke-run with recorded exit codes BEFORE you finish.
- Grounding hook: consecutive edits to one file need a fresh Read between.
- One-off assists allowed (spawn, collect, reap) — keep your context lean.
- Report-back: final message carries evidence per done-when; LAST action is
  touching your .done marker under ~/agent-core/briefs/decisions/done/.

## PROJECT TAIL
- Parent-wake handler in ~/herdr-spine/bin/handlers/ (precedent: 15-restore-view, 10-notify): on pane.agent_status_changed to done/idle for a pane whose tokens mark it a fleet worker (role 3-AGNT/4-SAGT/2-ORCH), locate its spawner pane (lineage tokens; spine-spawn stamps them — verify what exists, extend spine-spawn to stamp parent pane id at spawn if missing) and deliver ONE verified prompt to the spawner ("your worker <name> is done — collect via board + .done") — coalesce within 60s per spawner, record a board row, never prompt the operator's focused pane. Done when: a live test (spawn a trivial worker from a scratch parent pane, let it finish) shows the parent receives exactly one wake prompt, board row recorded, no wake for non-fleet panes.
- latch --until multi-status: make --until repeatable (any-of semantics, exit code = which status per the existing matrix) in primitives/tools/latch/; update README + tests. Done when: zig build test exit 0 + a live `latch wait pane <id> --until done --until blocked` demonstrates any-of.
- Partition: ~/herdr-spine/bin/handlers/ + bin/spine-spawn (lineage stamping only) + primitives/tools/latch/. Topic: herdr-spine/parent-wake. Marker: parent-wake.done
