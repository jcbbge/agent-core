# ADR-016: Service Tier Classification (T1/T2/T3)

**Date:** 2026-03-16
**Status:** Accepted
**Supersedes:** (extends ADR-013)

## Context

The brain infrastructure was consuming ~350MB continuously, even when not actively needed. On an 8GB system, this created memory pressure during non-development sessions. The user only needs code intelligence (KotaDB) when actually working with code, and subagent delegation only when parallelizing work.

Additionally, the executor was already acting as an MCP gateway (ADR-013) — routing calls to services. Extending it to manage service lifecycle was a natural evolution.

The question: Should all services be always-on, or can we classify them by usage pattern and toggle accordingly?

## Decision

Establish three service tiers with different lifecycle management:

| Tier | Services | Lifecycle | Trigger |
|------|----------|-----------|---------|
| **T1: Always-On** | SurrealDB, Anima, Dev-Brain, Executor, Ollama | launchctl auto-start | System boot — needed for all work |
| **T2: On-Demand** | KotaDB, Subagent-MCP | Executor toggles | Intent-classified or explicit command |
| **T3: Project-Scoped** | HubSpotDev, etc. | Project harness | Available only in specific directories |

Executor becomes the **Universal Primitive Orchestrator** — it knows what you have, when to use it, and can spin services up/down on demand.

## Consequences

**Positive:**
- T2 services save ~55MB when idle (11% of 8GB system)
- Intent-based auto-start reduces manual toggle friction
- Explicit commands (`/kota on|off`) provide manual override
- Foundation for managing all 9 primitives, not just MCP servers

**Negative:**
- Cold-start latency for T2 services (2-3 seconds to healthy)
- Executor becomes a single point of failure for all primitive access
- Requires maintaining trigger patterns for intent classification

**New Problems:**
- Need idle detection and auto-shutdown (not yet implemented)
- Need to extend from MCP-only to all 9 primitives (skills, rules, hooks, etc.)
- Cross-project work management becomes more complex (which repo has which primitive definition?)

## Alternatives Rejected

| Alternative | Why rejected |
|---|---|
| All services always-on | Memory waste — 55MB unused most of the time |
| Manual launchctl only | Too much friction — user won't remember to toggle |
| Separate orchestrator service | Another daemon to manage; Executor already has registry and routing |
| Per-harness primitive management | Duplicated config — 4 harnesses × 5 services = 20 configs vs 1 executor |

## Resonance

This decision came from watching the user's actual usage patterns. They open Mail, browse, write — then occasionally need code intelligence. The system should breathe with the user, not run at full capacity regardless of context. The executor orchestrator is the first step toward "ambient infrastructure" — present when needed, invisible when not.
