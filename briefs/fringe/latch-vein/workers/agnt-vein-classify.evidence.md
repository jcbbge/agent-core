# agnt-vein-classify evidence

**Agent:** agnt-vein-classify  
**Date:** 2026-08-11

## Files touched (partition)

- `~/agent-core/primitives/tools/vein/src/classify.zig` — full port of mining_common classify/redact/result_metrics/exit_code_from/makeRow
- `~/agent-core/primitives/tools/vein/src/csv.zig` — FIELDS-ordered CSV read/write + tests

## Compile-only unblocks (parallel siblings; not feature work)

Shared `zig build` was blocked by Zig 0.16 lint errors in sibling stubs while extract/report landed. Minimal fixes applied so classify integration could compile:

- `extract_pi.zig` — valid `if (classify…)|…|` syntax + `sha256Hex` export usage
- `extract_cc.zig`, `schema.zig`, `session.zig`, `report.zig` — const/unused-var lint only

## Parity vs `mining_common.py`

| Area | Status | Notes |
|------|--------|-------|
| env/sudo prefix stripping | match | Including Python quirk: `sudo -u root ls` → first_token `root` |
| subcommand verbs + git option skip | match | GIT_OPTIONS_WITH_VALUE skip-next |
| bun `[script]` | match | Non-subcommand bun arg → `[script]` |
| compound / pipe / heredoc / substitution | match | Regex semantics replicated with byte scans |
| machine_format | match | Exact token match for MACHINE_FLAGS |
| command_norm_sha256 | match | Whitespace-normalized SHA-256 hex |
| redact | close | Manual scanners for 3 SECRET_PATTERNS; case-insensitive key=value and Bearer |
| result_metrics | match | bytes/lines/nonempty/unique/max_line/sha256 |
| exit_code_from | match | Structured keys + 3 text patterns |
| makeRow | match | Row fill for extract callers |

**Deliberate divergence:** redact uses hand-rolled scanners instead of Python `re`; behavior aligned on fixture spot-checks (`API_KEY=…`, `Bearer …`, prefixed secrets). Complex regex edge cases may differ — report any found during integration.

## Tests

```
cd ~/agent-core/primitives/tools/vein && /opt/homebrew/bin/zig build test
# exit 0
```

Test blocks in partition files:

- `classify.test.env and sudo stripping matches python semantics`
- `classify.test.bun script subcommand`
- `classify.test.compound pipe heredoc substitution machine_format flags`
- `classify.test.redact secret patterns`
- `classify.test.result metrics and exit code parsing`
- `csv.test.field_names order is stable`
- `csv.test.csv round trip preserves row fields`
- `csv.test.csv bool and optional field formatting`

## Build

```
cd ~/agent-core/primitives/tools/vein && /opt/homebrew/bin/zig build
# exit 0
```

## Public API for extract

- `classify.classify(allocator, command) !ClassifyResult`
- `classify.redact(allocator, command) ![]const u8`
- `classify.resultMetrics(allocator, result) !ResultMetrics`
- `classify.exitCodeFrom(result, structured) ?i32`
- `classify.makeRow(allocator, harness, batch, selected, call_id, ordinal, command, result, exit_code, is_error, result_missing, cwd) !Row`
- `classify.sha256Hex(allocator, data) ![]const u8`
- `csv.writeRows(writer, rows)`, `csv.readRows(allocator, content)`, `csv.freeRows`
