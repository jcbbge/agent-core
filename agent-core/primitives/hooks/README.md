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
| `surreal-health.sh` | Claude Code SessionStart | Verifies SurrealDB is up, auto-restarts |
| `capture-prompt.sh` | Claude Code UserPromptSubmit | Captures prompts to SurrealDB thought_stream |
| `capture-interaction.sh` | Claude Code UserPromptSubmit | Anima interaction capture |
| `anima-bootstrap.ts` | OpenCode SessionStart | Loads Anima identity and continuity |
