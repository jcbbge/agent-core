# Constellation Synthesis — What It Is, Why It Stalled, What Is Usable Now

**Date:** 2026-08-13 (rev. 2 — operator primary source ingested)  
**Author:** CORD constellation (read-only; no implementation)  
**Audience:** Concierge → operator (career thesis reading)  
**Primary source (authoritative):** operator framing 2026-08-13, durable at  
`~/.claude/projects/-Users-jrg-infinity-arc/memory/project_madewell_thesis_genesis.md`  
**Corroboration:** two trees + excavation + Made Well / Rumen / meta; SAGT partials under  
`~/agent-core/research/constellation-synth-partials/`  
**Board:** `constellation/research`

His framing supersedes inference from code. Where trees and his words agree, both are cited. Where they diverge, **he wins**.

---

## 1. The thesis in one paragraph (his vocabulary)

**Made Well** is the distillation of the software development lifecycle into its purest, absolute, irreducible components — born from being a solo independent developer with no corporation behind him, so it had to be operationalized in the cleanest, lightest, most minimal way possible. While building it he saw that those bones are the same atomic units of work in **any** field, domain, industry, company, team, or job: all work distills to the four-phase loop — **Ideation → Planning → Implementation → Testing**. That is anchor point one. Made Well is essentially a **grammar — an ontological framework in files**. That grammar is the key that has been running the whole thing.

**Constellation** is the name for putting that grammar into a **software factory** — so he can build meaningful, beautiful, intentional software — with enough separated agents (five to six minimum, learned by being burned) that the loop cannot cheat itself, plus an **outer loop** that filters and grounds ideas before the inner loop throws bowls, plus the host stack (harness, runtime, orchestration substrate, memory/context) that the industry never sold him ready-made. Agnostic by choice and purpose: no vendor, tech, or protocol to lean on while the industry changes weekly. The “mishmash” is utilities built for himself while pushing ~ten threads, periodically extracted into productized structure — **accretion with intent**, not disorder.

Source: `project_madewell_thesis_genesis.md:18-105`. Corroborating vocabulary in trees: `PROGRAM.md:8-29` (factory / four phases / any domain), `VISION.md:38-48`, `madewell/SPEC.md:9-11` (“the format is the product”), `60-m1-archive.md:22-44` (v0 hand-validated four phases), `constellation-zg/journal/2026-04-the-river-remembers.md:49` (“Constellation has never been developed inside Constellation”).

---

## 2. The iteration ledger (walls verified against his framing)

**His answer to “what was the wall?” (authoritative):** the wall was rarely conceptual. Each layer below was never sufficient, and nobody had built the one above it. He had to own agent layer, runtime layer, harness layer, and separately an orchestration runtime/harness — each a whole-team project — alone, while balancing client work. (`project_madewell_thesis_genesis.md:64-86`)

Ground-truth sizes (2026-08-13): `~/constellation` 3.5M / 31 commits (Lisp, 2026-07-22 → 2026-08-05); `~/constellation-zg` 1.0G / 74 commits (Zig, 2026-04-04 → 2026-08-12) — **868M is `.zig-cache`**, not source.

| Attempt | Dates | Shape | Reached for | Stopped mid-what | Wall (his class + tree evidence) |
|--------|-------|-------|-------------|------------------|-----------------------------------|
| **v0** | pre-repo | Two terminals, ten tabs, copy-paste by hand; 1→6 agents | Full orchestration by necessity | Human handoff ceiling | **Missing substrate** — design worked; automation did not exist (`thesis_genesis:67-70`; `60-m1-archive.md:22-44`) |
| **v1–v2** | 2026-01–02 | TS, pheromones, SQL isolation | Orchestration + walls | ~40% | **Missing harness** after runner worked (`60-m1-archive.md:56-83`) |
| **Harness attempts** | 2026-02– | OpenCode forks → settle on pi.dev | Easy agent orchestration | Foreign harness limits | **Missing / defective substrate** — OpenCode “nightmare”, hierarchical-only, no lateral coord (`60-m1-archive.md:115`; `thesis_genesis:75-76`) |
| **Memory/context** | 2026-04→ | Pane → Alembic → Circadian | Fix “context window” misnomer | Spun off organs | **Harness/runtime defect** — turn is a refresh/restart every time; pane/lens thesis (`thesis_genesis:77-79`; `00-DOSSIER.md:50-54`; `30-memory-context.md:20`) |
| **v3–v4** | 2026-02–03 | SurrealDB Nebula; Gleam/BEAM | Own more of runtime/supervision | Archives, no remotes | Still building layers nobody sold (`60-m1-archive.md:109-118`) |
| **v5 Zig** | 2026-04–08 | Organism, spine, stars, Markarian, web | Own Level-0 + factory sim | Long silences after May factory / Jun docs; tip = Tower design leak | Mix of unfinished wiring **and** attention elsewhere; escalation into live machine stack (`zg-thesis` partial; `a644987`) |
| **v6 Lisp** | 2026-07–08 | Level-0 harness as language; Made Well dogfood | Pipe as primitives | Tip: discovery Commit-gate, d013 async missing | Substrate “bottomed” claim vs remaining host gaps (`60-m1-archive.md:237-241`; lisp-walls partial) |
| **Orbiting organs** | concurrent | Made Well, Rumen, Circadian, Strudel, Tower, herdr | Same thesis at one layer | Productized when a thread stabilized | **Accretion with intent** (`thesis_genesis:99-102`; `60-m1-archive.md:214-228`) |

**Load-bearing correction already in the archive (2026-07-25):** ~40% stalls were deliberate descents, not planning loops; cost was re-specifying settled design per runtime (`60-m1-archive.md:12-18`, `:103-129`). That archive reading is **confirmed**, not replaced, by today’s primary source: the chain he named (orchestration → harness → memory/context → own everything + orchestration runtime) is the same Descent with the missing middle named in his words.

---

## 3. What herdr changed

Herdr is the spark because it is the first **shared, durable process-and-identity substrate** that does not force him to rebuild pane lifecycle inside each Constellation language:

| Need he kept rebuilding | What herdr supplies | Evidence |
|-------------------------|---------------------|----------|
| Two terminals / ten tabs / copy-paste orchestration | Workspace/tab/pane topology; panes survive detach | `thesis_genesis:67-70`; `herdr/SKILL.md:24-27` |
| Process ownership / supervision | Server-owned terminals; done = gone | `herdr/SKILL.md:93-101`; Lisp FC#3 was the in-repo attempt |
| Agent identity + live status | Registration, idle/working/blocked/done | `herdr/SKILL.md:71-75`, `:130-135` |
| Spawn discipline for orchestrated agents | spine-spawn / cursor-spine / cursor-fleet | `control-flow.md:57-63` |

That is precisely step (3) of his escalation — an orchestration runtime/harness to run orchestrated agents — arriving as infrastructure rather than another greenfield binary. Zig star runners and Lisp `supervisor.lisp` were attempts to own that layer inside the app; herdr owns it for every harness.

---

## 4. The escalation pattern — verified, not re-derived

**Name (his):** each layer below was never sufficient; nobody had built the one above.  
**Name (archive):** The Descent (`60-m1-archive.md:100-129`).

**His chain (authoritative):**

1. Needed agent orchestration → nobody had an easy implementation → forked OpenCode multiple times → settled on **pi.dev**.
2. That exposed harness/runtime defects — especially **memory and context management**. Diagnosis: *the context window is a misnomer*; industry treats turn-based chat as a real exchange *when it's a refresh, a restart, every single turn*.
3. Therefore own **agent + runtime + harness**, and separately an **orchestration runtime / orchestration harness**. Nobody has done it; rebuild from scratch alone.

**Tree test:** PASS. OpenCode in v2 sprint record and Descent table (`60-m1-archive.md:60`, `:115`). Pi/fork pain in Descent row 3b (`:116`). Context-window misnomer excavated verbatim in pane/Alembic/Circadian line (`00-DOSSIER.md:50-54`, `30-memory-context.md:20`). Circadian spun off explicitly for memory/context (`60-m1-archive.md:223`). Zig/Lisp attempts = owning Level-0. Tower/herdr/spine = orchestration harness emerging under other names. Made Well stays the **grammar** that must not be pinned to one language (`CONSTELLATION-V6-CONVERGENCE.md:9-15`; `thesis_genesis:94-95`).

**Diagnosis:** **genuine missing substrate**, not a design flaw that defers “the real work.” Remedy opposite of “stop climbing”: **stop re-deriving the grammar each climb**; put new effort only into layers still missing (context pane as fabric, verify as fabric, Rumen fences) — not into another celestial runtime.

| Wrong reading | Right reading (his) |
|---------------|---------------------|
| He keeps redesigning instead of shipping | He keeps hitting empty shelves above the current layer |
| Language churn is indecision | Language churn is bodies for a settled four-phase grammar |
| Mishmash is disorder | Accretion with intent while ten threads run |

---

## 5. Already-built-under-other-names (including outer loop + Rumen)

| Concept | Running / specified artifact | Status |
|---------|------------------------------|--------|
| **Grammar (Made Well)** | `~/madewell` SPEC/LIFECYCLE; dogfood instances (e.g. Arc `.madewell/`) | **Live key** — files are the product |
| **Outer loop** (filter + ground clay) | Discovery → Commit → Build → Land; Ground door at Commit→Build | **Spec + instruments** — discovery/commit ●; build/land ○ (`INDEX.md`; `wire--two-doors-into-the-pipe.md:9-37`) |
| **Inner loop** (bowls/glasses) | Imagine → Plan → Make → Verify | **Spec + partial instruments** |
| **Ground against codebase** | Ground fan-out / striations; Arc `ground-first` ancestor | **Partial live** — pull-based grounding measured 0% when optional (`00-DOSSIER.md:15`) → must stay a **door** |
| **Rumen** | CI/CD check pipeline + **secondary gate on front half**; fences/judges/signs | **Design-stage** (`rumen/README.md:94-99`); excavation already pairs Rumen (exit) with grounding (entrance) (`50-madewell-loops.md:91`) |
| **herdr** | Orchestration substrate / panes | **Live** |
| **Tower** | Bus + stigmergic field (`pheromones.jsonl`, MCP) | **Live (young pheromone plane)** |
| **Circadian** | Memory injection; context-pane thesis | **Live wake path** |
| **Separated roles / verify** | cursor-shim `make` + profiles; constellation 6-star scaffold | **Live on cursor path; still flag-shaped** |
| **zg / Lisp runtimes** | Research/archive bodies for the same grammar | **Not the daily path** unless Commit says otherwise |
| **Game / Adliyye skin** | Codex + zg web scaffold | **Mostly aspirational** |

**How much is alive:** the **grammar and orchestration floor** are substantially real; the **unified factory experience** and **Rumen metabolism** are not. Mishmash reading corrected: intentional accretion (`thesis_genesis:99-102`).

### Outer loop + Rumen in the architecture picture (mandated)

```
OUTER (block the clay):          Discovery → [Ground door] → Commit → Build → Land
                                              ↑ filter + codebase grounding
INNER (throw the bowls):                      Imagine → Plan → Make → [Verify door] → …
RUMEN:                         secondary gate on FRONT half (with Ground)
                               + CI/CD / quality fences on what LEAVES (with Verify/Land)
```

His image: outer loop exists because the inner loop alone was insufficient on a client project — not every idea is good (filter, not funnel), and every inkling must be grounded against the actual codebase (Vue vs React). Rumen is the metabolism that turns conventions into fences so agents cannot ignore them — designed for the check pipeline, with a secondary front-half gate (`thesis_genesis:48-62`; `wire--two-doors-into-the-pipe.md`; `rumen/README.md:33-62`).

---

## 6. The interim recommendation

**Nothing new should be built as a sixth system.** The real deliverable is **naming and documenting the system that already exists**, with Made Well as the grammar and the host organs in their places. He is one person with a binding spend constraint; a large build is a non-answer (`thesis_genesis:109-112`).

### What “Constellation now” is (name it)

**Constellation (interim) =** Made Well grammar (files) + outer/inner doors + herdr (orchestration substrate) + Tower (bus/stigmergy) + Circadian (memory/context injection) + agent-core profiles (roles) + cursor-shim / spine-spawn (spawn + verify beat) + Rumen (designed metabolism — attach, don’t rebuild) + fleet-task design notes (`agent-core/research/fleet-task-tool-design.md` — not a sixth runtime). Agnostic on purpose: any harness that can tick the ratchet and honor the doors.

### Smallest moves (unify / harden — do not invent)

1. **Publish the map** (this doc, or a short `CONSTELLATION-NOW.md` in agent-core) so the stack stops looking like failure.
2. **Keep Made Well doors as law** — Ground and Verify unconditional; never optional consults (0% adoption proof).
3. **Treat herdr+Tower as the orchestration harness** he said nobody built; stop new in-repo supervisors/Nebulas.
4. **Advance verify from env-flag to ratchet fabric** (§7) — small, high leverage, scar-driven.
5. **Rumen:** when spend allows, attach as front-half secondary gate + exit fences — do not rewrite grounding hooks into a parallel pile.

### STOP

- New Constellation language/runtime
- Parallel buses beside Tower
- Architecture trilogy docs while Commit queues idle
- Vendor lock-in “solutions”
- Calling the stack a mess without finding the thread

---

## 7. Separated verification as fabric (scar, four modes)

**Origin (scar, not preference):** a single agent running the loop fails in four distinct ways (`thesis_genesis:29-46`):

| Mode | Failure | Role that must catch it |
|------|---------|-------------------------|
| **A. Gaming** | Agent makes tests green instead of fixing code | Test-maker (plan-only) + filesystem wall so implementer never sees tests |
| **B. Pre-existing bug** | Correct impl or correct tests impossible; one agent cannot see past it | Arbiter / triage with authority to rule **pre-existing / out-of-scope** (already in `inner-loop-verify.md` arbiter rulings) |
| **C. Bad implementation** | Code simply wrong | Tester (runs suite) → arbiter → coder |
| **D. Bad testing** | Suite simply wrong | Tester → arbiter → test-maker |

Hence minimum **5–6 separated agents** and the doctrine: test agent ≠ implementation agent; tests derived from the plan only, to judge intent. *Not a feature flag. Woven into the fabric.*

### What today’s shell gate gets right / wrong

Right: lowest spawn primitive; criteria-before-code; coder worktree isolation; `make` bifurcation (`cursor-spine`, `inner-loop-verify.md`).  
Wrong as fabric: `CURSOR_VERIFY_GATE=off` lifts wall+criteria; audit lands on board plane; non-git fallback to discipline; test-maker asymmetry; cursor-only.

### Architectural answer (unbypassable, all four modes)

1. **Ratchet doors, not env vars.** Plan→Make records bifurcate event (implementer WT + test-maker WT + criteria hash) in `work/events.jsonl`. Make cannot advance without it. Verify→Land cannot advance without tester emission + arbiter closure if red. Env bypass cannot skip a door (`SPEC.md` Rule 1 — doors are ratchet state).
2. **Four roles none playing two** — implementer / test-maker / tester / arbiter — plus human pause for irreducible taste. Maps to constellation stars / Made Well jump pack.
3. **Mode A:** filesystem isolation both sides (force test-maker worktree everywhere, not only `make`).
4. **Mode B:** arbiter’s **pre-existing / out-of-scope** ruling is a first-class exit that does **not** recycle into nQ gaming; escalate to operator when nQ ceiling hit (already sketched; must be door-enforced).
5. **Modes C & D:** only arbiter routes “bad code” vs “bad test”; tester never diagnoses; nQ≤3 then human.
6. **Break-glass:** delete silent `$CURSOR_VERIFY_GATE=off`, or require operator-plane approval + dedicated audit ledger (not `board.jsonl`).
7. **Cross-harness:** same door contract for pi/claude, or an explicit fence that cursor is the only code factory — document the fence; do not leave a hole.

Until ratchet ownership of the bifurcate, the scar is only half-healed: mechanically real on cursor, philosophically bypassable.

---

## 8. Open questions for the operator

Answered by today’s primary source — **closed for synthesis:** what Made Well is; why walls/escalation; why 5–6 agents; why outer loop; Rumen’s place; agnostic/mishmash intent; goal = software factory.

Still only he can answer (concierge-batched):

1. **Formal name:** call the running stack “Constellation” in agent-core, with Made Well as the portable grammar cartridge — yes/no?
2. **zg / Lisp trees:** archive vs any specific Commit to revive?
3. **Stigmergy unify:** Tower pheromones vs herdr `claim_*` vs zg Nebula — one model or deliberate layers?
4. **Verify break-glass:** delete env bypass, or operator-approved audit only?
5. **Rumen timing:** attach front-half secondary gate now (smallest slice), or defer until spend allows?

---

## Method notes & integrity

- **Rev. 1** synthesized from trees + SAGTs; escalation diagnosed as Descent (archive).  
- **Rev. 2** rewrites under operator primary source; tree history used to **verify** his chain, not to invent a competing one.  
- Spawn tooling lessons (ask-mode researchers, headless capture) unchanged; irrelevant to thesis.  
- **No roadmap manufactured.** Strongest conclusion stands, sharpened: **name the grammar + the organs; do not build a new body.**

---

## Alignment check

**Soul:** software factory for meaningful, beautiful, intentional work — four-phase grammar, outer filter+ground, inner bowls, structural multi-agent verify, agnostic host.  
**Spend:** unify/name/harden doors — no large build.  
**Scar:** four failure modes → fabric, not flag.  
**Mishmash:** accretion with intent. **Herdr:** the orchestration substrate shelf that was empty.

---

## 9. Acceptance gate (CORD verified 2026-08-13 — Land)

Brief done-when checked against the artifact on disk, not against board narrative.

| Brief requirement | Status | Evidence |
|-------------------|--------|----------|
| Deliverable path exists | **GO** | `~/agent-core/research/constellation-synthesis-2026-08-13.md` (rev.2+) |
| §1 Thesis in his vocabulary | **GO** | Made Well grammar + factory; primary source cited |
| §2 Iteration ledger + wall class | **GO** | Table v0→v6 + organs; his substrate framing + tree cites |
| §3 What herdr changed (not “multiplexer”) | **GO** | Durable process + identity + spawn/reap substrate |
| §4 Escalation named + diagnosed | **GO** | His chain verified; Descent confirmed; genuine missing substrate |
| §5 Already-built map + honesty band | **GO** | Includes Tower stigmergy live (`COMMS-ARCH.md:49`, `pheromones.jsonl` 19 lines), outer loop, Rumen |
| §6 Interim unify-not-add + STOP list | **GO** | Name the stack; no sixth runtime |
| §7 Separated verify as fabric | **GO** | Four scar modes + ratchet-door architecture |
| §8 Open questions (operator-only) | **GO** | Reduced set; answered items closed |
| Ground truth sizes/commits re-measured | **GO** | 3.5M/31 Lisp; 1.0G/74 Zig; tips `599e77f` / `a644987` |
| Researchers fanned out + reaped | **GO** | Partials on disk; w20 children = 0 |
| Read-only (no Constellation impl) | **GO** | Only research paths written |
| Primary source supersedes inference | **GO** | `project_madewell_thesis_genesis.md` ingested rev.2 |

**MISSION COMPLETE** on research brief. Remaining operator Qs (§8) are concierge-routed gates, not blockers for this unit.  
**Friction → rule:** posting findings then idling is not Land. CORD loop continues through acceptance verify + git land + `.done` stamp. Researcher `--mode ask` cannot Write — research fan-out must use `--headless` capture or a write-capable profile.
