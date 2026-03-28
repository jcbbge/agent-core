---
name: delegate
description: Create a full-scope agent handoff document (PRD-style spec) for delegating diagnosed work to a parallel async agent. Use when the user asks to "create a handoff document", "delegate to an agent", "create a spec we can give to an agent", or uses phrasing like "prd type spec document in this chat that we can delegate". Default output is inline in the chat. Optionally saves to a markdown file if the user says "--file" or "save as file".
---

# Delegate — Agent Handoff Document Generator

Generates a complete handoff spec from a diagnosis or problem already established in the current conversation. The agent receiving this document should be able to execute without asking clarifying questions.

## The Core Self-Check

> "Does this contain all of the information that I, myself, would need to complete this? What contextual information would be helpful if I came into this blindly and was asked to complete it?"

The document is done when a blind agent can pick it up and execute — not when all sections are filled.

## Trigger Phrases

- "create for me a prd type spec document in this chat that we can delegate to an agent"
- "create a handoff document"
- "delegate this to an agent"
- "write a spec we can give to an agent"
- "i need a full scope spec for an agent"
- `/delegate`

## Output Mode

- **Default**: Inline in chat as a markdown document
- **Optional**: If user says `--file` or "save as file", write to a `.md` file. Confirm path before writing.

---

## Required Output Format

The output has THREE parts, in this order. All three are required and visible. Skipping any part produces an incomplete artifact.

### Part 1 — Pre-Write Synthesis (show this before writing the document)

Emit this block explicitly before starting the document:

```
## Synthesis

Tasks identified:
- [name each discrete unit of work]

Parallelism:
- [which tasks are independent / which have dependencies and why]

Unknowns:
- [what is suspected vs. confirmed — what the agent may hit that can't be fully anticipated]
```

This is not internal reasoning. It appears in the output. If it can't be filled out, the conversation hasn't established enough to write the document yet — surface that to the user before proceeding.

---

### Part 2 — The Handoff Document

```markdown
# [System/Feature Name] — [What We're Fixing/Building]

**Status:** Ready for parallel execution
**Assigned to:** Agent (async)
**Report back to:** [user name] via [channel — dev-brain thread / direct output / etc.]

---

## Background & Context

[Write as if the agent has never seen this system. Cover: what is this system, what does it do,
what is the specific problem we're solving, where does relevant code live, what tools and CLIs
are available. Stop when a blind agent has enough to navigate without asking questions.]

---

## Infrastructure & Deployment Rules

[Required unless the domain has no infrastructure constraints — if omitting, write "N/A — [reason]"
so the agent knows it was considered. List every hard constraint before touching anything:
- Deployment workflows (exact tool names and paths)
- Secret hygiene rules
- Database access patterns
- Anything that, if missed, would cause the agent to do it wrong or dangerously]

---

## Task N — [Short descriptive name]

### Current State
[Exact observed state. Quote log output, error messages, or status indicators verbatim.
"The service appears broken" is not acceptable. "launchctl list returns exit 113" is.]

### Purpose
[Why does this component exist? What does it do when healthy? Prevents the agent from "fixing"
something in a way that defeats its purpose. Not optional.]

### Suspected Root Cause
[Best hypothesis with supporting evidence. If unknown: "Root cause unknown — investigation
required before any changes." Never omit.]

### Steps
[Numbered. Copy-pasteable. Exact file paths, exact commands, expected output after each step.
If a step requires judgment, say so and describe what to look for.]

1. ...
2. ...
3. ...

### Out of Scope
[What the agent must NOT do, even if it seems related. This is the boundary.]

### Definition of Done
[Observable, verifiable state. "It looks right" does not qualify.]

---

[Repeat Task block for each parallel task]

---

## Parallelism & Dependencies

[Which tasks are independent and can run simultaneously. Which have hard dependencies and why.
Do not leave this implicit.]

---

## Stop Rules

[Conditions requiring halt and report rather than continuing. Specific — not vague.
What constitutes a blocker vs. uncertainty.]

Do not:
[Specific dangerous actions prohibited under any circumstances.]

---

## Reporting Back

On completion, submit this report for each task:

​```
TASK N — [name]
Status: [fixed / blocked / needs human input]
Root cause confirmed: [what it actually was]
Current state: [observable state after work]
Stop rule triggered: [yes/no — if yes, describe]
Notes: [anything unexpected]
​```
```

---

### Part 3 — Checklist Results (show this after the document)

Emit this block after the document, with each item explicitly marked:

```
## Checklist

- [x/–] Pre-write synthesis shown before document
- [x/–] Blind agent can identify every file and tool needed without searching
- [x/–] Every command is copy-pasteable with no ambiguous placeholders
- [x/–] Infrastructure & Deployment Rules present or marked N/A with reason
- [x/–] Each task has a Purpose section
- [x/–] Each task has an Out of Scope section
- [x/–] Each task's Definition of Done is observable and verifiable
- [x/–] Stop Rules are present and specific
- [x/–] Parallelism & Dependencies is explicit
- [x/–] Root causes stated as hypotheses with evidence, or flagged as unknown
- [x/–] Reporting template covers every task

Any [–]: explain why and whether it's acceptable before delivering.
```

`[x]` = passes. `[–]` = failed or skipped. A `[–]` with no explanation is not acceptable output.
