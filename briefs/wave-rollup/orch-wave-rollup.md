Build the daily wave-rollup skill + carry-forward ledger in agent-core. Dogfood against today's Arc wave. Do NOT use emojis anywhere.

You are ORCH for unit `agent-core/wave-rollup`. CORD Tower coordinates; you own Plan→Make→Verify. Prefer mechanical extraction (scripts) over spawning agents — spend is the binding constraint. Practice stigmergy: claim field WA for this unit (or child WAs you emit), heartbeat, work-done with evidence. Board topic: `agent-core/wave-rollup`.

## Pre-Verified Facts (CORD verified 2026-08-13)

- Unit brief: `/Users/jrg/agent-core/briefs/build-wave-rollup-skill.md` (read in full).
- Hand-written exemplar (quality floor): `/Users/jrg/agent-core/briefs/wave-rollup/EXEMPLAR-handwritten-2026-08-13.md` — extracted from concierge transcript `b1ca20b6` lines 1924+1949. Operator called it "perfect but can be better / great but weak."
- Arc wave range: `c203706..origin/main` in `/Users/jrg/infinity/arc`. Live: `git diff --shortstat c203706..origin/main` → `164 files changed, 15021 insertions(+), 923 deletions(-)`. Local `main` is **behind 37** — always use `origin/main` (or fetch) for evidence; do not trust the working tree alone.
- Migrations in range (added): `0058_galley_menus_menuplan.sql` … `0064_inventory_walk_sessions.sql` (7 files).
- Top churn includes multiple `*.integration.test.ts` files (verify phase bulk) — e.g. `inventory-walk.integration.test.ts` 357, `contracts-sign-identity.integration.test.ts` 315, `ws-b-pr5-merge-tags.integration.test.ts` 312.
- Skill home: `~/agent-core/primitives/skills/` (canonical). Cursor copies under `~/.cursor/skills-cursor/` are CLI-managed — land canonical first; sync note in report if needed.
- Atelier skill: `~/agent-core/primitives/skills/atelier/SKILL.md` — use for HTML target; do not invent a presentation layer.
- COMMS-ARCH / field: emit/claim from `~/agent-core` cwd. Parent WA id was `ph-msrwp54j-hgrm` (may need re-claim if evaporated).
- **Seed ledger validation (do NOT trust concierge table blindly):**
  1. Galley `mutateAndEnqueue` — EXISTS at `apps/api/src/lib/galley/mutate-and-enqueue.ts:55` on `origin/main` (#268). Exported via `lib/galley/index.ts`. Callers outside tests: **none found** (only integration + on-disk oracles). Allowlist has `menuPlan: create/updateMenuPlanEventItem` (+ approve via #270). Seed "what exists / missing=any caller" is **CORRECT**; fix path if line drifts.
  2. `approveMenuPlanEvent` — on `origin/main` in `packages/contracts/galley/write-allowlist.ts` under `menuPlan` and in `GALLEY_MUTATIONS`. No UI. Seed **CORRECT** (capability proven, gate shut pending operator ruling).
  3. Inventory walk auth / counts — **CONCIERGE SEED WAS WRONG.** `inventory_counts` **does exist** in `0061_inventory_location_scope.sql:17` on `origin/main`; write API at `apps/api/src/routes/inventory-counts.ts` accepts staff **or** walk session. `0064` adds walk tokens/sessions only. Re-derive the carry-forward entry from repo evidence (likely: walk UI/capture path, session→count UX, or a named parked brief — not "table missing"). Publish only validated entries.
- Board topic isolation: `agent-core/wave-rollup`. Stay out of `tower/bus-data` schema work and Arc fleet source edits except **read-only** dogfood against Arc git.
- Deliberately NOT yours: whether Land rolls up before inner queue drains / outer stage scalar vs cycle rollup — design output to accept either shape; do not decide methodology.

## Parallel Work Notice

- CORD Tower holds coordination claim on this unit; heartbeats from CORD may appear — do not fight them; emit your own child WAs for make/verify if useful.
- Ignore uncommitted noise in agent-core (`primitives/profiles/models.json`, unrelated briefs, `.coraline/`, etc.) — do not investigate or fix.
- CORD bus-data is done; leave `tower/bus-data` alone.
- Arc CORD/ORCHs may still be finishing streams — read `origin/main` only for dogfood; do not edit Arc.

## Tower

- Post findings/claims to `agent-core/wave-rollup` (`board_post` or `bun ~/.tower/cli.mjs post` from `~/agent-core`).
- Field: `emit` / `field` from `~/agent-core`. Evidence mandatory. Heartbeat claims (~20s). `work-done` refs the WA id.
- Operator-facing dogfood artifact: `send_to_user` kind=deliverable only if CORD asks; otherwise write to `briefs/wave-rollup/dogfood/` and board-find.
- spine-report task/verdict for sidebar.

## Tasks

1. **Branch** `feat/wave-rollup-skill` on agent-core from current main — done when: branch exists, no work on main dirty unrelated files.
2. **Skill package** at `primitives/skills/wave-rollup/` — done when: `SKILL.md` encodes (verbatim where quoted in unit brief): five questions; CTRL git computation; verify-phase visibility rules (test-maker ≠ implementer; claimed vs reproduced green; honest gaps); no fleet-internal vocabulary in operator output; phoropter (wide + lens depth); md default + atelier HTML; cheap/mechanical preference; methodology-neutral stage presentation; carry-forward ledger contract (four fields; append-only; retire when consumed; Made Well ground reads as INPUT).
3. **Mechanical extractors** under `primitives/skills/wave-rollup/scripts/` — done when: at least one script computes from git (never estimates): commits count, files changed, +/- LOC, churn by area, migrations list with one-line descriptions from SQL headers or filenames, top-N files by churn. Runnable as `bun` or shell against a repo + rev range. Document exact invocation in SKILL.md.
4. **Carry-forward ledger** — done when: standing store path chosen under agent-core (propose `briefs/wave-rollup/CARRY-FORWARD.md` or project-local `.madewell/carry-forward.md` with skill reading both — pick one primary, document); seeded with **validated** entries for today's Arc wave (corrected seed #3); format machine-readable enough for Made Well ground to ingest later (YAML frontmatter or JSONL OK if also human-readable section in rollup).
5. **Dogfood** today's Arc wave (`c203706..origin/main`) — done when: markdown rollup written to `briefs/wave-rollup/dogfood/2026-08-13-arc.md` that an operator can read cold; CTRL numbers match git (±0 for totals); units named by product work not WS-*; verify section surfaces test suites + honest gaps where arbiter/test-maker attribution is missing from evidence; atelier HTML optional-but-preferred at `briefs/wave-rollup/dogfood/2026-08-13-arc.html` via atelier skill; self-grade vs exemplar — if weaker, iterate until not.
6. **Land** — done when: changes committed on the branch with standard PHASE/DONE/TODO trailer; `.done` at `briefs/wave-rollup/orch-wave-rollup.done`; board finding with paths + git SHAs; `work-done` pheromone. Do **not** merge to main — CORD lands after verify.

## Constraints

- Touch ONLY: `primitives/skills/wave-rollup/**`, `briefs/wave-rollup/**`, and minimal skill index/registry hooks if agent-core has an explicit skills manifest that requires registration (verify before editing; skip if none).
- Do not commit secrets. Do not edit Arc. Do not decide the Land/outer-stage methodology question.
- Testing: extractor scripts must be runnable; include a tiny self-check against the known Arc shortstat (164 / +15021 / −923) as a smoke assertion in the dogfood report.
- No fleet codes (WS-B, pane ids, board topics, brief filenames) as primary names in operator-facing rollup output.

## Report back with

- Per-path diff summary and commit SHA on the branch
- Extractor command(s) + smoke shortstat proof
- Seed ledger validation table (kept / corrected / retired) with file:line evidence
- Path to dogfood md (+ html if produced)
- Honest self-grade vs exemplar (what is still weaker)
- Field ids: claim / heartbeats / work-done
- Deviations with reasons
