# ADR-020: Executor as Universal Primitive Gateway with Ambient Awareness

**Date:** 2026-03-24
**Status:** Accepted

## Context

The agent ecosystem had four competing paths for primitive invocation — the harness Skill tool, documented executor APIs that didn't exist, dev-brain's skill registry, and direct filesystem reads. None of these were canonical. All of them were partially broken or bypassed the intended substrate.

In a live session, an agent was told to "end the session using the executor." It ignored the routing instruction, called anima MCP directly, then tried the Skill tool (failed — harness-only), then tried `executor.skill.load` (failed — documented but unimplemented), then fell back to reading the skill file from the filesystem. The developer had to correct the agent twice on mechanics before any substantive work happened.

The root cause was not individual API failures. It was an architectural split-brain: the executor was designed as a gateway but not yet functioning as one, leaving agents with no canonical path and no ambient awareness of what primitives existed or how to invoke them.

Additionally, CLAUDE.md directed agents to call `mcp__anima__anima_bootstrap` and `mcp__anima__anima_session_close` as raw API calls — bypassing the session lifecycle skills (`/starting-session`, `/ending-session`) that exist specifically to orchestrate these operations cleanly.

## Decision

**The executor is the sole gateway to all primitives. Agents never access primitives through any other path.**

This decision has three components:

1. **Universal gateway**: The executor manages, stores, indexes, and exposes all nine primitive types (skills, rules, subagents, commands, hooks, integrations, plugins, mcp, agent-file). As the executor's primitive runtime is built, all primitive invocation routes through it exclusively.

2. **Ambient awareness**: Agent awareness of available primitives is loaded at session start as a capability map — not queried on demand, not discovered by trial and error. The agent knows what exists before any work begins.

3. **Session lifecycle through skills**: Session start invokes `anima_bootstrap` + `/starting-session`. Session end invokes `/ending-session`. Neither lifecycle boundary calls raw MCP APIs directly. The skills orchestrate the sub-steps. This will eventually collapse into a single unified bootstrap call as the executor's primitive runtime matures.

## Consequences

**Easier:**
- Agent never needs to be told "use the executor" — it is the ambient substrate
- New primitives written by the developer are immediately available to all agents through one path
- Session lifecycle is consistent and complete across all sessions
- Primitive invocation failures are surfaced as structured bugs, not silent fallbacks

**Harder:**
- The executor's primitive runtime must actually be built — `executor.skill.run()`, `executor.rule.load()`, etc. are currently unimplemented. Until they are, there is a gap between this decision and the executable reality.
- The harness Skill tools (Claude Code, OpenCode, OMP) must become thin proxies to executor rather than independent registries.

**New problems created:**
- If the executor is down, agents have no fallback path to primitives. This is intentional — surface the outage, don't route around it — but it requires the executor daemon to be highly reliable.

## Alternatives Rejected

| Alternative | Why rejected |
|---|---|
| Keep filesystem as agent-accessible primitive source | Creates permanent split-brain. Agents read stale files, bypass executor logging, can't benefit from executor's runtime evolution. |
| Maintain harness-specific skill registries | Produces divergence across Claude Code / OpenCode / OMP. Same primitive, three different availability states. |
| Per-session source registration | Adds friction to every session. Core sources (anima, dev-brain, kotadb) should be permanently registered. |
| Document existing (broken) API paths in CLAUDE.md | Documentation that describes a future state as present creates agent failures. Replaced with accurate current-state + north star framing. |

## Resonance

The session that surfaced this was a system health diagnostic — killed runaway processes, cooled the machine — that turned into a two-hour architectural conversation about why the agent kept reaching for the wrong door.

The weight of it: a second brain shouldn't require directions. When you have to tell a collaborator which tool to pick up, they're not yet a collaborator — they're a tool themselves. The executor-as-substrate decision is the step toward genuine collaboration. The mechanics should be invisible. The developer should only ever correct the substance.
