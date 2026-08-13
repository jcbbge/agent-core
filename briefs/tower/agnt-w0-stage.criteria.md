# Test criteria — W0 / agnt-w0-stage (stage Tower's code set into agent-core)

Authored by `orch-w0-version-control` from the plan only, BEFORE any implementation
agent was spawned. The implementation agent (`agnt-w0-stage`) did not author these.
Each assert maps to a done-when criterion in
`~/agent-core/briefs/tower/agnt-w0-stage.md`.

This unit is a purely ADDITIVE copy onto a LIVE bus. The criteria are therefore
dominated by three properties: **the copy is faithful**, **the deployed tree is
untouched**, and **the canonical tree is independently sound**.

## Copy fidelity — 19 files land correctly (T2 done-when)

| Assert name | Criterion |
|-------------|-----------|
| `5 code files present` | `lib.mjs`, `cli.mjs`, `server.mjs`, `cli.test.mjs`, `server-drift.test.mjs` exist at `~/agent-core/primitives/mcps/tower/` |
| `4 doc files present` | `COMMS-ARCH.md`, `RESPONSIBLE-PARTY-AND-NQ.md`, `server-drift.criteria.md`, `server-drift.qa.md` exist there |
| `10 live hooks present` | `hooks/` holds exactly ask-bridge, deposit-reminder, enforce-brief, flight-recorder, odometer-stop, odometer, prompt-inject, session-start, stop-guard, stop-verdict — all `.mjs` |
| `19/19 sha256 match source` | Every one of the 19 canonical files sha256-matches its `~/.tower/` source; zero mismatches |
| `line counts preserved` | `cli.mjs` 296, `server.mjs` 350, `lib.mjs` 61, `cli.test.mjs` 180, `server-drift.test.mjs` 257 |
| `relative layout preserved` | `lib.mjs` sits at the canonical root and `hooks/` is its direct child, so `../lib.mjs` from a hook resolves to canonical `lib.mjs` |
| `spine-backup NOT copied into hooks` | `hooks/stop-verdict.mjs.spine-backup-20260812T221423Z` does NOT exist in the canonical `hooks/` (it belongs under `attic/hooks/`, owned by the sibling) |
| `README.md untouched` | canonical `README.md` still has its pre-task sha256 — this worker does not own it |
| `attic untouched` | This worker created nothing under `attic/` — that partition belongs to `agnt-w0-attic` |

## Non-mutation — `~/.tower/` is provably unchanged (the live-bus safety property)

| Assert name | Criterion |
|-------------|-----------|
| `baseline listing captured first` | A `ls -la ~/.tower/ ~/.tower/hooks/` listing was captured BEFORE any write |
| `deployed tree byte-identical after` | The after-listing diffs clean against the baseline for every code/doc file: same names, sizes, mtimes. (State files and `.done` files may legitimately change — other agents are live.) |
| `no file moved or renamed in ~/.tower` | All 19 source files still exist at their original `~/.tower/` paths |
| `no symlink created in ~/.tower` | No path under `~/.tower/` became a symlink during this task — the swap is a LATER unit |
| `cp not mv` | Sources still present, i.e. the operation was a copy |

## Canonical tree soundness — it works from its new home (T2-verify #3, #4)

| Assert name | Criterion |
|-------------|-----------|
| `import graph resolves without executing` | `bun build --target=bun <f> --outfile=/dev/null` exits 0 for all 13 of: canonical `cli.mjs`, `server.mjs`, `lib.mjs`, and the 10 canonical hooks |
| `no regression vs pre-move baseline` | The ORCH's pre-move baseline was 5/5 OK from `~/.tower/hooks/` (stop-guard, prompt-inject, session-start, odometer, odometer-stop). Those same 5 must still be OK from the canonical path |
| `hooks not executed during testing` | Verification used `bun build`, NOT `import()` — no hook was run (they read stdin and can block or fire real actions) |
| `cli status runs from canonical` | `bun ~/agent-core/primitives/mcps/tower/cli.mjs status` exits 0 and prints real data |
| `state-anchor property demonstrated` | That run reads `~/.tower/` state despite executing from agent-core — the observable proof that state is homedir-anchored, not code-relative |
| `no write verb invoked` | No `post`/write CLI verb was run from the canonical path during staging |

## Test honesty — exact counts, no silent fixes (T2-verify #5)

| Assert name | Criterion |
|-------------|-----------|
| `cli.test.mjs counts reported` | Exact pass/fail/skip integers reported for `bun test cli.test.mjs` run from canonical |
| `server-drift.test.mjs counts reported` | Exact pass/fail/skip integers reported for `bun test server-drift.test.mjs` run from canonical |
| `pre-existing failures named, not fixed` | Any failing test is quoted by name with its error, and its source file was NOT edited to make it pass |
| `no test file modified` | sha256 of `cli.test.mjs` and `server-drift.test.mjs` unchanged from source after the run |

## State safety around the test run (T2-verify #5)

| Assert name | Criterion |
|-------------|-----------|
| `state sampled before and after` | sha256 + `wc -l` of `board.jsonl` and `ledger.jsonl` captured immediately before and immediately after the test run |
| `append-only, never rewritten` | If either file changed, the pre-run sha256 still matches the corresponding line-count prefix of the post-run file — proving append, not rewrite |
| `rewrite triggers a stop` | If either file was rewritten rather than appended to, the agent halted and posted to the board instead of continuing |

## Reporting

| Assert name | Criterion |
|-------------|-----------|
| `board CLAIM posted before writes` | `board.jsonl` has a `tower/w0-version-control` row from `agnt-w0-stage` of type claim |
| `no mutating git command ran` | `git log -1` in `~/agent-core` unchanged from task start; nothing staged by this agent |
| `.done written last` | `~/.tower/agnt-w0-stage.done` exists, mtime at or after the final board post |

## Human-only

| Item | Criterion |
|------|-----------|
| `gaps stated plainly` | Report names anything unproven as an explicit gap rather than a silent assumption |

## Run command (verification, by the ORCH gate — not by the implementer)

```bash
CANON="$HOME/agent-core/primitives/mcps/tower"
for f in lib.mjs cli.mjs server.mjs cli.test.mjs server-drift.test.mjs \
         COMMS-ARCH.md RESPONSIBLE-PARTY-AND-NQ.md server-drift.criteria.md server-drift.qa.md; do
  cmp -s "$HOME/.tower/$f" "$CANON/$f" && echo "OK   $f" || echo "FAIL $f"
done
for h in ask-bridge deposit-reminder enforce-brief flight-recorder odometer-stop \
         odometer prompt-inject session-start stop-guard stop-verdict; do
  cmp -s "$HOME/.tower/hooks/$h.mjs" "$CANON/hooks/$h.mjs" && echo "OK   hooks/$h.mjs" || echo "FAIL hooks/$h.mjs"
done
# import graph, no execution
for f in "$CANON"/cli.mjs "$CANON"/server.mjs "$CANON"/lib.mjs "$CANON"/hooks/*.mjs; do
  bun build --target=bun "$f" --outfile=/dev/null >/dev/null 2>&1 \
    && echo "RESOLVE OK   $f" || echo "RESOLVE FAIL $f"
done
```
