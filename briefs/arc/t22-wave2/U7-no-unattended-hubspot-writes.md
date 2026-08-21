# UNIT — No unattended writes to HubSpot (STG-670)

Read `~/agent-core/briefs/arc/t22-wave2/COMMON.md` first.

## Your item

**STG-670 — no unattended writes to HubSpot; a human authorize-box.**
[integrations-hubspot]
Mimi's standing rule, offered as a shared standard: she never lets an automated
task write directly to HubSpot; a human checks a box on planning/dispatch that
authorizes it. Applies to STG-666 amount-property pushes and any Arc→HubSpot
webhook.
Route: `SYNTHESIS → Context`; HubSpot write path in Arc.

## What to hash out

- **This is a policy that governs other items, so its deliverable is probably a
  recorded invariant plus one gate in the write path — not a feature.** Rule the
  shape with Josh early.
- **It is in direct tension with STG-666**, which wants current dollar amounts
  visible in HubSpot. Amounts that must stay fresh versus writes that require a
  human box is the real design problem in this pair. Another seat holds 666 —
  bring the tension to Josh, do not negotiate it with that seat.
- **Whose rule is it, and does Arc adopt it or merely respect it?** It is Mimi's
  standing practice, *offered* as a shared standard. Adopting a peer team's
  policy as an Arc invariant is a governance act. And note the Jan 1 cliff
  (STG-668): if Mimi comes off payroll, an inherited-but-unowned policy needs a
  new owner.
- **Scope the blast radius:** does this cover every Arc→HubSpot write, or only
  the derived/financial ones? A per-write authorize-box on high-frequency syncs
  would be unusable. Batching, scoping, or a standing authorization are the
  obvious escapes — pick one deliberately.
- Interacts with **STG-664** (HubSpot as a data pull): reads and writes may want
  one gateway.
