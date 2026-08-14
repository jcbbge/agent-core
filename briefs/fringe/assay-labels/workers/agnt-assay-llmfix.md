# AGNT assay-llmfix — probe honesty + golden classify default

You are agnt-assay-llmfix. Read
`/Users/jrg/agent-core/briefs/fringe/assay-labels/workers/_shared.md`.
Do NOT use emojis.

## Pre-Verified Facts (orch verified just now)
- `GET http://127.0.0.1:10240/v1/models` returns 200 with model list.
- `POST http://127.0.0.1:10240/v1/chat/completions` returns
  `Internal Server Error` (curl --max-time 30, body literally that).
- `src/llm.zig` `probe()` only hits `/models` → returns true while chat is
  dead → `classify.run` then calls `classifySnippet` per hit (slow/useless).
- `src/main.zig` and `src/golden.zig` set `skip_classify: bool = true` by
  default — golden never attempts classify unless changed. Must default
  **false**; `--no-classify` / `ASSAY_SKIP_CLASSIFY=1` opt into skip.
- `zig build && zig build test` currently green.

## Tasks
1. Fix `llm.probe` and/or `classify.run` so LLM-unavailable is detected when
   chat is broken: either probe with a tiny chat, OR on first chat failure
   mark `llm_available=false` and label remaining hits UNCLASSIFIED without
   further HTTP. Prefer fail-fast after first chat error.
2. Change golden/main `skip_classify` default to **false**.
3. Keep `--no-classify` and env skip working.
4. Unit test: with base_url pointing at models-ok/chat-bad behavior OR
   `http://127.0.0.1:1`, remaining hits stay UNCLASSIFIED without inventing
   labels; prove fail-fast (no N chat calls) if feasible.
5. `zig build && zig build test` green.
6. Re-run:
   `ASSAY_SKIP_CLASSIFY=1 ./zig-out/bin/assay golden --labels-dir ~/agent-core/briefs/fringe/assay-labels --out ~/agent-core/briefs/fringe/assay-labels/golden-report.md`
   (explicit skip for stable report while chat is 500) and confirm exit 5.

## Constraints
Touch ONLY: `src/llm.zig`, `src/classify.zig`, `src/golden.zig`,
`src/main.zig`, README one paragraph if needed. No commit.

## Done-when
Board DONE;  
`touch /Users/jrg/agent-core/briefs/fringe/assay-labels/workers/agnt-assay-llmfix.done`
