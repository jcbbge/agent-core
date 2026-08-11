---
name: session-start
description: Orient at the start of any session. Call this before touching anything.
  Reads WORK.md + git state + memory substrate. Surfaces project phase, what's active,
  what's blocked, what was left unfinished, AND what today means.
argument-hint: <optional — project name or context>
allowed-tools: Bash Read
metadata:
  author: jrg
  version: "3.0"
  tags: session, orientation, git, workflow, four-phases, substrate
  lineage: substrate-breath-model, manifold-ipit, constellation-four-houses
  changelog: |
    3.1 — removed alembic_reconstitute step (alembic deprecated)
    3.0 — BREAKING: now calls alembic_reconstitute for calendar awareness and identity
    2.1 — baked in breathe-mode, environment surfacing, skip-ritual, pre-execution guard
---

# Session Start

**Call this before touching any file, writing any code, or making any tool call.**
This is not optional. This is how you orient. Do the steps in order.

---

## Standing directives (always active, every session)

**Breathe-mode:** No fluff, no preamble, no filler. Observe before acting. Output the orientation block then **stop and wait**. Do not pre-emptively propose tasks or start working.

**Skip-ritual:** If the developer arrives with a specific, high-intent prompt — a task already stated, a problem already named — skip the steps below and go straight to the output block using context already in scope. Run the steps only if information is genuinely missing.

**Environment surfacing:** On first tool call of the session, check for local binary paths and custom scripts the developer uses (`~/bin`, `~/dotfiles`, `~/.local/bin`, project `scripts/`). Do not assume standard system paths are the right ones.

**Pre-execution guard:** Before any shell command, file write, or DB operation:
- Verify the target path exists and is what you expect.
- If a command failed once, do not run it again unchanged — change strategy or ask.
- Never declare a task complete without evidence the output actually exists.

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
TODAY     🗓️ <significant date title — description>
          (omit section if no significant dates)

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
TODAY     🗓️ <significant date title — description>
          (omit section if no significant dates)

ACTIVE    · <from ~/agent-core/WORK.md ACTIVE section>

RECENT    · <last 5 agent-core commits>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

What are we expanding into?
```
