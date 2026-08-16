# Tools

Tool **implementations** living in the canonical pantry.

## What is here

- `bigfile/` — the Bigfile MCP server implementation (tree-sitter huge-file
  navigation). Registered in Claude Code as `mcp__bigfile__*`
  (`~/.claude.json` → `src/server.ts`); in cursor via MCP `bigfile`;
  pi calls the same library / CLI. Never Read a 3k+ PHP/JS/TS/TSX file.
- `_deprecated/` — extension-variant duplicates (kotadb / colgrep / bigfile /
  composto / tldraw as pi `registerTool` extensions) that were never
  installed, plus orphaned experiments (openrouter-research, install), plus
  `super-search/` (router retired 2026-08-16 — utensils are called by name).
  kotadb itself was fully retired 2026-08-06. Kept for git history only —
  do not resurrect without deleting one of the two packagings first.

## What is NOT here

- pi utensils (`batch`, `diff`, `tree`, `undo`, `workspace`, …) — canonical
  home is `~/.strudel/utensils/`.
- Vendor CLIs on PATH: `coraline`, `colgrep`, `pickbrain`, `composto`, `rg`.
  Skills live in `primitives/skills/<name>/`.
