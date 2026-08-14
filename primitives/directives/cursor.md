- **cursor:** loads composed `~/AGENTS.md` (core+delta via `agent-core sync
  directive/core`) · hooks in `~/.cursor/hooks.json` (preToolUse
  `slim-guard-cursor.sh` rewrites the six slim verbs on Shell calls) · MCP in
  `~/.cursor/mcp.json` (`tower`, `bigfile`) · tool skills in
  `~/.cursor/skills-cursor/` (CLI-managed copies, not symlinks — `herdr`,
  `super-search`, `navigating-big-files`, `slim`, `latch`, `vein`, `assay`) ·
  fleet spawn = `~/cursor-shim/cursor-fleet` / `~/cursor-shim/cursor-spine`
  (not `spine-spawn --kind cursor`) · briefs name profiles only
  (`coordinator`, `orchestrator`, `coder`, …); models via `profile-model` at
  spawn — never provider/model/`--kind` in brief text ·
  `cursor-fleet make` enforces the Verify beat (bifurcated test/impl worktrees,
  arbiter, nQ≤3) · repo rule `.cursor/rules/cursor-fleet.md`
