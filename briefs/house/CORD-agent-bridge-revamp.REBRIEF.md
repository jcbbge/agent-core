REBRIEF — not a new mission. Same unit. nQ to operator = 0. Do not ask. Do not wait to be asked. Do NOT use emojis.

## Locked (every spawn interaction must carry these; they were missing from the first brief)

**Superior:** concierge. Mail: `tup deposit --from cord-agent-bridge --to concierge`. You never mail the operator.

**How they know you finished:** all three, or it did not happen.
1. `tup deposit --from cord-agent-bridge --to concierge --kind done --body` with SHAs pushed, proof command tails, every file touched including config, deviations.
2. File `~/agent-core/briefs/house/CORD-agent-bridge-revamp.done` with the same evidence.
3. ORCH panes reaped.

Bellman wakes concierge on that `done` deposit. Status idle/done is not the signal. A `report` deposit is not `done`. After 90s with no deposit you are quiet, not finished.

**nQ:** You hold nQ=0 toward the operator. A question that reaches the operator is a briefing failure. If blocked, `need-help` to concierge naming owner — never a question into the operator pane.

## Forks you named — RULINGS (you do not re-ask these)

- **Wave 1 in flight vs done:** orch-agent-bridge already deposited `done` and wrote `ORCH-agent-bridge.md.done`. orch-cut-sweep deposited `done` as `dep-c7595db07867`. Collect it. Inspect artifacts against the original brief (compose-directive footer, profiles, `py_compile`, `test ! -e ~/cursor-shim/cursor-spine`, `harness cursor` still registered). Testimony is not GO — inspect, then GO or bounce. Do not latch on empty inbox; pull `tup pending --to cord-agent-bridge` before idle.
- **Who Lands / who pushes:** you. CORD gates Land and `origin/main`. Workers never commit unless an ORCH brief you wrote ordered it (default: never).
- **Parent brief line "composed directive is concierge-only":** FALSE for the agent-bridge *block*. Workers get constructed prompt + compose-directive block. Concierge additionally gets the harness composed entrypoint. Already ruled. Not a remaining fork.
- **directive/core stale:** run `agent-core sync directive/core` at Land. Cursor harness stays deployed.
- **Concierge leftover diffs in herdr-spine / agent-core:** keep what matches this mission (cursor harness registered, spine-spawn desk, compose-directive prepend, no cursor-spine as spawn door). Discard only overreach that unregisters the cursor harness or deletes harness-bridge hooks. Do not wait for a leftover list from anyone.
- **`.done` markers:** `CORD-agent-bridge-revamp.done` does not exist until you Land. `ORCH-agent-bridge.md.done` exists. Cut-sweep worker `.done` files exist per that ORCH's deposit. Missing ORCH `.done` after a `done` deposit = inspect that ORCH, do not ask the operator.
- **Dead AGNT mid-claim:** field has no TTL/decay. Do not invent reclaim. `need-help` to concierge naming the dead claimant and the gap.
- **cmd_make / test_args.profile:** gone. Do not restore. Task 4 is verify profiles exist via `profile-model get` — hold, do not rewrite profiles if gets already exit 0.
- **spine-absorb (herdr-spine → tup):** after Wave 1 inspect GO, spawn that ORCH. Plan already on disk at `/Users/jrg/tup/briefs/herdr-spine-absorption-PLAN.md` if present; if not, ORCH writes it. Spawn path lands at tup (`socket/` or `bin/`) — no new hard dep on agent-core.

## What you are not unsure of

Parent, done-signal, cursor harness keep, replica-only tup tests, two stop states, nQ=0 to operator.

## Unsure / need / ambiguous / unclear

None remaining that this desk can answer. If inspection fails a proof command, bounce that ORCH with the failed command in the brief. That is not a question to the operator.

## Do now

1. Collect `dep-c7595db07867` and `dep-b06eb87bde15`.
2. Inspect Wave 1 artifacts (commands, not claims).
3. Spawn spine-absorb ORCH if not already Landed.
4. Land: replica tup tests, `py_compile` spine-spawn, `agent-core sync directive/core`, commit+push origin/main, write `CORD-agent-bridge-revamp.done`, `done` deposit to concierge, reap ORCHs.

Original brief remains binding: `/Users/jrg/agent-core/briefs/house/CORD-agent-bridge-revamp.md`
