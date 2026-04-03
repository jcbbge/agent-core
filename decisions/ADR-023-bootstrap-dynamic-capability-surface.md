# ADR-023: Bootstrap Returns Live Dynamic Capability Surface

**Date:** 2026-04-03  
**Status:** Accepted  

## Context

`executor.primitives.bootstrap` returned `capabilities: { total: 91, byType: { skill: 44, ... } }` — counts only. An agent waking up knew numbers existed but not what they were or when to reach for them. The 38 MCP tools in `tool_artifacts` (SurrealDB) were completely invisible (`mcp: 0`). Static documentation couldn't stay in sync as tools were added or removed. The substrate existed; nothing queried it.

## Decision

Bootstrap assembles its `capabilities` field dynamically at call time from two live sources in parallel:

1. `tool_artifacts` table in SurrealDB `stack/catalog` — all registered MCP tools with path + description
2. `executor.primitives.discover()` — filesystem primitives (skills, commands, rules, subagents, hooks)

MCP tools are grouped by intent (`SESSION`, `MEMORY`, `WORK`, `CONTEXT`, `MULTI_AGENT`) via a static mapping in `executor-tools.ts`. Unmapped tools fall into their namespace prefix group by default. The grouping map is the only thing that requires a code change when a new tool doesn't fit an existing bucket.

## Consequences

**Easier:** Agent waking up from bootstrap knows exactly what the gateway provides — grouped by when to reach for it, with descriptions. Adding a new MCP source and reconnecting it reflects in the next bootstrap call automatically. Zero manual doc sync.

**Harder:** Bootstrap now makes four parallel async calls instead of three. SurrealDB must be reachable from the executor process (it is — HTTP API on same host). The intent grouping map in executor-tools.ts must be updated when new namespaces are added.

**Implementation:** `queryToolArtifacts()` + `groupByIntent()` + `INTENT_MAP` added to `~/executor/packages/control-plane/src/runtime/executor-tools.ts`. `Promise.allSettled` extended to four branches. Each branch degrades gracefully if it fails.

## Alternatives Rejected

| Alternative | Why rejected |
|---|---|
| Static manifest in AGENTS.md | Drifts immediately. Already proven by this session. |
| Separate discovery call after bootstrap | Friction agents skip when already in motion. |
| Counts only (previous behavior) | Tells agent nothing actionable. |
