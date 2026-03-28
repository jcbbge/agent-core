# Rules

Always-loaded constraints. Never require invocation. Always in context.

Rules deploy as a DIRECTORY (`~/.claude/rules/`) — one `.md` file per concern.
This is better than one giant CLAUDE.md: modular, editable, composable.

## Files in this directory

Each `.md` file here gets deployed to `~/.claude/rules/[name].md`.

## Naming convention

```
security.md       # No hardcoded secrets, input validation, OWASP
coding-style.md   # Language patterns, file size limits, immutability
testing.md        # TDD workflow, coverage requirements
git-workflow.md   # Commit format, PR process, branch naming
agents.md         # When to delegate, which subagent to use
performance.md    # Model selection (Haiku vs Sonnet vs Opus), context management
hooks.md          # What hooks exist, what they do
```

## What belongs in rules vs skills vs CLAUDE.md

| Content | Where |
|---------|-------|
| Always applies, no exceptions | Rules file |
| Applies to a specific workflow | Skill |
| Identity, provider-agnostic meta-instructions | CLAUDE.md / AGENTS.md |
| Project-specific constraints | Project-level CLAUDE.md |

## Context window note

Rules are always loaded. Every rule file adds to base context.
Keep each file tight. No essays — just directives.
