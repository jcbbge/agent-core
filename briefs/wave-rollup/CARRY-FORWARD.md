---
# Carry-forward ledger — already built, not wired
# Primary store for skill `wave-rollup`. Append-only. Retire when consumed.
# Made Well ground reads this as INPUT before planning.
schema: wave-rollup/carry-forward@1
updated: 2026-08-13
---

## Active

### cf-2026-08-13-galley-write-arrow
```yaml
id: cf-2026-08-13-galley-write-arrow
status: active
wave: 2026-08-13-arc
what_exists: "Galley write arrow — mutateAndEnqueue + menuPlan allowlist (create/update item ops)"
where: "apps/api/src/lib/galley/mutate-and-enqueue.ts:55 (exported via lib/galley/index.ts); packages/contracts/galley/write-allowlist.ts:39"
missing: "any production caller outside tests/oracles; no UI"
wire: "add a route/handler caller (not a rebuild of the substrate)"
evidence: "git grep on origin/main — only integration + on-disk oracles call Galley mutateAndEnqueue; humanity webhook uses HubSpot mutateAndEnqueue"
validation: kept
seed_note: "concierge seed CORRECT"
```

### cf-2026-08-13-approve-menuplan
```yaml
id: cf-2026-08-13-approve-menuplan
status: active
wave: 2026-08-13-arc
what_exists: "approveMenuPlanEvent allowlisted and present in GALLEY_MUTATIONS"
where: "packages/contracts/galley/write-allowlist.ts:39 (menuPlan); packages/contracts/galley/mutations.ts (~approveMenuPlanEvent doc)"
missing: "UI / operator-facing approve path; reconciliation semantics still gated"
wire: "operator ruling on approve semantics, then wire a caller through mutateAndEnqueue"
evidence: "allowlist comment states UI lands separately; no apps/web references"
validation: kept
seed_note: "concierge seed CORRECT"
```

### cf-2026-08-13-inventory-restock-surface
```yaml
id: cf-2026-08-13-inventory-restock-surface
status: active
wave: 2026-08-13-arc
what_exists: "inventory_counts ledger + count-walk capture path end-to-end (schema, API, walk auth, UI)"
where: "apps/api/drizzle/0061_inventory_location_scope.sql:17 (CREATE TABLE inventory_counts); apps/api/src/routes/inventory-counts.ts (staff OR walk-session writes); apps/api/drizzle/0064_inventory_walk_sessions.sql; apps/web/src/components/inventory/CountWalkShell.tsx (POST /api/inventory-counts); apps/web/src/lib/inventory/derivedOnHand.ts"
missing: "order-draft / restock surface — restock = count − par grouped by order_source (STG-647g); historical worksheet importer (STG-647e) still open"
wire: "build ordering/restock UI on existing ledger + derivedOnHand; do not recreate inventory_counts or walk auth"
evidence: "0061 creates inventory_counts; counts route accepts walk session; CountWalkShell posts counts; backlog STG-647g still open; concierge claim that the ledger table was missing is FALSE"
validation: corrected
seed_note: "concierge seed WRONG — retired false claim (table missing); replaced with restock/importer gap"
```

## Retired

_None yet._

## Seed validation log (2026-08-13)

| Seed | Verdict | Evidence |
| --- | --- | --- |
| Galley `mutateAndEnqueue` exists; missing any caller | **kept** | `mutate-and-enqueue.ts:55` on `origin/main`; callers outside tests: none (Galley) |
| `approveMenuPlanEvent` allowlisted, unwired | **kept** | `write-allowlist.ts:39`; no UI |
| Inventory walk auth; `inventory_counts` missing | **corrected** | `inventory_counts` **exists** at `0061_inventory_location_scope.sql:17`; write API + CountWalkShell present; `0064` is walk tokens/sessions only. Replaced entry: restock/order-draft + importer still unwired |
