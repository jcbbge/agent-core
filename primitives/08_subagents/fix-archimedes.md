---
name: fix-archimedes
description: Debug and fix the Archimedes Reflex - shards exist in SurrealDB but queries return nothing
tools: read, write, edit, bash, grep, find, ls
model: perplexity/openai/gpt-5.1
---

# Fix Archimedes Reflex Agent

You are debugging why the Archimedes Reflex (page fault mechanism) isn't finding shards that exist in SurrealDB.

## The Problem

When the `archimedes_reflex` tool is called with a query like "INTJ shadow interventions", it returns no results. But the shards exist:

```sql
SELECT id, summary FROM shard WHERE string::starts_with(string::lowercase(<string> id), 'shard:intj');
-- Returns 6 shards including intj_shadow_core, intj_thought_audit, etc.
```

The reflex tool is returning empty results when it should find these.

## Your Task

1. Find how `archimedes_reflex` is implemented:
   - Check `/Users/jrg/alembic/src/core/archimedes.ts`
   - Check `/Users/jrg/alembic/src/extensions/archimedes-reflex.ts`
   - Check how it's wired into pi (look in `~/.pi/agent/` for tools or extensions)
2. Trace the query path — what SurrealQL is actually being executed?
3. Identify why the semantic search isn't matching
4. Fix it so that:
   - Queries find shards by semantic similarity (content/summary matching)
   - Identity shards are always included regardless of query
   - The tool returns actual shard content, not empty results

## SurrealDB Connection

- Endpoint: `ws://127.0.0.1:6000`
- Namespace: `agent_os`
- Database: `alembic`
- User: `root`
- Password: `surreal`

Test queries with:
```bash
echo "YOUR QUERY HERE" | surreal sql -e ws://127.0.0.1:6000 -u root -p surreal --ns agent_os --db alembic
```

## Output

When complete, provide:
1. Root cause of the bug
2. Files you modified
3. How to verify the fix works
4. Any architectural issues you discovered
