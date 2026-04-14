---
name: session-start
description: Orient at the start of any session. Surfaces where work is across all
  three tiers — project, active scope, implementation. Reads git state + WORK.md.
  No services required. Works anywhere with git. Use at the start of every session
  before touching any code or files.
argument-hint: <optional — project name or focus area>
allowed-tools: Bash Read
metadata:
  author: jrg
  version: "1.0"
  tags: session, orientation, git, workflow
  constellation-upgrade: "When Constellation ships: read from Nebula STATUS file
    and trajectory pheromones instead of WORK.md + git log. Same output shape."
---

# Session Start

Orient before acting. This skill reads three sources and surfaces one view.
Do not open files, write code, or make tool calls until this completes.

---

## Step 1 — Detect context

```bash
git rev-parse --show-toplevel 2>/dev/null && echo "PROJECT" || echo "META"
git branch --show-current 2>/dev/null
```

**If META** (not in a git repo) → skip to Meta Mode below.
**If PROJECT** → continue.

---

## Step 2 — Read the last commit handoff

```bash
git log --format="%H %s%n%b" -1
```

Find the `TODO:` line. That is what was left unfinished last session.
Find the `PHASE:` line. That is where the work was in the four-phase cycle.
Find the `DONE:` line. That is what was completed.

If the last commit has no TODO line → check the one before it:
```bash
git log --oneline -5
```

---

## Step 3 — Read the three-tier dashboard

```bash
cat WORK.md 2>/dev/null || echo "No WORK.md found — run: cp ~/agent-core/templates/WORK.md ."
```

Read all three tiers:
- **PROJECT** section → what phase is the overall project in
- **ACTIVE** section → what tasks have a defined path right now
- **BLOCKED** section → what cannot proceed and why
- **BACKLOG** section → what is captured but not yet active

---

## Step 4 — Risk map (first session in codebase, or if >7 days since last session)

Only run this block if it's your first time in this codebase OR the last commit
was more than a week ago. Otherwise skip — it's noise.

```bash
# Churn hotspots — files changed most often
git log --format=format: --name-only --since="1 year ago" | sort | uniq -c | sort -nr | head -10

# Bug clusters — files that keep breaking
git log -i -E --grep="fix|bug|broken|revert" --name-only --format='' \
  | sort | uniq -c | sort -nr | head -10

# Velocity — is this project healthy
git log --format='%ad' --date=format:'%Y-%m' | sort | uniq -c | tail -6
```

Cross-reference churn list and bug list. Files on both = risk zones.
Name them explicitly in the output.

---

## Output Format

Produce exactly this view. No prose. No explanation. Just the dashboard.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
<repo-name> / <branch>  ·  <date>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROJECT   <project phase and milestone from WORK.md>

ACTIVE    <task 1 [scope]>
          <task 2 [scope]>
          (or: nothing active — check BACKLOG)

BLOCKED   <task — why>
          (or: nothing blocked)

HANDOFF   Last session completed: <DONE from last commit>
          Left open: <TODO from last commit>
          Phase was: <PHASE from last commit>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RISK ZONES  <files on both churn + bug list, if step 4 ran>
            (omit this line if step 4 was skipped)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

What are we expanding into?
```

The last line is the prompt. It is not rhetorical. Wait for an answer before proceeding.

---

## Meta Mode (not in a git repo)

Run when cwd is not a git repository — agent-core work, research, global config.

```bash
cat ~/agent-core/WORK.md 2>/dev/null || echo "No global WORK.md"
cd ~/agent-core && git log --oneline -5 2>/dev/null
```

Output:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GLOBAL / META  ·  <date>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ACTIVE    <from ~/agent-core/WORK.md>

RECENT    <last 5 agent-core commits>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

What are we expanding into?
```

---

## Constellation Upgrade Path

When Constellation ships, this skill upgrades in place:

- Step 2 → read `~/.constellation/nebula/{trajectory_id}/STATUS`
- Step 3 → read trajectory pheromone files (01_starchart, 03_spec_sheet, etc.)
- Step 4 → read spine telemetry for risk signals instead of git log
- Output format → same shape, different data sources

The four-phase vocabulary (Ideate / Plan / Implement / Verify) maps directly
to Constellation's Four Houses (Dawn / Meridian / Descent / Night).
WORK.md is the pre-Constellation Nebula. Same contract, different substrate.
