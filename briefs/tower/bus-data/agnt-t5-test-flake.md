# AGNT [write-path-tests flake] — drop live board absolute line-count asserts

Repo `/Users/jrg/agent-core`. File `primitives/mcps/tower/write-path.test.mjs` only. Do NOT use emojis.

## Pre-Verified Facts

- `bun test write-path.test.mjs`: 12 pass, 1 fail.
- Fail: `board_post rejects note without from` at line ~135 `expect(boardLineCount()).toBe(before)` — Expected 6673 Received 6674 because Arc/Tower fleets append concurrently to `~/.tower/board.jsonl`.
- Inside `withMcp`, `boardDelta === 0` already proved no append from the rejected post. The outer absolute equality is dishonest on a live shared board.
- Same outer pattern exists for empty-from test (~after line 139) — remove those absolute checks too if present.

## Tower

- TOWER-WAIVED: micro flake fix.

## Tasks

1. In write-path.test.mjs, remove (or replace with "oracleId absent from new lines") every `expect(boardLineCount()).toBe(before)` that spans a live-board window outside the boardDelta check. Keep `expect(boardDelta).toBe(0)` and reject/from assertions. — done when: `cd primitives/mcps/tower && bun test write-path.test.mjs` → 13 pass, 0 fail (run twice if needed to show non-flake).
2. Write `briefs/tower/bus-data/agnt-t5-test-flake.done`.

## Constraints

- Touch ONLY write-path.test.mjs + done marker. Do not commit. Edit the MAIN tree file at `/Users/jrg/agent-core/primitives/mcps/tower/write-path.test.mjs` (absolute path) so ORCH need not re-integrate from worktree.

## Report back with

- two consecutive `bun test` tails showing 13 pass
