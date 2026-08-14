# AGNT A1 — session-start / session-end thin reconciliation

You are agnt-a1-session-skills. Do NOT use emojis anywhere. Fleet worker: no wake greeting. Workers NEVER commit.

## Mission
Reconcile the 3-way-diverged session-start/session-end skills into THIN canonical directory skills in the agent-core store, deploy by symlink to both harnesses, and register them. Hooks already inject handoff/Tower carry-over — skills must not duplicate that.

## Pre-Verified Facts (ORCH verified 2026-08-11)
- Store flats (legacy names): `~/agent-core/primitives/skills/starting-session.md` (168 lines) and `ending-session.md` (167 lines). Checksums differ from all deployed copies.
- Claude Code: `~/.claude/skills/session-start/SKILL.md` (151 lines) and `session-end/SKILL.md` (169 lines).
- Pi: `~/.pi/agent/skills/session-start/SKILL.md` (175 lines) and `session-end/SKILL.md` (148 lines). All four deployed files disagree with each other and with store flats.
- SessionStart hook already injects Tower carry-over + last TODO handoff: `~/.tower/hooks/session-start.mjs` (wired in `~/.claude/settings.json` SessionStart). Skills that re-extract handoff from git log DUPLICATE the hook.
- Registry deliberately left session skills OUT (see `~/.agent-core/registry` comments ~119–121). After reconciliation, ADD primitives.
- Harness skill_format for both pi and claude-code is `directory` (`<name>/SKILL.md`).
- `agent-core sync` is FORBIDDEN. Manual symlink/copy only. Use `agent-core status` for verification after register.
- Grounding hook: consecutive Edits without a fresh Read-tool load are BLOCKED — Read→Edit pairs always.
- Canonical doctrine (for what skills must NOT contradict): `~/agent-core/primitives/AGENTS.md` — WORK.md side-ledgers banned; commit convention lives in AGENTS.md; no Nebula/pheromone references.

## Parallel Work Notice
Siblings: A2 (store purge + other skills), A3 (repo AGENTS.md + reorg commit-prep), A4 (lifecycle hooks). Ignore uncommitted changes outside your partition. Do not investigate or fix their files.

## Tower
```bash
cd /Users/jrg/agent-core && bun ~/.tower/cli.mjs post claim agent-core/wave2 "A1 CLAIM: session skill thin reconcile" --from agnt-a1-session-skills
# findings as you go; final finding before .done
bun ~/.tower/cli.mjs post finding agent-core/wave2 "A1 DONE: <one line>" --from agnt-a1-session-skills
```
Herdr: `spine-report task "..."` / `spine-report verdict "..."` if available.

## File partition (TOUCH ONLY)
- `~/agent-core/primitives/skills/session-start/SKILL.md` (CREATE directory form)
- `~/agent-core/primitives/skills/session-end/SKILL.md` (CREATE)
- DELETE or move aside store flats: `starting-session.md`, `ending-session.md` (if move: `primitives/skills/_attic/` — create attic only if needed for these two)
- Deploy targets: `~/.claude/skills/session-start`, `~/.claude/skills/session-end`, `~/.pi/agent/skills/session-start`, `~/.pi/agent/skills/session-end` — replace with symlinks to the store directories (or SKILL.md files). Backup any non-symlink content you replace into `~/agent-core/briefs/wave2/a1-backups/` before overwrite.
- `~/.agent-core/registry` — add `primitive skill/session-start` and `skill/session-end` with source paths + deploy pi + claude-code. Match existing primitive block style.
- Report/evidence only under `~/agent-core/briefs/wave2/` (your `.done` + optional notes).

Do NOT touch: lifecycle hooks, other skills, repo `AGENTS.md`, plugins, subagents, slim-*.

## Tasks
1. Read all six current skill bodies (store ×2, cc ×2, pi ×2) and the SessionStart hook — extract unique value that is NOT already hook-injected and NOT retired (Nebula, WORK.md pheromones, STATUS boards).
2. Write THIN `session-start/SKILL.md` and `session-end/SKILL.md` in the store. Design law from audit: "the hooks did X automatically; the skill's job is only Y." Keep breathe-mode / skip-ritual / pre-execution guard if still useful; drop duplicated handoff extraction and commit-convention reprinting (point at canonical AGENTS.md). Version bump metadata; remove constellation/Nebula lineage claims.
3. Deploy: symlink both harness skill dirs to store dirs (directory symlink so SKILL.md resolves). Verify `readlink` + `wc -l` match store.
4. Register both primitives in `~/.agent-core/registry`. Run `agent-core status` — session skills must show ok (or document exact status lines). Do NOT run `agent-core sync`.
5. Post Tower finding; write `.done`.

## Constraints
- Thin means short and non-duplicative — prefer <80 lines each unless a standing directive truly requires more.
- No `agent-core sync`. No commits. No settings.json edits.
- Symlink deploy preferred (one source of truth).

## Done when
- Store has `primitives/skills/session-start/SKILL.md` and `session-end/SKILL.md`; legacy flats gone or attic'd.
- Both harness trees are symlinks to store (evidence: `ls -la` + `readlink` in your report).
- Registry entries exist; `agent-core status` mentions them as ok (paste status lines).
- Tower finding posted; `~/agent-core/briefs/wave2/done/a1-session-skills.done` exists (touch last).

## Report-back
Write `~/agent-core/briefs/wave2/done/a1-session-skills.done` containing: lines-of-skill each, symlink paths, registry snippet, `agent-core status` excerpt, deviations. LAST action: that touch/write.
