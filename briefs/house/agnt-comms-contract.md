Encode CORD's comms-contract answers into compose-directive, spawn.py argv, AGENTS.md Fleet spawn + comms, and the four harness deltas. Do NOT use emojis. You implement; do not commit.

Parent of this AGNT: orch-comms-contract. nQ to operator = 0. Questions go to parent as need-help.

## Pre-Verified Facts (ORCH verified 2026-08-18 this session)

- `/Users/jrg/agent-core/primitives/agent-bridge/compose-directive` exists, executable. Usage comment and argv today: `compose-directive <profile> [harness] [loop_phase]` (three args). Ran `~/agent-core/primitives/agent-bridge/compose-directive coordinator pi OB` — prints the Role/Function/Loop domain/Loop phase/Harness table and stack list. It does NOT print Parent, From, a deposit command, two stops, empty-inbox-is-not-stop, spine-report path, or nQ=0. Footer (already correct) is: `This block is prepended at spawn for every pane (orch/worker/fanout/desk). Concierge gets the composed harness directive; workers get constructed prompt + this block.`
- Done-when prove command (must keep working after the change): `~/agent-core/primitives/agent-bridge/compose-directive coordinator pi OB cord-agent-bridge concierge` — that is profile, harness, phase, from-name, parent-name. When from-name or parent-name is omitted, print `[UNKNOWN]` for that field.
- `/Users/jrg/tup/socket/spawn.py` is the spawn body. `compose_directive_block` at :129-143 runs `[COMPOSE_DIRECTIVE, base, kind or "", loop_phase or ""]` only — no from-name, no parent. Only call site is `spawn_into_pane` :940-942, which passes profile, kind, loop_phase. `role` in `spawn_into_pane(pane_id, role, kind, ...)` is the pane registration name (from-name). `stamp_lineage` at :795 uses `$HERDR_PANE_ID` as parent pane id, not a role name — do not change stamp_lineage.
- Locked parent map (do not invent TTL, flags, or new files): `cord-*` → `concierge`; `orch-*` → `cord-agent-bridge`; `agnt-*`/`sagt-*` → `orch`. Pass `role` as from-name and that map as parent-name into `compose_directive_block` and the subprocess argv.
- `~/herdr-spine/bin/spine-spawn` is a 9-line runpy stub. `~/bin/spine-spawn` execs `python3 ~/tup/bin/tup spawn`. Do not edit the stub. `~/herdr-spine/bin/spine-report` exists at that absolute path (not assumed on PATH).
- `/Users/jrg/agent-core/primitives/AGENTS.md` section `## Fleet spawn + comms` (starts line 236) names tup skill and deposit-up-the-hierarchy. It does NOT name: Operator → Concierge → CORD → ORCH → AGNT/SAGT; CORD parent is concierge unless the brief names another; status flip is not done; report is not done; bellman wakes parent on done deposit; two stopping states only; empty inbox is not a stop; "I did not edit product" is not a stop; report is progress and done is Land evidence; CORD gates Land and origin/main and workers do not commit unless the brief orders it; dead-claimant recovery is UNKNOWN. Do not put pane ids. Do not name cursor-spine.
- Directives today: `pi.md` names desk door and spine-spawn, no tup field.py line. `cursor.md` names `herdr cursor` and spine-spawn, no tup field.py line. `claude-code.md` names `herdr claude` and spine-spawn, no tup field.py line. `prime-agent.md` names `herdr prime` and leftover retired-bus filenames, no tup field.py line. Add one line each. No parent/done essay. No new cursor-spine.

## Parallel Work Notice

TOWER-WAIVED: retired bus absorbed by tup field; durable comms go through the tup skill only — do not call the retired bus (CLI, MCP, or its home dir).

Sibling ORCHs own other partitions (cut-sweep, spine-absorb, leftover sweeps). Ignore unrelated dirt and CORD Land commits on absorb files outside `compose_directive_block` / `spawn_into_pane`. Concern yourself only with the files in Constraints. `~/herdr-spine/bin/spine-spawn` is a stub — not yours.

If cwd is a coder worktree, still write the live absolute paths listed below. Do not implement on a worktree copy. `~/tup/socket/spawn.py` is a different repo from agent-core — edit that live file.

## Fleet comms (invoke the tup skill)

- Collect inbox: `tup pending --to agnt-comms-contract` then `tup collect <dep-id> --by agnt-comms-contract`.
- Deposit to parent: `tup deposit --from agnt-comms-contract --to orch-comms-contract --kind done|need-help|report --body "<evidence>"`.
- Read the field before idle. Two stopping states only: every done-when met, or `need-help` naming owner after finishing independent work. Empty inbox is not a stop. "Reported and awaited instruction" is not a stop. A `report` is not `done`.
- nQ to operator = 0. Do not mail the operator.
- On Herdr: `~/herdr-spine/bin/spine-report task "comms-contract encode"` at start; `~/herdr-spine/bin/spine-report verdict "<result>"` when done. Claim the live files with `~/herdr-spine/bin/spine-claim claim "<abs path>" --ttl 30` as first action; heartbeat at ttl/3; `spine-claim release` when done.
- Dead claimant recovery is UNKNOWN — do not invent TTL.

## Tasks

1. Extend `/Users/jrg/agent-core/primitives/agent-bridge/compose-directive` with optional args from-name and parent-name. Keep the existing agent-bridge table and footer. After the stack list, print a **Comms contract** section that answers Q1–Q9 and Q11 with the filled values (or `[UNKNOWN]` if omitted). Required strings when run as `compose-directive coordinator pi OB cord-agent-bridge concierge`:
   - `Parent: concierge`
   - `From: cord-agent-bridge`
   - exact command `python3 ~/tup/field/field.py deposit --from cord-agent-bridge --to concierge --kind done --body "<evidence>"`
   - two stopping states (done-whens evidenced, or need-help naming owner)
   - empty inbox is not a stop
   - "I did not edit product" is not a stop
   - report is not done
   - `~/herdr-spine/bin/spine-report`
   - `nQ` to operator is `0`
   - tup field only (deposit/pending/collect); not the operator pane
   - dead claimant recovery UNKNOWN
   Update the usage comment to `compose-directive <profile> [harness] [loop_phase] [from-name] [parent-name]`.
   Done when: that prove command prints Parent=concierge, From=cord-agent-bridge, the exact deposit command, two stops, empty-inbox-is-not-stop, spine-report absolute path, nQ=0 to operator.

2. In `/Users/jrg/tup/socket/spawn.py` only: change `compose_directive_block` and the `spawn_into_pane` call so the subprocess argv includes the pane registration name as from-name and the locked parent map as parent-name. Do not edit `stamp_lineage`, the herdr-spine stub, or other functions except a tiny helper next to `compose_directive_block` if needed for the map.
   Done when: `rg -n 'compose_directive_block|COMPOSE_DIRECTIVE' /Users/jrg/tup/socket/spawn.py` shows from-name and parent-name in the subprocess argv.

3. In `/Users/jrg/agent-core/primitives/AGENTS.md` edit only the `## Fleet spawn + comms` section. Add the world-facts for Q1, Q2, Q3, Q4, Q7, Q8, Q9, Q10, Q11 listed in Pre-Verified Facts. Then run `agent-core sync directive/core` (must exit 0).
   Done when: those sentences exist in that section and the sync exits 0.

4. Add exactly one line to each of `/Users/jrg/agent-core/primitives/directives/pi.md`, `cursor.md`, `claude-code.md`, `prime-agent.md`: fleet comms are tup CLI (`python3 ~/tup/field/field.py`); this harness invokes it via the shell; do not use a retired bus. No parent/done essay. No new cursor-spine.
   Done when: each file has that line; `rg -n 'cursor-spine' /Users/jrg/agent-core/primitives/directives/{pi,cursor,claude-code,prime-agent}.md` adds no new hit.

## Constraints

- Touch ONLY: `/Users/jrg/agent-core/primitives/agent-bridge/compose-directive`, `/Users/jrg/tup/socket/spawn.py`, `/Users/jrg/agent-core/primitives/AGENTS.md`, `/Users/jrg/agent-core/primitives/directives/pi.md`, `/Users/jrg/agent-core/primitives/directives/cursor.md`, `/Users/jrg/agent-core/primitives/directives/claude-code.md`, `/Users/jrg/agent-core/primitives/directives/prime-agent.md`.
- Do not commit. No mocks. Do not edit `~/herdr-spine/bin/spine-spawn`.
- Match surrounding style. Comments state constraints, not narration.
- List every file created or modified, including config.

## Report back with

`tup deposit --from agnt-comms-contract --to orch-comms-contract --kind done --body` containing: per-file diff summary (every file created/modified including config), full prove-command stdout, `rg` cites from spawn.py, `agent-core sync directive/core` tail, deviations with reasons. Write `/Users/jrg/agent-core/briefs/house/agnt-comms-contract.md.done` with the same evidence last.
