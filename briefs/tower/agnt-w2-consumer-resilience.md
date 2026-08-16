# AGNT [w2-consumer-resilience] — Tolerant readers that COUNT

Do NOT use emojis anywhere. Repo: agent-core (Tower bus). Stack: Bun, append-only JSONL under `~/.tower/`. Concierge ruled compaction NO (`briefs/tower/bus-data/CONCIERGE-RULING-compaction.md`); the fix is skip-and-count on every consumer of board/ledger JSONL, with a visible integrity number.

You are spawned via `cursor-fleet make` into an assigned worktree — **your cwd is the edit root**. Do not edit `/Users/jrg/agent-core` main tree. Live `~/.tower/*.mjs` symlinks point at main; ORCH integrates after both arms land.

## Pre-Verified Facts (ORCH verified 2026-08-13 this session)

1. Base SHA `5c0b30f4844a232d87a1fbbc967e1d6612a608e1` (`git -C ~/agent-core rev-parse HEAD`).
2. Live bad-row measure (strict `JSON.parse` per non-empty line of `~/.tower/board.jsonl`): **bad=26**, totalNonEmpty=7239, sample bad line numbers include 1,2,3,553,2113. Re-measure at proof time; expect ~26.
3. Canonical grammar: `primitives/hooks/tower-ledger.mjs`. `parseLines` (approx lines 205–216) already try/catch + drops nulls — readers survive, but **no count is retained or exported**. Cursor paths (`readAllFull`, board/ledger cursor ingest) call the same `parseLines`.
4. `primitives/mcps/tower/lib.mjs` re-exports ledger (`export * from '../../hooks/tower-ledger.mjs'`). CLI/server import via `./lib.mjs`.
5. `cli.mjs status` (approx lines 109–122) prints unrelayed / open questions / progress / burn — **no integrity line**.
6. Live: `bun ~/.tower/cli.mjs status` EXIT 0 today (skips silently). Symlinks: `~/.tower/cli.mjs` → `primitives/mcps/tower/cli.mjs` (main); `~/.tower/COMMS-ARCH.md` → `primitives/mcps/tower/COMMS-ARCH.md`.
7. `twr.ts` imports `boardFor`/`readAll` from `~/.tower/lib.mjs` — inherits skip; does not surface count (ORCH files GAP unless you add a one-line integrity read via exported API without rewriting twr UI).
8. Fence: do **not** rewrite/compact `board.jsonl`. Do **not** touch flock/write-path work (bus-data pheromones `ph-msro2bbg-xpzs` / `ph-msrosz2u-zaf2`). No mocks. No commits. No push.

## Parallel Work Notice

| Agent | Owns |
|-------|------|
| AGNT coder (make arm) | `primitives/hooks/tower-ledger.mjs`, `primitives/mcps/tower/cli.mjs`, `primitives/mcps/tower/COMMS-ARCH.md`, optional thin export touch in `lib.mjs` only if re-export insufficient |
| AGNT test-maker (make arm) | new/updated tests under `primitives/hooks/` and/or `primitives/mcps/tower/` that lock skip-and-count + status surface — **from this plan only; do not read implementation** |
| SAGT consumer-audit (sibling) | spine `40-tower-bridge` / `10-notify` + hooks audit → FIXED or named GAP on board; does not edit your partition |

Ignore uncommitted changes outside your partition.

## Tower

- Board topic: `tower/w2-consumer-resilience`. Gate notes only from ORCH on `tower/fully-operational`.
- CLAIM first (`type=claim`, from= your display role), findings with numbers mid-run, `.done` marker last.
- Prefer MCP `board_post` / `board_read`. No doorbell. Status is not mail.

## Intent / acceptance (both arms — this is the plan)

### A. Integrity signal (ledger)

- Every JSONL parse of board/ledger (and any other file routed through the shared parse helper) must **skip** malformed lines and **count** them.
- Export a stable API, name preferred: `jsonlIntegrity(file)` or module-level getters returning at least `{ badRows, lastBadOffset }` where `lastBadOffset` is a byte offset into the scanned text (or documented equivalent: last bad line index — pick one, document in a one-line comment, keep stable).
- After a read of the live board via the public read path, `badRows` for BOARD must be non-zero when the live file still has the historical damage (~26).
- Dropping bad rows must remain the behavior: `readAll`/`boardFor`/`inboxState` never throw on a bad line.

### B. CLI surface

- `bun <worktree>/primitives/mcps/tower/cli.mjs status` (or `TOWER_*` env pointing at real `~/.tower` state) prints an integrity line including the bad-row count for board (and ledger if cheap/same helper). Example shape (exact wording flexible): `integrity: board badRows=N lastBadOffset=M` (or equivalent readable fields).
- EXIT 0 against real `~/.tower` state.

### C. COMMS-ARCH

- Short section (canonical file `primitives/mcps/tower/COMMS-ARCH.md`): consumers MUST tolerate and count bad JSONL rows; compaction of `board.jsonl` is DEFERRED per concierge ruling path `briefs/tower/bus-data/CONCIERGE-RULING-compaction.md`. No rewrite of unrelated sections.

### D. Tests (test-maker owns; coder must pass them after integrate)

- Fixture JSONL with known good + known bad lines → skip-and-count asserts exact `badRows` (and offset/line contract you lock).
- Status (or exported integrity helper used by status) surfaces the count — black-box via CLI spawn or importing the exported helper; NO MOCKS of fs if you can use temp files + env overrides the codebase already supports; if no env override exists, temp BOARD path via existing test patterns in `write-path.test.mjs` / ledger tests.
- Must not require rewriting live `~/.tower/board.jsonl`.

## Tasks (coder)

1. Implement A+B+C in the worktree partition — done when: exported integrity signal exists; status shows count; COMMS-ARCH section present; `bun test` for the new/updated integrity tests green in worktree.
2. Live proof script output saved under
   `/Users/jrg/agent-core/briefs/tower/w2-consumer-resilience-evidence/LIVE-PROOF.txt`
   — run worktree CLI status (or integrity helper) against real `~/.tower/board.jsonl`; record badRows (~26), EXIT 0.
3. Marker — done when:
   `/Users/jrg/agent-core/briefs/tower/w2-consumer-resilience-evidence/workers/coder.done`
   contains worktree HEAD (dirty ok), test command+tail, live badRows, file list touched.

## Tasks (test-maker)

1. Author criteria + tests from this plan only — done when: tests fail on base (or assert missing API) and encode A+B; write
   `/Users/jrg/agent-core/briefs/tower/w2-consumer-resilience-evidence/workers/test-maker.done`
   with test paths and intended fail signature on unpatched tree.

## Constraints

- Touch ONLY under spawn cwd: paths listed in Parallel Work Notice for your arm.
- Also allowed: evidence markers under
  `/Users/jrg/agent-core/briefs/tower/w2-consumer-resilience-evidence/`.
- Do not commit. Do not push. Do not compact board.jsonl.
- Do not edit spine / twr / bus-data flock patches.

## Report back with

- Diff summary per file.
- Test command + full tail.
- Live integrity count.
- Deviations with reasons.
