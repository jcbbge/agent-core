# agnt-vein-accept evidence

Date: 2026-08-11  
Worker: vein-accept-w1  
Tool: `~/agent-core/primitives/tools/vein/`

## Root fixes (this session)

1. **`io_ctx.readLineInto`**: replaced `streamDelimiter` (does not consume delimiter → infinite loop on JSONL) with `takeDelimiter` + `streamDelimiterLimit` fallback for lines >64KiB.
2. **Schema probe**: first-line `mode`/`session` rows no longer skip CC transcripts; drift uses `transcriptHasValidShape` (any valid line) and unknown-harness paths try both shapes.
3. **`session.resolveRefWithCatalog`**: cached in `allSessionsSchemaDrift` (avoid N× `discoverAll`).
4. **CSV read**: multiline quoted fields via record-boundary parser in `csv.readRows` (not physical line splits).
5. **`io_ctx.openAbs/createAbs`**: relative paths resolve against cwd (CLI acceptance paths work).
6. **`failureCategory`**: classify full result text (removed 8KiB truncate); dead-path at byte 10015 no longer missed when `timeout` substring appears earlier in test output.

## Wall times

| Run | Wall (s) |
|-----|----------|
| CC single id `6a214495-…` scan → 431 rows | 0.26 |
| pass12 scan (40 ids) | 0.31 |
| pass3 scan (20 paths) | 0.08 |
| pass12 report | 0.21 |
| pass3 report | 0.24 |
| schema-drift fixture | instant, exit 4 + `UNKNOWN` |

## Headline table — Pass-1/2 (40 sessions)

| Metric | Oracle | Actual | Match |
|--------|--------|--------|-------|
| Total calls | 2,246 | 2,246 | PASS |
| CC calls | 1,597 | 1,597 | PASS |
| pi calls | 649 | 649 | PASS |
| Result bytes | 1,988,837 | 1,988,837 | PASS |
| Rewrite-ineligible | 2,080/2,246 (92.6%) | 2,080/2,246 (166 eligible) | PASS |
| Exact ≥3-repeat loops | 33 | 33 | PASS |
| Loop excess calls | 162 | 162 | PASS |
| Errors | 298 | 298 | PASS |
| generic / syntax / missing-file / timeout / test | 274 / 16 / 3 / 3 / 2 | 274 / 16 / 3 / 3 / 2 | PASS |
| Hook executions | 1,826 | 1,826 | PASS |
| Hook duration ms | 922,998 | 922,998 | PASS |
| afplay calls / ms | 312 / 657,476 | 312 / 657,476 | PASS |
| afplay % hook time | 71.2% | 71.2% | PASS |

Artifacts: `test/acceptance/pass12-commands.csv`, `test/acceptance/pass12/{verbs,retries,hooks,failures}.md`

Note: 34 distinct `session_id` values in CSV (pi filenames store UUID suffix only); 6 listed pi sessions had 0 bash calls — call totals still exact.

## Headline table — Pass-3 (20 sessions)

| Metric | Oracle | Actual | Match |
|--------|--------|--------|-------|
| Total calls | 988 | 988 | PASS |
| CC / pi | 618 / 370 | 618 / 370 | PASS |
| Result bytes | 1,049,463 | 1,049,463 | PASS |
| Eligible calls / bytes | 63 / 83,181 B | 63 / 83,181 B | PASS |
| Errors | 85 | 85 | PASS |
| generic / dead-path / syntax / timeout | 61 / 14 / 5 / 5 | 61 / 14 / 5 / 5 | PASS |
| Hook executions / ms | 266 / 161,961 | 266 / 161,961 | PASS |
| afplay calls / ms | 53 / 111,276 | 53 / 111,276 | PASS |

Artifacts: `test/acceptance/pass3-commands.csv`, `test/acceptance/pass3/{verbs,retries,hooks,failures}.md`

## Schema drift

```
./zig-out/bin/vein scan --sessions test/acceptance/drift-sessions.txt --out /tmp/x.csv
→ prints UNKNOWN, exit 4
```

Fixture: `test/fixtures/schema-drift.jsonl`

## Build / test

```
cd ~/agent-core/primitives/tools/vein && zig build && zig build test
→ exit 0
```

Scan integration test bound to tiny fixtures (`test/fixtures/cc-mini.jsonl`, `pi-mini.jsonl`) — no live 6.4MB transcripts in `zig test`.

## Digest

**PASS-12: GREEN** (all exact headline counts)  
**PASS-3: GREEN** (all exact headline counts including error subcategories)  
**DRIFT: GREEN**  
**PERF: GREEN** (sub-second scans, reports)
