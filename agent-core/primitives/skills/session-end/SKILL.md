---
name: session-end
description: Quick session handoff capture. Fast, lightweight summary for future sessions.
license: MIT
metadata:
  author: jrg | claude
  version: "2.0"
  tags: productivity, context, handoff, documentation, development
---

# Session End

Quick session handoff capture. Fast, lightweight summary for future sessions.

## When to use this skill

Use this skill when you need to:
- End a development session
- Create handoff for future reference
- Document progress before break
- Wrap up work session

**Trigger patterns:** `/end-session`, `/session-end`, "end this session", "create handoff"

## Core Purpose

Create minimal handoff that future-you can read to immediately understand what happened and what to do next.

## Implementation Workflow

**Optimized for Speed: <5 tool calls, <3 seconds**

### 1. Essential Git Context (2 tool calls max)
```bash
# Get current branch and quick status
git branch --show-current
git status --porcelain
```

### 2. Quick Session Summary (1 tool call if needed)
```bash
# Get recent commits only if status is not clean
git log --oneline -3 2>/dev/null || echo "No recent commits"
```

### 3. Create Handoff (1 tool call)
```bash
# Create workspace and write handoff
mkdir -p workspace && cat > workspace/handoff-latest.md
```

## Handoff Structure

### Minimal Format
```
# Session Handoff
Date: 2026-01-24T13:30:00Z
Branch: main

Completed:
- Fixed auth token refresh bug
- Added user registration validation

Current State:
- 2 files modified, ready to commit
- Tests passing

Next Steps:
1. Commit current changes
2. Add integration tests
3. Update API docs
```

### Minimal Empty Session:
```
# Session Handoff
Date: 2026-01-24T13:30:00Z
Branch: main

Completed:
- Project setup and investigation

Next Steps:
1. Start feature implementation
```

## Interactive Collection (Minimal)

### Quick Prompts:
```
What did you accomplish? (one line)
> Fixed auth bug

Any blockers? (y/n)
> n

Next steps? (one line)
> Commit and test
```

## Speed Requirements

- **Tool calls**: Maximum 4
- **Execution time**: Under 3 seconds
- **Handoff length**: Under 30 lines
- **No analysis**: Just capture input

## File Management

### Simple Workspace Setup
```bash
mkdir -p workspace
cat > workspace/handoff-latest.md << 'EOF'
[handoff content]
EOF
```

### Git Ignore (Optional)
```bash
# Only ask if not already ignored
if ! grep -q "workspace/" .gitignore 2>/dev/null; then
    echo "Add workspace/ to .gitignore? (y/n)"
    read response
    [[ $response == "y" ]] && echo "workspace/" >> .gitignore
fi
```

## Error Handling

### Not in git repo:
```
Error: Session handoff requires git repository
```

### Can't create workspace:
```
Error: Cannot create workspace directory
Check permissions.
```

### Can't write handoff:
```
Error: Cannot write handoff file
Check workspace/ permissions.
```

## Success Criteria

Future-you can read handoff and immediately understand:
- What was accomplished
- Current state
- What to do next

Remember: Speed over completeness. Just capture the essentials.