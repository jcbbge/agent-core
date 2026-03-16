# AgentCore Schema — Harness Onboarding SOP

Primitive updates are **manual**. There are no sync scripts or adapters.

Process: read the target harness's `HARNESS.md`, locate the correct config file, make the specific edit.

---

## Onboarding a New Harness

### Step 1 — Identify the Harness

Before writing anything:

- What is the official name and docs URL?
- Is it actively maintained?
- What runtime does it use?
- Is it a fork or wrapper of another harness?

```
harness: ___________________
repo:    ___________________
docs:    ___________________
parent:  ___________________ (or N/A)
```

---

### Step 2 — Research Each Primitive (No Guessing)

For each of the nine primitives, find the answer from official docs or source code.
Document the exact path, format, and source citation.

**If a primitive is not supported:** state `supported: false` and why.
**Never assume — always cite.**

Use WebSearch with queries like:
- `"[harness name] AGENTS.md" OR "[harness name] system prompt configuration"`
- `"[harness name] MCP servers configuration"`
- `"[harness name] slash commands OR custom commands"`

#### The Nine Primitives

| # | Primitive | What to find |
|---|-----------|-------------|
| 1 | Agent file | What file? What path? Walked from CWD or fixed global? |
| 2 | Rules | Dedicated directory? Glob patterns? Injected into agent file? |
| 3 | Skills | Skills directory? File format? Search paths? |
| 4 | Commands | Slash commands? File format? Search paths? |
| 5 | Custom Tools | Beyond MCP — how to register? |
| 6 | Hooks | Event system? What events? Shell scripts or programmatic? |
| 7 | MCP Servers | Config file? Key name? local vs remote format? |
| 8 | Subagents | Agent delegation? File format? Config key? |
| 9 | Plugins | Extension system? File format? Load paths? |

---

### Step 3 — Create the HARNESS.md

Create `~/Documents/_agents/harnesses/[harness-name]/HARNESS.md`.

It must document, for each supported primitive:
- Exact config file path
- Exact format (with example)
- Manual update procedure ("copy X to Y", "add this JSON block to Z")
- Reload requirement (session restart? app restart?)
- Any quirks that differ from other harnesses

See existing HARNESS.md files as reference:
- `harnesses/claude-code/HARNESS.md`
- `harnesses/opencode/HARNESS.md`
- `harnesses/omp/HARNESS.md`
- `harnesses/slate/HARNESS.md`

---

### Step 4 — Update the MCP Registry

Add the harness name to the `harnesses` array for each applicable server in:
```
~/Documents/_agents/schema/mcp/registry.json
```

Then manually apply the MCP config to the harness using the format documented in its HARNESS.md.

---

### Step 5 — Apply Each Primitive Manually

For each primitive the harness supports, follow the manual procedure in HARNESS.md:

1. Read the HARNESS.md for the target harness
2. Identify which config file needs to change
3. Make the specific edit (copy file, add JSON block, etc.)
4. Verify it took effect (check the reload requirement first)

**One primitive at a time. Verify after each step.**

---

### Step 6 — Verify and Document

Manual verification checklist:

**Agent file / Rules**
- [ ] File exists at the documented path
- [ ] Rules appear in a new session

**MCP Servers**
- [ ] Config file contains the server entries
- [ ] Health check passes: `curl http://localhost:PORT/health`
- [ ] Tools appear in harness after restart

**Commands**
- [ ] Command files exist at the documented path
- [ ] Commands appear in harness UI after restart

**Skills**
- [ ] Skill files exist at the documented path
- [ ] Skills are accessible in sessions

---

## Updating Primitives Across Harnesses

When a primitive changes (e.g., new rule added, MCP server registered, command updated):

1. Update the source of truth in `~/Documents/_agents/schema/`
2. For each harness that uses this primitive:
   a. Open `harnesses/[name]/HARNESS.md`
   b. Follow the "Update Procedure" for that primitive
   c. Apply the change manually to the correct config file
3. Verify the change is live

**Never assume a script will handle this. It won't.**

---

## Primitive Update Procedures (Quick Reference)

| Primitive | Source of truth | Apply how |
|-----------|----------------|-----------|
| Agent file / Rules | `schema/rules/*.md` | See each HARNESS.md — varies by harness |
| MCP Servers | `schema/mcp/registry.json` | Edit harness config file directly |
| Commands | `schema/commands/*.md` | Copy to harness commands dir OR add template to config |
| Skills | `schema/skills/*/SKILL.md` | Read on-demand (most harnesses) or copy to skills dir |
| Subagents | `schema/subagents/*.md` | Copy to harness agents dir (if supported) |
| Hooks | `schema/hooks/` | Copy to harness hooks dir (if supported) |

---

## Harness Config Locations (Current)

| Harness | Config file | Agent rules | MCP key |
|---------|-------------|-------------|---------|
| Claude Code | `~/.claude/mcp.json` | `~/.claude/rules/*.md` | `mcpServers` |
| OpenCode | `~/.config/opencode/opencode.json` | `~/.claude/rules/*.md` (shared) | `mcp` |
| OMP | `~/.omp/agent/mcp.json` | `~/.omp/agent/rules/*.md` | `mcpServers` |
| Slate | `~/.config/slate/slate.json` | `~/.config/slate/AGENTS.md` | `mcp` |

**For full detail on each harness, read its HARNESS.md.**

---

## MCP Format Differences

| Harness | Type field | Enabled required |
|---------|-----------|-----------------|
| Claude Code | `"http"` | no |
| OpenCode | `"http"` | `"enabled": true` |
| OMP | `"http"` | no |
| Slate | `"remote"` | `"enabled": true` |

---

## References

- `harnesses/claude-code/HARNESS.md` — Claude Code primitive guide
- `harnesses/opencode/HARNESS.md` — OpenCode primitive guide
- `harnesses/omp/HARNESS.md` — OMP primitive guide
- `harnesses/slate/HARNESS.md` — Slate primitive guide
- `schema/mcp/registry.json` — MCP server registry with harness tags
- `harnesses/README.md` — Overview of manual update process
