# ADR-001: Stack Catalog Uses SurrealDB Graph Model, Not Files or Flat Tables

**Date:** 2026-03-09
**Status:** Accepted

## Context

The stack had no single authoritative source of truth about what's installed, where, why, and how things relate. Knowledge lived in `brain-infrastructure.md` (prose, always stale), scattered tool profiles (`rtk.md`), git history, and memory. Agents had to crawl files to understand the environment. Every new tool added to a different file — no unified view. The immediate trigger: designing the `_agents/` repo structure and realizing the problem wasn't file organization, it was a declaration problem.

## Decision

The stack catalog lives in SurrealDB (`stack/catalog` namespace) as a graph: separate SCHEMAFULL tables per entity type (`daemon`, `port`, `mcp_server`, `tool`, `hook`, `script`) connected by RELATE edges. Agents query SurrealDB via graph traversal. `brain-infrastructure.md` is deleted — the catalog replaces it.

```sql
daemon:anima_mcp  →backed_by→  mcp_server:anima  →provides→  tool:anima_bootstrap
                                                  →listens_on→  port:3098
hook:session_start  →invokes→  mcp_server:anima
```

## Consequences

- Agents can ask "what would break if port 3098 went down?" and get a traversal answer
- Agents can discover capabilities via full-text search on `tool.description`
- `brain-infrastructure.md` is deleted — no more stale prose
- Requires a sync process: `stack.yaml` → SurrealDB (additional moving part)
- Observed state (health checks, timestamps) lives in SurrealDB; declared intent lives in `stack.yaml`

## Alternatives Rejected

| Alternative | Why rejected |
|---|---|
| Single `STACK.md` markdown file | Not queryable by agents, rots immediately, no graph |
| Flat `stack_entry` table with `type` field | Can't traverse relationships, indexes can't be type-specific |
| `stack.yaml` only | Human-readable but agents must parse files; no graph; no live health state |
| One file per tool (`rtk.md`, etc.) | Fragmented, no unified view, no relationships |

## Resonance

The moment the graph model clicked: asking "what depends on this port?" is a question that only a graph can answer cleanly. Flat documents can describe the world. Graphs can reason about it. The stack isn't a list of things — it's a web of relationships. The catalog should reflect that.
