# bigfile — MCP server for navigating huge source files

Parse-once, query-many navigation for enterprise-scale files. Tree-sitter under the hood. Languages: **PHP, JavaScript, TypeScript, TSX**.

## Install

```bash
cd /Users/jrg/agent-core/primitives/tools/bigfile
bun install
```

Native `tree-sitter` needs a C toolchain — Xcode CLT on macOS is enough.

## Register with Claude Code (global, user scope)

```bash
claude mcp add --scope user bigfile \
  /Users/jrg/.bun/bin/bun run /Users/jrg/agent-core/primitives/tools/bigfile/src/server.ts
```

Verify:

```bash
claude mcp list | grep bigfile
```

You should now see tools `mcp__bigfile__bigfile_load`, `_stats`, `_symbols`, `_peek`, `_grep`, `_context`, `_slice`.

The companion skill lives at `~/.claude/skills/navigating-big-files/SKILL.md` and teaches Claude when + how to reach for these tools.

## Tools

| Tool | Purpose |
|------|---------|
| `bigfile_load` | Parse + cache. Call first. |
| `bigfile_stats` | Line/byte/symbol counts, 10 largest symbols. |
| `bigfile_symbols` | List/filter symbols (kind, name substring, min lines). |
| `bigfile_peek` | One symbol's body, or a line range. Capped at 400 lines. |
| `bigfile_grep` | Regex search; hits tagged with enclosing symbol path. |
| `bigfile_context` | "What symbol am I inside at line N?" |
| `bigfile_slice` | Raw line-range slice, 400-line cap. |

## Design rules

- No verb ever returns the whole file.
- Cache key = `absPath + mtimeMs`. External edits reparse on next call.
- 400-line cap on any body-returning verb; 200-hit cap on grep.
- Symbol refs support `.`, `::`, and PHP `\` separators.

## Extending languages

Add grammar to `package.json`, register in `LANG_BY_EXT` and `SYMBOL_KINDS` in `src/bigfile.ts`. See `tree-sitter` node kinds for the target language.
