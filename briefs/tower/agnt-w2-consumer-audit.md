# AGNT [w2-consumer-audit] — Consumer matrix (forced completion)

Do NOT use emojis. Prior SAGT researcher panes went idle without writing evidence. You MUST write the matrix file before idle.

## Pre-Verified Facts (ORCH verified)

1. Core tolerate+count: `readJsonlStats` / `parseJsonl` on main; `cli board` + (coder) `cli status` show `integrity: 26…`.
2. `twr.ts` uses `~/.tower/lib.mjs` `boardFor`/`readAll` → INHERIT.
3. Paths to audit (grep for JSON.parse of board/ledger lines):
   - `/Users/jrg/herdr-spine/bin/handlers/40-tower-bridge`
   - `/Users/jrg/herdr-spine/bin/handlers/10-notify`
   - `/Users/jrg/agent-core/primitives/mcps/tower/hooks/*.mjs`
   - `/Users/jrg/agent-core/primitives/hooks/flight-recorder.mjs`
   - `/Users/jrg/agent-core/primitives/hooks/session-capture-cursor.mjs`
   - `/Users/jrg/agent-core/primitives/tools/statem/{twr,statem}.ts`

## Tower

- CLAIM `tower/w2-consumer-resilience` from=`AGNT w2-consumer-audit`.
- FINDING with thrower count.

## Tasks

1. Write `/Users/jrg/agent-core/briefs/tower/w2-consumer-resilience-evidence/CONSUMER-MATRIX.md` with every path above.
2. Marker `.../workers/consumer-audit.done` — **first line must be** `MATRIX_OK` then path.

## Constraints

- Evidence files only. No production edits.

## Report back with

Matrix path + throwers.
