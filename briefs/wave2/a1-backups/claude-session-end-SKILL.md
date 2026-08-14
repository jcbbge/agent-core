---
name: session-end
description: Close a session cleanly. Commit with the standard handoff format so
  git log carries the handoff. Project-agnostic — detects the project's own
  definition of done; assumes no specific stack. Call at the end of every session.
argument-hint: <optional — summary of what was done>
allowed-tools: Bash Read Write Edit
metadata:
  author: jrg
  version: "3.0"
  tags: session, handoff, git, workflow, four-phases
  lineage: substrate-collapse, manifold-ipit, constellation-re-entry
  constellation-upgrade: "Collapse completed trajectories to the Nebula. Update
    pheromone STATUS file. Emit session telemetry to spine. WORK.md retires
    when the Nebula exists. Commit format and NEXT output are identical."
---

# Session End

**A session is a closed loop. It closes only when its work is committed with a complete
handoff AND landed to *this project's* definition of done.**

"Committed is not done" is universal. But where "done" *terminates* — a branch commit, a
pushed branch, a merged PR, a green CI run — is set by the **project**, not assumed. Detect the
project's shape and act accordingly. Never assume a specific stack: no Neon, no CI, no
merge-to-main unless the project actually has them.

Run the steps in order. Do not skip a step that applies; do not perform one that doesn't.

---

## Step 1 — Check git state

```bash
git status --short
git diff --stat HEAD 2>/dev/null | tail -5
```

If there are uncommitted changes, list them and ask once:
> "These files have uncommitted changes: [list]. Include them in the session commit?"

Do not silently skip uncommitted work. Surface it, one decision, continue.

---

## Step 2 — Commit the handoff

Generate a commit message in this format:

```
<type>(<scope>): <one-line summary>

PHASE: <Ideate | Plan | Implement | Verify>
DONE: <what was completed — specific, comma-separated>
TODO: <what remains active — THIS IS THE HANDOFF, comma-separated>
BLOCKED: <what is blocked, or omit this line>

Co-Authored-By: <Model Name> <noreply@provider.com>
```

Stage explicitly (never `git add -A`), commit, confirm the hash:
```bash
git add <modified files>
git commit -m "<message>"
git log --oneline -1
```

The `TODO:` line is the handoff — specific enough to cold-start next session. Not "continue
the feature"; the exact first action.

---

## Step 3 — Land it (per the project's flow — detect, don't assume)

Determine how *this* project lands work, and take it as far as that flow goes:

- **No remote** → the commit on the branch *is* the close. Done.
- **Remote, no CI, trunk/solo flow** → push; merge to the main line if that's how the project
  integrates. Done when pushed (or merged), per the project's habit.
- **Remote + CI + merge-to-main flow** (a `.github/workflows/` or equivalent exists, or the
  project declares one) → the bar is **merged to a green main**, and there it is non-negotiable:
  ```bash
  git push -u origin <branch>
  gh pr create --base main --head <branch> --title "…" --body "…"
  gh pr checks <n> --watch         # wait for CI to ACTUALLY pass — never infer from pre-push hooks
  gh pr merge <n> --merge --delete-branch
  git checkout main && git pull && gh run list --branch main --limit 3   # merge commit's run must be success
  ```
  Here "committed / pushed / PR-open is not done" applies in full.

If a hard gate is something you cannot satisfy yourself (a required human review), stop and say
so as **BLOCKED** — never silently stop at "pushed" and claim closure.

---

## Step 4 — Tear down ephemeral session resources (only if session-start spun some up)

If session-start provisioned something ephemeral — a cloned DB branch, a sandbox, a dev server
— tear it down now, symmetric with how it came up. Detect by the provisioning artifact the
project ships (e.g. a `scripts/<provision>.sh`); if present, run its spin-down:
```bash
./scripts/<provision>.sh down        # the mirror of the session-start spin-up
```
Skip entirely if the project provisions nothing ephemeral, or if you're deliberately keeping it
alive to continue in another window (say so explicitly).

---

## Output

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SESSION CLOSED  ·  <date>  ·  <repo>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LANDED     <committed @hash on <branch>  |  pushed  |  PR #<n> merged → main>
CI         <success  |  n/a (no CI on this project)>
BLOCKED    <anything blocked, or: none>

NEXT       <single concrete sentence — the exact entry point next session = the TODO: line>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

The `LANDED` line must be real and must match the project's flow — don't print a merge that
didn't happen, and don't withhold closure because a flow the project doesn't have (CI / merge)
wasn't run. **NEXT is the most important line** — specific enough that a cold session can pick
it up without context.

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

If this session had genuine creative or architectural insight — something that emerged from the
exchange that wouldn't have arrived alone — write a dispatch: `journal/<date>-<slug>.md`, both
voices if it was a conversation, verbatim and unedited, a single hook line at the top naming
what emerged, dated. The roughness is the fidelity. Don't polish it.

---

## The Commit Convention (Reference)

```
<type>(<scope>): <summary>

PHASE: Implement
DONE: <what was completed>
TODO: <the handoff — the exact next action>
BLOCKED: —

Co-Authored-By: <Model Name> <noreply@provider.com>
```

Types: `feat` `fix` `refactor` `docs` `test` `chore` `session`
Scope: the area — `<feature>`, `<module>`, `infra`, `docs`
