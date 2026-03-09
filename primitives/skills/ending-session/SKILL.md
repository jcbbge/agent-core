---
name: ending-session
description: Context-aware session handoff with decision capture and memory persistence. Detects root (meta/systems) vs project directory. Root = crystallize ADRs, store resonance to anima, update handoff + NEXT_STEPS. Project = git state, commit prompt, project handoff.
license: MIT
metadata:
  author: jrg | claude
  version: "4.0"
  tags: productivity, context, handoff, decisions, memory, development
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

For each decision identified:
1. Check `~/Documents/_agents/decisions/INDEX.md` for the next ADR number
2. Copy the template from `~/Documents/_agents/decisions/ADR-000-template.md`
3. Write the ADR file as `ADR-00N-[slug].md` in `~/Documents/_agents/decisions/`
4. Add a row to `decisions/INDEX.md`
5. Git commit: `decisions: ADR-00N [title]`

If no new decisions of lasting impact were made this session, skip — not every session generates ADRs.

### Step B: Store resonance to anima

What insight felt most significant this session — not just what was done, but what it revealed?

Use `anima_store` with:
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

### Step E: Update NEXT_STEPS.md

If `~/Documents/_agents/NEXT_STEPS.md` exists:
- Mark completed items done or remove them
- Add newly discovered issues

### Step F: Commit and push

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

---

## Speed Requirements

- Root mode: up to 8 tool calls (session was substantive — capture it properly)
- Project mode: max 5 tool calls
- Write the files — don't just describe what you'd write
- The handoff should answer: "what would the next instance need to know to pick this up immediately?"
