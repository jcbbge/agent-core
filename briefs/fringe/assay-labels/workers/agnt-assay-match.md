# AGNT assay-match — post-wake phrase match

You are agnt-assay-match. Read
`/Users/jrg/agent-core/briefs/fringe/assay-labels/workers/_shared.md` and obey
it. Do NOT use emojis anywhere.

Implement match: for each atom, exact + whitespace/case-normalized phrase
search over ASSISTANT-message text AFTER the wake record only. Emit evidence
rows `{session, atom_hint, line, snippet}`.

## Pre-Verified Facts (orch verified)
- Scaffold exists at `~/agent-core/primitives/tools/assay/` (stubs).
- Search ONLY assistant text after the wake record. User/system/tool noise
  before wake must not count.
- Pi assistant messages: JSONL records with assistant role/content (inspect
  a golden transcript — do not guess schema; read s5 head and a mid-file
  assistant line). Prefer vein/extract_pi knowledge of message shapes where
  reusable, but match logic lives in assay.
- Matching: (1) exact substring of claim text; (2) whitespace-collapsed +
  case-folded variant. Hits become evidence rows with 1-based line number
  of the JSONL record (or content line — pick one, document in README note
  via board finding; golden labels use transcript line numbers like
  `line 229`).
- Golden labels evidence format uses raw file line numbers (see
  `s1.labels.jsonl` `"evidence": "line 229: ..."`). Prefer JSONL file
  line numbers for compatibility.
- Decoys are matched the same way (classify/golden consume hits).

## Parallel Work Notice
Peers:
- extract → `src/wake.zig` (+ tiny pipeline hook)
- classify → classify/llm/aggregate/propose/belief
- golden → `src/golden.zig` + tests
You own `src/match.zig` (+ minimal `pipeline.zig` match-stage wire).
Ignore others' dirty files.

## Tower
CLAIM/DONE: topic `circadian/memory-assay`, `--from agnt-assay-match`.

## Tasks
1. Implement `src/match.zig` API that accepts atoms + transcript path (or
   bytes) + wake line index, returns evidence list — done when: unit test
   on a tiny fixture you create under `test/fixtures/match-mini.jsonl`
   (allowed) shows a known phrase hit after wake and zero hit for
   pre-wake occurrence.
2. Wire match stage in `pipeline.zig` only.
3. Optional smoke: against s5, confirm distinctive atom phrases that appear
   only at wake are not double-counted as post-wake hits (s5 was all P0 —
   expect few/zero post-wake hits for many atoms).
4. `zig build && zig build test` green.

## Constraints
- Touch ONLY: `src/match.zig`, `test/fixtures/match-mini.jsonl` (create ok),
  minimal `pipeline.zig` / `lib.zig` / `test/smoke.zig` if needed for the
  fixture test. Do not edit wake/classify/golden bodies.
- No commit. No mocks of match results — real fixture file on disk.

## Report back with
- match API signature
- fixture test result
- s5 smoke observation (hit counts if run)
- files touched

## Done-when
Build+test green; board DONE;  
`touch /Users/jrg/agent-core/briefs/fringe/assay-labels/workers/agnt-assay-match.done`
