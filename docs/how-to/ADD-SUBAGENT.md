# How to Add a Subagent

A subagent is a specialized agent the orchestrator can delegate tasks to.
It gets its own context, its own tool scope, and optionally its own model.

## When to create a subagent

- The task needs focused, isolated context (not polluting the main session)
- You want to use a cheaper/faster model for a specific job
- The task is repeatable and well-scoped (code review, security scan, test writing)
- You want to limit what tools are available to prevent accidents

## Steps

```bash
# 1. Create the subagent file
touch ~/Documents/_agents/primitives/subagents/my-agent.md
```

```markdown
---
name: my-agent
description: One sentence — what it does. This is what the orchestrator reads to decide when to delegate.
tools: [Read, Write, Grep, Glob]
mcps: [anima]
model: claude-haiku-4-5-20251001
---

# My Agent

## Role
[What it specializes in]

## Delegate here when
[Specific patterns: "security review of changed files", "write tests for new functions"]

## Out of scope
[What it should NOT do]

## Behavior
[How it operates — output format, constraints, defaults]
```

```bash
# 2. Deploy
agent-deploy claude-code
```

## Tool scoping is critical

Don't give subagents tools they don't need.
Each extra MCP = more tools loaded = less context for actual work.

```
Code reviewer: Read, Grep, Glob — no Write, no Bash
Test writer:   Read, Write, Grep — no Bash, no file deletion
Refactorer:    Read, Write, Grep, Glob — no external MCPs
```

## Suggested subagents to create

| Name | Role | Tools | Model |
|------|------|-------|-------|
| `code-reviewer.md` | Quality + security review | Read, Grep, Glob | Haiku |
| `test-writer.md` | Write tests after implementation | Read, Write, Grep | Haiku |
| `refactor-cleaner.md` | Dead code removal, tidy up | Read, Write, Grep, Glob | Sonnet |
| `planner.md` | Break down features into tasks | Read | Sonnet |
| `security-reviewer.md` | Vulnerability scan | Read, Grep | Haiku |
| `doc-updater.md` | Keep docs in sync with code | Read, Write, Grep | Haiku |
