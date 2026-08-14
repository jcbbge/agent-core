---
name: super-search
description: Unified 5-layer code search router (the "super search tool" / pi smart_search, ported). Auto-routes a query across colgrep (current project, semantic+hybrid), coraline (Rust/Zig/Python/Swift/Go/C repos in ~/source), pickbrain (past sessions/memory), ripgrep (exact regex, fallback), and bigfile (in-file structural search on huge PHP/JS/TS/TSX files, 10k+ lines). Use BEFORE Grep/Read for code grounding — "what does X do in this repo?", "find usages", "search ~/source", exact-pattern lookups, past-session recall, or navigating enterprise god-classes. For deep in-file work, prefer the mcp__bigfile__* MCP tools directly (load, peek, symbols, context).
argument-hint: <query> [--pattern <re>] [--repo <name>] [--file <path>] [--scope auto|project|source|exact|memory|bigfile] [--limit <n>]
allowed-tools: Bash
metadata:
  author: jrg
  version: "1.0"
  source: ~/.pi/agent/extensions/smart-search.ts
  tags: search, code-grounding, colgrep, coraline, pickbrain, ripgrep
---

# Super Search

The code-grounding router from the global doctrine, made invokable in Claude
Code. A **port of the pi `smart_search` extension**
(`~/.pi/agent/extensions/smart-search.ts`) — same binaries, no pi runtime. It
is a stateless CLI: query in, markdown sections out.

(KotaDB layer retired 2026-08-06, removed from this router 2026-08-14 —
nothing listened on `:7001` anymore, so the layer was a dead dial rather than
a working feature.)

## How to run it

```bash
bun /Users/jrg/.claude/skills/super-search/search.ts "<query>" [flags]
```

Flags (all optional):

| Flag | Meaning |
|------|---------|
| `--pattern <re>` | Exact regex/literal for the ripgrep layer |
| `--repo <name>`  | Search a specific repo under `~/source` (e.g. `surrealdb`, `zig`) via coraline |
| `--file <path>`  | Enable the bigfile layer against a specific huge file (PHP/JS/TS/TSX). Auto-fires when the file is > 3,000 lines. |
| `--scope <s>`    | Force a layer: `auto` (default), `project`, `source`, `exact`, `memory`, `bigfile` |
| `--limit <n>`    | Max results (default 10) |

## Routing (auto)

`classifyScope` picks the layer from the query unless `--scope` overrides:

- **project** (default) → **colgrep** — semantic/hybrid over the current working tree.
- **source** (query mentions `surrealdb`, `zig `, `rust `, `~`, "in source") → **coraline** over `~/source/<repo>`.
- **memory** (query mentions `session`, `memory`, `past`, `previously`, `discussed`…) → **pickbrain** over past sessions.
- **exact** (query mentions `regex`/`pattern`/`literal`, or `--pattern` given) → **ripgrep**.
- **bigfile** (`--file <path>` provided AND path is PHP/JS/TS/TSX AND file > 3,000 lines) → **bigfile** — tree-sitter parse, grep hits tagged with enclosing symbol path, no full-file read. Force with `--scope bigfile` for smaller files.
- ripgrep also runs as the **fallback** whenever the chosen layers return nothing.

**Auto is additive, not exclusive.** In `auto`, the project code layer (colgrep)
ALWAYS runs; memory/source/exact layers are *added* only on a real
signal. So a query like `"memory allocation"` is never starved of code results
by the word "memory" — memory routing now requires recall *intent* ("what did we
decide", "last session"), never a bare code noun.

## When to use

Per the global search-tool-priority doctrine: route through this **before**
`Grep`/`Read` for code grounding. It returns real `file:line` spans, never
synthesized answers. For deep in-file work on huge PHP/JS/TS/TSX files
specifically, call the `mcp__bigfile__*` MCP tools directly (`load`, `peek`,
`symbols`, `grep`, `context`) instead of this router's bigfile layer.

## Examples

```bash
# project semantic search
bun /Users/jrg/.claude/skills/super-search/search.ts "where is the quote price lock applied"

# exact pattern in current tree
bun /Users/jrg/.claude/skills/super-search/search.ts "portal token" --pattern "portal_token"

# a repo under ~/source
bun /Users/jrg/.claude/skills/super-search/search.ts "iterator invalidation" --repo zig

# recall past-session context
bun /Users/jrg/.claude/skills/super-search/search.ts "what did we decide about contracts" --scope memory

# navigate a huge PHP/JS/TS/TSX file (auto-fires on > 3k lines)
bun /Users/jrg/.claude/skills/super-search/search.ts "payment applied" --file /abs/path/to/huge.js

# force bigfile on a smaller file
bun /Users/jrg/.claude/skills/super-search/search.ts "catch Exception" --file /abs/path/file.ts --scope bigfile
```
