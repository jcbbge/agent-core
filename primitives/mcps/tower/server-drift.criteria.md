# Test criteria — tower-server-drift / reconcile ~/.tower/server.mjs

Authored by test-maker from plan only (brief TASK section + install.sh contract +
TOWER-AUTO-CC CC4). Each assert maps to an acceptance criterion.

## Drift resolution (done-when #1)

| Assert name | Criterion |
|-------------|-----------|
| `install.sh emits no drift warning` | Re-run `~/herdr-spine/install.sh`; stderr/stdout must NOT contain `drift; NOT overwriting` |
| `install.sh reports relay_inbox reconciled` | Output contains `tower server.mjs already carries relay_inbox (identical).` OR a fresh install success line |

## SHA reconciliation (mission #3)

| Assert name | Criterion |
|-------------|-----------|
| `live server.mjs byte-identical to canonical` | `cmp -s` between `~/.tower/server.mjs` and `~/herdr-spine/cc-hooks/server.mjs` |
| `canonical server.mjs present for install.sh parity` | `~/herdr-spine/cc-hooks/server.mjs` exists (install.sh canonical source) |

## Backup (mission #4)

| Assert name | Criterion |
|-------------|-----------|
| `pre-edit backup exists on disk` | `~/.tower/server.mjs.bak-20260812` is a regular file |

## Regression suite (mission verify + done-when #2)

| Assert name | Criterion |
|-------------|-----------|
| `cli.test.mjs all green` | `bun ~/.tower/cli.test.mjs` exits 0 (26 tests per brief) |

## MCP stdio smoke (mission verify)

| Assert name | Criterion |
|-------------|-----------|
| `MCP initialize succeeds` | Spawn `bun ~/.tower/server.mjs` stdio; `initialize` returns JSON-RPC result |
| `tools/list registers relay_inbox` | `tools/list` tool names include `relay_inbox` |

## relay_inbox behavior (TOWER-AUTO-CC CC4 — behavioral fixes preserved)

| Assert name | Criterion |
|-------------|-----------|
| `relay_inbox empty inbox message` | `tools/call relay_inbox` on scratch cwd with no traffic returns the clear-inbox string from spec |
| `relay_inbox render+ack in one call` | Seed one operator deliverable in scratch scope; single `relay_inbox` call renders it verbatim and appends exactly one ack row for that id |

## Board findings (done-when #2)

| Assert name | Criterion |
|-------------|-----------|
| `tower/server-drift board topic has finding` | `board.jsonl` contains at least one row with `topic: tower/server-drift` and non-empty body |

## Human-only (done-when #3)

| Item | Criterion |
|------|-----------|
| `report-back drift narrative` | Implementer documents what drift was, who added what, when — see `server-drift.qa.md` |

## Run command (tester, not test-maker)

```bash
bun ~/.tower/server-drift.test.mjs
```
