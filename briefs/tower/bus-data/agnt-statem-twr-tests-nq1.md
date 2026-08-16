# AGNT [statem-twr-tests-nq1] — bounce: fix clipped-body assert (BAD TEST)

Repo unit `statem-twr-residuals`. ORCH Verify: 7/8 pass; one fail is BAD TEST. Do NOT use emojis. Do not commit. Do not read or edit `statem.ts` / `twr.ts` product code.

## Pre-Verified Facts (ORCH verified 2026-08-13 this session)

- Failure at `primitives/tools/statem/statem-twr-residuals.test.mjs:372` — expects `hay` to contain exact `OUTER discovery→commit`, but `twr` clips long lines to terminal width, so stdout shows `OUTER disc…`. TRANSITIONS/FINDINGS headers and integrity line already pass.
- Same test's `oracle non-statem finding` substring may also be width-sensitive — prefer anchors that survive clip (e.g. `/OUTER disc/`, `/oracle non-statem/`, or match `statem@` / topic markers).
- Work file lives on branch worktree: `/Users/jrg/.cursor/worktrees/agent-core/wt-orch-bus-data-residuals/primitives/tools/statem/statem-twr-residuals.test.mjs` (also copy criteria if assert mapping changes).
- After fix, run: `cd /Users/jrg/.cursor/worktrees/agent-core/wt-orch-bus-data-residuals && bun test primitives/tools/statem/statem-twr-residuals.test.mjs` — done when 8/8 pass.

## Parallel Work Notice

- Product code already integrated — touch tests/criteria/dones only.
- COMMS bounce is a sibling — ignore.

## Tower

- Topic `tower/bus-data`, from=`AGNT statem-twr-tests-nq1`. CLAIM then `.done`.

## Tasks

1. Loosen/fix the clipped-body assert(s) so they validate render presence without requiring full unclipped body text. — done when: 8/8 `bun test` pass in orch worktree.
2. Update criteria note if needed.
3. Write `briefs/tower/bus-data/agnt-statem-twr-residuals-tests-nq1.done`.

## Constraints

- Touch ONLY: `primitives/tools/statem/statem-twr-residuals.test.mjs`, `primitives/tools/statem/statem-twr-residuals.criteria.md`, `briefs/tower/bus-data/agnt-statem-twr-residuals-tests-nq1.done`. Prefer orch worktree paths above. Do not commit.

## Report back with

- test command + 8/8 output
- `.done` path
