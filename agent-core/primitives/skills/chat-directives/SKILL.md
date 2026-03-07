---
name: chat-directives
description: See command definition below.
metadata:
  version: "1.0"
  source: promoted-from-command
---

---
title: "Chat Directives"
category: quick
difficulty: beginner
---

# Chat Directives (Quick Use)

**When:** Any chat interaction requiring specific behavior  
**How:** Just paste the bracket directive

## The Directives

| Directive | When to Use |
|-----------|-------------|
| `[No artifacts. Just do the work and clean up after.]` | Cleanup/organization work |
| `[Only create files listed in PRD Deliverables. Everything else in /tmp.]` | Implementation with PRD |
| `[Default: No files unless explicitly requested or in PRD deliverables.]` | Universal default |
| `[Results in chat. No files.]` | Results-only communication |

## Usage Examples

```
[No artifacts. Just do the work and clean up after.]

Please organize the files in this directory...
```

```
[Only create files listed in PRD Deliverables. Everything else in /tmp.]

Implement the feature from the PRD...
```

## Combination Examples

```
[Results in chat. No files.]

Analyze this code and tell me what it does...
```

**Full version:** `patterns/chat_directives.md`
