# AGNT assay-scaffold — Zig project skeleton + CLI pin

You are agnt-assay-scaffold. Read
`/Users/jrg/agent-core/briefs/fringe/assay-labels/workers/_shared.md` and obey
it. Do NOT use emojis anywhere.

Create the assay tool skeleton so sibling AGNTs can fill stage modules in
parallel. Stubs only — return `error.NotImplemented` or empty success with
clear TODO comments; do not implement wake/match/classify logic.

## Pre-Verified Facts (orch verified this session)
- Zig 0.16.0 is installed (`zig version` → `0.16.0`).
- vein builds: `cd ~/agent-core/primitives/tools/vein && zig build` exits 0.
- vein lib exports: `session`, `schema`, `extract_pi`, `extract_cc`, `io_ctx`,
  etc. at `/Users/jrg/agent-core/primitives/tools/vein/src/lib.zig`.
- vein `build.zig` pattern: createModule on `src/lib.zig`, exe imports as
  `.name = "vein"`. Assay must similarly expose `assay` lib + import vein via
  absolute sibling path (no zig fetch):
  `b.path("../vein/src/lib.zig")` relative to assay's build.zig OR
  `std.Build` createModule with path joining from assay root.
- Assay dir does NOT exist yet — create
  `/Users/jrg/agent-core/primitives/tools/assay/`.
- Local LLM `http://127.0.0.1:10240/v1/models` TIMED OUT this session
  (launchd `com.localllm.server` listed but HTTP 0 bytes). Scaffold must
  still declare exit code 5 for LLM-unavailable; do not call the LLM.
- Binding ORCH brief:
  `/Users/jrg/agent-core/briefs/fringe/orch-assay-build.md`.
- Slim/vein scaffolds are exemplars for style:
  `~/agent-core/primitives/tools/slim/build.zig`,
  `~/agent-core/primitives/tools/vein/build.zig`.

## Parallel Work Notice
You are wave1 alone. Wave2 AGNTs (extract, match, classify, golden) spawn
AFTER your `.done`. Ignore any other uncommitted work outside assay/.
Post to Tower topic `circadian/memory-assay`.

## Tower
Use `bun ~/.tower/cli.mjs post claim|finding circadian/memory-assay "..." --from agnt-assay-scaffold`.
CLAIM first. DONE finding last before touching `.done`.

## Verb layout (ORCH decision — pin exactly in --help)
```
assay run     --sessions <path> | --last N | --session <path>
              [--decoys N] [--out-dir <dir>] [--mind-dir ~/circadian/mind]
assay golden  --labels-dir <path> [--out <report.md>]
assay --help
```
Internal stages (library modules, not separate CLI verbs): wake-extract →
match → classify → aggregate → propose. `run` orchestrates them. `golden`
diffs instrument output vs hand labels.

## Tasks
1. Create directory tree and files listed in Constraints — done when: every
   listed path exists.
2. `build.zig`: macOS aarch64 target, `assay` exe + lib module, import vein
   module named `"vein"` from sibling path, `zig build test` step on lib —
   done when: `cd ~/agent-core/primitives/tools/assay && zig build` exits 0
   and `zig build test` exits 0.
3. `src/lib.zig`: export modules + `ExitCode` enum with 0/2/3/4/5 — done when:
   compile succeeds and a unit test asserts the five values.
4. `src/main.zig`: parse argv for `run` / `golden` / `--help`; on stub path
   print a one-line "not implemented" to stderr and exit 2 (usage) OR exit 0
   with empty out-dir for `run` if you prefer — prefer exit 2 with clear
   message so wave2 can replace bodies. `--help` must print the verb layout
   above and exit 0.
5. Stub modules compile and are imported from lib:
   `wake.zig`, `match.zig`, `classify.zig`, `aggregate.zig`, `propose.zig`,
   `belief.zig`, `llm.zig`, `golden.zig`, `pipeline.zig` — each may be a
   minimal `pub fn stub() void {}` or `pub fn run(...) !void { return error.NotImplemented; }`.
6. `README.md`: title assay, build commands, verb layout, exit codes, truth
   law, "reuses vein session walk", name law (no molt) — skeleton ok; wave2
   may extend.
7. `test/smoke.zig` imported from lib tests OR a trivial lib test that
   imports vein.session (prove the import links).

## Constraints
- Touch ONLY under `/Users/jrg/agent-core/primitives/tools/assay/`.
- Do not commit. Do not modify vein sources.
- No mocks. No LLM calls in this wave.
- Do not implement real extract/match/classify — stubs only.
- Registration/report name: agnt-assay-scaffold.

## File list (create all)
```
primitives/tools/assay/build.zig
primitives/tools/assay/README.md
primitives/tools/assay/src/main.zig
primitives/tools/assay/src/lib.zig
primitives/tools/assay/src/wake.zig
primitives/tools/assay/src/match.zig
primitives/tools/assay/src/classify.zig
primitives/tools/assay/src/aggregate.zig
primitives/tools/assay/src/propose.zig
primitives/tools/assay/src/belief.zig
primitives/tools/assay/src/llm.zig
primitives/tools/assay/src/golden.zig
primitives/tools/assay/src/pipeline.zig
primitives/tools/assay/test/smoke.zig
```

## Report back with
- `zig build` and `zig build test` exit codes
- `zig-out/bin/assay --help` verbatim output
- list every file created
- any deviation + reason

## Done-when
1. Build + test green.
2. Board DONE finding posted.
3. `touch /Users/jrg/agent-core/briefs/fringe/assay-labels/workers/agnt-assay-scaffold.done`
