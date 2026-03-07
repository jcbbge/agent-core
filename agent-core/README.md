# Agent Core

One repo. One deploy command. Every harness gets the same primitives.
Provider-agnostic. Model-agnostic. Harness-agnostic.

---

## The Full Primitive Taxonomy

```
ALWAYS LOADED (in context unconditionally)
  rules/           — modular constraints by concern (security, style, git, agents, performance)
                     deploy → ~/.claude/rules/*.md  |  assembled into AGENTS.md for others

ON DEMAND (loaded when needed)
  skills/          — reusable workflow definitions, loaded by trigger phrase or /name
                     deploy → ~/.claude/skills/  |  ~/.config/opencode/skills/

USER-INVOKED SHORTCUTS
  commands/        — slash commands (/name), thin wrappers that invoke skills or prompts
                     deploy → ~/.claude/commands/*.md

SPECIALIZED CONTEXTS
  subagents/       — delegatable agents with scoped tools, model, and permissions
                     deploy → ~/.claude/agents/*.md

EVENT-DRIVEN AUTOMATION
  hooks/           — fire on PreToolUse, PostToolUse, UserPromptSubmit, Stop, PreCompact
                     CC: shell scripts in ~/.claude/settings.json
                     OC: TypeScript plugins in ~/.config/opencode/plugins/

PERSISTENT TOOL DAEMONS
  mcp/registry.json — every MCP server: port, transport, tool count, harnesses, enable policy
```

## The Command

```bash
agent-deploy              # push everything to all harnesses
agent-deploy claude-code  # one harness only
agent-deploy --dry-run    # preview without executing
```

## Context Window is a Resource

Every enabled MCP adds tool overhead. Rule from the field:
- Keep under 10 MCPs enabled per session
- Keep under 80 active tools total
- 200k context window becomes ~70k with too many tools loaded

The registry tracks `tool_count` and `disable_when` per server.
Disable per-project in your harness config, not globally.

## How Things Relate

```
Rules       → always in context. Constraints that never turn off.
Skills      → loaded when needed. Bigger instructions. Triggered by phrase or /name.
Commands    → /shortcut that loads a skill or runs a prompt. User decides.
Subagents   → orchestrator delegates a scoped task here. Gets its own context + tools.
Hooks       → fires automatically on events. User doesn't decide. System decides.
MCP Servers → persistent daemons. Agent calls tools on them. Lives outside context window.
```

When you're not sure which primitive to use:

| If it... | Use |
|----------|-----|
| Must always apply, no exceptions | Rule |
| Is a repeatable workflow you invoke by name | Skill |
| Is something you type every session | Command |
| Is a specialized focus that needs its own context | Subagent |
| Should fire without you thinking about it | Hook |
| Needs to persist data or call an external service | MCP Tool |

## Structure

```
agent-core/
  primitives/
    rules/          always-loaded constraints, modular by concern
    skills/         on-demand workflow definitions (50 currently)
    commands/       slash command definitions (20 currently)
    subagents/      delegatable specialized agents
    hooks/          event automation (shell + TypeScript)
    plugins/        OpenCode plugin bundles (skill+hook+mcp combos)
    mcp/
      registry.json  every MCP server, port, tool count, enable policy
  harnesses/
    _template/      HARNESS.md + adapter.sh — copy to add any new harness
    claude-code/    HARNESS.md (what CC supports) + adapter.sh (how to deploy)
    opencode/       HARNESS.md + adapter.sh
    cursor/         HARNESS.md (fill in) + adapter.sh (write)
    zed/            HARNESS.md (fill in) + adapter.sh (write)
  deploy.sh → installed as `agent-deploy`
  observe/
    emit.sh         record primitive usage → SurrealDB primitive_events
  docs/
    ADD-HARNESS.md
    ADD-SKILL.md
    ADD-MCP.md
    ADD-SUBAGENT.md
    ADD-HOOK.md
```

## Harness Support Matrix

| Primitive | Claude Code | OpenCode | Cursor | Zed | Aider |
|-----------|-------------|----------|--------|-----|-------|
| Skills | ✅ ~/.claude/skills/ | ✅ (symlinks) | ❓ | ❓ | ❓ |
| Commands | ✅ ~/.claude/commands/ | ✅ | ❓ | ❓ | ❓ |
| Rules | ✅ ~/.claude/rules/ | ✅ AGENTS.md | ✅ .cursorrules | ❓ | ❓ |
| Subagents | ✅ ~/.claude/agents/ | ❓ | ❓ | ❓ | ❓ |
| Hooks | ✅ shell (settings.json) | ✅ TS plugins | ❓ | ❓ | ❓ |
| Plugins | ❓ marketplace | ✅ TS modules | ❓ | ❓ | ❓ |
| MCP HTTP | ✅ | ✅ | ✅ | ❓ | ❓ |
| MCP stdio | ✅ (avoid) | ✅ (avoid) | ✅ | ❓ | ❓ |

❓ = not yet verified. Fill in HARNESS.md when confirmed.
