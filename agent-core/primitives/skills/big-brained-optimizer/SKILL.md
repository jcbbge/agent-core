---
name: big-brained-optimizer
description: See command definition below.
metadata:
  version: "1.0"
  source: promoted-from-command
---

---
title: "Big-Brained Optimizer"
category: quick
difficulty: advanced
---

# Big-Brained Optimizer (Quick Use)

**When:** Performance tuning, refactoring, system optimization  
**Trigger:** "optimize this" | "make it faster" | "find inefficiencies"

## The Prompt

```
First read ALL of the AGENTS dot md file and README dot md file super carefully and understand ALL of both! Then use your code investigation agent mode to fully understand the code, and technical architecture and purpose of the project.

Then, once you've done an extremely thorough and meticulous job at all that and deeply understood the entire existing system and what it does, its purpose, and how it is implemented and how all the pieces connect with each other, I need you to hyper-intensively investigate and study and ruminate on these questions as they pertain to this project:

Are there any other gross inefficiencies in the core system? Places in the codebase where:

1) changes would actually move the needle in terms of overall latency/responsiveness and throughput;

2) and where our changes would be provably isomorphic in terms of functionality, so that we would know for sure that it wouldn't change the resulting outputs given the same inputs (for approximate numerical methods, you can interpret "the same" as "within epsilon distance";

3) where you have clear vision to an obviously better approach in terms of algorithms or data structures (note that for this, you can include in your contemplations lesser-known data structures and more esoteric/sophisticated/mathematical algorithms as well as ways to recast the problem(s) so that another paradigm is exposed, such as convex optimization theory or dynamic programming techniques.

Also note that if there are well-written third-party libraries you know of that would work well, we can include them in the project). Use ultrathink.
```

## Copy-Paste Template

Replace `[DOCS]` with actual documentation files:

```
First read ALL of [DOCS] super carefully and understand ALL. Then use code investigation mode to fully understand the technical architecture and purpose.

Once you've done an extremely thorough job and deeply understood the entire existing system, hyper-intensively investigate:

Are there any gross inefficiencies where:
1) changes would move the needle on latency/responsiveness/throughput;
2) changes are provably isomorphic (same outputs for same inputs);
3) you have clear vision to obviously better algorithms/data structures.

Use ultrathink.
```

## Key Constraints
- Must move the needle (not micro-optimizations)
- Must be provably safe (isomorphic changes)
- Must have clear vision to better approach

**Full version:** `prompts/big_brained_optimizer.md`
