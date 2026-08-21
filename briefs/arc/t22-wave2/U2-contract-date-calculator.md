# UNIT — Contract-required dates are a calculator, not FKs (STG-665)

Read `~/agent-core/briefs/arc/t22-wave2/COMMON.md` first.

## Your item

**STG-665 — required dates are a hard-coded calculator, not FKs to the invoice
schedule.** [documents + hubspot]
Nathaniel: wiring contract-required dates to the invoice schedule *"will actually
create an issue because you can change an invoice schedule. It's not a hard
date."* Spec is Mimi's existing event-team **date calculator** (still in her
archives). Example rule: booked within 180 days → 180-day payment = N/A. Dates
should *match* the deposit schedule without being bound to it. *"These are the
date properties, and we can add them as needed."*
Route: `documents/BACKLOG-contracts.md` + HubSpot date properties;
**blocked on retrieving Mimi's calculator as the rule table.**
Verify with: Mimi, Nathaniel.

## What to hash out

- **This item is blocked on an artifact nobody has retrieved.** Mimi's calculator
  is "still in her archives" and it *is* the spec. A brief written without it is
  a guess at a rule table. Getting that file is almost certainly the highest-value
  move in this unit — surface that to Josh immediately rather than designing
  around it.
- **The architectural point is sharp and worth preserving:** match-without-binding.
  Nathaniel is rejecting a foreign key, not rejecting the dates. Whatever you
  propose must survive someone editing an invoice schedule afterward.
- Pairs tightly with **STG-666** (the amounts half of the same conversation) and
  respects **STG-670** (no unattended HubSpot writes). Another seat holds each —
  flag, do not absorb.
- `[UNKNOWN]` — the full rule set. The 180-day example is one row of a table
  whose size nobody has stated.
