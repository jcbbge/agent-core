# AGNT vein-scaffold — project skeleton + CLI pin

You are AGNT under orch-vein. Build the Zig project skeleton for **vein** so sibling AGNTs can fill modules in parallel. Do NOT use emojis anywhere. Model tier: sonnet/coder.

## Pre-Verified Facts (ORCH verified this session)
- Zig **0.16.0** at `/opt/homebrew/bin/zig` (`zig version`).
- Layout precedent: `~/agent-core/primitives/tools/slim/` = `build.zig` + `src/` + `test/` + `README.md` + `zig-out/`. Copy that shape; macOS arm64 only; stdlib only; zero third-party deps.
- slim `build.zig` pattern (createModule + addExecutable + addTest on lib_mod) — read it before writing yours.
- Tool root (create): `~/agent-core/primitives/tools/vein/` — does NOT exist yet.
- Truth law (tombstone): schema drift / unknown JSONL shape → emit `UNKNOWN`, never invent numbers. Reference style: `~/agent-core/briefs/rtk-clone/spec.md` §0.
- Design: `~/agent-core/research/fringe-tooling-brainstorm.md` §4.4; acceptance oracle tables: `~/agent-core/research/session-mining-verbs.md` (read Method + Sessions + Optimization + Pass 3 headlines — do NOT load raw transcript bodies into context).
- Reference Python (port later by siblings; you only stub): `~/agent-core/briefs/session-mining/fixtures-p3/{extract_cc,extract_pi,mining_common,analyze,deep_scan,failure_catalog}.py`.
- `agent-core sync` FORBIDDEN. Never commit. Grounding hook: consecutive Edits to one file need a fresh Read between them.

### CLI pin (ORCH decided — do not renegotiate)
```
vein scan --sessions <path> [--out <commands.csv>]
vein scan --last N [--out <commands.csv>]
vein report --sessions <path> [--out-dir <dir>]
vein report --last N [--out-dir <dir>]
vein report --csv <commands.csv> [--out-dir <dir>]
```
- `--sessions <path>`: text file, one session id OR absolute transcript path per line (`#` comments / blank lines ignored).
- `--last N`: metadata-first select newest N transcripts across CC (`~/.claude/projects/*/*.jsonl`) + pi (`~/.pi/agent/sessions/*/*.jsonl`) by mtime, excluding `private-tmp`; never load raw bodies into agent context (tool may stream files).
- `scan` writes `commands.csv` with EXACT columns from session-mining-verbs.md §Method / mining_common.FIELDS.
- `report` emits four files under out-dir: `verbs.md`, `retries.md`, `hooks.md`, `failures.md` (markdown tables; content shape matching the oracle reports).
- Exit codes: 0 success; 2 usage/args; 3 I/O; 4 schema-UNKNOWN (scan/report refused to invent aggregates). Distinct — never collapse.

### Module contract (stubs you create; siblings replace bodies)
Create these files with the signatures below (or equivalent Zig 0.16 that compiles). Bodies may `return error.NotImplemented` EXCEPT main CLI parse/dispatch and build wiring which must work.

| File | Responsibility |
|---|---|
| `src/schema.zig` | Field-path config for CC/pi shapes; `SchemaDrift` error; UNKNOWN helpers |
| `src/session.zig` | Resolve session id → path; `--last N` metadata selection |
| `src/scan.zig` | Stream JSONL; dispatch CC vs pi extractors; produce rows |
| `src/extract_cc.zig` | Pair `tool_use` name `Bash` → `tool_result.tool_use_id` |
| `src/extract_pi.zig` | Pair `toolCall` name `bash` → `toolResult.toolCallId` |
| `src/classify.zig` | Port mining_common.classify + redact + result_metrics + exit_code_from |
| `src/csv.zig` | Write/read commands.csv with exact FIELDS order |
| `src/report.zig` | Four reports from rows (+ hook re-scan as needed) |
| `src/lib.zig` | Re-exports / shared Row type |
| `src/main.zig` | Arg parse + dispatch scan/report |
| `test/smoke.zig` or tests in lib | At least one test that `zig build test` runs |

`lib.zig` must define a shared `Row` (or equivalent) covering all CSV fields as typed Zig fields.

## Parallel Work Notice
Siblings (wave 2, after your .done): agnt-vein-extract, agnt-vein-classify, agnt-vein-report. They will replace stub bodies in their partitions. Ignore any other latch-vein / fringe work. Touch ONLY your partition.

## Tower
```
cd ~/agent-core && bun ~/.tower/cli.mjs post <claim|finding|note> agent-core/latch-vein "<body>" --from agnt-vein-scaffold
```
CLAIM first. Questions → orch-vein via board note. Never operator.

## Partition (ONLY these paths)
- `~/agent-core/primitives/tools/vein/build.zig`
- `~/agent-core/primitives/tools/vein/README.md`
- `~/agent-core/primitives/tools/vein/src/main.zig`
- `~/agent-core/primitives/tools/vein/src/lib.zig`
- `~/agent-core/primitives/tools/vein/src/schema.zig` (stub OK)
- `~/agent-core/primitives/tools/vein/src/session.zig` (stub OK)
- `~/agent-core/primitives/tools/vein/src/scan.zig` (stub OK)
- `~/agent-core/primitives/tools/vein/src/extract_cc.zig` (stub OK)
- `~/agent-core/primitives/tools/vein/src/extract_pi.zig` (stub OK)
- `~/agent-core/primitives/tools/vein/src/classify.zig` (stub OK)
- `~/agent-core/primitives/tools/vein/src/csv.zig` (stub OK)
- `~/agent-core/primitives/tools/vein/src/report.zig` (stub OK)
- `~/agent-core/primitives/tools/vein/test/` (minimal smoke only)
- `~/agent-core/briefs/fringe/latch-vein/workers/agnt-vein-scaffold.evidence.md`

Do NOT implement real extraction/classification/report logic — stubs only. Do NOT create `test/acceptance/` yet.

## Tasks
1. Create vein tree mirroring slim; `build.zig` names the binary `vein`.
2. Implement real CLI parse for the pinned verbs/flags (help text OK); dispatch to stub functions.
3. Stub every module so `zig build` and `zig build test` exit 0.
4. README: purpose, CLI, truth-law UNKNOWN rule, pointer to session-mining-verbs.md as oracle.
5. Evidence file with exact `zig build` / `zig build test` tails.

## Constraints
- No commits. No install to `~/.local/bin`. No mocks of filesystem for the smoke test beyond tiny in-tree fixtures if needed.
- Do not load large transcript bodies into your context; metadata / head only if you inspect.

## Done when
- `cd ~/agent-core/primitives/tools/vein && zig build && zig build test` both exit 0.
- All partition files exist; CLI `--help` or bare `vein` prints usage (exit 2 OK for bare).
- Board finding with build evidence.
- Final action: `touch ~/agent-core/briefs/fringe/done/agnt-vein-scaffold.done`

## Report back with
List every file created; zig build/test exit codes; any deviation from the CLI pin (should be none).
