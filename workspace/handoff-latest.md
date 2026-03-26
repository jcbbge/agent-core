# Session Handoff
Date: 2026-03-26
Mode: meta/systems

## Completed

- **OpenCode is now the sole harness** — OMP and Claude Code dropped. All config in ~/.config/opencode/. (ADR-27)
- **All schema primitives wired to OpenCode** — 43 skills symlinked to ~/.config/opencode/skills/. Missing commands (kota, subagent) added to ~/.config/opencode/commands/. opencode.json instructions point to schema/rules/*.md. 5 subagents verified in sync. (ADR-28)
- **OpenCode plugin system is the canonical hook mechanism** — 200 plugin ideas catalogued across all 20 event types in ~/Documents/_agents/docs/prd-opencode-plugin-system.md. (ADR-29)
- **AGENTS.md rewritten** — ~/.config/opencode/AGENTS.md updated with full primitive awareness, executor gateway pattern, session start/end rituals, all 43 skills, 23 commands, 5 subagents, 9 rules.
- **executor docs written** — prd-primitive-gateway.md and prd-opencode-harness-cleanup.md written to ~/executor/docs/.
- **4-agent parallel analysis completed** — fresh-eyes, big-brain-optimizer, challenging-assumptions, reframing-problems all applied to the Tool Shed PRD and OpenCode plugin brainstorm.
- **Brain layers permanently wired** (carried forward from previous session) — anima, dev-brain, kotadb, subagent-mcp auto-register on executor boot via executor-start.sh.

## Decisions captured
- ADR-27: OpenCode is the sole harness
- ADR-28: Schema primitives symlinked into OpenCode config
- ADR-29: OpenCode plugin system is the canonical hook mechanism

## agent-core state
- 43 skills · 9 rules deployed · 23 commands · 5 subagents
- Executor gateway: anima, dev-brain, kotadb, subagent-mcp (all persistent on boot)
- OpenCode: executor-only MCP, 60s timeout, schema rules loaded

## Open items
1. Fix anima bootstrap — `fold_config` table missing in SurrealDB (anima internal issue)
2. Implement Tier 1 plugins from prd-opencode-plugin-system.md (Bootstrap Orchestrator, Active Context Injector, Cascade Pre-classifier, Session Close Orchestrator)
3. Build static manifest.json for zero-latency primitive awareness at bootstrap
4. Verify and update Claude Code harness config if still in use anywhere

## Next session focus
Implement Tier 1 OpenCode plugins: Bootstrap Orchestrator (session.created) and Session Close Orchestrator (session.idle) — these two alone eliminate the cold-start and leaking-session problems that have caused the most friction.
