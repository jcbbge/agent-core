---
name: step-workflow
description: Sequential phase-gated workflow combining ideation, critical review, and optimization with explicit transitions. Use for complex projects requiring multiple passes or when a structured step-one/step-two approach is needed.
metadata:
  version: "1.0"
  source: promoted-from-command
---

---
title: "Step Workflow"
category: quick
difficulty: intermediate
---

# Step One / Step Two Workflow (Quick Use)

**When:** Complex projects requiring multiple passes  
**Trigger:** "step one" | "step two" | "sequential workflow"

## The Workflow

### Step One: Creative Ideation

```
Come up with 30 ideas for improving this project. Think through each:
- How would it work?
- User perception?
- Implementation?

Winnow to your VERY best 5 ideas. Explain each from best to worst with full rationale. Use ultrathink.
```

### Step Two: Critical Review + Optimization

```
Great, now carefully read with "fresh eyes," looking for:
- Errors, mistakes, problems
- Conceptual errors
- Logical violations
- Bad assumptions

Fix in small edits, not one big edit.

Then investigate gross inefficiencies where:
1) changes move the needle
2) changes are provably isomorphic
3) you have clear vision to better approach

Use ultrathink.
```

## The Gate

**User says:** "no, not yet. we need one last step"  
**→ Forces completion of Step One before Step Two**

## Why This Works

- Separates creative (divergent) from critical (convergent)
- Prevents premature optimization
- Builds on existing patterns:
  - Step One = Idea Wizard
  - Step Two = Fresh Eyes + Big-Brained Optimizer

## Check

> "Have you captured everything from the notes?"  
**→ Confirm before proceeding**

**Full version:** `prompts/step_workflow.md`
