# Harness: pi (pi.dev)

| Field | Value |
|-------|-------|
| Name | pi |
| Version | 0.64.0 |
| Config dir | `~/.pi/agent/` |
| Status | active |
| Repo | https://github.com/badlogic/pi-mono |
| Docs | https://pi.dev |
| Package | `@mariozechner/pi-coding-agent` |

## Overview

Pi is a minimal terminal coding harness focused on extensibility through TypeScript extensions, skills, prompt templates, and themes. It ships with powerful defaults (read, write, edit, bash tools) but deliberately omits features like sub-agents and plan mode — instead providing the primitives to build what you need.

## Config Files

```
~/.pi/agent/settings.json           — global settings (provider, model, thinking level)
~/.pi/agent/AGENTS.md               — global agent identity + rules (auto-loaded at startup)
~/.pi/agent/SYSTEM.md               — global system prompt override (replaces default)
~/.pi/agent/APPEND_SYSTEM.md        — append to system prompt (doesn't replace)
~/.pi/agent/prompts/                — prompt templates (invoke via /name)
~/.pi/agent/skills/<name>/SKILL.md  — skills library (agentskills.io standard)
~/.pi/agent/extensions/<name>/      — TypeScript extensions (custom tools, commands, hooks, UI)
~/.pi/agent/models.json             — custom provider/model definitions
~/.pi/agent/sessions/               — session storage
~/.pi/agent/bin/                    — custom binaries

.pi/AGENTS.md                       — project-level agent context (walks up from cwd)
.pi/SYSTEM.md                       — project-level system prompt override
.pi/APPEND_SYSTEM.md                — project-level system prompt append
.pi/prompts/                        — project-level prompt templates
.pi/skills/<name>/SKILL.md          — project-level skills
.pi/extensions/<name>/              — project-level extensions
.pi/settings.json                   — project-level settings (overrides global)
```

## Primitive Update Procedures

### Agent File + Rules (`AGENTS.md`)

**Search paths (loaded at startup, concatenated):**
1. `~/.pi/agent/AGENTS.md` (global)
2. Parent directories walking up from cwd
3. Current directory (`./AGENTS.md` or `./.pi/AGENTS.md`)

**Also accepts:** `CLAUDE.md` as alternative filename

**Update procedure:**
- Copy `schema/agent-file/AGENTS.md` → `~/.pi/agent/AGENTS.md`
- Straight copy, no merge needed
- Takes effect on next session start or `/reload` command

**Rules:** No separate rules directory — all rules live in `AGENTS.md`

### MCP Servers

**Status:** NOT NATIVELY SUPPORTED

Pi does not have built-in MCP server support. MCP integration requires:
1. Writing a TypeScript extension that implements MCP client protocol
2. Loading the extension via `~/.pi/agent/extensions/`
3. Or using a pi package that provides MCP support

See `docs/extensions.md` and `docs/custom-provider.md` for building custom integrations.

**Workaround:** Use the executor gateway pattern (see opencode harness) if you need MCP tools.

### Skills (`~/.pi/agent/skills/`)

**Format:** Agent Skills standard (agentskills.io)

**Search paths:**
1. `~/.pi/agent/skills/<name>/SKILL.md` (global)
2. `.pi/skills/<name>/SKILL.md` (project-level)
3. Loaded from pi packages

**Update procedure:**
- Copy `schema/skills/<name>/` → `~/.pi/agent/skills/<name>/`
- Reload via `/reload` command
- Or restart session

**Invocation:**
- `/skill:name` — explicit invocation
- Agent can auto-load skills based on context (not forced)

### Prompt Templates (`~/.pi/agent/prompts/`)

**Format:** Markdown files with optional Mustache-style variables `{{var}}`

**Search paths:**
1. `~/.pi/agent/prompts/<name>.md` (global)
2. `.pi/prompts/<name>.md` (project-level)
3. Loaded from pi packages

**Update procedure:**
- Copy or write markdown file to `~/.pi/agent/prompts/<name>.md`
- Reload via `/reload` command

**Invocation:**
- Type `/name` in editor → expands template inline

### Extensions (`~/.pi/agent/extensions/`)

**Format:** TypeScript/JavaScript files or directories with `index.ts`

**Capabilities:**
- Custom tools (via SDK)
- Custom commands (slash commands)
- Event hooks (tool execution, chat, shell, etc.)
- UI widgets (overlays, status line, editor replacement)
- Custom providers/models

**Search paths:**
1. `~/.pi/agent/extensions/<name>/` (global)
2. `.pi/extensions/<name>/` (project-level)
3. Loaded from pi packages via `pi install`

**Update procedure:**
- Write TypeScript file to `~/.pi/agent/extensions/<name>/index.ts`
- Reload via `/reload` command
- Or restart session

**CLI management:**
```bash
pi install <source>     # Install extension from git/npm
pi remove <source>      # Remove extension
pi update [source]      # Update installed extensions
pi list                 # List installed extensions
```

See `docs/extensions.md` for full API.

### Commands

**NOT A SEPARATE PRIMITIVE** — commands are registered via extensions.

Built-in commands (`/model`, `/settings`, `/reload`, etc.) are part of pi core.

Custom commands must be defined in extensions:
```typescript
export default (sdk) => ({
  commands: {
    "mycommand": async (args, context) => {
      // command logic
    }
  }
})
```

### Custom Tools

**Mechanism:** TypeScript extensions only

Tools are defined in extensions via the SDK:
```typescript
export default (sdk) => ({
  tools: {
    "my_tool": {
      description: "What it does",
      parameters: { /* JSON schema */ },
      execute: async (params) => {
        // tool logic
      }
    }
  }
})
```

Built-in tools: `read`, `write`, `edit`, `bash`, `grep`, `find`, `ls`

See `docs/extensions.md` and `docs/sdk.md`.

### Hooks

**Mechanism:** TypeScript extensions only

Hooks are event listeners defined in extensions:
```typescript
export default (sdk) => ({
  hooks: {
    "tool.execute.before": async (event) => {
      // pre-tool logic
    },
    "chat.message": async (event) => {
      // intercept messages
    }
  }
})
```

Available hooks: `tool.execute.before`, `tool.execute.after`, `tool.definition`, `permission.ask`, `command.execute.before`, `chat.message`, `chat.params`, `chat.headers`, `shell.env`, `config`, `event`, `experimental.*`

See `docs/extensions.md`.

### Subagents

**Status:** NOT SUPPORTED NATIVELY

Pi deliberately omits sub-agent/agent delegation features. Philosophy: "Ask pi to build what you want" or use a third-party pi package.

**Workaround:** Build via extension or use project-level prompt templates/skills that simulate delegation.

### Plugins

**Pi calls them "extensions"** — TypeScript/JavaScript modules loaded at startup.

See Extensions section above.

---

## Reload Requirements

| Primitive | Takes effect |
|-----------|-------------|
| AGENTS.md | Next session start OR `/reload` |
| SYSTEM.md | Next session start |
| Skills | `/reload` OR next session |
| Prompt templates | `/reload` OR next session |
| Extensions | `/reload` OR next session |
| settings.json | Next session start (not hot-reloadable) |
| Themes | Auto hot-reload (no restart needed) |

---

## Quirks

- **No MCP support:** Unlike Claude Code/OpenCode/Slate, pi doesn't have native MCP. Must build via extensions.
- **Context file discovery:** Walks up directory tree from cwd looking for `AGENTS.md` or `CLAUDE.md` — all matching files are concatenated
- **Extensions are first-class:** Everything beyond the four built-in tools requires extensions
- **Subscription auth:** Supports provider subscription auth (`/login`) in addition to API keys — can use Claude Pro, ChatGPT Plus, GitHub Copilot, etc.
- **Thinking level:** Has dedicated thinking level control (`--thinking` flag or Ctrl+T)
- **Pi packages:** Extensions can be packaged and distributed via npm or git (`pi install`)

---

## Pi Packages

Pi supports packaging extensions, skills, prompt templates, and themes together for distribution:

```bash
pi install github:user/repo        # Install from git
pi install npm-package-name        # Install from npm
pi install /local/path             # Install from local directory
```

Packages define resources in `package.json` under `pi.resources`.

See `docs/packages.md` for creating packages.

---

## SDK Integration

Pi exposes an SDK for embedding in other applications. See `docs/sdk.md` and the `openclaw/openclaw` project for real-world example.

---

## Development

Pi is actively maintained. Check `CHANGELOG.md` for updates.

Current OSS weekend: March 27 - April 6, 2026 (issue tracker closed).

Discord: https://discord.com/invite/3cU7Bz4UPx
