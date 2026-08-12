# assay-writer nQ1 coder fix (round 2)

Do NOT use emojis. Do not commit. Do not edit tests.

Arbiter nQ1 ruled BAD IMPLEMENTATION. Fix only these two defects under
`primitives/tools/assay/`:

## 1. classify.zig Label.parse trim args (AC3 hard fail)
File: `primitives/tools/assay/src/classify.zig` ~line 14.
Broken: `std.mem.trim(u8, " \t\r\n", text)`
Correct Zig order: `std.mem.trim(u8, text, " \t\r\n")`
Verified: wrong order makes parse("SHAPED") return null.

## 2. llm.zig Allocating-writer leaks (4 sites)
File: `primitives/tools/assay/src/llm.zig` — probe, probeChat, pickModel,
classifySnippet. After `const content = aw.toArrayList()`, the returned
ArrayList owns the bytes; `defer body.deinit` no longer frees them.
Fix ownership at each site (deinit the toArrayList result, or equivalent
proven pattern that does not leak under std.testing.allocator). Keep the
Allocating.fromArrayList + `&aw.writer` pattern — do not revert to
fromArrayList.

## Done when
- Only those two files touched (plus nothing else).
- `zig build` exits 0 from `primitives/tools/assay`.
- Do NOT run `zig build test` (tester wall).
- Board finding on `agent-core/assay-writer` with files + build exit.
- Model id preference for `"local"` stays.

## Constraints
Touch ONLY: `src/classify.zig` and `src/llm.zig` under
`primitives/tools/assay/`. No test edits. No golden run. No commit.
