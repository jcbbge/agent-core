# AGNT tester — run board_append flock suite (Verify)

Do NOT use emojis. Cwd / edit root: `/Users/jrg/.cursor/worktrees/herdr-spine/wt-agnt-coder-w2y-p1q` (integrated: coder flock + test-maker suite). Read-only for production code — you may run tests only. Do not edit implementation or tests unless the brief says (it does not).

## Pre-Verified Facts (ORCH verified 2026-08-14)

1. Branch in this worktree: `fix/spine-board-flock`.
2. Impl: `bin/handlers/_spine_common.py` and `bin/spine-claim` hold `fcntl.flock(..., LOCK_EX)` before append write.
3. Suite: `bin/handlers/tests/test_board_append_flock.py` — single-write and concurrent writers both use subprocess with `SPINE_BOARD_PATH` set before import (live-board safe).
4. Run from worktree root:
   `python3 bin/handlers/tests/test_board_append_flock.py`
5. Expect: exit 0, `all 3 passed` (or equivalent). Concurrent = 4×40 writes, all lines parse.

## Parallel Work Notice

Ignore other worktrees. Do not modify files.

## Tower

- Topic `tower/fully-operational`. Post FINDING with full test stdout/stderr tail. On failure, post the failure output verbatim — do not diagnose (arbiter owns diagnosis).

## Tasks

1. Run `python3 bin/handlers/tests/test_board_append_flock.py` from the worktree root — done when: command completed; exit code recorded.
2. Marker: `/Users/jrg/agent-core/briefs/tower/spine-board-flock/workers/tester.done` with exit code + full output.
3. Do not edit code. Do not commit.

## Constraints

- No mocks. No env pointing at `~/.tower/board.jsonl` for writes (suite sets its own temps).
- Do not "fix" failures.

## Report back with

Exit code, full test output, whether `~/.tower/board.jsonl` mtime changed during the run (optional check).
