# HANDOFF — STG-675: the location axis (physical vs accounting)

**Unit:** U2 inventory truth · **Seat:** cord-t23-inventory-truth
**Date:** 2026-08-21 · **Gate:** bounded per ADR `2026-08-20-imagine-before-promote`
**Operator rulings in this brief were given by Josh in session, 2026-08-21.**

---

## The problem, in one paragraph

Nathaniel wants the possession ledger: 1200 chairs, 1000 at the warehouse, 200
at a venue. Maggie physically cannot store 1000 at the warehouse — the building
is over capacity after the Dream merger with no added square footage — so 500
of them sit at a second building. On paper the company still holds 1200. On the
ground she has 500 / 500 / 200, and she carries the difference in her head.
Maggie, verbatim, on why the books say otherwise: *"that's how he wants it."*
The cost of that gap is a crew sent to a dock with no chairs on it.

## Scope ruling (the seam)

Accounting and physical are **two partitions of the same total, not two levels.**

| | Accounting (Nathaniel) | Physical (Maggie) |
|---|---|---|
| Question | what do we possess | where is it right now |
| Example | 1000 warehouse / 200 venue | 500 main / 500 second building / 200 venue |
| Volatility | changes on buy/sell | churns with available space |

**Ruling: physical is STORED, accounting is DERIVED.** Physical is the only
partition a human can verify by walking it; accounting is a presentation over
it. Storing it the other way round means the count walk targets locations that
do not physically exist.

**Scope: global/admin.** Locations and their holdings cascade to every event.
Event scope consumes this axis and never writes it.

This does **not** contradict STG-653. `catalog_items.total_inventory` is
untouched, and the warehouse figure Nathaniel reads is reproduced exactly by the
roll-up. There is no second warehouse par and no third level — a second axis on
the same level.

## Pre-verified facts (read from schema + migrations, 2026-08-21, NOT from ADRs)

- `packages/db/src/schema/stock-locations.ts` — `stock_locations`
  (`id`, `name`, `count_cadence_days`, `write_id`, timestamps, `archived_at`).
  Live Electric plain mirror.
- Same file — `catalog_item_allocations` (`catalog_item_id`, `location_id`,
  `quantity` numeric(12,4), `par` numeric(12,4) NOT NULL DEFAULT '0',
  `sort_order`). Code comment states `UNIQUE(catalog_item_id, location_id)`.
- `packages/db/src/schema/catalog.ts` — `catalog_items.total_inventory`
  integer, nullable: *"Warehouse count for inventory-tracked items."*
- The unallocated remainder is **derived, never stored** (data-doctrine Q2).
  This is why an overflow allocation row today would silently reduce the
  warehouse figure from 1000 to 500.
- `packages/db/src/schema/inventory-counts.ts` — `inventory_counts` EXISTS,
  append-only (`catalog_item_id`, `location_id`, `quantity`, `counted_by`,
  `counted_at`). On-hand derived from the latest row per pair. Migration
  `apps/api/drizzle/0061_inventory_location_scope.sql`.
- `packages/db/src/schema/inventory-walk.ts` — `inventory_walk_tokens` /
  `inventory_walk_sessions`, keyed on `location_id`, server-only, must never
  receive an Electric ShapeDef. Migration `0064_inventory_walk_sessions.sql`.

**DOC-STATUS WARNING.** `docs/decisions/2026-08-12-inventory-location-scope.md`
still reads *"schema direction proposed below, not migrated in this PR"*. That
header is STALE — 0061 and 0064 landed and `inventory_counts` exists. Take build
state from `packages/db/src/schema/` and `apps/api/drizzle/`, never from an ADR
status header.

## In scope

1. A nullable self-referencing **reporting parent** on `stock_locations`. The
   overflow building is a real location whose accounting parent is the warehouse.
2. Allocation rows become **physically true** — they say where units actually
   are.
3. The accounting view is **computed** by rolling children into their parent.
   Nathaniel's 1000 is produced, not stored, and cannot drift.
4. Roll-up is the **default display**; expanding to children is available to
   anyone. Operator ruling: *"it doesn't matter for Nathaniel… he just needs the
   information available, high level at a glance."* This is a display default,
   **not a permission** — nothing is hidden and nothing is enforced.
5. Overflow is **derived** (`quantity > 0 AND par = 0`, or `quantity` materially
   over `par`), never stored as a flag. Derive-by-query over stored flags is
   standing discipline in this pipeline.
6. **Staleness is surfaced.** Any surface showing a physical quantity shows how
   old the reading is; `inventory_counts.counted_at` already carries it. A
   number with no date is the failure that sends a crew to an empty dock.

## Out of scope (named, not dropped)

- **Any move/transfer ledger, any future-dated or expiring placement, any
  multi-event view.** Placement is a state; movement is an event. Today
  `catalog_item_allocations.quantity` is overwritten in place, so a move leaves
  no trace and no future date can be queried. That is a **successor item**
  reported to the index seat — see `U2-FINDINGS-2026-08-21.md`. It depends on
  this brief; this brief does not depend on it.
- Shortage math, substitution, restock (STG-655 / STG-656).
- The pack-list algorithm itself (STG-654) — but see the collision below.

## Collisions and dependencies

- **STG-653** — consumed, not contradicted. Verify the roll-up reproduces
  Nathaniel's figure exactly before anything ships.
- **STG-654 (pack algorithm)** — the algorithm consumes **par** (*"venue par
  consumed first; only the shortfall travels"*). Reading par alone, overflow
  stock is invisible and nobody is sent to fetch it. This brief does not change
  the algorithm; it makes the divergence **legible** so pack and dispatch can
  raise a pickup task. Flag for whoever owns STG-654.
- **STG-673 (lookahead heat map, Unit 1)** and the flip sheet (STG-676) both
  read placement. They inherit this axis. Do not let either re-invent it.
- **STG-671 / `SPEC-packlist-production-mode.md`** — **Annotate is a locked
  term** (composition snapshot B + listing A). Nothing in this brief creates a
  second annotate gesture. If the divergence surface needs annotation semantics
  the spec does not cover, that is a finding to report, not a new primitive.

## Rejected alternatives

1. **A free-text overflow note on the allocation row.** No math, invisible to
   pack and dispatch, and the count walk still lies. Rejected.
2. **Keep allocations as the accounting split and add a separate physical
   placement table.** More machinery, and it makes physical truth second-class —
   count walks would target accounting locations nobody can stand in. Rejected;
   also note `inventory_walk_tokens` is keyed on `location_id`, so under the
   accepted design the overflow building becomes walkable for free and under
   this one it stays uncountable.
3. **Move the quantity and let the warehouse figure drop to 500.** True to the
   floor, contradicts the owner, and would be reverted by hand. Rejected.

## Done-when

- [ ] `stock_locations` carries a nullable reporting parent; a location may have
      at most one parent and cycles are impossible.
- [ ] For the worked example — total 1200, physical 500 / 500 / 200 — the
      accounting view renders 1000 / 200 / 1200 and `total_inventory` is
      unchanged at 1200.
- [ ] The count walk can be opened against the overflow building as a location
      in its own right.
- [ ] Overflow is produced by query; no `is_overflow` column exists anywhere.
- [ ] Every surface rendering a physical quantity renders its reading date.
- [ ] `docs/decisions/2026-08-12-inventory-location-scope.md`'s stale status
      header is corrected as part of this work.

## File partition an implementer would touch

- `packages/db/src/schema/stock-locations.ts` — the parent FK.
- `apps/api/drizzle/` — one new migration, additive and nullable, no backfill.
- `apps/api` — location rollup read path.
- `packages/sync` — if the parent column must reach the Electric shape.
- `docs/admin/BACKLOG-inventory-packlist.md` — the backlog entry.
- `docs/decisions/2026-08-12-inventory-location-scope.md` — status-header fix.

**Do not touch** `catalog_item_allocations` columns or its unique key. **Do not
touch** `catalog_items.total_inventory`.

## Unknowns

- `[UNKNOWN]` **Authority for "what is physically there"** —
  `catalog_item_allocations.quantity` (described in-code as a static split) or
  the latest `inventory_counts` row (described as the derived on-hand). Two
  candidate sources for one fact. **Resolver: Josh + Maggie.** Does not block
  the location axis; **does** block the divergence surface, so settle it before
  the pack-facing half of the work.
- Vendor and catalog-item names throughout T23 are **illustrative only**
  (operator, 2026-08-21). Do not treat any named venue, building, or supplier as
  a real entity to model.
