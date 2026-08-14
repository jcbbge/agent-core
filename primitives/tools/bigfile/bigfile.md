# bigfile

**URL:** local — `/Users/jrg/agent-core/primitives/05_tools/bigfile/`
**Category:** local · MCP server
**Status:** adopted
**Date:** 2026-07-02

## What It Does
Parse a huge source file once with tree-sitter, then answer bounded queries against it (symbols, grep-with-enclosing-symbol, peek, reverse line → symbol lookup). File stays on the server; only the query result crosses back into agent context.

## Why Interesting
Solves the "30,000-line enterprise file" bottleneck no other primitive in the stack addresses. `super-search`/`colgrep`/`coraline` find the file; `bigfile` navigates *inside* it without emitting the body. (kotadb was retired 2026-08-14 — super-search is now honestly a 5-layer router without it.)

## Use Case
- Agent needs to work on a 17k-line PHP god-class (real: `_app.php` in `infinity/bento/_SRC/pagoda`).
- Agent needs to find every place a symbol is touched *inside one file* and know which method contains each hit.
- Agent needs to jump to line N in a huge file and understand the enclosing class/method.

## Registration

**Claude Code (global, user scope):**
```bash
claude mcp add --scope user bigfile \
  /Users/jrg/.bun/bin/bun run /Users/jrg/agent-core/primitives/05_tools/bigfile/src/server.ts
```

**Strudel:** discovered via `~/.strudel/mcps/bigfile.md`.

**Skill (Claude Code):** `~/.claude/skills/navigating-big-files/SKILL.md`.

## Tools

| Tool | Purpose | Cap |
|------|---------|-----|
| `bigfile_load` | Parse + cache | — |
| `bigfile_stats` | Shape + 10 largest symbols | — |
| `bigfile_symbols` | List / filter by kind, name, min_lines | 500 rows |
| `bigfile_peek` | One symbol body OR line range | 400 lines |
| `bigfile_grep` | Regex + enclosing-symbol tags | 200 hits |
| `bigfile_context` | Reverse: line → symbol path | — |
| `bigfile_slice` | Raw line-range read | 400 lines |

## Languages
PHP, JavaScript, TypeScript, TSX. Extend by adding grammar to `package.json` + entries in `LANG_BY_EXT` and `SYMBOL_KINDS`.

## Competitors
- `Read` — the thing being replaced for huge files
- `coraline` — cross-file symbol graphs (complementary, not competing)
- `super-search` — locates files; feeds paths into `bigfile`

## Notes
- Requires `bufferSize: 32 MiB` on the tree-sitter parse call — its default 32 KiB throws on files > ~50 KB.
- Native `tree-sitter` binding needs a C toolchain to build (Xcode CLT on macOS).
- Verified on: `_app.php` (17,051 lines, 486 KB, parse 98 ms), `_pgObjectsMT.php` (9,984 lines, parse 68 ms).
