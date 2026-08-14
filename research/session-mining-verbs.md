# Session mining: command verbs and workflow optimization

**Date:** 2026-08-11  
**Corpus:** 20 Claude Code sessions + 20 pi sessions, processed as two sequential batches of 10 per harness  
**Observed shell calls:** 2,246 (1,597 CC, 649 pi)  
**Observed result bytes:** 1,988,837

## Method

Selection followed the brief: files over 100 KiB, older than 30 minutes at selection time, excluding `private-tmp`, newest real project directories first with cwd diversity. A schema-inspection script examined one transcript per harness and emitted shapes only; raw transcript bodies were never loaded into the agent context. Harness-specific Python extractors then paired shell calls with results and appended aggregate rows to `commands.csv`, one batch at a time.

CC extraction matched assistant `tool_use` items named `Bash` to `tool_result.tool_use_id`; pi extraction matched assistant `toolCall` items named `bash` to `toolResult.toolCallId`. The extractors recovered 2,246 calls with 1 missing result. The first token was classified after leading environment assignments, `env`, and `sudo`; selected multi-command tools also received a subcommand. A call was rewrite-eligible only when it had no compound/newline, pipe, heredoc, substitution, or machine-format flag.

`commands.csv` schema:

`harness, batch, session_id, cwd, project_key, source_path, call_id, ordinal, command, command_safe, command_sha256, command_norm_sha256, first_token, verb, subcommand, compound, pipe, heredoc, substitution, machine_format, result_bytes, result_lines, result_nonempty_lines, result_unique_lines, result_max_line_bytes, result_sha256, exit_code, is_error, result_missing`

Six selected pi batch-1 sessions contained no bash calls; they remain in the 10-session batch because selection was transcript-based, not shell-call-based. Across the full corpus, CC contributed 71.1% of calls and pi 28.9%.

## Sessions

### Batch 1

**CC (10):**
- `6a214495-e55e-4441-9e0e-634f410f7d96`
- `46a3311d-2a6e-439d-9c65-69b486ba4d40`
- `6af78d4d-0b3b-4ebe-95a6-6cdf8297b69f`
- `03775b43-7056-47e7-a0f9-a5a0841a3875`
- `7e40a784-9e11-4bf5-9257-2e73bbddd467`
- `c25606ea-f5ff-4b59-8ee4-ec9a69dc94f5`
- `cec7a4e9-f7f7-40f7-99a6-0b0b439b00b6`
- `24d0345a-d921-4c93-9c7a-26982258186b`
- `0f25bfca-2d13-4304-a894-f9e81a69cc61`
- `65288f57-a069-4c82-9262-4d50a6e30140`

**PI (10):**
- `2026-08-11T18-15-57-199Z_019ff209-d00f-7e0f-ad9a-9203e17710b4`
- `2026-08-11T17-44-30-094Z_019ff1ed-048e-7e93-88d4-65f39d8cf7cb`
- `2026-08-11T17-09-51-604Z_019ff1cd-4d74-7de4-ba6c-8e47cf6b2555`
- `2026-08-11T17-06-59-003Z_019ff1ca-ab3b-7100-bf2a-84df50da0183`
- `2026-08-11T15-28-11-701Z_019ff170-39b5-7fe4-87fb-ed68cf1e6a8c`
- `2026-08-11T05-31-08-264Z_019fef4d-9a67-7558-9bcc-3faffae05939`
- `2026-08-10T19-32-59-136Z_019fed29-fa80-796c-a6fb-7569400f02a1`
- `2026-08-10T18-35-43-576Z_019fecf5-8e58-7f76-8df3-50911b9beb20`
- `2026-08-09T20-55-58-052Z_019fe84f-9764-7bc1-ac66-2d6e7162f130`
- `2026-08-08T19-06-23-328Z_019fe2c4-e8e0-79f9-b5ed-1065fae2eb5a`

### Batch 2

**CC (10):**
- `488a676e-78e4-40f2-9522-bae81a66550a`
- `67f57884-d098-4a2b-a52a-5ddb6f345014`
- `72634997-0a10-497a-a480-def3ca2f33e7`
- `b4071b54-4e75-40e7-aa69-92ee03308070`
- `b443dcbc-c98e-4f4a-8ca5-b129e7b66e41`
- `f452f6b9-9d4d-4fc7-8d1b-3c07a620b254`
- `d4a05a61-6085-4f63-84ec-ff5d8994bfc9`
- `5177663a-c870-4862-80af-394e36462b01`
- `cd7776b7-1a09-4757-b6ad-6a9fe17138d5`
- `576edaaf-39b9-4f59-b680-bebed4b92fff`

**PI (10):**
- `2026-08-08T15-22-20-169Z_019fe1f7-c889-7744-9c46-9b0a2259678a`
- `2026-08-06T21-45-24-013Z_019fd909-c52d-76c5-9e1d-2363182226a3`
- `2026-08-05T03-01-27-943Z_019fcfde-6b07-7b46-a5d4-f503357decb8`
- `2026-08-04T18-14-53-367Z_019fcdfc-52b7-7a9d-aa2c-420b77e3dae2`
- `2026-08-04T16-31-20-108Z_019fcd9d-842c-7e96-9bc8-a57664651d2a`
- `2026-08-04T16-45-51-416Z_019fcdaa-cfb8-79f0-92ed-a768d41cd7ea`
- `2026-08-03T23-03-59-647Z_019fc9de-a59f-7f13-9557-2b0daeb66d63`
- `2026-08-03T23-03-56-591Z_019fc9de-99af-7244-abb6-5c18c1841d78`
- `2026-08-03T23-03-02-382Z_019fc9dd-c5ee-7cfa-b5b2-5ab55d7a9317`
- `2026-08-03T23-03-53-531Z_019fc9de-8dbb-7e15-a466-94803ddfe596`

## Ranked verb tables

Ranking score is `call count × median result bytes`; total bytes are retained separately so a few large results remain visible.

### Batch 1 — 10 CC + 10 pi

| Rank | Command | Calls | Total B | Median B | Calls × median | Eligible calls |
|---:|---|---:|---:|---:|---:|---:|
| 1 | `cd` | 167 | 230,672 | 576 | 96,192 | 0 |
| 2 | `herdr pane` | 157 | 155,474 | 273 | 42,861 | 3 |
| 3 | `herdr agent` | 156 | 41,670 | 273 | 42,588 | 24 |
| 4 | `echo` | 48 | 57,226 | 702 | 33,696 | 0 |
| 5 | `grep` | 89 | 56,636 | 373 | 33,197 | 3 |
| 6 | `sed` | 17 | 29,106 | 1,485 | 25,245 | 7 |
| 7 | `ls` | 54 | 35,985 | 362 | 19,548 | 1 |
| 8 | `head` | 10 | 22,063 | 1,748 | 17,480 | 1 |
| 9 | `bb` | 24 | 15,673 | 257 | 6,168 | 0 |
| 10 | `herdr api` | 24 | 13,214 | 212 | 5,088 | 0 |
| 11 | `python3` | 64 | 46,250 | 76 | 4,864 | 0 |
| 12 | `bun test` | 9 | 9,565 | 437 | 3,933 | 0 |
| 13 | `test` | 2 | 3,592 | 1,796 | 3,592 | 0 |
| 14 | `git log` | 2 | 3,514 | 1,757 | 3,514 | 0 |
| 15 | `cat` | 21 | 14,544 | 167 | 3,507 | 0 |
| 16 | `wc` | 6 | 5,610 | 530 | 3,180 | 1 |
| 17 | `rtk` | 3 | 4,604 | 816 | 2,448 | 0 |
| 18 | `bun run` | 4 | 2,149 | 582 | 2,328 | 0 |
| 19 | `git status` | 12 | 6,415 | 189 | 2,268 | 0 |
| 20 | `herdr 2>&1` | 1 | 2,253 | 2,253 | 2,253 | 0 |

### Batch 2 — next 10 CC + 10 pi

| Rank | Command | Calls | Total B | Median B | Calls × median | Eligible calls |
|---:|---|---:|---:|---:|---:|---:|
| 1 | `cd` | 379 | 336,523 | 333 | 126,207 | 0 |
| 2 | `sed` | 26 | 127,291 | 3,513 | 91,338 | 14 |
| 3 | `grep` | 159 | 150,619 | 326 | 51,834 | 40 |
| 4 | `tail` | 15 | 64,400 | 1,796 | 26,940 | 6 |
| 5 | `git show` | 10 | 40,972 | 2,423 | 24,230 | 4 |
| 6 | `ls` | 61 | 46,315 | 333 | 20,313 | 0 |
| 7 | `head` | 10 | 20,204 | 1,910 | 19,100 | 1 |
| 8 | `echo` | 57 | 34,672 | 333 | 18,981 | 1 |
| 9 | `bun test` | 28 | 33,875 | 674 | 18,872 | 0 |
| 10 | `rg` | 23 | 19,331 | 565 | 12,995 | 3 |
| 11 | `find` | 8 | 17,784 | 1,554 | 12,432 | 0 |
| 12 | `git log` | 9 | 10,733 | 1,351 | 12,159 | 0 |
| 13 | `bun [script]` | 23 | 29,283 | 507 | 11,661 | 7 |
| 14 | `ws-e3-sandbox-path.txt)` | 1 | 8,691 | 8,691 | 8,691 | 0 |
| 15 | `source` | 16 | 21,909 | 494 | 7,904 | 0 |
| 16 | `ws-e2-sandbox-path.txt)` | 1 | 6,615 | 6,615 | 6,615 | 0 |
| 17 | `herdr pane` | 5 | 4,316 | 1,118 | 5,590 | 0 |
| 18 | `cat` | 15 | 25,793 | 366 | 5,490 | 6 |
| 19 | `for` | 11 | 10,248 | 498 | 5,478 | 0 |
| 20 | `lsof` | 16 | 7,979 | 333 | 5,328 | 0 |

### Merged top 20

| Rank | Command | Calls | Total B | Median B | B1 rank | B2 rank | Stability |
|---:|---|---:|---:|---:|---:|---:|---|
| 1 | `cd` | 546 | 567,195 | 381 | 1 | 1 | stable |
| 2 | `sed` | 43 | 156,397 | 2,289 | 6 | 2 | stable |
| 3 | `grep` | 248 | 207,255 | 333 | 5 | 3 | stable |
| 4 | `herdr pane` | 162 | 159,790 | 273 | 2 | 17 | persisted |
| 5 | `herdr agent` | 159 | 43,248 | 273 | 3 | 40 | batch1-only |
| 6 | `ls` | 115 | 82,300 | 333 | 7 | 6 | stable |
| 7 | `echo` | 105 | 91,898 | 357 | 4 | 8 | stable |
| 8 | `head` | 20 | 42,267 | 1,850 | 8 | 7 | stable |
| 9 | `tail` | 19 | 67,638 | 1,131 | 24 | 4 | batch2-only |
| 10 | `git show` | 11 | 42,697 | 1,906 | 25 | 5 | batch2-only |
| 11 | `bun test` | 37 | 43,440 | 490 | 12 | 9 | stable |
| 12 | `git log` | 11 | 14,247 | 1,405 | 14 | 12 | stable |
| 13 | `rg` | 24 | 19,362 | 529 | 81 | 10 | batch2-only |
| 14 | `bun [script]` | 23 | 29,283 | 507 | — | 13 | batch2-only |
| 15 | `for` | 24 | 15,156 | 379 | 21 | 19 | batch2-only |
| 16 | `ws-e3-sandbox-path.txt)` | 1 | 8,691 | 8,691 | — | 14 | batch2-only |
| 17 | `wc` | 24 | 32,662 | 362 | 16 | 23 | batch1-only |
| 18 | `python3` | 75 | 52,628 | 115 | 11 | 37 | batch1-only |
| 19 | `source` | 16 | 21,909 | 494 | — | 15 | batch2-only |
| 20 | `cat` | 36 | 40,337 | 214 | 15 | 18 | stable |

Stable signal: `cd`, `sed`, `grep`, `ls`, `echo`, `head`, `bun test`, `git log`, and `cat` stayed in both batches' top 20. `tail`, `git show`, `rg`, and arbitrary `bun` scripts were batch-2-heavy. Herdr status commands were concentrated in batch 1.

The literal first-token ranking makes `cd` look like the dominant output producer, but it is a wrapper artifact: 536 leading-`cd` calls carried 557,889 result bytes from downstream commands. Script-only reclassification found the largest downstream groups were `echo` (152 calls, 171,720 B), `grep` (49, 67,279 B), `for` (9, 54,751 B), and `bun test` (39, 36,005 B).

## Verb verdicts

The safety boundary used here is slim's truth contract: raw passthrough is preferable to a compact rendering that changes requested source, search, patch, or test evidence. The measured projections below are from the eligible result bodies: duplicate-line suppression and a 200-line first/last cap. Neither transform produced a safe new verb.

| Command | Verdict | Evidence and filter judgment |
|---|---|---|
| `cd` | **HARNESS-SIDE** | Shell-context wrapper, not an output grammar. All 546 calls were compound and 0 were rewrite-eligible. Use the shell tool's working-directory field; downstream reclassification accounts for the real verb. |
| `sed` | **HARNESS-SIDE** | Line-oriented source extraction whose selected bytes are the requested content. The 21 eligible calls produced 89,055 B; duplicate-line removal projected only 1.7% and a 200-line cap 0%. Prefer bounded Read. |
| `grep` | **HARNESS-SIDE** | Line-oriented search, but counts, filenames, and duplicate matches are semantic. The 43 eligible calls produced 14,411 B; duplicate-line removal projected 1.6% and a 200-line cap 0%. Prefer native search. |
| `herdr pane` | **HARNESS-SIDE** | Control-plane status should expose a concise CLI/API mode. Only 3 of 162 calls were eligible (750 B); the rest were composed or piped. |
| `herdr agent` | **HARNESS-SIDE** | Control-plane wait/status output. Only 24 of 159 calls were eligible (6,895 B); repeated waits dominate the retry families, so event delivery is the correct layer. |
| `ls` | **KEEP v1** | Existing proven filter. This corpus had 115 calls but only 1 eligible call (144 B), because most uses were piped or compound; the fixture-backed v1 savings remain the stronger evidence. |
| `echo` | **SKIP** | Shell control/debug output with arbitrary payloads. 104 of 105 calls were compound; the sole eligible call produced 37 B. |
| `head` | **SKIP** | Already a user-selected bound; further shortening changes the requested slice and repeats rtk's known short-read hazard. Two eligible calls produced 7,584 B; a 200-line cap projected 0%. |
| `tail` | **SKIP** | Already a user-selected bound. Seven eligible calls produced 50,720 B; duplicate-line removal projected 4.9% but is unsafe because repeated lines are meaningful, and a 200-line cap projected 0%. |
| `git show` | **SKIP** | Default output is a patch; dropping context or duplicate lines changes evidence. Four eligible calls produced 31,754 B; duplicate-line removal projected 0.1% and a 200-line cap 0%. |
| `bun test` | **HARNESS-SIDE** | Reporter-specific structured output belongs in test-runner adapters. All 37 calls were piped or compound, leaving 0 rewrite-eligible calls. |
| `git log` | **KEEP v1** | Existing format-injected filter with explicit omission markers. Eleven calls produced 14,247 B; corpus eligibility was 0 because these invocations were composed or carried blocked shapes. |
| `rg` | **HARNESS-SIDE** | Search semantics vary by flags and duplicates can be meaningful. Three eligible calls produced 1,898 B; both duplicate-line and 200-line projections saved 0%. Prefer native search. |
| `bun [script]` | **HARNESS-SIDE** | Arbitrary scripts have no stable output grammar. Seven eligible calls produced 19,034 B; duplicate-line removal projected 0.3% and a 200-line cap 0%. |
| `for` | **SKIP** | Shell syntax rather than a standalone command grammar. All 24 calls were compound; 0 were eligible. |
| `ws-e3-sandbox-path.txt)` | **SKIP** | Classifier artifact from a substitution-led compound, not a real verb. One call, 8,691 B, 0 eligible. |
| `wc` | **KEEP v1** | Existing formatting-only filter. Twenty-four calls produced 32,662 B; 5 eligible calls produced 427 B. |
| `python3` | **SKIP** | Arbitrary program output has no stable grammar. One of 75 calls was eligible and produced 316 B. |
| `source` | **SKIP** | Shell builtin used for environment setup, not a stable output producer. All 16 calls were compound; 0 were eligible. |
| `cat` | **HARNESS-SIDE** | File bytes are the requested payload; compaction changes content and repeats rtk's multi-file corruption class. Six eligible calls produced 12,179 B; duplicate-line removal projected 0%. Prefer bounded Read. |

### ADD verdict

**None. Projected safe savings: 0 B.** Of 2,246 calls, only 166 (7.4%) were eligible under slim's current refusal rules, carrying 243,668 B (12.3% of observed result bytes). A generic 200-line cap saved 0 B across every eligible candidate. The largest duplicate-line projection was only 4.9% (`tail`), but deleting repeated lines changes evidence. No new verb met both frequency/byte value and the truth contract.

## Slim v2 verb table recommendation

| Verb | v2 action | Basis |
|---|---|---|
| `ls` | KEEP | Existing fixture-backed formatting filter; corpus usage is frequent but mostly composed. |
| `ps` | KEEP | Existing measured 98% fixture savings; corpus is not evidence to remove it. |
| `wc` | KEEP | Formatting-only and truth-preserving. |
| `df` | KEEP | Existing measured fixture, small implementation shared with `ps`. |
| `git status` | KEEP | Structured porcelain input and explicit path omission markers. |
| `git log` | KEEP | Structured format injection and explicit body omission markers. |
| any new verb | DO NOT ADD | No candidate produced a safe, measured compaction opportunity. |

The v2 table should therefore remain the closed six-verb table. Put source/search/test/status improvements in harness-native tools or the producing CLI, not in a general stdout rewriter.

## Optimization findings

### 1. Retry loops

The script found 33 exact ≥3-repeat loops and 26 near-identical families. Exact loops contained 162 calls beyond the first attempt. The largest exact loops were intentional Herdr waits: 30 repeats of one blocked/done wait and 25 repeats of a working/blocked wait, both with 0 errors. The largest failing exact loops were 10/10 failures checking `~/.orbstack/run/` and 7/8 failures of one `lsof` listener probe.

Recommendation: distinguish waits from retries in telemetry; for waits, subscribe once to a board/process-state event. For definitive path/probe failures, stop after the first unchanged failure and run one prerequisite/readiness check rather than replaying the same command.

### 2. Oversized results

**None found above 50 KiB.** The maximum result was 20,021 B, the median was 333 B, and the 200-line cap projected 0 B of savings for every eligible candidate. Recommendation: keep the 50 KiB detector as an observability guard, but do not add a generic cap based on this corpus.

### 3. Failure patterns

There were 298 error-marked calls (13.3%). Classification found 274 generic errors, 16 syntax errors, 3 timeouts, 3 missing-file errors, and 2 test failures. No command-not-found, permission-denied, unknown-option, connection, or not-running category recurred. Ten of the 16 syntax errors were `grep`-classified calls; repeated readiness probes accounted for prominent generic failures (`docker ps` 14, `lsof` 13).

Recommendation: treat generic error output as structured in the harness so exit codes and categories do not collapse into one bucket; preflight shell quoting for search commands; replace repeated Docker/socket polling with one readiness primitive.

### 4. Hook friction

CC transcript hook records contained 1,826 hook executions totaling 922,998 ms, with 355 over one second and 60 hook error items. `afplay` alone accounted for 312 calls and 657,476 ms (71.2% of measured hook time), all over one second. Tower-labelled hook commands accounted for 252 calls and 224,052 ms (24.3%). Together they consumed 95.5% of measured hook time.

Recommendation: make audio notification fire-and-forget outside the blocking hook path, then profile the Tower hook as the second target. This is higher-leverage than adding a new stdout filter.

## Surprises

1. **The rewrite boundary dominates the opportunity.** 2,080 of 2,246 calls (92.6%) were ineligible because they were compound, piped, substitution-based, heredoc-based, or machine-formatted. The current six verbs had only 8 eligible calls and 650 eligible bytes in this sample. Extending the verb registry would barely touch observed traffic unless the boundary changed; changing that boundary would reintroduce the corruption classes slim was designed to remove.
2. **Hook latency dwarfs candidate compaction.** Measured hook time was 922,998 ms, while all eligible result payloads combined were only 243,668 B. Blocking audio alone consumed 657,476 ms.
3. **The harness split is asymmetric.** Six of the first ten selected pi sessions had no bash calls, while all 20 CC sessions did. Shell-frequency conclusions are therefore stronger for CC, but the second pi batch still contributed 512 calls and exposed the failed readiness-probe pattern.
4. **No result crossed 50 KiB.** The highest-value output-control work in these sessions is not a generic result cap; it is preventing repeated commands and blocking hooks.

## Limitations

- This is a recent, project-diverse sample, not a randomized historical census. One CC session contributed 431 batch-1 calls, so Herdr-heavy patterns are visible but not population-weighted.
- Rank is intentionally the brief's frequency × median metric. It favors common moderate outputs and can under-rank rare large results; total bytes are shown beside it.
- Failure classification is regex-based over aggregate result bodies. The 274 generic errors need better structured exit metadata before finer attribution is defensible.
- A projected percentage is reported only for transforms actually measured by script. No hypothetical custom-filter percentage is invented.

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
