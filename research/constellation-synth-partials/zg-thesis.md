Gathering evidence from constellation-zg docs, journal, and git history for the research report.
# zg-thesis — Constellation-Zig Through-Line Research Report

**Agent:** SAGT zg-thesis  
**Tree:** `/Users/jrg/constellation-zg`  
**HEAD (verified):** `a644987` (2026-08-12)  
**Board:** finding posted to `constellation/research`

---

## 1. Thesis Through-Line

Constellation-zg is the fifth runtime iteration of a single invariant: **a living intelligence factory** where work moves through universal phases (Ideate → Plan → Execute → Verify), agents coordinate by **stigmergy** (file-based pheromones in the Nebula, not direct IPC), and the operator enters a **game world** driven by real telemetry—not a dashboard or dev tool.

```8:29:PROGRAM.md
Constellation is not a tool. It is a place you enter.
...
Constellation is the answer to the actual problem: **a living intelligence factory spanning
everything you build**, abstracted up to the level of a video game so the machinery never
gets in the way of the work.
```

The fractal substrate is load-bearing: Cosmos → Galaxy → Constellation → Star → Harness, each level running the same spine/session/telemetry loop (`PROGRAM.md:35-51`, `TAXONOMY.md:8-30`). Markarian (Quasar, not Star) is the sole user-facing entity; the fleet stays invisible (`PROGRAM.md:94-112`, `TAXONOMY.md:76-88`). The telemetry spine is the sensor array—execution truth, visual input, NPC behavior, and concierge narration all derive from it (`PROGRAM.md:139-158`, `VISION.md:19-20`).

What distinguishes this Zig iteration from prior TypeScript/Gleam attempts is the **organism model**: spine as nervous system, pheromones as cross-session memory, skins as interpretive lenses over fixed signal (`VISION.md:52-61`, `VISION.md:152-156`). The recurring journal diagnosis: **vision accretes faster than charcoal touches paper**—and when implementation stalls, work escalates upward (more actors, more docs, external stack) rather than closing the loop (`journal/2026-04-the-weight-of-the-scaffold.md:9-19`, `journal/2026-04-the-river-remembers.md:35-36`).

---

## 2. Iteration Bursts Table

| Burst | Dates | What It Reached For | Last Commit Before Stall | Wall Class | Evidence |
|-------|-------|---------------------|--------------------------|------------|----------|
| **Init / spine** | 2026-04-04..05 | Level-0 harness: tagged-union events, spine ring buffer, lifecycle tests, boot accretion | `fc61db4` (2026-04-05) substrate voluntary principle | — (active, not stalled) | `dc77044`..`fc61db4` |
| **Entity mesh + proprioception** | 2026-04-10 | `actor_id`, UserEvent, AI-first schema, harness arc segments, Zig-only closure | `0e6b2cc` (2026-04-10) KotaDB env fix | **Missing technology** (star subprocess, Nebula I/O, Gate stub) | `journal/2026-04-the-weight-of-stewardship.md:56-61`; handoff threads |
| **Oracle + simulate** | 2026-04-17..20 | zig-index, coraline workflow, multi-star simulation, pheromone ring in sim, CLI render skin | `e127e70` (2026-04-20) dispatch "river remembers" | **Unresolved concept** (event ID collision before real subprocess spawn warned in journal) | `journal/2026-04-the-river-remembers.md:19`; `199efad`, `402a496` |
| **Identity + hard rules** | 2026-04-21..23 | Adliyye Codex landed, marketplace dropped, AGENTS hard rules | `7b397af` (2026-04-23) three non-negotiable rules | **Unresolved concept** (Codex as reference impl vs singular skin—resolved in dispatch) | `journal/2026-04-the-weight-of-the-scaffold.md:29-41`; `13b5232` |
| **Rendering architecture** | 2026-04-24 | Four-target render stack decided; browser-first | `41155a2` (2026-04-24) visual session complete | — (decision record, leads to May) | `d428c89`, `docs/RENDERING_ARCHITECTURE.md` |
| **Factory burst** | 2026-05-01..03 | Actors, pheromone API, Markarian watch loop, orchestrator dawn→night, star spawn, orbit/nQ, Polaris, telemetry sidecar, web skin + serve | `907297e` (2026-05-03) browser skin + serve | **Missing technology + unresolved concept** — see gap below | `74be9cc`, `7239a17`, `907297e`; 28 commits in 3 days |
| **Silence I** | 2026-05-03 → 2026-06-29 (~7 weeks) | [no code commits] | `907297e` | **Missing technology**: pheromone API unwired; filename schism; E2E/VISU open. **Unresolved concept**: factory sim complete but "Constellation developing Constellation" loop never closed | `docs/TOWER_STIGMERGY_DESIGN_0812.md:66-74`; `WORK.md:17-18`; `journal/2026-04-the-river-remembers.md:49-50` |
| **Resonance docs** | 2026-06-29 | Markarian-as-traffic-control diagnosed; Resonance Ring, Flux Nebula, Spectral Charters, Dark Phase Accretion — all **Proposed** | `ed6852f` | **Unresolved concept**: centralized coordination model breaks at scale; docs propose fix, zero impl | `docs/RESONANCE_ARCHITECTURE_0629.md:10-16`, `:82-95`; status Proposed |
| **Silence II** | 2026-06-29 → 2026-08-12 (~6 weeks) | [no commits] | `ed6852f` | **Unaffordable cost** (operator attention on live fleet elsewhere) + **escalation to external stack** | [UNKNOWN] on operator time allocation; Tower doc cites live `~/.tower`/`herdr-spine` as already-running pheromone edge |
| **Tower stigmergy design** | 2026-08-12 | Tower as inter-project pheromone bus; maps Nebula grammar to `~/.tower/pheromones.jsonl` [PROPOSAL] | `a644987` | **Escalation wall** — coordination problem routed to machine-wide stack, not zg code | `docs/TOWER_STIGMERGY_DESIGN_0812.md:3-4`, `:61-62`, `:120-123` |

**Apr 24 → May 1 mini-gap (~7 days):** No commits between rendering decision and factory ignition. Likely pivot from "bare bones visual proof" (`journal/2026-04-the-river-remembers.md:21-22`) to May factory sprint—not a full stall.

---

## 3. Escalation Pattern ("Further Up the Stack")

Repeated pattern: when the current layer fails to close the loop, work moves **up a level** or **out to docs/external infra** instead of wiring the layer below.

| Step | Escalation | Evidence |
|------|------------|----------|
| 1. Harness substrate | Spine + simulate dry-run before real subprocesses | `29d76de` simulate harness; `journal/2026-04-the-river-remembers.md:19` warns ID collision before spawn |
| 2. Star subprocess | `star` / `orchestrate` CLI modes; orbit/nQ wired | `src/main.zig:139-203`; `src/core/orbit.zig` (cited in TOWER doc `:81-85`) |
| 3. Concierge layer | Markarian as Quasar — user talks to GM, not fleet | `3dd68ff`, `7239a17`; `PROGRAM.md:94-112` |
| 4. Actor/fleet abstraction | Actor system + fleet loader | `912a185` (2026-05-01) |
| 5. Harness runtime (L1 inner life) | Separate `constellation-star` binary + `src/harness/` — spec says orchestration stays in zg | `docs/HARNESS_RUNTIME_SPEC.md:24-40`; `build.zig:93-108`; `USE_HARNESS_RUNTIME = true` in `orchestrator.zig:13` |
| 6. Visual/browser skin | `web/` SolidJS + `--serve` simulation broadcast — visual proof without factory closure | `907297e`; `VISION.md:270-284` browser-first |
| 7. Docs-only architectures | Jun 29 trilogy when Markarian bottleneck named | `ed6852f` — Resonance, Autonomy Gradient, DAG (planning only) |
| 8. External stack leak | Aug 12 Tower design — zg Nebula vocabulary mapped to live `~/.tower` + herdr spine-claim TTL semantics | `docs/TOWER_STIGMERGY_DESIGN_0812.md:91-109`, `:155-162` |

**Meta-escalation (journal, not code):** "Constellation has never been developed inside Constellation" — desire lines from five iterations live in git/archived TS, not Nebula pheromones (`journal/2026-04-the-river-remembers.md:49-50`). The system designs itself from outside itself.

**compare_orchestration.md** captures the tension with conventional orchestration: direct IPC/control-plane vs stigmergy; dashboard vs game (`compare_orchestration.md:30-42`). Constellation consistently escalates away from dashboard/control-plane toward stigmergy + telemetry visuals.

---

## 4. Runnable vs Aspirational Inventory

### Runnable (in committed `src/`, verified in tree)

| Capability | Location | Notes |
|------------|----------|-------|
| Tagged-union spine + session arena | `src/core/event.zig`, `spine.zig`, `session.zig` | Boot/shutdown first-class events |
| Discovery accretion at boot | `src/core/discovery.zig` | Opening note |
| Lifecycle simulation (`-T`) | `src/core/simulate.zig`, `main.zig:227-237` | Multi-star, pheromone ring in sim |
| CLI telemetry render | `src/core/render.zig` | Phase headers, star identity |
| Orchestrator pipeline | `src/core/orchestrator.zig:32-49` | dawn→meridian→descent→night |
| Star subprocess runner | `src/core/star.zig`, `main.zig:139-186` | exit 2 = orbit question |
| Orbit/nQ protocol | `src/core/orbit.zig` | **One genuinely wired addressed-signal path** per TOWER doc `:81-85` |
| Polaris night arbitration | `src/core/polaris.zig` | MAX_NIGHT_ITERATIONS = 5 |
| Markarian interactive + serve | `src/core/markarian.zig`, `main.zig:95-136` | Perplexity Agents API path |
| Pheromone API (library) | `src/core/pheromone.zig` | emit/read/scan — **only `present()` called** (`markarian.zig:415`) |
| Nebula file I/O | `src/core/nebula.zig` | Status, orbit files |
| Registry / world map | `src/core/registry.zig` | TOML spaces |
| Browser scaffold + serve broadcast | `web/`, `src/core/broadcast.zig` | NDJSON over pipe; `--serve` runs sim loop |
| Binaries in build | `build.zig` | `constellation`, `constellation-star`, `constellation-config`, `test-spawn-harness` |
| Unit/lifecycle tests | `src/core/lifecycle_test.zig`, harness tests | `zig build test` target exists |

### Aspirational (docs/backlog, not landed or proposed-only)

| Item | Source | Status |
|------|--------|--------|
| Pheromone ring wired through API | `WORK.md:89` claim vs TOWER R2 | **False for `pheromone.zig`** — stars write artifacts directly |
| Resonance Ring / Flux Nebula / Spectral Charters | `docs/RESONANCE_ARCHITECTURE_0629.md` | Proposed, no code |
| Autonomy Gradient (Supervised→Autonomous) | `docs/AUTONOMY_GRADIENT_0629.md` | Proposed |
| DAG trajectory graphs | `docs/DAG_ARCHITECTURE_0629.md:3-4` | "Planning only — not implementing now" |
| Tower pheromone bus | `docs/TOWER_STIGMERGY_DESIGN_0812.md:3-4` | Design for operator review; D1-D7 open |
| Desire lines / Layer 4-5 observability | `VISION.md:198-230`, journal dispatch | Not built |
| NPC surface + Concierge conversation stub | `WORK.md:38-39` | Open |
| Adliyye Codex / Constellation skins | `WORK.md:33-34`, `VISION.md:171-184` | Codex doc exists; skin not implemented |
| E2E trajectory test | `WORK.md:18` | Open |
| Gate (`checkGate()` stub) | `journal/2026-04-the-weight-of-stewardship.md:59` | Stub |
| Silence primitive | `journal/2026-04-the-river-remembers.md:37-47` | Named in dispatch; not in event model |
| Constellation-as-own-user meta-loop | journal | Never closed |
| macOS native Alloy pattern | `docs/RENDERING_ARCHITECTURE.md`, `VISION.md:286-294` | Not started |

### Uncommitted delta (git status at session start — not in thesis claims)

Modified/untracked: `src/harness/`, `spawn_harness_bridge.zig`, `config_main.zig`, `docs/HARNESS_RUNTIME_SPEC.md`, etc. `WORK.md` lists harness-runtime items dated 2026-05-30 **without matching git commits** after `907297e`. Treat as **in-progress/off-HEAD**, not verified runnable.

---

## 5. Journal Load-Bearing Claims

| Journal | Load-Bearing Claim | Citation |
|---------|-------------------|----------|
| `2026-04-the-weight-of-the-scaffold.md` | Vision accretes faster than implementation; risk is generative scope becoming its own obstacle; Codex = reference impl not law; marketplace dropped; Zig is engine never exposed | `:9-19`, `:29-41`, `:45-47` |
| `2026-04-the-river-remembers.md` | Pheromone is backbone not feature; Silence primitive (inverse pheromone); Directive as ambient primitive; Constellation must develop Constellation; five observability layers 0-5 | `:29-36`, `:47-68` |
| `2026-04-the-weight-of-stewardship.md` | Fifth iteration fear; PROGRAM.md as compass; open threads: Gate stub, star spawn, Nebula I/O | `:30-34`, `:56-61` |
| `2026-04-the-autobiographer.md` | Autobiographer per star; Concierge as spine entity; behavioral signature as actuator; WitnessEvent; dispatch ritual codified | `:16-28`, `:60-70` |
| `2026-04-on-being-seen.md` | Agent inner life worth rendering; spine as mirror not surveillance; errors as metabolism; Winamp/skins principle | `:17-19`, `:33-34`, `:41-43` |

---

## 6. Open Questions for CORD

1. **Factory vs proof-of-concept:** Is zg the universal factory (PROGRAM.md) or the visual/momentum vehicle (journal Apr 21–24)? The May burst built factory plumbing; the 7-week silence followed browser skin, not E2E.

2. **Pheromone wiring priority:** TOWER R2 shows API exists but orchestrator/star bypass it. Is the next implement beat "wire `pheromone.emit`" or "abandon zg Nebula for Tower scale"?

3. **D1-D7 operator decisions** (`docs/TOWER_STIGMERGY_DESIGN_0812.md:155+`): Does Tower subsume intra-trajectory Nebula, or compose (P4 two scales)? Blocks all Aug-12 design.

4. **Resonance vs current orchestrator:** Jun 29 docs diagnose Markarian as traffic control. Does CORD adopt Resonance Ring in zg, or defer to Tower/herdr fleet topology (sibling `stack-mapping` strand)?

5. **Uncommitted harness runtime:** Is `src/harness/` + `USE_HARNESS_RUNTIME` the intended May-30 continuation, or superseded by cursor-shim/herdr spawn model?

6. **Meta-loop closure:** Journal names "Constellation developing Constellation" as the highest-value missing feature. Is that in scope for zg, or explicitly out-of-scope given live fleet runs outside zg?

7. **Lisp sibling relationship:** VISION.md:9-17 lists five iterations; zg is iteration 5. How does CORD reconcile zg thesis with sibling `lisp-walls` strand on shared vs divergent soul?

---

**Alignment check:** Report is read-only evidence for CORD synthesis. Wall classification posted to Tower. Pane ready to reap.