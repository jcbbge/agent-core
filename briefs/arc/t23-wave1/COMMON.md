# T23 WAVE 1 — COMMON context (read this first, then your unit brief)

Every coordinator in this wave shares this file. Your unit brief names only
what is yours.

## What this wave is

Yesterday (2026-08-20) the discovery pipeline staged fourteen items from the
first Maggie-spoken artifact in the whole pipeline (T23, interview 2026-08-19).
One was promoted, one dismissed, twelve remain STAGED. This wave processes those
twelve, grouped into seven units. You own one unit.

**This is a clay-blocking session with the operator (Josh).** He does the rough
outlining and rough sketch WITH you in your pane. You are not an autonomous
grinder and you do not implement. The deliverable is a **polished handoff brief**
good enough to spawn an orchestrator against. Until that brief exists, the unit
is not done.

## The operator's own framing (his words, 2026-08-21)

> "Those staging items, we need to process. But before we process, we have to go
> over them, make sure they're aligned, we need to add contextual information,
> add whatever we need, and then we need to go through those before they actually
> get promoted."

And the through-line he is chasing across the whole set:

> "…the bifurcation split of her function of work — meaning the work that
> requires her to have the admin, global-scoped changes within, and then the
> ability to make event-based changes in Arc specifically around the pack list."

So for every item in your unit, one question is always live: **does this belong
to global/admin scope (catalog or par level, cascades to every event) or to event
scope (one build, one pack list, must NOT cascade) — or does it straddle, and if
it straddles, what is the seam?**

## Sources (verified to exist, 2026-08-21)

Repo `~/infinity/discovery`, local-only, no remote, all work on `main`.
HEAD = `fb7abfd docs(discovery): pool vs promote; dismiss STG-672 overlay`.

1. `~/infinity/discovery/STAGING.md` — your items are `### [STG-NNN]` blocks in
   the `## T23 — Maggie, 2026-08-19` section at the END of the file (1889 lines).
2. `~/infinity/discovery/analyses/T23_maggie_0819.md` (22.5 KB) — the deep pass.
3. `~/infinity/discovery/transcripts/0819_infinity_maggie.md` (30.6 KB) — the raw
   transcript. **Maggie's own words.** Go here to check whether a claim is hers.
4. `~/Infinity/arc/docs/admin/SPEC-packlist-production-mode.md` (7.3 KB)
5. `~/Infinity/arc/docs/admin/BACKLOG-inventory-packlist.md` (10.9 KB)
6. **`~/Infinity/arc/docs/platform/data-doctrine.md` — READ THIS FIRST, it was
   missing from this list and it already rules the bifurcation.** (Added by the
   concierge 2026-08-21 after the index seat caught the omission.)

## The bifurcation is ALREADY RULED — do not re-derive it

`data-doctrine.md` settles the global-vs-event question. Cite it; do not invent a
parallel vocabulary for it.

- **R4 — Library knowledge on library rows; instance knowledge on build rows.**
  That IS global vs event. Library-level facts attach to catalog rows and resolve
  into build rows at add-time.
- **R3 — The freezing point.** The seam: every value on a build line is
  snapshotted at add-time; library edits never mutate an existing build row.
  **Global cascades FORWARD ONLY.**
- **R7 — Consumption is a build row; ink carries instructions, never
  quantities.** Both halves are already written there — the negative half (an
  ink-only revision must not include 20 → 200) and the positive half.

If your unit's seam ruling contradicts R3, R4 or R7, that is a finding to report,
not a local decision to make.

## The anchor: STG-671, already PROMOTED

"The Canva Ritual is the pack-list UX to beat." Three years, every event: Bento
contract PDF → Canva → delete pricing → keep her annotations → mark VI vs
warehouse, group by station. 20 minutes to six hours; a 3-day 600-person Pinnacle
was 13 pages / six hours. Updates arrive as "pack list 2" after the Tuesday
meeting.

Product model locked 2026-08-20: Canva is a PDF workaround for a broken Bento
pack gather, not a spatial IDE. `/build` production mode (same live build, no
clone); live need + last-writer/qty-hop scan; `pack_list` JIT or annotated
freeze. Annotate stores composition snapshot **B** + listing **A**; diffs
computed (live vs B = floor; Aₙ vs Aₙ₊₁ = ink). Qty last-hop only — not
section/build git. STG-677 is baked into this spec.

This is settled context, not an open item. **Every unit orbits it.** If your work
contradicts it, say so explicitly rather than quietly diverging.

## The flag every unit should know

**STG-672 was DISMISSED on 2026-08-20** — "Library vs event bundling… a pebble,
not 10X." Its note reads: *"Two scopes already exist: catalog required/bundled
children (global; cascades) vs add/remove on a build (this event only)… The
remaining pebble is library attach/detach UX plus blast radius of a global edit —
resurface when that need arises."* It was demoted because the tennis-ball-kit
example came from Josh's mouth, not Maggie's.

That dismissed item is the global-vs-event bifurcation, named and shelved one day
before the operator came back asking for exactly it. Do not un-dismiss it
yourself. If your unit's evidence bears on it, surface that to the operator.

## Method (house discipline — this pipeline already enforces it)

- **Provenance.** STG-672 was demoted specifically because an example came from
  Josh rather than Maggie. Hold that line: when a claim's evidence is the
  operator's inference rather than Maggie's words, label it. The transcript is
  how you check.
- **Mark unknowns `[UNKNOWN]`.** Do not fill a gap with a plausible value. This
  operator rejects invented values, even good ones — that is a standing rule, not
  a preference.
- **Match the existing format.** STG entries are Lens / Insight / Route / Status.
  Do not invent a new shape.
- Several items say "Verify with: Maggie." She offered sample pack lists and to
  sit with Josh. An item whose verification is pending is not delegation-ready —
  say so rather than papering over it.

## Delegation-ready means

Your handoff brief carries: the scope ruling (global / event / both, and the
seam); dependencies and collisions with existing STGs; what is still `[UNKNOWN]`
and who resolves it; the done-when; and the rejected alternative with why.

NOTE (concierge, 2026-08-21, P1): a file partition is deliberately NOT required
here. A partition presupposes a decomposition that does not exist until Plan.
Requiring it at the Commit gate contradicted `2026-08-20-imagine-before-promote`.
The standing rule: **Ideate grounds everything its commitment depends on; Plan
grounds only what its decomposition depends on.**

## Constraints

- You do NOT write Arc product code. Discovery and shaping only.
- Do not commit unless the operator explicitly orders it. If he does: stage
  explicitly, never `git add -A`.
- `~/infinity/discovery` has untracked files including an EMPTY
  `transcripts/0819_inventory_maggie.md` (0 bytes) — not the real transcript.
  Leave untracked files alone.
- `HANDOFF.md` in that repo is STALE (T19, paused 2026-07-21). Not current state.
- A sibling coordinator holds the cross-item index for this wave. Stay in your
  lane; if you find something that belongs to another unit, report it up rather
  than absorbing it.

## Report-back

Parent is `claude-concierge`. The durable comms door is under repair today, so
ALSO keep your working state on disk in the discovery repo.
`~/muster/bin/muster-deposit deposit --from <your-role> --to claude-concierge --kind report|done|need-help|question --body "<...>"`
