# AGNT A2 — store purge/attic + diverged-skill sync + debugging merge + registry

You are agnt-a2-store-purge. Do NOT use emojis anywhere. Fleet worker: no wake greeting. Workers NEVER commit.

## Mission
Attic retired store rot, sync diverged deployed skills onto store-as-canonical (except where noted), merge debugging rules, fix the dangling navigating-big-files symlink, and truth-up registry entries for skills you touch.

## Pre-Verified Facts (ORCH verified 2026-08-11)
- Retired plugins present under `~/agent-core/primitives/plugins/`: `alembic/`, `alembic-boot/`, `alembic-ingest/`, `alembic-telemetry.ts`, `perplexity/`, `perplexity-search.ts`, `subagent/`.
- Subagents: constellation fleet `.md` files + `_deprecated-alembic/` under `~/agent-core/primitives/subagents/`.
- `~/agent-core/primitives/hooks/_deprecated/` contains: agent-spawn-check.sh, mind-wake.ts, no-fabrication.ts, superset-hooks.ts.
- Stray: `~/agent-core/primitives/skills/atelier/SKILL.md.bak`.
- `primitives/mcps/` is a doc stub (tower subdir + .DS_Store). `agents/` and `directives/` are EMPTY — leave empty dirs; do not invent content.
- Debugging overlap: `primitives/rules/debugging.md` (101 lines) vs `debugging-discipline.md` (138 lines) — NOT duplicates; MERGE unique content into `debugging-discipline.md`, then attic/remove `debugging.md`.
- criticality: store flat `primitives/skills/criticality.md` = 141 lines (= cc SKILL.md). Pi deployed is STALE 60 lines at `~/.pi/agent/skills/criticality/SKILL.md`. Registry already points source at the flat.
- micro-animation-director: store flat `primitives/skills/micro-animation-director.md` (9620 bytes) matches cc; pi differs (9622 bytes, Jun 3).
- atelier: store `primitives/skills/atelier/SKILL.md` (300 lines) + `support/` dir is richer; cc has 286-line SKILL.md and NO support/. Store wins — deploy store → cc (symlink preferred).
- dev-browser: store MISSING; cc `~/.claude/skills/dev-browser/SKILL.md` is real (236 lines). ADOPT cc into store as `primitives/skills/dev-browser/`, then symlink both harnesses to store.
- brief: cc `~/.claude/skills/brief/SKILL.md` (147 lines) differs from store `primitives/skills/brief/SKILL.md` (132 lines). Adopt cc → store (overwrite store with cc content), then symlink pi if present / cc → store.
- icloud-tabs-distiller: already reconciled (diff -q clean between cc and pi). Leave unless broken.
- Dangling: `~/.claude/skills/navigating-big-files` → `~/agent-core/primitives/03_skills/navigating-big-files` (03_skills GONE). Live store file: `primitives/skills/navigating-big-files.md`. Fix symlink/deploy to directory form or flat per harness skill_format (directory for both).
- `agent-core sync` FORBIDDEN. Manual only. Grounding: Read→Edit pairs.
- Attic home: create `~/agent-core/primitives/_attic/YYYY-MM-DD-wave2/` and move retired trees there (git-friendly mv). Do not delete without attic.

## Parallel Work Notice
A1 owns session-start/session-end only. A3 owns repo `AGENTS.md` + reorg staging list. A4 owns lifecycle hooks under ~/.tower and pi extensions. Ignore their uncommitted work.

## Tower
```bash
cd /Users/jrg/agent-core && bun ~/.tower/cli.mjs post claim agent-core/wave2 "A2 CLAIM: store purge + skill sync" --from agnt-a2-store-purge
bun ~/.tower/cli.mjs post finding agent-core/wave2 "A2 DONE: <one line>" --from agnt-a2-store-purge
```

## File partition (TOUCH ONLY)
- `~/agent-core/primitives/_attic/**` (create)
- `~/agent-core/primitives/plugins/{alembic*,perplexity*,subagent}/**` (move to attic)
- `~/agent-core/primitives/subagents/**` retired fleet + `_deprecated-alembic` (move to attic — keep any you can prove still referenced LIVE; if unsure, attic and note)
- `~/agent-core/primitives/hooks/_deprecated/**` (move to attic)
- `~/agent-core/primitives/skills/atelier/SKILL.md.bak` (attic)
- `~/agent-core/primitives/rules/debugging.md` + `debugging-discipline.md` (merge)
- Skill sync paths: criticality, micro-animation-director, atelier (+support), dev-browser, brief, navigating-big-files — store under `primitives/skills/**` and deploys under `~/.claude/skills/**` + `~/.pi/agent/skills/**` for those names only
- `~/.agent-core/registry` — only entries for skills you adopt/register (dev-browser, brief, navigating-big-files, atelier if missing; fix criticality deploy if needed)
- Evidence under `briefs/wave2/`

Do NOT touch: session-start/end, repo AGENTS.md, `~/.tower/**`, `~/.pi/agent/extensions/**`, `~/.claude/hooks/**`, slim-*, settings.json.

## Tasks
1. Create attic dated dir; move retired plugins/subagents/hooks/_deprecated/atelier.bak into it. List every moved path in the `.done` file.
2. Merge `debugging.md` → `debugging-discipline.md` (preserve unique bullets from both; no content loss). Attic `debugging.md`. Grep store for links to `debugging.md` and update to `debugging-discipline.md` within `primitives/` only.
3. Skill sync (store canonical unless noted):
   - criticality: overwrite pi SKILL.md from store flat (or convert store to directory + symlink both — prefer directory form matching skill_format; if you convert, update registry source path).
   - micro-animation-director: same — store wins; fix pi.
   - atelier: symlink `~/.claude/skills/atelier` → store dir (includes support/).
   - dev-browser: copy cc tree into `primitives/skills/dev-browser/`; symlink cc+pi → store.
   - brief: replace store SKILL.md with cc content; symlink deploys → store.
   - navigating-big-files: fix dangling cc symlink; ensure store path exists and both harnesses resolve.
4. Registry truth-up for skills you changed; `agent-core status` after (expect criticality stale cleared). No sync.
5. Tower finding + `.done`.

## Constraints
- Never `git add` / commit. Never `agent-core sync`.
- Prefer symlinks for deploys. Backup non-symlink trees you replace into `briefs/wave2/a2-backups/`.
- Do not purge live peer-session / composto plugins unless they are in the retired list above.

## Done when
- Retired trees live under `_attic/…`; no alembic/perplexity/subagent plugin dirs at live plugins path.
- debugging-discipline.md holds merged content; debugging.md gone from rules/.
- `agent-core status` criticality line is ok (not stale); paste full status summary.
- Diverged skills listed above resolve to store (readlink/shasum evidence in `.done`).
- `~/agent-core/briefs/wave2/done/a2-store-purge.done` written last.

## Report-back
`.done` body: attic inventory, merge note, per-skill deploy evidence, status excerpt, deviations.
