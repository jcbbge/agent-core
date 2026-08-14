# C2 Arbiter — rule on Q: T-C2-CANONICAL-POINTER (nQ round 1 of 3)

> From: cord-agent-core, 2026-08-12. You are the ARBITER for unit C2. A test failed. You rule exactly ONE of: **bad test** (back to test-maker), **bad implementation** (back to coder), or **pre-existing/out-of-scope** (escalate to CORD). You diagnose; you do NOT edit code or tests yourself.

## The Q

Tester run 1 (authoritative, coder worktree): `T-C2-CANONICAL-POINTER: canonical not factored per spec` — FAIL. All 8 other criteria PASS, including byte-exact hand-composed entrypoint matches. Full tester finding: board `agent-core/cursor-parity` @ 2026-08-12T16:41:41Z; evidence file `~/agent-core/briefs/cursor-parity/c2-tester-results.md`.

## The materials (read all three)

- The test: `/Users/jrg/.cursor/worktrees/agent-core/wt-agnt-test-maker-w2b-p5/cli/test/integration/c2_acceptance.sh`, function `test_canonical_factored` (~line 229). It requires: (a) canonical contains the string `Harness deltas live in primitives/directives/`; (b) canonical does NOT contain lines starting `**Claude Code:**` or `**cursor:**`.
- The implementation under test: `/Users/jrg/.cursor/worktrees/agent-core/wt-agnt-coder-w2b-p4/primitives/AGENTS.md` (factored canonical, staged not committed).
- The spec (binding design): `/Users/jrg/agent-core/briefs/cursor-parity/unit-c2-directive-composition.md` § Design 1 — the canonical's Harness deltas section is "replaced by a pointer line ('Harness deltas live in primitives/directives/<harness>.md; deployed entrypoints are composed — edit sources, not deployed files')". Also on the board: coder's before/after finding @ 16:34:03Z describing the pointer it actually wrote.

## The question you must answer

Does the canonical's actual pointer line satisfy the DESIGN (a pointer to primitives/directives/ + edit-sources-not-deployed), with the test's exact-string expectation being the mismatch (bad test)? Or does the canonical's pointer genuinely fail the design (bad implementation)? Note the design's parenthetical wording is itself a paraphrase — judge intent: pointer present, harness bullets factored out, edit-sources instruction carried.

## Report-back

Post ONE finding to board `agent-core/cursor-parity` from `agnt-c2-arbiter`, addressed to cord-agent-core: your ruling (bad test | bad implementation | out-of-scope), the evidence (quote the actual pointer line from the canonical AND the test's expectation), and the prescribed next step (what the test-maker or coder must change, specifically). Then write `/Users/jrg/agent-core/briefs/cursor-parity/.done/c2-arbiter-r1.done`.
