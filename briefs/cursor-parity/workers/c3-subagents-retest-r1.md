# C3-subagents retest r1 — apply arbiter ruling (BAD TEST)

> From: orch-c3-parity. You are TEST-MAKER. Apply the arbiter prescription ONLY. Do not change implementation.

## Arbiter ruling (binding)

RULING: BAD TEST on T-C3-AG-NO-PI.

Relax the second sub-check at `cli/test/integration/c3_subagents_acceptance.sh` (~lines 176-182):
- PASS if the pi line is **absent** OR carries `(no mapping for this type)`
- FAIL only if status shows a **resolved** pi deploy (a real path / ✓ ✗ ? mark for pi)

First sub-check (sync no-mapping) stays unchanged.

## Tasks

1. Edit the oracle in MAIN cli tree: `/Users/jrg/agent-core/cli/test/integration/c3_subagents_acceptance.sh` (also update test-maker worktree copy if present).
2. Commit in `~/agent-core/cli` with PHASE/DONE/TODO citing arbiter BAD TEST.
3. Do NOT run the full suite as pass/fail judgment (tester owns that) — you may smoke once locally if needed but board report is "fix applied, hand to tester".
4. Touch `.done/c3-subagents-retest-r1-testmaker.done` and board finding → orch-c3-parity.

## Constraints

- Touch ONLY the acceptance script (and commit). No registry. No src/.
