# CI-Only Flakes: Why Local Reproduction Fails (arc)

Many flakes never reproduce locally because they depend on conditions that only exist in CI:
**concurrency** (parallel test workers + a shared Neon branch), **load** (slow responses,
timeouts, contention), and **environment** (a real Postgres via Neon, `APP_ENV=test` varlock
config, clean process state). A test that passes 100/100 locally can fail 1/10 in CI because
these add non-determinism a single dev machine lacks.

arc specifics: unit specs (`packages/*`) run under `bun test` via `turbo run test`; the
DB-backed suites (`@arc/api`, `@arc/agent-surface`) run CI-only against an isolated Neon
branch (`ci-pr-<n>` per PR, `dev-ci` for the deploy gate), torn down at the end of the run.
The no-mocks invariant means these hit real data — so contention and ordering are real.

## Categories that rarely reproduce locally

| Category | Why local passes | Fix |
|---|---|---|
| Suffix / identifier collision | Low-entropy ids are unique on one machine, collide across parallel workers | Append high-entropy uniqueness to the id |
| Shared-Neon-branch row/sequence race | No contention with one local process/DB | Per-test unique fixture keys; never a retry |
| Cache/TTL staleness | Cache ops are fast locally, slow under CI load | Lengthen TTL for the test or use an in-memory fake (NOT a mock — a real fake fixture) |
| Un-awaited async | Event loop drains fast locally; slow under load | Await the promise; assert after settle |
| Ordering-dependent global state | Local seed/order differs from CI's | Restore state in teardown at the source |

For these, local runs give zero signal. Limit local attempts to 2 per hypothesis; if it
passes twice, switch to measurement-driven verification.

## Measurement-driven verification (the only rigorous check for CI-only flakes)
1. **Baseline branch** (no fix): push unchanged, trigger N CI builds, record pass rate —
   excluding infra noise.
2. **Experiment branch** (with fix): push the fix to a *separate* branch, N builds, same
   noise exclusion.
3. **Compare:** for a ~10% failure rate, N=10 is a start; N=20+ gives clearer signal. If the
   rates are statistically indistinguishable, the fix probably isn't addressing the cause —
   return to classification.

**Separate branches are required:** arc's `validate.yml` sets `cancel-in-progress: true`
(concurrency group per ref), so pushing an experiment to the same branch kills the baseline
build. You cannot A/B two variants on one branch.

Trigger builds with `gh workflow run validate.yml --ref <branch>` and read results with
`gh run list --workflow=validate.yml --branch <branch>`.

## Filtering infrastructure noise
Exclude before computing pass rates: Neon-branch-unavailable / cold-start errors, OOM kills,
runner failures. If *every* failure in a batch is infra noise, the measurement is unreliable
and the test may not be flaky at all — take the infra fast-exit (close, no code fix).

## When local verification IS useful
For **test-ordering** or **state-poisoning** flakes, local reproduction with the right
seed/order often works — run the poisoner before the victim in one file. If it reproduces,
iterate locally (limit 2 attempts). Otherwise treat as CI-only.

## Decision table
| Situation | Local useful? | Strategy |
|---|---|---|
| State poisoning / ordering (known order) | Yes | Replay locally, iterate (≤2) |
| Suffix / identifier collision | No | Fix the id, push PR, monitor CI |
| Shared-Neon contention | No | Per-test unique keys, push PR, monitor CI |
| Infra (Neon unavailable / OOM) | No (no code fix) | Close the issue |
| Unknown / low confidence | No | Do NOT push a speculative fix — document findings, gather more CI samples, escalate to the owning team |
