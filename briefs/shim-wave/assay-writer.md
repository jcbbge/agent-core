# assay writer-API fix + golden SHAPED floors

Do NOT use emojis anywhere.

Mission: fix assay's Zig 0.16 HTTP response writer so local-LLM classify
works, then regenerate the golden report so SHAPED floors are populated
(not UNKNOWN). Decoy false-SHAPED must stay exactly 0/25 — if it moves,
STOP and report; do not tune.

## Pre-Verified Facts (ORCH verified this session)

- Zig: `zig version` → `0.16.0`
- Broken pattern in `~/agent-core/primitives/tools/assay/src/llm.zig`:
  `std.Io.Writer.fromArrayList(&body)` at lines 25, 54, 83, 140 (probe,
  probeChat, pickModel, classifySnippet). This WriteFailed under 0.16
  `http.Client.fetch`.
- Proven fix pattern in `/Users/jrg/local-llm/probe-test.zig`:
  ```
  var body = std.ArrayList(u8).empty;
  var aw = std.Io.Writer.Allocating.fromArrayList(allocator, &body);
  // … fetch .{ .response_writer = &aw.writer, … }
  const content = aw.toArrayList(); // then read content.items
  ```
  Sibling reuse also in `primitives/tools/vein/src/io_ctx.zig` (~85–96).
- Local LLM live: `GET http://127.0.0.1:10240/v1/models` returns models;
  first id is `"local"`. `POST …/v1/chat/completions` with
  `{"model":"local",…}` round-trips 200 with assistant content. Invalid
  model ids return 500 — use `"local"`.
- Labels dir: `~/agent-core/briefs/fringe/assay-labels/` has
  `s1..s5.labels.jsonl` + existing degraded `golden-report.md`
  (Classify DEGRADED / SHAPED floors UNKNOWN / Decoy false-SHAPED 0/25).
- Golden invocation (from assay README + prior run):
  ```
  cd ~/agent-core/primitives/tools/assay
  zig build && ./zig-out/bin/assay golden \
    --labels-dir ~/agent-core/briefs/fringe/assay-labels \
    --out ~/agent-core/briefs/fringe/assay-labels/golden-report.md
  ```
- SHAPED recall floors (design-notes.md): s1≥8, s2≥3, s4≥1; s3/s5 zero
  false SHAPED. Corpus decoy FP must remain 0/25.
- Partition hard wall: touch ONLY under `primitives/tools/assay/`.
  Do not commit. Board topic: `agent-core/assay-writer`.

## Parallel Work Notice

Coder and test-maker run in SEPARATE worktrees from the SAME plan — neither
reads the other's tree. Ignore uncommitted changes outside
`primitives/tools/assay/`. Post claims/findings to Tower board topic
`agent-core/assay-writer` (`board_post` / `board_read`).

## Tower (mid-run)

- Progress / findings → board topic `agent-core/assay-writer`
- Operator-facing only if decoy-FP moves or LLM is down (alert upward via
  ORCH; do not tune)
- `spine-report task` / `spine-report verdict` on Herdr hosts
- Claim `primitives/tools/assay/src/llm.zig` (coder) or
  `primitives/tools/assay/src/llm.zig` test surface (test-maker) via
  spine-claim while working

## Role partitions (Made Well bifurcation)

### Implementer (coder) — OWN worktree
Touch ONLY:
- `primitives/tools/assay/src/llm.zig`
- optionally tiny probe helper under `primitives/tools/assay/` if needed
  for a live POST proof (prefer a `zig test` / existing binary path)

Tasks:
1. Replace every `std.Io.Writer.fromArrayList` response writer with
   `std.Io.Writer.Allocating.fromArrayList` + `&aw.writer` +
   `aw.toArrayList()` before reading bytes — done when all four fetch
   sites match the proven pattern.
2. Ensure chat/classify uses model id `"local"` (Config.model default or
   pickModel preference) so POSTs do not 500 — done when a live probe
   against `127.0.0.1:10240` can POST `/chat/completions` and parse
   assistant content.
3. `cd primitives/tools/assay && zig build` exits 0 — done when binary
   builds.

Do NOT: write/edit tests; run golden; commit; touch files outside assay.

### Test-Maker — OWN worktree; NEVER read implementation
Author executable acceptance tests from THIS PLAN ONLY under
`primitives/tools/assay/` (prefer extending `src/llm.zig` tests or
`test/smoke.zig` — whichever the suite already uses).

Acceptance criteria → tests:
1. HTTP response capture for LLM client uses Allocating writer API (or
   behavioral: POST chat completions against a reachable local endpoint /
   mocked fetch path succeeds without WriteFailed).
2. `zig build test` in `primitives/tools/assay` exits 0.
3. Live probe path: when `http://127.0.0.1:10240/v1` is up, probe/classify
   path can obtain a non-empty completion for model `"local"` (skip/soft
   if endpoint down — do not invent success).
4. Do NOT assert golden SHAPED floor numbers in unit tests (golden is
   ORCH integration after land). Do NOT assert decoy tuning.

Emit any human-only checks in /qa-doc shape if truly non-automatable.

### Tester (after both land on main checkout) — ORCH-spawned
- Run `zig build test` in `primitives/tools/assay` — must exit 0.
- Run a live probe POST that parses a real completion (model `local`).
- Do not edit code or tests; on failure hand Q to arbiter.

### ORCH integration (not worker)
After Verify green on the writer fix:
- Rebuild assay; run `assay golden` as above.
- Confirm SHAPED floors are populated (not UNKNOWN) per design-notes.
- Confirm decoy false-SHAPED still exactly 0/25; if not, STOP + board
  alert — do not tune.
- Write `~/agent-core/briefs/shim-wave/done/assay-writer.done` LAST.

## Constraints
- Touch ONLY: `primitives/tools/assay/` (workers).
- Do not commit.
- Model id for chat: `"local"`.
- Decoy-FP 0/25 is sacred — movement is a stop condition.

## Report-back
Board `agent-core/assay-writer` with: files touched, `zig build`/`zig build
test` exit codes, live probe evidence (status + snippet length), and path
to any test files added. Mark worker `.done` only after your tasks' done-
whens are true.
