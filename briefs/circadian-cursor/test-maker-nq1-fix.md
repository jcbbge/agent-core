# AGNT test-maker — nQ1 correction (bad tests)

Do NOT use emojis. Arbiter nQ1 ruled BOTH qa-verify failures **bad test**.
Fix tests only. Do not touch `cursor-spine`. Do not commit.

## Pre-Verified Facts (ORCH + arbiter, this session)

- Integrated tree: coder cold-start fix present; Circadian C1-C6 PASSed.
- `grep -c '^ck ' docs/qa-verify.sh` = 100.
- Suite run: 98 passed, 2 failed — `working tree clean` and `C8: PASS count >= 100`.
- Arbiter (pane w2M:pG): both BAD TEST. Coder not implicated.

## Parallel Work Notice

Coder partition `cursor-spine` is done — do not modify it. You own
`docs/qa-verify.sh` and optionally `docs/QA-lever-integration-2026-08-11.md`.

## Tower

- Board topic `cursor-shim/circadian-wake`. spine-report task/verdict.
- `.done`: overwrite `~/agent-core/briefs/circadian-cursor/.done/test-maker`

## Tasks

1. Fix C8: change threshold from `>= 100` to `>= 99` (PASS visible to the 100th
   `ck` is at most 99), OR hoist the growth assertion after the total line
   outside `ck`. Done when: C8 can pass when all prior checks pass.
2. Fix `working tree clean`: per arbiter — drop `cursor-spine` from the
   porcelain path list (keep `cursor-fleet README.md rules`), so a legitimate
   pre-commit verify of a cursor-spine unit is not auto-failed. Add a one-line
   comment that spine cleanliness is gated by CORD commit / post-land. Done
   when: with only `cursor-spine` + `docs/*` dirty, that ck PASSes.
3. Re-run `bash docs/qa-verify.sh` in your worktree (or main if you edit
   there — prefer the existing test-maker worktree
   `/Users/jrg/.cursor/worktrees/cursor-shim/wt-agnt-test-maker-w2m-pb` if it
   still exists; otherwise edit `~/cursor-shim/docs/qa-verify.sh` which ORCH
   already integrated). Done when: TOTAL FAIL=0 and PASS >= 99.

## Constraints

- Touch ONLY docs/qa-verify.sh (+ optional QA-lever doc note). No mocks.
- No live pane spawns in the suite.

## Report back with

- Diff summary; qa-verify TOTAL line; deviations.
