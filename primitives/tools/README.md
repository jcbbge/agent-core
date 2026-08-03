# Tools

Tool **implementations** living in the canonical pantry.

## What is here

- `bigfile/` — the Bigfile MCP server implementation (tree-sitter huge-file
  navigation). Registered in Claude Code as `mcp__bigfile__*`
  (`~/.claude.json` → `src/server.ts`); in pi reachable via super-search's
  bigfile layer.
- `_deprecated/` — extension-variant duplicates (kotadb / colgrep / bigfile /
  composto / tldraw as pi `registerTool` extensions) that were never
  installed, plus orphaned experiments (openrouter-research, install).
  The live pi surface for those tools is super-search + CLIs; the live CC
  surface is MCP. Kept for git history only — do not resurrect without
  deleting one of the two packagings first.

## What is NOT here

- pi utensils (`batch`, `diff`, `tree`, `undo`, `workspace`, …) — canonical
  home is `~/.strudel/utensils/`.
- The search router — canonical home is `~/.claude/skills/super-search/`.
