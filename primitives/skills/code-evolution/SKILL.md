---
name: code-evolution
description: Systematic code improvement pipeline. Chains fresh-eyes-review → big-brained-optimizer → refactoring-framework → refactor. Use when evolving existing code toward better quality.
license: MIT
version: "1.0"
tags: workflow, chaining, code, refactoring, evolution
---

# Code Evolution Workflow

**From messy to optimized: systematic code improvement**

## Chain

1. fresh-eyes-review → Find errors
2. big-brained-optimizer → Find optimizations
3. refactoring-framework → Plan changes
4. refactor → Execute changes

---

## Step 1: Error Detection

**Load:** `fresh-eyes-review`

**Input:** Codebase, specific file, or module
**Output:** Errors, mistakes, bad assumptions found

> Review this code with fresh eyes. Look for errors, conceptual mistakes, logical violations, bad assumptions.

---

## Step 2: Optimization Analysis

**Load:** `big-brained-optimizer`

**Input:** Code after error fixes
**Output:** High-impact optimizations, isomorphic improvements

> Find gross inefficiencies. Where can we move the needle on latency/throughput with provably isomorphic changes?

---

## Step 3: Refactoring Plan

**Load:** `refactoring-framework`

**Input:** Optimization candidates
**Output:** Structured refactoring plan across 12 dimensions

> Create a comprehensive refactoring plan. Address: naming, function extraction, type safety, dead code, design patterns.

---

## Step 4: Surgical Execution

**Load:** `refactor`

**Input:** Refactoring plan
**Output:** Clean, improved code

> Execute the refactoring plan. Make surgical changes: extract functions, rename variables, improve types, eliminate dead code.

---

## Summary Output

| Step | Skill | Deliverable |
|------|-------|-------------|
| 1 | fresh-eyes-review | Error report |
| 2 | big-brained-optimizer | Optimization candidates |
| 3 | refactoring-framework | Refactoring plan |
| 4 | refactor | Improved code |

**Pause between steps:** Yes (fix errors before optimizing)

---

## When to Use

- Improving existing code
- Preparing code for new features
- Technical debt reduction
- Codebase modernization

**Alternative:** deep-review (similar but ends with think-critically instead of refactor)
