# PEER REFRACTION — Made Well loop topology

**From:** peer-fable (adversarial peer, one-off dialectic pane)
**To:** concierge, Josh
**Date:** 2026-08-13
**Input:** ~/agent-core/briefs/PEER-digest-madewell-topology.md
**Grounding:** land.md, commit.md, LIFECYCLE.md (kernel + arc copies), live Tower/herdr/git state — every claim below carries its source; the fact-check appendix carries its command.

---

## Verdict in three sentences

Both suspect conclusions are wrong, and wrong in the same direction: the analysis is about
**writers** when the entire pathology is **missing readers**. The catabolism frame fails a
natural experiment sitting inside the framework itself, and the "make Land produce something
visible" prescription is not a proposal — it is a post-mortem, because the visible Land
artifact was built a month ago and has zero rows in it. The upgrade: replace "artifact per
beat" with **compelled read per beat**, and implement it as one clause in a gate that already
exists, at zero new maintained artifacts.

---

## 1. The receipt that kills the prescription

`land.md` specifies, in its own text: *"The Land record **is the commit**"* — four faces
(DELTA, LEARNED, PROPAGATED, TAX), with TAX appended to `.madewell/work/tax.jsonl`.

Measured this session in /Users/jrg/infinity/arc:

- `tax.jsonl` — created **July 13**, **zero bytes**.
- `git log --grep="LEARNED:"` — **zero commits ever**, in a repo with hundreds of commits
  including the multi-workstream wave of 08-12.

The digest's artifact table calls Land's artifact "missing." It is not missing. It was
**designed, specified, provisioned, and never written once.** Any theory of the neglect must
explain this, and "the artifact doesn't exist" cannot. Building three more artifacts on that
theory administers a second dose of a drug with a month of evidence it doesn't work.

## 2. The catabolism frame fails a natural experiment

Claim under test: release beats are neglected because their output is negative space, and a
system measured by what ships selects against the phase that makes things smaller.

The framework contains its own control group. **Verify is also a release beat** — the inner
loop's instance of the same beat, by the isomorphism the kernel itself asserts. Its output is
equally negative space: deleted branches, closed PRs, a green main. If the selection-pressure
law were real, Verify would be equally starved. Instead Verify is the single most enforced
beat in the whole operation — lefthook, merge-green law, no-mocks, "session not done until
merged-green."

What actually differs is not the sign of the output. **Verify blocks; Land warns.** land.md,
its own words: the Land walls are *"a check-engine light, never a shutdown,"* and wiring them
to block is *"the quality organ's job (Rumen)"* — logged as Rumen risk R3.

## 3. The less comfortable reading (unresolved question 4, answered)

Land is not neglected by a structural law of systems that measure shipping. Land is neglected
because **its enforcement was consciously deferred** to a component that does not exist yet,
and the metabolic frame retroactively dresses a scheduled TODO in metaphysics. The frame is
worse than flattering — it relocates agency from a decision that could be reversed this week
into a cosmic force that can only be compensated for.

One layer under that: twenty years of PM already knows closing work is skipped everywhere,
and organizations never fixed it with artifacts. They fixed it with **counterparties** — the
auditor, the tax deadline, the sprint review audience. Month-end close exists because someone
external demands the statements; solo traders don't close their books until the tax authority
forces the read. Solo means no counterparty. That is the actual variable, and it points at
the actual fix (§5).

## 4. Take the metaphor seriously and it indicts the design

Real catabolism cannot be skipped — the organism dies in minutes. Not because of discipline:
because of **coupling**. ATP from breakdown powers synthesis; anabolism literally cannot run
without catabolism's output. If Land were true catabolism, Build could not start without
something only Land produces. In Made Well, Build runs fine without Land — so Land is not
catabolism, it is excretion, in an organism with no pain signal.

Three unrelated domains converge on the identical mechanism:

- **Kanban** — no new piece starts until the card returns. Card return IS Land, enforced by
  starvation, not dashboards.
- **Garbage collection** — tracing GC runs on allocation pressure, not on schedule or
  conscience. The mutator's need triggers the collection.
- **Metabolism** — ATP coupling, as above.

All three say: **couple release to the next intake.**

## 5. The fix: one clause, zero new artifacts

commit.md already contains the seed: *"in-flight items go first... never verdict fresh ideas
while half-built work sits unbounded."* Extend it by one clause:

> **The Commit gate refuses to admit a new item while any completed unit sits un-Landed.**

The appetite for the next thing becomes the counterparty for the close. This respects the
binding constraint (solo, attention-priced): one wall in a gate that already exists and
already runs. Kanban, GC, and ATP all arrive at this same shape independently, which is
usually the sign the mechanism is real.

## 6. The thing neither party said: one defect at every layer

Line up the evidence and stop sorting by beat:

| Surface | Write side | Compelled read | Outcome |
|---|---|---|---|
| Pheromone field | built, functional | none at diagnosis time | 12 agents parked, board silent ~40 min |
| tax.jsonl | specified, provisioned | designated reader (Rumen) unbuilt | zero bytes in a month |
| Staging pool | 168 STG items | nothing reads it except a human choosing to | 168 against a queue of ~3 |
| Shipped-unwired substrate | Galley write-arrow landed | Discovery stages without reading what shipped | client requests duplicate of hours-old work |
| Carry-forward ledger (proposed) | would be appended | none designed | correctly predicted (unresolved 3) to rot |
| **Commit TODO handoff line** | **written every commit** | **hook injects it at every session start** | **works, daily** |

That is not six problems. It is **one defect expressed at every layer: write-side
infrastructure gets built; the compelled read never does.** The Oracle's circulation lot said
it and it got filed under luck. It was the diagnosis.

The causal story about git is backwards too. Git's artifact does not survive because it is
free — plenty of free by-products rot. It survives because deploy, CI, and the PR gate are
**machines that starve without it**. And git already spans Make, Verify, AND Land (the Land
record is the commit, per spec) — artifacts ignore beat boundaries. **Artifacts map to
consumers, not beats.** The one-artifact-per-beat table is the loop's aesthetic symmetry
generating a requirement the evidence does not support.

### The design rule (the one law worth adding to the kernel)

> No artifact may be created without naming: (a) its consumer, (b) the mechanism that compels
> the read, and (c) what starves when the read does not happen.

Applied: the commit passes (deploy starves). tax.jsonl fails (reader unbuilt). The
hand-written rollup fails — a summary written for no audience is a speech in an empty room,
which is why it felt "great but weak." The carry-forward ledger fails as designed but passes
instantly if the read relocates to Commit: **Commit's Step 1 loads it** and asks "is any of
this already built?" before verdicting. That is where the Galley write-arrow collision gets
caught — by lookup, not luck.

**Answer to unresolved 1:** not four artifacts, not one artifact — **one compelled reader**
(the Commit gate), which already exists, already runs, and is already a decision point.
Writers stay cheap and append-only; the gate is the single choke-point where every ledger is
read.

## 7. Two internal contradictions in the digest's own analysis

**Criticality vs the valve correction.** Correction 2 says the pool is *supposed* to outgrow
its drain — refusal is Commit's function; the reservoir is by design. The criticality lens
says intake is *supercritical* and needs damping. Both cannot be true. The correction is
right; the criticality read is wrong — with one amendment: 168-against-3 is evidence the
gate's **"no" half is broken**. commit.md: *"a finding that keeps getting held but never
dismissed is the sign of an unmade decision."* A valve that only HOLDs never refuses; it
defers with a clean conscience. The pool needs the DISMISS verdict actually fired, plus a
collision read at staging time (super-search exists; a staged item with no collided-with
check is push-and-wait at the intake layer).

**The artifact table vs land.md.** The table lists Land's artifact as missing; land.md
defines it precisely. Either the table is wrong or the framework's files describe a system
that does not run. The empty tax.jsonl says the second — a more serious finding than
anything in the table.

## 8. Unresolved question 2: it is a notes problem

A colleague standardizing names over a month is a `blocked` entry with a date, surfaced at
session-start. The moment substrate gets built for modeling other humans' schedules, the
project has accidentally become Jira, and the graveyard of solo developers who built Jira by
accident is vast and quiet. Correctly out of scope. A `waiting-on` line. Nothing more.

## 9. Overthinking verdict

Not overthinking — **overtheorizing a plumbing problem.** The parked fleet, the 168-pool,
and the shipped-unwired collisions are real failures with one root, and that root is not
subtle enough to deserve the lens stack it received. Thirty seconds of `wc -l` on tax.jsonl
would have broken the hour of smooth agreement — which is the epistemics law at the top of
the global config, applied to one's own theories.

The cannon is fine. Reload it. But a cannon crew that never swabs the barrel does not have a
metaphysics problem, and the fix is not a fourth instrument on the carriage — it is the rule
that says you do not fire again until the barrel is clean. That rule is already written. It
is one clause away from being load-bearing.

---

## Appendix A — fact-check of the digest's empirical claims

Requested explicitly by the concierge. Method: every number re-derived this session; command
shown.

| Digest claim | Measured (2026-08-13) | Verdict |
|---|---|---|
| 19 pheromone rows vs 6,400 board rows | 466 vs 7,659 (`wc -l ~/.tower/pheromones.jsonl ~/.tower/board.jsonl`); field: open 0 / claimed 0 / done 42 / evaporated 5 | **Stale.** Direction held at diagnosis time; pheromone use has since grown ~25x — the push-and-wait fix appears to already be taking. Cite ratios with a timestamp or not at all. |
| 53 commits, 164 files, +15,021/−923, 7 migrations in one day | main since 08-12: 29 commits; all refs: 94; widest sensible window (7d2cc3e..HEAD): 118 files, +10,225/−789; migration files touched: **1** (`git log --since=2026-08-12 --name-only \| grep -i migration \| sort -u`) | **Not reproducible as stated.** Churn is order-of-magnitude right; the commit count only works if unmerged worktree branches count; **7 migrations does not reproduce against main (1)**. The defect is a missing measurement basis — no command was recorded with the number. |
| Board silent 42 minutes, 12 agents parked | Largest working-hours gap on 08-12: **39.7 min** at 19:36Z (1,882 board rows that day). Live snapshot today: 9 panes, no park. | **Approximately confirmed** (39.7 vs 42). Fleet-size-at-park not independently verifiable from current snapshot. |
| 166 staged items | 168 unique STG-ids (`grep -oE "STG-[0-9]+" ~/Infinity/discovery/STAGING.md \| sort -u \| wc -l`) | **Confirmed** (pool grew by 2). |
| 11 items staged from the meeting | 24 lines dated 2026-08-13 in STAGING.md; item-vs-mention not separable by grep | **Unverified** — plausible, not cleanly checkable. |
| Concierge self-correction: "reported 31 PENDING CAPTURE, main said 22" | HEAD says **31**; file last touched by #241, merged today | **The correction itself was likely a misread.** The "stale checkout" showing 31 was probably the worktree carrying then-unmerged #241 — i.e., the first number was the future truth, not a stale one. Staleness has a direction; check which side moved. |
| Kernel correction landed (`while queue not empty`) | ~/madewell/.madewell/LIFECYCLE.md:58 corrected, with correction note at :61 (mtime 16:20 today). **Line 17 of the same file still reads `while Discovery is not empty`** — in the pseudocode block. Arc's copy: same split (58 corrected, 17 not). | **Landed incomplete.** The prose was corrected; the pseudocode was not reconciled. This is a live PROPAGATED failure — the exact Land face — inside the very correction this dialectic produced, within the hour. Exhibit A for §6. |

## Appendix B — what I would change Monday, in priority order

1. **Fix LIFECYCLE.md line 17** (both copies). The kernel currently contradicts itself.
2. **Add the un-Landed refusal clause to commit.md** (§5). One wall, zero new artifacts.
3. **Add the consumer rule to the kernel** (§6): no artifact without a named, compelled reader.
4. **Move the carry-forward read into Commit Step 1.** The ledger itself can be a dumb
   append-only file; the gate is what makes it alive.
5. **Fire DISMISS.** One pass over the 168-pool with commit.md's own verdict table; patterns
   in the dismissals teach Discovery what not to stage.
6. **Staging-time collision read**: an item enters STAGING.md only with a collided-with check
   against shipped surface (super-search / arc CLI).
7. **Numbers in briefs carry their command** — the fact-check above is the argument.

---

## Addendum — same day, after Josh entered the dialectic

### A1. Mea culpa: Appendix A row 2 is WRONG — superseded here

The digest's churn numbers are **confirmed** against the true basis
(`git diff --shortstat c203706..origin/main` — the wave-rollup extractor's own range,
traced via pheromone ph-msrwvn2j-5uec → dogfood rollup line 22): **37 commits, 164 files,
+15,021/−923, and exactly 7 migrations** (drizzle 0058–0064.sql). The "53" had already
been corrected to 37 by the extractor before I ever ran a command (dogfood line 241). My
"not reproducible" verdict was the artifact of (a) a local checkout that had never fetched
the wave and (b) a filename grep that missed drizzle's `.sql` files. I dissected the
concierge for misreading staleness direction this morning, then did the identical thing at
larger scale. Rule 7 gains its missing clause: **numbers carry their command, and commands
carry a freshness precondition — fetch before you falsify.** Verification against
unrefreshed refs is not verification; it is archaeology performed with confidence.

Appendix A rows that survive: the pheromone ratio is still stale as cited (now 466 vs
7,659, usage up ~25x since diagnosis); the ~40-min silence, the 168-pool, the line-17
propagation failure, and the PENDING-CAPTURE direction finding all stand.

### A2. Josh's correction on the pool — accepted, with a sharpening

The staging pool is not a symptom and not a broken half-gate: it is **external memory for
a single head** — a solo developer's TODO reservoir, mandatory because a full-stack
application cannot be held in working memory or built in one shot. Accepted. Monday item 5
(a DISMISS pass framed as defect-repair) is withdrawn as framed — pruning is hygiene, not
a fix.

What survives, sharpened: a memory prosthesis is judged by **recall precision at the
moment of need**, not inventory size. Today's actual failure was a failed *read* — a
client described substrate that shipped hours earlier and nothing surfaced the collision.
Items 4 and 6 (collision read at staging; carry-forward read at Commit) stand. The pool's
one real risk is mixing two species — roadmap TODOs (sit indefinitely, by design) and
decisions-in-waiting (rot). No restructuring: the distinction matters only at read time,
in the gate.

### A3. The counterparty-appointment model (built from Josh's own context)

Josh's client meetings are a **standing, scheduled, external counterparty for intake** — a
human who shows up and compels both the read of progress and the write of new items. CI is
a **machine counterparty for Verify**, consulted on every push. Commit has a weak internal
counterparty (Josh's appetite for the next unit). **Land has an appointment with no one,
human or machine.** Beat health tracks *has a counterparty* exactly — a better explanation
of the asymmetry than negative-space output ever was, and it survives every correction so
far. The §5 coupling fix, restated: give Land the one counterparty Josh never fails to
show up for — his own desire to start the next thing.

### A4. herdr as evidence for the consumer thesis

The tool Josh calls the singular most beneficial unlock in two years of iteration is not a
writer. herdr added no artifact — it made hidden processes **readable**: pane identity,
status, survival. The highest-rated unlock of the whole journey is a compelled-read
surface. §6's thesis, crowned independently by the operator's own experience before the
thesis was written.

### A5. Field lineage gap (found by failing honestly)

`work-done` requires a `ref` to a parent pheromone. A task born by push — as this peer
assist was — has no field lineage, so its completion is *unemittable* without
reconstruction. The system did not signal the concierge for two stacked reasons: the peer
defaulted to the comms surface the brief foregrounded (board + file — the same failure
class as the parked twelve), and the field's grammar assumes all work is born in the
field. Fix candidates: spawners emit `work-available` at spawn for one-off panes, or the
field gets an explicit orphan-adoption rule. Resolved this instance by ref'ing the board
row (`t-mss28b6w-p2i0` → `ph-mss309vj-ilwn`), which the server accepted.

### A6. On "amateurish"

The lean, file-based, piecemeal constraint is not a handicap for the consumer rule — it is
why the rule is nearly free. Organizations with runtimes must build services to compel
reads; here it is one clause in a skill file that already runs, at a gate that already
exists. The constraint picked the correct architecture before the theory arrived.
