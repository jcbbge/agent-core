# ORCH tree — agent-bridge revamp

CORD: cord-agent-bridge. Fence date: 2026-08-18. CORD has not implemented product code.

Parent brief: `/Users/jrg/agent-core/briefs/house/CORD-agent-bridge-revamp.md`

## Units

| Unit | Brief | Wave | CORD task |
|---|---|---|---|
| cut-sweep | `ORCH-cut-sweep.md` | 1 | 2 + 6 |
| bridge-complete | `ORCH-agent-bridge.md` | 1 | 3 + 4 |
| spine-absorb | `ORCH-spine-absorb.md` | 2 (after bridge-complete `done`) | 5 |
| comms-contract | `ORCH-comms-contract.md` | 3 (parallel with Land) | encode 18 holes |
| Land | CORD (no ORCH) | 3 | 7 |

## CORD rulings (binding)

1. Workers receive the agent-bridge block. `compose-directive` footer that says otherwise is false; `spine-spawn` already prepends via `compose_directive_block` + `spawn_into_pane`.
2. Profiles `test-maker` / `tester` / `arbiter` exist under `~/agent-core/primitives/profiles/` and `profile-model get` returns a model for each. No `~/cursor-shim/profiles/`. Task 4 is verify-and-hold, not a rewrite.
3. Spawn primitive path after absorption: `tup spawn` is the named door; implementation moves to `~/tup/socket/spawn.py`. `~/bin/spine-spawn` becomes a wrapper. agent-core stays a path-called lego bucket (no package dep). Full sequence: `~/tup/briefs/herdr-spine-absorption-PLAN.md`.
4. Do not delete or unregister the cursor harness. `~/.agent-core/registry` line `harness cursor` and `primitives/directives/cursor.md` stay.
5. Historical `briefs/` archives that concierge deleted are overreach unless they are still invoked as standing law. Restore archives; do not restore `.cursor/rules/cursor-fleet.md` as a live spawn-door rule.
6. Ignore uncommitted dirt outside your Touch ONLY. Audit concierge edits in your partition: keep what matches these rulings, discard overreach.

## File partitions (disjoint)

- **cut-sweep:** `~/cursor-shim/` (except do not restore `cursor-spine`); named live-doc files in agent-core listed in that brief. Not `spine-spawn`. Not `agent-bridge/`. Not registry/hooks.
- **bridge-complete:** `~/agent-core/primitives/agent-bridge/` + verify-only the three supplemental profiles + `~/herdr-spine/bin/spine-spawn` (prepend/desk only).
- **spine-absorb:** tup socket/CLI/docs + `~/bin/spine-spawn` wrapper + herdr-spine spawn move. Starts only after bridge-complete releases `spine-spawn`.
- **comms-contract:** `compose-directive`, `~/tup/socket/spawn.py` compose args only, AGENTS.md Fleet spawn + comms, harness directives pi/cursor/claude-code/prime-agent. Not the herdr-spine stub.

## Already true (CORD verified 2026-08-18)

- `HERDR_ENV=1`; `~/bin/spine-spawn` executable; desk harness `pi`.
- `test ! -e ~/cursor-shim/cursor-spine` — absent. `~/bin/cursor-spine` and `~/bin/cursor-fleet` absent.
- `test -f ~/agent-core/primitives/directives/cursor.md` — present. Registry contains `harness cursor`.
- `compose-directive` executable; `loop-phases.json` has OA–OD and I1–I4.
- `spine-spawn` calls `compose-directive` at `compose_directive_block` and prepends in `spawn_into_pane`.
- `qa-verify.sh` already retired (exit 0, no spine-check).
- `profile-model get` for test-maker / tester / arbiter exits 0.
- `agent-core status --harness cursor` shows `directive/core` stale (`~/AGENTS.md` differs from `primitives/AGENTS.md`). Land owns the sync.
- Concierge overreach is live as uncommitted diffs in agent-core, herdr-spine, cursor-shim. Do not revert blindly.

## Field

TOWER-WAIVED. Deposits from this fence name each ORCH as `--to`. Collect your deposit before work. Two stop states only.
