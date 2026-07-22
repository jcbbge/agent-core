---
description: iCloud Safari tabs — count, list by domain, export to inbox, full report
argument-hint: "[count|domains|export|report]"
---

# Tabs Command

Manage iCloud Safari tabs via the `tablist` binary.

```!
~/bin/tablist ${ARGUMENTS:-report}
```

## Arguments

| Arg | What it does |
|-----|--------------|
| `count` | Count total tabs across devices |
| `domains` | List tabs grouped by domain (top 20) |
| `export` | Export tabs to `~/icloud-tabs-inbox/pending/` for processing |
| `report` | Full report with insights (default) |

## Related Primitives

- **Skill:** `tabs-distiller` — Full workflow for categorizing and processing exported tabs
- **Subagent:** `tabs-processor` — Autonomous agent that distills tabs into agent-core primitives

## Workflow

1. `/tabs export` — dumps tabs to inbox
2. Invoke `tabs-distiller` skill to categorize
3. Or spawn `tabs-processor` subagent for autonomous processing
