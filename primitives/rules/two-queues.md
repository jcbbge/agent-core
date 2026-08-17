# TWO QUEUES — the work model (operator law, 2026-08-16)

Codified from the operator's verbatim directive. This is the shape of all
work on this machine. It replaces per-unit key-turning, spawn dockets, and
compare-to-expected ceremony as the way work moves.

## The model

```
OUTER LOOP  ──queue of──▶  TODO      the backlog. Unstarted. Unowned.
                             │
                             │  PROMOTION  (the operator's act, or a standing rule)
                             ▼
INNER LOOP  ──queue of──▶  TASK      one bug fix, one feature, one chore.
                             │        Owned by one ORCH. Gets ONE worktree.
                             │  PLANNING  (the ORCH's act — ALWAYS, no exceptions)
                             ▼
                           SUBTASK   the decomposition. Each gets a BRANCH.
```

Four sentences, and they are the whole law:

1. **The outer loop queues TODO items.** A TODO is a backlog entry. It has a
   title and a done-when. Nothing else. It is not scheduled, not assigned,
   and has no worktree.
2. **The inner loop queues TASKS.** Promotion is the only way in. On
   promotion the item stops being a TODO and becomes a TASK; the TASK
   begins its cycle immediately. Promotion is the gate — the *only* gate.
3. **Every TASK is decomposed into SUBTASKS by the Orchestrator, in the
   planning stage, every time.** Not when it seems warranted. Not when the
   task is large. Every task, every time. A task that "doesn't need
   decomposing" is decomposed into one subtask and that is still the beat.
4. **One TASK = one worktree. One SUBTASK = one branch in that worktree.**
   The worktree is born when the task is promoted and destroyed when the
   task lands. The branches are the units of merge.

## What a TODO carries

| Field | Meaning |
|---|---|
| title | the human name; becomes the worktree name and the pane's `$task` |
| done-when | the binary condition that closes it. Not a threshold to negotiate. |
| type | feat · fix · refactor · docs · test · chore |

Nothing else. A TODO that needs a paragraph of context is two TODOs or a
badly-named one.

## What promotion is, and what it is not

Promotion is the operator moving one item from the outer queue to the inner
queue. That is the last time a human is in the loop for that item.

Promotion is **not** a per-step key. Once a TASK is in the inner loop, no
step inside its cycle asks for authorization. Not the decomposition, not
the worktree creation, not the spawn, not the merge. The done-when is the
gate; the merge is the report. A task that fails goes back on the outer
queue with a reason — it does not stop and ask.

**Banned:** stating an expected result to the board and asking the operator
to compare it. That is the machine asking a human to be its assertion
library. If a step's outcome must be checked, the check is a test.

## Worktrees

Governed by `worktree-lifecycle.md`. What this law adds:

- The worktree belongs to the **TASK**, not to an agent. Agents come and go
  inside it; the worktree outlives each of them and dies with the task.
- Worktrees are **flat peers by path, always** — never nested inside one
  another. Reproduced 2026-08-16 in two directions: `git worktree remove`
  on a directory containing another worktree **refuses** without `--force`,
  and **destroys the inner worktree's files** with it, leaving a `prunable`
  ghost registration. Nesting therefore breaks the one property that matters
  — automatic cleanup. See `worktree-lifecycle.md` §3, §5.
- Sub-task branches are cut from the task branch and merged back into it.
  Where a branch is physically checked out is an implementation detail; the
  law is that a subtask is a **branch**, never a second task, and never a
  resource that outlives its task's worktree.

### Parallel subtasks — the one mechanical constraint

A worktree has exactly one branch checked out at a time. Subtasks that run
**concurrently** (the test/impl split, for one) therefore need a transient
checkout each. Those checkouts:

- live under the task's namespace,
- are flat peers by path — never inside the task worktree,
- are torn down at subtask merge, before the task worktree is removed
  (deepest-path-first, `worktree-lifecycle.md` §5),
- are **not tasks**. They never appear in the inner queue, never get their
  own ORCH, and never survive their parent task.

Subtasks that run **sequentially** need no extra checkout: the task worktree
checks out each subtask branch in turn.

## Cleanup is not a chore, it is the closing beat

Task lands → subtask branches merged → transient checkouts removed →
task worktree removed → pane reaped. In one beat, by whoever owns the task.
A leftover worktree means the task did not finish. Labeling leftovers is not
cleanup.

The reconciler (`~/herdr-spine/bin/handlers/18-worktree-reconcile`) is a
backstop for when that beat is missed. It is not the mechanism. A system
that relies on the sweeper has no closing beat.

## Harness is an implementation detail — NO EXCEPTIONS

An agent harness is a tool in the toolshed. It is one interchangeable way to
seat an engine in a pane. It **does not drive the process**, and it can be
replaced at any time without a single line of this law changing.

Therefore:

- **No process artifact names a harness.** Not this file, not the role
  profiles, not a brief, not a queue item, not a board post. A brief that
  names a harness or a model is invalid and is rejected, not fixed.
- **No harness-specific verb is a process step.** "Spawn a subtask worker"
  is a process step. Any vendor-prefixed spawn command is the
  implementation of that step, chosen at spawn time and never referenced
  above the spawn seam.
- **Agents running on a harness do not route work through that harness.**
  An engine seated by any given vendor's runner still takes its work from
  the inner queue and reports through the bus. The harness carries the
  agent; it never carries the process.
- **No harness-specific break-glass.** A gate that can be disabled by a
  vendor-named environment variable is a gate that belongs to the vendor,
  not to the process. Gates are named by what they enforce.

Violations on record as of 2026-08-16, to be cleared: `cursor` appears in
`worktree-lifecycle.md`, `session-lifecycle.md`, `control-flow.md`,
`ENFORCEMENT.md`, and in all four role profiles (`concierge.md`,
`coordinator.md`, `orchestrator.md`, `PROFILES.md`). Occurrences inside a
spawn-seam implementation section are permitted; occurrences in a role's
duties or in any process step are not.

## Enforcer

**DOCTRINE** as written — no hook refuses a task that skipped decomposition,
and no door blocks a brief that names a harness. Two mechanical gaps, named
honestly rather than restated as rules to remember harder:

1. Decomposition is unenforced. Nothing rejects a TASK whose plan has zero
   SUBTASKS.
2. Harness-naming in briefs is unenforced. A grep-based PreToolUse guard on
   brief writes is the obvious door and does not exist.

Per `ENFORCEMENT.md`, a law lands with its enforcer named or its DOCTRINE
label explicit. This is the explicit label.
