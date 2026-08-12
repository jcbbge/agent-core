- **cursor:** loads composed `~/AGENTS.md` (core+delta via `agent-core sync
  directive/core`) · hooks in `~/.cursor/hooks.json` (preToolUse
  `slim-guard-cursor.sh` rewrites the six slim verbs on Shell calls) · MCP in
  `~/.cursor/mcp.json` (`tower`, `bigfile`) · tool skills in
  `~/.cursor/skills-cursor/` (CLI-managed copies, not symlinks — `herdr`,
  `super-search`, `navigating-big-files`, `slim`, `latch`, `vein`, `assay`) ·
  fleet spawn = `~/cursor-shim/cursor-fleet` / `~/cursor-shim/cursor-spine`
  (not `spine-spawn --kind cursor`; shim profiles + `profile-model` defaults) ·
  `cursor-fleet make` enforces the Verify beat (bifurcated test/impl worktrees,
  arbiter, nQ≤3) · repo rule `.cursor/rules/cursor-fleet.md`
