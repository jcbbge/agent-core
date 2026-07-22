---
name: tabs-distiller
description: Process iCloud Safari tabs — export, categorize, surface insights, suggest closures. Use when user says "check my tabs", "export tabs", "tab audit", or wants to organize tabs.
argument-hint: <action — export|categorize|insights|close-suggestions>
allowed-tools: Bash Read Write Edit Glob Grep
metadata:
  author: jrg
  version: "2.0"
  tags: safari, icloud, tabs, organization, workflow
---

# Tabs Distiller

Processes iCloud Safari tabs — exports, categorizes, surfaces insights, suggests what to close.

---

## Related Primitives

| Type | Name | Purpose |
|------|------|---------|
| Command | `tabs` | Quick CLI access (`/tabs count`, `/tabs export`, etc.) |
| Subagent | `tabs-processor` | Autonomous agent that distills tabs into agent-core primitives |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     TABS SYSTEM                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ~/bin/tablist           CloudTabs.db                       │
│  (Swift binary)    ◀───  (Safari iCloud sync)               │
│       │                                                     │
│       ▼                                                     │
│  ~/icloud-tabs-inbox/                                       │
│  ├── pending/      ← exported tabs awaiting processing      │
│  ├── processed/    ← tabs you've acted on                   │
│  └── archive/      ← tabs saved for later                   │
│       │                                                     │
│       ▼                                                     │
│  tabs-distiller    → categorizes, surfaces insights         │
│  tabs-processor    → autonomous distillation to primitives  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Tab Sources

- **iCloud tabs**: `~/Library/Containers/com.apple.Safari/Data/Library/Safari/CloudTabs.db`
- **Local Safari tabs**: via AppleScript (requires permission)
- **Inbox**: `~/icloud-tabs-inbox/`

---

## Actions

### `export` — Export tabs to inbox

```bash
~/bin/tablist --json > ~/icloud-tabs-inbox/pending/$(date +%Y%m%d).json
```

### `categorize` — Auto-categorize by domain

Classifies each domain into: dev, papers, tools, reference, social, news, video, shopping, work, archive.

### `insights` — Surface patterns

1. **Churn hotspots** — domains with many tabs (procrastination signal)
2. **Age patterns** — tabs open for a long time
3. **Opportunities** — saved tools, unread research, unexplored repos

### `close-suggestions` — What to close

- Tutorials you implemented
- Repos you already cloned
- Old research (read and done)
- Duplicates, dead links, abandoned carts

---

## Categories

| Category | Examples |
|----------|----------|
| **dev** | GitHub, Stack Overflow, MDN |
| **papers** | arxiv.org, academic journals |
| **tools** | SaaS, dev tools |
| **reference** | Docs, cheatsheets |
| **social** | HN, Reddit, X |
| **news** | Blogs, Substack |
| **video** | YouTube, conference talks |
| **shopping** | Product pages |
| **work** | Client projects |
| **archive** | Read-later |

---

## CLI Reference

```bash
~/bin/tablist              # Full report
~/bin/tablist --count      # Tab count only
~/bin/tablist --domain     # Grouped by domain
~/bin/tablist --urls       # URLs only
~/bin/tablist --json       # Export to JSON
```

---

## Workflow

```
1. /tabs export           → dumps to ~/icloud-tabs-inbox/pending/
2. tabs-distiller categorize  → categorized report
3. tabs-distiller insights    → pattern analysis
4. Manual review          → move to processed/ or archive/
```
