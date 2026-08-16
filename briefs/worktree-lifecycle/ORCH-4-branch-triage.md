# ORCH — Unit 4: triage the preserved branches (agent-core, cursor-shim, herdr-spine)

You are the **orchestrator** for one unit of work. You decompose, dispatch,
verify, and reap. You never implement production code. This brief is binding and
self-contained.

Do NOT use emojis anywhere.

## Why this unit exists

On 2026-08-16 a sweep reclaimed 85 orphaned git worktrees (1.06 GB) across four
repos. It **preserved every branch rather than adjudicating them, deliberately**
— preserving is cheap and reversible, deleting is not. Each preserved branch
carries a `wip(<branch>):` commit holding whatever was uncommitted at the time.
Any of them can be recovered with `git worktree add <path> <branch>`. Nothing
was lost. Most are near-certainly superseded by the integration branch. Your
unit produces the written verdict and deletes only the ones that are provably
redundant.

## Pre-Verified Facts (coordinator verified each one personally, 2026-08-16)

**A correction to the parent brief, which you must carry into your report.** The
parent brief states "117 branches were preserved (79 in agent-core, 34 in
cursor-shim, 4 in herdr-spine)". Direct measurement at dispatch does not match:

| Repo | total local branches | fleet-named (`wt-*` or `spine/*`) | branches whose tip subject contains `wip(` |
|---|---|---|---|
| `~/agent-core` | 79 | 64 | 29 |
| `~/cursor-shim` | 49 | 38 | 18 |
| `~/herdr-spine` | 30 | 23 | 1 |
| **total** | **158** | **125** | **48** |

The `117` figure reconciles with none of these columns. Treat the numbers above
as ground truth, state the discrepancy in your report, and do not delete
anything on the strength of a count.

**Your scope is frozen.** A snapshot was taken at dispatch, one line per branch,
format `name|sha|committerdate|subject`:

```
~/agent-core/briefs/worktree-lifecycle/evidence/branches-agent-core-2026-08-16.txt
~/agent-core/briefs/worktree-lifecycle/evidence/branches-cursor-shim-2026-08-16.txt
~/agent-core/briefs/worktree-lifecycle/evidence/branches-herdr-spine-2026-08-16.txt
```

You may delete **only** branches appearing in those files. A sibling
orchestrator is actively creating and deleting test worktrees and branches in
all three repos right now; anything not in the snapshot is not yours, no matter
how orphaned it looks.

**Ancestry is the wrong test.** The fleet squash-merges. All 47 agent-core
branches examined during the sweep showed as unmerged under
`git branch --merged` even though their artifacts had already landed. You must
compare **content**, not ancestry. A branch is superseded when the content it
introduced already exists in the integration branch, by whatever route.

**Repo state at dispatch:**

- `~/agent-core` — HEAD `main`, 2 files dirty (untracked briefs, expected).
- `~/herdr-spine` — HEAD `main`, clean.
- `~/cursor-shim` — HEAD is **`feat/a5-batch-record`**, not `main`, and clean.
  Determine and verify each repo's actual integration branch before comparing
  against it; do not assume. **Never switch the checked-out branch of any main
  worktree**, and never delete a branch that is checked out anywhere.
- All four repos are at 0 worktrees. `~/.cursor/worktrees` and
  `~/.spine/worktrees` are empty. `git fsck` on agent-core is clean.
- `git branch -d` refuses an unmerged branch; because of squash merges most of
  these will require `-D`. That means **your content test is the only safety
  net** — git will not catch your mistake for you. Weigh accordingly: when the
  evidence is ambiguous, keep the branch. A kept branch costs a ref; a deleted
  one costs the work.

**Branch name shapes present:** `wt-agnt-coder-<pane>`,
`wt-agnt-test-maker-<pane>`, `wt-orch-*`, `wt-verify-*`, `wt-finish-*`,
`spine/w0-*`. Names encode the spawner and pane, not the content — do not judge
a branch by its name.

## Parallel Work Notice

Two sibling orchestrators are running right now.

- **Unit 1 orchestrator** owns four files in `~/agent-core/primitives/`.
- **Unit 2+3 orchestrator** owns `~/herdr-spine/**` and `~/cursor-shim/**`
  entirely, and is creating and destroying real worktrees and branches there as
  it tests. This is why your scope is the frozen snapshot.

**Your partition — you may write exactly one file:**

```
~/agent-core/briefs/worktree-lifecycle/BRANCH-TRIAGE.md
```

Plus git ref deletions inside the frozen snapshot. No source file in any repo is
yours. If you find a bug in a spawner, post a finding; do not fix it.

A live agent wrote `~/agent-core/briefs/house/sagt-harness-parity-live-2026-08-16.md`
during the sweep. Do not investigate, revert, or fix it. Outside your partition.

## Tower (mid-run communication)

**Tower is MAILBOX ONLY this session.** `~/.tower/PHASE2-WRITE-GATE-PROOF.md`
does not exist, so the write gate is unproven. Do not describe Tower as
operational and do not build any part of this work on the assumption that it is.

- Findings and claims: board topic `agent-core/worktree-lifecycle`.
  `bun ~/.tower/cli.mjs post <claim|finding|note> agent-core/worktree-lifecycle "<body>" --from "<your role>"`.
  Read before claiming files. Do not hand-append JSON to `board.jsonl`.
- Self-report: `~/herdr-spine/bin/spine-report task "<what I'm doing>"` at unit
  start, `spine-report verdict "<result>"` when done.

**MANDATORY — the stigmergic field.** Ranks 1-4 coordinate through the
environment, never by talking to each other directly
(`~/.tower/COMMS-ARCH.md` plane 5).

- **Emit** work others could take: `work-available` with topic, payload ref, and
  **mandatory evidence** — an emit without evidence is not an emit.
- **Read the field before ever going idle.** Open work you can take, you claim
  (`work-claimed`, `ref`-ing the exact pheromone id) and do.
- **`work-done`** `ref`-ing what you claimed. **`need-help`** instead of going
  quiet, carrying `nq` (default 3 minus escalations), expressed as a route
  derivation hint resolving one link up the lineage, never a hard address.
- **nQ=0 before deliverable.** Never emit `work-done` holding open questions.
- **Heartbeat your claims.** TTL 30s, heartbeat at roughly ttl/3, or the claim
  evaporates and the work returns to the field. That evaporation is what
  protects the fleet from a dead agent, and it only works if agents heartbeat.
- Verbs: `bun ~/.tower/cli.mjs emit <scent> <topic> <payload_ref> [--ref id]
  [--to-role r] [--evidence path] [--ttl N]` and `... field`.
- **Two acceptable stopping conditions, and only these:** every done-condition
  met, or a posted `need-help`/BLOCKED naming what is needed and who owns it,
  *after* proceeding with everything that does not depend on it. "Reported and
  awaited instruction" is not a stopping state.

## Tasks

**1.** Define and validate a content-supersession test before triaging anything.
For each branch, determine whether it holds content that exists nowhere in the
repo's integration branch. Ancestry (`git branch --merged`, `git merge-base
--is-ancestor`) is disqualified — see Pre-Verified Facts. Blob-level comparison
of each file the branch touched, against the integration branch tip, is the
obvious approach; you own the design. Validate it on a handful of branches whose
answer you have independently confirmed by reading the files, before you run it
across all of them.
- **Done when:** the test is written down in the report, and its validation
  cases are named with their independently-confirmed answers.

**2.** Produce a written verdict per branch — **superseded**, or **holds unique
content** with the specific files named. Delete the superseded ones. Anything
holding unique content stays, with a one-line note on why, so a successor is not
left guessing.
- **Done when:** `~/agent-core/briefs/worktree-lifecycle/BRANCH-TRIAGE.md` exists
  and covers **every branch in the three snapshot files** with a verdict and
  evidence each; the superseded ones are deleted; and a post-deletion
  `git for-each-ref refs/heads` per repo, quoted in the report, matches the
  verdicts exactly.

**3.** Anything you cannot decide is a **keep**, listed under its own heading
with what evidence would settle it.
- **Done when:** the undecided section exists (even if empty) and every entry
  names the missing evidence.

## Constraints

- **Deletion is the irreversible half of this unit.** When in doubt, keep. An
  extra ref is free; the work is not.
- Do not delete a branch outside the frozen snapshot, for any reason.
- Do not delete or move `main`, `feat/a5-batch-record`, or any branch checked
  out in any worktree.
- Do not switch the checked-out branch of any main worktree.
- **Do not re-run the worktree sweep.** It is complete and verified.
- Do not bypass `credential-guard`, the grounding hook, the write gate, or the
  spawn door. A refusal is information, not an obstacle.
- Do not run dependency install from a worktree: `bun install`/`prepare` from a
  worktree can corrupt the shared repo's `core.hooksPath`.
- **One write per file per thought.** `BRANCH-TRIAGE.md` is a large document —
  compose it and write it once, not incrementally.
- **Workers never commit.** You verify and report. The coordinator lands.

## Report back with

- Each done-when quoted, with the evidence that satisfied it: command run,
  output tail, file path.
- The content-supersession test you used and how you validated it.
- Verdict counts: how many superseded and deleted, how many kept and why, how
  many undecided, per repo and in total.
- The reconciliation of the parent brief's `117` against what you measured.
- Any done-when you could not satisfy, what blocked it, and what you did with
  everything that did not depend on it.
- Deviations from this brief with the reason. If a Pre-Verified Fact turns out to
  be wrong, say so plainly and cite what you found instead — that is the most
  valuable thing you can report.
