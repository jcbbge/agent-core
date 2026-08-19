# AGNT [compose-directive]

Cut live spawn-time Agent bridge text off tup and herdr-spine. Do NOT use emojis. You implement; you do not commit; you do not sync; you do not delete `~/tup` or `~/herdr-spine`. nQ to operator = 0. Questions climb to `orch-doctrine-cutover`.

## Pre-Verified Facts (ORCH verified 2026-08-19 this session)

- File: `/Users/jrg/agent-core/primitives/agent-bridge/compose-directive` — bash, executable, shebang `#!/usr/bin/env bash`. Usage comment: `compose-directive <profile> [harness] [loop_phase] [from-name] [parent-name]`. Header comment line 3 currently says "no hard deps on herdr, herdr-spine, or tup".
- Live emit (ORCH ran): `~/agent-core/primitives/agent-bridge/compose-directive concierge cursor '' cursor-concierge ''` exits 0. Stdout currently contains: Spawn door `~/bin/spine-spawn`; Tup durable `~/tup/durable/cli.py`, `~/tup/field/field.py`, bellman `~/tup/socket/bellman.py`; Deposit `python3 ~/tup/field/field.py deposit --from cursor-concierge --to [UNKNOWN]`; Herdr sidebar `~/herdr-spine/bin/spine-report`. Parent is `[UNKNOWN]` when parent arg is empty. This is the split-brain vs always-on `~/AGENTS.md`.
- Binding target (CORD ruling, do not invent): stack awareness names Herdr, spawn door `~/muster/bin/muster-spawn` (compatibility forwarder `~/bin/spine-spawn` allowed), Muster durable `~/muster/bin/muster-deposit`, profiles + `profile-model get`, comms-arch plane 5. Deposit line must be exactly this command shape: `` `~/muster/bin/muster-deposit deposit --from ${FROM_NAME} --to ${PARENT_NAME} --kind done --body "<evidence>"` `` (keep the existing `${FROM_NAME:-[UNKNOWN]}` / `${PARENT_NAME:-[UNKNOWN]}` bash defaults). Sidebar: herdr native pane tokens / `herdr pane report-metadata` — do not name `spine-report` or any `~/herdr-spine` path. Zero tup paths, zero `field.py`, zero bellman.
- `~/muster/bin/muster-spawn` exists, executable, 61474 bytes (ORCH `ls -la` 2026-08-19). `~/bin/spine-spawn` is a 150-byte bash forwarder: `exec "$HOME/muster/bin/muster-spawn" "$@"`. `~/muster/bin/muster-deposit` exists. Docs pointer for spawn: `~/muster/docs/agent-spawn-sop.md`.
- `herdr pane report-metadata --help` exists (usage: `herdr pane report-metadata [OPTIONS] --source <ID> <PANE_ID>`; options include `--display-agent`, `--token`).
- Keep jq/loop-phases.json lookup and the Role/Function/Loop domain/Loop phase/Harness table. Keep the stopping-state bullets (two stopping states, empty inbox is not a stop, "I did not edit product" is not a stop, `report` is not `done`, nQ to operator is 0, Dead claimant recovery UNKNOWN). Change only stack + comms-contract path lines and the header comment that names tup/herdr-spine.
- Do not say "tup field" in the deposit lead-in. Use "muster door only; not the operator pane".
- Working tree already has uncommitted edits elsewhere. Ignore them. This file is currently unmodified vs the live tup emit above (ORCH reproduced it this session).

## Parallel Work Notice

Four AGNTs this unit, disjoint files. Ignore uncommitted noise in `briefs/house/**`, `briefs/tower-rebuild/**`, `primitives/profiles/coder.md`, registry, `~/bin/*`, `~/muster/**` (read docs only). Do not investigate, revert, or fix those.

- **agnt-doctrine-bridge (you):** `/Users/jrg/agent-core/primitives/agent-bridge/compose-directive` only.
- **agnt-doctrine-profiles:** `primitives/profiles/{concierge,coordinator,orchestrator}.md`
- **agnt-doctrine-skills:** `primitives/skills/{herdr,brief,muster,concierge,ending-session}/SKILL.md`
- **agnt-doctrine-law:** `primitives/AGENTS.md`, `primitives/directives/*.md`, `primitives/rules/ENFORCEMENT.md`, `primitives/hooks/spawn-door.sh`, `primitives/hooks/spawn-door-pi.ts`

## Fleet comms (muster skill)

TOWER-WAIVED: retired bus absorbed by muster-deposit; do not call tup, field.py, bellman, tower, or `~/herdr-spine`.

- Mail: `~/muster/bin/muster-deposit deposit --from agnt-doctrine-bridge --to orch-doctrine-cutover --kind done|need-help|report|question --body "<evidence>"`
- Pending: `~/muster/bin/muster-deposit pending --to agnt-doctrine-bridge`
- Collect: `~/muster/bin/muster-deposit collect <dep-id>`
- Pull loop mandatory. Empty inbox is not a stop. `report` is not `done`. Two stopping states only. nQ to operator = 0. Dead claimant recovery UNKNOWN.

## This agent

You are agnt-doctrine-bridge. Registration name for deposits: `agnt-doctrine-bridge`. Rewrite compose-directive to the binding target.

## Tasks

1. Rewrite `/Users/jrg/agent-core/primitives/agent-bridge/compose-directive` so the spawn-time block matches the binding target in Pre-Verified Facts. Update the header comment so it does not name herdr-spine or tup as live stack. Keep usage, jq/loop-phases, table, stopping-state bullets. Compatibility mention of `~/bin/spine-spawn` as a forwarder is allowed. — done when: `~/agent-core/primitives/agent-bridge/compose-directive concierge cursor '' cursor-concierge ''` exits 0; stdout contains `muster-deposit` and `muster-spawn`; stdout contains no `field.py`, no `~/tup/`, no `bellman`, no `spine-report`, no `herdr-spine`.
2. Capture that command's full stdout and exit in the report. — done when: the done body includes the exact command, full stdout, and exit code.

## Constraints

- Touch ONLY: `/Users/jrg/agent-core/primitives/agent-bridge/compose-directive`. Do not commit. Do not run `agent-core sync`.
- Testing: NO MOCKS. Verification = the command in done-when, run in this environment.
- Match surrounding style. Comments state constraints, not narration.

## Report back with

Deposit `--kind done` to `orch-doctrine-cutover` with:
- the compose-directive command + full stdout + exit
- `rg -n 'field\.py|~/tup/|bellman|spine-report|herdr-spine' primitives/agent-bridge/compose-directive` (must be empty except excused header history — prefer zero hits)
- every file created or modified, including dotfiles/config
- deviations with reasons

Then write `/Users/jrg/agent-core/briefs/muster-full-cutover/AGNT-A1-compose-directive.md.done` with the same evidence. `.done` is last, after the deposit.
