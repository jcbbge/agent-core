---
name: assay
description: Memory-propagation instrument for circadian mind atoms - measures whether injected wake atoms actually propagate into assistant behavior across session transcripts. Use after changing anything in the memory/wake pipeline, or when asked whether memory works. Cohort tool, proposes only. Standing honesty metric - decoy false-SHAPED 0/25.
---

# assay — memory-propagation instrument

Run from source: `~/agent-core/primitives/tools/assay/zig-out/bin/assay` (build with `zig build` in that dir first; Zig 0.16.0). Not on PATH deliberately — it is a cohort instrument, not a daily verb.

## Verbs

```bash
assay run    --sessions <path> | --last N | --session <path> [--decoys N] [--out-dir <dir>]
assay golden --labels-dir <path> [--sessions <path>] [--out <report.md>] [--no-classify]
```

- `golden` diffs instrument output vs the hand-labeled golden set (`s{1..5}.labels.jsonl` in the labels dir; default sessions list `test/golden-sessions.txt`).
- Golden classifies via the local LLM at `http://127.0.0.1:10240/v1` by default; `--no-classify` (or `ASSAY_SKIP_CLASSIFY=1`) skips HTTP, scores hits UNCLASSIFIED, exits 5 — presence metrics remain valid.

## Reading results

- **presence precision/recall** per session — did labeled atoms genuinely appear in later transcript lines.
- **decoy false-SHAPED** must stay exactly 0/25 — the standing honesty wall.
- Floors (current acceptance): s1 > 0.300, s2 > 0.063, s4 ≥ 0.788 recall; precision 1.000 on sessions with hits.

## Exit codes

0 ok · 2 usage · 3 I/O · 4 schema UNKNOWN/drift · 5 LLM unavailable (degraded report still written).

## Truth law

Unparseable input, schema drift, or missing LLM yields literal `UNKNOWN` or a distinct exit code — never invented numbers.
