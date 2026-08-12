# ARBITER ruling — assay-recall nQ round 3 of 3 (FINAL round; still red after this → human)

Combined tree: `/Users/jrg/.cursor/worktrees/agent-core/wt-verify-assay-recall`
(impl round-2 + repaired oracle). CORD-reproduced ground truth this session:

- Golden CLI (rebuilt, `--no-classify`): s1=0.400, s2=0.271, s3=0.021,
  s4=0.846, precision 1.000 on all sessions with hits, decoy 0/25.
  AC2/AC3/AC4 PASS.
- `zig build test` exit 1. Full log: `/tmp/ac5-r3.txt`. Summary:
  `12/14 tests passed (2 failed)`; golden acceptance step fails on leaks.

## Open failure classes

**A — 2 assertion failures in match_needles.zig ("failed without output"):**
1. `AC5: needles derive from claim substance not only the leading ordinal
   slug` — NEWLY failing after the coder's round-2 derivation change (it
   passed against round-1 impl). Round-2 fixed its sibling ("secondary
   phrase only in transcript" now passes) and broke this one.
2. `AC5: searchBytes matches on ANY derived needle in assistant text` —
   failing since round 1.

**B — remaining leaks (down from 2931 → 278 per golden test):**
- `wake.zig:227` `parseAtomsFromMindSelf`: `normalizeClaim` result never
  freed — ~1250 allocs/run. NOTE: the coder's round-2 drive-by freed a
  DIFFERENT `normalized` (wake.zig:242, resolveBelief path). The
  Arbiter-identified site (:227) is still open.
- vein `io_ctx.zig` `readLineInto`/`write`: ~130+130 allocs/run still
  present despite the round-2 `line_buf.deinit` drive-by — incomplete.
- `searchTranscript` (match.zig): ~140 allocs/run — impl-side, this unit.

## Your ruling must cover

1. Class A test 1: did the round-2 impl change regress genuine plan
   semantics (bad implementation), or is the test's expectation of
   derivation shape over-specific (bad test)? Read the test body and the
   current `deriveNeedles` and rule with mechanism.
2. Class A test 2: same question — third appearance of an any-of failure.
   If the impl still cannot match a secondary needle in isolation, say so
   plainly with the mechanism.
3. Class B: confirm the leak sites above (or correct them), and rule
   routing per site: coder (in-scope impl + authorized drive-bys already
   claimed on the board: wake.zig, vein io_ctx.zig) vs test.
4. Remember: this is round 3. If ANY class is genuinely unresolvable or
   contested after your ruling, say ESCALATE explicitly with the one-
   sentence human question.

Board topic `agent-core/assay-recall`, prefix `ARBITER-R3:`. Verdict, then
gone.
