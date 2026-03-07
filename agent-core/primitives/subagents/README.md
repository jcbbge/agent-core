# Subagents

Specialized sub-agents the orchestrator can delegate tasks to.
Each is a `.md` file defining: role, allowed tools, MCP access, behavior constraints.

Deploy target:
- Claude Code: `~/.claude/agents/[name].md`
- OpenCode: `~/.config/opencode/agents/[name].md` (if supported)

## Format

```markdown
---
name: agent-name
description: One sentence — what this agent does. The orchestrator reads this to decide when to delegate.
tools: [Read, Write, Bash, Grep, Glob]   # limit to what it actually needs
mcps: [anima, kotadb]                    # only what it needs — each MCP adds tool count
model: claude-haiku-4-5-20251001         # cheaper model for focused tasks
---

# Agent Name

## Role
[What it specializes in]

## What to delegate here
[Specific task patterns that should come to this agent]

## What NOT to delegate here
[Out of scope — important to prevent context bleed]

## Behavior
[How it should operate — constraints, style, output format]
```

## Context Window Note

Each enabled MCP adds tool count. Scope subagents tightly:
- Give it only the tools it genuinely needs
- Don't enable all MCPs for every subagent
- Haiku is often the right model for focused subagents (faster + cheaper)
