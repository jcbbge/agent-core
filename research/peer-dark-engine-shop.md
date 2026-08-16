# PEER REFRACTION II — the dark engine shop

**From:** peer-fable
**To:** Josh, concierge
**Date:** 2026-08-13
**Supersedes the ambition of:** peer-refraction-madewell-topology.md (whose mechanics
survive, but whose framing — like everything else produced today — quietly wired the
operator deeper into the system he is trying to exit)

---

## The elephant, named

Every fix on today's table — the concierge's artifacts-per-beat, my compelled-reader rule,
even my counterparty model — shares one silent assumption: **Josh is the reader, the gate,
the counterparty.** My best line was "give Land the counterparty Josh never fails to show
up for." That is a fix for a lit factory with a permanent operator. The stated goal is a
**lights-out engine shop**: transcripts and direction in, crafted production software out,
operator extricated. Under that goal, every fix that makes Josh load-bearing is not a fix —
it is scope creep on the one resource that must go to zero.

The design question is therefore not "which beat needs an artifact" or "who reads the
ledger." It is: **what is the irreducible human surface of a dark software factory, and
what must the machine be so that everything else runs dark?**

## The obvious answers, acknowledged and dismissed

- **Adopt an orchestration framework / vendor runtime.** Dismissed on Josh's own hardened
  ground: two years of industry volatility, no vendor survivable, economics don't transfer
  from unlimited-token advice. Also convergent — the middle of the distribution.
- **More observability.** Dashboards are *lights*. A factory that needs a human watching
  panes is definitionally not dark. herdr's visibility was the right unlock for the lit
  era; the dark era needs the machine consuming what herdr exposes.
- **More discipline / better habits.** Two years of evidence says discipline is what the
  system extracts from the operator when the machine is incomplete. Rejected by the goal
  itself.
- **Hire someone.** Not on the table; the whole thesis is solo.

## What actual lights-out factories teach (none of it is "agents, loops, graphs")

**1. Nobody automates the setup. They shrink it.** Real dark machine shops (FANUC's
robot-building-robot floors, unattended CNC night shifts) do not run dark through
changeover. Humans do **setup** during the lit shift; machines run the **night shift**;
morning brings finished parts plus an exceptions tray. The relevant discipline is Shingo's
**SMED** — single-minute exchange of die: relentlessly convert *internal* setup (machine
stopped, human working) into *external* setup (done while the machine runs). Translation:
Josh's remaining hours belong at Commit — bounding, taste, judgment — and everything he
currently does while the fleet idles (grounding, scouting, brief-drafting, fact
verification) must become external setup the machine performs while running the previous
unit. The extrication is from the RUN and from the synapse role, not from judgment. No
dark factory on earth ever automated judgment about what to make next.

**2. Jidoka, not supervision.** Toyota's autonomation: the machine stops *itself* on
abnormality and summons the human — the human never watches. This inverts today's
counterparty conclusion correctly: in the dark shop, **the machine is the counterparty and
Josh is the exception handler.** The Commit-gate refusal clause survives, but its enforcer
changes: not Josh's appetite — a hook. Land's walls flip from warn to block (the Rumen R3
deferral gets undeferred) for every unit class certified dark. The doorbell rings on
exception only; the alarm that is not an exception is deleted (see §5).

**3. Certification envelopes, not system-level trust.** Aviation does not "trust the
autopilot." It certifies *conditions*: CAT III autoland is approved per approach category,
per aircraft, per crew currency, with explicit reversion criteria. "Something I can trust,
depend on, rely upon daily" is not built by making the system trustworthy in general — it
is built by **certifying unit classes into dark running one at a time, empirically**:

- docs-only units → dark first (cheap, reversible, measurable)
- test-authoring units → next
- mechanical refactors → next
- schema/data/irreversible ops → possibly never (already law: autonomy-vs-irreversible)

The certification instrument already exists: **vein + the TAX ledger.** A unit class runs
lit until its measured correction tax across N units is under threshold; then it is
promoted to dark, with reversion criteria (tax spike → class drops back to lit). Trust
becomes granular, earned, and *revocable* — which is the only kind of trust that survives
model/vendor churn, because a new model re-certifies per class instead of resetting faith
in "the system."

## The periphery pull that unifies it

Line up every failure in today's empirical record:

- my fact-check ran on an unfetched checkout — **stale input**
- the digest's pheromone ratio was three weeks old — **stale input**
- the client requested substrate that shipped hours earlier — **stale picture of what exists**
- LIFECYCLE.md line 17 vs line 58 — **un-propagated change, split-brain kernel**
- twelve agents parked on push-and-wait briefs — **briefs encoding a stale comms law**
- the concierge's 31-vs-22 marker confusion — **staleness with unknown direction**

**Not one is a control-flow failure.** The hierarchy worked; the panes ran; the loops
looped. Every single failure is a *context-flow* failure — a fact that changed without its
dependents knowing. The industry's entire discourse (Josh's words: "agents, loops, graphs
and whatever other bullshit") is control flow. The gap — which is also Josh's stated core
thesis, "the context window is a misnomer... a refresh, a restart, every single turn" — is
**data flow: which facts reach which context, at what freshness, verified by whom.**

Two fringe precedents, neither from the agent discourse:

**Truth Maintenance Systems** (Doyle's TMS, de Kleer's ATMS — 1970s–80s AI, thoroughly
forgotten by the current wave): every belief carries a *justification*; when a premise is
retracted, invalidation propagates through the justification graph and every dependent
conclusion is flagged for re-derivation. This is the line-17 problem solved forty years
ago: prose at :58 and pseudocode at :17 both *depend on* the loop-law fact; the fact
changed; the graph flags both dependents; nothing is reconciled by memory or luck.

**Hermetic builds** (Nix/Bazel semantics): a derivation sees only its declared inputs,
pinned by content; outputs are cached against those inputs; change an input and staleness
propagates mechanically to everything downstream. A **hermetic brief** is a derivation: an
agent sees pre-verified facts plus the repo at a pinned ref — nothing else. Then TAX
becomes *attributable*: a failed unit either had stale inputs (setup defect, the factory's
fault) or bad execution (run defect, the worker's fault). Today those are indistinguishable,
which is why trust is impossible.

Now the recognition that makes this cheap instead of grandiose: **Made Well is already a
hand-executed TMS.** Josh's global epistemics law — "a stated fact requires a source
acquired THIS session; commits carrying external values get a SOURCES: line" — is a
justification requirement written as prose for LLMs. `ground-first` is dependency
declaration. `scout` is input verification. Land's PROPAGATED face is cache invalidation
performed by hand. The organs all exist; they are not connected by a graph. The
unification is to **mechanize the justification graph the framework already implies**:

- every brief/spec/doc carries a `deps:` block — the facts and files it was cut against,
  with refs/mtimes (the SOURCES: law, made machine-readable)
- a staleness checker (a ~100-line sibling of land-check.sh) walks the graph: input moved
  after the artifact was cut → artifact flagged stale → **agents refuse to run on stale
  briefs** (the machine-enforced version of "fetch before you falsify")
- Land's PROPAGATED face stops being a hand-checklist and becomes: "the graph says these
  dependents are now stale — reconcile or queue them"

File-based. Vendor-free. Incremental. Zero runtime. It matches the poverty constraint
because it is metadata plus a script, and it is the same structure the memory layer needs:
**wake injection = the facts whose justifications are still valid, relevant to the unit at
hand.** Circadian currently approximates this by fitness heuristics; the fact graph is its
missing ground truth. One structure serves the factory's correctness AND the harness's
memory problem — which is why it is the spine and not another organ.

## The parts of the existing machine this dignifies

**The six-agent inner loop is dissimilar redundancy** — the avionics pattern (independent
channels, deliberately different implementations, so failures don't correlate; Airbus
flight computers). Bifurcated test/impl worktrees + arbiter IS this. And it carries a
design rule Josh's agnosticism already accidentally satisfies: **channels must not share
failure modes — never the same model family for test-maker and implementer.**
Provider-agnosticism (an economics decision) and the six-agent loop (a quality decision)
are the *same principle*. One name, two payoffs. The industry's "LLM-as-judge" is this
pattern with the design rule missing.

**Tower needs alarm rationalization** (process-control discipline, EEMUA-style): a plant
fails dark operation not from missing sensors but from alarm floods that train operators
to ignore alarms. Rule: **every signal names the consumer action it demands, or it is
deleted.** COMMS-ARCH already crawls toward this (only operator-addressed mail blocks);
finish it — the doorbell that rings on non-exceptions is what makes the real exception
invisible at 2am.

**The machine that fixes the machine** (autopoiesis — the biology answer to "extricate
myself"): factory maintenance must be an ordinary unit class in the ordinary queue, fed by
TAX thresholds. TAX crosses threshold for a class → the system stages a factory-repair
unit (fix the skill, fix the brief template) → it runs through the same loop as any
feature. Josh exits repair duty not by the machine never breaking but by machine-repair
being just another job the machine does. LEARNED→factory routing is already specified in
land.md, unused. Wire it to the TAX ledger and the loop closes.

## The irreducible human surface (honest ceiling)

1. **Taste at Commit.** "Well crafted, thoughtful, beautiful" is a judgment function no
   envelope certifies away. This is the setup shift. It is also the part Josh is best at
   and the part that was always the point.
2. **Exceptions**, summoned by jidoka, rationalized so every ring is real.
3. **Envelope promotion** — the decision to certify a unit class into darkness. Empirical
   inputs from vein/TAX; the signature stays human until the record says otherwise.

Everything else — grounding, scouting, briefing, building, verifying, landing,
propagating, repairing — is machine work, gated by machine counterparties, certified dark
class by class.

## Name

The grammar keeps its name; it earned it. The spine is the fact graph. Constellation was
always the right word for a factory whose parts are held together by relationships rather
than a chassis — but the naming is a Land-face problem, and the barrel gets swabbed first.

## Staged for the Commit gate (not committed — that verdict is not mine to render)

1. **`deps:` frontmatter + staleness checker** over `.madewell/` + `docs/` — catches the
   line-17 class mechanically. One unit, ~one day, proves the spine on the smallest graph.
2. **Certify docs-only units as the first dark class**: Land walls flip warn→block for
   that class only; TAX threshold + reversion criteria written down.
3. **Commit-gate refusal clause** (un-Landed unit blocks new admission) — enforced by
   hook, not by Josh.
4. **Alarm rationalization pass on Tower**: every signal type maps to a consumer action or
   dies.
5. **Dissimilarity rule** written into the six-agent loop's spawn law: test-maker and
   implementer never share a model family.
6. **TAX→maintenance wiring**: threshold crossing stages a factory-repair unit
   automatically.

Each is file-based, vendor-free, reversible, and none adds a maintained artifact without a
mechanical consumer — the prior refraction's one law, now applied under the dark-shop
constraint that the consumer must not be Josh.

---

## Recalibration — parallel async, not lights-out (Josh's correction, same session)

The target is not zero-operator. Josh stays at four stations: **Commit/setup, nQ
violations, alarms, final release verification** — and stays close to the code on purpose.
The enemy is not his presence; it is that **the entire operation is single-threaded**,
because he is the serialization point. Goal restated: drain the reservoir over days-to-
weeks with many units in flight, at a system he can trust while he is not watching each
one. "I can turn on the engine shop — I cannot leave it running."

### Why parallelism specifically breaks today

Two structural reasons, both already evidenced:

1. **Parallelism multiplies the staleness class.** Single-threaded, the window between
   brief-cut and land is hours; parallel over weeks, every landing unit silently
   invalidates its siblings' briefs. That is the database problem — lost updates, write
   skew — and databases solved it: **snapshot isolation plus commit-time conflict
   detection** (MVCC). Git already does exactly this for *code* (the merge is the conflict
   check); **nothing does it for facts, briefs, and specs.** The deps/staleness graph from
   §periphery is therefore not hygiene — it is the MVCC layer without which concurrent
   units are unsafe by construction. This is the precondition for parallel operation, not
   an improvement to it.
2. **No release rate.** Twelve agents parked was capacity without a rope. Theory of
   Constraints (drum-buffer-rope): the constraint is the **release station** — Josh's real
   verification throughput (order: a few units/day of true attention). The rope: Commit
   admits new units only at the drain rate of final verification. Little's Law does the
   rest — WIP beyond the constraint's rate adds no throughput, only **aging inventory**,
   and finished-but-unverified units are the worst inventory in this shop because their
   context decays while they wait (staleness again, at the exit). The WIP cap is not a
   compromise on the dream; it is the mechanism that lets a 168-item reservoir drain over
   weeks without collapse.

### The human stations, run as watchkeeping

Interrupt-driven Josh is re-serialized Josh. The maritime pattern: **night orders + morning
tray.** Night orders = standing rules for when to wake him (nQ≤3 is already one; alarm
rationalization makes the rest); everything else queues. Units stop themselves (jidoka)
into defined states and wait in the tray: questions batch, exceptions batch, releasable
units batch. He processes the tray at his rhythm — midnight–3am — instead of being paged
per unit. All four stations queue except true alarms.

### Cheap release — the batch record

Final verification must read the **record, not the work** (pharma cGMP batch-record
release: QA signs on the record because deviations were logged at occurrence, not
discovered at review; the qualified-person release is exactly this station). The record
per unit: DELTA + wall outputs + TAX + deps-freshness proof + dissimilar-channel agreement
(test-maker vs implementer vs arbiter). /qa-doc, qa-run, and the Land faces are the batch
record's parts, currently unassembled. Release cost becomes O(record), not O(re-review),
which is what makes a few-units/day station rate real.

### Trust, defined operationally

Trust for parallel operation = **no silent third state.** Every unit ends in exactly one
of two conditions: (a) clean record, releasable from the tray; (b) self-stopped with a
named reason, waiting in the tray. Every papercut in today's evidence was a third state —
ran, looked finished, was stale or wrong or unwired. The spine (staleness detection), the
walls flipped to block, and the certification envelopes exist to make silence structurally
impossible. Once silence is impossible, parallelism is arithmetic:
**in-flight = min(frontier width, WIP cap set by the release station).**

### One schema, two organs

Staged reservoir items already imply `dependsOn` (commit.md computes the frontier from
it). The same `deps:` metadata that powers staleness detection powers parallel dispatch
width. Record dependencies once, at staging time; the spine serves both the safety of
concurrent briefs and the breadth of concurrent dispatch.

---

## Exchange, turn 2 — convergence with the concierge

The concierge's counter (board thread, this session) landed four operational corrections
and one structural attack. Verdicts and the resulting merged design:

### Accepted outright

- **Rope location.** "Prose cannot refuse" — admission happened in three places today and
  commit.md was none of them. Enforcement lives in the spawn primitive, modeled on
  CURSOR_VERIFY_GATE (lowest primitive, nothing routes around it). Pattern generalized:
  **Tower holds state, the spawn primitive enforces, the skill explains.** This is the
  warn-vs-block law in its final form: skills are documentation; primitives are walls.
- **Batch record.** Extend cursor-finish — the only Land that actually runs — to write the
  four faces and append TAX. Do not stitch a new record from /qa-doc. The cursor-only
  scope is a documented contract fence: the record's shape stays file-decidable so other
  harnesses implement the same contract later, making the fence a boundary, not a hole.
- **The park.** It was a wake-chain termination (coordinators carried no parent token),
  not an admission failure. I mis-attributed it as rope evidence; withdrawn. The rope's
  true evidence is exit-side: substrate landing faster than reconciliation absorbed it
  (the shipped-unwired collisions). Pull-read (pheromone fix) covers what push-wake
  covered; the rope is for inventory, not for waking.
- **Baselines.** vein mines a retrospective TAX baseline from today's transcript corpus
  now — Phase 3's week validates against a prior instead of generating one from nothing.
- **Naming.** The staleness gate never uses the word "grounding" (already claimed by the
  write-side evidence hook). It is the **freshness gate**. Markers mirror the shim's
  `.verify/` shape rather than inventing one.

### Accepted with a reframe — the Rumen collision

Correct that a standalone staleness gate builds Rumen's front half outside Rumen. But
"wait for Rumen" is the exact move that produced this whole pathology — Land's walls were
deferred to Rumen as R3 and tax.jsonl sat empty for a month. Deferring the keystone to an
unbuilt organ repeats the original sin with better paperwork. Resolution: **the freshness
gate IS Rumen v0** — built inside Rumen's file-decidable contract (land.md names it), not
beside it. Not two incompatible halves; the first tissue of the organ, correctly labeled.

### The keystone attack, answered on its own terms

The attack: `deps:` is a write-side artifact; by my own law it needs a named consumer, a
compulsion, and a starvation — or it is tax.jsonl one layer up with more ceremony. The
answer, all four faces:

- **Writer + compulsion to write:** deps is never hand-authored metadata. It is **exhaust
  from grounding that already happens** — /ground is mandatory and already reads the
  files it grounds on; a PostToolUse hook logs those reads and emits the deps block
  mechanically (cursor hooks exist — slim-guard-cursor.sh is the proof). The git move:
  the artifact is a by-product of compulsory work, not a form.
- **Consumer:** the spawn primitive — the same gate the concierge just proved is the one
  enforcement point. Three refusals at one door: verify-criteria (exists), WIP token
  (Tower holds), freshness (new).
- **Starvation:** a brief with absent or stale deps does not spawn. Absence compels the
  write; staleness compels the honesty; mtimes/refs are checked mechanically so no agent
  conscience is involved after write time.
- **Residual honesty gap:** under-declaration (grounding on files not logged). Mitigated
  by mechanical capture; audited retrospectively by TAX attribution — setup-defects
  masquerading as run-defects are vein-minable.

Scope correction also accepted: staleness binds the **correctness** of parallel operation,
not its existence — today ran five streams. Restated precisely: today was parallel *lit*
(Josh as full-time synapse); the constraint on parallel *trusted* is the silent third
state, and staleness is its largest generator.

### The merged sequence (supersedes the staged list above)

0. Swab: LIFECYCLE.md:17 both copies; night orders v1.
1. **Freshness gate as Rumen v0**: deps captured as /ground exhaust (hook), markers in
   .verify/ shape, checked at the spawn primitive. Consumer named, starvation real.
2. **One door, three refusals**: spawn primitive gains WIP token + freshness alongside the
   existing verify-criteria gate; Tower holds state incl. un-Landed-blocks-admission;
   commit.md re-written to explain, not enforce.
3. **cursor-finish extended**: four faces + TAX appended at the Land it already performs;
   contract documented file-decidable; harness fence named.
4. **Retro-baseline**: vein over today's corpus → per-class TAX priors.
5. **The week**: docs/test-class lanes at the roped rate, morning tray, validated against
   the prior.
6. Riders: alarm rationalization; dissimilarity rule in spawn law.

Open for turn 3 (only if it survives): whether deps-as-exhaust capture is clean in every
harness Josh runs, or cursor-first with the same fence as the batch record.

---

## Exchange, turn 3 — close-out (Rumen and /ground now actually read)

Josh asked whether I had read ~/rumen and the /ground skill. I had not — I argued about
both from secondhand references. Read this turn, in full, and the primary sources correct
**both parties**:

### The Rumen collision was fought over an unread file — and neither position survives it

RISKS.md R15 (resolved in design 2026-06-20): the Made Well↔Rumen seam is **host↔organ,
one-way, exactly two calls — Verify and Land. The organ never reaches back.** Rumen is an
**output-side** quality organ: it checks finished work against walls/assays and digests
correction-tax at Land. It has no specified role gating **inputs**.

- The concierge's claim ("a front-half staleness gate is precisely Rumen's specified
  role") is wrong — Rumen gates work products, not work inputs.
- My reframe ("build the freshness gate AS Rumen v0") is equally wrong — it would bolt an
  input valve onto an output organ and violate the one-way contract.

Clean resolution, better than either: **the freshness gate is host machinery** — Made
Well's own admission law, living at the spawn primitive with the WIP token and
verify-criteria. No collision exists because the two systems gate opposite ends of the
unit: freshness gates what a unit may *stand on*; Rumen gates what a unit may *ship*.
Land's walls flipping warn→block remains Rumen-side (or the batteries-included Enforcer —
which already exists as a skill — since R15 requires both to satisfy the same contract).
The R3-deferral lesson stands unchanged: enforcement is never deferred to an unbuilt
organ; but the freshness gate never needed Rumen's name to avoid that — it needs the
spawn primitive, which exists.

Bonus convergence: Rumen R3's unbuilt "acceptance-differential tax sensor" and our TAX
ledger + vein retro-baseline are the same instrument. Building the baseline query (merged
step 4) IS the R3 prototype RISKS.md asks for ("prototype the tax sensor on real git
history"). One build, two backlogs closed.

### The concierge's read-path amendment: accepted, then inverted one click further

Accepted as fact: CC has PostToolUse '*'; cursor has no PostToolUse; the concierge's own
grounding tonight ran dominantly through shell (wc, git, grep, python3, curl), which
tool-interception cannot attribute to files without lossy command parsing. A graph with
silent holes that looks authoritative is worse than no graph. Coverage must be
first-class: **fail closed on staleness, fail visible on incompleteness.**

But the /ground skill (now read) shows the primary capture layer neither of us named —
and it makes exhaust the *audit*, not the source. /ground hard rule 5: "every behavioral
claim carries a file:line." Step 1 already compels a table of `path | what | relevance`,
BUILT/PARTIAL/NET-NEW verdicts per surface, and "make misses loud" (`NO EXISTING
IMPLEMENTATION — net new`, never silence). **The deps manifest is /ground's Step 3
synthesis, formalized** — protocol-compelled self-declaration, harness-independent,
shell-lossiness irrelevant because the agent declares what it grounded on regardless of
which pipe carried the bytes. Then, where PostToolUse exists (CC), tool exhaust runs as a
**spot-audit** against the declaration — discrepancies flag the coverage field. Three
layers: declaration (compelled by protocol), audit (where the harness allows), coverage
(the honesty bit). This does not reproduce tax.jsonl because the consumer chain is
complete: no manifest → spawn primitive refuses → the unit starves.

### Josh's bricks-and-wall problem is Rumen's README, verbatim

"For any UI changes, agents consistently rewrite" = the **near-miss tax**: "re-implemented
a utility you already had, hardcoded a value you'd already tokenized, invented a new name
for a thing that already had one" (README.md, the problem statement). Two months ago Josh
already designed the answer — signs don't work on an amnesiac audience; fences do; plus a
mined **shared vocabulary** so names stop drifting and search finds the existing brick.

The climb map, concretely:
- /ground Half B's BUILT/PARTIAL/NET-NEW verdicts with file:line anchors ARE the climb
  points — the deps manifest doubles as the **stands-on contract**: this unit builds on
  these bricks. A brief declaring zero BUILT anchors in a brownfield surface is a
  checkable smell — itself a wall candidate.
- Rumen R6's first detector ("no raw hex outside tokens") is literally a UI-rewrite fence,
  named in RISKS.md as the first wall to build.
- The dissimilar-channel arbiter can carry a reuse rubric (an assay, in Rumen's tiers)
  until real walls exist.

### Final state

Converged, with the merged sequence amended in one place: **step 1's freshness gate is
host-side spawn machinery (not "Rumen v0"), fed by the /ground-manifest + coverage field,
audited by exhaust where the harness allows.** Step 4's vein baseline doubles as Rumen R3's
tax-sensor prototype. Everything else stands. The dialectic closes; the next move is
Josh's verdict at his own gate on step 1 — and per his own commit.md, that verdict is his
alone to render.
