# AGNT [doctrine profiles]

Cut live teachings of tup / herdr-spine / spine-report / field.py out of concierge, coordinator, and orchestrator profiles. Do NOT use emojis. You implement; you do not commit; you do not sync; you do not delete `~/tup` or `~/herdr-spine`. nQ to operator = 0. Questions climb to `orch-doctrine-cutover`.

## Pre-Verified Facts (ORCH verified 2026-08-19 this session)

- Touch ONLY these three files (coder.md is ORCH-C — do not touch):
  - `/Users/jrg/agent-core/primitives/profiles/concierge.md`
  - `/Users/jrg/agent-core/primitives/profiles/coordinator.md`
  - `/Users/jrg/agent-core/primitives/profiles/orchestrator.md`
- Live door on disk: `~/muster/bin/muster-spawn` (executable). Compatibility forwarder `~/bin/spine-spawn` execs muster-spawn. Docs: `~/muster/docs/agent-spawn-sop.md`. Durable mail: `~/muster/bin/muster-deposit`. Sidebar: `herdr pane report-metadata` (herdr native tokens). Isolation env: MUSTER_FIELD_DIR / MUSTER_STORE_DIR / MUSTER_EVENTS_PATH primary; TUP_* only as one-release fallback if mentioned at all.
- concierge.md live hits (ORCH read this session):
  - `:137` "Spawn every later agent via `spine-spawn` with no `--kind` (desk-harness)."
  - `:141-142` "Durable bus: tup. Invoke the tup skill."
  - `:143-144` "Topology: … herdr-spine (herdr skill)"
  - `:149` "tup doorbell (tup skill)"
  - `:153` "durable state on disk and the tup field"
  - `:155-158` doors: `spine-workspace create/close`; "Rulings via tup deposit (tup skill)"
  - house-law table `:185` "Durable comms, field, store, bellman | tup skill"
- coordinator.md live hits:
  - `:109` "workers tab — herdr-spine 7778575"
  - house-law `:144` "`~/herdr-spine/docs/spawn.md`, `verify-beat.md`; `spine-spawn make`"
  - SOURCES `:147-148` cites herdr-spine 63e1010 + 7778575 — historical SOURCES may keep dates only if they do not instruct the reader to run those paths. Prefer dropping the run-path.
- orchestrator.md live hits:
  - `:97` "herdr-spine 7778575"
  - house-law `:132` "`~/herdr-spine/docs/verify-beat.md`; `spine-spawn make`"
  - SOURCES `:135-136` same herdr-spine cite as coordinator.
- Binding replacements (do not invent new binaries):
  - Spawn: `~/muster/bin/muster-spawn` (forwarder `~/bin/spine-spawn` OK). Do not teach `python3 ~/herdr-spine/bin/spine-spawn`.
  - Comms: muster skill + `~/muster/bin/muster-deposit`. Do not teach tup skill, field.py, bellman, or a retired bus as live.
  - Topology/observability: herdr skill (`herdr pane list` / `herdr agent list` / `herdr api snapshot`). Do not name `~/herdr-spine` or `ctl-fleet` as live.
  - `spine-workspace` is not installed (`which spine-workspace` not found; no `~/bin/spine-workspace`). Do not teach it as live. Workspace close law stays in control-flow.md / herdr skill; spawn-door still refuses raw `herdr workspace close` (ORCH-A law agent owns hook text). Profiles: point at herdr skill, not a missing binary.
  - Do not restore or mention `skill/tup`.
- Uncommitted edits already exist on coordinator.md and orchestrator.md from prior house cutover. Treat them as in-progress toward THIS mission: finish the cutover; do not revert to origin/main.

## Parallel Work Notice

Four AGNTs this unit, disjoint files. Ignore uncommitted noise in `briefs/house/**`, `briefs/tower-rebuild/**`, `primitives/profiles/coder.md`, registry, `~/bin/*`, `~/muster/**` (read docs only). Do not investigate, revert, or fix those.

- **agnt-doctrine-bridge:** `primitives/agent-bridge/compose-directive`
- **agnt-doctrine-profiles (you):** the three profile files above
- **agnt-doctrine-skills:** `primitives/skills/{herdr,brief,muster,concierge,ending-session}/SKILL.md`
- **agnt-doctrine-law:** `primitives/AGENTS.md`, `primitives/directives/*.md`, `primitives/rules/ENFORCEMENT.md`, spawn-door hooks

## Fleet comms (muster skill)

TOWER-WAIVED: retired bus absorbed by muster-deposit; do not call tup, field.py, bellman, tower, or `~/herdr-spine`.

- Mail: `~/muster/bin/muster-deposit deposit --from agnt-doctrine-profiles --to orch-doctrine-cutover --kind done|need-help|report|question --body "<evidence>"`
- Pending: `~/muster/bin/muster-deposit pending --to agnt-doctrine-profiles`
- Collect: `~/muster/bin/muster-deposit collect <dep-id>`
- Pull loop mandatory. Empty inbox is not a stop. `report` is not `done`. Two stopping states only. nQ to operator = 0. Dead claimant recovery UNKNOWN.

## This agent

You are agnt-doctrine-profiles. Registration name for deposits: `agnt-doctrine-profiles`.

## Tasks

1. Cut live teachings of herdr-spine / tup / field.py / spine-report / tup-skill from the three profile files. Use the binding replacements. Historical SOURCES may cite dates; they must not instruct the reader to run `~/herdr-spine` or `~/tup` paths. Isolation env if mentioned: MUSTER_* primary. — done when: `rg -n 'field\.py|~/tup/|~/herdr-spine|spine-report|skill/tup|TUP_FIELD_DIR' primitives/profiles/concierge.md primitives/profiles/coordinator.md primitives/profiles/orchestrator.md` returns only (a) fallback/compat wording you can justify in the done body, (b) SOURCES/history that does not instruct running those paths, or (c) explicit "retired / do not call".
2. Do not edit coordinator/orchestrator SKILL.md doors (they do not name tup/herdr-spine — ORCH confirmed). Do not edit coder.md.

## Constraints

- Touch ONLY the three profile files. Do not commit. Do not run `agent-core sync`.
- Testing: NO MOCKS. Verification = the rg in done-when, run in this environment.
- Match surrounding style. Comments state constraints, not narration.

## Report back with

Deposit `--kind done` to `orch-doctrine-cutover` with:
- the full rg output over the three files (every hit, excused or fixed)
- every file created or modified, including dotfiles/config
- deviations with reasons

Then write `/Users/jrg/agent-core/briefs/muster-full-cutover/AGNT-A2-profiles.md.done` with the same evidence. `.done` is last, after the deposit.
