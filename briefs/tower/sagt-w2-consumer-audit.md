# SAGT [w2-consumer-audit] — Audit remaining Tower consumers (retry)

Do NOT use emojis. Read-only except board posts + evidence files. Prior spawn timed out without `.done` — complete the matrix.

## Pre-Verified Facts (ORCH verified 2026-08-13)

1. Live board `readJsonlStats(BOARD).bad_line_count === 26` on main post-`3e2e108`.
2. Core readers: `tower-ledger.mjs` `parseJsonl` / `readJsonlStats` skip-and-count. `cli board` prints integrity.
3. `twr.ts` imports `boardFor`/`readAll` from `~/.tower/lib.mjs` → INHERIT tolerate; no count display → GAP-count-only (acceptable).
4. Check: `/Users/jrg/herdr-spine/bin/handlers/40-tower-bridge`, `10-notify`; `primitives/mcps/tower/hooks/*.mjs`; `primitives/hooks/flight-recorder.mjs`; `session-capture-cursor.mjs` for direct `JSON.parse` of board/ledger lines that throw.

## Tower

- Topic `tower/w2-consumer-resilience`. CLAIM from=`SAGT w2-consumer-audit`.
- Post FINDING with matrix summary. No doorbell.

## Tasks

1. Write `/Users/jrg/agent-core/briefs/tower/w2-consumer-resilience-evidence/CONSUMER-MATRIX.md`
   — columns: path | parse path | tolerate? | surfaces count? | FIXED/INHERIT/GAP | evidence.
2. Marker: `.../workers/consumer-audit.done` with matrix path + thrower count.

## Constraints

- Touch ONLY evidence under `briefs/tower/w2-consumer-resilience-evidence/`.
- No production edits. No board.jsonl rewrite.

## Report back with

Matrix path, throwers, deviations.
