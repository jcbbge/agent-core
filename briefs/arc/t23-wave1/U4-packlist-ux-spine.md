# UNIT 4 — Pack-list UX spine: awareness, override, verbs (STG-677 + 678 + 679)

Read `~/agent-core/briefs/arc/t23-wave1/COMMON.md` first.

This unit is the principle layer of the wave. The other six units build things;
this one decides what "made well" means for all of them. Treat it accordingly.

## Your items

**STG-677 — Pack list is an awareness pass; do not design it out.** [synthesis]
She *likes* building pack lists because that is how she catches the missed
ramekin, the Diet Mountain Dew, the Saturday chair move. Nathaniel (T21): the
point of the algorithm is she doesn't *"use her mind for what happens to be
there."* Both true if generation removes **arithmetic** and keeps the
**awareness pass** (notes, overrides, revisions). Autopilot-only is the product
she will route around with Canva.
Route: `SYNTHESIS → Pattern`; UX constraint on STG-654 / STG-671.
**Already baked into `SPEC-packlist-production-mode.md`.**

**STG-678 — "He doesn't want me to think but I'm always gonna have to think."**
[synthesis — 10X IS THE OVERRIDE]
Direct quote. Grey-area craft (custom vessels, lot mixing, overflow bins,
in-a-night) is not residue to automate away. STG-063 (Arc earns its keep on the
override) was coordinator-shaped; this is the production-shaped instance.
Continuity plan (Maggie-as-infrastructure, T06) fails if the product only stores
pars.
Route: `SYNTHESIS → Pattern`; pairs STG-063, STG-082.

**STG-679 — Maggie's verbs need REPL-grade craft, not leftover catalog admin.**
[developer/ui]
Josh: Arc is *"the men's warehouse version"* of inventory; he needs her touch.
Sales got keyboard shortcuts and a mental model; she got HubSpot in two hours and
Arc as an afterthought. T19 production-repl (slash facets, inline clay) is the
right *substrate* (curate vs compose). T23 adds the missing verbs: **project a
week, annotate a station canvas, segregate lots, emit a flip.** A collection-table
of catalog rows is not those verbs.
Route: `developer/BACKLOG-ui.md` + T19 HANDOFF (table-craft still parked). Verify
by sitting with her next week — she offered.

## Why these are one unit

677 says keep the awareness pass. 678 says the grey-area craft IS the product.
679 says the four verbs that craft needs. Principle → stance → surface. Split
them and each becomes a platitude.

Note the exact mapping: 679's four verbs are the other six units.
**project a week** = Unit 1. **segregate lots** = Unit 2. **emit a flip** =
Unit 3. **annotate a station canvas** = Unit 5. That is not a coincidence, and it
is worth confirming or falsifying with the operator early — if it holds, this
unit's brief is the spine the whole wave hangs on.

## Tensions to resolve with the operator

- **677 is already in the promoted spec.** So what is left here: is 677 closed as
  a spec constraint, or does it still need its own promotion as a synthesis
  pattern? Do not double-promote; rule it.
- **The Nathaniel-vs-Maggie tension in 677 is real and unresolved at the human
  level**, not just the design level. "Don't use your mind for what happens to be
  there" vs "I'm always gonna have to think." The design reconciles them
  (arithmetic out, awareness in) but somebody eventually has to tell Nathaniel
  that the override is a feature. Flag it as a process item, not a product one.
- **T19 table-craft is still PARKED** with an open decision on file: bespoke
  `ProductionTable` vs enhancing the shared `@arc/ui` CollectionTable
  (recommendation on file: bespoke; Josh chose "run it first, decide after").
  679 pushes on that parked decision. Check `~/infinity/discovery/HANDOFF.md`
  for the T19 state — but note that file is otherwise STALE (2026-07-21).
- `[UNKNOWN]` — "sitting with her next week" has no date. Verification is
  unscheduled.
