---
name: fresh-eyes-review
description: See command definition below.
metadata:
  version: "1.0"
  source: promoted-from-command
---

---
title: "Fresh Eyes Review"
category: quick
difficulty: beginner
---

# Fresh Eyes Review (Quick Use)

**When:** Before finalizing PRDs, plans, important docs  
**Trigger:** "check this for errors" | "fresh eyes" | "what did I miss"

## The Prompt

```
Reread AGENTS dot md so it's still fresh in your mind. Great, now I want you to carefully read over the ENTIRE plan document, but this time with "fresh eyes," looking super carefully for any errors, mistakes, problems, issues, confusion, conceptual errors, logical violations, ignoring of probability theory, sloppy thinking, inaccurate information/data, bad implicit assumptions, etc. Carefully fix anything you uncover by revising the plan document in-place in a series of small edits, not one big edit.
```

## Copy-Paste Template

```
Reread [DOCUMENT] so it's fresh in your mind. Now carefully read over the entire document with "fresh eyes," looking for:
- Errors, mistakes, problems, issues
- Confusion, conceptual errors
- Logical violations
- Ignoring of probability theory
- Sloppy thinking
- Inaccurate information/data
- Bad implicit assumptions

Carefully fix anything you uncover by revising in-place in a series of small edits, not one big edit.
```

## Error Categories to Check
- [ ] Errors/mistakes/problems/issues
- [ ] Confusion/conceptual errors  
- [ ] Logical violations
- [ ] Probability theory ignored
- [ ] Sloppy thinking
- [ ] Inaccurate data
- [ ] Bad implicit assumptions

**Full version:** `prompts/fresh_eyes_review.md`
