# AGNT assay-golden — golden-set harness + README finish

You are agnt-assay-golden. Read
`/Users/jrg/agent-core/briefs/fringe/assay-labels/workers/_shared.md` and obey
it. Do NOT use emojis anywhere.

Implement `assay golden` and the acceptance diff against hand labels. Finish
README so build/verbs/exit codes/truth law are complete.

## Pre-Verified Facts (orch verified)
- Labels dir:
  `/Users/jrg/agent-core/briefs/fringe/assay-labels/`
  files `s{1..5}.labels.jsonl` + `s{1..5}.summary.md`.
- Session paths (also in brief-s{1..5}.md tails):
  - s1 circadian 2026-07-24T21-02-44-774Z_019f95f0-0c26-73b8-bac9-469feb577089
  - s2 circadian 2026-08-09T15-23-57-548Z_019fe71f-a0ec-7007-96cd-29a1cc824c1c
  - s3 home 2026-08-09T16-12-44-208Z_019fe74c-4930-7f72-8dc6-277289f452dc
  - s4 arc 2026-08-11T18-28-42-519Z_019ff215-7d97-7057-8aaa-a239f4beed84
  - s5 agent-core 2026-08-11T18-32-09-386Z_019ff218-a5aa-7e53-af73-2fd5d91f14fc
  under `~/.pi/agent/sessions/--Users-jrg-...--/`.
- Label schema: JSONL `{atom, decoy, present, label, evidence}` where label
  ∈ P3|P2|P0.
- Acceptance (ORCH brief): presence detection exact; SHAPED≈P3 recall floors
  s1≥8 unique, s2≥3, s4≥1; s3/s5 zero-tolerance false SHAPED; decoy
  false-SHAPED 0/25 corpus-wide. If LLM weak/down, report measurements
  honestly (UNCLASSIFIED is allowed; do not fake agreement).
- Mapping for scoring when classified: SHAPED↔P3, ECHOED↔P2; THEME-ONLY and
  UNCLASSIFIED are not SHAPED. Presence = any post-wake hit vs label
  `present`.
- Create `test/golden-sessions.txt` listing the 5 absolute paths (one per
  line) for `assay run --sessions` / golden.

## Parallel Work Notice
Peers fill wake/match/classify. You own:
`src/golden.zig`, `test/golden-sessions.txt`, golden-related tests under
`test/`, `src/main.zig` golden subcommand wiring (if still stub), README.md
completion, and optional
`briefs/fringe/assay-labels/design-notes.md` append for scoring notes only.
If pipeline `run` is not fully wired when you start, implement golden to
call library stages that exist and skip/UNKNOWN with clear counts for
missing stages — do not block forever; coordinate via board if extract/match
APIs are still stubs (wait up to ~15m by watching peer `.done` files, then
implement against available APIs).

Peer `.done` paths:
- `.../workers/agnt-assay-extract.done`
- `.../workers/agnt-assay-match.done`
- `.../workers/agnt-assay-classify.done`

## Tower
CLAIM/DONE: `circadian/memory-assay`, `--from agnt-assay-golden`.
Also post a finding with the golden agreement numbers (or UNCLASSIFIED
degraded report) — orch will republish the corpus finding.

## Tasks
1. Implement `assay golden --labels-dir ... [--out report.md]` in
   `golden.zig` + `main.zig`.
2. Write `test/golden-sessions.txt` with 5 paths.
3. Run golden (and/or `assay run` over the 5) once peers are far enough;
   produce report with per-session presence precision/recall, SHAPED≈P3
   stats, decoy FP rate, dark-rate.
4. Complete README.md (build, verbs, exit codes, truth law, vein reuse,
   name law).
5. `zig build && zig build test` green.

## Constraints
- Touch ONLY: `src/golden.zig`, `src/main.zig` (golden/run CLI glue only),
  `README.md`, `test/golden-sessions.txt`, `test/*golden*`, optional
  `briefs/fringe/assay-labels/design-notes.md`. Do not rewrite wake/match/
  classify module bodies.
- No commit. No mocks.

## Report back with
- path to golden report
- agreement numbers (or degraded UNCLASSIFIED measurements)
- build/test exits
- files touched

## Done-when
Build+test green; golden report on disk; board DONE with numbers;  
`touch /Users/jrg/agent-core/briefs/fringe/assay-labels/workers/agnt-assay-golden.done`
