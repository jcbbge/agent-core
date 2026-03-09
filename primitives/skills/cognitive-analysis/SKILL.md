---
name: cognitive-analysis
description: Multi-lens cognitive analysis pipeline. Chains thinking-systemically → challenging-assumptions → detecting-blind-spots → reframing-problems. Use for complex decisions, strategic planning, or when you need thorough analysis before action.
license: MIT
version: "1.0"
tags: workflow, chaining, cognitive, analysis, strategic
---

# Cognitive Analysis Workflow

**Multi-lens pipeline for complex decisions**

## Chain

1. thinking-systemically → Map the system
2. challenging-assumptions → Stress-test it  
3. detecting-blind-spots → Find what's missing
4. reframing-problems → Reformulate if needed

---

## Step 1: Systems Mapping

**Load:** `thinking-systemically`

**Input:** Your complex problem, decision, or situation
**Output:** System map with feedback loops, leverage points, patterns

> Analyze this as an interconnected system. Map feedback loops, emergent behaviors, and leverage points. Where are the second-order effects?

---

## Step 2: Stress Testing

**Load:** `challenging-assumptions`

**Input:** System map from Step 1
**Output:** Steel-manned version + exposed weaknesses

> Steel-man this system, then systematically challenge it. What assumptions are unstated? What could go wrong?

---

## Step 3: Blind Spot Detection

**Load:** `detecting-blind-spots`

**Input:** Stress-tested system
**Output:** Missing perspectives, ignored risks, knowledge gaps

> What am I not seeing? What perspectives are missing? What risks are being ignored?

---

## Step 4: Reframing (Conditional)

**Load:** `reframing-problems`  

**Input:** Blind spots + stress-tested system
**Output:** Reformulated problem (if needed)

> Based on the blind spots, should we reframe this problem? How else could we think about this?

---

## Summary Output

| Step | Skill | Key Finding |
|------|-------|-------------|
| 1 | thinking-systemically | [System map] |
| 2 | challenging-assumptions | [Weaknesses exposed] |
| 3 | detecting-blind-spots | [Blind spots found] |
| 4 | reframing-problems | [Reframe if needed] |

**Pause between steps:** Yes (recommended for complex analysis)

---

## When to Use

- Major strategic decisions
- Complex architecture choices  
- When something feels "off"
- Before significant commitments

**Alternative:** strategic-planning (similar but ends with adjacent-possibilities instead of reframing)
