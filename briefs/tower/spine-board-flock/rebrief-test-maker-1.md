# REBRIEF — AGNT test-maker — fix single-write oracle (bad test)

Do NOT use emojis. Repo worktree: `/Users/jrg/.cursor/worktrees/herdr-spine/wt-agnt-test-maker-w2y-p1r` (cwd). Partition: `bin/handlers/tests/test_board_append_flock.py` only.

## Pre-Verified Facts (ORCH verified 2026-08-14 after first pass)

1. Your prior `test_board_append_flock.py` exists in this worktree (202 lines). Concurrent subprocess workers are correct: they set `SPINE_BOARD_PATH` in `env` **before** the child imports `_spine_common`.
2. `_spine_common.TOWER_BOARD_PATH` is assigned **at import time** from `os.environ.get("SPINE_BOARD_PATH")` (live code line ~33). Setting `os.environ["SPINE_BOARD_PATH"]` **after** `import _spine_common` does **not** retarget `board_append` — it still writes to `~/.tower/board.jsonl`.
3. Therefore `test_single_write_newline_and_json` as written would append to the **live** Tower board. That is a fail of Intent §C and a safety defect. ORCH did not run it.
4. Coder arm already flocked both sites on branch `fix/spine-board-flock` (verified LOCK_EX before write). Do not read coder diffs; you do not need them.

## Parallel Work Notice

Coder partition frozen pending your fix. Ignore other dirty trees.

## Tower

- Topic `tower/fully-operational`. Post FINDING when fixed. No doorbell.

## Tasks

1. Rewrite `test_single_write_newline_and_json` so the write happens in a **subprocess** (or otherwise guarantees `SPINE_BOARD_PATH` is set in the process environment **before** `_spine_common` is imported). Same assertions: file exists, ends with `\n`, one parseable JSON line, required keys, type/body/from/topic match.
2. Keep concurrent test + no fcntl mocks.
3. Do not SKIP-pass on missing import when run against a tree that has `_spine_common` — exit 0 skip only if truly absent (parallel split); once imported in child with env set, failures must fail.
4. Marker overwrite: `/Users/jrg/agent-core/briefs/tower/spine-board-flock/workers/test-maker.done` with "REBRIEF1 fixed single-write subprocess" + run command.
5. Do NOT commit. Do NOT touch implementation files.

## Constraints

- Touch ONLY `bin/handlers/tests/test_board_append_flock.py` (+ marker).
- Never write to `~/.tower/board.jsonl`.

## Report back with

Diff summary of the single-write fix; confirmation both tests use pre-import env; deviations.
