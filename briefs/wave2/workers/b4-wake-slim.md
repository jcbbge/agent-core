# AGNT wake slim fleet roles

You are AGNT B4 under orch-phase4-automation. Slim circadian wake payload for fleet roles `3-AGNT` / `4-SAGT` so workers get constitution + SELF slice + NOW + brief-relevant evidence — not the full ~8k dump. Work ONLY on branch `wake-slim` in `~/circadian`. Never commit to main. Do NOT use emojis anywhere.

## Pre-Verified Facts (ORCH verified)
- `git -C ~/circadian status` was CLEAN for tracked files when ORCH started (only untracked `briefs/pending-sleep-selfheal/done/orch-pending-sleep.done`). Re-check at start; if dirty on tracked files, DO NOT branch/edit — instead deliver design+patch under `~/agent-core/briefs/wave2/b4-wake-slim.patch.md` and stop.
- Wake entry: `~/circadian/src/wake.ts`. Fleet greeting skip already exists (`isFleetWorkerPane`, roles `1-CORD|2-ORCH|3-AGNT|4-SAGT`, `CIRCADIAN_SKIP_GREETING=1`) — that skips ONLY the greeting-instruction block; full memory injection still ships. You slim the injection for 3-AGNT/4-SAGT.
- Target slim shape (ORCH): keep constitution (+ josh constitution), a SELF slice (not necessarily full SELF), keep NOW, keep brief-relevant session evidence. Drop or heavily truncate USER/greeting/full SELF dump for AGNT/SAGT. ORCH/CORD may keep richer payload unless you have a clean shared helper — prefer minimal blast radius: gate on 3-AGNT/4-SAGT only.
- Tests present: `~/circadian/src/wake.test.ts` and many others. Run `bun test src/wake.test.ts` at minimum; full `bun test` if fast enough. No package.json at repo root naming — bun test works from `~/circadian` (verify).
- Push nowhere. Local branch only. Do not commit (ORCH may commit on the branch later or leave uncommitted — you leave the branch with your changes; do not merge to main).

## Parallel Work Notice
B1–B3 are in herdr-spine/dotfiles. Ignore them. Circadian is yours alone for this wave.

## Tower
```
cd /Users/jrg/herdr-spine && bun ~/.tower/cli.mjs post <claim|finding|note> herdr-spine/phase4 "<body>" --from agnt-b4-wake-slim
```
(Posting cwd must be a real project root; herdr-spine is fine for board posts about this work.)

## Partition (ONLY)
- `~/circadian` on branch `wake-slim` (primarily `src/wake.ts`, `src/wake.test.ts`, and any small helper you extract beside them)
- Fallback only: `~/agent-core/briefs/wave2/b4-wake-slim.patch.md` + evidence if tree dirty/tests absent
- Evidence: `~/agent-core/briefs/wave2/done/b4-wake-slim.evidence.md`

## Tasks
1. Re-verify `git -C ~/circadian status`. If tracked dirty → design+patch file route; touch done; stop.
2. Else: `git checkout -b wake-slim` (from main). Implement slim path for role 3-AGNT/4-SAGT.
3. Extend `wake.test.ts` with at least one test proving AGNT/SAGT payload is smaller / omits USER|full greeting as designed, and operator path unchanged.
4. `bun test src/wake.test.ts` (and broader if reasonable) — all pass.
5. Evidence: branch name, `git rev-parse HEAD` / diffstat, test tail, before/after approximate token or char counts if measurable.
6. Do not merge. Do not push. Do not checkout away from wake-slim with uncommitted loss — leave branch checked out or document how to find the work.

## Constraints
- Never commit to main. Prefer you also do not `git commit` (ORCH integrates) — leave working tree changes on `wake-slim` OR make commits only on `wake-slim` if you must checkpoint; never push.
- Never edit herdr-spine plugin/spawn/launchd files.

## Done when
- Slim implemented on `wake-slim` with tests green, OR design+patch delivered with reason; evidence written; board finding; `touch ~/agent-core/briefs/wave2/done/b4-wake-slim.done`

## Report back with
Branch tip / patch path, test command+result, what a 3-AGNT wake now contains vs before.
