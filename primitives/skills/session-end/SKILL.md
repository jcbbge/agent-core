---
name: session-end
description: Close a session cleanly. Update WORK.md, commit with the standard
  handoff format, leave the next session with a clear entry point. Three steps.
  No services required. Use at the end of every session before closing.
argument-hint: <optional — summary of what was done>
allowed-tools: Bash Read Write Edit
metadata:
  author: jrg
  version: "1.0"
  tags: session, handoff, git, workflow
  constellation-upgrade: "When Constellation ships: collapse completed trajectories
    to the Nebula, update pheromone files, emit session telemetry to spine."
---

# Session End

Three steps. In order. Do not skip steps.

---

## Step 1 — Check git state

```bash
git status --short
git diff --stat HEAD 2>/dev/null | tail -5
```

If there are uncommitted changes, ask:
> "There are uncommitted changes in: [list files]. Should I include these in the session commit?"

Do not silently skip uncommitted work. Surface it. Let the human decide.

---

## Step 2 — Update WORK.md

Make these changes using Edit (surgical — do not rewrite the file):

1. **Move completed tasks** from ACTIVE to DONE with today's date
2. **Add new items** discovered this session to BACKLOG (not ACTIVE)
3. **Update BLOCKED** — remove anything that got unblocked, add new blockers
4. **Update the Phase header** if the project phase shifted this session

The DONE entry format:
```
- [x] <what was done> — <date>
```

Do not add prose or summaries. Just move items.

---

## Step 3 — Commit

Generate a commit message using the standard convention:

```
<type>(<scope>): <one-line summary>

PHASE: <Ideate | Plan | Implement | Verify>
DONE: <completed items, comma-separated — be specific>
TODO: <remaining active items, comma-separated — this is the handoff>
BLOCKED: <what is blocked, or omit>

Co-Authored-By: <Model> <noreply@provider.com>
```

Then commit:
```bash
git add WORK.md <any other modified files — explicit, never -A>
git commit -m "<generated message>"
```

After committing:
```bash
git log --oneline -1
```

Confirm the commit landed.

---

## Output Format

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SESSION CLOSED  ·  <date>  ·  <repo>/<branch>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMMITTED   <hash> — <summary>

DONE        <what moved to DONE in WORK.md>
ACTIVE      <what remains — N tasks>
BLOCKED     <anything blocked>

NEXT        <the single most important TODO — the entry point for next session>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

The NEXT line is the most important output. It should be a single, concrete,
actionable sentence. Not "continue the feature" — "wire the price lock snapshot
to the quote finalize endpoint, then run the integration test."

---

## Dispatch (Optional — For Sessions With Generative Content)

After the commit, if this session had real creative or architectural insight,
capture it as a dispatch:

> "Should I write a session dispatch?"

If yes, create `journal/<date>-<slug>.md` with both voices — what was discovered,
what surprised, what emerged from the exchange. Verbatim. Unedited.

This is the journal/ protocol from Constellation. Same ritual.
The roughness is the fidelity.

---

## Constellation Upgrade Path

When Constellation ships:

- Step 2 → write to Nebula pheromone files instead of WORK.md
- Step 3 → emit session telemetry to spine + generate verified commit
- NEXT line → becomes the trajectory's STATUS file entry
- Dispatch → first-class artifact in the Nebula, autobiographer-indexed

The four-phase vocabulary carries forward unchanged.
WORK.md is the pre-Constellation Nebula. When the Nebula exists, WORK.md retires.
