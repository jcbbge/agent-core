# ORCH — Unit 1: write the missing worktree contract (agent-core)

You are the **orchestrator** for one unit of work. You decompose, dispatch,
verify, and reap. You never implement. This brief is binding and
self-contained.

Do NOT use emojis anywhere.

## Why this unit exists

On 2026-08-16 a sweep found 85 orphaned git worktrees consuming 1.06 GB across
four repos, oldest four days old. They were reclaimed by hand. The mechanism
that produced them is untouched. Worktrees are created by two independent
spawners and reclaimed reliably by neither, because **the concept of a worktree
is defined nowhere in the core**: `primitives/AGENTS.md` and
`primitives/rules/control-flow.md` never mention worktrees. `done = gone` in
control-flow.md is a law about **panes**. The worktree is a second resource the
same spawn creates, and no law names it.

Your unit writes that law. Two sibling units are running concurrently and are
building the enforcement you will describe; see Parallel Work Notice.

## Pre-Verified Facts (coordinator verified each one personally, 2026-08-16)

**Git's actual model — tested on git 2.50.1 (Apple Git-155), not assumed:**

- There is no sub-worktree and no worktree "split". `man git-worktree`
  DESCRIPTION: *"A repository has one main worktree and zero or more linked
  worktrees."* Two levels, flat, always.
- `git worktree add <path>/nested` **succeeds** when `<path>` is itself a
  worktree, but git registers all of them as flat peers. `git worktree remove`
  on the outer one **deletes the inner one's files** and leaves a `prunable`
  ghost in the registry. Verified by direct experiment. The current layout does
  exactly this (paths like
  `worktrees/wt-orch-a2-exhaust/wt-agnt-coder-w2y-p21`). The hierarchy is a
  fiction in the directory names and it is actively dangerous.
- **Sparse checkout is the real "split", and it is per-worktree.** Verified by
  experiment: `git worktree add --no-checkout <p>` then
  `git -C <p> sparse-checkout set apps/api` then `git -C <p> checkout` yields a
  worktree whose disk contents are **only** `apps/api/`, while the main worktree
  retains everything. The config lives at
  `.git/worktrees/<name>/info/sparse-checkout`.
- `man git-worktree`, same paragraph: *"When you are done with a linked
  worktree, remove it with git worktree remove."* The teardown obligation is
  already in git's own contract.

**Measured cost:**

- One agent-core worktree on disk is **21 MB**, of which `primitives/` is 16 MB
  and `briefs/` is 4.2 MB. An agent tasked to edit `primitives/hooks/` needs
  neither. Sparse-checked-out to its declared partition the same worktree is
  roughly 1 MB — a 10-20x reduction.
- The spawners apply no concurrency test: an isolated worktree is forced on
  every coder-profile spawn whether or not anything runs beside it. A sequential
  agent needs a branch; a read-only agent needs neither.

**Files you will edit (all four verified present, sizes as of dispatch):**

| Path | Size | Note |
|---|---|---|
| `~/agent-core/primitives/rules/worktree-lifecycle.md` | absent | you create it |
| `~/agent-core/primitives/rules/ENFORCEMENT.md` | 13,182 B | ledger table under `## The ledger` |
| `~/agent-core/primitives/rules/control-flow.md` | 12,017 B | has a `§Reaping` section |
| `~/agent-core/primitives/AGENTS.md` | tracked | the canonical core |

**Enforcement law you are working inside** (read
`~/agent-core/primitives/rules/ENFORCEMENT.md` before writing a line): every law
carries exactly one of three statuses — **DOOR** (the sanctioned tool's only
open path complies by construction), **HOOK** (a named hook refuses or rewrites
mechanically), **DOCTRINE** (unenforced prose; an honest label, and a
compilation bug in the queue, never a tier). A new law lands with its enforcer
named or with an explicit DOCTRINE label and a compilation note. Vows are not a
status.

**Parity law** (`~/agent-core/primitives/HARNESS-PARITY.md`, 13,182 B, present):
enforcement lands in all harnesses in the same unit, or the ledger row says so.
Canonical gate logic lives in exactly one file per law; adapters are thin.

**Agnosticism is contract:** the core is provider/model/harness-agnostic. No
provider or model names anywhere in what you write. Harness names appear only
where you are naming an actual adapter file path, never as a preference.

## Parallel Work Notice

Two sibling orchestrators are running against the same three repos right now.

- **Unit 2+3 orchestrator** is building sparse checkout at spawn and the
  teardown doors in `~/herdr-spine` and `~/cursor-shim`. It owns those repos
  entirely, plus `~/agent-core/primitives/hooks/**` and harness hook config if
  it needs them. It will post its enforcer status to the board topic below.
- **Unit 4 orchestrator** is triaging preserved branches. It owns
  `~/agent-core/briefs/worktree-lifecycle/BRANCH-TRIAGE.md` and branch deletion
  only.

**Your partition — touch ONLY these four files:**

```
~/agent-core/primitives/rules/worktree-lifecycle.md    (create)
~/agent-core/primitives/rules/ENFORCEMENT.md
~/agent-core/primitives/rules/control-flow.md
~/agent-core/primitives/AGENTS.md
```

Nothing else. Not `primitives/hooks/`, not `HARNESS-PARITY.md`, not the
spawners. If you believe another file must change, post a finding and say so in
your report; do not reach for it.

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

### 1. Author `~/agent-core/primitives/rules/worktree-lifecycle.md`

It must state, at minimum:

- A worktree exists only to give a **concurrent** agent physical isolation.
- It is born with the agent and dies with the unit of work: worktree removed
  and branch deleted in the same beat the pane is reaped.
- Sequential agents get a branch. Read-only agents get neither.
- Worktrees are **never nested by path** to imply hierarchy, with the
  demonstrated reason stated: removing the outer destroys the inner and leaves a
  prunable ghost.
- Sparse checkout is the **default**, not an optimization, with the measured
  numbers.
- The safety property the manual sweep proved necessary: **a blocked commit must
  never become data loss.** If uncommitted work cannot be preserved (for example
  a credential guard correctly refuses it), teardown keeps the directory and
  reports; it does not remove it.
- Name its enforcer per ENFORCEMENT.md — DOOR, HOOK, or an explicit DOCTRINE
  label with a compilation note. Prose without an enforcer is exactly what
  failed 85 times. Read the board topic before you write this section: the
  sibling orchestrator is building the doors and will post what actually landed.
  State what is true at the moment you write, and label anything unwired as
  unwired.

**Done when:** the file exists; it names its enforcer explicitly; it contains no
provider or model names; every factual claim in it is verifiable from this
brief's Pre-Verified Facts or from a command the file itself cites; and
`grep -niE '(claude|cursor|pi |gpt|opus|sonnet|gemini)' <file>` returns only
lines that name a literal adapter file path.

### 2. Register and link it

Add the ledger row in `~/agent-core/primitives/rules/ENFORCEMENT.md` under
`## The ledger`, matching the existing column shape
(`| Law | Source | Enforcer | Status | Coverage |`). Link the rule from
`primitives/AGENTS.md` and from `primitives/rules/control-flow.md` where reaping
is discussed — the worktree is the second resource a spawn creates, and
`§Reaping` currently covers only panes.

**Done when:** `grep -rn worktree-lifecycle ~/agent-core/primitives/` shows the
ledger entry and both links, and the ENFORCEMENT.md status column reflects
reality rather than intent.

## Constraints

- **Never implement production code yourself.** Dispatch. Research assists are
  fine.
- Do not bypass the credential guard, the grounding hook, the write gate, or the
  spawn door. A refusal is information, not an obstacle.
- **One write per file per thought.** Compose consecutive edits to one file into
  a single call. Need a second write to the same file? Read it first, by
  contract — the read comes before the attempt, not after the refusal.
- Do not run dependency install from a worktree: `bun install`/`prepare` from a
  worktree can corrupt the shared repo's `core.hooksPath`.
- **Workers never commit.** You verify and report. The coordinator lands.
- Match surrounding document style. These are dense reference documents, not
  essays. Comments and prose state constraints, not narration.

## Report back with

- Each done-when quoted, with the evidence that satisfied it: command run,
  output tail, file path.
- Every file created or modified, including dotfiles and config.
- The enforcer status you recorded and why it is honest.
- Any done-when you could not satisfy, what blocked it, and what you did with
  everything that did not depend on it.
- Deviations from this brief with the reason. If a Pre-Verified Fact turns out to
  be wrong, say so plainly and cite what you found instead — that is the most
  valuable thing you can report.
