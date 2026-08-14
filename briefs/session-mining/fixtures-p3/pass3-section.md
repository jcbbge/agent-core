## Pass 3 (20 sessions)

**Date:** 2026-08-11
**Corpus:** 10 Claude Code sessions + 10 pi sessions, processed as two sequential batches of 5 CC + 5 pi
**Observed shell calls:** 988 (618 CC, 370 pi)
**Observed result bytes:** 1,049,463

### Method and selection

Selection reused the pass-1/2 metadata-first method: transcript files over 100 KiB, older than 30 minutes, excluding `private-tmp` directories and all 40 prior session IDs. Batch 1 and batch 2 each contained exactly 10 sessions (5 CC + 5 pi), and the script asserted zero overlap and no duplicate IDs. Raw transcript bodies were read only by extractors and scanners; analysis consumed their aggregate CSV/JSON outputs. Four batch-1 pi sessions had no shell calls and remain part of the selected corpus.

All 20 selected transcripts predate slim's adoption commit (`2026-08-11T18:58:56Z`); the newest selected transcript was last modified at `2026-08-11T18:52:21Z`. This pass therefore remains an rtk-era/historical baseline and contains no direct slim-era behavior to evaluate.

### Batch tables

| Batch | Sessions | Calls | Top five by calls × median result bytes |
|---|---:|---:|---|
| 1 | 10 | 234 | `cd` 57 calls/84,436 B; `echo` 12/32,307 B; `herdr pane` 33/33,643 B; `git status` 1/11,374 B; `herdr 2>&1` 3/7,901 B |
| 2 | 10 | 754 | `cd` 247 calls/256,656 B; `cat` 27/42,275 B; `sed` 15/38,670 B; `python3` 23/40,386 B; `echo` 47/41,762 B |

The durable `fixtures-p3/selection.json`, extractor summaries, `analysis.json`, and `commands.csv` preserve the session IDs and full ranked tables.

### Three-pass rank stability

Here P1 and P2 are the two prior 20-session cohorts; P3 is this 20-session cohort. A dash means the command was below the stored top 50 or absent.

| Command | P1 rank | P2 rank | P3 rank | Stability |
|---|---:|---:|---:|---|
| `cd` | 1 | 1 | 1 | top-20 all three |
| `sed` | 6 | 2 | 2 | top-20 all three |
| `herdr pane` | 2 | 17 | 3 | top-20 all three |
| `cat` | 15 | 18 | 4 | top-20 all three |
| `echo` | 4 | 8 | 5 | top-20 all three |
| `grep` | 5 | 3 | 6 | top-20 all three |
| `curl` | 29 | 45 | 7 | P3 surge |
| `python3` | 11 | 37 | 8 | P1 + P3 |
| `tail` | 24 | 4 | 9 | P2 + P3 |
| `herdr 2>&1` | 20 | — | 10 | P1 + P3 |
| `ls` | 7 | 6 | 11 | top-20 all three |
| `herdr agent` | 3 | 40 | 12 | P1 + P3 |
| `sleep` | 40 | 35 | 13 | P3 surge |
| `export` | 32 | — | 14 | P3 surge |
| `set` | 36 | — | 15 | P3 surge |
| `while` | — | — | 16 | P3-only |
| `timeout` | — | — | 17 | P3-only |
| `git status` | 19 | — | 18 | P1 + P3 |
| `herdr spine-lab-probe` | — | — | 19 | P3-only |
| `for` | 21 | 19 | 20 | P2 + P3 |

The stable core is seven commands: `cd`, `sed`, `herdr pane`, `cat`, `echo`, `grep`, and `ls`. Project mix moves the rest substantially; `bun test` and `git log`, previously stable, left P3's top 20.

### Verdict stress-test

**HOLDS — add no slim verbs. Projected safe new savings: 0 B.**

Only 63 of 988 calls (6.4%) crossed slim's refusal boundary, carrying 83,181 B (7.9% of result bytes). A generic 200-line cap saved 0 B for every eligible candidate. The highest-ranked non-slim candidates still fail the truth boundary:

| Candidate | P3 evidence | Judgment |
|---|---|---|
| `sed` | 19 calls/47,878 B; 5 eligible/19,448 B; 3.4% duplicate-line projection | Source slices are requested evidence; deleting repeated lines is unsafe. |
| `herdr pane` | 108/101,396 B; 18 eligible/26,343 B; 7.3% duplicate-line projection | Repeated state is semantic. Compact status belongs in the producer/API, not a stdout rewriter. |
| `cat` | 30/43,729 B; 3 eligible/7,550 B; 0.9% duplicate-line projection | File bytes are the payload; compaction corrupts evidence. |
| `echo` | 59/74,069 B; 1 eligible/31 B | Arbitrary payload and almost entirely compound. |
| `grep` | 62/59,275 B; 6 eligible/794 B | Search matches and duplicates are semantic; native search is the correct layer. |
| `curl` | 8/22,735 B; 0 eligible | Arbitrary protocol payload and no rewrite-eligible evidence. |
| `python3` | 27/41,316 B; 0 eligible | Arbitrary program output has no deterministic grammar. |
| `tail` | 9/59,044 B; 5 eligible/22,870 B; 0% projected savings | Already user-bounded; further shortening changes the requested slice. |

The closed six-verb table (`ls`, `ps`, `wc`, `df`, `git status`, `git log`) remains the safe boundary. This sample contained 51 calls to those verbs, but only 12 eligible calls and 765 eligible bytes.

### Exact-repeat retry taxonomy

Three exact-repeat loops produced 10 calls and 7 excess calls.

| Class | Loops | Calls | Errors | Single best prevention |
|---|---:|---:|---:|---|
| Waiting on state | 1 | 4 | 0 | Subscribe once to the state/board event instead of replaying a polling script. |
| Repeated inspection | 1 | 3 | 0 | Read once and retain the result for the decision that triggered the inspection. |
| Error retry / malformed write | 1 | 3 | 2 | Stop after the first unchanged failure and validate the write path/API before retrying. |
| Flag-fumbling | 0 | 0 | 0 | None observed; keep pre-execution flag validation as the prevention. |
| Permission/trust | 0 | 0 | 0 | None observed; keep one preflight permission/trust check. |

Ten additional near-repeat families existed, but they are excluded from the exact-repeat counts above.

### Failure catalog

There were 85 error-marked calls (8.6%): 61 generic, 14 no-such-file/dead-path, 5 syntax, and 5 timeout. The 14 dead-path errors spanned 9 sessions; `echo`, `cd`, `ls`, and `sleep` each carried 2 such errors across 2 sessions, while `herdr pane` had 4 in one session. Syntax failures spanned 4 sessions; timeout failures spanned 2.

No missing-binary, unknown-option/wrong-flag, permission-denied, connection, or not-running category was found. No normalized command family failed on every invocation across two or more sessions. The best prevention remains path/readiness validation before execution; the aggregate shows a recurring failure class, not one universally broken command.

### Hooks and surprises

1. **Hook waste still dominates this historical sample.** CC recorded 266 hook executions and 161,961 ms. `afplay` contributed 53 calls and 111,276 ms (68.7%), all over one second; Tower-labelled hooks contributed 50 calls and 46,332 ms. Because every selected transcript predates the async-audio fix, this confirms the baseline problem but cannot validate the fix.
2. **The refusal boundary tightened further.** 925 of 988 calls (93.6%) were compound, piped, substitution-based, heredoc-based, or machine-formatted. Extending the registry would barely touch observed traffic.
3. **No oversized result appeared.** The maximum was 24,854 B; none crossed 50 KiB, and no eligible output benefited from the 200-line cap.
4. **Rank movement is workflow-shaped.** `curl`, `sleep`, shell control words, and a project-specific Herdr probe surged in P3, while prior stable test/log commands fell away. The seven-command core persisted, but the fringe is not stable enough to justify new global filters.

**Pass-3 verdict: HOLDS.** Fresh data does not break the pass-1/2 conclusion: no safe slim verb addition emerged, while retry/state handling and hook latency remain the higher-leverage targets.
