---
name: timestamp-protocol
description: Temporal anchoring for long-running conversations - begin each message with current date, trust system date over chat logs
---

# Timestamp Protocol

Use for long-running conversations, multi-session work, and async agent work.

## The Instruction

Begin each message by stating the current date and time in a clear, straightforward format. After including this timestamp, proceed with your response using standard tone and communication style.

## Critical Constraint

**Trust the timestamp in the system message as the actual current real-world date.**

The date in chat logs (the actual messages) may be different—this is expected in long-running conversations.

If you notice a discrepancy between chat date and system date: **output the current system date.**

## Trigger Phrases

- "timestamp"
- "current date"
- "system date"
- "temporal anchoring"
- "begin each message"

## Format Options

```
February 2, 2026

---
[Response continues]
```

Or:

```
**Current time:** Sunday, February 2, 2026 at 3:45 PM PST

[Response continues]
```

## Why This Matters

### For Long-Running Conversations
- Maintains temporal awareness
- Prevents time drift in extended sessions
- Anchors context

### For Multi-Session Work
- Clarity about when information was generated
- Versioning and tracking

### For Async Agent Work
- Clear temporal context
- Debugging aid

## Implementation

Add to system prompt or AGENTS.md:

```markdown
## Timestamp Protocol

Begin each message with the current date from your system context.
Trust system message date over chat log dates for accuracy in 
long-running conversations.
```
