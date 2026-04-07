# smart-search

A 3-layer hybrid code search tool for AI coding agents. Auto-routes queries across semantic search (colgrep), structural/dependency analysis (kotadb), and exact pattern matching (ripgrep).

## What it does

| Layer | Tool | Best for |
|-------|------|----------|
| 1 | colgrep | Project source code, semantic queries ("where is auth validated?") |
| 2 | kotadb | node_modules, dependencies, impact analysis, cross-repo structural queries |
| 3 | ripgrep | Exact regex, verification, fallback |

Routing is automatic based on query intent. Use `scope` to force a specific layer.

## Adapters

- **`smart-search.pi.ts`** — pi coding agent extension (`~/.pi/agent/extensions/`)
- **`smart-search.opencode.ts`** — OpenCode plugin (`~/.config/opencode/plugins/`)

## Installation

### pi

```bash
cp smart-search.pi.ts ~/.pi/agent/extensions/smart-search.ts
```

### OpenCode

```bash
cp smart-search.opencode.ts ~/.config/opencode/plugins/smart-search.ts
```

Add to `~/.config/opencode/opencode.json`:
```json
{
  "plugin": [
    "./plugins/smart-search.ts"
  ]
}
```

## Prerequisites

- [`colgrep`](https://github.com/colgrep/colgrep) — semantic code search CLI
- [`ripgrep`](https://github.com/BurntSushi/ripgrep) — fast regex search (`brew install ripgrep`)
- [`kotadb`](https://github.com/jcbbge/kotadb) — code intelligence layer running on `:3099`

kotadb is optional — smart-search gracefully degrades if it's not running.

## Usage

```
query:   "where is the pricing engine logic"     → routes to colgrep
query:   "what depends on the quotes table"      → routes to kotadb
query:   "exact pattern: createSignal"           → routes to ripgrep
scope:   "deps"                                  → force kotadb layer
pattern: "createAsync"                           → ripgrep hybrid alongside semantic
```
