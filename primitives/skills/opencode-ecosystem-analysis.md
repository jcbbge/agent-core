---
name: opencode-ecosystem-analysis
description: Multi-repository ecosystem analysis synthesizing best practices and conventions across related projects. Use when evaluating tools, extracting patterns from external repos, or analyzing a technology ecosystem.
metadata:
  version: "1.0"
  source: promoted-from-command
---

---
title: "OpenCode Ecosystem Analysis"
category: quick
difficulty: advanced
---

# OpenCode Ecosystem Analysis (Quick Use)

**When:** Evaluating multiple tools, best practices extraction  
**Trigger:** "ecosystem analysis" | "best practices" | "multi-repo"

## The Prompt

```
Analyze these projects: [LIST REPOS]

For each:
- Technical architecture
- Codebase structure and connections
- Technologies used
- Why technical decisions were made
- Related PRs and bug fixes
- Potential pitfalls and avoidance
- Best practices observed

Make it engaging - use analogies and anecdotes. Not boring docs.

Then extract best practices, conventions, and configuration for extending the ecosystem.

Think critically about implementation approaches. If multiple, provide tradeoffs and ask clarifying questions.
```

## Multi-Phase Pattern

**Phase 1:** Single project deep dive  
**Phase 2:** Ecosystem survey (multiple repos)  
**Phase 3:** Best practices synthesis  
**Phase 4:** Clarification and tradeoffs

## Key Features

- "ONLY related pull requests" - filters noise
- Clarification request - forces verification
- Tradeoff analysis - decision support

## Output

Best practices + conventions + configuration guidelines

**Full version:** `prompts/opencode_ecosystem_analysis.md`
