---
name: knowledge-graph-system
description: PKM architecture with wikilinks, YAML frontmatter, and slash commands. Use when building knowledge graphs, connected note systems, or research documentation. Triggers on 'knowledge graph', 'wikilinks', connected notes.
metadata:
  version: "1.0"
  source: promoted-from-command
---

---
title: "Knowledge Graph System"
category: quick
difficulty: advanced
---

# Knowledge Graph System (Quick Use)

**When:** PKM systems, research systems, connected documentation  
**Trigger:** "knowledge graph" | "wikilinks" | "slash commands"

## The Model

```
┌─────────────────────────────────────────┐
│           KNOWLEDGE GRAPH               │
├─────────────────────────────────────────┤
│ Markdown files = Nodes                  │
│ [[wikilinks]] = Edges                   │
│ YAML frontmatter = Metadata             │
│ File tree = Context curation            │
└─────────────────────────────────────────┘
```

## The Slash Commands

| Command | Action |
|---------|--------|
| `/reduce` | Extract claims from content |
| `/reflect` | Find connections, update MOCs |
| `/reweave` | Update old notes with new links |
| `/recite` | Verify descriptions enable retrieval |
| `/review` | Health checks (broken links, orphans) |
| `/rethink` | Challenge system assumptions |
| `/learn` | Request deep research |

## Automation

**Hooks:**
- `starting-session.sh` → inject vault context
- `validate-note.sh` → quality check after writes
- `session-stop.sh` → broken link check

**Subagents:**
- `reduce` (sonnet) - claim extraction
- `reflect` (sonnet) - connections
- `recite` (haiku) - verification
- `review` (haiku) - health checks

## Key Insight

> "Filenames ARE claims: 'since [[quality is the hard part]]...'"

**Full version:** `frameworks/knowledge_graph_system.md`
