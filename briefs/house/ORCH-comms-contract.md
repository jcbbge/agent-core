ORCH comms-contract — encode CORD's eighteen questions into the three instruction layers. Do NOT use emojis. CORD does not implement; spawn one AGNT coder for the file partition below.

Parent of this ORCH: cord-agent-bridge. Done: tup deposit --from orch-comms-contract --to cord-agent-bridge --kind done. nQ to operator = 0.

## Locked (do not ask; do not wait to be asked)

**Superior:** cord-agent-bridge. Mail: `tup deposit --from orch-comms-contract --to cord-agent-bridge`. Never mail the operator. nQ to operator = 0.

**How they know you finished:** both, or it did not happen.
1. `tup deposit --from orch-comms-contract --to cord-agent-bridge --kind done --body` with every file touched, compose-directive stdout sample, spine-spawn rg cites, sync tail, deviations.
2. File `~/agent-core/briefs/house/ORCH-comms-contract.md.done` with the same evidence.

Status idle/done is not the signal. A `report` is not `done`. If blocked: `need-help` to cord-agent-bridge naming owner.

**Unsure / need / ambiguous / unclear:** none remaining this desk can answer. Inspection failure = `need-help` with the failed command. Not a question to the operator.

**Wave released (CORD 2026-08-18).** Collect your inbox and start Make. Do not wait.

## Pre-Verified Facts

- `~/agent-core/primitives/agent-bridge/compose-directive` currently prints Role/Function/Loop/Harness and a stack-awareness list. It does NOT name parent, from-name, done command, when to talk, or exact tup/spine-report paths. Usage is `compose-directive <profile> [harness] [loop_phase]`. Footer (verified 2026-08-18) already says workers get this block.
- Spawn body lives at `~/tup/socket/spawn.py` (absorbed). `~/herdr-spine/bin/spine-spawn` is a 9-line runpy stub — do not put compose args there. `~/bin/spine-spawn` execs `python3 ~/tup/bin/tup spawn`.
- `compose_directive_block` at `~/tup/socket/spawn.py:129-143` calls that script with profile, kind, loop_phase only — no parent, no agent name. `spawn_into_pane` at :940-942 calls it with those three args. `stamp_lineage` at :795 uses `HERDR_PANE_ID` as parent pane id, not a role name. Pass registration name as from-name and the role-lineage parent (cord-*→concierge, orch-*→cord-agent-bridge, agnt-*→their orch) into compose-directive.
- `~/agent-core/primitives/AGENTS.md` Fleet spawn + comms names tup skill and "deposit up the hierarchy" but does not name: parent of CORD is concierge; exact `field.py` verbs; empty inbox is not a stop; report is not done; spine-report absolute path.
- Directives `pi.md` / `cursor.md` name desk door and spine-spawn. They do not teach done-signal or parent. That stays out of directives except harness-specific invocation (how this harness runs a shell: herdr pane / CLI).
- CORD's questions (the holes). Answers to land:

1. WHO IS MY SUPERIOR — composed: `Parent: <name>` injected at spawn. AGENTS.md: Operator → Concierge → CORD → ORCH → AGNT/SAGT. CORD's parent is concierge unless the brief names another. Directive: none (not harness-specific).
2. HOW THEY KNOW I FINISHED — composed: exact `python3 ~/tup/field/field.py deposit --from <me> --to <parent> --kind done --body "<evidence>"` plus the brief's `.done` file plus reap children. AGENTS.md: status flip is not done; report is not done; bellman wakes parent on done deposit. Directive: none.
3. WHEN DO I COMMUNICATE — composed: pull `pending --to <me>` before idle; deposit `done` only when done-whens evidenced; `need-help` instead of silence. AGENTS.md: two stopping states only; empty inbox is not a stop. Directive: none.
4. HOW DO I COMMUNICATE — composed: tup field only (deposit/pending/collect). Not the operator pane. Not chat-as-status. AGENTS.md: invoke tup skill; never re-prompt idle panes for status. Directive: this harness runs those CLIs via Shell; no Tower MCP.
5. WHAT TOOLS — composed: `python3 ~/tup/field/field.py`; `python3 ~/herdr-spine/bin/spine-spawn`; `~/herdr-spine/bin/spine-report` (not assumed on PATH); `herdr` for panes. AGENTS.md: stack table already names tup/herdr; add spine-report absolute path. Directive: `herdr <harness>` desk; spine-spawn never bun.
6. nQ TO OPERATOR — composed: 0. Questions go to parent as `need-help`. AGENTS.md: nQ=0 before deliverable; operator is not a worker's helpdesk. Directive: none.
7. EMPTY INBOX A STOP? — composed+AGENTS.md: No.
8. "I DID NOT EDIT PRODUCT" A STOP? — composed: No. Done-whens or need-help.
9. REPORT vs DONE — composed+AGENTS.md: report is progress; done is Land evidence.
10. WHO LANDS/PUSHES — AGENTS.md + composed for CORD/ORCH: CORD gates Land and origin/main. Workers do not commit unless brief orders it.
11. DEAD CLAIMANT — AGENTS.md: recovery UNKNOWN; need-help naming the gap. Do not invent TTL.
12. LEFTOVER DIFFS / .done EXISTENCE / ARTIFACT vs TESTIMONY — composed: inspect with commands; do not ask the operator. Brief-specific; not AGENTS.md law.

## Parallel Work Notice

TOWER-WAIVED. Ignore unrelated dirt and CORD Land commits on absorb files outside compose_directive_block. Touch ONLY the files in Constraints. `~/herdr-spine/bin/spine-spawn` is a stub — not yours.

## Fleet comms

`tup deposit --from orch-comms-contract --to cord-agent-bridge --kind done|need-help|report`. Pull pending before idle. Two stops only.

## Tasks

1. Extend `compose-directive` to take optional args: from-name, parent-name. Print a **Comms contract** section answering Q1–Q9, Q11 with those values filled (or `[UNKNOWN]` if omitted). Keep existing agent-bridge table. — done when: `compose-directive coordinator pi OB cord-agent-bridge concierge` prints Parent=concierge, From=cord-agent-bridge, the exact deposit command, two stops, empty-inbox-is-not-stop, spine-report absolute path, nQ=0 to operator.
2. `~/tup/socket/spawn.py` `compose_directive_block` / `spawn_into_pane` passes the pane's registration name as from-name and the stamped parent (lineage parent role, default concierge for cord-*, cord-agent-bridge for orch-*, orch for agnt-*) into compose-directive. — done when: rg shows those args in the subprocess argv in `~/tup/socket/spawn.py`.
3. AGENTS.md Fleet spawn + comms: add the world-facts for Q1, Q2, Q3, Q4, Q7, Q8, Q9, Q10, Q11. Do not put pane ids. Do not name cursor-spine. — done when: those sentences exist; `agent-core sync directive/core` exits 0.
4. Directives pi.md, cursor.md, claude-code.md, prime-agent.md: one line each — fleet comms are tup CLI (`python3 ~/tup/field/field.py`); this harness invokes it via the shell; do not use a retired bus. No parent/done essay in the delta. — done when: each file has that line; no new cursor-spine.

## Constraints

- Touch ONLY: `~/agent-core/primitives/agent-bridge/compose-directive`, `~/tup/socket/spawn.py` (compose_directive_block + spawn_into_pane only — not the herdr-spine stub), `~/agent-core/primitives/AGENTS.md` (Fleet spawn + comms section only), `~/agent-core/primitives/directives/{pi,cursor,claude-code,prime-agent}.md`.
- Do not commit unless CORD orders Land. No mocks.
- After AGENTS.md edit: `agent-core sync directive/core`.

## Report back with

Per-file diff summary, compose-directive stdout sample, spine-spawn rg cites, sync tail, deviations.
