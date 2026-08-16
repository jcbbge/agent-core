- **cursor:** loads composed `~/AGENTS.md` (core+delta via `agent-core sync
  directive/core`) · hooks in `~/.cursor/hooks.json` (preToolUse
  `slim-guard-cursor.sh` rewrites the six slim verbs on Shell calls;
  `utensil-guard.mjs` matcher `Read\|Grep\|Shell` points huge-file Read /
  NL Grep / sleep-poll at bigfile / colgrep / latch) · MCP in
  `~/.cursor/mcp.json` (`tower`, `bigfile`) · tool skills in
  `~/.cursor/skills-cursor/` (CLI-managed copies, not symlinks — `herdr`,
  `navigating-big-files`, `slim`, `latch`, `vein`, `assay`, `coraline`,
  `colgrep`, `pickbrain`, `composto`) ·
  fleet spawn = `~/cursor-shim/cursor-fleet` / `~/cursor-shim/cursor-spine`
  (not `spine-spawn --kind cursor`) · briefs name profiles only
  (`coordinator`, `orchestrator`, `coder`, …); models via `profile-model` at
  spawn — never provider/model/`--kind` in brief text ·
  `cursor-fleet make` enforces the Verify beat (bifurcated test/impl worktrees,
  arbiter, nQ≤3) · daily entry = `herdr cursor` · repo rule `.cursor/rules/cursor-fleet.md`
