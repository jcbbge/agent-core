# WAVE 1 — corrections and rulings (concierge, 2026-08-21)

Issued to all seven unit seats plus the index. These supersede the corresponding
lines in COMMON.md and the unit briefs.

## R1 — The governing law is the ADR, and it says your sitting IS the work

`~/Infinity/arc/docs/decisions/2026-08-20-imagine-before-promote.md`
(Status: Accepted — process invariant) rules:

- A transcript enters outer Discovery only. The pipeline is not Commit and not Build.
- **Promote (STAGED → PROMOTED) is outer Commit. The item must be bounded: in, out,
  done-when, written. That sitting IS inner Imagine.**
- Build starts at Plan. After promote there are no further product decisions.
- **"If shape is still open, do not promote. Stay in Discovery / Imagine with the human."**

So the clay-blocking you are doing with the operator is not a detour before the
work — it is the sanctioned procedure, and the bounded brief you produce is the
promote gate. Do not rush to a brief that is not yet bounded.

## R2 — The secondary pass is not a ruling; do not treat its ordering as law

`analyses/T23_maggie_secondary_pass.md` self-labels: **"Not a ruling."** Its own
usage note reads: *"Principles (STG-677, STG-678) and process (STG-682, STG-684)
should not get a build thread **unless you want one**; they constrain every other
thread."* The operator wanted one. That file is a thread seed, not a strike order.

The same ADR (R1) explicitly deprecates strike ranking: *"Mixing W-BUNDLES with
wet overlay STGs as one 'strike ranking' was a third board. Two boards only."*
If a unit was told it is re-litigating a settled sequence — it is not.

## R3 — The bifurcation arbiter is the index seat (my error, corrected)

Three unit briefs each told their seat it held the bifurcation's decisive
instance (U1 "cleanest," U3 "third shape," U5 "unambiguous"). That was a drafting
error on my part, not three competing truths. Ruling: **rule the seam locally for
your own items; the index seat adjudicates conflicts between units.** Do not
claim the global ruling.

## R4 — "Annotate" is a locked term. There is exactly one.

`SPEC-packlist-production-mode.md` owns **Annotate** as a specific gesture: it
stores composition snapshot **B** plus listing **A**, with diffs computed
(live vs B = floor; Aₙ vs Aₙ₊₁ = ink). U4's verb "annotate a station canvas"
must route through that gesture. **No unit builds a second thing called
annotate.** If your unit needs annotation semantics the spec does not cover, that
is a finding to report, not a new primitive to invent.

## R5 — U5 only: the blast-radius objection to STG-672 is spent

Do not re-litigate it. It is discharged by construction (zero effect on existing
events); the residual visibility question is already answered by STG-671's
live-vs-B doorbell. Attach/detach UX remains genuinely open and is yours.

## R6 — U2 only: citation corrected

The political risk on the bin overlay cites **STG-653** (warehouse par is the
superset), not STG-658. STG-658 governs item-name dimensionality — a different
axis. Your brief has been corrected in place.

## R7 — U7 only: your ADR precedent is confirmed

`~/Infinity/arc/docs/decisions/` is the right home; 28 dated ADRs with a
Date / Status / Scope header. The stale README index (missing 7 recent ADRs) is
noted by the concierge as separate housekeeping — **not yours to absorb.**

## Standing

Report findings up to `claude-concierge`. Do not message peer seats — the
concierge relays. The durable comms door is under repair; keep working state on
disk.
