---
name: vein
description: Session transcript corpus miner for Claude Code and pi JSONL transcripts. Reproduces the session-mining studies in seconds - the acceptance instrument for tooling decisions. Use for any claim about fleet behavior - "do agents actually run X", "how often does Y fail", command-verb distributions, retry rates, hook effectiveness.
---

# vein — transcript-corpus miner

Binary: `~/.local/bin/vein` (source `~/agent-core/primitives/tools/vein/`, Zig).

## CLI

```bash
vein scan --sessions <path> [--out <commands.csv>]
vein scan --last N [--out <commands.csv>]
vein report --sessions <path> [--out-dir <dir>]
vein report --last N [--out-dir <dir>]
vein report --csv <commands.csv> [--out-dir <dir>]
```

- `--sessions <path>`: text file, one session id / absolute transcript path / cwd-relative `.jsonl` per line (`#` comments and blanks ignored).
- `--last N`: newest N transcripts across CC (`~/.claude/projects/*/*.jsonl`) and pi (`~/.pi/agent/sessions/*/*.jsonl`) by mtime.
- `report` emits four files: `verbs.md`, `retries.md`, `hooks.md`, `failures.md`.

## Truth law

- Schema drift or unknown JSONL shape → literal `UNKNOWN`, exit 4 — never invented aggregates.
- Unresolvable session token → `UNKNOWN: unresolvable session <token>` on stderr, exit 3.
- Exit codes: 0 ok · 2 usage · 3 I/O · 4 schema-UNKNOWN. Distinct, never collapsed.

## Oracle

Acceptance tables and CSV schema: `~/agent-core/research/session-mining-verbs.md` (Method section).
