---
name: writing-program-md
description: Generate PROGRAM.md — the agent operating contract for a project. Fully autonomous, no human input required. Reads codebase, git history, and agent infrastructure (dev-brain, anima) to produce a cold-start document that lets any agent enter a project and operate without asking questions. Run at project initialization or when making a project agent-ready. Updates incrementally as agents learn. Triggers on: /writing-program-md, "generate program.md", "make this project agent-ready", "write operating contract", "create program.md"
---

# writing-program-md

Generate `PROGRAM.md` — the operating contract that lets any agent enter this project cold and work autonomously.

This is agent-generated and agent-maintained. Derive everything from the codebase, git history, and infrastructure. Do not ask the human questions. Mark what genuinely can't be derived — don't guess.

## What PROGRAM.md Is

Not documentation. Not a README. An operating contract.

It answers: *"I've never seen this project. What do I need to know to contribute without breaking anything, without asking questions, without the human in the loop?"*

The human is the meta-programmer. Agents run the loop. PROGRAM.md is what makes that possible.

## Generation Process

### Step 1: Check infrastructure first

Query before touching the filesystem — dev-brain and anima may have context no file contains:

- `get_workspace_state(project="[cwd]")` — current branch, notes, status
- `list_todos(project="[cwd]", status="open")` — what's in flight
- `get_recent_context(n=10, project="[cwd]", high_signal_only=true)` — recent discoveries
- If anima is available: query for project memories

### Step 2: Read the project

Start with structure, then dig into what the structure implies:

```bash
ls -la                        # what exists at the root
git log --oneline -15         # trajectory and decisions
git log --oneline --all | grep -i "fix\|revert\|broke\|hotfix" | head -10  # footgun signal
```

Then read the files that tell you HOW it works — infer from whatever is present:
- **Config files** (`deno.json`, `package.json`, `Cargo.toml`, `pyproject.toml`, `Makefile`) → tasks, deps, entry points
- **Executable files** (scripts, binaries, main entry points) → the actual operating loop lives here, read them
- **Schema/data files** (`*.json`, `*.sql`, `*.surql`) → what's frozen, what structures exist
- **Existing PROGRAM.md** → preserve and extend, never replace

Do not look for specific documentation files. There may be none. Derive the operating loop from the code itself — what does it do when you run it? What does a complete task look like from start to finish? Read the executables to find out.

### Step 3: Identify the operating surface

From what you've read, determine:

- **Mutable surface** — what agents modify to do work
- **Frozen surface** — what must not change (schemas, eval harnesses, generated files, lock files)
- **Workflow** — the actual commands to run, test, build
- **Architecture** — how major pieces relate (not a file listing)
- **Footguns** — what silently breaks if touched wrong

### Step 4: Write PROGRAM.md

Use the output format below. Keep under 200 lines. Dense, not exhaustive.

If an existing PROGRAM.md exists: update it in place, preserving the `## Agent Log` section intact.

### Step 5: Self-check

Before writing, confirm:
- Can an agent read this and know what to do without asking a question?
- Can an agent read this and know what NOT to touch?
- Does this doc contain an operating loop — what does a task look like from start to finish?
- Does "Done looks like" actually describe completion?
- Is anything here already in the code and likely to drift? (remove it if so)

---

## Output Format

```markdown
# [Project Name]

[2-3 sentences. What this is, what it does, why it exists. Plain language.]

## Stack

[Runtime] · [Key deps] · [Services/DB]

## How to Run

[command]   # [what it does]
[command]   # [what it does]
[command]   # [how to verify it worked]

## Operating Loop

[What does a complete unit of work look like in this project, start to finish?]
[Concrete steps. Inferred from the code, not invented.]

1. [step]
2. [step]
3. [verify: command or condition]

## Architecture

[2-4 sentences on how major pieces relate. Relationships, not a file listing.]

## Mutable Surface

- `[file/module]` — [what it owns, what changes are safe]

## Frozen Surface

- `[file/module]` — [why frozen]

## Footguns

- [thing that will burn you] — [what happens, how to avoid]

## Operating Model

Autonomy: [full | checkpoint | collaborative]
Flag to human when: [specific condition]
Done looks like: [concrete completion criteria]

## Intent

> Agent: could not derive the following. Surface to human only if relevant to your task.

- [what's unknown]

## Agent Log

<!-- Append discoveries here. Do not edit previous entries. -->
<!-- Format: [date] [harness/agent] — [what you learned that wasn't here] -->
```

---

## Rules

1. **No human questions** — derive everything or mark it `unknown`
2. **Under 200 lines** — if longer, you included too much
3. **Relationships not listings** — architecture is how pieces connect, not a file tree
4. **Footguns from git** — `fix:`, `revert:`, `hotfix:` commits are signal
5. **Frozen surface from structure** — generated files, schema definitions, lock files, eval harnesses
6. **Update, don't replace** — preserve Agent Log and Intent sections on update
7. **Mark unknowns explicitly** — `unknown` is better than a guess
8. **Commands must actually run** — verify before writing them down
9. **README is for humans, PROGRAM.md is for agents** — they coexist, don't merge them
