---
name: robot-mode-maker
description: Design CLIs and APIs optimized for AI agent consumption with JSON/markdown output and quick-start mode. Use when building tools that agents will call or designing agent-friendly interfaces.
metadata:
  version: "1.0"
  source: promoted-from-command
---

---
title: "Robot Mode Maker"
category: quick
difficulty: intermediate
---

# Robot Mode Maker (Quick Use)

**When:** Building tools for AI agents, CLI design  
**Trigger:** "robot mode" | "CLI for agents" | "agent tooling"

## The Prompt

```
Create a "robot mode" for agents to interact via CLI instead of UI:

Requirements:
- Hyper-optimized and ergonomic for agents
- Output: JSON or markdown (token-efficient)
- Same information as human UI, but agent-accessible
- Maximize agent ergonomics and intuition
- Quick-start mode (no args) with critical functionality explained

Make the tooling YOU would want if YOU were using it.
```

## Key Principles

1. **Agent-First Design** - Build for agent consumption, not human aesthetics
2. **CLI > UI** - Text interface for agents
3. **Token Efficiency** - JSON or markdown based on context
4. **Information Equivalence** - All UI data available via CLI
5. **Quick-Start** - No args = help with critical functionality

## Output Format

```bash
# Example agent CLI
$ mytool --help
# Returns: Critical commands in token-dense format

$ mytool status --json
# Returns: {"status": "running", "tasks": 3, ...}
```

## The Self-Referential Genius

> "Make the tooling that YOU would want if YOU were using it (because you WILL be!)"

Agent becomes both designer and user.

**Full version:** `prompts/robot_mode_maker.md`
