# CORD [constellation] — Research the thesis: what Constellation is, why it kept stalling, and what is usable NOW

**This is not a feature request. It is the operator's career thesis.** Read that sentence
twice before you touch anything, because it sets the standard: he does not need
enthusiasm, he needs an honest reading of two years of his own work, including the parts
that failed and why.

**READ-ONLY RESEARCH. You build nothing. You change nothing.** The deliverable is one
synthesis document. Any impulse to start implementing Constellation is the exact failure
mode this brief exists to diagnose.

---

## The operator's framing (his words, 2026-08-13 — treat as primary source)

> "My entire career and thesis has been Constellation — but the tech has not been there.
> Madewell was the lightweight files version. I've been working the last two years and
> hitting walls every Constellation iteration. But a key thing changed — **herdr**. Herdr
> was the spark that reignited a usable Constellation for the moment, for right now. I
> wanted to build Constellation as the **engine shop to build software**, but every
> attempt I've realized the limitations and I keep going further up the stack. I need
> something I can use interim, right here, right now. That's why there is this cobbled
> mishmash of Tower, Circadian, Madewell, Rumen, etc."

Two things in that are the actual research questions, and they are not the same question:
1. **Why did every iteration stall?** — and specifically, was the wall technical,
   conceptual, or economic?
2. **What did herdr change** such that a usable Constellation became possible *now*?

And one standing doctrinal point he raised in the same breath, which must be answered
structurally rather than as a setting:

> **"The test agent must not be the implementation agent. Tests are derived from the plan
> only, to judge intent. If the implementer can read them it can tune to them, and a suite
> that merely re-asserts the code proves nothing."**
>
> "This is Madewell/Constellation doctrine. **This is not a feature flag. This must be
> woven into the very fabric.**"

Today that doctrine exists as an env-var-defeatable check in a shell script
(`~/cursor-shim/cursor-spine`, the `CURSOR_VERIFY_GATE` block). Part of your job is to
say where it belongs in Constellation's architecture such that it is *structural* — a
thing the system cannot be configured out of, the way a compiler cannot be asked to skip
type-checking.

## Ground truth — measured 2026-08-13 (verify; do not trust these numbers blindly)

| | `~/constellation` | `~/constellation-zg` |
| --- | --- | --- |
| size | 3.5 MB | **1.0 GB** |
| commits | 31 | 74 |
| span | 2026-07-22 → 2026-08-05 | 2026-04-04 → **2026-08-12 (yesterday)** |
| language | Common Lisp (`constellation.asd`, `ocicl`) | Zig (`build.zig`, `build.zig.zon`) |
| notable top-level | `AGENTS.md`, `MADEWELL.md`, `src`, `tests`, `bin`, `docs`, `Makefile` | `AGENTS.md`, `PROGRAM.md`, `compare_orchestration.md`, `docs`, `harness`, `journal`, `nebula`, `main`, `bare`, `ready` |

**The `-zg` tree is the live line** — its last commits are `docs(tower): stigmergic Tower
design — pheromone bus proposal` and `docs(constellation): resonance architecture,
autonomy gradient, DAG planning`.

**Load-bearing observation to test, not assume:** Tower currently ships
`pheromone_emit` / `pheromone_field` MCP tools, `~/.tower/pheromones.jsonl`, and a
STIGMERGIC FIELD amendment in `COMMS-ARCH.md`. That looks like Constellation's design work
already leaking downstream into the running stack. If true, the "cobbled mishmash" is not
random accretion — it is Constellation being **built in pieces, under other names**.
That reframing is the most valuable thing you could establish or refute.

## The six questions the synthesis must answer

1. **What has Constellation been trying to BE**, across iterations? Give the through-line
   in the operator's own vocabulary, from `PROGRAM.md`, `AGENTS.md`, the `docs/` in both
   trees, and the `journal`. Distinguish the invariant thesis from each attempt's
   incidental shape.
2. **Where did each iteration hit its wall, and what was the wall made of?** Read the git
   history as evidence — what stopped, mid-what, and what the commit right before the
   silence was reaching for. Classify honestly: missing technology, unresolved concept,
   or unaffordable cost. Two abandoned language choices (Lisp, Zig) are data about the
   wall, not noise.
3. **What did herdr actually supply that every prior attempt lacked?** He calls it the
   spark. Name the capability precisely — durable process ownership, observability,
   identity per pane, something else — and check it against what the earlier iterations
   were trying to hand-build. Do not accept "it's a multiplexer" as an answer.
4. **Name the escalation pattern.** He says every attempt made him "go further up the
   stack." Find that pattern in the record and characterize it: is it a design flaw that
   keeps deferring the real work, or a genuine requirement that the layer below was never
   sufficient? These have opposite remedies.
5. **What is the minimum INTERIM Constellation that is usable right here, right now** —
   given Tower, Circadian, Madewell, Rumen, herdr, herdr-spine, agent-core, cursor-shim
   and fleet-task all already exist and run? The constraint that matters:
   **it must unify what exists, not add a sixth thing to the pile.** He is a solo
   developer and spend is his binding constraint — an answer that requires a large build
   is a non-answer.
6. **Where does the separated-verification doctrine live in the fabric?** Answer
   architecturally. What structure makes "the test agent is not the implementation agent"
   unbypassable rather than configurable? Note what today's shell-level gate gets right
   (it sits in the lowest spawn primitive, so no path routes around it; it forces
   filesystem separation via worktrees) and what makes it a flag rather than fabric (a
   single env var lifts both; it is absent outside git repos; its audit row is malformed
   and lands in the wrong plane).

## How to work

- **Docs and history before source.** `PROGRAM.md`, `compare_orchestration.md`,
  `AGENTS.md`, `docs/`, `journal/` in `-zg`; `README.md`, `MADEWELL.md`, `docs/` in the
  Lisp tree. Then `git log` as a narrative. Source only where a doc claim needs checking.
- **`-zg` is 1 GB — do not sweep it blindly.** Scope by directory, prefer `super-search`
  (`bun ~/agent-core/primitives/skills/super-search/search.ts`) over raw greps, and use
  the bigfile tools for anything huge. Report if a large directory is build output rather
  than source; that itself is worth knowing.
- **`~/madewell` is a pristine read-only distribution copy. Never edit it.** Read it to
  understand the "lightweight files version," and read `~/.madewell-meta` for the meta
  work. Arc's `.madewell/` is the live dogfood instance.
- Fan out **researcher-tier** assists for the parallel reads (the two trees are
  independent, and Madewell/Rumen are a third strand), then synthesize yourself. Every
  unit of work is a **visible pane** — no background in-process subagents. Reap them when
  they report.
- **Cite everything.** `file:line` or `commit:path`. This document will be read as a
  factual account of the operator's own work; a confident wrong claim about his history is
  worse than an admitted gap.

## Deliverable

`~/agent-core/research/constellation-synthesis-2026-08-13.md`. Structure:

1. **The thesis in one paragraph** — what Constellation is, in his vocabulary, invariant
   across attempts.
2. **The iteration ledger** — one row per attempt: dates, language/shape, what it reached
   for, where it stopped, what the wall was made of.
3. **What herdr changed** — the specific capability, and the evidence.
4. **The escalation pattern** — named, diagnosed, with the remedy each diagnosis implies.
5. **Already-built-under-other-names** — a mapping of Constellation concepts to the things
   currently running (pheromones → Tower's stigmergic plane, cycles → Made Well's inner
   loop, panes → herdr, and whatever else the record supports). Say honestly how much of
   Constellation is already alive.
6. **The interim recommendation** — the smallest thing that makes what exists feel like
   one system. Name what to STOP building as well as what to build.
7. **Separated verification as fabric** — the architectural answer.
8. **Open questions for the operator** — what only he can answer.

**The most useful thing you can conclude may be that no new system should be built yet,
and that the interim answer is to name and document the one that already exists.** If the
evidence says that, say it. Do not manufacture a roadmap to look useful. He has had two
years of roadmaps; what he is short of is an honest reading.

## Harness

Cursor fleet, operator's choice — grok at the coordinator/orchestrator tier, composer for
workers, already the defaults. Spawn only through the shim:
`cursor-fleet orch <slug> --brief <p> --workspace <id>` and
`cursor-fleet worker researcher --brief <p> --workspace <id> --dir <root>`. Never
`spine-spawn`. The shim stamps generic profile names, so **relabel every pane you spawn
with its real work name** (`herdr pane rename` + `report-metadata --display-agent --token
name=`) — an unreadable sidebar has already been called out once today.

Post to board topic `constellation/research`. Route questions to the concierge, batched,
as ruled proposals — never to the operator.

SOURCES: `du`/`git log`/`git rev-list`/`ls` on both trees; `~/.tower/` (pheromones.jsonl,
COMMS-ARCH.md, MCP tool surface); `~/cursor-shim/cursor-spine` gate block; operator's
verbatim framing 2026-08-13 — all read or run 2026-08-13 by the concierge.
