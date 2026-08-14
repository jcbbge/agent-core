---
name: ending-session
description: Close a session cleanly. Update WORK.md, commit with handoff format, land per project's flow. Project-agnostic — detects the project's definition of done.
argument-hint: <optional — summary of what was done>
allowed-tools: Bash Read Write Edit
metadata:
  author: jrg
  version: "1.0"
  tags: session, handoff, git, workflow, four-phases
---

# Ending Session

**A session is a closed loop.** It closes only when work is committed with a complete handoff AND landed to *this project's* definition of done.

Run the steps in order. Do not skip a step that applies.

---

## Step 1 — Check git state

```bash
git status --short
git diff --stat HEAD 2>/dev/null | tail -5
```

If there are uncommitted changes, ask once:
> "These files have uncommitted changes: [list]. Include them in the session commit?"

**Do not silently skip uncommitted work.** Surface it. One decision. Continue.

---

## Step 2 — Update WORK.md (if present)

Use `Edit` — surgical changes only.

**Do:**
1. Move completed items from `ACTIVE` → `DONE` with date: `- [x] <task> — <date>`
2. Add newly discovered work to `BACKLOG` (not ACTIVE)
3. Update `BLOCKED` — remove unblocked, add new with reason
4. Update `Phase:` header if project phase shifted
5. Update `PROJECT` status if milestone reached

**Don't:**
- Move BACKLOG → ACTIVE unless actually doing it now
- Add prose or summaries

---

## Step 3 — Commit the handoff

Generate commit message in this format:

```
<type>(<scope>): <one-line summary>

PHASE: <Ideate | Plan | Implement | Verify>
DONE: <what was completed — specific, comma-separated>
TODO: <what remains — THIS IS THE HANDOFF>
BLOCKED: <what is blocked, or omit>

Co-Authored-By: <Model Name> <noreply@provider.com>
```

Stage explicitly (never `git add -A`), commit, confirm:
```bash
git add WORK.md <other modified files>
git commit -m "<message>"
git log --oneline -1
```

**The `TODO:` line is the handoff** — specific enough to cold-start next session.

---

## Step 4 — Land it (per project's flow)

Detect how *this* project lands work:

**No remote** → commit on branch is the close. Done.

**Remote, no CI, trunk flow** → push; merge to main if that's the project's habit.

**Remote + CI + merge-to-main flow** (`.github/workflows/` exists):
```bash
git push -u origin <branch>
gh pr create --base main --head <branch> --title "…" --body "…"
gh pr checks <n> --watch        # wait for CI to pass
gh pr merge <n> --merge --delete-branch
git checkout main && git pull
```

If a gate requires human review you can't satisfy, stop and say **BLOCKED**.

---

## Step 5 — Tear down ephemeral resources (if any)

If session-start provisioned something ephemeral (DB branch, sandbox), tear it down:
```bash
./scripts/<provision>.sh down
```

Skip if project provisions nothing ephemeral.

---

## Output

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SESSION CLOSED  ·  <date>  ·  <repo>/<branch>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LANDED     <committed @hash  |  pushed  |  PR #N merged → main>
CI         <success  |  n/a>
BLOCKED    <anything blocked, or: none>

NEXT       <single concrete sentence — the exact entry point>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**NEXT is the most important line.** Specific enough that a cold session can pick it up.

---

## The Four Phases

| Phase | What it means |
|-------|--------------|
| **Ideate** | Figuring out what to build and why. No code yet. |
| **Plan** | Know what to build. Designing, decomposing tasks. |
| **Implement** | Building it. Writing code. |
| **Verify** | Built it. Testing, reviewing, validating. |

Use the phase you were in for most of the session, or the phase next session will begin in.

---

## Dispatch (Optional)

If this session had genuine creative or architectural insight:

Create `journal/<date>-<slug>.md`:
- Both voices if conversation
- Verbatim, unedited
- Hook line at top naming what emerged
- Dated

The roughness is the fidelity.

---

## Commit Convention Reference

```
feat(arc/quotes): implement price lock snapshot

PHASE: Implement
DONE: schema migration, Drizzle model, unit tests
TODO: integration test, API endpoint handler
BLOCKED: —

```

**Types:** `feat` `fix` `refactor` `docs` `test` `chore` `session`
**Scope:** the area — `<feature>`, `<module>`, `infra`
