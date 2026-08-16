# AGNT [w2-integrity-test-fix] — Fix TOWER_HOME false reds

Do NOT use emojis. You own ONLY the test file. Arbiter-equivalent ruling from ORCH verify: **bad test**, not bad impl.

## Pre-Verified Facts (ORCH verified 2026-08-13)

1. In coder worktree `wt-agnt-coder-w2y-p18` with your suite copied in: **14 pass / 2 fail**.
2. Failures:
   - `boardFor on fixture with bad lines` Expected count 2, Received 50 — `TOWER_HOME` does **not** redirect `BOARD`/`LEDGER` (homedir-anchored in `tower-ledger.mjs`). Fixture never seen.
   - `board with TOWER_HOME fixture reports fixture bad_line_count` — same: CLI still reads live `~/.tower/board.jsonl`, so integrity line stays `26` not `1`.
3. Landed API is correct. Live `readJsonlStats(BOARD).bad_line_count === 26`. `cli board` and coder `cli status` print integrity.
4. Source test: `/Users/jrg/.cursor/worktrees/agent-core/wt-agnt-test-maker-w2y-p19/primitives/mcps/tower/jsonl-integrity.test.mjs`
5. Work in a worktree (spawn cwd). No commit.

## Tower

- Topic `tower/w2-consumer-resilience`. CLAIM from=`AGNT w2-integrity-test-fix`.

## Tasks

1. Retarget the two failing tests: assert fixture behavior via `parseJsonl` / `readJsonlStats` on an explicit temp **file path** (not `boardFor`/`cli` under TOWER_HOME). Keep all currently-passing tests.
2. Optionally delete/skip TOWER_HOME CLI isolation tests with a one-line comment citing homedir-anchored BOARD.
3. Prove green: `bun test jsonl-integrity.test.mjs` in a tree that has coder COMMS-ARCH+status OR main+your tests + copy of coder cli if needed — report full pass count.
4. Marker: `/Users/jrg/agent-core/briefs/tower/w2-consumer-resilience-evidence/workers/integrity-test-fix.done`

## Constraints

- Touch ONLY `primitives/mcps/tower/jsonl-integrity.test.mjs` (+ marker).
- No production code edits. No mocks.

## Report back with

Pass/fail counts, what changed in the two tests.
