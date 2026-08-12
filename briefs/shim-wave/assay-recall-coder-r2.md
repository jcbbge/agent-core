# CODER round 2 — assay-recall (Arbiter nQ2 routing: BAD IMPLEMENTATION ×2 + 2 authorized drive-bys)

You are the Implementer for unit assay-recall, round 2. Your round-1 work is
uncommitted in this worktree — CONTINUE THERE:
`/Users/jrg/.cursor/worktrees/agent-core/wt-agnt-coder-w29-pe`
(You were spawned without a fresh worktree by audited break-glass so you keep
your round-1 tree. The isolation wall already served its purpose; do NOT go
reading `test/` oracle files now — you fix against the Arbiter's ruling, not
against the tests.)

Original plan: `/Users/jrg/agent-core/briefs/shim-wave/assay-recall.md`.

## Fix 1 (Class A, bad implementation): needles degenerate to near-full-phrase

Arbiter-established mechanism: `src/match.zig:156` only generates 5/4/3-word
windows and `:221-247` scores by length, so the top-3 cut is dominated by
near-full-phrase needles. Distinctive SHORT sub-phrases — e.g. "complexity
accretion", "stillness first" — never make the cut, so any-of presence is
nearly vacuous. The plan requires 2–3 DISTINCTIVE sub-phrases derived from
the full claim text. Fix the derivation/scoring so genuinely distinctive
sub-phrases (content-word-dense, shorter spans, hyphenated identifiers) make
the top-3. HARD CONSTRAINTS: golden presence precision must stay 1.000,
decoy false-SHAPED exactly 0/25, and recall must not regress below the
round-1 numbers (s1 ≥ 0.360, s2 ≥ 0.146, s4 ≥ 0.788) — shorter needles are
a false-positive risk; the decoy wall is the arbiter of over-matching.

Verify with:
`cd primitives/tools/assay && zig build && ./zig-out/bin/assay golden --labels-dir /Users/jrg/agent-core/briefs/fringe/assay-labels --no-classify --out /tmp/assay-r2.md` (exit 5 = expected degraded classify).

## Fix 2 (B1, bad implementation, in-scope): needle-set ownership leak

`src/match.zig:183-187` (`pushWord` dupes every tokenized word) vs
`:152-154` (only the list buffer is freed). 46 leaks in the needle tests +
~13,265 in the golden path — one bug. Free what pushWord dupes.

## Fix 3 (B2, CORD-authorized drive-bys, claimed on board): pre-existing leaks

- `src/wake.zig:227` — `normalized` never freed on the success path.
- `../vein/src/io_ctx.zig:70` — long-line branch overwrites `line_buf`
  without deinit.

Both are small ownership fixes. Keep them MINIMAL and disclose them
separately in your report (they will be separate commits).

## Done when

1. `zig build test` exit 0 in the verify-combined tree — you can't run the
   oracle suite (it's not in your tree; do NOT fetch it). Your bar:
   `zig build test` exit 0 in YOUR worktree, plus the golden CLI run above
   meeting every constraint. The Tester does the combined run.
2. Report: board topic `agent-core/assay-recall`, type=finding, prefix
   `CODER-R2:` — what changed (file:line), golden metrics table, decoy
   count, leak status. Then idle for collection.
