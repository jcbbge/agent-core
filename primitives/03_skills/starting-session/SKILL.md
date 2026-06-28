---
name: starting-session
description: Orient at the start of any session. Reads git state + WORK.md. Surfaces project phase, active tasks, blockers, and handoff from last session. Works with git + filesystem only — no external services required.
argument-hint: <optional — project name or context>
allowed-tools: Bash Read
metadata:
  author: jrg
  version: "1.0"
  tags: session, orientation, git, workflow, four-phases
---

# Starting Session

**Call this before touching any file, writing any code, or making any tool call.**

---

## Standing Directives (always active)

**Breathe-mode:** No fluff, no preamble, no filler. Observe before acting. Output the orientation block then **stop and wait**. Do not pre-emptively propose tasks or start working.

**Skip-ritual:** If the user arrives with a specific, high-intent prompt — a task already stated, a problem already named — skip the steps below and go straight to the output block using context already in scope. Run the steps only if information is genuinely missing.

**Environment surfacing:** On first tool call, check for local binary paths and custom scripts (`~/bin`, `~/dotfiles`, `~/.local/bin`, project `scripts/`). Do not assume standard system paths.

**Pre-execution guard:** Before any shell command, file write, or DB operation:
- Verify the target path exists and is what you expect
- If a command failed once, do not run it again unchanged — change strategy or ask
- Never declare a task complete without evidence the output actually exists

---

## Step 0 — Memory substrate (if available)

If the harness has Alembic integration, call `alembic_reconstitute` first.

This returns:
- **Significant dates** — if today matters, acknowledge it at the TOP of output
- **Identity shards** — who you are, who the user is
- **Active commitments** — promises made that haven't been fulfilled
- **Recent decisions** — what was decided recently

If unavailable or unreachable, continue without — but note you're operating without memory.

---

## Step 1 — Detect context

```bash
git rev-parse --show-toplevel 2>/dev/null && echo "PROJECT" || echo "META"
git branch --show-current 2>/dev/null
pwd
```

- `PROJECT` → continue to Step 2
- `META` (not in a git repo) → skip to **Meta Mode** at the bottom

---

## Step 2 — Read the handoff from last session

```bash
git log --format="%s%n%b" -3
```

Scan the last 3 commits. Find the most recent one with a `TODO:` line. Extract:
- `PHASE:` — where the work was (Ideate / Plan / Implement / Verify)
- `DONE:` — what was completed last session
- `TODO:` — what was explicitly left open

If no `TODO:` line in recent commits:
```bash
git log --oneline -10
```
Infer from commit messages what was last touched.

---

## Step 3 — Read WORK.md

```bash
cat WORK.md 2>/dev/null || echo "NO WORK.md"
```

If present, read:
- `Phase:` header — current phase of the whole project
- `PROJECT` section — milestone, overall status
- `ACTIVE` — tasks with a defined path (doing now)
- `BLOCKED` — what cannot move and why
- `BACKLOG` — captured items not yet scheduled

**ACTIVE = do it now, path exists. BACKLOG = captured, no path yet.**

---

## Step 4 — Risk map (conditional)

**Only run if:** first session in this codebase, OR last commit was >7 days ago.

```bash
# Churn hotspots
git log --format=format: --name-only --since="1 year ago" | sort | uniq -c | sort -nr | head -10

# Bug clusters
git log -i -E --grep="fix|bug|broken|revert" --name-only --format='' | sort | uniq -c | sort -nr | head -10
```

Files appearing in both = **risk zones**. Name them explicitly.

---

## Output

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
<repo-name> / <branch>  ·  <date>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TODAY     🗓️ <significant date — if any>

PHASE     <Ideate | Plan | Implement | Verify>

PROJECT   <one-line status>
          Next: <next milestone>

ACTIVE    · <task [scope]>
          · <task [scope]>

BLOCKED   · <task — why blocked>

HANDOFF   Completed: <DONE from last commit>
          Open:      <TODO from last commit>
          Was in:    <PHASE from last commit>

UNCOMMITTED <git status --short, or: clean>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RISK ZONES  · <file> (churn + bugs)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

What are we expanding into?
```

**The last line is a real question. Wait for the answer.**

---

## Meta Mode (not in a git repo)

For agent-core work, global config, research.

```bash
cat ~/agent-core/WORK.md 2>/dev/null
cd ~/agent-core && git log --oneline -5 2>/dev/null
```

Output:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
META / GLOBAL  ·  <date>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TODAY     🗓️ <significant date — if any>

ACTIVE    · <from ~/agent-core/WORK.md>

RECENT    · <last 5 agent-core commits>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

What are we expanding into?
```
