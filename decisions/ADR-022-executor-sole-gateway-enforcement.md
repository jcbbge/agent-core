# ADR-022: Executor is the Sole Harness-Registered MCP

**Date:** 2026-04-03  
**Status:** Accepted  

## Context

Multiple MCP servers (anima, devbrain, kotadb, subagent-mcp) were registered directly in harness configs (slate.json, opencode.json, AGENTS.md tables, skill files). This created divergence — code evolved, registrations stayed stale. An instance reading any of these would get different, contradictory routing instructions. The opencode session-lifecycle plugin called anima directly at port 3098. The pi extension had been updated to route through executor but documentation still said direct.

## Decision

Executor (port 8000) is the **only** MCP registered in any harness config. All other services are internal brain-layer sources accessed exclusively through executor's `tools["namespace.*"]` interface. Direct registration of anima, devbrain, kotadb, or subagent-mcp in any harness config is forbidden.

## Consequences

**Easier:** Single point of truth. Adding a new brain-layer service requires registering it with executor once — not updating N harness configs. Harness configs stay stable as the tool catalog grows.

**Harder:** Executor must be healthy for any tool access. No fallback path to reach anima directly if executor is down. The restart procedure (`launchctl load dev.brain.executor.plist`) must be known and documented.

**Enforced in:** slate.json, opencode.json, opencode/plugins/session-lifecycle.ts, all AGENTS.md files, registry.json (gateway_policy field added), schema/rules/infrastructure.md, harness docs.

## Alternatives Rejected

| Alternative | Why rejected |
|---|---|
| Keep direct registrations as fallback | Defeats the consistency guarantee. Two paths = drift. |
| Per-harness gateway config | Same problem at harness level. |
