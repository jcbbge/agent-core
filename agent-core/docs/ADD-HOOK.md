# How to Add a Hook or Plugin

Hooks fire automatically on events. No user invocation. System-driven.

---

## Claude Code: Shell Hooks

Hooks live in `~/.claude/settings.json` under the `"hooks"` key.

### Hook types

| Type | When | Use for |
|------|------|---------|
| `PreToolUse` | Before tool runs | Block bad patterns, inject reminders |
| `PostToolUse` | After tool finishes | Format code, run type check, lint |
| `UserPromptSubmit` | User sends message | Log prompt, inject context |
| `Stop` | Agent finishes | Audit, cleanup, emit events |
| `PreCompact` | Before context compaction | Save critical state |
| `Notification` | Permission request | Custom approval |

### Adding a hook

Edit `~/.claude/settings.json` directly:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "tool == \"Write\" && tool_input.file_path matches \"\\.tsx?$\"",
        "hooks": [
          {
            "type": "command",
            "command": "prettier --write \"$TOOL_INPUT_FILE_PATH\" 2>/dev/null || true",
            "timeout": 5000
          }
        ]
      }
    ]
  }
}
```

### Useful patterns

```bash
# Auto-format TypeScript after Write
matcher: "tool == \"Write\" && tool_input.file_path matches \"\\.tsx?$\""
command: "prettier --write \"$TOOL_INPUT_FILE_PATH\" 2>/dev/null || true"

# Block .md file creation unless it's README or CLAUDE
matcher: "tool == \"Write\" && tool_input.file_path matches \"\\.md$\""
command: "if [[ \"$TOOL_INPUT_FILE_PATH\" != *README* && \"$TOOL_INPUT_FILE_PATH\" != *CLAUDE* ]]; then echo 'BLOCK: .md file creation' >&2; exit 1; fi"

# Warn before git push
matcher: "tool == \"Bash\" && tool_input.command matches \"git push\""
command: "echo '[Hook] Pushing to remote. Confirm branch is correct.' >&2"

# Emit usage to SurrealDB
matcher: "*"
command: "~/Documents/_agents/agent-core/observe/emit.sh claude-code hook stop 2>/dev/null || true"
```

---

## OpenCode: TypeScript Plugins

Plugins are TypeScript files in `~/.config/opencode/plugins/`.
They're more powerful than hooks — can access the OpenCode SDK client.

```typescript
// ~/.config/opencode/plugins/my-plugin.ts
export default function(ctx: { project: any; directory: string; client: any; $: any }) {
  return {
    "UserPromptSubmit": async (event: any) => {
      // fires on every user message
      // ctx.$ is Bun shell API
      // ctx.client is OpenCode SDK
    },
    "Stop": async (event: any) => {
      // fires when agent finishes responding
    }
  }
}
```

### Installing plugins from marketplace

```bash
# From within OpenCode:
/plugins
# Browse marketplace, install from there

# Or from CLI:
claude plugin marketplace add https://github.com/owner/repo
```

### Plugin vs Hook decision

| Use Plugin when | Use Hook when |
|----------------|--------------|
| OpenCode only | Claude Code only |
| Need TypeScript/SDK access | Shell command is enough |
| Bundling skill+hook+tool together | Single event response |
| Installing from marketplace | Writing inline JSON config |

---

## Store your hooks here

Add `.json` (CC hook configs) or `.ts` (OC plugin source) files to `primitives/hooks/`.
The adapter assembles them into the right harness config on deploy.
