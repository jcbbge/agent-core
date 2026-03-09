---
name: product-launch
description: Idea-to-launch pipeline for solo developers. Chains evaluating-product-ideas → evaluating-business-strategy → prd → project-documentation. Use when taking a product idea from concept to launch-ready.
license: MIT
version: "1.0"
tags: workflow, chaining, product, launch, solo-dev
---

# Product Launch Workflow

**From idea to launch-ready for solo developers**

## Chain

1. evaluating-product-ideas → Validate the idea
2. evaluating-business-strategy → Check commercial viability
3. prd → Write requirements
4. project-documentation → Capture context for future you

---

## Step 1: Idea Validation

**Load:** `evaluating-product-ideas`

**Input:** Product idea (2-3 sentences)
**Output:** JTBD analysis, PMF assessment, viability score

> Evaluate this product idea. What job is it doing? Product-market fit? Would users come back? What's the growth loop?

---

## Step 2: Business Strategy

**Load:** `evaluating-business-strategy`

**Input:** Viable product idea from Step 1
**Output:** Commercial viability, market dynamics, sustainable model

> Is this commercially viable? Market dynamics? Can a solo developer sustain this? What's the go-to-market?

---

## Step 3: Requirements Definition

**Load:** `prd`

**Input:** Validated idea + business case
**Output:** Product Requirement Document with scope, features, acceptance criteria

> Write a PRD for this product. Define scope, features, user stories, acceptance criteria. What are we actually building?

---

## Step 4: Context Capture

**Load:** `project-documentation`

**Input:** PRD + decisions made
**Output:** FOR[yourname].md with architecture, lessons, narrative

> Create comprehensive project documentation. Explain the architecture, why decisions were made, lessons learned, and capture the narrative.

---

## Summary Output

| Step | Skill | Deliverable |
|------|-------|-------------|
| 1 | evaluating-product-ideas | Viability assessment |
| 2 | evaluating-business-strategy | Commercial analysis |
| 3 | prd | Requirements document |
| 4 | project-documentation | Living project memory |

**Pause between steps:** Yes (go/no-go gates at each step)
**Final state:** Launch-ready with documentation

---

## When to Use

- Taking an idea from concept to launch
- Solo developers building products
- Need to validate before building
- Want documentation as you build

**Note:** This is the full pipeline. If idea fails validation at Step 1 or 2, stop and iterate.
