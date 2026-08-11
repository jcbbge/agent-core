# AGNT vein-extract — JSONL scan + CC/pi pairing

You are AGNT under orch-vein. Implement real transcript extraction for **vein**. Do NOT use emojis. Model tier: sonnet/coder.

## Pre-Verified Facts (ORCH verified this session)
- Scaffold landed at `~/agent-core/primitives/tools/vein/` with compiling stubs. Read `src/lib.zig` Row type and stub signatures BEFORE editing; keep public APIs stable so classify/report compile.
- Zig 0.16.0. stdlib only. macOS arm64.
- Port (do not call at runtime) from:
  - `~/agent-core/briefs/session-mining/fixtures-p3/extract_cc.py`
  - `~/agent-core/briefs/session-mining/fixtures-p3/extract_pi.py`
  - `mining_common.text_content` / `exit_code_from` usage in those files
- Pairing rules (binding):
  - CC: assistant `tool_use` items named `Bash` ↔ `tool_result.tool_use_id`
  - pi: assistant `toolCall` items named `bash` ↔ `toolResult.toolCallId` (role `toolResult`, toolName `bash`)
- Session roots: CC `~/.claude/projects/*/*.jsonl`; pi `~/.pi/agent/sessions/*/*.jsonl`. Skip `private-tmp`.
- Sample paths exist (verified):
  - CC: `/Users/jrg/.claude/projects/-Users-jrg-future/6a214495-e55e-4441-9e0e-634f410f7d96.jsonl`
  - pi: `/Users/jrg/.pi/agent/sessions/--Users-jrg-agent-core--/2026-08-11T18-15-57-199Z_019ff209-d00f-7e0f-ad9a-9203e17710b4.jsonl`
- Schema-tolerant via field-path config in `schema.zig` — on drift return SchemaDrift / surface UNKNOWN upstream; never invent call counts.
- Grounding hook: consecutive Edits to one file need a fresh Read between them.
- Never commit. Never `agent-core sync`. Do not load whole multi-MB transcripts into chat context — stream in Zig; for manual peek use `head -c` only.

## Parallel Work Notice
Siblings: agnt-vein-classify (classify.zig, csv.zig), agnt-vein-report (report.zig). Ignore their edits. Touch ONLY your partition. If you need a shared type change, post a board note to orch-vein and stop — do not edit lib.zig/main.zig/build.zig.

## Tower
```
cd ~/agent-core && bun ~/.tower/cli.mjs post <claim|finding|note> agent-core/latch-vein "<body>" --from agnt-vein-extract
```

## Partition (ONLY)
- `~/agent-core/primitives/tools/vein/src/schema.zig`
- `~/agent-core/primitives/tools/vein/src/session.zig`
- `~/agent-core/primitives/tools/vein/src/scan.zig`
- `~/agent-core/primitives/tools/vein/src/extract_cc.zig`
- `~/agent-core/primitives/tools/vein/src/extract_pi.zig`
- `~/agent-core/briefs/fringe/latch-vein/workers/agnt-vein-extract.evidence.md`

## Tasks
1. Implement field-path schema for CC + pi shapes; malformed/unknown → SchemaDrift (no silent skip that looks like zero calls without a marker).
2. `session.zig`: resolve id→path under both roots; `--last N` by mtime metadata only.
3. `extract_cc.zig` / `extract_pi.zig`: faithful port of Python extractors (cwd tracking, result text, is_error, missing result).
4. `scan.zig`: stream sessions → rows; call classify/csv via existing lib hooks if already wired by stubs (use classify.makeRow if present; else fill Row fields you own and leave classify fields for sibling — prefer calling `classify` module functions if the stub exports them).
5. Unit-testable: add tests ONLY if they fit inside your files as `test` blocks; do not edit `test/` dir (owned later). Prove with `zig build` exit 0.
6. Evidence: show extract call counts on the two sample sessions above (run vein scan against a 2-line sessions file you write under `/tmp/vein-extract-sessions.txt` — temp OK, not in partition). Compare roughly to Python extractor behavior (order-of-magnitude / non-zero).

## Done when
- `zig build` exits 0 from vein root.
- Real extraction works for both sample sessions (non-stub).
- Board finding + evidence file.
- Final: `touch ~/agent-core/briefs/fringe/done/agnt-vein-extract.done`

## Report back with
Files touched; sample session call counts; any SchemaDrift decisions; zig build tail.
