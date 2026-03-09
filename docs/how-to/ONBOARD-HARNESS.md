# Onboarding a New Harness

This guide walks through adding support for a new AI harness (Cursor, Goose, Aider, etc.) to the agent-core system.

**Core principle:** Primitives are universal. Only implementation details vary by harness.

---

## 1. Philosophy: Primitives Are Universal

Agent-core organizes capabilities into **primitives** — conceptual building blocks that are harness-agnostic:

| Primitive | Purpose | Claude Code | Opencode | Your Harness |
|-----------|---------|-------------|----------|--------------|
| **Skills** | Domain expertise | `~/.claude/skills/` | `~/.config/opencode/skills/` | ??? |
| **Commands** | Slash commands | `~/.claude/commands/` | `~/.config/opencode/commands/` | ??? |
| **Rules** | Always-loaded context | `~/.claude/CLAUDE.md` | `~/.config/opencode/AGENTS.md` | ??? |
| **MCP** | External tools | `~/.claude/mcp.json` | `opencode.json` `"mcp"` key | ??? |
| **Hooks** | Event triggers | `settings.json` | `plugins/*.ts` | ??? |
| **Sub-agents** | Specialist agents | `~/.claude/agents/` | `~/.config/opencode/agents/` | ??? |

Your job: Map each primitive to your harness's native format and location.

---

## 2. Research Your Harness

Before writing code, answer these questions:

### Configuration
- Where does the harness store global config? (e.g., `~/.config/harness/`)
- Does it support project-level config? (e.g., `.harness/` in project root)
- What's the format? (JSON, YAML, TOML, custom?)

### Primitives Support
- **Skills:** Does it support domain-specific skill files? What format? (Markdown + YAML frontmatter? Plain text?)
- **Commands:** Does it support slash commands or custom commands? File-based or config-based?
- **Rules:** Is there a rules file that's always loaded? Global vs project-level?
- **MCP:** Does it support MCP servers? HTTP vs stdio? What config format?
- **Hooks:** Does it support event triggers? Shell scripts or TypeScript/JS plugins?
- **Sub-agents:** Does it support specialist agents or personas? File-based?

### Reload Behavior
- Do changes take effect immediately?
- Or require session restart?
- Or full application restart?

---

## 3. Create Harness Documentation

### Step 1: Create Directory

```bash
cd ~/Documents/_agents
mkdir -p harnesses/[your-harness-name]
```

### Step 2: Create HARNESS.md

Copy from template:
```bash
cp harnesses/_template/HARNESS.md harnesses/[your-harness-name]/HARNESS.md
```

Fill out the Identity table:

```markdown
| Field | Value |
|-------|-------|
| Name | your-harness |
| Config dir | `~/.config/your-harness/` |
| Rules file | `~/.config/your-harness/RULES.md` |
| Status | active / inactive / unknown |
| Tested | YYYY-MM-DD |
```

Fill out the Primitive Support table for your harness:

```markdown
| Primitive | Supported | Format | Deploy target |
|-----------|-----------|--------|---------------|
| Skills | yes/no | Markdown + YAML frontmatter | `~/.config/your-harness/skills/` |
| Commands | yes/no | Markdown files | `~/.config/your-harness/commands/` |
| Rules | yes/no | Always-loaded `.md` | `~/.config/your-harness/RULES.md` |
| MCP (HTTP) | yes/no | JSON config | `~/.config/your-harness/mcp.json` |
| Hooks | yes/no | Shell scripts | `~/.config/your-harness/hooks/` |
| Sub-agents | yes/no | Markdown files | `~/.config/your-harness/agents/` |
```

### Step 3: Document Config Format

Show the exact file paths and formats:

```markdown
## Config Files

```
~/.config/your-harness/config.json     — main config
~/.config/your-harness/mcp.json        — MCP registrations (if separate)
~/.config/your-harness/RULES.md        — always-loaded rules
```
```

### Step 4: Document MCP Format

Show the MCP server config format:

```markdown
## MCP Config Format

```json
{
  "mcpServers": {
    "server-name": {
      "type": "http",
      "url": "http://localhost:PORT/"
    }
  }
}
```
```

Or if your harness uses stdio:

```json
{
  "mcpServers": {
    "server-name": {
      "type": "stdio",
      "command": ["/path/to/runtime", "/path/to/server.js"]
    }
  }
}
```

**Strongly prefer HTTP over stdio** — see MCP reference for why.

### Step 5: Document Reload Behavior

```markdown
## How to Reload After Changes

Skills: Take effect on next message
MCP: Restart required
Rules: Take effect immediately
```

### Step 6: Document Quirks

List anything non-obvious:

```markdown
## Quirks

- Skills must be in subdirectories, not flat files
- MCP only supports stdio (HTTP not available)
- Rules file must be at project root, not global
```

---

## 4. Create the Adapter

The adapter translates agent-core primitives to your harness's native format.

### Step 1: Copy Template

```bash
cp harnesses/_template/adapter.sh harnesses/[your-harness-name]/adapter.sh
chmod +x harnesses/[your-harness-name]/adapter.sh
```

### Step 2: Implement Each Function

Open `adapter.sh` and fill in each `deploy_*` function:

#### deploy_skills()

```bash
deploy_skills() {
  local target="$HOME/.config/your-harness/skills"
  if [ -z "$target" ]; then 
    echo "[your-harness] skills: not configured"; 
    return; 
  fi
  mkdir -p "$target"
  rsync -a --delete "$PRIMITIVES/skills/" "$target/"
  echo "[your-harness] skills → $target"
}
```

If your harness doesn't support skills, leave it empty or log "not supported".

#### deploy_commands()

```bash
deploy_commands() {
  local target="$HOME/.config/your-harness/commands"
  if [ -z "$target" ]; then 
    echo "[your-harness] commands: not configured"; 
    return; 
  fi
  mkdir -p "$target"
  rsync -a --delete "$PRIMITIVES/commands/" "$target/"
  echo "[your-harness] commands → $target"
}
```

#### deploy_rules()

Some harnesses have a single rules file, some have a directory:

```bash
# Single file approach
deploy_rules() {
  local target="$HOME/.config/your-harness/RULES.md"
  cat "$PRIMITIVES/rules/"*.md > "$target"
  echo "[your-harness] rules → $target"
}

# Directory approach
deploy_rules() {
  local target="$HOME/.config/your-harness/rules"
  mkdir -p "$target"
  rsync -a --delete "$PRIMITIVES/rules/" "$target/"
  echo "[your-harness] rules → $target"
}
```

#### deploy_mcp()

This is the most complex — you read `registry.json` and write your harness's MCP config:

```bash
deploy_mcp() {
  local primitives="$PRIMITIVES"
  python3 - "$primitives" <<'PYEOF'
import json, os, sys

primitives = sys.argv[1]
registry_path = os.path.join(primitives, "mcp/registry.json")
config_path = os.path.expanduser("~/.config/your-harness/mcp.json")

with open(registry_path) as f:
    registry = json.load(f)

servers = {}
for s in registry["servers"]:
    if "your-harness" in s.get("harnesses", []) and s["transport"] == "http":
        servers[s["name"]] = {
            "type": "http",
            "url": s["url"]
            # Add harness-specific fields here
        }

config = {"mcpServers": servers}
with open(config_path, "w") as f:
    json.dump(config, f, indent=2)
print(f"[your-harness] mcp → {config_path} ({len(servers)} servers)")
PYEOF
}
```

Note: Filter by `"your-harness" in s.get("harnesses", [])` and `s["transport"] == "http"`.

#### deploy_hooks()

If your harness supports hooks:

```bash
deploy_hooks() {
  local hooks_src="$PRIMITIVES/hooks"
  local hooks_dest="$HOME/.config/your-harness/hooks"
  
  mkdir -p "$hooks_dest"
  for script in "$hooks_src"/*.sh; do
    [[ -f "$script" ]] || continue
    cp "$script" "$hooks_dest/"
    chmod +x "$hooks_dest/$(basename "$script")"
  done
  echo "[your-harness] hooks → $hooks_dest"
}
```

#### deploy_subagents()

```bash
deploy_subagents() {
  local target="$HOME/.config/your-harness/agents"
  mkdir -p "$target"
  rsync -a --delete "$PRIMITIVES/subagents/" "$target/"
  echo "[your-harness] subagents → $target"
}
```

### Step 3: Test the Adapter

Follow the manual onboarding protocol in `harnesses/_template/ONBOARDING.md`.
Provision one primitive at a time. Verify the harness starts cleanly after each step.

---

## 5. Register MCP Servers for Your Harness

Once your adapter is working, add your harness to existing MCP servers in `registry.json`:

```json
{
  "servers": [
    {
      "name": "anima",
      "harnesses": ["claude-code", "opencode", "your-harness"],
      ...
    }
  ]
}
```

Then manually update each harness config to include the new server.
See `harnesses/[name]/` for each harness's MCP config location.

---

## 6. Verification Checklist

After deployment, verify each primitive:

### Skills
- [ ] Skills directory exists at expected path
- [ ] Skill files are in correct format
- [ ] Harness recognizes and loads skills

### Commands
- [ ] Commands directory exists
- [ ] Commands appear in harness UI/help
- [ ] Commands execute when invoked

### Rules
- [ ] Rules file exists at expected path
- [ ] Rules are loaded in new sessions
- [ ] Project-level rules merge correctly

### MCP
- [ ] MCP config file exists
- [ ] Servers are listed in config
- [ ] Health check passes: `curl http://localhost:PORT/health`
- [ ] Tools appear in harness

### Hooks
- [ ] Hook scripts copied to destination
- [ ] Hooks fire on expected events
- [ ] Hook output visible in logs

### Sub-agents
- [ ] Agents directory exists
- [ ] Agent files in correct format
- [ ] Harness can invoke sub-agents

---

## 7. Common Patterns & Pitfalls

### Path Differences

| Harness Style | Config Location |
|---------------|-----------------|
| Dotfile style | `~/.harness/` (e.g., `~/.claude/`) |
| XDG style | `~/.config/harness/` (e.g., `~/.config/opencode/`) |
| Mixed | `~/.harness/` for some, `~/.config/` for others |

### Format Differences

| Primitive | Common Formats |
|-----------|----------------|
| Skills | Markdown + YAML frontmatter, plain Markdown, JSON |
| Commands | Markdown files, JSON config, embedded in main config |
| Rules | Single `.md` file, directory of fragments, inline in config |
| MCP | JSON file, key in main config, separate service |

### Reload Behavior

| Harness | Skill Reload | MCP Reload | Rule Reload |
|---------|--------------|------------|-------------|
| Claude Code | Next message | Restart | Immediate |
| Opencode | Next session | Next session | Immediate |
| Cursor | ??? | ??? | ??? |

### MCP Gotchas

1. **stdio vs HTTP:** Most harnesses support both. Always implement HTTP in your adapter, filter stdio unless specifically supported.

2. **URL format:** Some require trailing slash, some don't. Match your harness's convention.

3. **Enabled flag:** Some harnesses require `"enabled": true`, some don't.

4. **Path suffixes:** Some servers use `/mcp` suffix (kotadb), most use `/`. Preserve the URL from registry.

---

## 8. Examples by Harness

### Claude Code (Reference)

- **Config dir:** `~/.claude/`
- **Skills:** Directory per skill with `SKILL.md`
- **MCP:** `~/.claude/mcp.json`, `type: "http"`
- **Hooks:** Shell scripts + `settings.json` merge

See: `harnesses/claude-code/adapter.sh`

### Opencode (Reference)

- **Config dir:** `~/.config/opencode/`
- **Skills:** Flat directory with `SKILL.md` files
- **MCP:** Key in `opencode.json`, `type: "http"`, `enabled: true`
- **Hooks:** TypeScript plugins in `plugins/`

See: `harnesses/opencode/adapter.sh`

---

## 9. When to Add a New Harness

Consider adding support when:

1. You're actively using the harness daily
2. The harness has stable primitive APIs
3. You need primitives synced across multiple harnesses

Don't add when:

1. You're just experimenting with the harness
2. The harness has no primitive support (no skills, MCP, etc.)
3. The harness changes config format frequently

---

## References

- `harnesses/_template/HARNESS.md` — Template documentation
- `harnesses/_template/adapter.sh` — Template adapter
- `harnesses/claude-code/` — Working Claude Code implementation
- `harnesses/opencode/` — Working Opencode implementation
- `primitives/mcp/AGENT.md` — MCP server reference
- `ADD-MCP.md` — Adding MCP servers
