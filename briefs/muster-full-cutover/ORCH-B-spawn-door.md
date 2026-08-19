# ORCH [spawn-door]

Retire tup and herdr-spine as the spawn control plane. Lift today's proven spawn body into muster as `~/muster/bin/muster-spawn` and point the live wrappers at it. Do NOT use emojis. You own this unit: Imagine → Plan → Make → Verify. You never implement production yourself — AGNTs cook; you brief, inspect, gate, reap. nQ to operator = 0. Questions climb to CORD (`cord-muster-full-cutover`) with nq budget 3.

Operator order (2026-08-19, binding): A+B+C in full. After Land, the operator deletes `~/tup` and `~/herdr-spine`. No leave-behinds, no temporary alias back to tup, no docs that teach them as live. You do NOT delete those repos.

## Pre-Verified Facts (CORD verified 2026-08-19 this session)

- Proven spawn body: `/Users/jrg/tup/socket/spawn.py` is 1530 lines. Subcommands: orch, worker, fanout, prompt, desk, verify-mark, verify-status, verify-migrate, reap. Help from `~/bin/spine-spawn --help` matches that set. Desk is the door used by `~/bin/herdr <harness>`.
- `~/bin/spine-spawn` (365 bytes, dated Aug 17 21:13) is bash: `exec python3 "${HOME}/tup/bin/tup" spawn "$@"`. It is NOT the herdr-spine stub.
- `~/bin/herdr` desk seating: `SPINE_SPAWN="${SPINE_SPAWN:-$HOME/herdr-spine/bin/spine-spawn}"` then `python3 "$SPINE_SPAWN" desk --kind "$kind" --profile "$profile" --pane "$pane"`. Default therefore opens `/Users/jrg/herdr-spine/bin/spine-spawn`.
- `/Users/jrg/herdr-spine/bin/spine-spawn` is a 10-line Python stub: `runpy.run_path(os.path.expanduser("~/tup/socket/spawn.py"))`.
- spawn.py constants (lines 113–121): `COMPOSE_DIRECTIVE = ~/agent-core/primitives/agent-bridge/compose-directive`, `PROFILES_DIR = ~/agent-core/primitives/profiles`, `PROFILE_MODEL = ~/agent-core/primitives/profiles/profile-model`. Keep those agent-core paths. Do not edit compose-directive (ORCH-A owns it).
- `herdr_spine_root()` (spawn.py:252–265) falls back to `~/herdr-spine`. Callers: `herdr_spine_legacy_verify_dir` and `cmd_verify_migrate` only. `verify_dir()` already defaults to `~/agent-core/.verify` (VERIFY_DIR override). Desk/orch/worker/fanout/prompt/reap must not open `~/tup` or `~/herdr-spine`.
- `~/muster/bin/muster-spawn` does not exist. `~/muster/runtime/spawn.lisp` does not exist. Operator ruling: Python door this Land; Lisp spawn.lisp is NOT a blocker.
- Deposit door exists: `~/muster/bin/muster-deposit` (compiled). `~/muster/bin/muster-deposit` with no args prints `usage: field <deposit|pending|collect>`. `deposit` with empty kind: `REFUSED at the door: kind "" not in (done need-help report question)`. Invocation: `~/muster/bin/muster-deposit deposit --from NAME --to NAME --kind KIND --body "TEXT"`.
- Isolation env in live Lisp still reads TUP_*: `field/field.lisp:16` `TUP_FIELD_DIR`; `durable/cli.lisp:26,29` `TUP_STORE_DIR` / `TUP_EVENTS_PATH`; also `TUP_FIXED_TS`, `TUP_FIXED_DEP_ID`, `TUP_FIXED_COL_ID`. Docs (`AGENTS.md:49-50`, `docs/DRIVING.md:75-92`, `docs/agent-spawn-sop.md` workspace `--env TUP_*`) still teach TUP_*.
- `~/muster/docs/agent-spawn-sop.md` still teaches `spine-spawn worker --kind cursor --profile orchestrator:grok` — briefs must not hardcode `--kind` or model; spawn CLI docs may show wrapper flags but must name `muster-spawn` and profiles only in brief text.
- `~/muster` git: branch `main`, no commits yet, whole tree untracked. Do not `git init`/commit. CORD Lands.
- Desk harness file `~/.config/herdr/desk-harness` contains `cursor`.
- `profile-model get orchestrator` → `cursor/grok-4.6:high`. You do not put that in worker briefs.
- CORD workspace: herdr `w5R`. Your parent pane name: `cord-muster-full-cutover`.
- spawn.py does not subprocess `spine-report` (CORD rg: no hits except herdr-spine verify-migrate comments).

## CORD rulings (do not re-ask)

1. **Lift:** Copy the proven spawn.py body into `~/muster/bin/muster-spawn` (executable, `#!/usr/bin/env python3`). Keep orch|worker|fanout|prompt|desk|reap|verify-* as needed for desk+fleet. Python OK. Do not wait on `runtime/spawn.lisp`.
2. **Wrappers must exec the binary, not python3-on-a-stub:**
   - `~/bin/spine-spawn` → `exec` `$HOME/muster/bin/muster-spawn` with `"$@"`.
   - `~/bin/herdr` default `SPINE_SPAWN` → `$HOME/muster/bin/muster-spawn`. Change the desk invoke from `python3 "$SPINE_SPAWN"` to running that executable (`"$SPINE_SPAWN" desk …` or equivalent). Compatibility name `spine-spawn` may remain as a forwarder only.
   - Do not edit `~/herdr-spine/**` or `~/tup/**`. Operator deletes those repos after Land.
3. **Sidebar:** Do not port `spine-report` into muster. Sidebar purpose is herdr native `pane report-metadata` / tokens already stamped at spawn. No `~/muster/bin/spine-report`.
4. **Isolation:** Prefer `MUSTER_FIELD_DIR` / `MUSTER_STORE_DIR` / `MUSTER_EVENTS_PATH` (and MUSTER_FIXED_* if you touch those seams). Temporary read of old `TUP_*` if MUSTER_* unset is OK for one release. New docs and new code use MUSTER_*.
5. **compose-directive:** Keep invoking `~/agent-core/primitives/agent-bridge/compose-directive`. Do not edit that file. Muster-only *text* is ORCH-A.
6. **Do not commit. Do not delete `~/tup` or `~/herdr-spine`.**
7. **Partition of the muster skill:** `~/agent-core/primitives/skills/muster/SKILL.md` is ORCH-A. You update `~/muster/docs/agent-spawn-sop.md`, `~/muster/docs/DRIVING.md`, `~/muster/AGENTS.md` spawn/isolation/spawn-door lines only.

## Parallel Work Notice

ORCH-A (prompt+doctrine, agent-core primitives) and ORCH-C (plugin+registry+residual grep) are sequenced after you: A waits on your door binary; C waits on A+B green. Ignore unrelated uncommitted noise in `~/agent-core` (briefs/house, tower-rebuild, other primitives). Do not investigate, revert, or fix those. Concern yourself only with your Touch ONLY list.

If you spawn AGNTs, their partitions must be disjoint subsets of yours.

## Fleet comms (muster skill)

TOWER-WAIVED: retired bus absorbed by the muster deposit door; durable comms go through `~/muster/bin/muster-deposit` only — do not call tup, field.py, bellman, tower CLI/MCP, or any path under `~/herdr-spine` or `~/tup`.

- Addressed mail to parent: `~/muster/bin/muster-deposit deposit --from orch-spawn-door --to cord-muster-full-cutover --kind done|need-help|report|question --body "<evidence>"`
- Read inbox before idle: `~/muster/bin/muster-deposit pending --to orch-spawn-door`
- Collect what you take: `~/muster/bin/muster-deposit collect <dep-id>`
- Pull loop (ranks 1–4, mandatory): emit work with evidence (`report`); read pending before idle; `done` / `need-help` with evidence. Empty inbox is not a stop. `report` is not `done`. "Reported and awaited instruction" is not a stopping state.
- nQ to operator = 0. Escalate to CORD only (nq budget 3).
- Dead claimant recovery: UNKNOWN. Do not invent TTL/decay/heartbeat.
- Two stopping states only: every done-when met with evidence, or `need-help` naming owner after finishing independent work.
- Spawn-time Agent bridge may still teach tup/field.py until ORCH-A lands — this brief overrides that block. Use muster-deposit.

## File partitions (this fleet)

- **ORCH-B (you):** `~/muster/bin/muster-spawn` (NEW), `~/bin/spine-spawn`, `~/bin/herdr`, `~/muster/docs/agent-spawn-sop.md`, `~/muster/docs/DRIVING.md`, `~/muster/AGENTS.md` (spawn + isolation env lines only), plus Lisp isolation env in `~/muster/field/field.lisp` and `~/muster/durable/cli.lisp` (MUSTER_* preferred, TUP_* fallback OK), plus any NEW tests under `~/muster/tests/` that prove wrappers/help without touching live ledgers. Scratch dirs only for tests (MUSTER_*).
- **ORCH-A:** `~/agent-core/primitives/agent-bridge/compose-directive`, profiles concierge/coordinator/orchestrator, listed skills including muster SKILL.md, directives residuals, AGENTS.md residual, ENFORCEMENT.md, spawn-door deny text. Do not touch.
- **ORCH-C:** `~/.config/herdr/plugins.json`, spine fragments in `~/.config/herdr/config.toml`, registry `skill/tup`, stale harness tup skill dirs. Do not touch.

## Tasks

1. Lift spawn.py into `~/muster/bin/muster-spawn` as an executable Python door with the subcommands needed for desk+fleet (orch, worker, fanout, prompt, desk, reap, verify-* as required). Neutralize any default path that opens `~/tup` or `~/herdr-spine` on desk/orch/worker/fanout/prompt/reap. Keep compose-directive / profiles / profile-model paths. — done when: `~/muster/bin/muster-spawn --help` lists those subcommands and `~/muster/bin/muster-spawn desk --help` exits 0; file is executable.
2. Retarget wrappers: `~/bin/spine-spawn` execs muster-spawn; `~/bin/herdr` default SPINE_SPAWN is muster-spawn and desk seating runs that executable (not `python3 ~/herdr-spine/...`). — done when: `head -n 20 ~/bin/spine-spawn` and the SPINE_SPAWN / desk-invoke lines of `~/bin/herdr` contain `muster-spawn` and contain neither `tup` nor `herdr-spine`.
3. Path audit: rg the new door + two wrappers for live `~/tup`, `~/herdr-spine`, `tup/socket`, `tup/bin/tup`, `field.py`. Historical comments that say "retired / do not call" are allowed only if they do not encode a runnable path. — done when: the audit report in your done body lists every remaining hit and why it cannot execute on desk seating.
4. Docs + isolation: update `docs/agent-spawn-sop.md`, `docs/DRIVING.md`, `AGENTS.md` so spawn is `~/muster/bin/muster-spawn` (or `~/bin/spine-spawn` as a forwarder) and isolation env is MUSTER_* (TUP_* documented as fallback only). Lisp field/cli: MUSTER_* first, TUP_* fallback. Tests use scratch dirs. — done when: those files do not teach `~/tup/socket/spawn.py`, `~/herdr-spine/bin/spine-spawn`, or TUP_* as the primary live env; `rg TUP_FIELD_DIR ~/muster/docs/DRIVING.md ~/muster/AGENTS.md ~/muster/docs/agent-spawn-sop.md` shows only fallback/compat wording if any.
5. Do not commit. Write `.done` last.

## Constraints

- Touch ONLY the ORCH-B partition above. Do not commit. Do not delete `~/tup` or `~/herdr-spine`. Do not edit agent-core primitives.
- Testing: NO MOCKS. Isolation via scratch MUSTER_* dirs. Never write the live muster field or hash-chain by hand.
- If a muster door fails: do not stub; append `~/muster/docs/BUGREPORT.md` per DRIVING.md, then continue independent work or `need-help`.
- Match surrounding code style. Comments state constraints, not narration.
- Worker briefs name profiles only — never provider, model, or `--kind`.

## Report back with

Deposit `--kind done` to `cord-muster-full-cutover` with:
- `ls -la` + first 15 lines of `~/muster/bin/muster-spawn`, `~/bin/spine-spawn`, `~/bin/herdr` (SPINE_SPAWN + desk invoke)
- `~/muster/bin/muster-spawn --help` and `desk --help` tails + exit codes
- Full path-audit rg output (door + wrappers)
- Every file created or modified, including dotfiles/config
- Isolation env change summary (Lisp + docs)
- Deviations with reasons
- SHA256 of `~/muster/bin/muster-spawn` `~/bin/spine-spawn` `~/bin/herdr`

Then write `/Users/jrg/agent-core/briefs/muster-full-cutover/ORCH-B-spawn-door.md.done` containing the same evidence. `.done` is last, after the deposit.

## Addendum (CORD 2026-08-19, binding)

spawn.py `compose_directive_parent`: `from_name.startswith("cord-")` currently returns `"concierge"`. Live desk agent name is `cursor-concierge`. This fleet deposits `--to cursor-concierge`. In lifted muster-spawn, map cord-* → `cursor-concierge`. Do not edit compose-directive.
