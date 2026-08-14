Reconstructing the v6 Lisp Constellation arc from docs and git history. Reading key files and searching the tree.


# Lisp Constellation (v6) — Walls & Made Well Adoption

Research report for CORD. Sources: docs + git history in `/Users/jrg/constellation` only. Read-only.

---

## 1. What v6 Lisp Constellation Was Trying to Be

v6 reframes Constellation from "whole organism reaching for a substrate" to **Constellation's Level-0 Harness in Common Lisp** — the pipe-owning kernel where Made Well's laws (grounding, ratchet, cooperative pause) become language primitives, not optional consults.

```3:8:README.md
**Constellation's Level-0 Harness, built in its native language (Common Lisp).**

The pipe-owning kernel: the layer where the laws an agent runtime is supposed to obey stop being prose in a document and become primitives in a language. Grounding,
verification, the ratchet, the cooperative pause — expressed as forms, not as a
framework asking to be followed.
```

```9:15:docs/CONSTELLATION-V6-CONVERGENCE.md
**Identity (decided):** This is **Constellation 6** — specifically **Constellation's Level-0
Harness, built in its native language (Common Lisp)**. The scope changed: earlier Constellations
were the whole organism reaching for a substrate; v6 is the substrate itself — the pipe-owning
kernel where Made Well's laws stop being prose and become primitives. Not "Made Well Lisp" (Made
Well is the host-agnostic grammar; pinning it to Lisp would violate its own ethos).
```

**Thesis in one line:** "the pipe does not have to be argued for, because the pipe is the language" (`docs/CONSTELLATION-V6-CONVERGENCE.md:39-41`).

**MVP scope (convergence plan):** Tier-1 spine + fractal + contact points first; Tier 2–4 (Nebula/pheromones, Firmament, four-layer memory, autonomy gradient, skins) deferred until a breathing loop exists (`docs/CONSTELLATION-V6-CONVERGENCE.md:172-183`, `:105-106`).

**Build method:** Dogfood Made Well — run v6 as a Made Well project with agent-as-concierge (`docs/CONSTELLATION-V6-CONVERGENCE.md:186-196`).

**Status at tip (599e77f):** First Cuts landed and c001 independent verification green; stage returned to **discovery** with an empty active queue and nine queued discovery items (`/.madewell/madewell.json:4-8`).

---

## 2. Iteration Ledger

### Excavated priors (v0–v5)

| # | Runtime | Crystallized | Failure / stop mode | Source |
|---|---------|--------------|---------------------|--------|
| 0 | Manual (no repo) | Four phases irreducible; six agents; validated by hand for months | Doesn't scale past one human | `docs/excavation/60-m1-archive.md:22-44` |
| 1 | Various | Celestial namespace (stars, constellations, galaxies) | Collapsed; only vocabulary survives | `docs/excavation/10-lineage.md:21-26`, `00-DOSSIER.md:34` |
| 2 | TypeScript v.01 | Pheromones, stigmergic coordination, nQ protocol | Archive `~/constellation-ts` ABSENT; stopped ~40% | `10-lineage.md:28-34`, `60-m1-archive.md:103-106` |
| 3 | TypeScript v.02 | SurrealDB Nebula; Adliyye Codex visual | DB nebula walked back to files in v5 | `10-lineage.md:36-41`, `00-DOSSIER.md:36` |
| 4 | Gleam/BEAM | Actor model, fault isolation, supervision instinct | Archive `~/constellation-gl` ABSENT; "right idea in wrong place (in-image)" | `10-lineage.md:44-48`, `CONSTELLATION-V6-CONVERGENCE.md:90-96` |
| 5 | Zig (`constellation-zg`) | Sensor-array spine, organism, fractal L0–5, Firmament, four-layer memory, autonomy gradient, catabolism | Binary ran; design re-specified each substrate descent | `20-v5-organism.md`, `60-m1-archive.md:124-129` |

**M1 archive correction:** Stalls at ~40% were **deliberate descents** to layers not owned (hand → roles → orchestration → someone else's harness → Gleam → own everything in Lisp), not planning loops (`60-m1-archive.md:12-18`, `:103-106`). Real cost: re-deriving settled design per runtime — 27,782 lines markdown vs ~650 lines working runner (`60-m1-archive.md:124-129`).

### v6 tree (`~/constellation`) — 31 commits, 2026-07-22 → 2026-08-05

| Phase | Dates / commits | What happened |
|-------|-----------------|---------------|
| Genesis | `bce5816` 2026-07-22 | Convergence plan, preflight research, excavation dossier |
| Toolchain | `b16b929` 2026-07-25 | SBCL/ocicl/FiveAM; `make test` green |
| Excavation | `188b001`, `c4c9935` 2026-07-25 | M1 archive read; 40%-as-descent correction |
| First Cut #1 grounding | `019dd3e` 2026-07-25 | `src/claim.lisp`, `src/spine.lisp` |
| Made Well install | `e7161aa` 2026-07-25 | `install.sh`; `.madewell/` framework |
| First Cut #2 escalate/resume | `2d23eb5` / merges | `src/escalate.lisp` |
| Spine ring | `e4a61d8` / merges | Bounded ring buffer |
| Dictionary | `f86873a`, `3cdd0a0` | `src/dictionary.lisp`; code-intel gate closed |
| First Cut #3 supervisor | `acb500c` / merges | `src/supervisor.lisp`; OS-process boundary |
| REPL-over-MCP decision | `00616dd`, `5e419b6` | GO conditional; license gap flagged |
| Made Well real adoption | `4073eab` 2026-07-25 | State backfill; coordination failure diagnosed |
| Pane Compiler PRD | `3022568` 2026-07-27 | Context-layer blueprint routed in |
| Neo ergonomics | `9dd49d3` | DX/AX research landed |
| c001 verification wave | `dfcb747` → `4e490b9` 2026-08-05 | Six packages independently verified; `bin/claim-gate.sh` |
| Discovery (tip) | `599e77f` 2026-08-05 | Water borrowings → d012 brief ready, d013 blocked |

### What landed vs remained

**Landed in `src/`:** `claim.lisp`, `spine.lisp`, `escalate.lisp`, `supervisor.lisp`, `dictionary.lisp`, `hello.lisp`, `package.lisp` — First Cuts 1–3 + dictionary + spine ring.

**c001 verification (2026-08-05):** claim 72/72, spine 53/53, escalate 51/51, supervisor 57/57, dictionary 499/499, claim-gate 12/12 — zero implementation defects; two test-side bugs repaired (`/.madewell/madewell.json:8`, commit `9df4771`).

**Not built (convergence Tier 2+):** fractal harness recursion, Nebula/pheromones, Firmament, four-layer memory, autonomy gradient, Dark Phase Accretion, skins/visualizer, semantic memory, Levels 3–5 (`docs/CONSTELLATION-V6-CONVERGENCE.md:78-183`).

**Blocked at tip:**

| ID | Item | Block reason |
|----|------|--------------|
| d006 | REPL-over-MCP bridge | jsulmont/mcp-lisp has no license file (`.madewell/madewell.json:36`, `DECISIONS.md:20`) |
| d013 | Temporal escalation policy | No async coordinator/operator ask channel — handlers run synchronously in-stack (`madewell.json:37`, `DECISIONS.md:30`) |

**Ready but uncommitted:** d012 — water borrowings brief at `.madewell/specs/2026-08-05-water-borrowings.md` (`599e77f`, `madewell.json:29`).

---

## 3. Wall Classification (post-2026-08-05)

**Tip commit intent:** Discovery-stage capture of external ideas (manthanguptaa/water@454a86b); route borrowings to d012 (brief ready) and d013 (blocked); await Commit-gate on discovery queue (`599e77f` message, `/.madewell/work/status.jsonl:30-31`).

### Primary wall: **unresolved concept** (Commit-gate paralysis)

After c001 Land, `stage=discovery`, `active=[]`, and the open thread is explicitly a **Commit decision** among d003–d012 (`madewell.json:9`, commit `4e490b9`). Nine discovery items cover identity (d003), architecture (d004), convergence of orbiting organs (d005), Pane Compiler (d007/d008), ergonomics (d010), coordination gaps (d011), and kernel hardening (d012). None were committed at tip.

The M1 archive names v6's inverted risk profile: substrate question is closed; the guardrail is **re-specification instead of execution** (`60-m1-archive.md:243-250`, `PRODUCT.md:141-142`).

### Secondary wall: **missing technology**

- **d013:** Temporal escalation (deadline racing coordinator) requires an async operator/coordinator channel that does not exist — "v6 handlers run synchronously in-stack, so a deadline has nothing to race yet" (`madewell.json:37`, d012 brief `:153`).
- **d006:** REPL-over-MCP blocked on license resolution (`DECISIONS.md:20`).

### Tertiary wall: **unaffordable cost** (process / attention, not dollars)

- c001 exposed coordination tax: implementers writing own tests (Made Well never-do #11), Tower used instead of `.madewell/work/board.jsonl`, 33 contract ambiguities parked (`4073eab`, `4e490b9`).
- Historical pattern: 27,782:650 markdown-to-code ratio across v1–v5 (`60-m1-archive.md:133-136`); v6 at tip had substantial verification/docs surface vs kernel scope.

**Wall summary:** Stall is **not substrate** (Lisp descent bottomed out per `60-m1-archive.md:237-241`). It is **unresolved concept** (which discovery item to Commit next) compounded by **missing technology** (async ask channel for d013; mcp-lisp license for d006), with **unaffordable cost** as the standing guardrail against doc accretion.

---

## 4. Made Well Relationship in This Tree

Made Well is **dogfood grammar**, not successor or substrate.

| Role | Evidence |
|------|----------|
| **Not successor** | v6 is the Level-0 harness; Made Well stays host-agnostic prose grammar (`CONSTELLATION-V6-CONVERGENCE.md:12-13`, `README.md:47-49`) |
| **Not substrate/runtime** | Made Well is "referenced, not vendored"; installed via droppable `install.sh` (`README.md:47-49`, `DECISIONS.md:17`) |
| **Dogfood grammar** | "we run the v6 build *as a Made Well project*, proving the grammar on its own successor" (`CONSTELLATION-V6-CONVERGENCE.md:186-190`) |

**Adoption arc:**

1. **`e7161aa` (2026-07-25):** Install — `.madewell/` framework, loader blocks in `AGENTS.md`/`CLAUDE.md`, `MADEWELL.md` human door.
2. **`4073eab` (2026-07-25):** Real adoption after coordination failure — Made Well was "installed as a file drop and never followed"; state backfilled; profile=`lead`; WORKER-CONTRACT written; violations recorded (coordinator wrote code, implementers wrote own tests).
3. **c001 (2026-08-05):** First full Made Well cycle with Tower-bus orchestrators, independent verification, Land → discovery.

**Origin from archive:** Made Well spun off when Constellation hit harness walls — "portable prose" for non-technical users; "host-agnostic was the point" (`60-m1-archive.md:221`, `PRODUCT.md:103`).

**Operator decision:** Repo stays "Constellation"; Made Well referenced, not formally cited as grammar (`DECISIONS.md:10`).

---

## 5. Language Choice — Why Lisp, What It Cost

### Why Lisp (cited)

| Claim | Source |
|-------|--------|
| Pipe becomes language — conditions/restarts for pause, macros for primitives | `CONSTELLATION-V6-CONVERGENCE.md:39-41`, `:73-76` |
| Descent bottomed out — own harness + runtime at worker/orchestrator/coordinator; "no layer below this one" | `60-m1-archive.md:118`, `PRODUCT.md:86-93` |
| Fractal = one recursive function vs separate Zig modules | `CONSTELLATION-V6-CONVERGENCE.md:62-69` |
| nQ upgrade: condition/restart beats file polling | `CONSTELLATION-V6-CONVERGENCE.md:84-88` |
| Distribution viable: per-platform SBCL native binary, zero user Lisp exposure | `DECISION-2026-07-22-distribution.md:1-13`, `:159-164` |
| Toolchain: SBCL 2.6.6 + ocicl 2.17.0 + FiveAM | `ENV-2026-07-22-lisp-tooling.md:11`, `README.md:55-57` |

### Costs (cited)

| Cost | Source |
|------|--------|
| LLMs write CL worse than TS; REPL-over-MCP is day-one DX mitigation | `CONSTELLATION-V6-CONVERGENCE.md:210-212` |
| No cross-compilation — build per platform in CI | `DECISION-2026-07-22-distribution.md:34-35`, preflight `:34-35` |
| Coraline/KotaDB do not parse Lisp; live-image dictionary instead | `DECISION-2026-07-22-code-intel.md:9-23`, `:53-57` |
| Alive LSP pre-MVP; operator editor secondary to agent-driven REPL | `ENV-2026-07-22-lisp-tooling.md:23` |
| Layer 4 descent: Gleam was "right substrate, not a Gleam dev" | `60-m1-archive.md:117`, `PRODUCT.md:85` |
| Browser = thin client only; no SBCL WASM | `DECISION-2026-07-22-distribution.md:107-124` |

[UNKNOWN]: Explicit operator quote choosing Lisp over Zig on a specific date beyond the descent table — the archive documents the descent rationale, not a standalone "why not stay on Zig" decision record.

---

## 6. Open Questions for CORD

1. **Commit-gate:** Dispatch d012 (ready brief, kernel-only, no new modules) vs adjudicate d003/d004/d005 first? Tip explicitly leaves this to operator (`599e77f` TODO).
2. **d013 sequencing:** Build async coordinator channel as its own slice before temporal escalation, or defer d013 until multi-star coordination exists? Block record says it unblocks with "async coordinator channel" (`madewell.json:37`).
3. **Re-spec vs execute guardrail:** M1 archive and PRODUCT.md flag markdown:code ratio as the failure mode now that substrate is closed. Does CORD enforce a "no new design docs until d012 ships" rule?
4. **Orbiting organs (d005):** Convergence plan and celestial namespace decision (`DECISIONS.md:12`) say bring Rumen/Strudel/Tower/Circadian in — is that in scope for v6 kernel work or a separate convergence track?
5. **Pane Compiler (d007/d008):** PRD landed 2026-07-27 with five open questions — does context-layer work block agent-loop work, or run parallel?
6. **Latent Workspace (d004):** Only 10X-scored idea in archive, unbuilt across five iterations (`60-m1-archive.md:187-191`, `:252-256`) — deliberate defer or v6 candidate?
7. **Remote/shipping:** Private `jcbbge/constellation-v6` per `DECISIONS.md:24`; "only push to origin/main constitutes operational closure" is operator doctrine from mind — does constellation v6 have a ship criterion beyond `make test` green?
8. **mcp-lisp (d006):** License resolution path — ask author, vendor stdio-only, or alternate bridge?

---

## Board Finding (posted to `constellation/research`)

v6 tip `599e77f`: c001 LANDED; First Cuts + six-package verification green; stage=discovery, active empty. Stall is not substrate. Wall = unresolved concept (Commit-gate on d003–d012) + missing technology (d013: no async ask channel; d006: mcp-lisp license). d012 ready awaits Commit. Guardrail: re-spec vs execute (M1 60:11, PRODUCT 141-142).