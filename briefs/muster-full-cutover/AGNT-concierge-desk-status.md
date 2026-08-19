# AGNT [concierge desk-status]

Bake the operator ruling (2026-08-19, concierge doctrine) into the concierge desk card. Do NOT use emojis. You implement; you do not commit. nQ to operator = 0. Questions climb to `orch-doctrine-cutover`.

## Pre-Verified Facts (ORCH verified 2026-08-19 this session)

- Canonical profile: `/Users/jrg/agent-core/primitives/profiles/concierge.md`. Desk card starts at heading `## The desk card (correct-before-reading facts)` (line 132). No `desk-status` string in the file today (ORCH rg).
- Skill door: `/Users/jrg/agent-core/primitives/skills/concierge/SKILL.md`. It is a door only — "do not duplicate doctrine here" (`:8-10`). Step 2 (`:28-31`) currently says gather house state via `~/muster/bin/muster-deposit pending` and "herdr fleet snapshot via the herdr skill". That pull is exactly the desk house-state path this ruling covers. Add a pointer; do not copy the full desk-card paragraph into the skill.
- `~/bin/desk-status` exists, executable, 2384 bytes, Bourne-Again shell (ORCH `ls -la` + `file`). Help (exit 0): `desk-status [summary|agents|workspaces|ws <id>]`. It already runs `herdr workspace list` / `herdr agent list` / `herdr api snapshot` piped to `jq`. Source is readable (`~/bin/desk-status`) — this ruling does not forbid reading shell source.
- `~/muster/bin/muster-deposit` is Mach-O 64-bit arm64 (`file` this session). Never head/cat/Read that binary. Help/usage of the deposit door is in the muster skill / muster docs, not by dumping the binary.
- `jq` is `/usr/bin/jq`. Alternate if desk-status is missing: `herdr agent list` / `herdr workspace list` + `jq`. Never `python3 -c` for herdr JSON.
- Binding text (operator ruling, bake this meaning; match surrounding desk-card bullet style, no emoji):

  Desk status is prepared, not invented. Use `~/bin/desk-status` (or `herdr agent list` / `herdr workspace list` + `jq`). Never `python3 -c` for herdr JSON. Never head/cat/Read compiled binaries (`~/muster/bin/muster-deposit` is a Mach-O). No keep-going shell chains after a probe crashes. Applies: concierge desk house-state pulls, all harnesses. Does not apply: product Python doors (`muster-spawn`), reading source `.lisp` / `.py` / `.md`.

- Place the new bullet in the desk card, after **Durable comms** and before **Topology** (house-state gather sits with comms + topology). Do not invent a second desk-status binary. Do not edit other profiles. Do not commit.
- CORD: profile is canonical. Sync of `skill/concierge` is ORCH after you land, if you change the skill door.

## Parallel Work Notice

Ignore uncommitted noise outside Touch ONLY (`briefs/house/**`, `briefs/tower-rebuild/**`, other primitives). Do not investigate, revert, or fix those.

## Fleet comms (muster skill)

TOWER-WAIVED: retired bus absorbed by muster-deposit; do not call tup, field.py, bellman, tower, or `~/herdr-spine`.

- Mail: `~/muster/bin/muster-deposit deposit --from agnt-concierge-desk-status --to orch-doctrine-cutover --kind done|need-help|report|question --body "<evidence>"`
- Pending: `~/muster/bin/muster-deposit pending --to agnt-concierge-desk-status`
- Collect: `~/muster/bin/muster-deposit collect <dep-id>`
- Pull loop mandatory. Empty inbox is not a stop. `report` is not `done`. Two stopping states only. nQ to operator = 0. Dead claimant recovery UNKNOWN.
- When depositing, `--body` is a string. Do not `head`/`cat`/`Read` `~/muster/bin/muster-deposit`.

## This agent

You are agnt-concierge-desk-status. Registration name for deposits: `agnt-concierge-desk-status`. Write the live absolute paths in Touch ONLY (main tree `/Users/jrg/agent-core/...`). If a coder worktree is forced, copy the finished files to those absolute paths before `.done`.

## Tasks

1. Add the desk-status bullet to `concierge.md` desk card with the binding meaning above. — done when: `rg -n 'desk-status' /Users/jrg/agent-core/primitives/profiles/concierge.md` hits the desk-card section; the bullet names `~/bin/desk-status`, forbids `python3 -c` for herdr JSON, forbids head/cat/Read of compiled binaries citing `muster-deposit` as Mach-O, forbids keep-going shell chains after a probe crash, states apply (concierge desk house-state pulls, all harnesses) and does-not-apply (muster-spawn, reading source `.lisp`/`.py`/`.md`).
2. Point skill step 2 at that desk-card fact (`~/bin/desk-status`) without duplicating the paragraph. Keep pending-mail gather. — done when: `rg -n 'desk-status' /Users/jrg/agent-core/primitives/skills/concierge/SKILL.md` is a pointer, not a second copy of the full ruling.

## Constraints

- Touch ONLY: `/Users/jrg/agent-core/primitives/profiles/concierge.md`, `/Users/jrg/agent-core/primitives/skills/concierge/SKILL.md`. Do not commit. Do not run `agent-core sync`.
- Testing: NO MOCKS. Verification = the rgs in done-when, run in this environment.
- Match surrounding style. Comments state constraints, not narration.

## Report back with

Deposit `--kind done` to `orch-doctrine-cutover` with:
- the new concierge.md desk-card bullet, quoted in full
- the skill step-2 excerpt
- both rg outputs
- every file created or modified
- deviations with reasons

Then write `/Users/jrg/agent-core/briefs/muster-full-cutover/AGNT-concierge-desk-status.md.done` with the same evidence. `.done` is last, after the deposit.
