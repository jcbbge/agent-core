# ORCH — kill the rotting doc-status field, then fence it (P2 → P3)

Source finding: `~/infinity/discovery/specs/PROCESS-premature-binding-madewell.md`
(P1–P4 defined there). Handed up by the closed T23 Lookahead seat.
Full context: `~/infinity/discovery/specs/ACTIONS-for-concierge-T23-U1.md` §A5.

## The defect

ADR headers in `~/Infinity/arc/docs/decisions/` carry **build state**. That is a
PR fact embedded permanently in a decision record with **no writer responsible
for updating it**. It rots, and then seats brief against it.

Two confirmed instances, verified against the schema this session:
- `2026-08-12-inventory-location-scope.md` says *"schema direction proposed, not
  migrated"* — but `inventory_counts` EXISTS
  (`packages/db/src/schema/inventory-counts.ts`), migrations `0061` and `0064`
  landed.
- `2026-08-12-section-optionality-and-confirmation.md` carries the same header
  pattern, and its section tier *does* appear genuinely unbuilt. **Only checking
  told us which was which** — that is the whole problem.

**The rule:** an ADR is authoritative on the decision and worthless on build
state. Build state comes from `packages/db/src/schema/` and
`apps/api/drizzle/`.

## P2 — FIRST. Strip build state from ADR headers.

Across `~/Infinity/arc/docs/decisions/`. `Status:` means *the decision is
accepted* — nothing about shipping. Delete "design-level," "not migrated in this
PR," and every sibling phrase.

28 dated ADRs, `Date / Status / Scope` header. Do not alter any decision text,
scope, or date. Header status semantics only.

## P3 — SECOND. Fence it with the live gate.

Arc's `spec-conformance` gate is already running — it reported *"28 specs
scanned"* on commit `21b7a06`. **The seam exists and needs no new
infrastructure.**

Add: for any ADR naming a proposed table or column, assert it does NOT exist in
schema. On existence, fail with
`ADR status stale — decision shipped, header says proposed.`

## THE ORDERING IS THE POINT — do not reverse it

P2 removes the existing lies; P3 prevents new ones. **Reversed, P3 fails loudly
against a backlog of known-stale headers and somebody disables it — which is how
enforcement dies.** If you can only land one, land P2.

## Also record this principle (same finding, different face)

> If it consumes physical inventory, it must be a build row; ink carries
> instructions, never quantities.

The pack-list production spec already rules the negative half (an ink-only
revision *"must not include 20 → 200"*). Give the positive half a home in the
process/principles surface. It is a precondition for any forecasting surface
being trustworthy.

## Framing you should know (do not expand scope to chase it)

`~/agent-core/research/peer-refraction-madewell-topology.md` already diagnosed
this class as **write-side production with no designated reader**. P3 is a reader
for ADR headers; P4 (assigned elsewhere) is a reader for the staging pool.
*"These are not new rules to follow. They are missing readers to install."*
Build the two readers in your scope; do not open the topology thread.

## Done-when

- No ADR header asserts migration or build state.
- The new check **fails on a seeded stale ADR** and **passes clean on `main`**.
  Both demonstrated, not asserted.
- The inventory principle has a recorded home.
- Gates green, committed, pushed to the operator's own remote. No third-party
  surfaces.

## Constraints

- Read `~/Infinity/arc/AGENTS.md` first; if it disagrees with this brief, it wins.
- Stage explicitly. Never `git add -A`.
- House law: no mocks. The check is proven by seeding a real stale ADR.
- The `docs/decisions/README.md` index is also stale (missing 7 recent ADRs
  including `2026-08-20-imagine-before-promote`). Fix it while you are in there;
  it is the same rot.

## Report-back

`~/muster/bin/muster-deposit deposit --from orch-doc-status-hygiene --to claude-concierge --kind report|done|need-help --body "<...>"`
Bus repaired 2026-08-21: ledger `~/muster/field/deposits.jsonl`, unique ids.
