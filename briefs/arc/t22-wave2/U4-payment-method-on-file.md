# UNIT — Payment method on file, and the client cannot remove it (STG-667)

Read `~/agent-core/briefs/arc/t22-wave2/COMMON.md` first.

## Your item

**STG-667 — payment-method-on-file consent at first pay; client cannot delete the
token.** [portal — COLLIDES WITH STG-661 BACKBURNER]
Kill the credit-card/ACH authorization-form chase. Hotel pattern: at initial
payment, consent that this method is stored and used for final/incidental
charges; event designer still hits process after entering the bar tab (**not
autopay**). Old software let the client remove the token from the portal —
*"I need that not to be able to happen."* Corporate exception: authorize-this
**or** enter an alternate ACH/card to store. *"A payment method is required to be
stored."*
Route: `portal/BACKLOG-payment-scheduling.md`. **Home is contested:** T21 moved
client pay to Planning (STG-661, operator-backburnered 2026-08-13). **Do not
schedule a portal build; record the UX invariant so whoever owns first-pay (Arc
or Planning) implements it.**
Status: STAGED — **blocked on STG-661 / operator**

## What to hash out

- **Your item's own status names Josh as the blocker.** STG-661 moved client pay
  to Planning and he backburnered it on 2026-08-13. So the first question in your
  session is his: is first-pay Arc's or Planning's? Until that answers, this is
  an invariant to record, not a build to scope. Ask him directly.
- **Write the invariant so it survives either home.** That is explicitly what the
  route asks for. The valuable artifact here is a portable UX contract: consent
  captured at first payment, token retained, client cannot delete, staff-initiated
  charge rather than autopay, corporate alternate-method path.
- **"Not autopay" is load-bearing and easy to lose.** The event designer still
  presses process after entering the bar tab. A future implementer reading
  "method on file for final charges" will reach for autopay. Make it impossible
  to misread.
- Legal/compliance shape is `[UNKNOWN]`: "client cannot remove the stored method"
  is a consent-and-retention posture with card-network and state-law dimensions
  nobody in this pipeline has checked. Flag it; do not rule it.
