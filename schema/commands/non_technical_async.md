---
title: "Non-Technical Async"
category: quick
difficulty: beginner
---

# Non-Technical Async Pattern (Quick Use)

**When:** Working with stakeholders, non-technical teammates  
**Trigger:** "non-technical" | "simple explanation" | "async"

## The Prompt

```
This is my prompt: "[INSERT TASK]"

Can you spin off an async background agent to do this and periodically poll it as it does work and summarize what is happening.

I'm not technical at all so please summarize it in a simple way for me. Use the explore agent to summarize how things work so I can learn while I do this.

If the background agent runs into any errors, please stop and tell me but guide me in how I might be able to fix it.

Remember I am non technical, so any technical language at all is not useful to me.
```

## Architecture

1. **User provides task** → simple prompt
2. **Async background agent** → does actual work
3. **Periodic polling** → status updates
4. **Simplified summaries** → translated to non-technical
5. **Educational component** → learn while it runs
6. **Error handling with guidance** → stop + explain + suggest fix

## The Translation Layer

> "Any technical language at all is not useful"

Forces agent to find metaphors, analogies, simple explanations.

## Why This Works

- **No jargon barrier** - explicitly forbidden
- **Visibility** - can see what's happening
- **Education** - builds understanding over time
- **Agency** - errors are learning opportunities, not dead ends
- **Trust** - transparency builds confidence

**Full version:** `prompts/non_technical_async.md`
