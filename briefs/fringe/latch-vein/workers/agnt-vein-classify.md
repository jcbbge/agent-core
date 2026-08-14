# AGNT vein-classify — command classify + commands.csv

You are AGNT under orch-vein. Port mining_common classification and CSV I/O into **vein**. Do NOT use emojis. Model tier: sonnet/coder.

## Pre-Verified Facts (ORCH verified this session)
- Scaffold at `~/agent-core/primitives/tools/vein/` with Row type in `lib.zig`. Keep that Row's field set aligned with mining_common.FIELDS:
  `harness, batch, session_id, cwd, project_key, source_path, call_id, ordinal, command, command_safe, command_sha256, command_norm_sha256, first_token, verb, subcommand, compound, pipe, heredoc, substitution, machine_format, result_bytes, result_lines, result_nonempty_lines, result_unique_lines, result_max_line_bytes, result_sha256, exit_code, is_error, result_missing`
- Port faithfully from `~/agent-core/briefs/session-mining/fixtures-p3/mining_common.py` — classify(), redact(), result_metrics(), exit_code_from(), make_row(), FIELDS, SUBCOMMAND_VERBS, MACHINE_FLAGS, BUN_SUBCOMMANDS, GIT_OPTIONS_WITH_VALUE, SECRET_PATTERNS.
- Rewrite-eligible = NOT (compound|pipe|heredoc|substitution|machine_format) — used by reports; your flags must match Python regex semantics as closely as Zig allows (document any deliberate divergence in evidence).
- Zig 0.16.0, stdlib only. Grounding hook: Read between consecutive Edits to same file.
- Never commit. Never load raw multi-MB transcripts into chat.

## Parallel Work Notice
Siblings: agnt-vein-extract (schema/session/scan/extract_*), agnt-vein-report (report.zig). Touch ONLY your partition. Do not edit lib.zig/main.zig/build.zig unless a board note from orch-vein authorizes a Row-field fix (prefer fixing inside classify by adapting).

## Tower
```
cd ~/agent-core && bun ~/.tower/cli.mjs post <claim|finding|note> agent-core/latch-vein "<body>" --from agnt-vein-classify
```

## Partition (ONLY)
- `~/agent-core/primitives/tools/vein/src/classify.zig`
- `~/agent-core/primitives/tools/vein/src/csv.zig`
- `~/agent-core/briefs/fringe/latch-vein/workers/agnt-vein-classify.evidence.md`

## Tasks
1. Implement classify + redact + sha256 hashing + result_metrics + exit_code_from parity with mining_common.py.
2. csv.zig: write header+rows and read back; column order EXACTLY FIELDS.
3. Export a `makeRow(...)` (or fillClassifyFields) that extract can call.
4. Prove with `zig build` exit 0. Prefer `test` blocks inside your two files covering: env/sudo stripping, bun [script], compound/pipe/heredoc/substitution/machine_format detection, redact patterns.
5. Evidence: paste test names + zig build test output if your tests are picked up; else zig build + a tiny programmatic check via `zig test` on the module if scaffold wires it.

## Done when
- Real (non-stub) classify+csv; `zig build` exits 0.
- Board finding + evidence file.
- Final: `touch ~/agent-core/briefs/fringe/done/agnt-vein-classify.done`

## Report back with
Parity notes vs Python; test evidence; files touched.
