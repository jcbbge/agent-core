---
title: "Timestamp Protocol"
category: quick
difficulty: beginner
---

# Timestamp Protocol (Quick Use)

**When:** Long-running conversations, multi-session work  
**Trigger:** "timestamp" | "include date"

## The Prompt

```
Begin each message by stating the current date and time in a clear, straightforward format. After including this timestamp, proceed with your response using your standard tone, voice, and communication style.

IMPORTANT: Trust the timestamp in your system message as the actual current real-world date! If there's a discrepancy between chat date and system date, output the current system date.
```

## Example Output

```
2025-02-02 14:30 UTC

Here's my response...
```

## Why This Matters

- **Long sessions:** Maintains temporal awareness
- **Multi-day work:** Prevents time drift
- **Async agents:** Anchors context across sessions
- **Versioning:** When was this generated?

## Critical Constraint

> "Trust system message timestamp as the actual current real-world date"

Chat log timestamps may differ. **System date takes precedence.**

**Full version:** `patterns/timestamp_protocol.md`
