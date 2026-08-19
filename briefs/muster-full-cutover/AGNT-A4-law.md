# AGNT [doctrine law residuals]

Cut live teachings of tup / herdr-spine / field.py / tup-skill / spine-report from AGENTS.md, harness deltas, ENFORCEMENT.md, and spawn-door deny text. Do NOT use emojis. You implement; you do not commit; you do not sync (ORCH syncs after verify); you do not delete `~/tup` or `~/herdr-spine`. nQ to operator = 0. Questions climb to `orch-doctrine-cutover`.

## Pre-Verified Facts (ORCH verified 2026-08-19 this session)

- Touch ONLY:
  - `/Users/jrg/agent-core/primitives/AGENTS.md`
  - `/Users/jrg/agent-core/primitives/directives/cursor.md`
  - `/Users/jrg/agent-core/primitives/directives/pi.md`
  - `/Users/jrg/agent-core/primitives/directives/claude-code.md`
  - `/Users/jrg/agent-core/primitives/directives/prime-agent.md`
  - `/Users/jrg/agent-core/primitives/directives/opencode.md`
  - `/Users/jrg/agent-core/primitives/directives/slate.md`
  - `/Users/jrg/agent-core/primitives/rules/ENFORCEMENT.md`
  - `/Users/jrg/agent-core/primitives/hooks/spawn-door.sh`
  - `/Users/jrg/agent-core/primitives/hooks/spawn-door-pi.ts`
- Live doors: `~/muster/bin/muster-spawn` (orch|worker|fanout|prompt|desk|reap). `~/bin/spine-spawn` is a 150-byte bash forwarder to muster-spawn (ORCH read the file). Docs: `~/muster/docs/agent-spawn-sop.md`. `spine-workspace` is not installed (`which` not found; no `~/bin/spine-workspace`). Isolation: MUSTER_FIELD_DIR / MUSTER_STORE_DIR / MUSTER_EVENTS_PATH primary; TUP_* one-release fallback only if mentioned.
- AGENTS.md `:165-167` (ORCH read): "Spawn-door law … lives in muster; execution on this install is herdr + `spine-spawn`." Retarget execution line to herdr + `muster-spawn` (forwarder `~/bin/spine-spawn` OK). Comms already teach muster-deposit (`:171-173`). No other `field.py` / `~/tup/` / `~/herdr-spine` hits in this file (ORCH rg).
- cursor.md `:10` `fleet spawn = spine-spawn --kind cursor --profile <role>` — retarget to `muster-spawn` (desk-harness; this is a harness delta so `--kind` may remain as a factual cursor note, or drop `--kind` and say desk-harness — do not teach `python3 ~/herdr-spine/bin/spine-spawn`). `:17` muster WIP isolation sentence still names `TUP_FIELD_DIR, TUP_STORE_DIR, TUP_EVENTS_PATH` — MUSTER_* primary; TUP_* fallback only if mentioned at all.
- pi.md `:4,7-9,12`: `python3 ~/herdr-spine/bin/spine-spawn` and `Never bun …/spine-spawn`. Retarget to `~/muster/bin/muster-spawn` / forwarder `~/bin/spine-spawn`. The "never bun" warning can stay if it names the forwarder, not herdr-spine.
- claude-code.md `:3-5`: same `python3 ~/herdr-spine/bin/spine-spawn`.
- opencode.md and slate.md: ORCH read; they already teach muster-deposit / muster spawn door. Include them in the residual rg. Edit only if a live tup/herdr-spine/field.py/TUP_FIELD_DIR hit remains.
- prime-agent.md: no `~/herdr-spine` / `TUP_` / `field.py` in ORCH's directives rg. Include in residual rg; edit only if a hit remains that teaches those as live.
- ENFORCEMENT.md spawn/enforcer rows (ORCH read `:36-51`):
  - `:36` Spawn door: retarget enforcer to `~/muster/bin/muster-spawn` (forwarder `~/bin/spine-spawn` OK) + existing spawn-door hooks. Source: `~/muster/docs/agent-spawn-sop.md`, not herdr-spine spawn.md. Do not teach herdr-spine handlers as live.
  - `:37-38` spine-workspace: binary not installed. Do not leave a herdr-spine path. Keep the hook that refuses raw `herdr workspace close`. If there is no live replacement door, status that row honestly as DOCTRINE (hook still denies raw close; close law in control-flow.md / herdr skill). Do not invent a muster-workspace binary.
  - `:39` spine-ruling: not yours to create. If the row teaches a missing/herdr-spine door as live, mark DOCTRINE / retired — do not invent, do not point at `~/herdr-spine`.
  - `:47` "spine-workspace creates the audit trail" — same: do not teach a missing binary as live.
  - `:48` worktree: retarget teardown to `muster-spawn reap` (subcommand exists; ORCH `--help`). Do not name `handlers/18-worktree-reconcile` as live.
  - `:51` Naming: `muster-spawn` stamps; spawn-door refuses raw start.
  - `:94` SOURCES mentioning spine-workspace/spine-ruling: history OK if it does not instruct running herdr-spine paths.
- spawn-door deny text must match in BOTH files. Current `spawn-door.sh:40` and `spawn-door-pi.ts:16` DENY_START: `Docs: ~/herdr-spine/docs/spawn.md`. Binding new deny (CORD/ORCH-A): `Spawn through the door: ~/muster/bin/muster-spawn (orch|worker|fanout|prompt); compatibility name ~/bin/spine-spawn. Docs: ~/muster/docs/agent-spawn-sop.md.` Keep SPAWN_DOOR=off bypass.
- spawn-door.sh header comments `:5-8` still name `~/bin/spine-spawn` + spawn.md and `spine-workspace close`. Header is in Touch ONLY — update so it does not teach herdr-spine. Workspace-close DENY (`spawn-door.sh:42`, `spawn-door-pi.ts:17-18`): still refuse raw `herdr workspace close`; replace spine-workspace / herdr-spine pointer with herdr skill / control-flow.md (Land or Parked-on-disk). Do not leave a herdr-spine path in the deny string. Prefer not naming a missing `spine-workspace` binary as the live door.
- Uncommitted edits already exist on AGENTS.md, several directives, ENFORCEMENT.md from prior house cutover. Finish the cutover; do not revert to origin/main.
- Do not edit `~/.agent-core/registry`. Do not add/remove primitives. hook/spawn-door and hook/spawn-door-pi are check-only (store path invoked directly).

## Parallel Work Notice

Four AGNTs this unit, disjoint files. Ignore uncommitted noise in `briefs/house/**`, `briefs/tower-rebuild/**`, `primitives/profiles/coder.md`, `primitives/HARNESS-PARITY.md`, `primitives/rules/worktree-lifecycle.md`, registry, `~/bin/*`, `~/muster/**` except read-only docs. Do not investigate, revert, or fix those.

- **agnt-doctrine-bridge:** compose-directive
- **agnt-doctrine-profiles:** three profiles
- **agnt-doctrine-skills:** five SKILL.md files
- **agnt-doctrine-law (you):** the files listed in Touch ONLY

## Fleet comms (muster skill)

TOWER-WAIVED: retired bus absorbed by muster-deposit; do not call tup, field.py, bellman, tower, or `~/herdr-spine`.

- Mail: `~/muster/bin/muster-deposit deposit --from agnt-doctrine-law --to orch-doctrine-cutover --kind done|need-help|report|question --body "<evidence>"`
- Pending: `~/muster/bin/muster-deposit pending --to agnt-doctrine-law`
- Collect: `~/muster/bin/muster-deposit collect <dep-id>`
- Pull loop mandatory. Empty inbox is not a stop. `report` is not `done`. Two stopping states only. nQ to operator = 0. Dead claimant recovery UNKNOWN.

## This agent

You are agnt-doctrine-law. Registration name for deposits: `agnt-doctrine-law`.

## Tasks

1. Cut live teachings of herdr-spine / tup / field.py / tup-skill / spine-report from AGENTS.md and `primitives/directives/*.md`. Isolation: MUSTER_* primary. — done when: `rg -n 'field\.py|~/tup/|~/herdr-spine|spine-report|skill/tup|TUP_FIELD_DIR' primitives/AGENTS.md primitives/directives/` returns only (a) fallback/compat, (b) SOURCES/history that does not instruct running those paths, or (c) explicit "retired / do not call".
2. Retarget ENFORCEMENT.md spawn/worktree/naming rows per Pre-Verified Facts. — done when: the same rg over `primitives/rules/ENFORCEMENT.md` meets the same (a)(b)(c) bar, and spawn-door row names `muster-spawn` / `~/muster/docs/agent-spawn-sop.md`.
3. Update spawn-door.sh and spawn-door-pi.ts deny strings so they match each other and the binding deny text. Workspace-close deny: no herdr-spine path. Keep SPAWN_DOOR=off. — done when: `rg -n 'herdr-spine|field\.py|~/tup/' primitives/hooks/spawn-door.sh primitives/hooks/spawn-door-pi.ts` is empty (or every hit is explicit retired / do not call), and the two DENY_START strings are byte-identical in substance (same door + same docs pointer).

## Constraints

- Touch ONLY the files listed. Do not commit. Do not run `agent-core sync`. Do not edit registry.
- Testing: NO MOCKS. Verification = the rgs in done-when, run in this environment.
- Match surrounding style. Comments state constraints, not narration.

## Report back with

Deposit `--kind done` to `orch-doctrine-cutover` with:
- full rg output over Touch ONLY (every hit, excused or fixed)
- the two deny strings quoted
- every file created or modified, including dotfiles/config
- deviations with reasons

Then write `/Users/jrg/agent-core/briefs/muster-full-cutover/AGNT-A4-law.md.done` with the same evidence. `.done` is last, after the deposit.
