---
name: think-critically
description: See command definition below.
metadata:
  version: "1.0"
  source: promoted-from-command
---

---
title: "Think Critically"
category: quick
difficulty: intermediate
---

# Think Critically (Quick Use)

**When:** Architecture decisions, technology selection, strategy  
**Trigger:** "think critically" | "tradeoffs" | "which approach"

## The Prompt

```
Think critically through how best to implement this elegantly given our architecture and goals. If there are multiple approaches, provide them with tradeoffs, weighing all options. Ask clarifying questions to help decide which one we should go with.
```

## What You Get

1. **Multiple approaches** (if applicable)
2. **Tradeoff analysis** for each
3. **Weighted comparison**
4. **Clarifying questions** (not a recommendation)

## Key Insight

This prompt creates **decision support**, not answer-giving. You retain agency. The agent provides intelligence.

## Example Output Structure

```
Approach A: [Description]
- Pros: ...
- Cons: ...
- Tradeoffs: ...

Approach B: [Description]
- Pros: ...
- Cons: ...
- Tradeoffs: ...

Clarifying Questions:
1. ...
2. ...
3. ...
```

## When to Use

- Architecture decisions
- Technology selection
- Implementation strategies
- Any situation where tradeoffs exist

**Full version:** `prompts/think_critically.md`
