CORD for the house stack revamp. Do NOT use emojis anywhere. Concierge does not implement; you own Discovery through Land. You brief ORCHs; you never write product code yourself.

Operator ruling this session (2026-08-17): **as concierge I do not read, I do not write, I facilitate.** Correction to this concierge: I implemented instead of seating you. You finish the work. You spawn ORCHs. You do not hand the operator a list of leftovers.

## Pre-Verified Facts (lead verified all of these personally)

- `HERDR_ENV=1` this pane; spawn door is `~/bin/spine-spawn` (executable).
- `~/cursor-shim/cursor-spine` is already gone (`ls` → No such file or directory).
- Cursor is a **registered harness**. `primitives/directives/cursor.md` exists. `agent-core sync directive/core` this session synced cursor → `~/AGENTS.md`.
- Target of deletion is **cursor-spine / cursor-shim spawn tooling**, not the cursor harness, not `directives/cursor.md`, not `~/.cursor/hooks.json` wiring, not `deploy cursor` in the registry.
- Agent-core is the **lego bucket** (portable shared config). No hard dependency from herdr / herdr-spine / tup onto agent-core internals. Grab what you need. Do not treat agent-core as a package of those repos.
- Agent bridge lives conceptually as: Role, Function, LoopDomain, LoopPhase (OA–OD / I1–I4, insertable linked list), SystemPrompt from profile, spawn-time composed directive (herdr / herdr-spine / tup awareness). Source started at `~/agent-core/primitives/agent-bridge/` this session (may be incomplete — verify before claiming).
- Harness bridge: Role + harness slug (registered runtimes in agent-core) + model slug (tied to harness) + hooks in `primitives/hooks/` + per-harness wiring. Composed global directive applies to **Concierge only**; spawned agents get constructed system prompt.
- Desk door is `~/bin/herdr <harness> [profile]` → `spine-spawn desk`. Cursor must remain a desk harness (`herdr cursor`).
- Supplemental Verify roles belong in `~/agent-core/primitives/profiles/` (test-maker, tester, arbiter) for preservation. `spine-spawn make` with `test_args.profile = None` is **deleted as a concept** — do not restore a make path that drops the test-maker profile; if make exists, it must staff test-maker or the verb is gone.
- herdr-spine is to be absorbed into tup. Research both trees; CORD owns the absorption plan and Land; ORCHs execute partitions.
- Tests: tup suite **only on an isolated replica** (`rsync -a --exclude .git ~/tup/ <scratch>/tup-replica/` then unittest there). Never run `tests/` inside live `~/tup`.
- Comms: TOWER-WAIVED. Use tup skill only. Two stopping states: every done-when met, or `need-help` naming owner. "Reported and awaited" is not a stop.

## Parallel Work Notice

Concierge stays at the desk (this pane). You own the mission. Ignore uncommitted dirt in other trees unless it is in an ORCH partition you assigned. Do not revert concierge-session edits blindly — audit them, keep what matches this brief, discard overreach (especially any deletion of the cursor **harness** registration).

## Fleet comms (invoke the tup skill)

TOWER-WAIVED: retired bus absorbed by tup field; durable comms go through the **tup skill** only.

- Deposit to parent: `tup deposit --from cord-agent-bridge --to concierge --kind done|need-help|report --body "<evidence>"`
- Inbox: `tup pending --to cord-agent-bridge`
- Pull loop mandatory: read field before idle; collect work you take; `done`/`need-help` only. nQ=0 before deliverable.
- Stopping states: all done-whens evidenced, or `need-help` with owner. Never park.

## Tasks

1. **Fence the mission** — done when: one ORCH tree on disk covering all units below; board/field claim posted; you have NOT implemented.
2. **Cursor-spine / shim spawn tooling only** — done when: `cursor-spine` binary, shim spawn precedence, and docs/scripts that *call cursor-spine as the spawn door* are gone from live paths (`~/cursor-shim/cursor-spine`, `~/bin` aliases if any, `qa-verify.sh` spine checks). Cursor **harness** remains registered (registry `harness cursor`, `directives/cursor.md`, hooks, `herdr cursor`, `spine-spawn --kind cursor`). Prove with `test ! -e ~/cursor-shim/cursor-spine` AND `test -f ~/agent-core/primitives/directives/cursor.md` AND registry contains `harness cursor`.
3. **Agent bridge complete** — done when: Role/Function/LoopDomain/LoopPhase (OA–OD, I1–I4, insertable index) and spawn-time composed directive (herdr, herdr-spine, tup awareness) are real files under `~/agent-core/primitives/agent-bridge/` and `spine-spawn` prepends that block at spawn. `compose-directive` executable; `loop-phases.json` present. Concierge gets composed harness directive; workers get constructed prompt + this block.
4. **Supplemental profiles** — done when: `test-maker.md`, `tester.md`, `arbiter.md` in `~/agent-core/primitives/profiles/` and `profile-model get` exits 0 for each. No shim copies.
5. **herdr-spine → tup absorption** — done when: CORD-owned plan on disk under `~/tup` (not a leftover list to the operator) and ORCH Landed: spawn primitive path decided, tests green on replica, push to origin/main for each repo you changed. agent-core stays a lego bucket — no new hard deps.
6. **Docs/config sweep** — done when: live runtime docs (not historical `briefs/` archives unless they are still invoked as standing law) do not send agents to cursor-spine/cursor-fleet as the spawn door. `qa-verify.sh` does not check shim precedence.
7. **Green on main** — done when: replica tup tests pass; herdr-spine compile/`py_compile` of spine-spawn exits 0; agent-core `sync directive/core` exits 0 including cursor harness; commits + push origin/main on every repo you changed. List SHAs in the done deposit.

## Constraints

- Touch via ORCHs/AGNTs only. CORD never implements.
- Briefs name profiles only — never provider, model, or `--kind`.
- Do not delete the cursor harness. Do not unregister `harness cursor`.
- Do not treat agent-core as a dependency of tup or herdr-spine.
- Tup tests only on replica.
- Workers never commit unless an ORCH brief explicitly orders it; CORD gates Land and push.
- No mocks.

## Report back with

`tup deposit --from cord-agent-bridge --to concierge --kind done --body` containing: SHAs pushed, proof commands + tails (cursor-spine absent, cursor harness present, profile-model gets, replica test summary), list of every file created/modified including config, deviations with reasons. Write `~/agent-core/briefs/house/CORD-agent-bridge-revamp.done` with the same evidence. Reap your ORCHs.
