# ADR-012: Session Workflow Uses SurrealDB for Cross-Project Context

## Status
Accepted

## Date
2026-03-12

## Context
The session handoff system relied solely on markdown files in `~/Documents/_agents/workspace/`. This created two problems:
1. Context only available when working in that directory
2. No cross-project visibility - couldn't query "what's happening across all projects"

## Decision
Connect start/end session skills directly to SurrealDB (dev-brain tables):
- **Starting-session**: Queries `workspace_state`, `todos`, `recent_context` from DB
- **Ending-session**: Writes to DB in addition to markdown (preserves git history)
- Added `feature` field to task table for hierarchical grouping: [project][feature][Task N]
- Implemented `get_todo_overview` for cross-project summary view

## Consequences
- ✅ Context available from any directory
- ✅ Cross-project queryable state
- ✅ Multi-thread visibility (get_active_threads)
- ⚠️ Markdown handoff still written (git history) - dual write for now

## Related
- Supersedes ADR-004 institutional knowledge layer (adds session workflow)
