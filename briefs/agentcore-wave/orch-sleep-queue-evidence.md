# ORCH [circadian stuck sleep entry: gather the evidence]

slug: `sleep-queue` · branch: `wave/sleep-queue` · repo: **`~/circadian`**, not `~/agent-core`

Read `CONTRACT.md` in this directory first. **Note the repo difference** — your
worktree comes off `~/circadian`, and your commits land there.

## Mission

`circadian-doctor` reports one hard FAIL: a pending-sleep queue entry that has
survived multiple REM drains and is explicitly marked as needing a human
decision. Sleep is how a session's experience becomes durable memory, so a stuck
entry means one session's worth of experience is sitting unconsolidated and
blocking a queue. Gather the evidence for a ruling: retry it, dead-letter it, or
discard it.

**Your task is evidence and a recommendation. Do not discard the entry, and do
not hand-edit the mind.**

## Pre-Verified Facts (verified 2026-08-20)

- `bun ~/circadian/src/doctor.ts` → summary `12 ok, 3 idle, 1 warn, 1 fail`.
- The FAIL, verbatim:
  `✗ FAIL pending sleep queue 1 stuck (attempts >= 8 or queued > 24h): 0754fda7-3587-40be-8528-5a51c638a7e2 — survived multiple REM drains; human decision required (1 episode(s) awaiting sleep re-run, oldest 2.8d ago)`
- The WARN, verbatim:
  `! WARN launchd agents com.circadian.doctor last exit 1 — fossil of a loud failure; clears on next healthy scheduled run`
- `~/circadian` is a git repo on `main`, HEAD `f905ebf`
  ("fix(wake): greeting path anchors must exist on disk").
- HEAD's commit body carries `TODO: REM cycle to regenerate greeting.md` — this
  may be related; verify rather than assume.
- Untracked in `~/circadian`: `briefs/pending-sleep-selfheal/done/orch-pending-sleep.done`
  and `logs/sleep-claims/`. **The `.done` marker strongly suggests a prior
  orchestrator already worked this exact problem.** Read it first; it may contain
  the analysis you would otherwise redo.
- Relevant commit history: `85ed43b` "fix(circadian/sleep): self-heal the pending
  sleep queue — dead-letter stuck entries" — so a self-heal path was built. Either
  it did not fire for this entry, or it fired and deliberately escalated. Determine
  which.
- Also relevant: `6033533` "fix(circadian/rem): break the greeting echo loop that
  tripped the R7 kill switch", `9cbe7e7` "fix(mind): kill switch armed by counting
  fan-out, not memory failure".
- Sources: `~/circadian/src/sleep.ts` (its header notes a past bug where "nothing
  digested" was indistinguishable from "ran fine"), `src/rem-popmem.ts`,
  `src/doctor.ts`, `src/janitor.ts`, and the obs ledger
  `~/circadian/logs/circadian.events.jsonl`.
- Test suite: the repo reports a green suite of 509 tests at commit `1b841a7`.
  Establish the current baseline yourself before changing anything.
- Law: `~/circadian/mind/MIND-SPEC.md` Law 7 — file reads only; the mind must
  never take a session down with it.

## Tasks

1. Worktree off `~/circadian` per CONTRACT.md, sparse-scoped to `src` and `briefs`.
   Branch `wave/sleep-queue`.
2. **Read the prior work first**: `briefs/pending-sleep-selfheal/done/orch-pending-sleep.done`
   and anything in `briefs/pending-sleep-selfheal/`. Summarize what was already
   established so you do not repeat it. If it already answers the question, say so
   and pivot to verifying its conclusion.
3. Locate the queue itself. Find where pending-sleep entries are stored and read
   entry `0754fda7-3587-40be-8528-5a51c638a7e2` in full: its payload, attempt
   count, timestamps, and any recorded error.
4. **Answer the core question: why does it fail?** Trace it through `sleep.ts`.
   Reproduce the failure if you can — run the sleep path against this entry in a
   way that cannot mutate the real mind (dry-run, copy, or test harness; read
   `sleep.ts` to find the safe route, and if none exists, say so rather than
   improvising one).
5. Determine whether the `85ed43b` dead-letter self-heal path applies to this
   entry and why it has not resolved it. Cite the code path.
6. Check `logs/sleep-claims/` — untracked and new. Establish what it is and whether
   it is part of this failure or unrelated.
7. Assess the blast radius: does one stuck entry block the queue for everything
   behind it, or only itself? Is the `com.circadian.doctor` exit-1 WARN caused by
   this FAIL, or independent?
8. Write `~/circadian/briefs/pending-sleep-selfheal/FINDING-0754fda7.md`:
   - one-paragraph verdict, operator-rulable alone;
   - root cause with code citations;
   - what the prior orchestrator already established;
   - **options with a recommendation** — likely (i) fix the underlying bug and
     re-run sleep on the entry, (ii) dead-letter it and move on, (iii) discard the
     episode as unrecoverable — each with what is lost and the default named;
   - whether the queue is blocked or merely non-empty;
   - what you did NOT verify.
9. If and only if you find a clear code defect with a small, well-tested fix, you
   may implement it **behind the existing test suite** — full suite must stay green
   and you must state the before/after counts. Otherwise change no code.
10. Commit. Deposit a `report` with the verdict inline, then `done`.

## Constraints

- **Do not discard or hand-edit the entry. Do not hand-edit anything under
  `mind/`** — that is the operator's private memory, a git repo with no remote,
  by design.
- Do not disable the doctor check to make the FAIL go away.
- Respect Law 7: nothing you do may make a session fail to start.
- Do not commit the untracked `logs/sleep-claims/` — investigate it, report it.

## Done-when

- `FINDING-0754fda7.md` exists with verdict, root cause + citations, options +
  recommendation, and the not-verified list.
- The prior `.done` marker's contents are summarized rather than rediscovered.
- The question "is the queue blocked or just non-empty" is answered with evidence.
- The dead-letter path's non-application is explained with a code citation.
- If you changed code: full suite green, before/after counts stated. If not: say
  so explicitly.
- `bun ~/circadian/src/doctor.ts` re-run and its current summary pasted.
- Committed on `wave/sleep-queue` in `~/circadian`.

## Report-back

Deposit `report` to `concierge` with the verdict paragraph and recommended option,
then `done`. Write `orch-sleep-queue-evidence.md.done` in the agentcore-wave
brief directory.
