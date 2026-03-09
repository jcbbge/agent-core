---
title: "Repo Deep Dive Analysis"
category: quick
difficulty: advanced
---

# Repo Deep Dive Analysis (Quick Use)

**When:** Codebase audits, learning from external repos  
**Trigger:** "analyze repo" | "deep dive" | "best practices"

## The Pattern

**Ingest → Adapt → Test → Validate**

### Phase 1: External Research
- Read README
- Explore codebase for patterns
- Extract best practices

### Phase 2: Contextual Mapping
- Map to local context
- Read local setup files
- Identify gaps

### Phase 3: Recommendations
- Create recommendations list
- Explain rationale
- Prioritize by impact

### Phase 4: Controlled Testing
1. **BEFORE** measurement
2. Apply change
3. **AFTER** measurement
4. Compare and analyze
5. Additional test if unclear

### Phase 5: Documentation
- Write report
- Commit high-impact changes

## Key Innovation

**Scientific Method Loop:**
- Baseline → Intervention → Measurement → Analysis → Replication

## Example

```
Read: github.com/ChrisWiles/... (Claude Code best practices)
Apply: To our ./claude directory
Test: BEFORE → change → AFTER → compare
```

**Full version:** `prompts/repo_deep_dive_analysis.md`
