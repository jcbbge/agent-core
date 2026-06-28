# Tower MCP Server

Fleet orchestration message bus for multi-agent coordination.

## Location

```
~/.tower/
├── server.mjs      ← MCP stdio server
├── cli.mjs         ← CLI interface
├── lib.mjs         ← Shared library
├── hooks/          ← Claude Code hooks
├── ledger.jsonl    ← Messages, questions, answers
├── board.jsonl     ← Blackboard entries
├── odometer.jsonl  ← Token burn tracking
├── deliverables/   ← Generated content files
└── flight/         ← Session snapshots
```

## Project Namespacing

All data stored centrally but namespaced by `cwd`. Each project sees only its own messages.

## MCP Tools

| Tool | Purpose |
|------|---------|
| `send_to_user` | Surface message (deliverable/alert/progress) |
| `ask_user` | Ask question mid-run |
| `reply` | Record user's answer |
| `check_inbox` | Poll for answers |
| `mark_relayed` | Acknowledge messages |
| `board_post` | Claim files, share findings |
| `board_read` | Check peer claims |

## Harness Integration

### Claude Code

Tower integrates via hooks in `~/.claude/settings.json`:

```json
{
  "hooks": {
    "Stop": [{
      "type": "command",
      "command": "bun ~/.tower/hooks/stop-guard.mjs"
    }],
    "UserPromptSubmit": [{
      "type": "command", 
      "command": "bun ~/.tower/hooks/prompt-inject.mjs"
    }],
    "PreToolUse(Agent)": [{
      "type": "command",
      "command": "bun ~/.tower/hooks/enforce-brief.mjs"
    }],
    "PostToolUse(Agent)": [{
      "type": "command",
      "command": "bun ~/.tower/hooks/odometer.mjs"
    }],
    "SessionStart": [{
      "type": "command",
      "command": "bun ~/.tower/hooks/session-start.mjs"
    }],
    "PreCompact": [{
      "type": "command",
      "command": "bun ~/.tower/hooks/flight-recorder.mjs"
    }]
  }
}
```

A symlink exists at `~/.claude/tower` → `~/.tower` for backward compatibility.

### Pi

Create an extension at `~/.pi/agent/extensions/tower.ts` that wraps the CLI:

```typescript
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { execSync } from "child_process";

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "tower",
    description: "Fleet orchestration - status, inbox, board, burn",
    parameters: {
      type: "object",
      properties: {
        command: { 
          type: "string", 
          enum: ["status", "inbox", "board", "burn"],
          description: "Tower command to run"
        }
      }
    },
    execute: async ({ command = "status" }) => {
      const result = execSync(`bun ~/.tower/cli.mjs ${command}`, {
        encoding: "utf-8",
        cwd: process.cwd()
      });
      return { content: result };
    }
  });
}
```

### Other Harnesses

Run the MCP server via stdio:

```bash
bun ~/.tower/server.mjs
```

Register the tools per your harness's MCP integration.

## CLI Usage

```bash
bun ~/.tower/cli.mjs status   # Counts + pending for current project
bun ~/.tower/cli.mjs inbox    # Full pending messages
bun ~/.tower/cli.mjs board    # Blackboard entries
bun ~/.tower/cli.mjs burn     # Token burn by day/spawn
bun ~/.tower/cli.mjs all      # Status across all projects
```

## Related Primitives

- **Command:** `tower` — `/tower` invokes CLI and acts on results
- **Rule:** `tower-orchestration` — Protocol for orchestrators and subagents
