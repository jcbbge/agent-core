# ARBITER ruling — assay-recall nQ round 1 (you are Polaris: rule, never fix)

A test run failed. You render EXACTLY ONE ruling per distinct failure class,
with a recorded rationale. You fix nothing. Rulings:

- **bad test** → routes to Test-Maker (fix the suite → Tester re-runs)
- **bad implementation** → routes to Implementer/coder (fix code → Tester re-runs)
- **pre-existing / out-of-scope** → escalate to human

## Context

Unit: assay recall proposal 1 (claim-derived multi-needle matching). The
plan (`/Users/jrg/agent-core/briefs/shim-wave/assay-recall.md`) specifies
BEHAVIOR only — it names no Zig API symbols. The Test-Maker authored
`test/match_needles.zig` + `test/golden_recall_acceptance.zig` from the plan
without reading code; the Implementer wrote `src/match.zig` from the plan
without seeing tests. The Tester combined both in
`/Users/jrg/.cursor/worktrees/agent-core/wt-verify-assay-recall` and ran
`zig build test` → compile failure (AC1/AC5 red). The BEHAVIORAL criteria
all passed, reproduced by the Tester: golden recall s1=0.360 (>0.300),
s2=0.146 (>0.063), s4=0.827 (≥0.788), precision 1.000 everywhere with hits,
decoy false-SHAPED 0/25.

## The Q (verbatim compile errors, Zig 0.16.0)

Class A — `test/match_needles.zig`:
```
test/match_needles.zig:13:24: error: root source file struct 'match' has no member named 'deriveClaimNeedles'
    var set = try match.deriveClaimNeedles(std.testing.allocator, claim);
test/match_needles.zig:13:9: error: local variable is never mutated (consider using 'const')
  (same var-not-const error at lines 33, 50, 156)
```
The implementation exposes the same capability under a different name
(`deriveNeedles`, per the Implementer's report) — the plan named no API.

Class B — `test/golden_recall_acceptance.zig`:
```
test/golden_recall_acceptance.zig:10:18: error: root source file struct 'fs' has no member named 'cwd'
    return std.fs.cwd().realpath("../../../briefs/fringe/assay-labels", buf);
```

## What you may read

Everything: the plan brief, the failing test files, `src/match.zig` in the
verify worktree, the assay README. You are the one role that sees both sides
at triage time.

## Questions your ruling must answer

1. Class A: is requiring an invented API name (`deriveClaimNeedles` et al.)
   a bad test (over-specification beyond the plan), or should the
   implementation expose the test-authored contract? Note the plan's AC5
   requires only the SEMANTICS: 2–3 needles derived from full claim text,
   any-of presence, zero-needle = absent. Note also: `var` vs `const` is a
   test-side Zig lint error regardless.
2. Class B: test-side stdlib misuse, or environment problem?
3. For each class: one ruling + one-sentence rationale + the routing
   instruction (what exactly the routed role must change, at file:line
   granularity where possible — WITHOUT writing the code).

## Report back

Board topic `agent-core/assay-recall`, type=finding, prefix `ARBITER-R1:` —
ruling per class, rationale, routing instructions. Also state explicitly if
any part is pre-existing/out-of-scope. Verdict, then you are gone.
