# Harness Onboarding SOP

**Rule: Do not write a harness profile until every field has a source doc citation.**
**Rule: Do not run the audit until the profile is marked `"status": "verified"`.**

---

## Step 1 — Identify the Harness

Before touching anything:

- What is the official name and repo/docs URL?
- Is it actively maintained?
- What runtime does it use (node, bun, deno, python, native)?
- Is it a fork or wrapper of another harness? (If yes — research the parent first.)

```
harness: ___________________
repo: ___________________
docs: ___________________
parent_harness: ___________ (or N/A)
```

---

## Step 2 — Research Each Primitive (No Guessing)

For each of the nine primitives, find the official answer from docs or source code.
Document the exact path, format, and a direct link to the source.

**If a primitive is not supported:** state `supported: false` and why.
**If it's partial or indirect:** state `supported: "partial"` with a note.
**Never leave a field blank or assumed.**

Use the research subagent or WebSearch with queries like:
- `"[harness name] AGENTS.md" OR "[harness name] system prompt configuration"`
- `"[harness name] skills OR slash commands OR hooks configuration"`
- `"[harness name] MCP servers configuration"`
- Look at the official repo's config schema file — that's the ground truth.

### The Nine Primitives to Research

| # | Primitive | What to find |
|---|-----------|-------------|
| 1 | Agent file | What file? What path? Walked from CWD or fixed global? |
| 2 | Rules | Dedicated rules directory? Glob patterns? Injected into agent file? |
| 3 | Skills | Skills directory? File format? Search paths? |
| 4 | Commands | Slash commands? File format? Search paths? |
| 5 | Custom Tools | Beyond MCP — how to register? File format? |
| 6 | Hooks | Event system? What events? Shell scripts or programmatic? |
| 7 | MCP Servers | Config file? Key name? local vs remote format? |
| 8 | Subagents | Agent delegation? Markdown files? Config key? |
| 9 | Plugins | Extension system? File format? Load paths? |

---

## Step 3 — Write the Harness Profile

Create `~/Documents/_agents/primitives/harnesses/[harness-name].json`.

Required fields per primitive:
```json
{
  "supported": true | false | "partial",
  "native_name": "what the harness calls this concept",
  "search_paths": ["array of exact paths the harness checks"],
  "note": "anything that differs from the naive expectation",
  "source_doc": "URL or file:line that proves this",
  "verify": "bash one-liner that exits 0 if configured, 1 if not"
}
```

Set top-level `"status": "UNVERIFIED"` until Step 4 is complete.

---

## Step 4 — Bridge to Agent Core

For each supported primitive, connect the harness path to the agent core source:

| Strategy | When to use |
|----------|-------------|
| `symlink` | Harness reads from a path we control — symlink to `primitives/[type]/` |
| `copy-and-track` | Harness needs its own copy — copy + note the sync requirement |
| `merge-json` | Harness config file needs entries added — add them, document what was added |
| `merge-yaml` | Same but YAML |
| `inject-into-agent-file` | No dedicated mechanism — embed the content in the agent file |
| `plugin/tool-wrapper` | Harness needs a native plugin/tool that wraps agent core functionality |
| `none` | Primitive not supported by harness — document why, accept the gap |

For each primitive, run the bridge action and verify it worked.

---

## Step 5 — Write Nine Verification Checks

Each check must be a bash one-liner (the `verify` field) that:
- Exits `0` if the primitive is properly configured and reachable by the harness
- Exits `1` if not
- Works from any working directory

Run all nine:
```bash
bash ~/Documents/_agents/tools/primitives-audit.sh
```

The harness column for this harness must show ✓ or — (N/A) for every row.
No ✗ allowed before marking `"status": "verified"`.

---

## Step 6 — Mark Verified and Commit

1. Set `"status": "verified"` and `"verified_date": "YYYY-MM-DD"` in the profile
2. Run the audit one final time — screenshot or save output
3. Commit: `decisions: harness-[name] primitives verified YYYY-MM-DD`

---

## Adding a New Harness (Quick Reference)

```
1. Research (Step 1-2)  →  no shortcuts
2. Write profile JSON   →  every field has source_doc
3. Bridge connections   →  symlink/merge/inject as appropriate
4. Run audit            →  nine checks, all ✓ or —
5. Mark verified        →  status: verified + date
```

---

## Template

Copy this for a new profile:

```json
{
  "harness": "",
  "description": "",
  "status": "UNVERIFIED",
  "verified_date": null,
  "source_repo": "",
  "source_files": [],
  "primitives": {
    "agent_file":    { "supported": null, "native_name": "", "search_paths": [], "note": "", "source_doc": "", "verify": "" },
    "rules":         { "supported": null, "native_name": "", "search_paths": [], "note": "", "source_doc": "", "verify": "" },
    "skills":        { "supported": null, "native_name": "", "search_paths": [], "note": "", "source_doc": "", "verify": "" },
    "commands":      { "supported": null, "native_name": "", "search_paths": [], "note": "", "source_doc": "", "verify": "" },
    "custom_tools":  { "supported": null, "native_name": "", "search_paths": [], "note": "", "source_doc": "", "verify": "" },
    "hooks":         { "supported": null, "native_name": "", "search_paths": [], "note": "", "source_doc": "", "verify": "" },
    "mcp_servers":   { "supported": null, "native_name": "", "search_paths": [], "note": "", "source_doc": "", "verify": "" },
    "subagents":     { "supported": null, "native_name": "", "search_paths": [], "note": "", "source_doc": "", "verify": "" },
    "plugins":       { "supported": null, "native_name": "", "search_paths": [], "note": "", "source_doc": "", "verify": "" }
  }
}
```
