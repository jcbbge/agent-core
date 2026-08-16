# AGNT [w4-rotate-fix-tests] — Fix Fail A only (bad test)

Model: haiku. Do NOT use emojis. Do not commit.

## Pre-Verified Facts (ORCH verified)

- Integrated tree: `/Users/jrg/.spine/worktrees/agent-core/w4-retention`
- Fail A at `primitives/mcps/tower/rotate.test.mjs:271`: Phase-2 `--dry-run`
  without `TOWER_ROTATE_PHASE2_OK` returned exit 1; test expected 0.
- ORCH ruling nQ1: **bad test**. POLICY §4: Phase-2 refuses without env —
  no dry-run exception. Align test: expect non-zero exit (and/or refusal
  message) for Phase-2 dry-run without env; keep the separate test that
  Phase-2 `--apply` also refuses.
- `bun test primitives/mcps/tower/rotate.test.mjs` currently 12 pass / 2 fail;
  you own only Fail A. Ignore Fail B (coder lane).

## Parallel Work Notice

Coder AGNT simultaneously fixes Fail B in `rotate.mjs` only. Do not edit
`rotate.mjs` or `tower-ledger.mjs`. Topic `tower/w4-retention`.

## Tower

CLAIM on `tower/w4-retention`. Done marker:
`briefs/tower/w4-retention-evidence/agnt-w4-rotate-fix-tests.done`.

## Tasks

1. Edit only the Fail A test (Phase-2 dry-run without env) so it expects
   refusal (non-zero) consistent with POLICY — done when: that test passes
   against current `rotate.mjs` without requiring code changes.
2. Run `bun test primitives/mcps/tower/rotate.test.mjs` — done when: Fail A
   gone; report remaining Fail B if still present (expected until coder lands).
3. Write `.done` marker with test tail.

## Constraints

- Touch ONLY: `primitives/mcps/tower/rotate.test.mjs` and the `.done` file.
- cwd: `/Users/jrg/.spine/worktrees/agent-core/w4-retention`
- No commit. No mocks.

## Report back with

Diff summary for the one test; bun test counts.
