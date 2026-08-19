# AGNT [retarget wrappers]

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

You are agnt-spawn-wrap. Point the two live wrappers at Muster's spawn door. Registration name for deposits: `agnt-spawn-wrap`.

## Extra facts (wrappers, verified this session)

- `/Users/jrg/bin/herdr` is 1821 bytes, bash, executable. Line 9: `SPINE_SPAWN="${SPINE_SPAWN:-$HOME/herdr-spine/bin/spine-spawn}"`. Line 52 `seat_desk`: `python3 "$SPINE_SPAWN" desk --kind "$kind" --profile "$profile" --pane "$pane" >/dev/null`. Leave `REAL`, desk-harness path, `normalize_kind`, and the rest of the desk flow unchanged.

## Tasks

1. Rewrite `/Users/jrg/bin/spine-spawn` so it `exec`s `"$HOME/muster/bin/muster-spawn"` with `"$@"`. Keep it bash, `set -euo pipefail`, executable. Compatibility name `spine-spawn` stays as a forwarder only. Do not keep comments that encode a runnable path under `~/tup` or `~/herdr-spine` (the current file's `python3 "${HOME}/tup/bin/tup"` and the `bun ~/herdr-spine/bin/spine-spawn` warning are live-path comments — drop or reword without a copy-pasteable path). — done when: `head -n 20 /Users/jrg/bin/spine-spawn` contains `muster-spawn` and contains neither `tup` nor `herdr-spine`.
2. Retarget `/Users/jrg/bin/herdr`: default `SPINE_SPAWN` must be `$HOME/muster/bin/muster-spawn`. Change `seat_desk` to run that executable (`"$SPINE_SPAWN" desk --kind "$kind" --profile "$profile" --pane "$pane"`), not `python3 "$SPINE_SPAWN"`. Usage text may still say the compatibility name `spine-spawn`; it must not teach `~/herdr-spine` or `~/tup` as live. — done when: the `SPINE_SPAWN` assignment and the desk-invoke line contain `muster-spawn` and contain neither `tup` nor `herdr-spine`.
3. Path self-check: rg both wrappers for `~/tup`, `herdr-spine`, `tup/socket`, `tup/bin/tup`, `field.py`. Remaining hits go in your report with why they cannot execute on desk seating. Historical comments that say "retired / do not call" are allowed only if they do not encode a runnable path. — done when: the report lists every remaining hit.

Do not wait for `/Users/jrg/muster/bin/muster-spawn` to exist. Do not invoke the wrappers as a smoke test of the door (sibling owns the binary; a missing dest would fail `exec` before both land). File contents are the done-when.

## Constraints

- Touch ONLY: `/Users/jrg/bin/spine-spawn`, `/Users/jrg/bin/herdr`. Do not commit. Do not delete `~/tup` or `~/herdr-spine`. Do not edit agent-core primitives. Do not edit `~/muster/bin/muster-spawn`.
- Testing: NO MOCKS. Never write the live muster field or hash-chain by hand.
- If a muster door fails: do not stub; append `/Users/jrg/muster/docs/BUGREPORT.md` per DRIVING.md, then continue independent work or `need-help`.
- Match surrounding code style. Comments state constraints, not narration.

## Report back with

Deposit `--kind done` to `orch-spawn-door` with:
- `ls -la` + full contents of `/Users/jrg/bin/spine-spawn`
- `ls -la` + the `SPINE_SPAWN` assignment and `seat_desk` function of `/Users/jrg/bin/herdr`
- Full path-audit rg output on both wrappers
- Every file created or modified, including dotfiles/config
- SHA256 of `/Users/jrg/bin/spine-spawn` `/Users/jrg/bin/herdr`
- Deviations with reasons

Then write `/Users/jrg/agent-core/briefs/muster-full-cutover/AGNT-B2-retarget-wrappers.md.done` containing the same evidence. `.done` is last, after the deposit.
