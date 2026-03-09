# Hooks

Event-driven automations. Fire automatically. No user invocation.

## Hook types (Claude Code)

| Type | When it fires | Use for |
|------|--------------|---------|
| `PreToolUse` | Before a tool runs | Validation, reminders, blocking |
| `PostToolUse` | After a tool finishes | Formatting, linting, feedback |
| `UserPromptSubmit` | When user sends a message | Logging, context injection |
| `Stop` | When agent finishes responding | Audits, cleanup, logging |
| `PreCompact` | Before context compaction | Save important state |
| `Notification` | Permission requests | Custom approval flows |

## Format (Claude Code `~/.claude/settings.json`)

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "tool == \"Bash\" && tool_input.command matches \"(npm|pnpm|yarn)\"",
        "hooks": [
          {
            "type": "command",
            "command": "if [ -z \"$TMUX\" ]; then echo '[Hook] Consider tmux' >&2; fi"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "tool == \"Write\" && tool_input.file_path matches \"\\.tsx?$\"",
        "hooks": [{ "type": "command", "command": "prettier --write \"$TOOL_INPUT_FILE_PATH\" 2>/dev/null || true" }]
      }
    ]
  }
}
```

## Plugins (OpenCode — `~/.config/opencode/plugins/`)

OpenCode uses TypeScript plugins instead of shell hooks.
Plugins are more powerful: they can bundle tools + hooks + MCPs together.
They have access to the OpenCode SDK client.

```typescript
// ~/.config/opencode/plugins/my-hook.ts
export default function(ctx) {
  return {
    "UserPromptSubmit": async (event) => {
      // fires on every user message
    },
    "Stop": async (event) => {
      // fires when agent finishes
    }
  }
}
```

## Files in this directory

Store hook definitions here as `.json` (Claude Code) or `.ts` (OpenCode).
The adapter assembles them into the harness-specific config on deploy.

## What hooks already exist

| Hook | Harness | What it does |
|------|---------|-------------|
| `learning-opportunity-hook` | Claude Code PostGitCommit | Detects significant work, suggests learning exercises |
| `observe-mcp` | Claude Code PostToolUse | Captures MCP tool invocations to SurrealDB |
| `observe-rule` | Claude Code PostToolUse | Captures rule file loads to SurrealDB |
| `observe-skill` | Claude Code PostToolUse | Captures skill invocations to SurrealDB |
| `observe-subagent` | Claude Code PostToolUse | Captures subagent reads to SurrealDB |
