# AGNT vein-resolve-fix — no silent skip of sessions-file entries

You are AGNT under orch-vein. Fix the truth-law hole: sessions-file entries that cannot be resolved must never be silently dropped. Do NOT use emojis. Model tier: sonnet/coder.

## Pre-Verified Facts (ORCH verified this session)

- CORD repro (confirmed by CORD; root cause confirmed by ORCH reading code):
  1. `echo 'no-such-session-id-12345' > /tmp/badid.txt && vein scan --sessions /tmp/badid.txt` → exit 0, header-only CSV (SILENT SKIP).
  2. sessions-file entry `test/fixtures/schema-drift.jsonl` (relative, file EXISTS under vein root) → exit 0, empty CSV (SILENT SKIP).
  3. Same fixture as absolute path → prints `UNKNOWN`, exit 4 (correct).
- Swallow sites (must stop swallowing):
  - `src/scan.zig` ~L72: `resolveRefWithCatalog(...) catch continue;`
  - `src/main.zig` `sessionPathDrifts` ~L159: `catch return .skip;` and `allSessionsSchemaDrift` ignores `.skip`
- `src/session.zig` `resolveRef` / `resolveRefWithCatalog`: only absolute `.jsonl` paths take the path branch; relative paths fall through to session-id catalog lookup.
- Exit codes already defined in `lib.zig`: 0 success, 2 usage, 3 io, 4 schema_unknown.
- Zig 0.16.0. Never commit. Never `agent-core sync`. Grounding: Read between consecutive Edits to the same file.
- Acceptance baselines under `test/acceptance/pass12/` and `test/acceptance/pass3/` must remain byte-identical after the fix (ORCH will re-run; you may smoke-check).

### ORCH pins (do not renegotiate)

1. **Unresolvable token → exit 3 (I/O-class)**, not exit 4. Exit 4 stays reserved for readable transcripts whose JSONL shape is UNKNOWN/schema-drift.
2. **Per-entry stderr** when a token cannot be resolved: one line naming the token, exactly:
   ```
   UNKNOWN: unresolvable session <token>
   ```
   (literal prefix `UNKNOWN: unresolvable session ` then the token as written in the sessions file). If multiple tokens fail, print one line per failure, then exit 3.
3. **Relative path honesty:** if a sessions-file entry is a relative path ending in `.jsonl` and the file exists relative to process cwd (or as an absolute path after join), resolve it like an absolute transcript path (same harness/schema path as absolute). Do not treat existing relative `.jsonl` paths as bare session ids.
4. Bare session ids that are not in the CC/pi catalog → unresolvable (stderr + exit 3). Empty/blank/comment lines remain ignored (not errors).
5. Document the pin in README under Exit codes / Truth law: unresolvable sessions-file entry = exit 3 + per-entry stderr; schema-drift of a resolved file = exit 4 + `UNKNOWN`.

## Parallel Work Notice

No siblings. Touch ONLY your partition. Do not rewrite extract/classify/report algorithms.

## Tower

```
cd ~/agent-core && bun ~/.tower/cli.mjs post <claim|finding|note> agent-core/latch-vein "<body>" --from agnt-vein-resolve-fix
```

CLAIM first. Questions → orch-vein via board note.

## Partition (ONLY)

- `~/agent-core/primitives/tools/vein/src/session.zig`
- `~/agent-core/primitives/tools/vein/src/scan.zig`
- `~/agent-core/primitives/tools/vein/src/main.zig`
- `~/agent-core/primitives/tools/vein/README.md`
- `~/agent-core/primitives/tools/vein/test/` (only if adding unit tests for resolve/unresolvable — prefer `test` blocks in session.zig)
- `~/agent-core/briefs/fringe/latch-vein/workers/agnt-vein-resolve-fix.evidence.md`

## Tasks

1. Extend `resolveRef` / `resolveRefWithCatalog` to resolve existing relative `.jsonl` paths (cwd-relative) honestly.
2. Propagate `SessionNotFound` / `InvalidSession` out of `scan.run` for `--sessions` mode; do not `continue` past unresolved tokens. Emit per-entry stderr from main (or scan via a structured error list) before exit 3.
3. Remove silent `.skip` for unresolved tokens in `sessionPathDrifts` / drift preflight — unresolved ≠ drift; unresolved must fail the run with exit 3 before inventing empty aggregates.
4. `zig build` and `zig build test` exit 0.
5. Local repro proof in evidence (from vein root /tmp as appropriate):
   - (a) bad-id → nonzero exit 3, stderr names token
   - (b) relative `test/fixtures/schema-drift.jsonl` from vein cwd → either honest resolve then exit 4 UNKNOWN, or named + nonzero (honest resolve preferred)
   - (c) note that full pass12/pass3 byte-identical re-run is ORCH's gate; smoke that a known good id still scans if cheap
6. Evidence file + board finding.

## Done when

- Fixes landed; zig build + zig build test = 0
- Repro a+b proven in evidence
- README documents exit-3 pin
- Board finding posted
- Final: `touch ~/agent-core/briefs/fringe/done/agnt-vein-resolve-fix.done`

## Report back with

Files touched; exit codes for a/b; stderr samples; any acceptance smoke notes.
