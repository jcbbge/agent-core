# vein

Session transcript mining CLI for Claude Code and pi JSONL corpora (Zig 0.16.0, macOS arm64, stdlib only).

## Build

```bash
cd ~/agent-core/primitives/tools/vein
/opt/homebrew/bin/zig build
/opt/homebrew/bin/zig build test
```

Binary: `zig-out/bin/vein`

## CLI

```
vein scan --sessions <path> [--out <commands.csv>]
vein scan --last N [--out <commands.csv>]
vein report --sessions <path> [--out-dir <dir>]
vein report --last N [--out-dir <dir>]
vein report --csv <commands.csv> [--out-dir <dir>]
```

- `--sessions <path>`: text file, one session id, absolute transcript path, or cwd-relative `.jsonl` path per line (`#` comments and blank lines ignored).
- `--last N`: metadata-first select newest N transcripts across CC (`~/.claude/projects/*/*.jsonl`) and pi (`~/.pi/agent/sessions/*/*.jsonl`) by mtime, excluding `private-tmp`.
- `scan` writes `commands.csv` with columns defined in the oracle (see below).
- `report` emits four files under out-dir: `verbs.md`, `retries.md`, `hooks.md`, `failures.md`.

Exit codes: `0` success; `2` usage/args; `3` I/O (includes unresolvable sessions-file entries); `4` schema-UNKNOWN (scan/report refused to invent aggregates). Distinct — never collapsed.

## Truth law

Schema drift or unknown JSONL shape on a **resolved** transcript → emit literal `UNKNOWN`, exit `4` — never invent numbers.

Unresolvable sessions-file entry (unknown session id, missing `.jsonl` path, token not in CC/pi catalog) → one stderr line per token:

```
UNKNOWN: unresolvable session <token>
```

(exact prefix, token as written in the sessions file), then exit `3`. Blank lines and `#` comments are ignored, not errors.

See `~/agent-core/briefs/rtk-clone/spec.md` section 0 for reference style.

## Oracle

Acceptance tables and CSV schema: `~/agent-core/research/session-mining-verbs.md` (Method section).

Design context: `~/agent-core/research/fringe-tooling-brainstorm.md` section 4.4.

## Status

Scaffold only — module stubs return `NotImplemented`; sibling AGNTs fill extraction, classification, and report bodies.
