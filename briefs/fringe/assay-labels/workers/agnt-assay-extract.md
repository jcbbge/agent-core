# AGNT assay-extract — wake-extract + atom parse

You are agnt-assay-extract. Read
`/Users/jrg/agent-core/briefs/fringe/assay-labels/workers/_shared.md` and obey
it. Do NOT use emojis anywhere.

Implement wake-extract: discover/load sessions via vein, locate the wake
record, parse `<mind:self>` atoms, classify dark sessions, resolve belief ids
when possible.

## Pre-Verified Facts (orch verified)
- Scaffold landed under `~/agent-core/primitives/tools/assay/` with stubs;
  `zig build` was green at scaffold DONE. Re-verify build after your edits.
- Pi wake: `{"type":"custom_message","customType":"circadian-wake"}`, payload
  in `.content` (verified in 5 golden transcripts).
- CC wake: SessionStart `hook_success` attachment; >12.5KB payloads may be
  `<persisted-output>` pointers to
  `<session-dir>/tool-results/hook-*-stdout.txt` — follow the pointer.
- Atom bullet shapes (identifier = bullet shape, NOT section header):
  - Current: `**<claim>** — "<quote>" (<source>) [ep:...]`
  - Older (s1 era): numbered Doctrine lines / Motif bullets without the
    `— "quote"` template — still one atom per bullet under `<mind:self>`.
- NOT atoms: `<mind:constitution*>`, `<mind:user>`, `<mind:now>`.
- Dark: wake missing OR wake contains `KILL SWITCH ACTIVE` → session class
  `dark` (counted, excluded from propagation stats later).
- Belief id: first 12 hex of sha256 of whitespace-normalized claim text;
  files at `~/circadian/mind/beliefs/<id>.md` with `claim:` field. If no
  match → key by normalized claim, mark `unresolved` — never guess.
- Session cwd: pi v3 line 1 `{"type":"session",...,"cwd":...}`; CC records
  carry `cwd`. Surface cwd on the extract result for domain segmentation.
- Golden pi sessions (must parse without crash):
  - s1: `/Users/jrg/.pi/agent/sessions/--Users-jrg-circadian--/2026-07-24T21-02-44-774Z_019f95f0-0c26-73b8-bac9-469feb577089.jsonl`
  - s2: `/Users/jrg/.pi/agent/sessions/--Users-jrg-circadian--/2026-08-09T15-23-57-548Z_019fe71f-a0ec-7007-96cd-29a1cc824c1c.jsonl`
  - s3: `/Users/jrg/.pi/agent/sessions/--Users-jrg--/2026-08-09T16-12-44-208Z_019fe74c-4930-7f72-8dc6-277289f452dc.jsonl`
  - s4: `/Users/jrg/.pi/agent/sessions/--Users-jrg-infinity-arc--/2026-08-11T18-28-42-519Z_019ff215-7d97-7057-8aaa-a239f4beed84.jsonl`
  - s5: `/Users/jrg/.pi/agent/sessions/--Users-jrg-agent-core--/2026-08-11T18-32-09-386Z_019ff218-a5aa-7e53-af73-2fd5d91f14fc.jsonl`
- Pi dirs begin with `--` — quote paths.
- vein session API: `discoverAll`, `selectLastN`, `resolveRef`,
  `parseSessionsFile` in vein `src/session.zig`.

## Parallel Work Notice
Wave2 peers (disjoint partitions — do not touch their files):
- agnt-assay-match → `src/match.zig` only
- agnt-assay-classify → `src/classify.zig`, `src/llm.zig`, `src/aggregate.zig`,
  `src/propose.zig`, `src/belief.zig` (belief id helpers: if you need claim
  normalize+sha, put shared pure helpers in `src/wake.zig` OR call into
  belief.zig ONLY if classify owns it — prefer: you own atom parse + call
  `belief.resolveId` if scaffold exported a stub; if belief.zig is owned by
  classify, implement resolve inline in wake.zig as `pub fn beliefIdHint`
  and let classify wire the mind-dir lookup — OR implement full resolve in
  wake using read-only mind dir). **Ruling: you own atom→normalized claim +
  optional mind lookup in wake.zig; do not edit belief.zig.**
- agnt-assay-golden → `src/golden.zig`, golden tests, labels wiring
Ignore uncommitted changes outside your partition.

**Partition exception for pipeline glue:** you MAY edit `src/pipeline.zig`
ONLY to call your wake-extract stage (add `extractStage` hook). Do not
rewrite match/classify/golden stages. If `main.zig` needs a tiny hook to
surface extract for smoke, prefer pipeline.zig.

## Tower
CLAIM/DONE via `bun ~/.tower/cli.mjs` topic `circadian/memory-assay`,
`--from agnt-assay-extract`.

## Tasks
1. Implement `src/wake.zig`: load transcript, find wake (pi+cc), follow
   persisted-output pointers, parse atoms, detect dark, capture cwd,
   produce structured results (allocator-owned) — done when: unit or
   smoke path extracts ≥1 atom from s2 (current format) and ≥1 from s1
   (older format) without crash; dark detection unit-testable.
2. Wire extract into `src/pipeline.zig` extract stage — done when: code
   path compiles.
3. `zig build && zig build test` green from assay dir.
4. Manual check: small zig test or `assay` path that prints atom count for
   s1 and s2 (stderr or test stdout) — report numbers. s1 summary claims
   50 payload atoms in wake; your count should be in that ballpark
   (exact match not required if older format ambiguity — report count +
   method).

## Constraints
- Touch ONLY: `src/wake.zig`, and minimally `src/pipeline.zig` /
  `src/lib.zig` if export needed. No other files.
- Do not commit. No mocks. `~/circadian` read-only.
- Never invent atom text.

## Report back with
- atom counts for s1 and s2 (and method)
- dark-detection behavior summary
- files modified
- build/test exits

## Done-when
Build+test green; board DONE;  
`touch /Users/jrg/agent-core/briefs/fringe/assay-labels/workers/agnt-assay-extract.done`
