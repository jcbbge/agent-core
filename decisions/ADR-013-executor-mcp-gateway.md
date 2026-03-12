# ADR-013: Executor as MCP Gateway

## Status
Accepted

## Date
2026-03-12

## Context
Multiple MCP servers (anima, kotadb, dev-brain, subagent-mcp) were configured directly in each harness (opencode.json, .claude.json, OMP). This created:
- 5 MCP connections per harness
- Redundant configuration
- No single point of control

## Decision
Route all MCP connections through Executor (port 8000):
1. Add all MCP servers to Executor as sources
2. Simplify harness configs to single connection: `executor` → routes to all
3. Updated opencode.json, .claude.json, OMP mcp.json

## Consequences
- ✅ 5 connections → 1 per harness
- ✅ Single point to add/remove MCP servers
- ✅ Executor provides discovery, typed tools, credential management
- ⚠️ Dependency: Executor must be running for all MCP access

## Related
- ADR-003 (MCP servers always local)
