# UNIT 7 — Boundary: Arc must not become Dispatch-2 (STG-682)

Read `~/agent-core/briefs/arc/t23-wave1/COMMON.md` first.

## Your item

**STG-682 — Arc must not become Dispatch-2; she kept her venue-shaped system on
purpose.** [integrations / process]
Nathaniel wants everything streamlined through Mimi's dispatch. Maggie: dispatch
makes sense for offsites, not for setting Infinity venues — *"it wasn't broken."*
She still uses her own schedule/pack overview. STG-663 already keeps delivery
times out of Arc. This entry keeps **venue pack / in-a-night / lookahead** in Arc
(or her sheet) rather than forcing them through an offsite-shaped app.
Route: record as boundary; sibling to STG-663. **Do not "fold dispatch in" as the
Maggie 10X.**

## Why this is its own unit

It is a constraint, not a feature — and it governs the other six. Units 1, 3 and
4 all propose surfaces that an "everything through dispatch" posture would
relocate out of Arc entirely. This unit's job is to make that boundary explicit
and durable enough that a future orchestrator cannot accidentally violate it.

The deliverable here is probably not a build brief. It may be a recorded boundary
plus a decision doc. Rule that with the operator early rather than manufacturing
an implementation.

## Tensions to resolve with the operator

- **This is an owner-versus-operator disagreement, not a design gap.** Nathaniel
  wants consolidation through Mimi's dispatch; Maggie deliberately kept her own
  system because it was not broken. Arc's job is to be honest about which
  workflows are venue-shaped and which are offsite-shaped. Do not write a brief
  that pretends the disagreement is settled.
- **Scope question, sharpened.** Where is the Arc / dispatch line, stated well
  enough to be testable? "Venue pack, in-a-night, lookahead stay in Arc;
  delivery/logistics goes to dispatch" is the current reading — check it against
  STG-663 and against Unit 3's flip sheet, which is venue-shaped by construction.
- **Governance.** If this is a boundary the other units must respect, it needs a
  home they can cite — a decision record, not a backlog line. Propose where.
- Note the related enablement item: **STG-648** (Galley GraphQL client SOP for
  Mimi's Claude to build dispatch's integration) was PROMOTED 2026-07-30. So
  dispatch is actively being built alongside. The boundary is live, not
  hypothetical.
- `[UNKNOWN]` — whether Nathaniel has been told this boundary is being drawn.
