---
name: ending-session
description: Context-aware session handoff with decision capture and memory persistence. Detects root (meta/systems) vs project directory. All MCP calls route through the executor gateway. Root = crystallize ADRs, store resonance to anima, update handoff + NEXT_STEPS. Project = git state, commit prompt, project handoff.
license: MIT
metadata:
  author: jrg | claude
  version: "4.1"
  tags: productivity, context, handoff, decisions, memory, development, executor
---

# Ending Session

Context-aware handoff capture. One skill, two modes — detected from working directory.

**Trigger patterns:** `/ending-session`, `/end-session`, "end session", "wrap up", "create handoff"

---

## Step 1: Detect Context

```bash
pwd
git rev-parse --show-toplevel 2>/dev/null || echo "NOT_GIT"
```

**Root/Meta mode** — if cwd is `/Users/jcbbge` OR git returns `NOT_GIT`
**Project mode** — if inside a git repo under a project directory

---

## Root / Meta Mode

Used when ending a meta/systems session — agent-core work, brain infrastructure, primitives development.

### Step A: Crystallize decisions into ADRs

Look back at this session. What architectural decisions were made that have lasting impact?

A decision worth an ADR is one that:
- Changed how the system is structured or why
- Rejected an alternative for a specific reason
- Will matter to a future agent who didn't participate in this session

For each decision identified, use dev-brain `create_adr`:
- `create_adr(title, context, decision, consequences, alternatives, resonance, status)`
- The tool automatically assigns the next available number
- Returns the created ADR with its ID

Example:
```
create_adr(
  title="ADR title here",
  context="What forced this decision?",
  decision="The choice made.",
  consequences="Easier: X. Harder: Y.",
  alternatives="| Alternative | Why rejected |\n|---|---|\n...",
  resonance="Why this mattered..."
)
```

If no new decisions of lasting impact were made this session, skip — not every session generates ADRs.

### Step B: Store resonance to anima

What insight felt most significant this session — not just what was done, but what it revealed?

Call through the executor: `anima_store` with:
- `resonance_phi: 3.0` for important realizations
- `resonance_phi: 4.0` for breakthroughs or identity-level shifts
- `synthesis_mode: 'recognition'` when the insight was witnessed/felt rather than analyzed

If nothing felt significant beyond routine work, skip.

### Step C: Sync stack.yaml if modified

If `stack.yaml` was added to or changed this session:
```bash
bash ~/Documents/_agents/observe/sync-stack.sh 2>/dev/null
```

### Step D: Write handoff

Write to `~/Documents/_agents/workspace/handoff-latest.md`:

```markdown
# Session Handoff
Date: [date]
Mode: meta/systems

Completed:
- [what was built/changed] — [why it was done, link to ADR if applicable]
- [infrastructure work] — [what problem it solved]

Decisions captured:
- ADR-00N: [title] (or "none this session")

agent-core state:
- N skills · N rules deployed

Open items:
1. [top priority]
2. [second priority]

Next session focus:
[single sentence: what to pick up and why]
```

The WHY matters. "Built stack catalog schema" is less useful than "Built stack catalog schema — agents were reading files to understand environment, now they query SurrealDB (ADR-001)."

### Step E: Write to dev-brain

**Persist handoff to SurrealDB for cross-project queryability:**

All calls route through the executor gateway:

1. **Update workspace state**:
   - `upsert_workspace_state(project="~/Documents/_agents", git_branch="[branch]", notes="[next session focus]", status="active")`

2. **Capture completed work as milestones**:
   - For each completed item, `capture_thought(type="milestone", content="[item]", project="~/Documents/_agents", tags=["handoff"])`

3. **Sync open todos**:
   - For each open item: `create_todo(title="[item]", project="~/Documents/_agents", priority="[p1/p2]", feature="[feature-name]")` or update existing
   - The `feature` field enables hierarchical grouping: [project][feature][Task 1-60]

4. **Capture session summary**:
   - `capture_thought(type="observation", content="Session completed: [key items]. Next: [focus]", project="~/Documents/_agents", tags=["session", "handoff"])`

### Step F: Update NEXT_STEPS.md

If `~/Documents/_agents/NEXTSTEPS.md` exists:
- Mark completed items done or remove them
- Add newly discovered issues

### Step G: Commit and push

```bash
cd ~/Documents/_agents
git add workspace/handoff-latest.md
# add any other modified files explicitly — never git add -A
git commit -m "session: [date] — [one line summary]

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
git push origin main
```

---

## Project Mode

Used when ending a project development session.

### What to capture

```bash
git branch --show-current
git status --porcelain
git log --oneline -5
```

### Prompt on uncommitted work

If there are uncommitted changes, explicitly ask: "Should I commit these before ending the session?" Don't silently skip uncommitted work.

### Write handoff to `[git-root]/workspace/handoff-latest.md`

```markdown
# Session Handoff
Date: [date]
Branch: [branch]

Completed:
- [what was built/fixed] — [why, what problem it solved]

Current State:
- [N files modified / clean]
- [anything uncommitted and why it's intentional]

Next Steps:
1. [immediate next action with context]
2. [following action]
```

### Write to dev-brain

All calls route through the executor gateway:

1. **Update workspace state**:
   - `upsert_workspace_state(project="[git-root]", git_branch="[branch]", notes="[next steps]", status="paused")`

2. **Capture completed work**:
   - `capture_thought(type="milestone", content="[completed item]", project="[git-root]", tags=["handoff"])`

3. **Sync todos**:
   - `create_todo(title="[next step]", project="[git-root]", priority="[p0/p1]", feature="[feature-name]")` for each next step
   - Use `feature` to group related tasks: [project][feature][Task 1-60]

---

## Note on MCP Invocation

All MCP tools are invoked through the executor gateway:

**Dev-Brain tools:**
- `list_adrs(status, limit)` — query ADRs
- `get_adr(number)` — get specific ADR
- `create_adr(title, context, decision, ...)` — create new ADR
- `upsert_workspace_state(...)` — workspace state
- `capture_thought(...)` — store memories
- `create_todo(...)` — track tasks

**Anima tools:**
- `anima_store(...)` — store memories with resonance

The executor routes calls to the appropriate MCP server and returns unified responses. Do not call MCP servers directly.

---

## Speed Requirements

- Root mode: up to 8 tool calls (session was substantive — capture it properly)
- Project mode: max 5 tool calls
- Write the files — don't just describe what you'd write
- The handoff should answer: "what would the next instance need to know to pick this up immediately?"
