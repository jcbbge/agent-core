# ORCH [doctrine-cutover]

Cut live agent-core doctrine off tup and herdr-spine. Spawn-time bridge, profiles, skills, directives, AGENTS.md, ENFORCEMENT, and spawn-door deny text must teach muster-spawn + muster-deposit only. Do NOT use emojis. You own this unit: Imagine → Plan → Make → Verify. You never implement production yourself — AGNTs cook; you brief, inspect, gate, reap. nQ to operator = 0. Questions climb to CORD (`cord-muster-full-cutover`) with nq budget 3.

Operator order (2026-08-19): after Land, operator deletes `~/tup` and `~/herdr-spine`. No leave-behinds. You do NOT delete those repos. You do NOT commit (CORD Lands).

## Pre-Verified Facts (CORD verified 2026-08-19 this session)

- `~/agent-core/primitives/agent-bridge/compose-directive` (2656 bytes) currently emits Tup stack (`~/tup/durable/cli.py`, `~/tup/field/field.py`, `~/tup/socket/bellman.py`) and `Herdr sidebar: ~/herdr-spine/bin/spine-report`. Deposit line: `python3 ~/tup/field/field.py deposit --from … --to …`. Reproduced: `compose-directive concierge cursor '' cursor-concierge ''` exits 0 and matches that block (Parent [UNKNOWN] when parent arg empty).
- Target compose-directive text (binding): stack awareness names Herdr, spawn door `~/muster/bin/muster-spawn` (compatibility forwarder `~/bin/spine-spawn` allowed), Muster durable `~/muster/bin/muster-deposit`, profiles + `profile-model get`, comms-arch plane 5. Deposit line must be `` `~/muster/bin/muster-deposit deposit --from ${FROM_NAME} --to ${PARENT_NAME} --kind done --body "<evidence>"` ``. Sidebar line: herdr native pane tokens / `herdr pane report-metadata` — do not name `spine-report` or any `~/herdr-spine` path. Zero tup paths, zero `field.py`, zero bellman.
- `profile-model get concierge` → `cursor/grok-4.5:high`. Not for briefs.
- Always-on `~/AGENTS.md` is composed from `directive/core` (`primitives/AGENTS.md` + harness delta). Canonical `primitives/AGENTS.md` already teaches muster-deposit in places, but still says "execution on this install is herdr + `spine-spawn`" (`:167`) without muster-spawn. Cursor delta `primitives/directives/cursor.md:17` isolation law still names `TUP_FIELD_DIR` / `TUP_STORE_DIR` / `TUP_EVENTS_PATH`. Same TUP_* sentence appears in the composed footer of other harness deltas as the muster WIP block.
- Directives still teaching herdr-spine spawn as live: `primitives/directives/pi.md` and `claude-code.md` contain `python3 ~/herdr-spine/bin/spine-spawn`. `opencode.md` and `slate.md` exist untracked — include them in the residual sweep of `primitives/directives/*.md`.
- Profiles: `coordinator.md:109,144-147` and `orchestrator.md:97,132-135` cite herdr-spine docs / 7778575. `concierge.md:143` "herdr-spine". `coder.md` is NOT yours (residual → ORCH-C).
- Skills (canonical under `primitives/skills/<name>/SKILL.md`):
  - herdr: canonical docs table points at `~/herdr-spine/docs/spawn.md`, `ctl-fleet.md`; spawn wrapper taught as `python3 ~/herdr-spine/bin/spine-spawn`; tup skill for comms; spine-report / spine-claim / ctl-fleet / spine-lab / handlers.
  - brief: fleet comms still teach tup deposit/pending/collect and spine-report/spine-claim.
  - muster: Isolation still `TUP_FIELD_DIR` / `TUP_STORE_DIR` / `TUP_EVENTS_PATH` (`SKILL.md:88-90`). Spawning agents section still says "Herdr (via spine-spawn)".
  - concierge: `herdr-spine` via herdr skill (`SKILL.md:20`).
  - ending-session: Step 1 "Strike the fleet (herdr / herdr-spine)".
  - coordinator / orchestrator: thin doors to profiles (20 lines); edit only if they name tup/herdr-spine (today they do not).
- `primitives/rules/ENFORCEMENT.md` spawn rows name `spine-spawn` + `~/herdr-spine` handlers. Retarget door to `~/muster/bin/muster-spawn` (forwarder `~/bin/spine-spawn` OK). Do not teach herdr-spine handlers as live.
- Spawn-door deny text (must match in both files): `primitives/hooks/spawn-door.sh:40` and `spawn-door-pi.ts` still say `Docs: ~/herdr-spine/docs/spawn.md`. New deny docs pointer: `~/muster/docs/agent-spawn-sop.md` (ORCH-B updates that file). Door binary named: `~/bin/spine-spawn` (forwarder) and/or `~/muster/bin/muster-spawn`. Keep SPAWN_DOOR=off bypass. `herdr workspace close` → spine-workspace line: if that binary still lives under herdr-spine, replace docs pointer with herdr skill / `herdr workspace close` is still hooked — do not leave a herdr-spine path in the deny string. Prefer: "Spawn through the door: ~/muster/bin/muster-spawn (orch|worker|fanout|prompt); compatibility name ~/bin/spine-spawn. Docs: ~/muster/docs/agent-spawn-sop.md."
- Registry: `skill/tup` source missing (`agent-core status` prints `source missing: …/skills/tup/SKILL.md`). `skill/muster` is NOT in `~/.agent-core/registry` (CORD rg: no hits). Do not add or remove registry primitives (ORCH-C). Do not restore `primitives/skills/tup/` (already deleted in the worktree — leave it deleted).
- `agent-core sync skill/tup --dry-run` → `source file not found` (nonzero). Full-catalog sync may fail on that id. Sync by id for the primitives you edit that ARE registered: `directive/core`, `skill/brief`, `skill/herdr`, `skill/concierge`, `skill/ending-session`, `skill/coordinator`, `skill/orchestrator`, and note `hook/spawn-door` / `hook/spawn-door-pi` are check-only (store path invoked directly).
- Working tree already has uncommitted edits in many of your files (prior house cutover). Treat them as in-progress toward THIS mission: finish the cutover; do not revert to origin/main. Ignore `briefs/house/**`, `briefs/tower-rebuild/**`, and files outside Touch ONLY.
- `~/muster/bin/muster-spawn` is ORCH-B's door. CORD will not spawn you until that path exists. If it exists when you start, teach it. Compatibility forwarder `~/bin/spine-spawn` may remain.
- Isolation env names: prefer MUSTER_FIELD_DIR / MUSTER_STORE_DIR / MUSTER_EVENTS_PATH. Cursor delta + muster skill + AGENTS.md residual: MUSTER_* primary; TUP_* as one-release fallback only if you mention it at all.

## CORD rulings (do not re-ask)

1. Sidebar: do not teach `~/herdr-spine/bin/spine-report`. Herdr native tokens only.
2. Muster skill canonical file is yours. ORCH-B owns `~/muster/docs/*` and `~/muster/AGENTS.md`, not this skill.
3. Do not edit `~/.agent-core/registry`. Do not delete `~/tup` or `~/herdr-spine`. Do not commit.
4. `agent-core sync` gate: every registered primitive you edited must sync exit 0 by id. The `skill/tup` missing-source line is ORCH-C, not your NO-GO. `skill/muster` deploy is ORCH-C; your gate for that file is the canonical source.
5. After sync, `~/AGENTS.md` must contain `muster-deposit` / `muster-spawn` and must not teach `field.py`, `~/tup/socket`, or `~/herdr-spine/bin/spine-spawn` as live. Cursor deployed skills you synced (`~/.cursor/skills-cursor/{herdr,brief,concierge,ending-session,coordinator,orchestrator}/SKILL.md`) must match sources (checksum / diff).

## Parallel Work Notice

ORCH-B owns spawn binary + `~/bin/herdr` + `~/bin/spine-spawn` + muster repo docs/Lisp isolation. ORCH-C (later) owns plugin uninstall, registry skill/tup removal, stale tup skill dirs, residual grep. Ignore uncommitted changes outside Touch ONLY. Do not investigate briefs/house or tower-rebuild.

## Fleet comms (muster skill)

TOWER-WAIVED: retired bus absorbed by muster-deposit; do not call tup, field.py, bellman, tower, or `~/herdr-spine`.

- Mail: `~/muster/bin/muster-deposit deposit --from orch-doctrine --to cord-muster-full-cutover --kind done|need-help|report|question --body "<evidence>"`
- Pending: `~/muster/bin/muster-deposit pending --to orch-doctrine`
- Collect: `~/muster/bin/muster-deposit collect <dep-id>`
- Pull loop mandatory. Empty inbox is not a stop. `report` is not `done`. Two stopping states only. nQ to operator = 0. Dead claimant recovery UNKNOWN.
- Spawn-time Agent bridge may still teach tup until you replace compose-directive — this brief overrides your own comms.

## File partitions (this fleet)

- **ORCH-A (you):** `primitives/agent-bridge/compose-directive`, `primitives/profiles/{concierge,coordinator,orchestrator}.md`, `primitives/skills/{concierge,herdr,brief,muster,ending-session,coordinator,orchestrator}/SKILL.md`, `primitives/directives/*.md` (residuals), `primitives/AGENTS.md` (residual spawn/comms wording), `primitives/rules/ENFORCEMENT.md`, `primitives/hooks/spawn-door.sh`, `primitives/hooks/spawn-door-pi.ts`. Sync of those registered ids. Not registry. Not `~/bin/*`. Not `~/muster/**` except reading docs for accurate pointers.
- **ORCH-B:** muster-spawn binary, wrappers, muster repo docs/Lisp.
- **ORCH-C:** plugins.json, config.toml spine fragments, registry, stale tup skill copies, leftover grep.

## Tasks

1. Rewrite `compose-directive` to the target text in Pre-Verified Facts. — done when: `~/agent-core/primitives/agent-bridge/compose-directive concierge cursor '' cursor-concierge ''` exits 0; stdout has `muster-deposit` and `muster-spawn`; stdout has no `field.py`, no `~/tup/`, no `bellman`, no `spine-report`, no `herdr-spine`.
2. Cut residuals in Touch ONLY files so live teachings of herdr-spine / tup / field.py / tup-skill / herdr-spine spine-report are gone. Historical SOURCES lines may cite dates; they must not instruct the reader to run those paths. Isolation env: MUSTER_* primary. — done when: `rg -n 'field\.py|~/tup/|~/herdr-spine|spine-report|skill/tup|TUP_FIELD_DIR' ` over your Touch ONLY list returns only (a) fallback/compat wording you can justify in the done body, (b) SOURCES/history, or (c) explicit "retired / do not call".
3. Sync registered primitives you edited (`agent-core sync <id>` each). Do not restore skill/tup. — done when: each such sync exits 0; `diff` (or `agent-core status` lines) shows `~/AGENTS.md` and the cursor skills listed in ruling 5 match sources; `skill/tup source missing` may still appear.
4. Do not commit. Write `.done` last.

## Constraints

- Touch ONLY the ORCH-A partition. Do not commit. Do not delete `~/tup` or `~/herdr-spine`.
- Testing: NO MOCKS. Verification = the commands in done-when, run in this environment.
- Match surrounding style. Comments state constraints, not narration.
- Worker briefs: profiles only — never provider/model/`--kind`.

## Report back with

Deposit `--kind done` to `cord-muster-full-cutover` with:
- compose-directive command + full stdout + exit
- rg residual report over Touch ONLY (every hit, excused or fixed)
- every `agent-core sync <id>` and its exit; `agent-core status` excerpt for those ids
- `rg` of deployed `~/AGENTS.md` and `~/.cursor/skills-cursor/{herdr,brief,concierge,ending-session}/SKILL.md` for field.py / herdr-spine / tup/socket
- every file created or modified, including dotfiles/config
- deviations with reasons

Then write `/Users/jrg/agent-core/briefs/muster-full-cutover/ORCH-A-doctrine.md.done` with the same evidence. `.done` is last, after the deposit.

## Addendum (CORD 2026-08-19, operator ruling relayed by concierge — binding)

Desk status is prepared, not invented. Bake into concierge profile/skill: use `~/bin/desk-status` (or `herdr agent/workspace list` + jq). Never `python3 -c` for herdr JSON. Never head/cat/Read compiled binaries (`~/muster/bin/muster-deposit` is a Mach-O). No keep-going shell chains after a probe crashes. Applies to concierge desk house-state pulls, all harnesses. Does not apply: product Python doors (muster-spawn), reading source .lisp/.py/.md.
