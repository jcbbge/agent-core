- **cursor:** loads composed `~/AGENTS.md` (core+delta via `agent-core sync
  directive/core`) · hooks in `~/.cursor/hooks.json` (preToolUse
  `slim-guard-cursor.sh` rewrites the six slim verbs on Shell calls;
  `utensil-guard.mjs` matcher `Read\|Grep\|Shell` points huge-file Read /
  NL Grep / sleep-poll at bigfile / colgrep / latch) · MCP in
  `~/.cursor/mcp.json` (`bigfile`) · tool skills in
  `~/.cursor/skills-cursor/` (CLI-managed copies, not symlinks — `herdr`,
  `navigating-big-files`, `slim`, `latch`, `vein`, `assay`, `coraline`,
  `colgrep`, `pickbrain`, `composto`) ·
  fleet spawn = `spine-spawn --kind cursor --profile <role>` · briefs name
  profiles only; models via `profile-model` at spawn — never
  provider/model/`--kind` in brief text · fleet comms are tup CLI
  (`python3 ~/tup/field/field.py`); this harness invokes it via the shell; do
  not use a retired bus · daily entry = `herdr cursor`
