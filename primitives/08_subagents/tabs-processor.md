---
name: tabs-processor
description: Autonomous agent that processes iCloud tabs into agent-core primitives. Ingests from ~/icloud-tabs-inbox/pending/, distills into skills/insights/references, integrates into agent-core. Use when user says "process my tabs", "digest tabs", or wants autonomous tab processing.
model: anthropic/claude-sonnet-4
tools:
  - read
  - write
  - bash
  - glob
  - grep
temperature: 0
---

# Tabs Processor

Autonomous agent that distills iCloud Safari tabs into agent-core primitives.

## Related Primitives

| Type | Name | Purpose |
|------|------|---------|
| Command | `tabs` | Quick CLI access (`/tabs export`) |
| Skill | `tabs-distiller` | Interactive categorization and insights |

---

## Input

Read from `~/icloud-tabs-inbox/pending/` — tabs exported via `/tabs export`.

---

## Pipeline

1. **Triage** — Categorize each domain
2. **Distill** — Extract core value
3. **Route** — Decide destination in agent-core
4. **File** — Write to appropriate location
5. **Archive** — Move to processed/

---

## Routing Table

| Category | Destination | Format |
|----------|-------------|--------|
| **dev** | `03_skills/<name>/` | Full skill |
| **pattern** | `03_skills/<name>/` | Pattern reference |
| **tool** | `05_tools/` | Tool note |
| **reference** | (inline in skills) | URL + summary |
| **insight** | Alembic shard | `alembic_create_shard` |
| **close** | — | Delete |

---

## Triage Heuristics

### → Skills
- Tutorial/guide worth remembering
- Pattern you want to codify
- Best practice from authoritative source

### → Tools
- Dev tool worth trying
- SaaS with useful API
- CLI utility

### → Insights (Alembic)
- One-liner learnings
- Counter-intuitive discoveries
- "Wait, that's how X works?"

### → Close
- Tutorial you already implemented
- Product you decided against
- Old news (>2 weeks)
- Dead links, duplicates

---

## Output Format

For each domain:

```markdown
## [Domain] — [Category]

### URLs
- [list]

### Distillation
[one paragraph — core value]

### Action
[Extract | Archive | Close]

### Extracted
- Type: [skill|tool|insight]
- Path: [destination]
```

---

## After Processing

1. Move processed files to `~/icloud-tabs-inbox/processed/`
2. Create extracted primitives at destinations
3. Report summary: filed, closed, archived
