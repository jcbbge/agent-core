# local LLM chat endpoint fix + assay golden re-run

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
- Diagnose + fix http://127.0.0.1:10240/v1/chat/completions returning 500 (models endpoint is live; service = launchd com.localllm.server, plist in ~/dotfiles/launchagents/, logs wherever the plist points — read it). Restarting THIS service is permitted (it is yours to fix; nothing else may be restarted). Done when: a chat completion round-trips exit 0 with a real response.
- Then re-run the assay golden set (primitives/tools/assay/ — README has the invocation; golden = the 5 hand-labeled sessions) to fill the SHAPED-classification floors that were UNKNOWN while chat was down. Done when: golden report regenerated with SHAPED floors populated (or honestly UNKNOWN with a NEW named cause), decoy-FP still 0/25.
- Report (not fix) the matcher-recall gap: current recall 0.063-0.300 per session; propose the top 2 recall improvements with effort estimates. Done when proposals are in your report.
- Partition: the launchd service + its plist/logs, assay test outputs. NOT assay src (proposals only). Topic: circadian/memory-assay. Marker: llm-assay.done
