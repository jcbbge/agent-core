# ARBITER ruling — assay-recall nQ round 2 of 3 (Polaris: rule, never fix)

Round 1 context: you (or your predecessor) ruled both compile-failure classes
BAD TEST; the Test-Maker rebound the suite to the real API. The Tester re-ran
in `/Users/jrg/.cursor/worktrees/agent-core/wt-verify-assay-recall` (impl +
repaired tests combined). Result: `zig build test` exit 1 —
**12/14 tests pass, 2 assertion failures, plus leak-failed test steps.**
Behavioral golden criteria remain green via CLI (s1=0.360, s2=0.146,
s4=0.827, precision 1.000, decoy 0/25).

Full captured output: `/tmp/ac5-full.txt` (read it).

## Failure class A — 2 assertion failures (any-of semantics)

- `match_needles.test.AC5: presence matches on ANY derived needle (secondary
  phrase only in transcript)` — match_needles.zig:139 calls
  `match.searchBytes(...)`
- `match_needles.test.AC5: searchBytes matches on ANY derived needle in
  assistant text` — match_needles.zig:202

The Test-Maker's hypothesis (a hypothesis, NOT a ruling): "deriveNeedles
returns duplicate full-phrase needles that don't match the fixture — impl
gap." The plan's AC5 requires: 2–3 DISTINCTIVE sub-phrases from the full
claim text; presence = match on ANY needle. If the implementation's needles
effectively degenerate to the full phrase, any-of is vacuous and the impl
does not implement the plan. If the fixture/transcript text is crafted
wrong, the test is bad. Rule it.

## Failure class B — memory leaks fail the test steps

- `src/match.zig:351` — `searchBytes` does
  `try needle_cache.append(try deriveNeedles(allocator, atom.hint));` and
  the needle sets are never freed (46 leaked allocations across
  match_needles tests; traces in /tmp/ac5-full.txt).
- `golden_recall_acceptance.zig` tests each report **2931 leaked
  allocations** (5 tests; traces at /tmp/ac5-full.txt lines 634+). Source
  unknown — could be the impl's searchTranscript, could be the pre-existing
  golden.zig harness called in-process. NOTE: golden.zig is pre-existing
  code this unit did not touch; if the leak lives there and merely becomes
  visible when called in-process, consider pre-existing/out-of-scope with a
  routing that keeps AC1 honest (e.g. test-side scope suppression is NOT
  acceptable without saying so explicitly).
- Also note match.zig:351 derives from `atom.hint` — verify whether
  `Atom.hint` carries the full claim text (labels format suggests yes) or
  the slug; if the slug, the impl violates the plan's core requirement
  (needles from CLAIM text) and that is bad implementation.

AC1 (`zig build test` exit 0) is a hard acceptance criterion, so leaks block
the exit gate regardless of which side owns them.

## Deliverable

One ruling per class (bad test → Test-Maker / bad implementation → coder /
pre-existing → human), one-sentence rationale each, routing instructions at
file:line granularity (no code written by you). State explicitly whether the
leaks are in-scope for this unit.

## Report back

Board topic `agent-core/assay-recall`, type=finding, prefix `ARBITER-R2:`.
Verdict, then gone.
