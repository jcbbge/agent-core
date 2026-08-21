# UNIT 2 — Inventory truth: pools and bins (STG-674 + STG-675)

Read `~/agent-core/briefs/arc/t23-wave1/COMMON.md` first.

## Your items

**STG-674 — Don't Mix Lots: owned vs sub-rented are not fungible qty.**
[data-model]
Shortage remedy is EventWorks (sub-rent); her team picks up and returns. She will
not mix rented chairs with owned (slightly different color) on the same site —
she moved Cherokee-owned chairs to Saddlewoods so all rented chairs go to
Cherokee. STG-656 substitution and STG-655 "buy / sub-rent / substitute" treat
shortage as a number. She treats it as **parallel pools** with logistics.
Color/finish is an operational key, not a catalog footnote.
Route: `platform/BACKLOG-data-model.md` + packlist; lot/pool identity on
reservations. Verify with: Maggie (vendor name ASR-garbled).

**STG-675 — Physical bin overlay on T21 accounting location.**
[admin/inventory — TENSION WITH STG-653]
STG-653 stands: warehouse par is the superset. Maggie: overflow "warehouse" stock
currently **lives at Cherokee and Saddlewoods** because the warehouse is over
capacity (Dream merger, no extra square footage). She still reports it as
warehouse because *"that's how he wants it."* A count walk that only believes
allocation rows will "lose" chairs on a porch in Arrington. Need a current-bin /
overflow flag that pack and dispatch can read **without** splitting the warehouse
identity Nathaniel forbade.
Route: `admin/BACKLOG-inventory-packlist.md`; **do not implement as a second
warehouse par.** Operator ruling: Josh + Maggie; Nathaniel may reject anything
that looks like a third level. NOTE (concierge correction, 2026-08-21): the location ruling is STG-653 (warehouse = superset), NOT STG-658 — STG-658 is about item-name dimensionality (station x venue x item), a different axis. The political risk is real; the original citation was wrong.

## Why these are one unit

Both say the same thing in different registers: the quantity is not the truth.
674 splits identity by ownership/lot; 675 splits location by physical reality vs
reported accounting. Any data-model change serves both or fights both.

## Tensions to resolve with the operator

- **This is the hardest political item in the wave.** Nathaniel forbade splitting
  warehouse identity (STG-658) and may reject anything resembling a third level.
  Maggie reports overflow as warehouse *because he wants it that way*. The design
  has to be true to the floor without contradicting the owner. Name that
  constraint in the brief; do not design around it silently.
- **Scope.** Lot/pool identity and bin overlay are global/admin data-model
  changes that cascade. Yet the reason they exist is event-level pack accuracy.
  Rule the seam.
- Collides with **STG-655/656** (shortage as a number) and **STG-653** (warehouse
  par is superset) and feeds **Unit 1's** heat map. Flag, do not absorb.
- `[UNKNOWN]` — the sub-rental vendor name is ASR-garbled in the transcript
  ("EventWorks" is the best reading). Mark it and let the operator confirm.
