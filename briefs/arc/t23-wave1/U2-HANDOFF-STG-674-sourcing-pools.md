# HANDOFF — STG-674: sourcing pools (owned vs externally sourced)

**Unit:** U2 inventory truth · **Seat:** cord-t23-inventory-truth
**Date:** 2026-08-21 · **Gate:** bounded per ADR `2026-08-20-imagine-before-promote`
**Operator rulings in this brief were given by Josh in session, 2026-08-21.**

---

## The problem, in one paragraph

When a weekend over-commits a single item — Maggie's worked case was roughly 600
cross-back chairs needed against fewer than 300 owned — the remedy is to
sub-rent the shortfall from an outside supplier, and **her own crew** collects
and returns them. She will not put rented and owned units of the "same" item on
one site, because they differ visibly (colour/finish), so she physically moves
owned units off one venue so that every rented unit lands there instead. In her
words: *"I don't want to mix a rented one versus our inventory because that gets
really messy… so that's a lot of logistics I have to work out."* STG-655 and
STG-656 treat a shortage as a **number**. She treats it as **parallel pools with
labour attached**.

## Scope ruling (the seam)

**Global/admin owns pool existence.** A sourcing pool — its supplier, its
collect/return obligation, its distinguishing operational attribute — is a
catalog-level fact that cascades.

**Event scope owns only pool selection.** Which pool serves this build, on this
date, for this line. Selecting a pool on one build must not cascade anywhere.

The seam is the same one STG-675 draws for location: **the global layer says
what exists; the event layer says which of it is used here.**

## The decisive structural fact

`catalog_item_allocations` splits a total **we own** across locations. Sub-rented
units are not ours: they have a supplier, a collection, a return date, and they
were never part of `catalog_items.total_inventory`.

**Sub-rented stock therefore cannot live in the allocation table by
construction.** This is not a preference — it is what the table means. A new
concept is required, and that is what makes this item bounded rather than a
refactor of existing inventory.

A second, independent blocker: the code comment on `catalog_item_allocations`
states `UNIQUE(catalog_item_id, location_id)`. Even for owned stock you could
not represent "200 owned + 360 rented cross-backs at the same venue" as two
rows. Pool is a genuinely new dimension.

## Pre-verified facts (read from schema, 2026-08-21, NOT from ADRs)

- `packages/db/src/schema/catalog.ts` — `catalog_items.total_inventory` integer,
  nullable: *"Warehouse count for inventory-tracked items."*
- `packages/db/src/schema/stock-locations.ts` — `catalog_item_allocations`
  splits that total across `stock_locations`; remainder derived, never stored;
  `UNIQUE(catalog_item_id, location_id)` per the in-code comment.
- **Nothing for lot, pool, ownership, rental supplier, colour, or finish exists
  anywhere in `packages/db/src/schema/`.** Verified by grep across the schema
  directory. This item is net-new.
- `hubspot_vendors` is a 1:1 mirror of HubSpot's Vendor custom object
  (`packages/db/src/schema/hubspot/vendors.ts`). It is **not** a sub-rent
  supplier relationship — do not overload it without a ruling.
- `catalog_items.order_source` (STG-646, migration 0055) is free-text reorder
  metadata for consumables — a different relationship from sub-rent
  (collect/return labour, not a purchase order). Do not overload it either.

## In scope

1. **Sourcing pool as a first-class concept** — inbound externally sourced stock
   that never enters `total_inventory` and never appears as an allocation of it.
2. Each pool carries: supplier, collect and return obligations, the dates that
   bound it, and at least one **distinguishing operational attribute**
   (colour/finish is the worked example). Maggie's point stands on its own:
   finish is an operational key, not a catalog footnote.
3. **Event-scope pool selection** — which pool serves this build. No cascade.
4. **"Don't mix" is a WARNING, not a constraint.** Operator ruling, verbatim:
   *"it's not so much that it has to be a hard definition of a hard constraint.
   The flexibility is key. Being able to override is paramount… this is just the
   mechanism to allow for improvisation."* Default segregates; one gesture
   overrides; the override is **visible to the team on the pack list**.
5. Follow the **STG-656 precedent exactly** for that visibility: a substitution
   *"we literally show that on the pack out"* while the client sees only what
   will actually be there. A knowing mix-lot override behaves identically — team
   sees it, client does not. Same pattern, no new concept.

## Out of scope (named, not dropped)

- Shortage detection and the buy/sub-rent/substitute decision (STG-655,
  STG-656). **They consume pools; they do not define them.**
- The lookahead heat map (STG-673, Unit 1) — it will read pools. Flagged, not
  absorbed.
- Any supplier integration. No API was ever mentioned; the relationship is phone
  and email.
- Scheduling the truck ballet — that is the successor movement item, see
  `U2-FINDINGS-2026-08-21.md`.

## Collisions and dependencies

- **STG-675** — orthogonal and complementary. 674 splits *whose* it is; 675
  splits *where* it is. Both are space axes answering "right now." Neither
  depends on the other, and an implementer may take them in either order.
- **STG-655 / STG-656** — conflict math must eventually run **per pool**, then
  offer mix-or-isolate. Out of scope here; flag it to those owners so they do
  not assume a single fungible number.
- **STG-658** — governs item-name dimensionality, a different axis. Pools are
  not a naming decision and must not be modelled as name variants. Note the
  standing rule that item naming is Nathaniel's alone: *"these are the things
  that you want to run by me. And me only."*
- **STG-671 / `SPEC-packlist-production-mode.md`** — Annotate is a locked term.
  Nothing here creates a second annotate gesture.

## Rejected alternatives

1. **Model sub-rent as `total_inventory` going up temporarily.** Corrupts the
   possession ledger Nathaniel relies on, and loses the return obligation
   entirely. Rejected.
2. **Model rented units as a second allocation row at the venue.** Blocked by
   `UNIQUE(catalog_item_id, location_id)`, and semantically wrong — the
   allocation table splits what we own. Rejected.
3. **Treat colour/finish as a separate catalog item.** Multiplies the library,
   collides with STG-658's naming authority, and would price rented and owned
   units differently when they are the same sale. Rejected.
4. **Enforce "don't mix" as a hard constraint.** Explicitly rejected by the
   operator. It would make the system something she routes around, exactly the
   failure mode STG-677/678 warn about.

## Done-when

- [ ] An externally sourced pool can be recorded against a catalog item with
      supplier, collect/return, bounding dates, and a distinguishing attribute,
      **without** changing `total_inventory`.
- [ ] A build can select which pool serves a line, and that selection provably
      does not cascade to any other event.
- [ ] Placing two different pools of one item on one site produces a **warning**
      that can be overridden in a single gesture.
- [ ] An accepted override appears on the team pack list and does **not** appear
      on the client-facing document.
- [ ] No pool row is ever counted in a possession rollup.

## File partition an implementer would touch

- `packages/db/src/schema/` — one net-new table; **no changes** to
  `catalog_item_allocations` or `catalog_items.total_inventory`.
- `apps/api/drizzle/` — one additive migration.
- `docs/platform/BACKLOG-data-model.md` — the model entry.
- `docs/admin/BACKLOG-inventory-packlist.md` — the pack-facing behaviour.

## Unknowns

- Supplier and item names in T23 are **illustrative only** (operator,
  2026-08-21) — the ASR-garbled vendor name is **no longer an open question and
  is removed as a blocker.** Model the *role* (external supplier with
  collect/return), never a named company.
- `[UNKNOWN]` Whether a pool is scoped per catalog item or can span items on one
  supplier engagement (one pickup, several SKUs). Maggie described a single
  chair type; the general case is unobserved. **Resolver: Maggie.** Does not
  block the model — start per item, and do not design the multi-SKU case on
  speculation.
