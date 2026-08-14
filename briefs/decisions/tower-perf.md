# tower ledger byte-cursor + task-report fire-and-forget

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
- Byte-cursor in the shared ledger grammar: ~/agent-core/primitives/hooks/tower-ledger.mjs (canonical; consumed by ~/.tower hooks + pi extensions after wave2 A4). inboxState()/boardFor() currently full-parse ledger.jsonl (~1MB) + board.jsonl (~2MB) per invocation — flywheel measured a 175-290ms floor in 3 hooks (evidence: briefs/fringe/done/cord-flywheel.evidence.md). Implement an incremental byte-offset cursor (per-consumer cursor file; recompute-from-zero on truncation/rotation; correctness first — results must be byte-identical to full parse, prove with a differential test). Done when: differential test passes AND re-measured hook medians (flywheel's method, 15 runs) show the projected ~85% cut AND all consumer pipe-tests exit 0.
- herdr-task-report.sh (~/.claude/hooks/): make its herdr socket write fire-and-forget (the one in-herdr threshold miss, ~69ms→target <50ms). Done when: pipe-test exit 0 + re-measured median under 50ms in-herdr.
- Flywheel retirement: append a dated retirement note to the flywheel section of ~/agent-core/research/fringe-tooling-brainstorm.md citing d51b432 + your re-measurements. Done when written.
- Partition: primitives/hooks/tower-ledger.mjs, ~/.tower/hooks/* consumers, ~/.claude/hooks/herdr-task-report.sh + its canonical twin, the research doc section. NOT settings.json, NOT slim hooks. Topic: agent-core/tower-perf. Marker: tower-perf.done
