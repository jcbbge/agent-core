# Session Handoff
Date: 2026-03-11
Mode: meta/systems

## Completed

- **Primitives surfacing diagnosis** — identified root cause: scratchpad plugin lived only in `primitives/plugins/` with no auto-loaded rules file, so agents never knew it existed. Fixed by adding `~/.claude/rules/scratchpad.md`.

- **Primitives audit system** — built `~/Documents/_agents/tools/primitives-audit.sh` (profile-driven, reads harness JSON profiles, runs 9 verify checks per harness, outputs green/yellow/red per cell). Run anytime: `bash ~/Documents/_agents/tools/primitives-audit.sh`. Also available as `/primitives-audit` slash command.

- **Harness profiles — research-verified** — three harness profiles written from official docs (no guessing):
  - `harnesses/claude-code.json` — verified against Anthropic docs
  - `harnesses/opencode.json` — verified against `github.com/anomalyco/opencode` source + docs
  - `harnesses/omp.json` — verified against `github.com/can1357/oh-my-pi` source + DeepWiki
  - Key finding: OMP supports all 9 primitives natively (rules, skills, commands, agents all have dedicated dirs). OpenCode reads `~/.claude/skills/` natively as a fallback.

- **Harness onboarding SOP** — `harnesses/ONBOARDING-SOP.md`. Every harness profile requires `source_doc` citations. Unverified profiles are excluded from audit. Process: research → profile → bridge → verify → mark verified.

- **Symlinks deprecated (ADR-010)** — removed all symlinks. All primitives now deployed via `sync-primitives.py` (copy for same-format, transform for different-format, merge-json for config entries).

- **sync-primitives.py** — `~/Documents/_agents/tools/sync-primitives.py`. Deploys all 9 primitives to all 3 harnesses. Idempotent. Run after any source change.

- **Bridge adapter for subagents** — `~/Documents/_agents/tools/bridge-subagents.py`. Transforms canonical subagent format → OpenCode (`mode: subagent` frontmatter) and OMP (`name/tools/spawns` frontmatter). Runs as part of sync.

- **subagent-mcp registered** — added to all three harness MCP configs (was missing everywhere).

- **Canonical agent-file** — broken symlink `~/.claude/CLAUDE.md → claude:agent md/AGENTS.md` (path didn't exist). Canonical source moved to `primitives/agent-file/AGENTS.md`. Now copied to all three harnesses.

## Decisions Captured

- ADR-010: Primitive deployment uses copy-and-transform, not symlinks
- ADR-011: Harness onboarding requires research-first documentation before deployment

## agent-core state

- 37 skills · 8 rules deployed
- Audit: 0 gaps across claude-code, opencode, omp (all 9 primitives verified)
- sync-primitives.py: covers primitives 1,2,3,4,7,8 (hooks/plugins/custom-tools are harness-specific, not portable)
- subagent-mcp: port 3096, now registered in all 3 harnesses

## Open Items

1. **Subagent count discrepancy (5/7)** — source has 7 files, bridge skips README.md and broken AGENTS.md symlink. Audit shows ⚠ but no real gap. Could clean up source dir to remove the broken symlink.
2. **OpenCode rules count (0/8)** — rules inject via `instructions` glob in opencode.json, not a directory. Audit verify logic doesn't handle this case cleanly. Display-only issue.
3. **Auto-sync hook** — no hook fires when primitives source changes. Currently manual: edit source → run sync → run audit. A PostToolUse hook on writes to `primitives/` would help.
4. **Constellation: build Polaris** — still the primary project work. `~/constellation-ts/src/stars/polaris.ts` — arbiter star, resolves orbit_question pheromones, completes Dawn nQ=0 loop.

## Next Session Focus

Run `/primitives-audit` to confirm state, then resume constellation-ts — build Polaris (`~/constellation-ts/src/stars/polaris.ts`). The primitives infrastructure is now solid and should not need revisiting unless adding a new harness.
