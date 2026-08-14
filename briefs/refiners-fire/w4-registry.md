# W4 — agent-core registry rebuild (refiners-fire fix, Phase 0.3 + 2.2)

## Mission
`~/.agent-core/registry` (frozen 2026-04-14) describes a world that no longer exists: 18 of 23 sources missing, opencode being dropped, and a write-through hazard where pi's inline_agents strategy would inject rule text through the `~/.pi/agent/AGENTS.md` symlink INTO the canonical AGENTS.md. Rebuild the registry against the actual store; adopt the two orphaned canonicals into the store. `agent-core sync` is FORBIDDEN this pass — status only. Audit source: `~/agent-core/AUDIT-2026-08-11-refiners-fire.md` P0-3, P1-4.

## Pre-Verified Facts (verified today by the coordinating audit)
- `agent-core status` = 6 ok / 24 missing. Binary at /opt/homebrew/bin/agent-core. Registry format: `harness` blocks (agents/skills/skill_format/prompts/commands/hooks/rules/rule_strategy) + `primitive` blocks (source + deploy lines).
- `~/.pi/agent/AGENTS.md` is a SYMLINK to `~/agent-core/primitives/AGENTS.md` — any inline_agents write goes into the canonical. `~/.claude/AGENTS.md` does not exist and nothing consumes it. `~/.claude/rules/` does not exist. `~/.config/opencode/` target tree is gone.
- Missing-source classification (from today's store audit):
  - renamed in store: building-with-solidjs → `skills/building-with-solidjs.md` (flat, byte-identical to deployed) · criticality → `skills/criticality.md` (== cc deployed; pi copy is stale/diverged — note, don't fix) · tab-digest → `subagents/tabs-processor.md` · tab-{inbox,count,domains,report} → merged into `commands/tabs.md`
  - orphaned canonicals living only in deployed trees: `~/.claude/skills/install/SKILL.md` (5.3K) · icloud-tabs-distiller: `~/.claude/skills/icloud-tabs-distiller/SKILL.md` == pi copy (190 ln, newer than store flat `tabs-distiller.md` 123 ln)
  - deleted/retired: solidjs-2.0 (nowhere) · rule/alembic (retired stack) · rule/commit-convention (absorbed into canonical AGENTS.md inline) · command/install (opencode-only) · hooks session-start.sh/session-end.sh (deployed copies are exit-0 stubs, unwired) · hook agent-spawn-check (only `_deprecated/` copy, unwired)
  - session-start / session-end SKILLS are 3-way diverged (store flat starting-session.md/ending-session.md ≠ cc ≠ pi) — reconciliation is a LATER wave; leave them OUT of the registry with an explanatory comment.
- rule/work-file-format source EXISTS but its deploy targets don't (no ~/.claude/rules, pi inline banned). Current doctrine: rules are store-only, read on demand.
- Only fully healthy hook: rtk-rewrite (source == deployed, wired).

## File partition — touch ONLY these
- `~/.agent-core/registry` (back it up first: `cp ~/.agent-core/registry ~/.agent-core/registry.bak-2026-08-11`)
- Store adoption moves INTO `~/agent-core/primitives/skills/` for exactly two orphans: copy `~/.claude/skills/install/SKILL.md` → `~/agent-core/primitives/skills/install/SKILL.md`; copy `~/.claude/skills/icloud-tabs-distiller/SKILL.md` (and any sibling files in that dir) → `~/agent-core/primitives/skills/icloud-tabs-distiller/`; then delete the stale store flat `skills/tabs-distiller.md`.
Do NOT touch: profiles dir (W3 owns it), any deployed tree under ~/.claude or ~/.pi (deployed copies stay as-is this pass), rules files, AGENTS.md anywhere. NEVER run `agent-core sync`. Never commit. No git commands.

## Tasks
1. Back up, then rewrite `~/.agent-core/registry`:
   - Harness blocks: keep `pi` and `claude-code` only (drop `opencode` entirely). Remove the `agents` field and any `rule_strategy inline_agents` from BOTH remaining blocks (defuses the symlink write-through). Keep skills/skill_format/prompts/hooks fields that point at real dirs (verify each with ls).
   - Primitive blocks: drop retired/deleted entries (alembic, commit-convention, solidjs-2.0, command/install, session-start/end HOOKS, agent-spawn-check, the 4 tab-* commands, tab-digest — or re-register tabs.md/tabs-processor.md under their new names if their deploy targets still exist); drop all `deploy opencode` lines; retarget renamed sources (building-with-solidjs, criticality); register the two adopted orphans (install → claude-code; icloud-tabs-distiller → claude-code + pi); keep rule/work-file-format OUT (rules are store-only doctrine) with a comment noting why; leave session-start/session-end skills OUT with a comment (pending reconciliation).
   - Update the header: date, active harness set (pi + claude-code), keep the NEVER-deploy-to-CLAUDE.md/AGENTS.md warning (now consistent since no agents fields remain).
   Done when: the new registry parses — `agent-core status` exits without a parse error.
2. Verify: `agent-core status` reports ZERO missing sources; every remaining entry's deploy targets resolve to real dirs; stale (source≠deployed) diffs are EXPECTED for some entries — list them in the report, do NOT sync. Done when: status output captured showing 0 missing, and the stale list is in your report.

## Tower
Post to board topic `agent-core/refiners-fire`: `claim` at start ("W4 owns ~/.agent-core/registry + orphan adoption into primitives/skills/{install,icloud-tabs-distiller}"), `finding` after the rewrite with the status summary, final `finding` starting `DONE W4:`. MCP tower tools if available, else `~/.tower/board.jsonl` fallback from a real repo cwd.

## Report back with
Final message AND the DONE post carry: backup path, entry-by-entry disposition table (kept/retargeted/dropped/added + why), final `agent-core status` output (must show 0 missing), the expected-stale list, files adopted into the store. LAST action after the board post: `touch ~/agent-core/briefs/refiners-fire/w4.done` — only after every done-when is verified.
