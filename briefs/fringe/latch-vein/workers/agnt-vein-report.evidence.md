# agnt-vein-report evidence

**Agent:** agnt-vein-report (vein-impl-w3)  
**Date:** 2026-08-11

## Partition touched

- `~/agent-core/primitives/tools/vein/src/report.zig` (only file edited)

## Build

```bash
cd ~/agent-core/primitives/tools/vein && /opt/homebrew/bin/zig build
# exit 0

cd ~/agent-core/primitives/tools/vein && /opt/homebrew/bin/zig build test
# 8/8 tests pass; csv round-trip test reports allocator leaks (sibling csv.zig — out of partition)
```

## Algorithm parity (Python → Zig)

| Report | Python source | Zig entry |
|---|---|---|
| `verbs.md` | `analyze.metric_table` | `metricTable` — groups by `commandKey` (verb or `verb subcommand`), score = calls × median result bytes, eligible filter on compound/pipe/heredoc/substitution/machine_format |
| `retries.md` | `analyze.retry_loops` | `retryLoops` — exact loops on `(harness, session_id, command_norm_sha256)` ≥3; near loops on `familySimple(command_safe)` with >1 hash; excess = sum(repeats−1) for exact loops |
| `failures.md` | `deep_scan.failure_category` + `failure_catalog` | `failureCategory` regex chain; re-scan CC/pi transcripts for error `call_id`s when `source_path` set; oracle labels via `oracleLabel` |
| `hooks.md` | `deep_scan.scan_cc` hookInfos | Full CC JSONL scan per unique `source_path`; `hookLabel`; afplay + Tower-labelled rollup |

## Output shapes

All under `--out-dir`:

1. **verbs.md** — headline counts + markdown table (Rank, Command, Calls, Total B, Median B, Score, Eligible)
2. **retries.md** — exact loop count, excess calls, loop table (kind exact|near)
3. **hooks.md** — CC hook totals, afplay/Tower summary, per-command table; pi section documents **UNKNOWN**
4. **failures.md** — error count + oracle-label category table

## Synthetic smoke (unit test)

Three identical `ls` rows (`command_norm_sha256=same`) → 1 exact loop, excess 2.

Two `echo` rows (100 B + 200 B) → one command group, median 150, score 300.

`fromRows` on one error row writes all four files under `/tmp/vein-report-test`.

## Pi hooks

**UNKNOWN** — `scan_pi` in oracle/deep_scan does not collect hook metrics; `hooks.md` states this explicitly.

## Integration note

- `report.run` / `fromRows` implemented; `main.zig` `dispatchReport` still stub (sibling wiring).
- Fixture `commands.csv` lacks `source_path` column; hook/failure re-scan requires extract to populate it. Pass-3 `selection.json` paths are joinable by `(harness, session_id)` when extract lands.

## Headline numbers

Not validated against full pass-1/2 corpus in this session (extract/csv sibling). Algorithms ported for ORCH acceptance gate.
