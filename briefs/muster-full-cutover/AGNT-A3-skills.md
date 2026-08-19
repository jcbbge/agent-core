# AGNT [doctrine skills]

Cut live teachings of tup / herdr-spine / spine-report / field.py / tup-skill out of the five skill files below. Do NOT use emojis. You implement; you do not commit; you do not sync; you do not delete `~/tup` or `~/herdr-spine`. nQ to operator = 0. Questions climb to `orch-doctrine-cutover`.

## Pre-Verified Facts (ORCH verified 2026-08-19 this session)

- Touch ONLY:
  - `/Users/jrg/agent-core/primitives/skills/herdr/SKILL.md`
  - `/Users/jrg/agent-core/primitives/skills/brief/SKILL.md`
  - `/Users/jrg/agent-core/primitives/skills/muster/SKILL.md`
  - `/Users/jrg/agent-core/primitives/skills/concierge/SKILL.md`
  - `/Users/jrg/agent-core/primitives/skills/ending-session/SKILL.md`
- Do NOT edit `primitives/skills/coordinator/SKILL.md` or `orchestrator/SKILL.md` (ORCH confirmed they do not name tup/herdr-spine). Do not restore `primitives/skills/tup/`.
- Live doors: `~/muster/bin/muster-spawn` (help lists orch|worker|fanout|prompt|desk|reap). `~/bin/spine-spawn` is a bash forwarder to muster-spawn. Docs: `~/muster/docs/agent-spawn-sop.md` (ORCH read; spawn command is `~/muster/bin/muster-spawn worker --label … --pane … --profile <role> --brief <path>`; isolation env MUSTER_FIELD_DIR / MUSTER_STORE_DIR / MUSTER_EVENTS_PATH; TUP_* remain accepted as compat fallback in that SOP). Durable: `~/muster/bin/muster-deposit deposit|pending|collect`. Sidebar: `herdr pane report-metadata` (already in herdr skill stamping section at `:84`). `spine-workspace` is not installed. Isolation: MUSTER_* primary; TUP_* one-release fallback only if mentioned.
- herdr/SKILL.md live hits (ORCH rg this session): canonical-docs table `:50` points at deleted `skills/tup/SKILL.md`; `:51-52` `~/herdr-spine/docs/spawn.md` and `ctl-fleet.md`; `:100` tup field; `:147,167,207-208` prefer `~/bin/spine-spawn` equated to `python3 ~/herdr-spine/bin/spine-spawn`; `:203-205` tup bellman + "do not re-implement that loop in herdr-spine"; `:214-216` tup deposit/pending/status; `:245` tup field; `:250,259` spine-startup / handlers/15-restore-view; `:265,282` tup skill in fan-out contract; `:287-290` `bun ~/herdr-spine/bin/ctl-fleet`; `:301-321` whole comms section teaches tup deposit/pending/collect/status; `:346-350` "Compose Herdr with tup" + handler `10-notify`; `:377-381` `~/herdr-spine/bin/spine-lab`.
- Binding replacements for herdr skill (do not invent binaries ORCH-B does not own):
  - Canonical docs: drop tup skill row; spawn SOP → `~/muster/docs/agent-spawn-sop.md`; drop ctl-fleet.md as live. Keep control-flow.md, statem README, herdr-RETROFIT-MAP.
  - Fleet spawn: `~/muster/bin/muster-spawn` (forwarder `~/bin/spine-spawn` OK). Never teach `python3 ~/herdr-spine/bin/spine-spawn`. Never `bun` that file.
  - Comms: invoke the **muster skill**; verbs `~/muster/bin/muster-deposit deposit|pending|collect`. Completion is a muster-deposit `done` fact, not tup bellman. Do not teach bellman as live. Historical "the old wake/bellman organ is gone" is OK in muster skill already.
  - Sidebar / purpose: herdr native tokens + `herdr pane report-metadata` (already documented in the stamping mandate). Do not teach `spine-report` or `~/herdr-spine/bin/spine-report`.
  - `spine-claim`: do not teach. Resource ownership = disjoint file partitions in briefs. Do not invent a muster-claim binary.
  - Observability: `herdr agent list`, `herdr pane list`, `herdr api snapshot`. Do not teach `ctl-fleet` / `bun ~/herdr-spine/...` as live. CTRL fleet pane recipe that shells herdr-spine is retired — say so ("retired / do not call") or delete the recipe.
  - Isolated experiments: `herdr --session <name>` (muster-spawn `--session` exists for lab testing). Do not teach `spine-lab` as live.
  - Handlers (`10-notify`, `15-restore-view`, spine-startup): do not teach as live. herdr native notifications: `herdr notification show`.
  - Reaping durable state: disk + muster ledger, never a dead pane's scrollback.
- brief/SKILL.md: frontmatter + Fleet comms section still teach tup skill, `tup deposit/pending/collect`, `spine-report`, `spine-claim`, "tup field". Retarget the whole Fleet comms + pull-loop block to muster skill + muster-deposit verbs. Sidebar: `herdr pane report-metadata` / herdr skill tokens, not spine-report. Drop spine-claim. TOWER-WAIVED reason: muster-deposit, not tup field. Coordinated fan-out sentence at `:163` currently says "tup field deposits" → muster-deposit. Hook note at `:188` "tup field only" → muster-deposit.
- muster/SKILL.md: `:46` table "Herdr (via spine-spawn)" with `--kind cursor` and `ROLE:MODEL` — retarget to `~/muster/bin/muster-spawn worker --label NAME --pane HOST --profile ROLE --brief PATH` (no `--kind` in the taught command; desk-harness default). Isolation `:88-90` TUP_FIELD_DIR / TUP_STORE_DIR / TUP_EVENTS_PATH → MUSTER_FIELD_DIR / MUSTER_STORE_DIR / MUSTER_EVENTS_PATH primary; TUP_* may remain as one-release fallback in one sentence. Historical "Muster is what tup used to be" / "bellman organ is gone" is retired-language and allowed. Do not edit `~/muster/docs/*` (ORCH-B).
- concierge/SKILL.md `:20-23` "herdr-spine" bullet and "tup" bullet. Drop herdr-spine bullet (herdr skill covers panes/spawn observation). Durable bullet → muster skill. `:29-37` "tup (status + field pending)" and "tup skill wins" → muster-deposit pending + muster skill.
- ending-session/SKILL.md: frontmatter "herdr/spine"; Step 1 heading `:31` "Strike the fleet (herdr / herdr-spine)" → herdr only. `:47` `grep -c spine/worktrees` and `:51` `spine/*` branches are worktree naming, not `~/herdr-spine` paths — leave unless they instruct running herdr-spine binaries. Do not leave `herdr-spine` in the heading or description.
- Uncommitted edits already exist on these skill files from prior house cutover. Treat as in-progress toward THIS mission; do not revert to origin/main.

## Parallel Work Notice

Four AGNTs this unit, disjoint files. Ignore uncommitted noise in `briefs/house/**`, `briefs/tower-rebuild/**`, `primitives/profiles/coder.md`, registry, `~/bin/*`, `~/muster/**` except read-only docs. Do not investigate, revert, or fix those.

- **agnt-doctrine-bridge:** `primitives/agent-bridge/compose-directive`
- **agnt-doctrine-profiles:** `primitives/profiles/{concierge,coordinator,orchestrator}.md`
- **agnt-doctrine-skills (you):** the five SKILL.md files above
- **agnt-doctrine-law:** AGENTS.md, directives, ENFORCEMENT, spawn-door hooks

## Fleet comms (muster skill)

TOWER-WAIVED: retired bus absorbed by muster-deposit; do not call tup, field.py, bellman, tower, or `~/herdr-spine`.

- Mail: `~/muster/bin/muster-deposit deposit --from agnt-doctrine-skills --to orch-doctrine-cutover --kind done|need-help|report|question --body "<evidence>"`
- Pending: `~/muster/bin/muster-deposit pending --to agnt-doctrine-skills`
- Collect: `~/muster/bin/muster-deposit collect <dep-id>`
- Pull loop mandatory. Empty inbox is not a stop. `report` is not `done`. Two stopping states only. nQ to operator = 0. Dead claimant recovery UNKNOWN.

## This agent

You are agnt-doctrine-skills. Registration name for deposits: `agnt-doctrine-skills`.

## Tasks

1. Cut live teachings of herdr-spine / tup / field.py / tup-skill / spine-report / spine-claim / ctl-fleet / spine-lab / herdr-spine handlers from the five skill files, using the binding replacements. Isolation env: MUSTER_* primary. — done when: `rg -n 'field\.py|~/tup/|~/herdr-spine|spine-report|skill/tup|TUP_FIELD_DIR' primitives/skills/herdr/SKILL.md primitives/skills/brief/SKILL.md primitives/skills/muster/SKILL.md primitives/skills/concierge/SKILL.md primitives/skills/ending-session/SKILL.md` returns only (a) fallback/compat wording you can justify in the done body, (b) SOURCES/history that does not instruct running those paths, or (c) explicit "retired / do not call".
2. Do not restore `primitives/skills/tup/`. Do not edit coordinator/orchestrator skill doors.

## Constraints

- Touch ONLY the five SKILL.md files listed. Do not commit. Do not run `agent-core sync`.
- Testing: NO MOCKS. Verification = the rg in done-when, run in this environment.
- Match surrounding style. Comments state constraints, not narration.

## Report back with

Deposit `--kind done` to `orch-doctrine-cutover` with:
- the full rg output over the five files (every hit, excused or fixed)
- every file created or modified, including dotfiles/config
- deviations with reasons

Then write `/Users/jrg/agent-core/briefs/muster-full-cutover/AGNT-A3-skills.md.done` with the same evidence. `.done` is last, after the deposit.
