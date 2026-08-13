# SHARED PREFIX — w3-plane-fixes (byte-identical for sibling AGNTs)

Do NOT use emojis anywhere. Repo: agent-core Tower MCP/CLI. Stack: Bun, append-only JSONL under `~/.tower/`.

## Pre-Verified Facts (ORCH verified 2026-08-13 this session)

1. Base SHA `71346672ae774b6226f20feb80c597f925740b6b` (main tip). You are spawned via
   `cursor-fleet make` into an assigned worktree — **your cwd is the edit root**.
   Do not edit `/Users/jrg/agent-core` main tree. Branch tip matches base SHA.
2. **F1 live:** `server.mjs` `send_to_user` (lines 187–202) builds
   `{ id, ts, cwd, kind, title, from, message }` with **no `to`**.
   `tower-ledger.mjs:349-353` unrelayed rule:
   `deliverable && to==='operator'`; alert allows `to` undefined.
   Tool return still claims turn-end guard for non-progress.
3. **F9 live:** `cli.mjs:127-130` `board` calls `boardFor(cwd)` and ignores
   `process.argv[3]`. BEFORE proof this session: with-topic and without-topic
   both 53 lines, `cmp` byte-identical.
   `boardFor(cwd, { topic, limit })` already supports topic filter
   (`tower-ledger.mjs:392`); MCP `board_read` already passes `{ topic }`.
4. **F4 live:** `server.mjs:236-239` `mark_relayed` only appends
   `{ kind:'ack', ids }` — no check against `inboxState(CWD).unrelayed`.
   `server.mjs` already imports `inboxState` from `./lib.mjs`.
5. Live symlinks: `~/.tower/server.mjs` →
   `/Users/jrg/agent-core/primitives/mcps/tower/server.mjs` (main tree).
   Same for `cli.mjs`. **You edit ONLY the worktree.** ORCH integrates to
   live paths after your done-when passes. Do not `git checkout` in main.
6. Fence: do not rewrite `board.jsonl`; do not touch bus-data compaction or
   write-path authorship rules. Post writer issues to `tower/bus-data`.
7. No mocks. No commits. No push.

## Parallel Work Notice

| Agent | Owns |
|-------|------|
| AGNT f1-f4 | `primitives/mcps/tower/server.mjs`, optional `primitives/hooks/tower-ledger.mjs` only if F4 needs it, `primitives/mcps/tower/COMMS-ARCH.md` (one short migration-item close note), new test file `primitives/mcps/tower/plane-fixes.test.mjs` |
| AGNT f9 | `primitives/mcps/tower/cli.mjs`, `primitives/mcps/tower/cli.test.mjs` |

Ignore uncommitted changes outside your partition. Do not investigate, revert, or fix them.

## Tower

- Board topic: `tower/w3-plane-fixes` (fleet mail). Gate notes also welcome on
  `tower/fully-operational` only from ORCH.
- CLAIM first (`type=claim`), findings mid-run, `.done` last on disk.
- from= your display role (e.g. `AGNT f1-f4`). Prefer MCP `board_post` /
  `board_read`; CLI fallback: `bun ~/.tower/cli.mjs post … --from '…'`.
- Do not ring the doorbell. Progress beacons only with specific numbers.
- Status is not mail. Idle after DONE is correct.

## Constraints (all workers)

- CWD for edits/tests: the worktree directory you were spawned into (`pwd`).
- Touch ONLY your partition paths relative to that cwd.
- Testing: NO MOCKS. Use real MCP spawn pattern from
  `primitives/mcps/tower/write-path.test.mjs` (`withMcp` / Bun.spawn server)
  and/or `bun test` against your worktree CLI path.
- Verification: `cd <your-cwd>/primitives/mcps/tower && bun test <your-test-file>`
- Do not commit. Do not push. Do not delete `~/.tower` state.
- After your tests green: write marker
  `/Users/jrg/agent-core/briefs/tower/w3-plane-fixes-evidence/workers/<slug>.done`
  containing SHA of worktree HEAD (may be dirty), test command + tail, and
  the report-back fields. Post a finding with the same summary.
