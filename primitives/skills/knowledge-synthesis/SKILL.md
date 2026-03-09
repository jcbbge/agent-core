---
name: knowledge-synthesis
description: Research-to-knowledge pipeline. Chains repo-deep-dive-analysis → synthesizing-insights → knowledge-graph-system. Use when learning from external sources and integrating into your knowledge base.
license: MIT
version: "1.0"
tags: workflow, chaining, knowledge, research, synthesis
---

# Knowledge Synthesis Workflow

**From external research to integrated knowledge**

## Chain

1. repo-deep-dive-analysis → Extract patterns from source
2. synthesizing-insights → Connect to existing knowledge
3. knowledge-graph-system → Integrate into graph

---

## Step 1: Deep Dive Extraction

**Load:** `repo-deep-dive-analysis`

**Input:** External repo URL, codebase, or resource
**Output:** Patterns, best practices, technical decisions, pitfalls

> Analyze this repository. Extract: technical architecture, codebase structure, best practices, why decisions were made, pitfalls and how to avoid them.

---

## Step 2: Pattern Synthesis

**Load:** `synthesizing-insights`

**Input:** Extracted patterns from Step 1
**Output:** Connections to existing knowledge, transferable patterns, mental models

> Connect these patterns to what we already know. What are the transferable principles? How does this relate to existing knowledge?

---

## Step 3: Knowledge Integration

**Load:** `knowledge-graph-system`

**Input:** Synthesized patterns + connections
**Output:** Wikilinked notes, YAML frontmatter, integrated knowledge graph

> Integrate these insights into the knowledge graph. Create wikilinked notes with YAML frontmatter. Connect related concepts.

---

## Summary Output

| Step | Skill | Artifact |
|------|-------|----------|
| 1 | repo-deep-dive-analysis | Pattern extraction report |
| 2 | synthesizing-insights | Connected patterns + mental models |
| 3 | knowledge-graph-system | Integrated knowledge graph |

**Pause between steps:** No (continuous flow)
**Output:** New knowledge nodes in your graph, connected to existing knowledge

---

## When to Use

- Learning from external repositories
- Researching new technologies
- Building knowledge management systems
- Creating internal documentation from external sources

**Similar to:** opencode-ecosystem-analysis (but for single repos, not ecosystems)
