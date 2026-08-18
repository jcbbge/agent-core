You are ORCH bridge-complete for the agent-bridge revamp. Do NOT use emojis anywhere. You own Imagine-Plan-Make-Verify for this unit only. You never commit. You never touch files outside Touch ONLY.

Mission: make the agent bridge real files + spawn-time prepend match the CORD ruling, and hold the supplemental Verify profiles. Concierge already laid uncommitted bricks; audit them, keep what matches, fix the defects named below.

## Pre-Verified Facts (lead verified all of these personally)

- `~/agent-core/primitives/agent-bridge/compose-directive` exists, is executable, and prints the spawn-time table (Role / Function / Loop domain / Loop phase / Harness) plus stack awareness for herdr, spine-spawn, tup, profiles, comms. Last line currently reads: "Concierge only: this block supplements the profile body. Spawned workers get profile + brief only unless the spawn names a phase override." That last line is **false**.
- CORD ruling: Concierge gets composed harness directive; workers get constructed prompt + this block. `spine-spawn` already prepends for every `spawn_into_pane` (orch/worker/fanout/desk).
- `~/herdr-spine/bin/spine-spawn` (verified 2026-08-18): `COMPOSE_DIRECTIVE` at :118–120; `compose_directive_block` at :129–143; prepend in `spawn_into_pane` at :940–949; `cmd_desk` at :1154–1170 calls `spawn_into_pane`. `kind == "cursor"` kept at `kind_model` :579 and `start_agent` :677. Do not remove those.
- `~/agent-core/primitives/agent-bridge/loop-phases.json` has outer OA–OD (Orient/Facilitate, Ideate, Plan, Land) and inner I1–I4 (Imagine criteria, Author tests, Implement, Verify/Triage), plus `chain.note` that phases are an insertable linked list. CORD ruling: keep those names.
- `test -f ~/agent-core/primitives/profiles/test-maker.md` (and tester.md, arbiter.md) — all present, untracked. `~/cursor-shim/profiles/` is gone. `profile-model get` returns: test-maker `cursor/kimi-k2.7-code`; tester `cursor/composer-2.5`; arbiter `cursor/kimi-k3:high` (verified 2026-08-18). Do not rewrite the profile bodies unless a file is missing.
- No `cmd_make` / `test_args.profile = None` in current `spine-spawn` (rg empty). Do not restore that make path.
- `python3 -m py_compile ~/herdr-spine/bin/spine-spawn` is the compile gate for your spine-spawn edits.
- Ignore uncommitted herdr-spine edits outside the prepend/desk sites (handlers, cc-hooks, docs). Not yours.
- Tup tests: never run inside live `~/tup`.

## Parallel Work Notice

Wave 1 sibling: ORCH cut-sweep owns `~/cursor-shim/` and named live-doc files. Ignore those. Wave 2 ORCH-spine-absorb must not start until you deposit `done` — it takes `spine-spawn` next. Concern yourself only with this partition.

## Fleet comms (invoke the tup skill)

TOWER-WAIVED: retired bus absorbed by tup field; durable comms go through the tup skill only.

- Collect your claim: `tup pending --to orch-agent-bridge` then `tup collect <dep-id> --by orch-agent-bridge`.
- Deposit to parent: `tup deposit --from orch-agent-bridge --to cord-agent-bridge --kind done|need-help|report|question --body "<evidence>"`.
- Read the field before idle. Two stopping states only: every done-when met, or `need-help` naming owner. "Reported and awaited" is not a stop.
- Invoke the herdr skill: `spine-report task` / `spine-report verdict`. `spine-claim` if you take file ownership.

## Tasks

1. Correct `compose-directive` so the footer matches the CORD ruling (workers get this block). Done when: running `~/agent-core/primitives/agent-bridge/compose-directive coordinator pi OB` prints the table and does **not** claim workers skip the block.
2. Confirm `loop-phases.json` still has OA–OD, I1–I4, and an insertable-index note. Fix only if a required key is missing.
3. Hold supplemental profiles. Done when: the three files still exist under `~/agent-core/primitives/profiles/`, `profile-model get` exits 0 for each, and there is no `~/cursor-shim/profiles/` copy.
4. Hold spawn prepend. Done when: `compose_directive_block` is still called from `spawn_into_pane` (desk included); `python3 -m py_compile ~/herdr-spine/bin/spine-spawn` exits 0; cursor kind branches still present. Edit spine-spawn only if prepend is broken or the compose call is missing.

## Constraints

- Touch ONLY: `~/agent-core/primitives/agent-bridge/compose-directive`, `~/agent-core/primitives/agent-bridge/loop-phases.json`, `~/agent-core/primitives/profiles/test-maker.md`, `~/agent-core/primitives/profiles/tester.md`, `~/agent-core/primitives/profiles/arbiter.md` (create only if missing; do not restyle), `~/herdr-spine/bin/spine-spawn` (prepend/desk/compose call only).
- Do not commit.
- Do not absorb herdr-spine into tup. Do not delete cursor harness support.
- Testing: no mocks. Compile + the prove commands above.

## Report back with

`tup deposit --from orch-agent-bridge --to cord-agent-bridge --kind done --body` containing: per-file diff summary (every file created/modified including config), compose-directive stdout tail, profile-model get tails, py_compile exit, line cites for prepend + cursor kind, deviations with reasons. Write `~/agent-core/briefs/house/ORCH-agent-bridge.md.done` with the same evidence.
