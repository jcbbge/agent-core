---
name: refactoring-framework
description: 12-dimension code review and refactoring framework balancing maintainability, security, and incrementality. Use for code reviews, refactoring sessions, or improving existing code. Triggers on 'refactor', 'code review', 'improve this'.
metadata:
  version: "1.0"
  source: promoted-from-command
---

---
title: "Refactoring Skill"
category: quick
difficulty: intermediate
---

# Refactoring Skill (Quick Use)

**When:** Code reviews, refactoring, improving existing code  
**Trigger:** "refactor" | "code review" | "improve this"

## The 12 Dimensions

Check code against:

1. **Maintainability** - Can it be understood and maintained?
2. **Performance** - Optimization opportunities?
3. **Security** - Best practices followed?
4. **Code Preservation** - Only necessary changes?
5. **Incremental Changes** - Small, manageable steps?
6. **Performance** - Consider implications?
7. **Accessibility** - Maintained or improved?
8. **Reusability** - Reusable components/functions?
9. **Dependencies** - Updates when beneficial?
10. **Version Control** - Friendly for diffs?
11. **Scalability** - Impact on growth?
12. **Consistency** - Style/pattern alignment?

## The Golden Rules

1. **Behavior is preserved** - Only how, not what
2. **Small steps** - Test after each
3. **Version control** - Commit safe states
4. **Tests are essential** - Without tests, you're editing not refactoring
5. **One thing at a time** - Don't mix with feature changes

## When NOT to Refactor

- Code that works and won't change again
- Critical production code without tests
- Under tight deadline
- "Just because" - need clear purpose

**Full version:** `skills/refactoring_skill.md`
