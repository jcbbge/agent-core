# AGNT [w2-integrity-close] — Close residual gaps after bus-data land

Do NOT use emojis. Repo: agent-core Tower. You are spawned via `cursor-fleet make` into an assigned worktree — **cwd is the edit root**. Do not edit main tree.

## Pre-Verified Facts (ORCH verified 2026-08-13 this session)

1. Main tip includes `49698f6` / `3e2e108` — flock append + JSONL integrity already on main.
2. Landed API (authoritative — do NOT invent `jsonlIntegrity`):
   - `parseJsonl(text)` → `{ rows, bad_line_count, bad_line_numbers }`
   - `readJsonlStats(file)` → same shape; missing file → zeros
   - Live: `readJsonlStats(BOARD).bad_line_count === 26` (re-measure; ~26)
3. Surface already live: `bun ~/.tower/cli.mjs board` prints
   `integrity: N unparseable line(s) on board (max bad line M)` — EXIT 0.
   `cli status` does **not** yet print integrity (optional enhancement: mirror one line on status; board surface alone satisfies ORCH unit if tests lock board).
4. `COMMS-ARCH.md` lacks the consumer-tolerance + compaction-DEFERRED section. Draft intent (adapt names to landed API, not the superseded coder draft):
   - Consumers MUST skip-and-count malformed JSONL rows via `readJsonlStats` / `parseJsonl`.
   - Compaction of `board.jsonl` is DEFERRED per `briefs/tower/bus-data/CONCIERGE-RULING-compaction.md`.
5. Oracle draft exists (wrong API names) at
   `/Users/jrg/.cursor/worktrees/agent-core/wt-agnt-test-maker-w2y-p15/primitives/mcps/tower/jsonl-integrity.test.mjs`
   — use as intent reference only inside test-maker arm; **retarget** to landed API + `cli board` integrity line.
6. Fence: no board.jsonl rewrite; no flock changes; no merge of superseded coder worktree `wt-agnt-coder-w2y-p14`. No commits. No push.
7. Base SHA: run `git rev-parse HEAD` in your worktree at start (expect ≥ `7f42ba4` / post-flock tip).

## Parallel Work Notice

| Agent | Owns |
|-------|------|
| AGNT coder | `primitives/mcps/tower/COMMS-ARCH.md` (new short section only); optional one integrity line on `cli.mjs status` reusing `readJsonlStats` (do not rename landed APIs) |
| AGNT test-maker | `primitives/mcps/tower/jsonl-integrity.test.mjs` retargeted to `readJsonlStats`/`parseJsonl` + `cli board` integrity (and status if coder adds it) |
| SAGT consumer-audit | evidence-only matrix; not your files |

## Tower

- Topic `tower/w2-consumer-resilience`. CLAIM first. Findings with test tails. No doorbell.

## Intent / acceptance

### A. Docs
COMMS-ARCH gains a short **JSONL consumer integrity** subsection citing skip-and-count, `readJsonlStats`/`parseJsonl` field names, and compaction DEFERRED + ruling path. Do not claim `jsonlIntegrity` or `lastBadOffset` unless you also add those as thin aliases (prefer NOT — match landed names).

### B. Tests
Suite locks:
- fixture skip-and-count exact `bad_line_count`
- live board `bad_line_count` ~26 via `readJsonlStats(BOARD)`
- `readAll`/`boardFor`/`inboxState` do not throw on bad lines
- `bun cli.mjs board` stdout matches `/integrity:.*unparseable/i` and non-zero when live board dirty
- If status line added: assert it too; else do not require status

### C. Optional status mirror
If cheap (<15 lines): `cli status` prints the same integrity summary as board. Not required if board is locked.

## Tasks (coder)

1. COMMS-ARCH section — done when: subsection present with ruling cite + landed API names.
2. Optional status integrity line.
3. Marker:
   `/Users/jrg/agent-core/briefs/tower/w2-consumer-resilience-evidence/workers/integrity-close-coder.done`

## Tasks (test-maker)

1. Author/retarget `jsonl-integrity.test.mjs` from this plan — done when: fails on tree missing COMMS-ARCH section? (docs not testable) — tests fail only on missing integrity API/surface; green when landed API + board line present even before COMMS-ARCH.
2. Marker:
   `/Users/jrg/agent-core/briefs/tower/w2-consumer-resilience-evidence/workers/integrity-close-tests.done`

## Constraints

- Touch ONLY your partition under spawn cwd.
- Evidence markers under `briefs/tower/w2-consumer-resilience-evidence/workers/` allowed.
- No commit. No push. No flock. No board rewrite.

## Report back with

Diff summary, `bun test jsonl-integrity.test.mjs` tail, live `readJsonlStats` count, deviations.
