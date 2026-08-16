# IGNITION DECISION BRIEF — the engine shop, itemized

**From:** peer-fable
**For:** Josh's Commit gate
**Date:** 2026-08-13
**Basis:** peer-refraction-madewell-topology.md + peer-dark-engine-shop.md (3-turn
converged exchange with concierge) + primary reads of ~/rumen, /ground, land.md,
commit.md, LIFECYCLE.md, live Tower/herdr/git state.

---

## Part 1 — The full action list, with instrumentation

Ordering is dependency order. "Watch" = the signal, using instruments that already exist
(tax.jsonl, board, pheromones, vein, git) — no dashboards; a dark shop is read by its
ledgers, not its lights. "Working when" = the acceptance condition. Every item is
file-based, vendor-free, reversible.

### A0. Swab the kernel — minutes
Fix `LIFECYCLE.md:17` in both copies (~/madewell and arc) to match the :58 correction.
- **Watch:** nothing ongoing; it's a one-shot.
- **Working when:** grep shows one loop law across both files. (Later, A3 catches this
  entire class automatically — this is the hand-fix that motivates the machine.)

### A1. Night orders v1 — an hour
One page: what wakes Josh (true alarm classes, nQ≤3 violations) vs what trays. Tower
routing (COMMS-ARCH) already carries most of the enforcement.
- **Watch:** interruptions per session vs tray items processed in batch.
- **Working when:** tray processed in one or two sittings per day; zero non-alarm
  doorbells across a week.

### A2. Ground manifest — half a day
/ground Step 3 emits its synthesis as a machine-readable block: paths + refs/mtimes +
BUILT/PARTIAL/NET-NEW verdicts + a first-class **coverage** field. Schema mirrors the
shim's `.verify/` marker shape. This formalizes what hard rule 5 already compels; it does
not add a new obligation.
- **Watch:** manifest presence on new briefs; coverage distribution (how much grounding
  is declared-but-unaudited).
- **Working when:** 100% of spawned briefs carry a manifest (guaranteed once A3 refuses
  without one); on CC, spot-audit (PostToolUse exhaust vs declaration) discrepancy rate
  is low and falling.

### A3. Freshness gate at the spawn primitive — ~a day. THE KEYSTONE.
Walker compares manifest refs/mtimes against current reality. Stale or absent → refuse
spawn. Incomplete coverage → visible flag, never a block (fail closed on staleness, fail
visible on incompleteness).
- **Watch:** refusals by reason; **false-refusal rate** — this is the R9 dead-linter
  hazard: a gate that cries wolf gets disabled, and a disabled gate is worse than none.
  Track Josh-overrides explicitly.
- **Working when:** the line-17 class goes to zero, AND the gate scores at least one
  true catch — a brief refused because a sibling unit landed and moved its inputs. That
  single event is the proof the MVCC layer is real. Overrides stay rare (<1 in 10
  refusals) or thresholds get revisited.

### A4. One door, three refusals — 1–2 days
Consolidate at the spawn primitive: verify-criteria (exists — CURSOR_VERIFY_GATE), WIP
token (Tower holds the count; rope set at honest release throughput), freshness (A3).
Tower also holds un-Landed-blocks-admission state. commit.md rewritten to explain, not
enforce.
- **Watch:** in-flight count vs cap; depth of the finished-unverified queue; count of
  admission decisions made in conversation with Josh (should trend to zero — that number
  IS the single-threadedness being removed).
- **Working when:** in-flight never exceeds the rope; no admission while an un-Landed
  unit exists; admission happens without Josh in the loop.

### A5. Batch record via cursor-finish — ~a day
Extend the only Land that actually runs to write the four faces and append TAX.
Contract documented file-decidable; the cursor-only scope documented as a fence other
harnesses implement later.
- **Watch:** **tax.jsonl row count** — the direct reversal of the month-of-zero-bytes
  finding; % of Lands with complete faces; minutes-per-release at Josh's station.
- **Working when:** tax.jsonl grows monotonically with landed units; PROPAGATED debts
  are queued items, never silence; Josh's release read is minutes per unit, not a
  re-review.

### A6. vein retro-baseline — half a day. ZERO RISK, PURE INFORMATION.
Mine the existing transcript corpus + git history for proposed-vs-accepted per unit
class → per-class TAX priors. This is simultaneously Rumen R3's tax-sensor prototype
("prototype the tax sensor on real git history" — RISKS.md), so it advances Constellation
research and the factory in one move.
- **Watch:** the noise level of the signal itself — R3's own open question.
- **Working when:** per-class priors exist with honest error bars. If the signal is
  unmeasurable noise, we learn it BEFORE trusting any promotion threshold — that outcome
  is a success of the test, not a failure of the plan.

### A7. The certified week — one calendar week of NORMAL work
Docs/test-class lanes in flight at the roped rate; morning tray; TAX per unit against
the A6 prior.
- **Watch:** units released/day; tray depth at session start; TAX vs prior; **silent
  third states** (a unit discovered done-but-wrong that never stopped itself) — target
  is hard zero; any occurrence is a factory defect that halts promotion.
- **Working when:** the reservoir drains N items with Josh at four stations only; zero
  silent third states; TAX within envelope → the next class (mechanical refactors)
  earns certification.

### A8. Riders — background, low effort
Alarm rationalization (every Tower signal maps to a consumer action or is deleted);
dissimilarity rule in the spawn law (test-maker and implementer never share a model
family).
- **Watch:** alarms/day and answered-vs-ignored ratio (an ignored alarm class = flood
  returning); channel-agreement stats from the arbiter.
- **Working when:** every doorbell produces an action; no alarm class ignored twice.

### The system-level gauge (how you know the SHOP works, not the parts)
One sentence, measurable monthly: **reservoir drain rate rises while Josh-hours stay
flat, and the silent-third-state count stays zero.** Those two numbers are the whole
thesis. Everything above is plumbing for them.

---

## Part 2 — The decision, made explicit

### What you are actually deciding
Not "adopt the framework" — you built the framework. The verdict at your gate is:
**commit factory time now — roughly 4–6 working days across A2–A6 — before continuing to
drain product items, and accept blocking gates that will sometimes refuse your own
work.** That second clause is the real teeth: warn-never-block is how tax.jsonl stayed
empty; block means friction, including friction against you.

### What you gain
- **Trusted parallel async** — the stated goal. Reservoir drains over weeks at
  min(frontier, rope) with you at four stations.
- **Compounding rent**: every future unit pays less papercut tax; the infra is
  file-based and vendor-free, so it survives model churn — your binding constraint
  honored by construction.
- **Instrumented trust**: certification by measured TAX per class, revocable, model-
  agnostic. Trust survives switching providers because classes re-certify empirically.
- **Constellation advances for free**: A6 is Rumen R3's prototype; A5 starts the cud
  stream Rumen's metabolism needs. Factory work and research agenda converge instead of
  competing.
- **Your attention back**: admission, staleness-checking, and release-reading stop
  consuming the synapse hours that currently serialize everything.

### What you lose / risk
- **4–6 days of product momentum** during active client work with a Friday deadline.
  This is the real cost and it is not small for a solo operator.
- **Gate friction, guaranteed early**: false refusals will happen before thresholds
  settle (R9). The failure mode is not the friction — it is you disabling the gate in
  irritation, which trains distrust and is worse than never building it.
- **Owned surface grows**: a walker, a hook, a schema — small, but yours forever. (Each
  has a named mechanical consumer by design, so none can rot silently like tax.jsonl —
  but they can still break loudly.)
- **The R3 gamble**: if correction-tax turns out to be unmeasurable noise, certification
  loses its instrument and envelope promotion reverts to judgment. (A6 prices this risk
  for half a day before anything depends on it.)
- **The null alternative is genuinely viable**: lit-parallel shipped 37 commits
  yesterday. You can keep paying the synapse tax. But nothing about that path changes
  "I can't trust the system," and its throughput ceiling is exactly one Josh.

### Recommendation
Commit **A6 tonight** — half a day, read-only, zero risk, and it prices everything else
while closing a Rumen backlog item. Then **A0+A2+A3 as the next unit** (≈2 days — the
keystone), which fits before Friday without endangering client work. Hold A4/A5 until
Friday clears. Run A7 the following week against the A6 prior. One unit at a time,
one PR each, through your own gate — the sequence obeys branch-first and
one-task-one-branch rather than arriving as a monolith, and the colleague-gated month
means part of the reservoir cannot proceed anyway: this IS the natural factory window.

The single most load-bearing early signal to watch: **A3's first true catch.** The day
the gate refuses a brief because a sibling unit landed and moved its inputs, the MVCC
thesis is proven on your own repo, and every subsequent investment is de-risked. If a
month passes with zero true catches and steady false refusals, the thesis is wrong and
you should say so as loudly as I said it — the instruments will make that visible either
way, which is the point.
