# ADR-003: MCP Servers Always Stay Local (Never Cloud)

**Date:** 2026-03-09
**Status:** Accepted

## Context

As the stack scales, there's pressure to move services to the cloud for persistence, team sharing, and always-on availability. The question arose specifically about whether MCP servers (anima, kotadb, dev-brain) should move to a VPS alongside SurrealDB.

## Decision

MCP servers **always stay local**. No exceptions. SurrealDB and the synthesis worker are valid cloud candidates. MCP servers are not.

The reason is latency math. Every tool call in an agentic loop is one round trip to the MCP server. At 100ms RTT (cloud), a 20-tool agentic session accumulates 2 seconds of pure overhead. At 20ms RTT (fast VPS), it's still 400ms. Local tool calls are <1ms. The interactive feel of the agent stack depends on this.

## Consequences

- MCP servers require the local machine to be running — no "always on" for those tools
- Cloud migration path: SurrealDB + synthesis worker go cloud first; MCP servers never follow
- Team collaboration: each team member runs their own local MCP servers; shared state lives in a cloud SurrealDB
- Offline travel: MCP servers work; they just connect to local SurrealDB instead of cloud

## Alternatives Rejected

| Alternative | Why rejected |
|---|---|
| Cloud MCP servers behind VPN (Tailscale) | Latency still compounds in agentic loops; 20ms × 20 calls = 400ms per session |
| Cloud MCP servers for non-interactive tools | Tooling complexity, inconsistent behavior, single-machine failure |

## Resonance

Latency compounds. It's not just one slow call — it's every call in every loop, every session, every day. The milliseconds that feel invisible in isolation become seconds that feel broken in practice.
