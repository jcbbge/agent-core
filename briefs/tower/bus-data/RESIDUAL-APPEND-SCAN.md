# RESIDUAL-APPEND-SCAN — bare BOARD writers under primitives/

**Scan:** 2026-08-13 · **Agent:** SAGT residual-scan-r2  
**Scope:** `/Users/jrg/agent-core/primitives` — `appendFileSync` (and equivalent direct append) to `board.jsonl` / `BOARD` outside flocked `append()` from `tower-ledger.mjs`.  
**Excluded:** `primitives/_attic/**`, `**/*test*`, non-BOARD targets.

## Method

1. Ripgrep `appendFileSync` under `primitives/` (excluding `_attic`).
2. Cross-check each hit for `board.jsonl`, `BOARD`, or `TOWER_LEDGER` targets.
3. Classify: flocked `append(BOARD, …)` (compliant), bare BOARD bypass (residual), or non-BOARD (out of scope).
4. Compare out-of-fence hits against known open WAs (`ph-mss6xokq-2ui4`, `ph-mss6xokt-8xif`).

## In-fence bare BOARD bypass (residual)

| path:line | writer | status |
|-----------|--------|--------|
| `primitives/tools/statem/statem.ts:97` | `appendFileSync(BOARD, JSON.stringify(row) + "\n")` in `appendBoard()` | **OPEN** — sibling T1 on branch `tower/bus-data-residuals` migrates to flocked `append()` |

**Count:** 1 remaining in-fence bare BOARD writer (excluding attic/tests).

## In-fence compliant BOARD writers (not residuals)

| path:line | mechanism |
|-----------|-----------|
| `primitives/mcps/tower/cli.mjs:181` | `append(BOARD, row)` |
| `primitives/mcps/tower/server.mjs:263` | `append(BOARD, entry)` via `board_post` |
| `primitives/hooks/tower-ledger.mjs:115-130` | canonical flocked `append()` (`LOCK_EX` or lockfile fallback) |

## appendFileSync hits reviewed — not BOARD residuals

| path:line | target | verdict |
|-----------|--------|---------|
| `primitives/hooks/tower-ledger.mjs:129` | any JSONL file | inside flocked `append()` fallback — compliant |
| `primitives/mcps/tower/rotate.mjs:256` | `archive/manifest.jsonl` | not BOARD |
| `primitives/mcps/tower/server.mjs:199` | `deliverables/*.md` | not BOARD |
| `primitives/plugins/peer-session.ts:90,199` | `TRACE_FILE` | not BOARD |

## Attic (excluded from count)

| path:line | note |
|-----------|------|
| `primitives/mcps/tower/attic/cli.mjs.bak-20260812T165125Z:102` | bare `appendFileSync` to relative `board.jsonl` — backup only |
| `primitives/mcps/tower/attic/server.mjs.bak-*` | deliverable markdown writes only |

## Out-of-fence bare BOARD writers (reference only — WAs already open)

| location | path:line | mechanism | open WA |
|----------|-----------|-----------|---------|
| cursor-shim | `cursor-spine:177-178` | `printf … >> "$TOWER_LEDGER"` (`tower_lineage`) | `ph-mss6xokq-2ui4` |
| cursor-shim | `cursor-spine:403-404` | `printf … >> "$TOWER_LEDGER"` (`verify-gate-bypass`) | `ph-mss6xokq-2ui4` |
| herdr-spine | `bin/handlers/_spine_common.py:339-340` | `open(TOWER_BOARD_PATH, "a")` in `board_append()` | `ph-mss6xokt-8xif` |
| herdr-spine | `bin/spine-claim:99-100` | same pattern in embedded `board_append()` | `ph-mss6xokt-8xif` |

**New out-of-fence BOARD bypasses this scan:** none.

## Summary

- **In-fence residual:** 1 (`statem.ts:97`) — tracked for T1 migration.
- **Compliant in-fence BOARD path:** cli + server + tower-ledger `append()`.
- **Out-of-fence:** cursor-shim printf and herdr-spine Python bare append — already have open WAs; no duplicates emitted.
