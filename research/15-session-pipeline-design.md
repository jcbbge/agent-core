# Session Pipeline Design
**Date:** 2026-04-14  
**Based on:** M1 iterations (starting-session v6.0, ending-session v4.1, Substrate MCP, Manifold UHP)

---

## What the M1 Iterations Got Right

### 1. The Breath Model (Substrate) — Keep Everything

This is the cleanest thing built across two years of iteration. The physics metaphor is correct:

> Work either lives in the system or it does not exist. If the intent table is empty, the workspace is clean. That is correct.

The five-phase cycle is right: `IDEATE → PLAN → IMPLEMENT → TEST → COLLAPSE`

The three-table model is right: `intent` (ephemeral), `memory` (persistent), `state` (codebase)

The phi scoring for memory weight is right.

The breath CLI (`breathe in / pulse / breathe out`) is the right human interface.

**What failed:** The database dependency. Substrate required SurrealDB running locally. When SurrealDB was removed, Substrate died with it. The model survived but the implementation didn't.

**What to extract:** The model and protocol, not the infrastructure. Substrate's `manifest` prompt is a perfect session-start instruction. Its `session-start` and `session-end` prompts are the right level of abstraction — they tell the agent what to do without prescribing tool calls to dead systems.

---

### 2. The Dual-Mode Detection (starting-session v6.0) — Keep the Pattern

Detecting whether you're in `meta/systems` mode (not in a project) vs `project` mode (inside a git repo) is the right abstraction. It's the same problem solved well:

```bash
git rev-parse --show-toplevel 2>/dev/null || echo "NOT_GIT"
```

If you're in a git repo → project mode. If not → meta/global mode.

**What failed:** Meta mode depended entirely on daemon health checks (Anima, SurrealDB, Dev-Brain, Executor). Strip those out and the meta mode skeleton is just: "check git log, check tasks, orient."

**What to extract:** The detection logic and the two-mode output format. The git diagnostics in project mode (churn hotspots, bus factor, velocity, bug clusters) are **genuinely excellent** and should be kept verbatim. These are hard-won patterns.

---

### 3. The Git Diagnostics Block — Keep Verbatim

From starting-session v6.0, Project Mode, Steps 2-3:

```bash
# Churn hotspots — most-changed files
git log --format=format: --name-only --since="1 year ago" | sort | uniq -c | sort -nr | head -20

# Bug clusters — files that keep breaking
git log -i -E --grep="fix|bug|broken" --name-only --format='' | sort | uniq -c | sort -nr | head -20

# Velocity — is this project healthy
git log --format='%ad' --date=format:'%Y-%m' | sort | uniq -c

# Bus factor
git shortlog -sn --no-merges --since="6 months ago"

# Firefighting rate
git log --oneline --since="1 year ago" | grep -iE 'revert|hotfix|emergency|rollback'
```

These five commands together give a risk map of the codebase before you touch a single file. Nothing in the M1 history produced anything better than this.

**Cross-reference** churn + bug files to find risk zones. That's the insight worth keeping.

---

### 4. The Handoff File Convention — Keep, Simplify

`workspace/handoff-latest.md` at the git root is the right idea. One file, always the same path, always the same format. The start skill reads it. The end skill writes it.

**What failed:** The format was too verbose and tied to the SurrealDB write steps. The underlying structure was correct.

**What to extract:** The handoff schema (see below).

---

### 5. Manifold's Contribution — One Thing

Manifold was overengineered (Stigmergic Blackboard, IPIT, fractal harnesses, AIP logging format, the 0xPRT glyphs). But it identified one true insight:

> **Work is an Artifact flowing through a recursive loop, not a task in a list.**

That's the same insight as Substrate's intent model, arrived at independently. The convergence validates the model.

Manifold also proved through failure: the more infrastructure a session protocol requires, the more fragile it is. Substrate was better than Manifold because it had fewer moving parts. The M5 system should have fewer still.

---

## What Failed Consistently Across All Iterations

### 1. External database dependency

Every version that required a running service (SurrealDB, Dev-Brain, Anima, Executor) broke the moment that service was unavailable or removed. The session protocol should have **zero runtime dependencies** beyond git and the filesystem.

### 2. "Meta mode" was actually "infrastructure health check"

The meta mode in starting-session was just: are all my daemons running? That's not orientation — that's ops. It collapsed when the daemons were removed because there was nothing else to orient on.

**The fix:** Meta mode should be: what's in the task file + what did git say happened recently + what's the current focus. No services required.

### 3. Skills tried to be orchestrators

Both starting-session and ending-session tried to coordinate multiple systems (anima, dev-brain, SurrealDB, git, handoff file, NEXT_STEPS.md). Skills shouldn't orchestrate — they should instruct. The skill tells the agent what to do and in what order. The agent does it. The skill doesn't need to know which tools exist.

### 4. Session end was too heavy

4.1 had 8 MCP calls in root mode. That's too much. The session end protocol should fit in 3 steps: check status, write handoff, commit.

---

## The M5 Design

### Core Principle

**Git is the database. The task file is the handoff. The skill is the reader/writer.**

No services. No databases. No daemons. If you have git and a filesystem, the session protocol works.

### The Commit Convention

This is the load-bearing piece. Without a consistent commit format, the start-of-session skill can't read history. The format:

```
<type>(<scope>): <summary>

DONE: <comma-separated list of completed items>
TODO: <comma-separated list of remaining items>
BLOCKED: <optional — what's blocking and why>

Co-Authored-By: Claude <noreply@anthropic.com>
```

Examples:
```
feat(quotes): implement price lock snapshot

DONE: schema migration, Drizzle model, snapshot creation on quote-add, unit tests
TODO: integration test, API endpoint handler
BLOCKED: —

feat(auth): add OAuth provider abstraction

DONE: provider interface, Google OAuth impl, session migration
TODO: Apple OAuth, contractor onboarding doc update
BLOCKED: Apple developer account approval pending
```

The `TODO:` line from the last commit is the most valuable thing a start-of-session skill can read. It's the previous session's handoff.

### The Task File

```markdown
<!-- TASKS.md — lives at git root, tracked, one per project -->
## Active
- [ ] implement quote PDF generation [arc/contracts]
- [ ] wire Stripe webhook endpoint [arc/billing]

## Blocked
- [ ] Apple OAuth provider — waiting on developer account approval

## Done (2026-04-14)
- [x] price lock snapshot on quote creation — merged to main
- [x] Drizzle schema migration — run on dev + staging

## Upcoming
- [ ] contractor onboarding — needs bootstrap kit
- [ ] solid-2.0 upgrade [arc/frontend]
```

A hook validates that `Active` section exists and items are properly formatted. Simple regex check. No database.

### skill/session-start (new design)

```markdown
---
name: session-start
description: Orient at the start of any session. Run before touching anything.
  Detects project vs meta context. Reads git state + task file. Surfaces what matters.
allowed-tools: Bash Read
---

# Session Start

Detect context and orient before doing anything else.

## Step 1: Detect mode

\```bash
git rev-parse --show-toplevel 2>/dev/null && echo "PROJECT" || echo "META"
\```

---

## Project Mode

### Step 2: Read the last 5 commits
\```bash
git log --oneline -5
\```

Parse the `TODO:` line from the most recent commit. That's what was left unfinished.

### Step 3: Read current task file
\```bash
cat TASKS.md 2>/dev/null || echo "No TASKS.md found"
\```

### Step 4: Risk map (first session in a codebase, or weekly)
Only run if this is your first time in this codebase or it's been more than a week:
\```bash
# Churn hotspots
git log --format=format: --name-only --since="1 year ago" | sort | uniq -c | sort -nr | head -10

# Bug clusters  
git log -i -E --grep="fix|bug|broken" --name-only --format='' | sort | uniq -c | sort -nr | head -10

# Velocity
git log --format='%ad' --date=format:'%Y-%m' | sort | uniq -c | tail -6
\```
Cross-reference churn + bug files. Those are your risk zones.

### Output

\```
SESSION: [repo] / [branch]
────────────────────────────────────────
Last commit: [message]
Unfinished from last session:
  TODO: [items from last commit's TODO: line]

Active tasks:
  [items from TASKS.md Active section]

Blocked:
  [items from TASKS.md Blocked section, if any]

Risk zones: [files on both churn + bug lists, if run]
────────────────────────────────────────
Ready. What are we working on?
\```

---

## Meta Mode (no git repo)

### Step 2: Read global task file
\```bash
cat ~/agent-core/TASKS.md 2>/dev/null || echo "No global task file"
\```

### Step 3: Recent agent-core changes
\```bash
cd ~/agent-core && git log --oneline -5 2>/dev/null || echo "Not a git repo"
\```

### Output

\```
SESSION: global / meta
────────────────────────────────────────
Recent agent-core work:
  [last 5 commits]

Active global tasks:
  [from ~/agent-core/TASKS.md]
────────────────────────────────────────
Ready. What are we working on?
\```
```

### skill/session-end (new design)

```markdown
---
name: session-end
description: Close a session cleanly. Update task file, generate commit, record handoff.
  Three steps. No database. Works anywhere.
allowed-tools: Bash Read Write Edit
---

# Session End

Three steps. Do them in order.

## Step 1: Check git state
\```bash
git status --short
git diff --stat HEAD 2>/dev/null
\```

If there are uncommitted changes, ask: "Should I commit these before ending?"

## Step 2: Update TASKS.md

Move completed items from Active to Done (with today's date).
Add any new items discovered this session.
Update Blocked section.

Do this with the Edit tool — surgical changes, don't rewrite the whole file.

## Step 3: Generate commit message

Based on what was done this session, generate a commit following this format:

\```
<type>(<scope>): <summary>

DONE: <what was completed>
TODO: <what remains — carry forward from Active section>
BLOCKED: <anything blocked, or omit>

Co-Authored-By: Claude <noreply@anthropic.com>
\```

Then commit:
\```bash
git add TASKS.md [any other modified files]
git commit -m "[generated message]"
\```

**Do not `git add -A`. Stage files explicitly.**

## Output

\```
SESSION CLOSED: [date]
────────────────────────────────────────
Committed: [commit hash] — [message]
Tasks moved to Done: [N]
Tasks remaining Active: [N]
────────────────────────────────────────
Next session: [most important TODO item]
\```
```

---

## The Substrate Debt

Substrate (the MCP server on M1) is the cleanest implementation of the breath model. It still runs on SurrealDB. The model is worth preserving as a **primitive protocol** even if the infrastructure is gone.

What currently exists on the M5 (`AGENTS.md`) already contains the Substrate protocol in condensed form:
```
substrate_status → check what's in flight
substrate_intent_create → breathe in
substrate_intent_phase → pulse
substrate_collapse → breathe out
```

This is the right model for **inter-session work tracking** (what's in flight across multiple sessions on a project). The start/end skills described above are the right model for **intra-session orientation** (what happened in the last session, what's the priority now).

They are complementary. The session skills work without any services. If Substrate is ever revived (lightweight SQLite adapter instead of SurrealDB), it plugs in as an enhancement to the same pipeline, not a replacement.

---

## Build Order

1. `TASKS.md` format definition → write as a rule primitive (`rule/task-file-format`)
2. Commit message convention → write as a rule primitive (`rule/commit-convention`)
3. `skill/session-start` — as designed above
4. `skill/session-end` — as designed above
5. Hook: validate TASKS.md format on commit (optional, add later)

All four can be built as primitives and deployed across all three harnesses immediately.
