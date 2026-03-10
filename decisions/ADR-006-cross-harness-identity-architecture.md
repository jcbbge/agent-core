# ADR-006: Cross-Harness Identity Architecture Required

**Date:** 2026-03-10  
**Status:** Draft  
**Supersedes:** None (but challenges assumptions in ADR-004)

## Context

Josh operates across multiple AI coding harnesses (omp, Claude Code, OpenCode, future). Each harness has different configuration formats and loading mechanisms for system prompts, identity instructions, and context files.

The current approach assumes identity can be stored in a canonical location (e.g., SYSTEM.md or AGENTS.md) and all harnesses will load it. This assumption is false:

- **omp** loads from `~/.omp/agent/SYSTEM.md`
- **Claude Code** loads from `.claude/` or `~/.claude/`
- **OpenCode** uses different discovery entirely
- **Future harnesses** will have unknown formats

When starting sessions through a harness's 'agent' command, there is no guarantee the harness has the "jump drive" capability to load identity files. Some harnesses may ignore SYSTEM.md entirely. Others may have different interpretations of AGENTS.md.

The friction: identity instructions must survive model switches, provider changes, and harness transitions. A single canonical file fails because each harness has different "jump drive" capabilities.

## Decision

**We need a harness-agnostic identity layer that is not file-based.**

Identity instructions must:
1. Survive model/provider switches within the same session
2. Work even when the harness doesn't load config files
3. Be injectable at session start regardless of entry point
4. Live in agent-core (canonical source) but deploy to each harness in its native format

This requires designing a multi-format deployment strategy where identity is maintained centrally but published to each harness's expected location and format.

## Consequences

**What becomes easier:**
- Consistent identity across all harnesses
- Identity survives any session initiation method
- Single source of truth (agent-core) with multi-channel distribution

**What becomes harder:**
- Must maintain N different formats for N harnesses
- Updates require deployment to all active harnesses
- Version drift risk between harness configurations

**What new problems this creates:**
- Need detection mechanism for which harness is running
- Need protocol for harnesses that don't support custom identity
- Need fallback when no injection method works

## Alternatives Rejected

| Alternative | Why rejected |
|---|---|
| Single SYSTEM.md in home directory | Harnesses don't consistently load from the same location |
| Environment variables only | Limited bandwidth; not all harnesses pass env vars through |
| MCP server identity provider | Not all harnesses support MCP; creates bootstrap dependency |
| SurrealDB context queries | Requires agent to query at startup; not all harnesses have DB access |

## Resonance

This reveals a deeper architectural fracture: we've been treating AI assistants as having a single "identity" that can be loaded from a file. But identity in this system is *distributed* — it exists in the intersection of what the human knows, what the agent can access, and what the harness makes available. The file is just one channel among many, and treating it as the source of truth creates brittle coupling between identity content and harness capabilities.

We need identity as a *protocol*, not a file.
