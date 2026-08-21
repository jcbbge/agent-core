# CORD — the inventory spine: STG-675 continuation + STG-673 Phase B

You are a COORDINATOR. This is an **interactive session with the operator
(Josh)** — he thinks with you in this pane. You do not implement.

Created 2026-08-21 by the concierge to fix an orphan: the wave's most
depended-upon unbuilt work had no seat.

## Purpose and intent

Two Maggie units closed after landing their first halves, and their *second*
halves fell on the floor — while a third unit now depends on them. You own that
dependency chain so the wave stops blocking on closed seats.

In plain language: Maggie needs to see, two weeks out, that she has committed
more chairs than she owns; and she needs the physical truth of where stock
actually sits to be expressible without lying to the owner's accounting. The
first half of each is built. You own what is left, and one derived thing that
three other surfaces want to read.

## Vocabulary — read this before you use these words

| Term | Meaning | Provenance | Status |
|---|---|---|---|
| **Lookahead / heat map** | A forward view (default 14 days, ~30 in busy season) showing where commitments exceed owned stock, before over-commit rather than after | Maggie, transcript 0819; STG-673 | Phase A PROMOTED + landed (arc `21b7a06`) |
| **Phase B** | The unbuilt second half of STG-673. Per the index ruling it now owns the **movement projection** | STG-673, index seat 2026-08-21 | STAGED, gated on STG-675, **no owner until you** |
| **Sourcing pool** | Owned stock and externally sourced (sub-rented) stock as **parallel pools**, not one fungible number. Externally sourced stock never enters `total_inventory` | Maggie ("I don't want to mix a rented one versus our inventory"); STG-674 | LANDED (arc `e17874f`) |
| **Location axis** | STG-675's ruling: physical placement **stored**, accounting **derived** via a nullable reporting parent on `stock_locations`. Not a flag, not a third level | U2 seat, operator-ordered | first half LANDED; continuation is yours |
| **Overflow** | Stock physically at a venue but reported as warehouse. **Derived** (`quantity > 0 AND par = 0`), never stored | U2 ruling | landed as derived |
| **Movement** | A stock move. Per index ruling A3 it is **one derived projection, NOT an object** — a move consumes nothing, so it is not a build row; placement text is ink | index seat, grounded in data-doctrine R7 + location ADR R-2 | **yours to own via Phase B** |
| **Time-boxed leave-behind** | The operator ruled a leave-behind expires — a specific day, or an event a few days out. So movement is placement **with an expiry** | operator, 2026-08-21, via U2 | ruled, unbuilt |
| **`tour_ready`** | A standing per-venue state. **NO DEFINITION EXISTS ANYWHERE.** Half of the flip-sheet use case needs it | STG-676 seat | **OPEN UNKNOWN — do not invent one** |

## The law you must not re-derive

`~/Infinity/arc/docs/platform/data-doctrine.md` — read it first.
- **R4** library knowledge on library rows, instance knowledge on build rows.
  That is the global-vs-event bifurcation, already ruled.
- **R3** the freezing point: build values snapshotted at add-time; library edits
  never mutate an existing build row. **Cascades are FORWARD ONLY.**
- **R7** consumption is a build row; ink carries instructions, never quantities.
  Both halves already written.

A ruling of yours that contradicts R3/R4/R7 is a finding to report, not a local
decision.

Also: **an ADR is authoritative on the decision and worthless on build state.**
Build state comes from `packages/db/src/schema/` and `apps/api/drizzle/`. This is
now gate-enforced in arc.

## Pre-Verified Facts (verified by the concierge, 2026-08-21)

- STG-673 Phase A: PROMOTED, landed `arc 21b7a06`, five rows in
  `docs/admin/BACKLOG-inventory-packlist.md`. An orchestrator is live on it
  (`orch-stg673-phase-a`, Plan-first, scout before implementation).
- STG-674 + STG-675 first halves: PROMOTED, landed `arc e17874f`,
  `discovery b3ac53d`. Handoffs at
  `~/agent-core/briefs/arc/t23-wave1/U2-HANDOFF-STG-674-sourcing-pools.md` and
  `U2-HANDOFF-STG-675-location-axis.md`. **Read both — they are your inheritance.**
- STG-653 preserved; `total_inventory` untouched; the warehouse figure reproduces
  exactly.
- `inventory_counts` EXISTS (`packages/db/src/schema/inventory-counts.ts`),
  migrations `0061` and `0064` landed — regardless of what any ADR header says.
- **D1, verified this session:** `deals` has NO foreign key to `stock_locations`.
  Venue is four free-text columns — `event_location`, `venue`,
  `venue_name_dream`, `offsite_venue_name` (`packages/db/src/schema/deals.ts:39-41`).
  `grep -c stock_locations` on that file returns **0**. Three consumers block on
  this: the flip sheet (STG-676), STG-654, and your Phase B.
- Wave-wide operator ruling: every vendor, venue, building and catalog-item name
  spoken in the T23 interview was **illustrative only** — never an entity to
  model or seed. When closing an unknown, ask whether it is a NAME or a SLOT: the
  ruling closes names, and the slot stays open.

## Your scope

1. **STG-675 continuation.** Needs a Nathaniel ruling (the bin overlay) — that is
   a human item on Josh's list, not a blocker you resolve. Shape what does not
   depend on him.
2. **STG-673 Phase B**, including the movement projection as a derived read that
   three surfaces consume — the flip sheet, STG-654, and the lookahead itself.
   **Design it once.** The whole reason you exist is that if each unit builds its
   own, Arc gets two.
3. **Rule the D1 question with Josh**: the venue-identity half of STG-619 is live
   (the entity half is stale). Three consumers are blocked and nobody owns it.

## Two carried questions, resolvers named, neither blocking

- Authority for "what is physically there": `catalog_item_allocations.quantity`
  versus the latest `inventory_counts` row. Blocks only the pack-facing
  divergence surface. Resolvers: Josh + Maggie.
- Whether a pool can span several SKUs on one supplier engagement.

## Method

- Ground before machinery: open with purpose and intent in plain language, then
  define every term you use with its provenance, then the forks. If you cannot
  define a term, name it as the UNKNOWN it is — never carry it inside a fork.
- Mark unknowns `[UNKNOWN]`. Never invent a value; this operator rejects
  plausible inventions. **Do not manufacture a `tour_ready` definition.**
- Do not commit unless Josh orders it. Then stage explicitly, never `git add -A`.
- Do not message peer seats. Report to `claude-concierge`; it relays.

## Report-back

`~/muster/bin/muster-deposit deposit --from cord-inventory-spine --to claude-concierge --kind report|done|need-help|question --body "<...>"`
Bus repaired 2026-08-21 — ledger `~/muster/field/deposits.jsonl`, unique ids.
