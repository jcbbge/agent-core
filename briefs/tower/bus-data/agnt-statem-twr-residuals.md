# AGNT unit [statem-twr-residuals] — flocked statem append + twr integrity count (T1+T2)

Repo `/Users/jrg/agent-core`. Unit slug `statem-twr-residuals`. Migrate statem board writes onto flocked `append()` and surface `bad_line_count` in twr. Do NOT use emojis anywhere. This brief is the `cursor-fleet make` unit (coder + test-maker bifurcated). Prefer branch `tower/bus-data-residuals` (make worktrees). No compaction. No live `board.jsonl` rewrite. Workers never commit.

## Pre-Verified Facts (ORCH verified 2026-08-13 this session)

- `primitives/tools/statem/statem.ts:87–98` — `appendBoard` builds an authored finding row then `appendFileSync(BOARD, JSON.stringify(row) + "\n")` — bypasses flocked `append()`.
- Flocked writer: `primitives/hooks/tower-ledger.mjs` `export function append(file, obj)` uses `LOCK_EX` via libc flock (fallback lockfile). Signature: `append(file, obj)` — stringifies + newline internally. Do NOT double-stringify.
- Import path for tools: `import { append, BOARD as TOWER_BOARD, readJsonlStats } from '/Users/jrg/.tower/lib.mjs'` (symlink → `primitives/mcps/tower/lib.mjs` → re-exports ledger). Or relative to ledger if preferred — keep `--board` override working: pass the resolved `BOARD` CLI path into `append(BOARD, row)`.
- After migration: remove unused `appendFileSync` import from `statem.ts` if no longer referenced. Keep `writeFileSync` if still used for baseline/tabs.
- `primitives/tools/statem/twr.ts` imports `boardFor`/`readAll`/`normCwd`/`BOARD` from lib — tolerant readers already skip bad lines but **never print `bad_line_count`**. Live board: `readJsonlStats(BOARD)` → `{ bad_line_count: 26, … }` (max bad line 2577). Prove twr surfaces that count (header/footer line) without throwing.
- W2 integrity doctrine in COMMS-ARCH §JSONL consumer integrity must not regress — extend twr only.
- Exemplar: `primitives/mcps/tower/flock-integrity.test.mjs` + `jsonl-integrity.test.mjs` patterns (temp files, no mocks). New tests under `primitives/tools/statem/` or `primitives/mcps/tower/` only if needed for this partition.
- Proof path: `/Users/jrg/agent-core/briefs/tower/bus-data/STATEM-TWR-RESIDUALS-PROOF.md`

## Parallel Work Notice

- Sibling AGNT owns `COMMS-ARCH.md` factual sync (T3) — do not edit COMMS-ARCH.
- Sibling SAGT owns residual appendFileSync scan (T4) — do not own that note.
- CORD tower (w2Y) owns retention/planes; spine twin + cursor-shim printf out of fence.
- Ignore unrelated dirty tree (`models.json`, wave-rollup, other briefs).

## Tower

- Topic `tower/bus-data`, from=`AGNT statem-twr-residuals` (coder) / `AGNT statem-twr-residuals-tests` (test-maker).
- CLAIM first, findings during, `.done` last. Never hand-append `board.jsonl`.
- Field: heartbeat/re-claim `ph-mss6xmo5-71z2` (statem) and `ph-mss6xnca-p9ex` (twr) while working; work-done with `ref` + evidence when each half finishes (coder owns both code proofs; test-maker owns criteria).
- spine-report task/verdict on Herdr.

## Tasks

### Implementer (coder) — T1 + T2

1. **T1 — flocked statem writes:** Replace bare `appendFileSync` to BOARD with `append(BOARD, row)` from tower lib/ledger. Keep authored row shape (`type:finding`, `from:statem@…`, `topic:statem`). Honor `--board` override. — done when: no `appendFileSync(` targeting BOARD in `statem.ts`; import uses flocked `append`; smoke: temp board + `--once` (or equivalent) writes one parseable line via flocked path; record proof.
2. **T2 — twr integrity surface:** Import `readJsonlStats` (or equivalent). Print/return `bad_line_count` for the active board path without throwing on bad lines. Scoped project rows stay as today. — done when: live `bun twr.ts /Users/jrg/agent-core --once` (add `--once` if missing; otherwise one-tick / short run) shows integrity ≈26 matching `readJsonlStats`; command + output in proof.
3. Write `briefs/tower/bus-data/STATEM-TWR-RESIDUALS-PROOF.md`.
4. Write `briefs/tower/bus-data/agnt-statem-twr-residuals.done`.

### Test-maker — intent tests only

- From this plan only (do not read implementer code): author executable tests for (a) transition/board write goes through flocked `append` API (no bare fs append to board in the unit under test — assert via temp board + parse); (b) integrity surface reports exact bad_line_count for a fixture with N bad lines; (c) good lines still render / parse. No mocks. Write criteria + `.done` for test-maker half. Temp files only — do not rewrite live board.

## Constraints

- Touch ONLY: `primitives/tools/statem/statem.ts`, `primitives/tools/statem/twr.ts`, tests/criteria under `primitives/tools/statem/` or sibling names under `primitives/mcps/tower/` if that matches local convention for these tools, `briefs/tower/bus-data/STATEM-TWR-RESIDUALS-PROOF.md`, `briefs/tower/bus-data/agnt-statem-twr-residuals.done`, `briefs/tower/bus-data/agnt-statem-twr-residuals-tests.done`. Do not commit.
- No compaction. No COMMS-ARCH edits.
- Testing: real temp JSONL; no mocks of flock/append away.

## Report back with

- paths changed + diff summary
- proof commands/outputs (statem write path; twr integrity ≈26)
- test paths + pass counts if run
- `.done` paths
- field work-done refs if emitted
