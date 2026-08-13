# Test criteria — W0 seam / agnt-w0-driftcheck

Authored by `orch-w0-canonical-source` from the plan only, BEFORE the implementation
agent was spawned. The implementation agent did not author these. Each assert maps to
a done-when criterion in `~/agent-core/briefs/tower/agnt-w0-driftcheck.md`.

The point of this unit is that a future divergence FAILS something instead of waiting
for a human to notice. Criteria are dominated by **the check actually catches a real
divergence**, **it extends the existing assets rather than duplicating them**, and
**the known-failing baseline is neither fixed nor hidden**.

## The check exists and is sound (T4a)

| Assert name | Criterion |
|-------------|-----------|
| `check runs with no arguments` | Invocable with no args, no network, and exits 0 against the current byte-identical state; output pasted |
| `exits non-zero on divergence` | Divergence produces a non-zero exit — a message alone is not sufficient |
| `message names file and locations` | Failure output names the diverging file AND which locations disagree, not just "drift detected" |
| `symlink and regular file both handled` | The check compares effective content (resolved + hashed), so it behaves identically whether the deployed path is a real file or a symlink |
| `three contested files covered` | `server.mjs`, `stop-verdict.mjs`, `ask-bridge.mjs` are all checked across every location that claims ownership |
| `scope stated for the rest` | The report says what was decided about the other 16 files and about the orphan at `primitives/hooks/stop-verdict.mjs`, with a reason either way |
| `wired, not duplicated` | The check is reachable from the existing `server-drift.*` assets; there is no second parallel drift system |
| `runtime stated` | The report gives the measured runtime and says whether it is fast enough to run as a hook |
| `does not write to ~/.tower` | Running the check creates/modifies nothing under `~/.tower/` |

## It provably catches drift (T4b)

| Assert name | Criterion |
|-------------|-----------|
| `full cycle pasted` | Output shows pass → deliberate divergence → FAIL → revert → pass, all four states |
| `divergence was harmless` | The introduced divergence is a comment or a scratch copy — never a behavioural change |
| `divergence never written under ~/.tower` | If the scenario could not be built without a forbidden write, it was built in a sandbox and the report says so |
| `revert proven` | Revert is demonstrated by sha or `git status`, not asserted — nothing left behind |
| `failure message is useful` | The pasted FAIL output would tell a cold reader which file to look at |

## The criteria file tells the truth (T4c)

| Assert name | Criterion |
|-------------|-----------|
| `stale assumption removed` | Rows treating `~/herdr-spine/cc-hooks/server.mjs` as "install.sh canonical source" (line 18) are corrected to match what the sibling worker actually changed |
| `sibling coordinated, not assumed` | The board was read before finalising; the update reflects `agnt-w0-install-reconcile`'s real change, not a guess about it |
| `new asserts added` | The criteria file gains rows for what the new check asserts |
| `pre-existing failures preserved` | The four known-failing criteria remain present and honestly marked — not deleted, not silently "fixed" |
| `diff justified line by line` | The pasted diff has a one-line justification per changed row |

## The baseline is neither fixed nor hidden

| Assert name | Criterion |
|-------------|-----------|
| `counts re-reported exactly` | Both suites re-run and reported as pass/fail/total numbers, compared against 7/4/11 and 25/1/26 |
| `named failures unchanged` | The four server-drift failures and the one cli.test failure are named and still failing for the same reasons |
| `new failure escalated` | Any NEW failure is reported as a stop-and-report event to the ORCH, not repaired quietly |
| `W3 defects not repaired` | The `relay_inbox` and `board-finding` failures are left alone; observations about them are reported, not fixed |
| `suites run from scratch cwd` | Test runs happen outside `~/.tower` and outside the worktree's tower dir, so cwd-relative state cannot leak |

## The doc (T5)

| Assert name | Criterion |
|-------------|-----------|
| `four questions answered` | A reader learns where to edit Tower, why, what happens if they edit the deployed path instead, and how to run the drift check |
| `under a minute` | The added section is short enough to read in under a minute; length is defended, not padded |
| `README not rewritten` | The existing README structure authored by `agnt-w0-readme` is preserved; this is an append or amend |
| `consequence is concrete` | "What happens if you edit the deployed path" states an actual mechanism, not a warning to be careful |

## Workspace discipline

| Assert name | Criterion |
|-------------|-----------|
| `worked in the worktree` | All repo edits are under `/Users/jrg/.spine/worktrees/agent-core/w0-canonical-source`; nothing edited under `/Users/jrg/agent-core/primitives/` |
| `evidence in the main checkout` | `E3-*` evidence files are under `/Users/jrg/agent-core/briefs/tower/w0-canonical-source-evidence/` and no `E1-*`/`E2-*` file was modified |
| `no mutating git command ran` | Nothing staged, branched, stashed or committed by this agent |
| `no writes under ~/.tower` except .done | The only write under `~/.tower/` is the final `.done` file |
| `gaps stated` | Anything unproven is named as a gap; no silent assumptions |
