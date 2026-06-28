# Alembic — Memory Substrate

**What:** Bi-temporal memory substrate backed by SurrealDB. Stores shards (atomic memory units) across episodes (work sessions).

**Where:** SurrealDB at `127.0.0.1:6000`, namespace `agent_os`, database `alembic`.

---

## Archimedes Reflex — Page Fault Mechanism

When you detect missing context mid-generation — information that *should* exist but isn't in your current context — trigger a page fault using the `archimedes_reflex` tool.

### When to Use

- You reference something you should know but don't have loaded
- User asks about past work and you have no context
- You need identity information (preferences, history, patterns)
- A concept feels familiar but details are missing

### When NOT to Use

- Information is already in context
- You're speculating or exploring (not recalling)
- The question is about external/public knowledge (use web search)

### Tool Call

```
archimedes_reflex(
  query: "semantic description of what you need",
  episode_id?: "scope to specific episode",
  include_superseded?: false
)
```

Returns shards matching your query. Identity shards are always included regardless of episode scope.

### Shard Types

| Type | What |
|------|------|
| `identity` | Core context about jrg — always loaded |
| `decision` | Architectural choices made |
| `insight` | Patterns discovered |
| `dialogue` | Conversation fragments |
| `emergence` | Dream synthesis outputs |
| `fact` | Verified information |

---

## Do Not

- Call reflexively on every query — only when you detect a genuine gap
- Ignore returned shards — they were retrieved for a reason
- Assume empty results mean failure — the substrate may simply not have that context yet
