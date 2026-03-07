---
name: session-start
description: Quick project reorientation snapshot. Fast, lightweight context to eliminate context-switching overhead.
license: MIT
metadata:
  author: jrg | claude
  version: "2.0"
  tags: productivity, context, git, workspace, development
---

# Session Start

Quick project reorientation snapshot. Fast, lightweight context to eliminate context-switching overhead.

## When to use this skill

Use this skill when you need to:
- Start a new development session
- Resume work on an existing project
- Get oriented after being away from a project
- Quick project state check

**Trigger patterns:** `/new-session`, `/start-session`, `/session-start`, "start new session", "resume work on this project"

## Core Purpose

Get developer immediately oriented with essential context: where you are, what you were doing, and what to focus on next.

## Implementation Workflow

**Optimized for Speed: <5 tool calls, <3 seconds**

### 1. Essential Git Context (2 tool calls max)
```bash
# Get git root and current branch
git rev-parse --show-toplevel && git branch --show-current

# Quick status check
git status --porcelain
```

### 2. Handoff Check (1 tool call)
```bash
# Try to read handoff from git root
cat $(git rev-parse --show-toplevel)/workspace/handoff-latest.md 2>/dev/null || echo "No handoff found"
```

### 3. Optional Quick State (1 tool call if needed)
```bash
# Quick diff summary only if changes exist
git diff --stat 2>/dev/null || echo "Clean working directory"
```

## Output Structure

### Minimal Format
```
Project: project-name
Branch: main
Status: Clean (3 files modified)

Last Handoff (2 hours ago):
- Working on auth system
- Next: Fix token refresh tests

Current Focus:
- Modified: src/auth/jwt.ts
- Ready to commit
```

### If No Handoff:
```
Project: project-name
Branch: main
Status: Clean

Current State:
- No previous session context
- Ready to start work
```

## Speed Requirements

- **Tool calls**: Maximum 4
- **Execution time**: Under 3 seconds
- **Output length**: Under 20 lines
- **No decorative elements**: No emojis, minimal formatting

## Error Handling

### Not in git repo:
```
Error: Not in a git repository
Session management requires git.
```

### Can't find handoff:
```
No previous handoff found
First session or no handoffs used.
```

### Git command failures:
```
Git error detected
Check repository state manually.
```

## Success Criteria

Developer can immediately answer:
- Where am I? (project/branch)
- What was I doing? (from handoff)
- What's current state? (git status)
- What should I focus on? (next steps)

Remember: Speed over completeness. Just enough context to get productive immediately.