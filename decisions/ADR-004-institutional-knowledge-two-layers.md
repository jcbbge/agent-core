# ADR-004: Institutional Knowledge Has Two Layers — Anima (Resonance) and Decisions/ (ADRs)

**Date:** 2026-03-09
**Status:** Accepted

## Context

High-quality design thinking, architectural friction, and strategic decisions are being generated constantly in sessions like this one. This knowledge is extremely valuable but was being lost — buried in chat transcripts, never formalized, never queryable by agents or humans in future sessions. The question: "How do we bottle this up? Where does it go?"

Two distinct types of knowledge were being conflated:
1. Experiential/resonance: *why something felt important, the friction that led to a realization*
2. Structural/decisions: *what was decided, why, what alternatives were rejected*

## Decision

**Resonance layer → anima** with `resonance_phi: 3.0–4.0`. The felt sense of why a decision mattered. The experiential texture of working through a problem. This is what anima was built for — persistence across discontinuity.

**Decision layer → `_agents/decisions/`** as ADR-format markdown files. One file per significant architectural decision. Indexed by number (ADR-001, ADR-002...). Also synced to SurrealDB `decisions` table for agent querying.

**Workflow:** Not manual. The `/ending-session` command crystallizes the session's decisions into ADRs and stores resonance insights to anima. The journal writes itself as a byproduct of session hygiene.

## Consequences

- Every session generates queryable institutional knowledge
- Agents can ask "what was decided about X?" and get a structured answer from SurrealDB
- `brain-infrastructure.md` and `future_updates_for_agentcoreStack.md` become redundant — ADRs replace them
- The `/ending-session` skill needs to be updated to include ADR crystallization
- The ADR format needs a `Resonance` section to bridge the two layers

## Alternatives Rejected

| Alternative | Why rejected |
|---|---|
| Everything in anima | Anima is personal/experiential, not structured. Good for "why it mattered," not "what was decided." |
| Everything in dev-brain | dev-brain is operational (current state, todos). Not the right temporal scope for architectural history. |
| CHANGELOG.md | Linear, append-only, not queryable by agents, good for release notes not design decisions |
| Manual journal file | Requires discipline to maintain, never happens at 11pm when decisions are made |

## Resonance

The realization: the most valuable thing that happens in a session isn't the code written — it's the design thinking that produced the code. Without capture, every session starts from scratch. With it, each session builds on the last. The institutional knowledge accumulates. The system gets smarter over time not just because the agent is better, but because the decisions it can access are richer.
