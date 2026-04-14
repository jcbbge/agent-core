# Tool Surface by Harness
**Date:** 2026-04-14  
**Status:** Research complete — design implications identified

---

## The Three Harnesses, Compared

| Tool Category | claude-code | opencode | pi.dev |
|---------------|-------------|----------|--------|
| Shell execution | `bash` | `bash` | ✗ |
| File read | `read` | `read` | `read` |
| File write | `write` | `write` | `write` |
| File edit | `edit` | `edit` | `edit` |
| Patch/diff | — | `apply_patch` | — |
| Search (regex) | `grep` | `grep` | — |
| File find | `glob` | `glob` | — |
| Directory list | — | `list` | — |
| Web fetch | `webfetch` | `webfetch` | — |
| Web search | via MCP | `websearch` (opt-in, Exa) | — |
| User question | — | `question` | — |
| Task tracking | `todowrite` | `todowrite` | — |
| Skill loading | `skill` | `skill` | — |
| LSP/code intel | — | `lsp` (experimental) | — |
| MCP servers | ✓ full | ✓ full | limited |
| Custom tools | via MCP | via plugins (TS) | via extensions (TS) |
| **Total built-in** | **~8** | **~14** | **~4** |

Pi's 4: `read`, `write`, `edit`, + likely one more (list or grep). Everything else is via TypeScript extensions.

---

## Why This Is a Primitive System Design Concern

Your primitives — skills, rules, directives — may reference tools by name in their instructions. If a skill says:

> "Use `bash` to run the test suite before committing"

...that instruction is meaningless in pi, which has no `bash` tool. The agent will either hallucinate a tool call or fail silently.

**This is the same harness-specific mapping problem, one layer deeper.** It's not just "where does this file go" — it's "does the instruction inside the file make sense for this harness."

---

## Three Tiers of Tool Surface

### Tier 1 — Universal (all harnesses)
`read`, `write`, `edit`

These exist everywhere. Skills that only use these work on any harness.

### Tier 2 — Coding agents (claude-code + opencode)
`bash`, `grep`, `glob`, `webfetch`, `todowrite`, `skill`, MCP

Skills targeting these work on both coding harnesses but not on pi.

### Tier 3 — Harness-specific
`apply_patch`, `lsp`, `question`, `websearch` — opencode only or experimental.

---

## The Local Model Angle

You surfaced this in the context of local models (qwen3:8b, etc.). The relationship:

```
Tool surface size × Model capability = Reliable autonomous operation

claude-code / opencode (14+ tools)
  + small model (7B-8B)  → unreliable on multi-tool agentic loops
  + large model (32B+)   → functional but still misses edge cases
  + frontier model       → reliable

pi.dev (4 tools)
  + small model (7B-8B)  → actually workable for focused tasks
  + medium model (14B)   → solid
```

For agent-core specifically: when we eventually build a `meta/new-skill` primitive that helps create new skills, it should ask "what tool tier does this skill require?" and flag skills that use Tier 2/3 tools as not suitable for pi or small models.

---

## Design Implication: Skill Frontmatter Should Declare Tool Requirements

The existing `allowed-tools` frontmatter field (used in debug-hypothesis, install) already handles this — but it's currently used as a permission constraint, not a compatibility declaration.

Proposed convention:

```yaml
---
name: refactor
description: Surgical refactoring of existing code
allowed-tools: Read Edit Write Bash Grep Glob
requires-tier: 2   # needs coding agent — won't work on pi
---
```

Or more explicitly:

```yaml
harness-compatibility:
  claude-code: full
  opencode: full
  pi: partial  # read/edit/write only — bash steps skipped
  local-small: not-recommended  # >10 tool calls expected
```

This is optional metadata — but it's the information needed to answer "will this skill work in the context I'm deploying it to?"

---

## Immediate Practical Implications

**For agent-core registry today:**
None — the tool surface doesn't change how files are deployed. Skills sync the same way regardless.

**For skill authoring:**
When writing new skills, be explicit in `allowed-tools` about what you need. Skills that only need `Read Edit Write` are portable everywhere. Skills that need `Bash` are coding-agent only.

**For the contractor onboarding kit:**
If the contractor is using a lightweight harness or local model, skills heavy on `bash` calls may behave unreliably. The bootstrap kit should note this.

**For the integration profile template:**
The M1's `INTEGRATION-PROFILE-TEMPLATE.md` should get a "tool surface" field when we use it to profile new harnesses — "what built-in tools does this harness expose?"

---

## Updated Harness Profile Fields (Future)

When we extend harness profiles with scoping conventions (Decision 7), also add:

```
harness opencode
  # ... existing fields ...
  tools_builtin  bash read write edit apply_patch grep glob list webfetch websearch question todowrite skill lsp
  tools_tier     2
  model_minimum  14b   # recommended minimum for reliable agentic operation
end
```

This lets `agent-core status` eventually warn: "skill/X requires bash — not compatible with pi profile."

---

## TL;DR

The tool surface is a **compatibility layer** sitting between primitives and harnesses. For now it's just research context. When we build skill authoring tooling (meta-prompts, scaffolding), we bake in the question "what tools does this need?" The `allowed-tools` frontmatter field is already the right place for this — we just need to use it consistently.
