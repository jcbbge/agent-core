# CONSUMER-MATRIX — w2-consumer-resilience audit
# 2026-08-13 · collected by ORCH from SAGT headless report (w2Y:p1C) · live board bad_line_count=26
# ORCH spot-check: 40-tower-bridge json.loads + except continue at lines 225-226 confirmed this session.

| path | parse path | tolerate? | surfaces count? | FIXED/INHERIT/GAP | evidence |
|------|------------|-----------|-----------------|-------------------|----------|
| `herdr-spine/bin/handlers/40-tower-bridge` | `scan_ledger_tail()` → `json.loads(line)` per ledger tail line | yes (`try/except continue`) | no | **FIXED** (local tolerate; no lib import) | lines 225-226 |
| `herdr-spine/bin/handlers/10-notify` | write-only `board_append` — no board/ledger read | n/a | n/a | **GAP-write-only** | append via `_spine_common` |
| `primitives/mcps/tower/hooks/session-start.mjs` | `inboxState` via `../lib.mjs` | yes | no | **INHERIT** | |
| `primitives/mcps/tower/hooks/stop-guard.mjs` | `inboxState` via `../lib.mjs` | yes | no | **INHERIT** | |
| `primitives/mcps/tower/hooks/prompt-inject.mjs` | `inboxState` via `../lib.mjs` | yes | no | **INHERIT** | |
| `primitives/mcps/tower/hooks/ask-bridge.mjs` | `inboxState` for answered refs | yes | no | **INHERIT** | other JSON.parse = non-board |
| `primitives/mcps/tower/hooks/flight-recorder.mjs` | shim → canonical | yes | no | **INHERIT** | |
| `primitives/mcps/tower/hooks/stop-verdict.mjs` | hook stdin + agent transcript JSONL | yes | n/a | **N/A-out-of-scope** | |
| `primitives/mcps/tower/hooks/odometer-stop.mjs` | agent transcript → ODOMETER | yes | n/a | **N/A-out-of-scope** | |
| `primitives/mcps/tower/hooks/odometer.mjs` | hook stdin; append odometer | n/a | n/a | **N/A-write-only** | |
| `primitives/mcps/tower/hooks/enforce-brief.mjs` | hook stdin | yes | n/a | **N/A-out-of-scope** | |
| `primitives/mcps/tower/hooks/deposit-reminder.mjs` | hook stdin | yes | n/a | **N/A-out-of-scope** | |
| `primitives/hooks/flight-recorder.mjs` | `inboxState` via tower-ledger | yes | no | **INHERIT** | |
| `primitives/hooks/session-capture-cursor.mjs` | `inboxState` via tower-ledger | yes | no | **INHERIT** | |
| `primitives/tools/statem/twr.ts` | `boardFor`/`readAll` + sig last-line parse | yes | no | **INHERIT + GAP-count-only** | |
| `primitives/tools/statem/statem.ts` | write-only board append | n/a | n/a | **GAP-write-only** | |

## Core (canonical)

| path | parse path | tolerate? | surfaces count? | FIXED/INHERIT/GAP | evidence |
|------|------------|-----------|-----------------|-------------------|----------|
| `primitives/hooks/tower-ledger.mjs` | `parseJsonl` / `readJsonlStats` | yes | yes (`bad_line_count`) | **FIXED** (bus-data land 3e2e108) | |
| `primitives/mcps/tower/cli.mjs` | `readJsonlStats(BOARD)` on status+board | yes | yes (`integrity:` line) | **FIXED** | live bad_line_count=26 |

## Thrower tally

**throwers = 0**
