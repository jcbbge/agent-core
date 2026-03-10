# NEXTSTEPS — Cross-Harness Identity Architecture

## The Challenge

Identity and persona instructions for the LLM cannot live in a single SYSTEM.md or AGENTS.md file because Josh operates across **multiple CLI harnesses** with different loading mechanisms and varying capabilities:

- **omp** (Oh My Pi) — Custom system, loads from ~/.omp/agent/
- **Claude Code** — Loads from .claude/, ~/.claude/, CLAUDE.md
- **OpenCode** — Different discovery, different config format
- **Future harnesses** — Unknown formats, unknown capabilities

Each harness has different "jump drive" capabilities — some may load SYSTEM.md, some may ignore it, some use entirely different mechanisms.

## The Constraints

1. **No universal config format** — Each harness is different
2. **No guarantee of file loading** — SYSTEM.md/AGENTS.md support varies
3. **Session initiation is through harness 'agent'** — Not subagents, not specific agent instances
4. **Primitives must be harness-agnostic** — Defined in agent-core, deployed per-harness
5. **Identity must persist across model switches** — Provider/model agnostic

## The Goal

Design a **harness-agnostic identity layer** that:
- Survives model/provider switches
- Works even when harness doesn't load config files
- Can be injected at session start regardless of entry point
- Lives in agent-core (canonical source) but deploys to each harness

## Approaches to Evaluate

### Option A: MCP Server Identity Provider
Build an MCP server that serves identity context. All harnesses with MCP support can query it. Falls back gracefully if MCP unavailable.

### Option B: Environment Variable Injection
Identity compressed into env vars (e.g., `PI_IDENTITY_B64`). Harness-agnostic, survives all sessions, no file loading required.

### Option C: Prompt Injection Hook  
Custom hook/extension that prepends identity to first user message. Works on any harness that supports hooks/extensions.

### Option D: Multi-Format Deployment
Maintain identity in agent-core, deploy to each harness in its native format (SYSTEM.md for omp, custom instructions for Claude Code, etc.)

### Option E: SurrealDB Context Window
Store identity in SurrealDB (already running). Agent queries it at session start via tool call.

## Critical Questions

1. Which harnesses support which injection methods?
2. Can we detect which harness is running from within the session?
3. What's the fallback when no injection method works?
4. How do we version identity across harnesses?
5. Should identity be compressed/one-shot or expanded/contextual?

## Immediate Actions

- [ ] Audit current harness configs in `harnesses/` for identity loading capabilities
- [ ] Document per-harness "jump drive" capabilities (what can each load?)
- [ ] Prototype Option A (MCP) — test with omp, see if Claude Code supports it
- [ ] Design identity compression format (dense vs. structured vs. hierarchical)

## Related

- `harnesses/` — Per-harness configs
- `primitives/` — Skills, hooks, MCP configs
- `stack.yaml` — MCP servers, daemons, ports
- `docs/` — Reference docs on harness protocols

---

**Added**: 2026-03-10  
**Context**: Created ~/AGENTS.md and ~/CLAUDE.md for home directory, but this is insufficient for cross-harness identity. Need harness-agnostic solution.
