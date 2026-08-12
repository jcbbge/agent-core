# TEST-MAKER round 2 — assay-recall oracle repair (Arbiter nQ1 routing: BAD TEST ×2)

You authored the assay-recall oracle suite. The Tester ran it against the
implementation; the Arbiter (nQ round 1) ruled BOTH failure classes
**bad test**. You now repair the suite. You do not touch
`src/match.zig` or any implementation file.

Work in your existing worktree:
`/Users/jrg/.cursor/worktrees/agent-core/wt-agnt-test-maker-w29-pf`
(your files are there, uncommitted).

## Ruling 1 — Class A: invented API contract (test/match_needles.zig)

The plan specified behavior only, no API symbols. Rebind every invented call
to the implementation's REAL API (the Arbiter verified these exist and
express the AC5 semantics — you may now read
`primitives/tools/assay/src/match.zig` IN THE VERIFY WORKTREE
`/Users/jrg/.cursor/worktrees/agent-core/wt-verify-assay-recall` to get
exact signatures; the divergence wall has done its work, the Arbiter opened
this door):

- `deriveClaimNeedles(allocator, claim)` → `deriveNeedles(...)` (real name)
- `freeNeedleSet` → `NeedleSet.free`
- `Atom{.hint, .claim}` → real Atom shape (`Atom{.hint}` — needles derive
  from the atom's claim text internally)
- `normalizeNeedleHaystack` / `textMatchesAnyNeedle` / `atomIsPresent` /
  `countHitsForAtom` → equivalents on the real API
  (`searchTranscript`/`searchBytes` family)
- Fix all `var`-never-mutated errors (lines 13, 33, 50, 156) → `const`.

Keep the SEMANTIC assertions unchanged — 2–3 needles from full claim text,
any-of presence, zero-needle = absent. Only the binding changes.

## Ruling 2 — Class B: std.fs.cwd removed in Zig 0.16.0

`test/golden_recall_acceptance.zig:10` (and the same pattern at
`test/match_needles.zig:75/103/131`): `std.fs.cwd()` no longer exists.
Fix per the Arbiter: drop `realpath` entirely and pass relative paths
straight through — `io_ctx.openAbs` opens via cwd despite its name (see
`primitives/tools/vein/src/io_ctx.zig:20` for the working idiom;
`std.Io.Dir.cwd()` is the 0.16 spelling if you need a cwd handle).

Note the trap the Arbiter found: `match.zig`'s in-file tests use the old
idiom but NEVER compile under `zig build test` (lazy analysis) — do not copy
from them.

## Done when

1. In the VERIFY worktree (which already holds impl + your tests combined):
   `cd /Users/jrg/.cursor/worktrees/agent-core/wt-verify-assay-recall/primitives/tools/assay && zig build test`
   exits 0. You may copy your repaired test files there to check compilation
   — running the suite to confirm green is the Tester's job, but a compile
   check is yours to deliver.
2. Your own worktree carries the repaired files (same relative paths).

## Report back

Board topic `agent-core/assay-recall`, type=finding, prefix `TESTMAKER-R2:` —
what changed (file:line), compile evidence. Then idle for collection.
