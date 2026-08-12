---
name: ending-session
description: Close a session cleanly. Commit with the standard handoff format so
  git log carries the handoff. Project-agnostic — detects the project's own
  definition of done. Call at the end of every session.
argument-hint: <optional — summary of what was done>
allowed-tools: Bash Read Write Edit
metadata:
  author: jrg
  version: "4.1"
  tags: session, handoff, git, workflow
  changelog: "4.1 — renamed session-end → ending-session (operator, gerund form). 4.0 — thin reconcile: drop WORK.md/Nebula duplication; format in AGENTS.md"
---

# Session End

**A session closes only when work is committed with a complete handoff AND landed to this project's definition of done.**

Repo is truth: open = `git diff`, done = `git log`. No side-ledgers. Commit message format: `~/agent-core/primitives/AGENTS.md` (Work tracking section).

Run applicable steps in order. Do not skip a step that applies.

---

## Step 1 — Check git state

```bash
git status --short
git diff --stat HEAD 2>/dev/null | tail -5
```

If there are uncommitted changes, ask once:

> "These files have uncommitted changes: [list]. Include them in the session commit?"

Do not silently skip uncommitted work. Surface it. One decision. Continue.

---

## Step 2 — Commit the handoff

Use the commit template in `~/agent-core/primitives/AGENTS.md`. Stage explicitly (never `git add -A`):

```bash
git add <modified files>
git commit -m "<message>"
git log --oneline -1
```

The `TODO:` line is the handoff — specific enough to cold-start next session (the SessionStart hook surfaces it next time).

---

## Step 3 — Land it (per the project's flow)

Detect how *this* project lands work:

- **No remote** → commit on branch is the close. Done.
- **Remote, no CI, trunk flow** → push; merge to main if that is the project's habit.
- **Remote + CI + merge-to-main** (`.github/workflows/` exists) → push, PR, wait for CI, merge, verify main is green.

If a gate requires human review you cannot satisfy, stop and report **BLOCKED**.

---

## Step 4 — Tear down ephemeral resources (if any)

If starting-session provisioned something ephemeral, run the project's spin-down (e.g. `./scripts/<provision>.sh down`). Skip if nothing was provisioned.

---

## Output

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SESSION CLOSED  ·  <date>  ·  <repo>/<branch>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LANDED     <committed @hash  |  pushed  |  PR #N merged → main>
CI         <success  |  n/a>
BLOCKED    <anything blocked, or: none>

NEXT       <single concrete sentence — the exact entry point = the TODO: line>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**NEXT is the most important line.**

---

## Phases (for the PHASE: line)

| Phase | Meaning |
|-------|---------|
| **Ideate** | Figuring out what to build and why. No code yet. |
| **Plan** | Designing, decomposing tasks. |
| **Implement** | Building it. Writing code. |
| **Verify** | Testing, reviewing, validating. |

Use the phase you were in for most of the session, or the phase next session will begin in.

---

## Dispatch (optional)

If this session had genuine creative or architectural insight, write `journal/<date>-<slug>.md` — both voices if conversation, verbatim, hook line at top, dated. The roughness is the fidelity.
