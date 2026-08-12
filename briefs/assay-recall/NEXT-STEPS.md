# assay-recall — NEXT STEPS (operator pickup, or future mission)

> Filed 2026-08-12 by CONCIERGE per operator directive: "leave in its repository
> as a next step item." Origin: assay-recall mission stood down by operator ruling
> (Tower question t-mspn328r-1kjk, answered 2026-08-12T15:21Z): NO budget
> extension; operator takes the remaining fixes manually. Worktrees and state
> were left intact for pickup.

## Remaining defects (all in this repo)

1. **deriveNeedles phantom-needle boundary bug** — `primitives/tools/assay/`:
   at a boundary condition, needle derivation produces phantom needles (test
   probes that shouldn't exist). Impact: measurement integrity — assay is the
   honesty instrument for memory propagation; phantom probes corrupt its signal.
2. **Memory leak** — `primitives/tools/assay/src/wake.zig:227` (allocation never
   freed).
3. **Memory leaks** — `primitives/tools/vein/`: `io_ctx.zig:65` and `:70`,
   plus `match.zig` `searchTranscript`. Impact: memory bloat on long mining
   runs; not correctness.

## Suggested shape if delegated

One mission, verify-beat enforced: test-maker authors leak/phantom reproductions
(red), coder fixes (green), arbiter on call. Small, well-scoped — the kind the
beat handles cleanly. Contact points: assay golden set (`assay golden
--no-classify`, decoy-FP 0/25 is the standing honesty metric — must not regress);
vein acceptance fixtures under `primitives/tools/vein/test/acceptance/`.
