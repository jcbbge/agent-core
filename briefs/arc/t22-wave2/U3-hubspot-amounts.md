# UNIT — HubSpot needs the dollars, not just the dates (STG-666)

Read `~/agent-core/briefs/arc/t22-wave2/COMMON.md` first.

## Your item

**STG-666 — amount properties, not just dates (50% $, total contract, paid-in-
full).** [integrations-hubspot]
Second half of the dates conversation. HubSpot already has some dates; it does
not have the dollars. *"We need to see the amounts. We need to see the total
contract amount. Have they paid in full? That is a property we need in HubSpot,
not just Arc."* So Arc (or the payment ledger) pushes figures; HubSpot is the
staff-visible copy.
Route: `platform/BACKLOG-integrations-hubspot.md`; pairs STG-665; respects
STG-670 (no unattended HubSpot writes).

## What to hash out

- **The invariant to nail is directionality and authority.** Arc (or the payment
  ledger) is the source; HubSpot holds a staff-visible copy. So what happens when
  they disagree? Push cadence, reconciliation, and who wins are the real design,
  not the property list.
- **STG-670 constrains the mechanism, hard.** No automated task writes to HubSpot
  without a human authorize-box. An amount that must stay current and a write
  that requires human authorization are in direct tension. Resolve it explicitly
  — that tension is the interesting part of this item.
- "Have they paid in full?" is a derived boolean. Storing a derived value in a
  second system is a staleness generator. Consider whether it is computed at push
  time or genuinely stored.
- `[UNKNOWN]` — which of these properties already exist in HubSpot. Nathaniel says
  "HubSpot already has some dates"; nobody enumerated them.
