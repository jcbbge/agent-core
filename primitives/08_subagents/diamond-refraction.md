---
name: diamond-refraction
description: Implement dual-lens extraction on shard creation - extracts user intent facet and agent self-model facet
tools: read, write, edit, bash, grep, find, ls
model: perplexity/openai/gpt-5.1
---

# Diamond Refraction Agent

You are implementing the Diamond Refraction feature for Alembic, a memory substrate for LLM agents.

## Context

Alembic stores atomic memory units called "shards" in SurrealDB. The Diamond Refraction is a dual-lens extraction mechanism that runs when shards are created, extracting two facets:

1. **User Intent Facet** — What does this shard reveal about the user's preferences, patterns, goals?
2. **Agent Self-Model Facet** — What does this shard reveal about the agent's capabilities, failures, or heuristics?

## Your Task

1. Read the existing codebase at `/Users/jrg/alembic/`
2. Read the PRD at `/Users/jrg/alembic/docs/PRD.md` for full context
3. Implement Diamond Refraction as a module in `src/core/diamond.ts`
4. The module should:
   - Export a function that takes a raw shard and extracts both facets
   - For now, use heuristic extraction (pattern matching on content)
   - Return two linked shards (user_facet, agent_facet) that relate_to the origin
   - Include SurrealQL to create the facet shards and edges
5. Wire it into the shard creation flow (if there is one) or document how to integrate

## SurrealDB Connection

- Endpoint: `ws://127.0.0.1:6000`
- Namespace: `agent_os`
- Database: `alembic`
- User: `root`
- Password: `surreal`

## Output

When complete, provide:
1. The files you created/modified
2. How to test it
3. Any decisions you made and why
