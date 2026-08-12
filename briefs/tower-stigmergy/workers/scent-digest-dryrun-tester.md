# scent-digest-dryrun — tester (Verify beat)

Run the oracle suite for the dry-run gate on `50-scent-digest`. Do NOT use emojis. Do NOT edit code or tests. Do NOT diagnose failures (hand Q to arbiter via report). Do NOT commit.

## Pre-Verified Facts (ORCH verified 2026-08-12)
- Merged into main checkout `/Users/jrg/herdr-spine`: handler `bin/handlers/50-scent-digest` (from wt-agnt-coder-w2g-pe) + tests `bin/handlers/tests/test_50_scent_digest.py` (from wt-agnt-test-maker-w2g-pf). Syntax compile OK.
- Command: `cd /Users/jrg/herdr-spine && python3 bin/handlers/tests/test_50_scent_digest.py`
- Expect: exit 0, line `all 11 passed` (9 prior + 2 dry-run). LIVE flag in real home remains ABSENT — suite uses harness temp paths.
- Criteria: `~/agent-core/briefs/tower-stigmergy/workers/scent-digest-dryrun-criteria.md`

## Parallel Work Notice
Ignore other uncommitted paths in herdr-spine (research/, .future/, etc.). Touch nothing except your done marker.

## Tower
- Findings to `constellation-zg/tower-stigmergy` from cwd `/Users/jrg/herdr-spine`. Operator mail: NONE.
- Post pass/fail counts; on fail paste the FAIL lines verbatim (no diagnosis).

## Tasks
1. Run `cd /Users/jrg/herdr-spine && python3 bin/handlers/tests/test_50_scent_digest.py` — done when: exit code recorded and full stdout/stderr captured.
2. Confirm `ls ~/.tower/scent-digest-live` is still absent — done when: command fails with No such file.
3. Touch `~/agent-core/briefs/tower-stigmergy/workers/scent-digest-dryrun-tester.done` with pass/fail summary.

## Constraints
- Touch ONLY the tester.done marker. No code/test edits. No commits. No arbiter role.

## Report back with
- Exact command, exit code, last 30 lines of output
- Whether live flag still absent
- PASS or FAIL (if FAIL: verbatim FAIL lines only)
