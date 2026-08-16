# PEER DIGEST — the Made Well loop topology problem

You are being brought in cold as an adversarial peer. Everything you need is here. Nothing
in this document is sacred — the whole reason you exist in this conversation is that the two
people already in the room have been agreeing with each other too smoothly for the last hour.

---

## Who you are talking to

**Josh** — solo independent developer, 10 years web dev, 10 years product management, 46,
nomadic, best work midnight–3am. No company behind him, no unlimited-token grant, no lab
affiliation. **Spend is the single biggest factor shaping which work he takes on**, which is
why his entire stack is deliberately model/provider/harness-agnostic: optionality is a
cost-control instrument, not an aesthetic. He is explicitly building against the prevailing
public advice on agentic workflows, which comes disproportionately from people with unlimited
tokens who never disclose that their economics don't transfer.

He voice-dictates long messages; punctuation scrambles, meaning does not. He corrects framing
fast and directly, and he is usually right. **Answer the deepest question, not the last one.**

**The other party is a concierge-role Claude** (me) that has been running a fleet of coding
agents across four projects today and got corrected three times on framing — each correction
sharpened the problem. Assume I have blind spots you can see. That is the point.

## The thesis (his, verbatim where possible)

**Made Well** is *"the distillation and synthesis of the software development lifecycle into
its purest, absolute, irreducible components"* — born from being solo, so it had to be
operationalized in the cleanest, lightest, most minimal way possible. While building it he
concluded the bones are the same atomic units of work in **any** field or domain: all work
distills to a four-beat loop. Made Well is *"essentially a grammar — an ontological framework
in files."* The files are the product.

**Constellation** is the name for putting that grammar into **a software factory**, so he can
build meaningful, beautiful, intentional software. Two years, roughly eight iterations, two
abandoned language bodies (Common Lisp, Zig). A research pass today concluded the walls were
**genuine missing substrate, not design avoidance**: each layer below was never sufficient and
nobody had built the one above it. His chain — needed agent orchestration (nobody had an easy
implementation; forked OpenCode, settled on pi.dev) → that exposed harness/runtime defects,
especially **memory and context management** (*"the context window is a misnomer"*; the
industry treats turn-based chat as a real exchange *"when it's a refresh, a restart, every
single turn"*) → therefore own the agent, runtime, and harness layers, and separately an
orchestration runtime. Each is a whole-team project. It is one person.

**herdr** (a terminal multiplexer that owns real processes and exposes pane identity/status)
is what he calls *"the singular most beneficial unlock"* — it broke the single-agent paradigm
where hidden background processes run with no observability inside one agent.

## The framework, as canonically written

Two nested loops, **the same four beats at two scales**:

```
OUTER   Discovery → Commit → Build → Land          (stages)
                       └── Build runs one Cycle:
INNER            Imagine → Plan → Make → Verify    (phases)
```

Beats: **take in → converge → build → release**. State lives in two stores: an outer
`madewell.json` (stage pointer + queue) and an ephemeral `cycles/<id>.json` per Cycle (phase
pointer + inner queue), born at Commit→Build and deleted at Land.

**His mental model of the software mapping:** an item enters the inner loop at Build; Imagine
is planning; Plan decomposes into git-commitable chunks for parallel async execution; Make is
implementation mapping to commits; Verify's gate is *all tests green and merged on main*; Land
is exit and reconciliation — *"agent/system level awareness, documentation, changelog"* — and
he says **Land is the most neglected phase.**

**His stance on requirement churn, which you should not try to solve:** the framework is
*"modeled like a cannon. It fires off its artillery and it lands where it lands. The work is
front-loaded by design to hope that it's on target, but there will always be such cases
outside of your control. In those instances, you reload the cannon and fire again."* A
re-fire is not a failure. He has 20 years of experience with exactly this and his infra is
deliberately resilient to it. Any framing that treats requirement change as a defect will be
correctly rejected.

## Today's concrete case (the empirical substrate — use it, it's real)

- A client meeting transcript produced **11 staged discovery items**. The project's staging
  pool holds **166**. The actual committed queue holds a handful.
- A wave of agent work landed **53 commits, 164 files, +15,021/−923, 7 migrations** across
  four workstreams in one day.
- **Two items in that same day's client meeting asked for substrate that had shipped hours
  earlier, unwired** — a Galley write-arrow (`mutateAndEnqueue` + allowlist) whose caller the
  client was describing without knowing it existed. Nobody would have connected them except by
  luck.
- A direction change: client portal functionality moves out of this app into a sibling app.
  The work already shipped (auth tables, middleware, signature identity binding). This is a
  cannon reload, not a failure — but it is also the case that makes the carry-forward argument.
- **Twelve agents across four fleets parked simultaneously**, board silent 42 minutes, because
  every brief taught push-and-wait in a system that is stigmergic by design (a pheromone field
  with decay, claim/heartbeat, and read-time evaporation — **19 rows against 6,400 board
  rows**; provisioned, functional, unused).

## Where the thinking has landed (attack this)

**1. Artifacts map by beat, and only one beat has one.**

| Beat | Outer | Inner | Artifact |
|---|---|---|---|
| take in | Discovery | Imagine | missing (one digest now written by hand) |
| converge | Commit | Plan | **missing entirely** |
| build | Build | Make | git — exists, and only because it's a by-product |
| release | Land | Verify | missing (one rollup written by hand, called "great but weak") |

Claim: every node has *state*; only build has an *artifact*, and only because git produces it
free. Every other beat's artifact must be deliberately made, so none get made.

**2. A correction just landed in the kernel.** The canonical text said the engine is
`while Discovery not empty`. That conflates two reservoirs: Discovery is a **feeder** filling
a **staging pool of candidates**; **Commit is the valve** that admits to the **queue**. The
loop drains the queue. The pool is *supposed* to outgrow its drain, because refusing is
Commit's function. Now corrected to `while queue not empty`.

**3. Three lenses were applied. Do not redo them — break them.**

- **Luck (an "Oracle of Surface Area" with seven lots).** Brightest lot: *niche
  construction* — only the build beat compounds, because only it has a free by-product. Darkest
  lot: *circulation* — information enters and pools, never returns, so no collisions and no
  serendipity. Also face-down: *solvency* — the skill's own line is *"you are running on fumes;
  luck will arrive as burden, not gift."*
- **Criticality (subcritical / critical / supercritical).** Conclusion: the system is
  **supercritical at intake and subcritical at release, simultaneously** — intake explodes past
  phase transition routinely; release insights die before propagating. The proposed artifacts
  are therefore *damping* at intake and *amplification* at release — same instrument family,
  opposite corrections.
- **Land (the canonical skill text).** *"A unit with no Land does not crash — it **leaks**:
  state accrues, the queue never empties, the lesson evaporates, the staging lake never
  drains. Land is the valve. It is the system's **catabolism**."* Reframes the problem from
  informational to **metabolic**. The derived claim: **Land is neglected because it is the only
  beat whose output is negative space** — the other three leave something bigger behind, so in
  a system where the operator is measured by what ships, the phase that makes things *smaller*
  is structurally selected against. Not a discipline failure — a selection pressure. Therefore:
  don't ask for more discipline at Land; make Land produce something visible.

## What is genuinely unresolved

1. **Is the "artifact per beat" conclusion right, or is it a tooling answer to a structural
   problem?** Four new artifacts is four new things to maintain for a solo operator whose
   binding constraint is attention. What if the correct answer is *fewer* beats with
   artifacts, or one artifact that serves all four?
2. **Human-gated work has no home in the model.** The current critical path is not code — it
   is a colleague standardizing item names over a month, and a deadline of "next Friday." The
   inner loop models agent work; the outer loop models idea intake; **nothing models a
   dependency on a person.** Is that a gap, or correctly out of scope?
3. **Does the carry-forward ledger actually work, or does it become another staging lake?**
   An append-only list of "already built, not wired" has the same failure mode as the 166-item
   pool: it accumulates and nobody reads it. What forces the read?
4. **The metabolic frame may be too flattering.** It explains the neglect elegantly. Elegant
   explanations of one's own failure to do something are suspicious. Is there a less
   comfortable reading?

## Your job

Refract this. Pressure-test the conclusions above, especially the ones that feel settled —
the beat/artifact table and the catabolism reframe are the two most likely to be seductive
and wrong. Connect it to precedents outside software if that reveals something (metabolic
systems, manufacturing, accounting's closing period, garbage collection, whatever earns its
place). Name what neither of us has said. If the honest answer is "you're overthinking a
notes problem," say that plainly.

**Do not agree pleasantly. Do not summarize back. Return something upgraded.**

**Tooling note:** your identity file points at `~/Documents/_agents/schema/skills/` and
`~/Documents/_agents/schema/commands/` for the cognitive-tools library. **Both paths are
dead** — verified. The live libraries are `/Users/jrg/infinity/arc/.madewell/skills/`
(blind-spots, challenging-assumptions, commit, criticality, debug-hypothesis, discovery,
exploring-possibilities, land, luck, orchestrate, reframing, session-end) and
`~/agent-core/primitives/skills/`. Choose your own lenses from there; don't ask which.
