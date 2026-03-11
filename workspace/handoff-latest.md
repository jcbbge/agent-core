# Session Handoff
Date: 2026-03-10
Mode: meta/systems

## Completed

- **Fixed Claude Code MCP configuration** — All three MCPs (anima, kotadb, dev-brain) were failing in Claude Code because `~/.claude.json` used stdio transport with wrong/dead ports (8000, 7201, 7102). Changed to HTTP transport pointing to already-running servers (3098, 3099, 3097). MCPs now discoverable and accessible.

## Diagnosis

Root cause: Infrastructure had migrated to HTTP-based MCPs on ports 3098/3099/3097, with unified SurrealDB at 8002, and Ollama at 8001. But Claude Code config was stale — trying to spawn stdio processes with hardcoded dead ports. Other harnesses (OpenCode, etc.) were using correct HTTP config because they reference the source MCPs directly.

## Decisions captured

- None this session (configuration fix, not architectural)

## Agent-core state

- 39+ skills deployed
- 6 ADRs (unchanged from previous session)
- Stack: SurrealDB unified at 8002, 3 HTTP MCPs + auggie + HubSpot (auggie/HubSpot status TBD — not tested this session)

## Open items

1. **auggie and HubSpotDev in Claude Code** — Still configured as stdio in `.claude.json`. Verify if they work or if they also need HTTP transport fixes.
2. **Cross-harness identity deployment** — From ADR-006 context, still pending

## Next session focus

Verify auggie and HubSpot work in Claude Code, or determine if they need similar HTTP transport fixes. If working, then turn focus to cross-harness identity deployment.
