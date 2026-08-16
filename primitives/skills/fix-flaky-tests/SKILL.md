---
name: fix-flaky-tests
description: Investigate and fix flaky or intermittently-failing tests. Triggers on a flaky-test issue or CI URL, a test that "passes on retry" or "fails in CI but passes locally", a bot that skipped a test, or a request to reopen/dispute a flaky-test diagnosis. Adapted for the arc stack (Bun test + GitHub Actions + Neon-branch integration tests) from intercom/2x-skills fix-flaky-tests (universal methodology).
metadata:
  author: jrg (ported from intercom/2x-skills, MIT)
  version: "1.0"
  tags: testing, flaky-tests, ci, bun-test, github-actions, arc
  gateway: strudel pantry (roots ~/.pi/agent + ~/agent-core/primitives)
---

# Fix Flaky Tests

Investigate and fix flaky tests. The methodology is universal; the stack idioms below are
tuned for **arc**: `bun test` (via `turbo run test`), GitHub Actions (`validate.yml`), and
DB-backed integration tests on isolated Neon branches (`ci-pr-<n>`). Compose the workflow to
the situation — don't march through rigid steps.

<HARD-RULES>
- NEVER skip a test (`.skip`, `test.skip`, `it.skip`, `.todo`, commenting-out) as a fix.
- NEVER fabricate a root cause — if you can't identify it, say so and stop.
- NEVER propose a fix without the actual CI error (exception + stack from the CI logs, or
  pasted verbatim by the user). Code-only analysis produces plausible-but-wrong hypotheses.
- NEVER proceed if the CI error cannot be established. Stop and ask. There is no
  "reduced-confidence" mode.
- NEVER assume infrastructure flakiness without build-wide evidence (many unrelated tests
  failing in one run).
- Only fix if you can identify the root cause with HIGH confidence.
- NEVER claim a fix is complete until CI is green. A "fix" that fails CI is not a fix.
- Verification comes from a green CI build, NEVER a local run. arc's local `bun test` cannot
  replicate CI's parallelism, the shared Neon branch, `APP_ENV=test` varlock env, or
  cross-test ordering — a local pass means almost nothing.
- Local reproduction during INVESTIGATION (observing state as the bug happens) is a
  different, allowed activity.
</HARD-RULES>

## Required input
One of: a flaky-test issue link · a test file path · a GitHub Actions run URL with a failing
job · an advisory question · a request to reopen/dispute a *closed* flaky-test issue.

**Disputed / already-closed issues — re-derive, don't trust the close.** Treat any prior
investigation or closing comment as a hypothesis. Re-establish root cause from the actual CI
logs. Closing comments are frequently plausible-but-wrong (cite a mechanism that doesn't
match the real stack trace, or apply the infra fast-exit to a run where only ONE test
failed — the opposite of build-wide infra evidence, usually meaning that one test is
uniquely fragile).

## Detect the arc stack (one line, then proceed)
- Framework: `bun test` — specs are `*.test.ts`; run a single package with
  `bunx turbo run test --filter=@arc/<pkg>` or a file with `bun test path/to/x.test.ts`.
- CI: GitHub Actions `.github/workflows/validate.yml` (PR, merge_group, deploy gate).
- DB-backed tests: `@arc/api` + `@arc/agent-surface` run CI-only against a real Neon branch
  with `APP_ENV=test` (varlock loads `.env.test`). They are intentionally excluded from
  pre-push and from the fast unit suite — a local run will fail on varlock schema validation
  with no DB/env context, NOT because the test is broken.
- Testing policy: arc enforces a **no-mocks** invariant (`ci/verify-no-mocks.mjs`) — tests
  run against real data. Any "fix" that reaches for `mock()`/`spyOn`/`vi.mock` is banned and
  will fail the gate.

## Fast exits (cheap — no CI logs needed)
Check these BEFORE fetching logs. They rely only on git + PR history, so they resolve an
issue even when logs expired.

**Already fixed** (many issues have a merged fix but were never closed):
- `git log --oneline --since="<issue_date>" -- <test_file>`
- `git log --oneline --since="<issue_date>" -- <source_file>`
- `gh pr list --search "<test_file_name>" --state merged --limit 5`
If a relevant merged fix appears, STOP and report it. Partial-fix guard: if new flaky issues
were filed *after* the fix date for the same file, the fix was partial — continue.

**Existing open PR:** `gh pr list --search "<test_file_name>" --state open` — review it
rather than starting over.

**Broken, not flaky:** `git log --oneline -10 -- <test_file>` and `-- <source_file>`.
Signals: ALL tests in the file fail, deterministically, every run. Fix = update the test's
setup for the new dependency; this is not a flake.

**Historical recurrence (systemic):**
`gh search issues "<test_file_name>" --json number,state,createdAt | jq 'length'`. If 3+
issues exist for one file, read ALL prior fix PRs, find the common vulnerability, fix it
systemically — fixing only the reported test regenerates the issue within weeks.

**Bot skips:** an automated tool "fixing" a flake by skipping it is never valid.
| Bot skipped | Root cause fixed | Action |
|---|---|---|
| Yes | Yes | Revert the skip, open a PR restoring coverage |
| Yes | No  | Revert the skip AND fix the root cause in one PR |

## CI log access (HARD GATE)
If the fast exits didn't resolve it, you're doing a real investigation and the actual CI
error is essential. Fetch the failing job's logs:
- `gh run list --workflow=validate.yml --branch <branch> --limit 5`
- `gh run view <run-id> --log-failed` (or `gh run view --job <job-id> --log`)
Extract: exception class + message + stack trace, total failed-test count, which unique
files are affected.

**If logs are unavailable** (expired, retrieval empty), ask the user to paste the error
verbatim — equivalent to a fetched one. Stop and wait rather than guessing. Don't retry
failing log calls more than twice per session.

## Classify (framework-agnostic categories)
broken-not-flaky · global-state poisoning · test-ordering dependence · timing/race ·
suffix/uniqueness collision · resource exhaustion · external-service flake ·
shared-DB-branch contention (arc-specific: two tests on the same Neon branch racing on the
same row/sequence) · async-not-awaited.

**Infrastructure fast-exit:** a build-wide pattern (many unrelated tests across several
files failing in one run) almost always means infrastructure (Neon branch unavailable, cold
start), not a test bug — close the issue, no code fix. A single-file/single-test failure is
the opposite of infra evidence.

**Quick heuristics:** passes on retry in the same build → test-side
(state/ordering/timing/async). All tests in a file fail every run → broken by a code change.

## Investigate root cause
Reproduction ≠ verification. Reproduction runs the test to observe state during the bug (a
way to close a confidence gap). Most CI flakes do NOT reproduce locally — limit to 2 local
attempts per hypothesis.
- **State poisoning** (common): the poisoner is usually a sibling test mutating shared state
  (a module-level singleton, a DB row it doesn't clean up) without restoring it. Confirm by
  running it before the victim.
- **Timing:** wall-clock assertions without a frozen clock; too-short async waits;
  un-awaited promises.
- **Shared-DB contention:** two specs writing the same fixture key on one Neon branch. Fix
  with per-test unique keys, not retries.
- **Resource issues:** prefer the infra fast-exit over a test-side fix.

## Propose and implement the fix
Only with a HIGH-confidence root cause. Fix at the SOURCE, not the symptom — a per-test
workaround masks the systemic bug and gets copied by the next engineer.

**Scope before writing:** grep the suite for the root-cause pattern. If >1 test is
vulnerable, the fix belongs in source or a shared helper, not copied into each test. Lead
the PR with the systemic fix; any unskip is secondary. Respect arc's no-mocks invariant —
harden with real setup/teardown, not mocks.

If you cannot identify the root cause, STOP. Report what you found and tried. No speculative
changes.

Open the PR with arc's PR workflow (see the `create-pr` discipline / `scripts/review-pr.sh`),
not a push to main.

## Verify the fix
**Green CI is the only authoritative signal.** The fix is complete only when the PR build is
green; keep iterating on the branch until it passes. For CI-only flakes, use
measurement-driven verification: compare failure rates between a baseline branch (unchanged)
and an experiment branch (fix) over N builds each, excluding infra noise. Note arc's
`validate.yml` cancels superseded runs per ref (`cancel-in-progress: true`), so baseline and
experiment need SEPARATE branches. When CI fails on an UNRELATED test, do not modify it in
your fix PR.

## Sweep for siblings
Same-file first — most recurring flakes share a vulnerability with siblings in the same
file, and a partial fix is the leading cause of recurrence. Fix every hit of the unsafe
pattern in the reported file before the PR goes out. A suite-wide sweep is secondary (blast
radius + whether to lift the fix into a shared helper).

## Update guidance
After every fix, ask: "Could this skill have caught this earlier or more completely?" If the
root cause is a new arc-specific category (e.g. a new shared-DB contention shape), note it
here or in `references/ci-only-flakes.md`.

## References
- `references/ci-only-flakes.md` — which categories reproduce locally vs CI-only; noise
  filtering; measurement-driven verification.
