---
name: icloud-tabs-distiller
description: Export, categorize, and surface insights from iCloud Safari tabs. Use when user says "check my tabs", "export tabs", "what tabs do I have open", "tab audit", or wants to organize/close iCloud tabs. Reads from ~/icloud-tabs-inbox/ and ~/Library/Containers/com.apple.Safari/Data/Library/Safari/CloudTabs.db.
argument-hint: <action — export|categorize|insights|close-suggestions>
allowed-tools: Bash Read Write Edit Glob Grep
metadata:
  author: jrg
  version: "1.0"
  tags: safari, icloud, tabs, organization, workflow
---

# iCloud Tabs Distiller

Processes iCloud Safari tabs — exports, categorizes, surfaces insights, suggests what to close.

---

## Tab Sources

- **iCloud tabs**: `~/Library/Containers/com.apple.Safari/Data/Library/Safari/CloudTabs.db`
- **Local Safari tabs**: via AppleScript (requires permission)
- **Inbox**: `~/icloud-tabs-inbox/`
  - `pending/` — tabs exported for review
  - `processed/` — tabs you've acted on
  - `archive/` — tabs saved for later

---

## Categories

| Category | Tags | Examples |
|----------|------|----------|
| **dev** | dev, code, api, tutorial | GitHub repos, MDN, Stack Overflow |
| **papers** | research, paper, arxiv | arxiv.org, academic PDFs |
| **tools** | saas, product, service | dev tools, productivity apps |
| **reference** | docs, guide, cheatsheet | documentation, how-tos |
| **social** | social, discussion | HN, Reddit, Twitter/X |
| **news** | news, blog, opinion | tech blogs, newsletters |
| **video** | video, talk, lecture | YouTube, conference talks |
| **shopping** | shop, buy, product | Amazon, product pages |
| **work** | work, client, project | Arc, client projects |
| **archive** | read-later, someday | pages to revisit |

---

## Actions

### `export` — Export tabs to inbox

```bash
~/bin/tablist --json
cp ~/icloud-tabs-export.json ~/icloud-tabs-inbox/pending/
```

Reads the JSON and creates individual tab files in `~/icloud-tabs-inbox/pending/`:
```
~/icloud-tabs-inbox/pending/
  github-com-130-tabs.md
  arxiv-org-5-tabs.md
  blog-cloudflare-com-4-tabs.md
  ...
```

Each file contains:
- List of URLs and titles grouped by domain
- Count of tabs
- Date range (if available)
- Quick summary

---

### `categorize` — Auto-categorize and organize

Reads `~/icloud-tabs-inbox/pending/` and:
1. Classifies each domain by category
2. Creates a summary report
3. Suggests groupings

Output format:
```
## [Category] — [Domain] ([N] tabs)

### URLs
- [Title](url)

### Suggestions
- Keep: [why]
- Close: [why]
- Read later: [why]
```

---

### `insights` — Surface patterns and opportunities

Analyzes all tabs and surfaces:
1. **Churn hotspots** — domains with many tabs (procrastination signal)
2. **Age patterns** — tabs open for a long time
3. **Closable** — duplicates, completed reads, old references
4. **Opportunities** — saved tools, unread research, unexplored repos

---

### `close-suggestions` — What to actually close

Based on heuristics:
- **Dev tabs** from repos you starred/pushed (you already have the code)
- **Tutorials** you implemented (time to close)
- **Old research** (read and done)
- **Duplicates** (same URL, different tabs)
- **Shopping carts** (abandoned checkout)
- **Dead links** (404, moved)

---

## Processing Workflow

```
1. tablist export      → tabs go to ~/icloud-tabs-inbox/pending/
2. icloud-tabs-distiller categorize  → categorized report
3. icloud-tabs-distiller insights   → pattern analysis
4. icloud-tabs-distiller close-suggestions → actionable list
5. Manual review → move to processed/ or archive/
```

---

## Tab List CLI Reference

```bash
~/bin/tablist              # Full report
~/bin/tablist --count      # Tab count only
~/bin/tablist --domain     # Grouped by domain
~/bin/tablist --device     # Grouped by device
~/bin/tablist --urls       # URLs only
~/bin/tablist --json       # Export to JSON
```

---

## Category Heuristics

### dev
- github.com, gitlab.com, bitbucket.org
- stackoverflow.com, dev.to
- docs.*.com, developer.*.com, api.*

### papers
- arxiv.org, papers.ssrn.com
- academic journals, PDF URLs

### tools
- Product pages (not marketing — actual tool sites)
- SaaS dashboards, dev tool landing pages

### reference
- Documentation sites
- Cheatsheets, guides
- MDN, React docs, Vue docs

### social
- news.ycombinator.com, reddit.com
- x.com (Twitter), mastodon.social
- lobste.rs

### news
- blogs.*.com, *.substack.com
- tech news sites

### video
- youtube.com, vimeo.com
- conference talks, egghead.io

---

## Quick Commands

```bash
# Export and categorize in one shot
~/bin/tablist --json && cp ~/icloud-tabs-export.json ~/icloud-tabs-inbox/pending/latest.json

# Quick tab count
~/bin/tablist --count

# See what domains are hogging tabs
~/bin/tablist --domain | head -20

# Export URLs for bulk processing
~/bin/tablist --urls > ~/icloud-tabs-inbox/pending/urls.txt
```
