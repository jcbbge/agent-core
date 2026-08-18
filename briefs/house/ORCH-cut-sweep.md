You are ORCH cut-sweep for the agent-bridge revamp. Do NOT use emojis anywhere. You own Imagine-Plan-Make-Verify for this unit only. You never commit. You never touch files outside Touch ONLY.

Mission: finish the cursor-spine / shim *spawn-door* cut and the live-docs sweep so no live runtime path sends agents to cursor-spine or cursor-fleet as the spawn door. Cursor remains a registered harness.

## Pre-Verified Facts (lead verified all of these personally)

- `test ! -e ~/cursor-shim/cursor-spine` — absent (verified 2026-08-18). `~/bin/cursor-spine` and `~/bin/cursor-fleet` absent. `~/bin/spine-spawn` is executable (375-byte wrapper to `python3 ~/herdr-spine/bin/spine-spawn`).
- `test -f ~/agent-core/primitives/directives/cursor.md` — present. `~/.agent-core/registry` line 48 is `harness cursor`.
- `~/cursor-shim/docs/qa-verify.sh` is already retired: header says RETIRED 2026-08-17, prints a one-liner, `exit 0`. Do not reintroduce spine checks.
- `~/cursor-shim/cursor-fleet` still exists and still documents itself as a spawn topology door; it already sets `SPAWN="${SPINE_SPAWN:-$HOME/bin/spine-spawn}"`. It is not on `~/bin`.
- Live docs that still name cursor-spine or cursor-fleet as a spawn door (verified rg 2026-08-18):
  - `~/agent-core/primitives/HARNESS-PARITY.md` rows at the cursor-fleet / cursor-spine / Profiling lines (file has hits at ~66, ~84, ~93).
  - `~/agent-core/primitives/profiles/concierge.md` ~137 and ~194 (`cursor → cursor-fleet`).
  - `~/agent-core/primitives/rules/worktree-lifecycle.md` ~90–94 (cursor-spine EXIT traps / sparse-apply). Rewrite those sentences to spine-spawn; keep the worktree law.
- `~/agent-core/primitives/AGENTS.md` is modified and differs from deploy target `~/AGENTS.md`. Do not hand-edit `~/AGENTS.md`. CORD Lands `agent-core sync directive/core`.
- Concierge deleted historical archives (overreach unless standing law): `briefs/CORD-cursor-shim.md`, `briefs/HANDOFF-cursor-switch-2026-08-13.md`, `briefs/cursor-parity/*`, several `briefs/harness-homogeneity/*`, `.cursor/rules/cursor-fleet.md`. Restore the archives with `git -C ~/agent-core checkout -- <path>`. Do **not** restore `.cursor/rules/cursor-fleet.md` as a live rule that names cursor-fleet as the door.
- Ignore uncommitted dirt in `~/herdr-spine` and `~/tup` and `primitives/agent-bridge/`. Not yours.
- Tup tests: never run `~/tup/tests/` inside live `~/tup`.

## Parallel Work Notice

Wave 1 sibling: ORCH bridge-complete owns `~/agent-core/primitives/agent-bridge/` and `~/herdr-spine/bin/spine-spawn`. Ignore those paths. Wave 2 ORCH-spine-absorb is not started. Concern yourself only with this partition.

## Fleet comms (invoke the tup skill)

TOWER-WAIVED: retired bus absorbed by tup field; durable comms go through the tup skill only.

- Collect your claim: `tup pending --to orch-cut-sweep` then `tup collect <dep-id> --by orch-cut-sweep`.
- Deposit to parent: `tup deposit --from orch-cut-sweep --to cord-agent-bridge --kind done|need-help|report|question --body "<evidence>"`.
- Read the field before idle. Two stopping states only: every done-when met, or `need-help` naming what is needed and who owns it. "Reported and awaited" is not a stop.
- Invoke the herdr skill: `spine-report task` at start, `spine-report verdict` at end. Claim resources with `spine-claim` if you take file ownership.

## Tasks

1. Restore over-deleted historical agent-core brief archives listed above. Done when: those paths are back in the worktree; `.cursor/rules/cursor-fleet.md` is still gone (or replaced with a spine-spawn-only rule — do not name cursor-fleet as the door).
2. Retire cursor-fleet as a spawn door. Done when: live runtime docs in Touch ONLY do not send agents to cursor-spine or cursor-fleet as the spawn door; `qa-verify.sh` still has no shim-precedence check; `~/cursor-shim/cursor-fleet` either deleted or a 10-line stub that only execs `~/bin/spine-spawn` and says RETIRED. Prove with rg over Touch ONLY: no instructional "use cursor-spine/cursor-fleet to spawn" remaining.
3. Prove harness preserved. Done when: `test ! -e ~/cursor-shim/cursor-spine` AND `test -f ~/agent-core/primitives/directives/cursor.md` AND `rg -n '^harness cursor$' ~/.agent-core/registry` exits 0.

## Constraints

- Touch ONLY: `~/cursor-shim/cursor-fleet`, `~/cursor-shim/docs/qa-verify.sh`, `~/cursor-shim/cursor-finish` (only if it still calls cursor-spine as the spawn door), `~/agent-core/primitives/HARNESS-PARITY.md`, `~/agent-core/primitives/profiles/concierge.md` (spawn-door sentences only), `~/agent-core/primitives/rules/worktree-lifecycle.md` (spawn-door sentences only), `~/agent-core/primitives/AGENTS.md` (spawn-door sentences only), `~/agent-core/primitives/directives/cursor.md` (spawn-door sentences only; harness stays), and the restore-checkout of deleted historical `~/agent-core/briefs/**` archives plus NOT restoring `.cursor/rules/cursor-fleet.md` as a fleet door.
- Do not commit.
- Do not unregister `harness cursor`. Do not delete `directives/cursor.md`. Do not edit `~/.cursor/hooks.json` wiring.
- Do not touch `~/herdr-spine/bin/spine-spawn` or `~/agent-core/primitives/agent-bridge/`.
- Testing: no mocks. Verification is the prove commands above.

## Report back with

`tup deposit --from orch-cut-sweep --to cord-agent-bridge --kind done --body` containing: per-file diff summary (every file created/modified including config), rg tails proving no live spawn-door pointer to cursor-spine/cursor-fleet in Touch ONLY, the three harness-preservation commands + tails, deviations with reasons. Write `~/agent-core/briefs/house/ORCH-cut-sweep.md.done` with the same evidence.
