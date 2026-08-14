# wake-slim merge to circadian main

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
- Merge branch `wake-slim` (cbadfc6) into circadian main: `git -C ~/circadian merge wake-slim` after confirming main is clean and ahead-state is sane. Done when: full test suite green post-merge (`bun test` in ~/circadian — 463 tests passed pre-merge on the branch), merge committed on main (you MAY commit here — repo-owner exception granted by concierge for the merge commit only), branch left in place.
- Live proof: spawn one throwaway pi pane with role token 3-AGNT (herdr pane split/agent start; reap after), read its wake injection size vs the ~8k baseline; record the delta. Done when the measured payload reduction is in your report.
- Justification data for your report: proem measured ~31.5k input tokens per bare spawn (briefs/fringe/proem-probe-report.md).
- Partition: ~/circadian only. Topic: circadian/wake-slim. Marker: wake-slim.done
