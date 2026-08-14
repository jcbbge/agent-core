# assay

Memory-propagation instrument for circadian mind atoms. Measures whether
injected wake atoms propagate into assistant behavior across session
transcripts.

Reuses the vein session walk — do not fork session discovery.

## Build

Requires Zig 0.16.0, macOS arm64.

```bash
cd ~/agent-core/primitives/tools/assay
zig build
zig build test
```

Binary: `zig-out/bin/assay`

## Verbs

```
assay run     --sessions <path> | --last N | --session <path>
              [--decoys N] [--out-dir <dir>] [--mind-dir ~/circadian/mind]
assay golden  --labels-dir <path> [--sessions <path>] [--out <report.md>]
              [--mind-dir ~/circadian/mind] [--no-classify]
              (ASSAY_SKIP_CLASSIFY=1 also skips classify HTTP)
assay --help
```

Golden runs classify by default (local LLM at `http://127.0.0.1:10240/v1`).
Use `--no-classify` or `ASSAY_SKIP_CLASSIFY=1` to skip HTTP classify and
score all hits UNCLASSIFIED (exit 5). The LLM probe verifies both `/models`
and a minimal `/chat/completions` call; classify fail-fast stops after the
first chat error.

Internal stages (library modules, not CLI verbs): wake-extract, match,
classify, aggregate, propose. `run` orchestrates them. `golden` diffs
instrument output vs hand labels in a labels directory (expects
`s{1..5}.labels.jsonl` paired with session paths).

Golden sessions list (default `--sessions`): `test/golden-sessions.txt`.

## Exit codes

| Code | Meaning |
|------|---------|
| 0 | ok |
| 2 | usage |
| 3 | I/O error |
| 4 | schema UNKNOWN / drift |
| 5 | LLM unavailable (degraded output may still be written) |

`assay golden` exits **5** when classify is degraded (hits remain
UNCLASSIFIED) but still writes the report.

## Truth law

Unparseable input, schema drift, or missing LLM yields literal `UNKNOWN` or
skip-counts — never invented numbers. Timeout is not success. Degraded
classify output is still written when the LLM is down (exit 5).

## Vein reuse

Session discovery and transcript schema knowledge come from the sibling
`vein` module (`../vein/src/lib.zig`): `discoverAll`, `selectLastN`,
`resolveRef`, `parseSessionsFile`. Do not copy-diverge the walk.

## Name law

Do not use "molt" or "molting" anywhere in this tool or its output.

## Golden acceptance

Hand labels live under `briefs/fringe/assay-labels/`. Scoring notes:
`briefs/fringe/assay-labels/design-notes.md`.

Presence = any post-wake phrase hit (match stage). SHAPED agreement requires
classify + local LLM at `http://127.0.0.1:10240/v1`. When classify is
unavailable, golden reports presence metrics and marks SHAPED stats as
degraded (UNCLASSIFIED).
