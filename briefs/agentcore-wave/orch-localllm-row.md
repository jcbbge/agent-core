# ORCH [register the local LLM dependency]

slug: `localllm-row` · branch: `wave/localllm-row` · depends on: `orch-registry-vcs` landing first

Read `CONTRACT.md` in this directory first.

## Mission

The circadian memory substrate calls a local, OpenAI-compatible LLM service to
draft during SLEEP and REM. If that service is down, memory stops consolidating —
quietly. There is no registry row asserting the dependency, so the audit reports
green while the machine's memory silently stops learning. This is the smallest
brief in the wave and one of the more consequential: it is a hard runtime
dependency with zero coverage.

## Pre-Verified Facts (verified 2026-08-20)

- Endpoint: `http://127.0.0.1:10240/v1`, OpenAI-compatible. Named in
  `~/.claude.json`-adjacent doctrine as the machine's standing local-LLM service.
- launchd job: `~/Library/LaunchAgents/com.localllm.server.plist` exists. A stale
  sibling `com.localllm.server.plist.bak-20260713-143527` also exists — ignore it.
- Consumer: `~/circadian/src/llm.ts`. Its header documents the knobs
  `CIRCADIAN_LLM_BASE_URL` and `CIRCADIAN_LLM_MODEL`, and
  `CIRCADIAN_LLM_THINK` ("1" to allow the reasoning trace; default off).
- `~/circadian/install.sh` probes the endpoint at install time and emits:
  "circadian: WARNING — local LLM not reachable at $LLM_BASE_URL. SLEEP/REM
  drafting need it." So the dependency is already known and already
  soft-verified once, at install, and never again.
- `~/dotfiles/PORTS.md` is the canonical port registry and `~/dotfiles/UTILITIES.md`
  the utility index — confirm what each already records about port 10240 before
  writing anything.
- `~/circadian/src/doctor.ts` exists and runs a health check; current output is
  `12 ok, 3 idle, 1 warn, 1 fail`. Determine whether it already checks the LLM
  endpoint. If it does, your row should assert the checker, not re-implement it.
- Baseline: `agent-core status` → `359 ok  0 stale  0 missing`.

## The design problem you must solve

A registry row asserts something about **files** — a path exists, is executable,
is a symlink, or contains a needle. A row cannot make an HTTP request, so
`agent-core status` cannot directly prove a service is listening.

Read `~/agent-core/cli/src/presence.zig` to confirm the four verbs' exact
semantics, then choose what is honestly assertable. Candidates, in rough order of
preference — pick with reasons, do not attempt all:

- assert the **launchd plist exists** (the service is installed and will be
  brought up), which is a file fact and squarely within the grammar;
- assert the **consumer's configuration** names the endpoint, so a silent
  re-point of the base URL is caught;
- assert a **checker exists** — if `doctor.ts` probes the endpoint, row the
  checker and record in your report that liveness is doctor's job, not status's.

**Do not invent a verb, do not extend the CLI, and do not claim the row proves
liveness if it only proves installation.** Naming the limit precisely is the
deliverable. A row that overstates what it verifies is worse than no row: it
launders absence as coverage, which is the exact failure this wave exists to fix.

## Tasks

1. Worktree per CONTRACT.md, sparse-scoped to `primitives`.
2. Establish ground truth: is the service currently listening on 10240? Is the
   launchd job loaded? Record the commands and outputs.
3. Read `doctor.ts` and determine whether the endpoint is already health-checked
   there.
4. Add the row(s) you can honestly justify, in one appended block with a dated
   comment that states plainly **what the row proves and what it does not**.
5. Verify with `agent-core status`; the row must be ✓, and you must demonstrate it
   can fail (break the needle or path temporarily, capture the ✗, restore).
6. Update `primitives/COMPONENTS.md`: the local-LLM row's registry column, and
   gap 6 — corrected if partially closed, deleted if fully closed. If liveness
   remains unassertable, **rewrite gap 6 to say so precisely** rather than
   deleting it; a known, well-stated limit is a closed gap for our purposes.
7. Commit. Deposit `done`.

## Done-when

- Row(s) exist and are ✓, with a captured ✗ from the break test and the restored ✓.
- `agent-core status` reports 0 stale, 0 missing. Paste the summary line.
- Your report states, in one sentence, exactly what is now verified and what
  remains unverifiable by `status` alone.
- `primitives/COMPONENTS.md` gap 6 corrected or precisely restated, committed on
  `wave/localllm-row`.

## Report-back

Deposit `done` to `concierge` with the summary line, your row(s), the
break/restore evidence, and the one-sentence statement of the verification limit.
Write `orch-localllm-row.md.done`.
