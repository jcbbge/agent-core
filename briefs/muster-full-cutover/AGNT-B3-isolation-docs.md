# AGNT [isolation docs]

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

You are agnt-spawn-iso. Lisp isolation prefers MUSTER_*; docs teach muster-spawn and MUSTER_* as live. Registration name for deposits: `agnt-spawn-iso`.

## Extra facts (isolation, verified this session)

- `field/field.lisp:16` reads `TUP_FIELD_DIR` only for `field-dir`. `:42` `TUP_FIXED_TS`. `:119` `gen-id` uses `"TUP_FIXED_DEP_ID"`. `:157` `"TUP_FIXED_COL_ID"`. `gen-id` (35–40) takes one env-name.
- `durable/cli.lisp:14-16` `env-or` (non-empty getenv else fallback). `:26` `TUP_STORE_DIR`. `:29` `TUP_EVENTS_PATH`. `:32` `TUP_FIXED_TS`.
- Existing tests (OUT of partition — do not edit): `tests/test-field.lisp` and `tests/test-durable-cli.lisp` set `TUP_*` only; `bin/run-tests.sh` exports `TUP_FIELD_DIR` / `TUP_STORE_DIR` / `TUP_EVENTS_PATH` into a mktemp scratch. TUP_* fallback MUST keep that suite green. Do not edit `tests/run-tests.lisp` or `bin/run-tests.sh`.
- `AGENTS.md` isolation 48–51 still lists TUP_* as primary. Spawning 61–63 teaches `spine-spawn worker --kind cursor --profile orchestrator:grok`. Touch spawn + isolation env lines only. Do not rewrite the intro sentence about a scripted-runtime layer (outside this partition). CORD ruling 1 already allows the Python spawn door.
- `docs/agent-spawn-sop.md` teaches `herdr workspace create --env TUP_*` and `spine-spawn worker --into ... --kind cursor --profile orchestrator:grok`. Spawn CLI docs may show wrapper flags but must name `muster-spawn` (or `~/bin/spine-spawn` as a forwarder) and must not teach briefs to hardcode `--kind` or a model. `~/bin/spine-spawn` as a forwarder name is allowed.
- `docs/DRIVING.md` isolation 75–95 and 89–92, spawn 150–153, SOP isolation 191, deposit row 213, bug template 303 still teach TUP_* as the live env and `spine-spawn worker --kind cursor --profile <role>:<model>`. Update those. Do not teach `~/tup/socket/spawn.py` or `~/herdr-spine/bin/spine-spawn` as live.

## Tasks

1. Lisp: prefer MUSTER_* then fall back to TUP_* then the existing default. `field.lisp`: `MUSTER_FIELD_DIR` / `TUP_FIELD_DIR`; `MUSTER_FIXED_TS` / `TUP_FIXED_TS`; `MUSTER_FIXED_DEP_ID` / `TUP_FIXED_DEP_ID`; `MUSTER_FIXED_COL_ID` / `TUP_FIXED_COL_ID`. `durable/cli.lisp`: `MUSTER_STORE_DIR` / `TUP_STORE_DIR`; `MUSTER_EVENTS_PATH` / `TUP_EVENTS_PATH`; `MUSTER_FIXED_TS` / `TUP_FIXED_TS`. Match surrounding style; a small helper is fine. — done when: those files read MUSTER_* first and still honor TUP_* when MUSTER_* is unset.
2. Prove fallback: `/Users/jrg/muster/bin/run-tests.sh` (still sets TUP_* — you must not edit it) ends GREEN with FAIL 0. If it is not green: do not stub; BUGREPORT.md then `need-help`. Optional NEW `/Users/jrg/muster/tests/test-muster-isolation.lisp` proving MUSTER_* wins over TUP_* on a scratch dir; run it standalone via sbcl (cannot wire into `run-tests.lisp`). — done when: existing suite GREEN captured; if the new test exists, a captured standalone run exited 0.
3. Docs: `docs/agent-spawn-sop.md`, `docs/DRIVING.md`, `AGENTS.md` (spawn + isolation env lines only). Live spawn is `~/muster/bin/muster-spawn` or `~/bin/spine-spawn` as a forwarder. Isolation env is MUSTER_* primary; TUP_* documented as fallback/compat only. Do not teach `~/tup/socket/spawn.py`, `~/herdr-spine/bin/spine-spawn`, or TUP_* as the primary live env. Briefs must not be taught to hardcode `--kind` or a model. — done when: `rg TUP_FIELD_DIR /Users/jrg/muster/docs/DRIVING.md /Users/jrg/muster/AGENTS.md /Users/jrg/muster/docs/agent-spawn-sop.md` shows only fallback/compat wording if any; those files do not teach the retired spawn paths as live.

## Constraints

- Touch ONLY: `/Users/jrg/muster/field/field.lisp`, `/Users/jrg/muster/durable/cli.lisp`, `/Users/jrg/muster/docs/agent-spawn-sop.md`, `/Users/jrg/muster/docs/DRIVING.md`, `/Users/jrg/muster/AGENTS.md` (spawn + isolation env lines only), optional `/Users/jrg/muster/tests/test-muster-isolation.lisp`. Do not commit. Do not delete `~/tup` or `~/herdr-spine`. Do not edit agent-core primitives. Do not edit `~/bin/*` or `~/muster/bin/muster-spawn`. Do not edit `tests/test-field.lisp`, `tests/test-durable-cli.lisp`, `tests/run-tests.lisp`, `bin/run-tests.sh`.
- Testing: NO MOCKS. Isolation via scratch MUSTER_* dirs. Never write the live muster field or hash-chain by hand.
- If a muster door fails: do not stub; append `/Users/jrg/muster/docs/BUGREPORT.md` per DRIVING.md, then continue independent work or `need-help`.
- Match surrounding code style. Comments state constraints, not narration.

## Report back with

Deposit `--kind done` to `orch-spawn-door` with:
- Isolation env change summary (Lisp + docs) with cited lines
- `rg TUP_FIELD_DIR` output on the three doc files
- `./bin/run-tests.sh` tail + EXIT
- Every file created or modified, including dotfiles/config
- Deviations with reasons

Then write `/Users/jrg/agent-core/briefs/muster-full-cutover/AGNT-B3-isolation-docs.md.done` containing the same evidence. `.done` is last, after the deposit.
