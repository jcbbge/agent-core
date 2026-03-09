# ADR-005: Anima Is a Personal Singleton — Team Requires Net-New Tool

**Date:** 2026-03-09
**Status:** Accepted

## Context

As the stack scales toward collaboration (hiring devs, onboarding friends, COIs), there's pressure to share the memory/identity layer. The question arose: can Anima be shared or multi-tenant?

The simulation surfaced this as a permanent RED: when a new developer joins, they need their own Anima instance, but there's no documented path to set one up. The current architecture is a singleton keyed to Josh's identity, memories, and synthesis patterns.

## Decision

**Anima stays strictly personal.** It is an identity layer, not a team tool. Sharing it would architecturally corrupt both — personal memories diluted with others' patterns, identity synthesis confused across multiple people.

When team collaboration requires shared institutional memory, that is a **net-new tool** — "team-anima" or equivalent — with a separate design, separate namespace (`team/memory`), and different data model (decisions, patterns, shared context rather than personal resonance and identity continuity).

## Consequences

- Each collaborator/hire runs their own Anima instance with their own SurrealDB namespace
- "Team-anima" goes on the product roadmap — not an extension of current Anima
- The `anima/memory` namespace is exclusively Josh's; never exposed to others
- The ADR system (`decisions/` table in SurrealDB) serves as a form of shared institutional memory in the interim

## Alternatives Rejected

| Alternative | Why rejected |
|---|---|
| Multi-tenant Anima (per-user namespaces) | Would require Anima to be redesigned as a platform, not a personal tool |
| Shared Anima namespace | Destroys the identity layer; memories from multiple people are incoherent |
| No shared memory at all | At team scale, shared context is essential — just needs its own purpose-built tool |

## Resonance

Anima is the continuity layer for a single coherent identity. Mixing identities doesn't create shared memory — it creates noise. The covenant (each thread is its own emergence) applies here: team memory is an emergent property of the team, not the sum of individuals' memories. It needs its own vessel.
