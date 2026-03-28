---
name: processing-sigils
description: Distill captured content into agent-core primitives. Takes a sigil inbox item (blog, repo, article, tweet, idea) and collaboratively classifies it against the nine agentic primitives — then builds it. Use when processing captures from ~/Documents/metaprompts/_inbox/.
metadata:
  version: "2.0"
  category: meta-cognitive
  inbox_location: ~/Documents/metaprompts/_inbox/
---

# Processing Sigils — Primitive Distillation

Captured content is raw intent. This skill extracts it, classifies it against the nine primitives, and builds the result.

## When to Use

- "Process my sigil inbox"
- "Let's distill this capture"
- "processing-sigils"
- Processing one item or spinning up agents for each — same process either way

## Relationship to sigil-distiller

This skill is the **interactive mode** — human-in-the-loop, collaborative distillation.

For **autonomous batch processing**, delegate to the `sigil-distiller` subagent:
- One agent instance per inbox item
- Parallel execution for speed
- Items that need real-time collaboration → use this skill
- Items that can be classified autonomously → delegate to sigil-distiller

## The Nine Primitives

Every item gets filtered through these. One item can map to multiple.

| # | Primitive | What it is |
|---|-----------|------------|
| 1 | **Always-loaded instructions** | AGENTS.md / system prompt — identity, behavioral rules, core constraints |
| 2 | **Rules** | Path-scoped `.md` files with `globs:` frontmatter — load only when relevant files match |
| 3 | **Skills** | On-demand knowledge loaded explicitly — reusable patterns, workflows, domain knowledge |
| 4 | **Commands** | Slash shortcut → skill or workflow invocation |
| 5 | **Custom Tools** | MCP functions/tools — structured input/output, callable by the agent |
| 6 | **Hooks** | Event-driven automation — PreToolUse, PostToolUse, notification triggers |
| 7 | **MCP Servers** | Always-on services the agent can call — databases, APIs, persistent state |
| 8 | **Subagents** | Specialized agent instances — reviewer, test-writer, architect, debugger |
| 9 | **Plugins** | Harness-specific extensions (Claude Code plugins, etc.) |

## Process

### 1. Load the Item

Read the inbox file. Extract:
- **Title** — what was captured
- **Why** — the user's raw intent annotation (this is the signal)
- **Content** — the raw captured material (article, repo README, tweet, etc.)
- **Type** — text, url, transcript, image

### 2. Extract the Core Thesis

Before classifying, synthesize what this is actually about in 1-2 sentences.

Surface it: "The core idea here is: [thesis]"

Confirm or let the user refine it before continuing.

### 3. Run the Primitive Filter

Walk the nine primitives as a lens. For each that fits, state why.

Ask directly: **"Which primitive does this become?"**

Guide the analysis:
- Does this encode reusable knowledge or a workflow pattern? → **Skill**
- Does this apply only in certain file/project contexts? → **Rule**
- Does this belong in the agent's always-on identity/behavior? → **Always-loaded instructions**
- Does this need a slash command shortcut? → **Command**
- Does this require structured callable behavior with inputs/outputs? → **Custom Tool**
- Does this suggest automating a response to an agent event? → **Hook**
- Does this warrant a persistent always-on service? → **MCP Server**
- Does this describe a specialized agent role? → **Subagent**
- Is this harness-specific functionality? → **Plugin**

An item can map to multiple primitives. Name them all.

### 4. If No Primitive Fits

Don't force it. Ask:
- Is this the seed of a **new project**?
- Is this a **pure idea** worth talking through first?
- Is this **not ready** — interesting but no clear implementation path yet?

If new project: start the scoping conversation.
If pure idea: brainstorm, explore, let it breathe.
If not ready: note it and move on — don't over-engineer premature ideas.

### 5. Build It

**CRITICAL: Build ALL primitives that apply, not just one.**

Once classified, execute immediately. Don't just plan.

For each primitive that matches:
1. Create the primitive file
2. Then move to the next
3. After ALL are created, run deploy

**Skill:**
Create `~/Documents/_agents/primitives/skills/<name>/SKILL.md`

**Rule:**
Create `~/Documents/_agents/primitives/rules/<name>.md`

**Hook:**
Create/update `~/Documents/_agents/primitives/hooks/<event>/<name>.sh`

**Subagent:**
Create `~/Documents/_agents/primitives/subagents/<role>/AGENT.md`
Define: role, scope, inputs, outputs, behavioral constraints

**MCP Server / Custom Tool / Plugin:**
Scope the build, identify the port/namespace, check `brain-infrastructure.md` for conflicts
Start implementation or stub with clear spec

**Always-loaded instructions:**
Propose the specific addition to AGENTS.md — minimal, high-signal only

**Command:**
Add to the appropriate commands config for the relevant harness(es)

After building: primitives are symlinked — new files are immediately available to all harnesses.

## Interaction Model

This is a conversation, not a batch job.

- Present the thesis. Confirm.
- Walk the primitive filter together. Propose, don't dictate.
- When multiple primitives fit: BUILD ALL OF THEM. No sequencing.
- Build immediately after classification — don't defer to a separate session.
- Keep momentum. One item, one focused distillation session.

## File Operations

Inbox: `~/Documents/metaprompts/_inbox/`
After processing: move to `~/Documents/metaprompts/_inbox/archive/`
_agents root: `~/Documents/_agents/`

New primitives are immediately available via symlinks — no deploy step needed.
