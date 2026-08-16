# AGNT [w4-rotate-fix-impl] — Fix Fail B only (bad impl)

Model: haiku. Do NOT use emojis. Do not commit.

## Pre-Verified Facts (ORCH verified)

- Integrated tree: `/Users/jrg/.spine/worktrees/agent-core/w4-retention`
- Fail B at `rotate.test.mjs:443`: `--store all --phase 1 --dry-run` output
  has no pheromone/defer/skip/no-op line.
- ORCH ruling nQ1: **bad implementation**. POLICY defers pheromones; brief
  requires no-op **with message**. `--store all` must print an explicit
  defer/skip/no-op line for pheromones (same as `--store pheromones`).
- Do not change Phase-2 refusal behavior (tests lane owns Fail A).

## Parallel Work Notice

Test-maker fixes Fail A in `rotate.test.mjs` only. Do not edit test files.
Topic `tower/w4-retention`.

## Tower

CLAIM on `tower/w4-retention`. Done:
`briefs/tower/w4-retention-evidence/agnt-w4-rotate-fix-impl.done`.

## Tasks

1. In `primitives/mcps/tower/rotate.mjs`, when `--store all`, emit a clear
   defer/no-op/skip line for pheromones — done when: Fail B regex would match
   combined stdout+stderr.
2. Do not weaken Phase-2 gating.
3. Write `.done` with the exact defer line text.

## Constraints

- Touch ONLY: `primitives/mcps/tower/rotate.mjs` and the `.done` file.
- cwd: `/Users/jrg/.spine/worktrees/agent-core/w4-retention`
- No commit. No mocks.

## Report back with

The defer line text; files touched.
