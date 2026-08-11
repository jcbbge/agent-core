---
name: session-end
description: Close a session cleanly. Update WORK.md, commit with the standard
  handoff format. Three steps. No services required. Call this at the end of every
  session before closing — even short ones.
argument-hint: <optional — summary of what was done>
allowed-tools: Bash Read Write Edit
metadata:
  author: jrg
  version: "2.0"
  tags: session, handoff, git, workflow, four-phases
  lineage: substrate-collapse, manifold-ipit, constellation-re-entry
  constellation-upgrade: "Collapse completed trajectories to the Nebula. Update
    pheromone STATUS file. Emit session telemetry to spine. WORK.md retires
    when the Nebula exists. Commit format and NEXT output are identical."
---

# Session End

Three steps. In order. Do not skip any of them.

---

## Step 1 — Check git state

```bash
git status --short
git diff --stat HEAD 2>/dev/null | tail -5
```

If there are uncommitted changes, list them and ask:
> "These files have uncommitted changes: [list]. Include them in the session commit?"

**Do not silently skip uncommitted work.** Surface it. One decision, then continue.

---

## Step 2 — Update WORK.md

Use `Edit` — make surgical changes only. Do not rewrite the file.

**What to do:**
1. Move completed items from `ACTIVE` → `DONE` with today's date: `- [x] <task> — 2026-04-14`
2. Add newly discovered work to `BACKLOG` (not ACTIVE — it has no path yet)
3. Update `BLOCKED` — remove anything that got unblocked, add new blockers with reason
4. Update the `Phase:` header if the project phase shifted this session
5. Update `PROJECT` status line if a milestone was reached

**What not to do:**
- Do not move things from BACKLOG to ACTIVE unless you are actually doing them now
- Do not add prose or summaries — just move items and update dates

---

## Step 3 — Commit

Generate a commit message in this exact format:

```
<type>(<scope>): <one-line summary>

PHASE: <Ideate | Plan | Implement | Verify>
DONE: <what was completed — be specific, comma-separated>
TODO: <what remains active — this is the handoff, comma-separated>
BLOCKED: <what is blocked, or omit this line>

Co-Authored-By: <Model Name> <noreply@anthropic.com>
```

Then stage and commit:
```bash
git add WORK.md <other modified files — explicit, never git add -A>
git commit -m "<generated message>"
git log --oneline -1
```

Confirm the commit hash is there before finishing.

---

## Output

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SESSION CLOSED  ·  2026-04-14  ·  <repo>/<branch>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMMITTED  <hash> — <summary>

COLLAPSED  <what moved to DONE>
ACTIVE     <what remains — N tasks>
BLOCKED    <anything blocked, or: none>

NEXT       <single concrete sentence — the exact entry point for next session>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**NEXT is the most important line.** It should be specific enough that a cold session
can pick it up without context. Not "continue the feature" — write the exact first
action: "Wire the Galley GraphQL client to the sync job, then run the integration test."

---

## The Four Phases — What Phase Are You In?

When writing the `PHASE:` line, choose honestly:

| Phase | What it means |
|-------|--------------|
| **Ideate** | Still figuring out what to build and why. No code yet. |
| **Plan** | Know what to build. Designing architecture, decomposing tasks. |
| **Implement** | Building it. Writing code, making changes. |
| **Verify** | Built it. Testing, reviewing, validating it holds. |

A session can move through multiple phases. Use the phase you were in for most of the session,
or the phase the next session will begin in if you're at a transition point.

---

## Dispatch (Optional)

If this session had genuine creative or architectural insight — something that emerged
from the exchange that wouldn't have arrived alone — write a dispatch:

Create `journal/2026-04-14-<slug>.md` with:
- Both voices if it was a conversation
- Verbatim, unedited
- A single hook line at the top naming what emerged
- Dated

The roughness is the fidelity. Don't polish it.

---

## The Commit Convention (Reference)

```
feat(arc/quotes): implement price lock snapshot

PHASE: Implement
DONE: schema migration, Drizzle model, snapshot on quote-add, unit tests
TODO: integration test, API endpoint handler
BLOCKED: —

Co-Authored-By: Claude Opus 4 <noreply@anthropic.com>
```

Types: `feat` `fix` `refactor` `docs` `test` `chore` `session`
Scope: the area — `arc/quotes`, `arc/auth`, `agent-core`, `infra`
