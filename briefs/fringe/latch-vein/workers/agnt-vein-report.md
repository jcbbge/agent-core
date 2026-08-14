# AGNT vein-report — four standard reports

You are AGNT under orch-vein. Implement the four vein reports. Do NOT use emojis. Model tier: sonnet/coder.

## Pre-Verified Facts (ORCH verified this session)
- Oracle: `~/agent-core/research/session-mining-verbs.md` — verb tables, retry loops (§Optimization 1), failure classes (§Optimization 3 + Pass 3 Failure catalog), hook ledger (§Optimization 4 + Pass 3 Hooks).
- Port algorithms from:
  - `~/agent-core/briefs/session-mining/fixtures-p3/analyze.py` (metric_table, retry_loops, family)
  - `~/agent-core/briefs/session-mining/fixtures-p3/deep_scan.py` (hook_metrics via scan_cc system/hookInfos; failure_category)
  - `~/agent-core/briefs/session-mining/fixtures-p3/failure_catalog.py` (category aggregation)
- Report outputs (filenames pinned by orch): `verbs.md`, `retries.md`, `hooks.md`, `failures.md` under `--out-dir`.
- Headline numbers you must eventually support (acceptance AGNT/ORCH will gate — your job is algorithmic fidelity):
  - Pass-1/2: 2246 calls; 2080/2246 rewrite-ineligible; 33 exact ≥3-repeat loops / 162 excess; 298 errors (274 generic / 16 syntax / 3 timeout / 3 missing-file / 2 test); hooks 1826 exec / 922998 ms; afplay 312 / 657476 ms (71.2%).
  - Pass-3: 988 calls; 63 eligible; 85 errors (61 generic / 14 dead-path / 5 syntax / 5 timeout); hooks 266 / 161961 ms; afplay 53 / 111276 ms.
- Hook scan is CC-oriented (system rows + hookInfos durationMs) as in deep_scan.scan_cc; pi hook path: follow deep_scan.scan_pi if present, else document UNKNOWN for pi hooks.
- Scaffold stubs in `src/report.zig`. Zig 0.16.0. Never commit. Grounding: Read between consecutive Edits same file.

## Parallel Work Notice
Siblings own extract_* and classify/csv. Touch ONLY report.zig (and only add helper files under src/ if named `src/report_*.zig` — prefer single report.zig unless file exceeds ~500 LOC). Do not edit build.zig/main.zig/lib.zig.

## Tower
```
cd ~/agent-core && bun ~/.tower/cli.mjs post <claim|finding|note> agent-core/latch-vein "<body>" --from agnt-vein-report
```

## Partition (ONLY)
- `~/agent-core/primitives/tools/vein/src/report.zig`
- Optional helpers: `~/agent-core/primitives/tools/vein/src/report_hooks.zig`, `report_retry.zig`, `report_fail.zig` (only if needed; list in evidence)
- `~/agent-core/briefs/fringe/latch-vein/workers/agnt-vein-report.evidence.md`

If you add helper files, you MUST also note on the board so orch can update build.zig imports — prefer keeping everything in report.zig imported from lib already.

## Tasks
1. From rows (+ optional CSV path): emit verbs table ranked by calls × median result bytes (analyze.metric_table).
2. Exact ≥3-repeat loops + near families (analyze.retry_loops); report loop count and excess calls (total calls in exact loops minus one per loop).
3. Failure classes via failure_category regexes; map names to oracle labels (generic / syntax / timeout / missing-file|dead-path / test).
4. Hook-time ledger: re-scan source_path for CC hookInfos; sum durationMs; break out afplay and Tower-labelled commands like the oracle.
5. Wire `report` entrypoint expected by main/lib stubs.
6. `zig build` exits 0.

## Done when
- Non-stub reports; zig build 0; board finding + evidence describing output shape with a tiny synthetic rows example if full corpus not yet available from extract.
- Final: `touch ~/agent-core/briefs/fringe/done/agnt-vein-report.done`

## Report back with
Algorithm parity notes; output file shapes; zig build tail; any UNKNOWN for pi hooks.
