# Session Handoff
Date: 2026-03-10
Mode: meta/systems

## Completed

- **Kotadb auto-clone feature** — Built clone-store module for auto-cloning from GitHub, added `list_repositories` and `remove_repository` MCP tools, updated repo schema with `local_path`/`current_commit`/`ref` fields
- **Documentation fixes** — Fixed outdated SurrealDB port references (7201→8002) across agent-core docs  
- **core CLI fix** — Changed port 8000→8002 for SurrealDB health checks

## Decisions Captured

- Auto-clone uses fallback strategy: try specific ref first, fall back to default branch if that fails
- Uses SurrealDB record ID format with ⟨...⟩ unicode brackets (required for queries)

## Kotadb Changes (uncommitted)

- `app/src/indexer/clone-store.ts` (new)
- `app/src/api/queries.ts` (modified)
- `app/src/db/surreal/schema.surql` (modified)
- `app/src/mcp/server.ts` (modified)
- `app/src/mcp/tools.ts` (modified)

## agent-core State

- 30+ skills deployed
- 4 rules deployed
- kotadb MCP: 20 tools (added list_repositories + remove_repository)
- SurrealDB: single instance at port 8002

## Open Items

1. Commit kotadb changes (auto-clone feature)
2. Update kotadb operational docs with new tools

## Next Session Focus

Commit kotadb auto-clone feature and update `~/kotadb/docs/operations/repo-management.md` with new `list_repositories`/`remove_repository` tools.
