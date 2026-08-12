# CODER round 3 — assay-recall (operator-granted nQ extension; 4 mechanism-pinned fixes)

You are the Implementer, round 3. Continue in your worktree (round-1+2 work
is there, uncommitted): `/Users/jrg/.cursor/worktrees/agent-core/wt-agnt-coder-w29-pe`
(Audited break-glass spawn — no fresh worktree. Do NOT read `test/` oracle
files; you fix against the Arbiter's pinned mechanisms below, not the tests.)

The Arbiter probe-verified every failure. Four fixes:

## Fix 1 — phantom needles join words across hard punctuation (heals BOTH failing AC5 tests)

`src/match.zig` `deriveNeedles`: the sliding-window candidate generator joins
words ACROSS hard punctuation boundaries (em-dash, `:`, `,`). Arbiter's
probe: for one claim it emitted `["metric memory earns", "memory earns
residence", "metric memory"]` — needles that don't appear in their own
source claim under the matcher's own normalization, so they can never match
anything. Meanwhile clean segments like `stillness first` (score 50) get
crowded out of the top-3 by boundary-crossing 3-word windows (score 52).
Fix: never let a candidate window span a hard-punctuation boundary (split
segments FIRST on em-dash/colon/comma/semicolon/period, then window within
segments). Verify your own fix: derive needles for a claim with an em-dash
and confirm every emitted needle is a verbatim substring of the claim after
your normalization.

## Fix 2 — wake.zig:227 leak (round-2 drive-by freed the WRONG site)

`src/wake.zig` `parseAtomsFromMindSelf` line ~227:
`const normalized = try normalizeClaim(allocator, claim_owned);` — freed only
by errdefer; the SUCCESS path leaks it (~1250 allocs per golden run). Free
it on the success path. (Your round-2 edit at :242 was a different
`normalized` — leave it, it was also correct.)

## Fix 3 — vein io_ctx.zig:65/70 leak (round-2 deinit was incomplete)

`primitives/tools/vein/src/io_ctx.zig` `readLineInto`: the long-line branch
does `line_buf.* = aw.toArrayList()` — overwriting a capacity-retaining
buffer WITHOUT deinit, on EVERY long line (~130/run). Your round-2 deinit
only freed the final one. Deinit the old buffer before EVERY overwrite.
(Already claimed on the board by CORD; keep it minimal.)

## Fix 4 — match.zig searchTranscript leak (~140 allocs/run)

Leak traces point into `searchTranscript` in the golden path. Find the
unfreed allocation(s) (likely the same needle-set ownership pattern as the
round-2 pushWord fix, one frame over) and free them.

## Constraints (unchanged, hard)

- Golden presence precision 1.000; decoy false-SHAPED exactly 0/25; recall
  no regression below round-2: s1 ≥ 0.400, s2 ≥ 0.271, s4 ≥ 0.846.
- Verify with: `cd primitives/tools/assay && zig build && zig build test`
  (exit 0 in YOUR tree) and
  `./zig-out/bin/assay golden --labels-dir /Users/jrg/agent-core/briefs/fringe/assay-labels --no-classify --out /tmp/assay-r3.md`
  (exit 5 = expected degraded classify).
- The combined-tree `zig build test` (with the oracle suite) is the Tester's
  run, not yours.

## Report back

Board topic `agent-core/assay-recall`, type=finding, prefix `CODER-R3:` —
file:line per fix, golden metrics table, decoy count, leak status. Then idle
for collection.
