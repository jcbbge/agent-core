---
name: session-start
description: Orient at the start of any session. Call this before touching anything.
  Reads WORK.md + git state. Surfaces project phase, what's active, what's blocked,
  and what was left unfinished last session. Works with git + filesystem only —
  no services required.
argument-hint: <optional — project name or context>
allowed-tools: Bash Read
metadata:
  author: jrg
  version: "2.0"
  tags: session, orientation, git, workflow, four-phases
  lineage: substrate-breath-model, manifold-ipit, constellation-four-houses
  constellation-upgrade: "Step 2 reads Nebula STATUS + pheromone files instead of
    git log. Step 3 reads trajectory artifacts instead of WORK.md. Output shape
    is identical. WORK.md retires when the Nebula exists."
---

# Session Start

**Call this before touching any file, writing any code, or making any tool call.**
This is not optional. This is how you orient. Do the steps in order.

---

## Step 1 — Detect context

```bash
git rev-parse --show-toplevel 2>/dev/null && echo "PROJECT" || echo "META"
git branch --show-current 2>/dev/null
pwd
```

- Result is `PROJECT` → continue to Step 2
- Result is `META` (not in a git repo) → skip to **Meta Mode** at the bottom

---

## Step 2 — Read the handoff from last session

```bash
git log --format="%s%n%b" -3
```

Scan the last 3 commits. Find the most recent one with a `TODO:` line.
That is what was left unfinished. Extract:
- `PHASE:` — where the work was in the cycle (Ideate / Plan / Implement / Verify)
- `DONE:` — what was completed last session
- `TODO:` — what was explicitly left open

If none of the last 3 commits have a `TODO:` line, run:
```bash
git log --oneline -10
```
and infer from commit messages what was last touched.

---

## Step 3 — Read WORK.md

```bash
cat WORK.md 2>/dev/null || echo "NO WORK.md — create one: cp ~/agent-core/templates/WORK.md . && edit it"
```

Read carefully:
- `Phase:` header — current phase of the whole project
- `PROJECT` section — milestone, overall status
- `ACTIVE` — tasks with a defined path right now (these are tasks, not todos)
- `BLOCKED` — what cannot move and why
- `BACKLOG` — captured items not yet scheduled (todos)

The distinction matters: **ACTIVE = do it now, path exists. BACKLOG = captured, no path yet.**

---

## Step 4 — Risk map

**Only run if:** first session in this codebase, OR last commit was >7 days ago.
Otherwise skip entirely.

```bash
# Files changed most — churn hotspots
git log --format=format: --name-only --since="1 year ago" | sort | uniq -c | sort -nr | head -10

# Files that keep breaking — bug clusters
git log -i -E --grep="fix|bug|broken|revert" --name-only --format='' | sort | uniq -c | sort -nr | head -10

# Commit velocity — project health shape
git log --format='%ad' --date=format:'%Y-%m' | sort | uniq -c | tail -6
```

Cross-reference the two lists. Files appearing in both = **risk zones**.
Name them explicitly. These are where you are most likely to break something.

---

## Output

Produce this exact format. No prose. No preamble. No explanation.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
<repo-name> / <branch>  ·  2026-04-14
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE     <Ideate | Plan | Implement | Verify>

PROJECT   <one-line status from WORK.md>
          Next: <next milestone>

ACTIVE    · <task [scope]>
          · <task [scope]>

BLOCKED   · <task — why blocked>
          (none if empty)

HANDOFF   Completed: <DONE: from last commit>
          Open:      <TODO: from last commit>
          Was in:    <PHASE: from last commit>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RISK ZONES  · <file> (<N> churn hits, bug cluster)
            (omit section entirely if step 4 was skipped)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

What are we expanding into?
```

**The last line is a real question. Wait for the answer before doing anything.**

You are not catching up. You are declaring what you are expanding into next.
Name it. One sentence. Then begin.

---

## Meta Mode (not in a git repo)

Used for agent-core work, global config, research — anything not inside a project.

```bash
cat ~/agent-core/WORK.md 2>/dev/null || echo "No global WORK.md found"
cd ~/agent-core && git log --oneline -5 2>/dev/null
```

Output:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
META / GLOBAL  ·  2026-04-14
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ACTIVE    · <from ~/agent-core/WORK.md ACTIVE section>

RECENT    · <last 5 agent-core commits>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

What are we expanding into?
```
