# AGNT [w4-rotate-arbiter] — Rule two red tests (nQ round 1)

You are the arbiter. Rule each failure as exactly one of: **bad test** |
**bad implementation** | **pre-existing / out-of-scope**. Do NOT use emojis.
Do not fix code yourself — only write the ruling.

## Pre-Verified Facts (ORCH verified 2026-08-13)

- Integrated tree: `/Users/jrg/.spine/worktrees/agent-core/w4-retention`
- Command: `cd /Users/jrg/.spine/worktrees/agent-core/w4-retention && bun test primitives/mcps/tower/rotate.test.mjs`
- Result: **12 pass, 2 fail** (ORCH ran this; EXIT 1).
- Fail A — `Phase-2 --dry-run may plan but live shrink still blocked without env`
  at `rotate.test.mjs:271`: expects exit code 0 for
  `['--store','board','--phase','2','--dry-run']` without
  `TOWER_ROTATE_PHASE2_OK`; received exit 1.
- Fail B — `--store all skips pheromones with defer/no-op message` at
  `rotate.test.mjs:443`: expects stdout/stderr to match
  `/pheromone|defer|skip|no-op/` for `--store all --phase 1 --dry-run`;
  received output listing board/ledger/odometer/flight/deliverables only
  (no pheromone line).
- POLICY: Phase-2 refuses without `TOWER_ROTATE_PHASE2_OK=1`; pheromones
  deferred with message on `--store pheromones`; `--store all` should skip
  pheromones. Brief: dry-runable; Phase-2 refuses without env.
- Artifacts: `primitives/mcps/tower/rotate.mjs`,
  `primitives/mcps/tower/rotate.test.mjs`,
  `briefs/tower/w4-retention-evidence/POLICY.md`.

## Parallel Work Notice

Ignore w3-plane-fixes. Topic `tower/w4-retention`.

## Tower

CLAIM/findings on `tower/w4-retention`. Write ruling to
`briefs/tower/w4-retention-evidence/ARBITER-nQ1.md` and
`…/agnt-w4-rotate-arbiter.done`.

## Tasks

1. Read POLICY §4, rotate.mjs Phase-2 + all-store behavior, and the two
   failing test blocks — done when: cited in ruling with paths.
2. Rule Fail A — done when: one of bad-test / bad-impl / out-of-scope with
   one-sentence reason and which agent to re-brief.
3. Rule Fail B — done when: same.
4. Marker — done when: ARBITER-nQ1.md + .done written under evidence dir
   in the integrated worktree path above.

## Constraints

- Touch ONLY evidence files under
  `briefs/tower/w4-retention-evidence/ARBITER-nQ1.md` and
  `agnt-w4-rotate-arbiter.done`. No production edits. No commit.

## Report back with

Per-failure ruling + re-brief target (coder | test-maker | none).
