# How to Add a Skill

A skill is a knowledge capsule — markdown instructions loaded into context on demand.
Define it once here. Deploy pushes it to every harness that supports skills.

## Steps

```bash
# 1. Create the skill directory
mkdir ~/Documents/_agents/primitives/skills/my-skill

# 2. Create SKILL.md
cat > ~/Documents/_agents/primitives/skills/my-skill/SKILL.md << 'EOF'
---
name: my-skill
description: One sentence — what this skill does and when to use it. This is what agents read to decide whether to load it.
metadata:
  version: "1.0"
  category: [building | thinking | session | meta | domain | utilities]
  triggers:
    - "phrase that causes this to load"
    - "another trigger"
---

# My Skill

## When to Use
[specific situations — be precise, not vague]

## Instructions
[the actual behavior this skill teaches]
EOF

# 3. Deploy
Skills are symlinked from primitives/ to each harness — no deploy step needed.
Verify the symlink exists: `ls ~/.claude/skills/` and `ls ~/.config/opencode/skills/`
```

## Skill Categories

| Category | Use for |
|----------|---------|
| `building` | Technology-specific how-tos (SolidJS, SurrealDB, etc.) |
| `thinking` | Reasoning modes (challenging-assumptions, reframing, etc.) |
| `session` | Session lifecycle (starting, ending, housekeeping) |
| `meta` | Agent self-management (upgrade-analysis, inventory) |
| `domain` | Business domain knowledge (Bento, etc.) |
| `utilities` | One-off tools (security checklist, PRD template, etc.) |

## What Makes a Good Skill

- **Tight description** — the description is what agents scan to decide whether to load it. Make it specific.
- **Clear triggers** — list the exact phrases that should cause it to load.
- **Stateless** — skills don't persist anything. If it needs persistence, it needs an MCP tool.
- **Atomic** — one skill does one thing. If it's doing two things, split it.

## When a Skill Should Be Something Else

| If it... | Make it a... |
|----------|-------------|
| Is invoked by name every session | Command (`/name`) |
| Always needs to be in context | Rule (add to CLAUDE.md) |
| Performs actions (file ops, API calls) | MCP Tool |
| Fires automatically on events | Hook/Plugin |
| Chains 3+ skills in sequence | Workflow (chain in the skill) |
