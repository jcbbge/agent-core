# AGNT [lift spawn door]

Do NOT use emojis. You implement; you do not commit; you do not edit ~/tup or ~/herdr-spine. nQ to operator = 0. Questions climb to orch-spawn-door (parent), then CORD if orch cannot rule.

## Pre-Verified Facts (ORCH verified 2026-08-19 this session)

- Proven spawn body: `/Users/jrg/tup/socket/spawn.py` is 1530 lines, mode 0755, 61473 bytes. Shebang `#!/usr/bin/env python3`. Live help `~/bin/spine-spawn --help` exit 0 lists subcommands: orch, worker, fanout, prompt, desk, verify-mark, verify-status, verify-migrate, reap. `~/bin/spine-spawn desk --help` exit 0.
- `~/bin/spine-spawn` (365 bytes, dated Aug 17 21:13) is bash: `exec python3 "${HOME}/tup/bin/tup" spawn "$@"`. It is NOT the herdr-spine stub. agnt-spawn-wrap retargets this file.
- `/Users/jrg/herdr-spine/bin/spine-spawn` is a 10-line Python stub `runpy.run_path(~/tup/socket/spawn.py)`. Do not edit it. Operator deletes that repo after Land.
- spawn.py constants (lines 113–121): `COMPOSE_DIRECTIVE = ~/agent-core/primitives/agent-bridge/compose-directive` (executable, 2656 bytes, dated Aug 17 21:27), `PROFILES_DIR = ~/agent-core/primitives/profiles`, `PROFILE_MODEL = ~/agent-core/primitives/profiles/profile-model`. Keep those agent-core paths. Do not edit compose-directive.
- `herdr_spine_root()` (spawn.py:252–265) falls back to `~/herdr-spine`. Callers: `herdr_spine_legacy_verify_dir` (275–277) and `cmd_verify_migrate` (1244+) only. `verify_dir()` (268–272) already defaults to `~/agent-core/.verify` (VERIFY_DIR override). Desk (cmd_desk 1176–1192), orch, worker, fanout, prompt, reap must not open `~/tup` or `~/herdr-spine`.
- rg of spawn.py for `~/tup`, `/Users/jrg/tup`, `tup/socket`, `tup/bin`, `field.py`: no hits. Hits for `herdr-spine` are docstring line 59, `herdr_spine_root` fallback line 265, argparse help line 1495. No `spine-report` subprocess.
- `_LEDGER_PATH` (spawn.py:799) is `~/.tower/ledger.jsonl` used by `stamp_lineage` / verify-gate audit. Not a tup/herdr-spine path. Leave it unless it becomes a runnable `~/tup` or `~/herdr-spine` path.
- `~/muster/bin/muster-spawn` does not exist (`test -e` exit 1). `~/muster/runtime/spawn.lisp` does not exist. Operator ruling: Python door this Land; Lisp spawn.lisp is NOT a blocker.
- `~/muster/bin/` currently contains: `build-deposit.lisp`, `build-deposit.sh`, `muster-deposit`, `run-tests.sh`.
- Coder worktree cannot root on `~/muster`: `git -C ~/muster rev-parse HEAD` fails (no commits). CORD forbade commit. Write live absolute paths named in your Touch ONLY list. Do not write into a worktree and call it done. Do not edit `~/tup/**` or `~/herdr-spine/**`.
- Desk harness file `~/.config/herdr/desk-harness` contains `cursor`.

## Parallel Work Notice

Three AGNTs this unit, disjoint files. Ignore unrelated uncommitted noise in `~/agent-core` (other briefs, house, primitives). Do not investigate, revert, or fix those. Concern yourself only with your Touch ONLY list.

- **agnt-spawn-lift:** `/Users/jrg/muster/bin/muster-spawn` (NEW) and optional NEW `/Users/jrg/muster/tests/test-muster-spawn.sh`.
- **agnt-spawn-wrap:** `/Users/jrg/bin/spine-spawn`, `/Users/jrg/bin/herdr` only. Wrappers may land before the door binary exists; that is OK.
- **agnt-spawn-iso:** `/Users/jrg/muster/field/field.lisp`, `/Users/jrg/muster/durable/cli.lisp`, `/Users/jrg/muster/docs/agent-spawn-sop.md`, `/Users/jrg/muster/docs/DRIVING.md`, `/Users/jrg/muster/AGENTS.md` (spawn + isolation env lines only), optional NEW isolation test.

## Fleet comms (muster skill)

TOWER-WAIVED: retired bus absorbed by the muster deposit door; durable comms go through `/Users/jrg/muster/bin/muster-deposit` only — do not call tup, field.py, bellman, tower CLI/MCP, or any path under `~/herdr-spine` or `~/tup` except READ of `/Users/jrg/tup/socket/spawn.py` as a copy source for the lift agent.

- Addressed mail to parent: `/Users/jrg/muster/bin/muster-deposit deposit --from <your-registration-name> --to orch-spawn-door --kind done|need-help|report|question --body "<evidence>"`
- Read inbox before idle: `/Users/jrg/muster/bin/muster-deposit pending --to <your-registration-name>`
- Collect what you take: `/Users/jrg/muster/bin/muster-deposit collect <dep-id>`
- Pull loop: emit work with evidence (`report`); read pending before idle; `done` / `need-help` with evidence. Empty inbox is not a stop. `report` is not `done`. "Reported and awaited instruction" is not a stopping state.
- nQ to operator = 0. Escalate to orch-spawn-door only.
- Dead claimant recovery: UNKNOWN. Do not invent TTL/decay/heartbeat.
- Two stopping states only: every done-when met with evidence, or `need-help` naming owner after finishing independent work.

## This agent

You are agnt-spawn-lift. Copy the proven spawn body to Muster and leave it executable. Registration name for deposits: `agnt-spawn-lift`.

## Tasks

1. Copy `/Users/jrg/tup/socket/spawn.py` to `/Users/jrg/muster/bin/muster-spawn`. Keep `#!/usr/bin/env python3`. `chmod +x`. Do not edit the tup source. — done when: the dest file exists, is executable, and starts with that shebang.
2. Set argparse `prog` to `muster-spawn` (currently `spine-spawn` at spawn.py:1438). Keep subcommands orch, worker, fanout, prompt, desk, reap, verify-mark, verify-status, verify-migrate. Keep compose-directive / profiles / profile-model paths unchanged. Do not add a default that opens `~/tup` or `~/herdr-spine` from desk/orch/worker/fanout/prompt/reap. `herdr_spine_root` / `cmd_verify_migrate` may still mention `~/herdr-spine` as the legacy verify-migrate source only — that path must not run on desk seating. — done when: `/Users/jrg/muster/bin/muster-spawn --help` lists those subcommands (exit 0) and `/Users/jrg/muster/bin/muster-spawn desk --help` exits 0.
3. Optional NEW test `/Users/jrg/muster/tests/test-muster-spawn.sh`: run the two help commands above; assert exit 0 and that `--help` text contains `orch`, `worker`, `fanout`, `prompt`, `desk`, `reap`. Do not touch live ledgers. Do not edit `tests/run-tests.lisp` or `bin/run-tests.sh` (out of partition). Run the script yourself. — done when: if you added the script, it exists, is executable, and a run you captured exited 0.
4. Path self-check: rg the new file for `~/tup`, `/Users/jrg/tup`, `tup/socket`, `tup/bin/tup`, `field.py`, `~/herdr-spine`. Remaining hits go in your report with why they cannot execute on desk seating. Historical comments that say "retired / do not call" are allowed only if they do not encode a runnable path. — done when: the report lists every remaining hit and the desk/orch/worker/fanout/prompt/reap reason.

## Constraints

- Touch ONLY: `/Users/jrg/muster/bin/muster-spawn`, optional `/Users/jrg/muster/tests/test-muster-spawn.sh`. Do not commit. Do not delete `~/tup` or `~/herdr-spine`. Do not edit agent-core primitives. Do not edit `~/bin/spine-spawn` or `~/bin/herdr`.
- Testing: NO MOCKS. Isolation via scratch MUSTER_* dirs if a test would touch a ledger (help does not). Never write the live muster field or hash-chain by hand.
- If a muster door fails: do not stub; append `/Users/jrg/muster/docs/BUGREPORT.md` per DRIVING.md, then continue independent work or `need-help`.
- Match surrounding code style. Comments state constraints, not narration.

## Report back with

Deposit `--kind done` to `orch-spawn-door` with:
- `ls -la` + first 15 lines of `/Users/jrg/muster/bin/muster-spawn`
- `/Users/jrg/muster/bin/muster-spawn --help` and `desk --help` tails + exit codes
- Full path-audit rg output on the new file
- Every file created or modified, including dotfiles/config
- SHA256 of `/Users/jrg/muster/bin/muster-spawn`
- Deviations with reasons

Then write `/Users/jrg/agent-core/briefs/muster-full-cutover/AGNT-B1-lift-spawn-door.md.done` containing the same evidence. `.done` is last, after the deposit.
