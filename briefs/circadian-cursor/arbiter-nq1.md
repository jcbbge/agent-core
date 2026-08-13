# ARBITER — Q from circadian-wake verify run

Do NOT use emojis. One ruling per failure. nQ round 1 of 3.

## Failures under test (ORCH reproduced on integrated main worktree)

Command: `cd ~/cursor-shim && bash docs/qa-verify.sh`
Result: `===== TOTAL: 98 passed, 2 failed =====`

### Failure 1 — `working tree clean`
Assertion:
```
[ -z "$(git status --porcelain cursor-spine cursor-fleet README.md rules)" ]
```
At reproduce time `git status --short` showed:
```
 M cursor-spine
 M docs/QA-lever-integration-2026-08-11.md
 M docs/qa-verify.sh
```
These are the integrated unit diffs, not yet committed (CORD lands commits).

### Failure 2 — `C8: PASS count >= 100 (90 baseline + new)`
Assertion runs near end of suite: `[ "$PASS" -ge 100 ]`.
`docs/qa-verify.sh` now contains exactly 100 `ck` lines (was 90). When C8
evaluates, at most 99 prior checks can have incremented PASS (C8 is the 100th).
Even with a fully clean tree and all prior checks green, PASS at C8 time is 99,
so C8 cannot pass. Off-by-one against the suite's own check count.

Coder artifact (cursor-spine cold-start --resume removal) is present on the
integrated tree; Lever 4 / Circadian C1-C6 assertions that encode the new
contract all PASSed in the same run.

## Pre-Verified Facts
- Suite output captured by ORCH this session; 98/2.
- `grep -c '^ck ' docs/qa-verify.sh` → 100.
- Baseline at 6c85350: 90 ck lines.

## Report back with
Exactly one ruling per failure: **bad test** | **bad implementation** |
**pre-existing / out-of-scope**. One sentence reason each. If bad test, state
the minimal correction. Then stop.
