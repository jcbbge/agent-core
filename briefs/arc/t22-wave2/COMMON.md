# T22 WAVE 2 — COMMON context (read this first, then your unit brief)

## What this wave is

The 2026-08-20 discovery session staged seven items from the Nathaniel weekly
(T22). You own one. This is a **clay-blocking session with the operator (Josh)**:
he does the rough outlining and rough sketching WITH you in your pane. The
deliverable is a **bounded handoff brief** good enough to spawn an orchestrator
against.

**The operator drives these conversations with you directly, in your pane.** Do
not route design questions up to the concierge and wait — the concierge directs
traffic, it does not adjudicate product. Bring your forks to Josh.

## The governing law

`~/Infinity/arc/docs/decisions/2026-08-20-imagine-before-promote.md`
(Accepted — process invariant):

- The pipeline is not Commit and not Build. It never starts a Cycle.
- **Promote (STAGED → PROMOTED) is outer Commit. The item must be bounded: in,
  out, done-when, written. That sitting IS inner Imagine.**
- Build starts at Plan. After promote there are no further product decisions.
- **"If shape is still open, do not promote. Stay in Discovery / Imagine with the
  human."**

So your sitting IS the sanctioned step, and your bounded brief is the promote
gate. Do not rush to a brief that is not yet bounded.

## Sources (verified to exist, 2026-08-21)

Repo `~/infinity/discovery`, local-only, no remote, all work on `main`.
HEAD = `fb7abfd docs(discovery): pool vs promote; dismiss STG-672 overlay`.

1. `STAGING.md` — your item is a `### [STG-NNN]` block in the
   `## T22 — Nathaniel weekly` section.
2. `transcripts/0819_weekly_nathaniel.md` and
   `transcripts/081226_weekly_nathaniel.md` — UNTRACKED files in that repo.
   Check which one is your source before quoting.
3. `analyses/T21_nathaniel_0812_digest.md` — UNTRACKED, 126 lines. Owner-side
   inventory math.
4. `~/Infinity/arc/docs/decisions/` — 28 dated ADRs, Date / Status / Scope
   header. The README index there is stale (missing 7 recent ADRs); the concierge
   owns that cleanup, not you.

## The standing political fact (applies to several units)

There is a live disagreement between the owner (Nathaniel) and the production
side (Maggie) about consolidation. Nathaniel wants everything streamlined through
Mimi's dispatch and treats it as the place of truth; Maggie deliberately kept her
own venue-shaped system because *"it wasn't broken,"* and reports overflow stock
as warehouse *"because that's how he wants it."*

**Concierge ruling, standing until Josh overrides it in your pane:** where your
unit would draw a line that contradicts Nathaniel, write it as
**"Proposed — pending Nathaniel"**, not "Accepted." Two Wave 1 units
independently concluded the design only survives if it does not contradict him,
and an Accepted decision that takes a side in a live owner disagreement risks the
whole thread being vetoed rather than negotiated. **Josh can overrule this in
your session — raise it with him, do not ask the concierge.**

There is a forcing function on the calendar: see STG-668 (Oct 1 ready / Nov 1
transfer / Jan 1 paid-development cliff).

## Method

- **Provenance.** Label whose mouth a claim came from. In this pipeline an item
  was demoted (STG-672) specifically because an example came from Josh rather than
  the subject. When evidence is inference rather than a quote, say so.
- **Mark unknowns `[UNKNOWN]`.** Never fill a gap with a plausible value. This
  operator rejects invented values, even good ones.
- **Match the existing format.** STG entries are Lens / Insight / Route / Status.
- Items whose verification is pending are not delegation-ready. Say so.

## Delegation-ready means

Scope ruling; dependencies and collisions with existing STGs; what is `[UNKNOWN]`
and who resolves it; done-when; and the rejected alternative with why.

NOTE (concierge, 2026-08-21, P1): a file partition is deliberately NOT required
here. A partition presupposes a decomposition that does not exist until Plan.
The standing rule: **Ideate grounds everything its commitment depends on; Plan
grounds only what its decomposition depends on.**

## Constraints

- You do NOT write Arc product code. Discovery and shaping only.
- Do not commit unless Josh explicitly orders it. Then stage explicitly, never
  `git add -A`.
- Do not message peer seats. Report findings to `claude-concierge`; it relays.
- The durable comms door is under repair today — keep working state on disk.
