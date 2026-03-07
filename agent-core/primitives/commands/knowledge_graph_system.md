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
- `session-start.sh` → inject vault context
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
