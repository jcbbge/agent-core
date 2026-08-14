# AGNT vein-accept — wire CLI + acceptance gate

You are AGNT under orch-vein. Integrate vein modules, run acceptance against the oracle session sets, and prove schema-drift honesty. Do NOT use emojis. Model tier: sonnet/coder (judgment on number diffs).

## Pre-Verified Facts (ORCH verified this session)
- Tool root: `~/agent-core/primitives/tools/vein/`. Wave2 AGNTs implemented extract/classify/report modules. Scaffold left `main.zig` `dispatchScan`/`dispatchReport` as local NotImplemented — YOU wire them to `vein.scan` / `vein.report` / session resolution / csv write.
- Zig 0.16.0. Never commit. Never `agent-core sync`. Install to ~/.local/bin OUT OF SCOPE.
- Oracle: `~/agent-core/research/session-mining-verbs.md`.
- Pass-1/2 session IDs: that file §Sessions (40 IDs). Pass-3 paths: `~/agent-core/briefs/session-mining/fixtures-p3/selection.json` (20 paths). CORD verified all 60 transcripts exist on disk today.
- Reference CSV/analysis (compare, do not treat as runtime dep): `~/agent-core/briefs/session-mining/fixtures-p3/commands.csv` + `analysis.json`.
- Acceptance headlines (EXACT on counts; ±1% on bytes/ms):

Pass-1/2 (40 sessions): 2,246 calls (1,597 CC / 649 pi) · 1,988,837 result bytes · 2,080/2,246 (92.6%) rewrite-ineligible · 33 exact ≥3-repeat loops with 162 excess calls · 298 errors (274 generic / 16 syntax / 3 timeout / 3 missing-file / 2 test) · hooks 1,826 executions / 922,998 ms · afplay 312 calls / 657,476 ms (71.2% of hook time).

Pass-3 (20 sessions): 988 calls (618 CC / 370 pi) · 1,049,463 result bytes · 63 eligible / 83,181 B · 85 errors (61 generic / 14 dead-path / 5 syntax / 5 timeout) · hooks 266 executions / 161,961 ms · afplay 53 calls / 111,276 ms.

- Truth law: malformed/unknown-shape JSONL fixture → output says UNKNOWN (exit 4), never invent numbers.
- Grounding: Read between consecutive Edits to same file.

## Parallel Work Notice
You run AFTER extract/classify/report .done markers exist. No siblings in flight on vein src. Touch only your partition.

## Tower
```
cd ~/agent-core && bun ~/.tower/cli.mjs post <claim|finding|note> agent-core/latch-vein "<body>" --from agnt-vein-accept
```

## Partition (ONLY)
- `~/agent-core/primitives/tools/vein/src/main.zig`
- `~/agent-core/primitives/tools/vein/src/lib.zig` (only if wiring/exports require)
- `~/agent-core/primitives/tools/vein/build.zig` (only if test/acceptance steps need it)
- `~/agent-core/primitives/tools/vein/README.md` (acceptance how-to section)
- `~/agent-core/primitives/tools/vein/test/` (all under test/, including `test/acceptance/`)
- `~/agent-core/primitives/tools/vein/test/fixtures/schema-drift.jsonl` (create)
- Session id list files you create under `test/acceptance/` (pass12-ids.txt, pass3-paths.txt)
- `~/agent-core/briefs/fringe/latch-vein/workers/agnt-vein-accept.evidence.md`

Do NOT rewrite extract/classify/report algorithms unless a compile break forces a one-line fix — prefer board note to orch if large.

## Tasks
1. Wire `main.zig` scan/report dispatch to real modules end-to-end.
2. `zig build` and `zig build test` exit 0.
3. Build `test/acceptance/pass12-ids.txt` (40 ids) and `pass3-paths.txt` (20 paths from selection.json).
4. Run `vein scan --sessions test/acceptance/pass12-ids.txt --out test/acceptance/pass12-commands.csv` and `vein report --csv ... --out-dir test/acceptance/pass12/` (or scan+report path). Save outputs under `test/acceptance/`. Same for pass3.
5. Measure wall time for a 20-session run (pass3); must be seconds not minutes — record in evidence.
6. Schema-drift: feed `test/fixtures/schema-drift.jsonl` (garbage/unknown shape); prove UNKNOWN / exit 4.
7. Evidence file MUST include: headline number table (expected vs actual) for both passes; wall times; drift demo; zig test tails. If any exact-count miss, bisect vs Python fixtures and state the gap plainly (do not round to green).

## Done when
- Builds green; both acceptance runs saved; drift demo green; board finding with number digest; evidence file written.
- Final: `touch ~/agent-core/briefs/fringe/done/agnt-vein-accept.done`

## Report back with
Expected vs actual table; pass/fail per headline metric; wall times; paths to acceptance artifacts.
