# How to Add a New Harness

A harness is any AI agent runtime: an IDE extension, a CLI tool, a chat interface.
Each needs two files: `HARNESS.md` (documentation) and `adapter.sh` (deployment logic).

## Steps

### 1. Discover the harness

Answer these questions before writing any code:

- Where does it store its config? (`~/.config/harness/` or `~/.[harness]/` or elsewhere?)
- Does it support skills? What format? (`.md` with frontmatter? plain text?)
- Does it support slash commands? How does it register them?
- Does it have an always-loaded rules file? (like `AGENTS.md` or `.cursorrules`)
- Does it support MCP? HTTP or stdio only?
- Does it have hooks/plugins? What language? What events?

### 2. Create the harness directory

```bash
cp -r ~/Documents/_agents/harnesses/_template ~/Documents/_agents/harnesses/[name]
```

### 3. Fill out HARNESS.md

Open `harnesses/[name]/HARNESS.md` and fill in every field.
Be honest: mark primitives as "unknown" if you haven't verified them.
This file is what any agent reads to understand this harness. Make it accurate.

### 4. Write adapter.sh

Open `harnesses/[name]/adapter.sh`. Implement each section:

```bash
deploy_skills() {
  # Where does this harness load skills from?
  local target="$HOME/.config/[harness]/skills"
  mkdir -p "$target"
  rsync -a --delete "$PRIMITIVES/skills/" "$target/"
}

deploy_mcp() {
  # How does this harness register MCP servers?
  # Read from primitives/mcp/registry.json, write to harness config.
  python3 ~/Documents/_agents/deploy/patch-mcp.py \
    "$PRIMITIVES/mcp/registry.json" \
    "$HOME/.config/[harness]/config.json" \
    "[harness-name]"
}
```

### 5. Test it

```bash
~/Documents/_agents/deploy.sh --dry-run [name]   # verify plan
~/Documents/_agents/deploy.sh [name]              # execute
```

### 6. Register in the MCP registry (if needed)

If this harness needs specific MCP servers, add `"[name]"` to the `"harnesses"` array
for each server in `primitives/mcp/registry.json`.

### 7. Add observability

If the harness has hooks, add an emit call:
```bash
~/Documents/_agents/observe/emit.sh [harness-name] hook session_start
```

---

## Known Harness Patterns

| Pattern | Harnesses | Notes |
|---------|-----------|-------|
| `AGENTS.md` rules | OpenCode, Cursor(agent mode) | Drop file in config dir |
| `.cursorrules` | Cursor | Project-level only |
| `CLAUDE.md` | Claude Code | Global + project level |
| MCP HTTP | Claude Code, OpenCode, Cursor, Windsurf | Preferred |
| MCP stdio | Claude Code, OpenCode, Aider | Avoid — orphan risk |
| TypeScript plugins | OpenCode | For event hooks |
| Shell hooks | Claude Code | In settings.json |
