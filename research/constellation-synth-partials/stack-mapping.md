Gathering read-only evidence across Madewell, Rumen, herdr, Tower, and the verify gate to build the stack-mapping report.
# SAGT stack-mapping — Constellation concepts vs running stack

**Agent:** SAGT stack-mapping  
**Date:** 2026-08-13  
**Scope:** Read-only map of herdr, Madewell, Rumen, Tower, cursor-shim, agent-core vs Constellation concepts  
**Board:** finding posted to `constellation/research` (t-msrlp46p-yvqu)

---

## 1. What herdr changed (precise capability + evidence)

Constellation attempts (Lisp v6 First Cut #3, constellation-zg stars) built **process ownership and fleet visibility inside application code**. herdr moves that to a **machine-wide terminal substrate** that every harness shares.

| Capability | What Constellation hand-built | What herdr supplies today | Evidence |
|---|---|---|---|
| **Durable processes** | Lisp FC#3: OS-process supervisor via `uiop:launch-program`, one-for-one restart, zero orphans (board claim `pkg2-supervisor`, v6-slices) | Background server owns real terminal processes; panes survive detach, terminal close, SSH drop | `herdr/SKILL.md:24-27` |
| **Fleet topology** | Per-project worktrees + herdr panes ad hoc (same v6 board claims) | Workspace / tab / pane model, opaque IDs, `$HERDR_*` env injection | `herdr/SKILL.md:118-128` |
| **Agent identity** | Registration in app supervisor / star runner | `herdr agent start <name>`, lowercase-kebab registration, display vs registration split | `herdr/SKILL.md:71-75`, `control-flow.md:36-46` |
| **Live status** | Spine envelopes, file-based state (Lisp `spine.lisp`; zg artifact files) | Per-pane `idle` / `working` / `blocked` / `done` + sidebar attention queue | `herdr/SKILL.md:130-135` |
| **Observability chrome** | Custom CTL concepts in docs | CTRL fleet pane, tab-title glyphs via statem + `herdr tab rename`, TOWR viewer | `control-flow.md:74-90`, `statem/README.md:5-10` |
| **Coordination metadata** | zg: file-based Nebula pheromones (mostly unwired in code) | Herdr metadata tokens (`$task`, `$verdict`, `claim_*`) + Tower pheromone plane | `herdr-spine/docs/pheromones.md:1-8`, `COMMS-ARCH.md:49-59` |
| **Spawn discipline** | Orchestrator macros / star subprocess runner | `spine-spawn`, `cursor-spine`, herdr skill spawn loop with verified submit | `herdr-spine/docs/spawn.md:1-8`, `control-flow.md:57-63` |
| **Reaping** | Supervisor child-PID tracking (Lisp verify harness) | Done = gone; spawner closes pane; durable state on disk/board only | `control-flow.md:92-99`, `herdr/SKILL.md:93-101` |

**Contrast as concepts (not re-researching zg/Lisp trees):**

- **Lisp FC#3** (`supervisor.lisp`): supervision at the **OS-process boundary inside the Constellation repo** — launch, restart, orphan prevention. herdr makes that **substrate**: the multiplexer is the supervisor; agents are panes, not bespoke Lisp processes.
- **zg star subprocess runner** (`ORCHESTRATOR.md:258`): "Fault tolerance through file-based state, explicit restart logic, and OS process isolation. No supervision tree required." herdr **is** the supervision tree at terminal layer; zg's file-based coordination was meant to stack on top — today that upper layer is mostly **Tower + board**, not Nebula code paths (`TOWER_STIGMERGY_DESIGN_0812.md:70-74`).

**Net:** herdr eliminated the need to rebuild pane lifecycle, identity, status, and fleet visibility per Constellation iteration. What remains Constellation-specific is **role semantics, verify isolation, and stigmergic routing** — now living in agent-core profiles, cursor-shim, and Tower planes rather than in a greenfield runtime.

---

## 2. Made Well loop grammar (how it claims to be the lightweight-files factory)

**Canonical model** (`madewell/.madewell/LIFECYCLE.md:10-38`):

```
OUTER: while Discovery not empty → Commit → Build → Land  (cooperative pause each turn)
INNER: while Imagine not empty  → Plan → Make → Verify     (inside Build)
```

**Two state classes** (`madewell/SPEC.md:22-39`):

- **Ratchet state** — repo-committed plain text (`work/events.jsonl`, doors, queues). Doors MUST NOT read/write outside the repo.
- **Host telemetry** — heartbeats, odometry, spine envelopes — explicitly **out of scope** for the spec; lives wherever the host wants (this machine: Tower + herdr-spine).

**Lightweight-files claim:** "The format is the product; every implementation is replaceable" (`SPEC.md:9-11`). Reference CLI is vendored `mw`; any conforming host may tick the ratchet.

**Meta instruments** (`~/.madewell-meta/INDEX.md:13-30`): inner loop modules (imagine/plan/make/verify) and outer loop (discovery/commit/build/land) each have an instrument + capture process; maturity tracked per module. **Two doors** (`wire--two-doors-into-the-pipe.md:19-37`): Ground at Commit→Build, Verify at Make→Verify — both unconditional fan-outs with isolation.

**Mapping to control-flow** (`control-flow.md:48-55`):

| Control flow | Made Well |
|---|---|
| CORD | outer loop owner |
| ORCH | one Cycle |
| AGNT | imagine-queue item |
| SAGT | deferred / async |

**Tower relationship:** resolved 2026-08-05 — Tower/herdr-spine are **host telemetry**, not ratchet (`outer-loop/build/tower-review.md:54-60`, `SPEC.md:29-30`).

---

## 3. Rumen — one-paragraph role

Rumen is a **design-stage digestion engine** that metabolizes opinion sources (style guides, lint configs, code patterns) into a self-pruning pack of **fences** (hard checks), **intent-judges** (rubric LLM calls), **signs** (human taste), and a **lexicon** (mined vocabulary) — with promotion via accumulated "cud" (acceptance differential) and apoptosis when fences stop earning (`rumen/README.md:33-62`, `ENGINE-SPEC.md:33-112`, `NOMENCLATURE.md:28-33`). It ships no opinions; it is stack- and persona-free (`ENGINE-SPEC.md:13-25`). **Status:** architecture specified; two real codebase runs validated sorting; enforcement layer not wired into the live agent stack (`README.md:94-98`, `RISKS.md` cited there). **[UNKNOWN]:** where Rumen attaches in Made Well (Verify/Land only vs native Dark Phase catabolism) — open operator gate GAP-A3 per prior board findings.

---

## 4. Concept → running-system map

| Constellation term | Current artifact path | Status |
|---|---|---|
| **Pheromones / stigmergy** | `~/.tower/pheromones.jsonl` (19 lines); MCP `pheromone_emit` / `pheromone_field`; `COMMS-ARCH.md:49-96` | **Live (partial)** — fifth Tower plane operational; read-time TTL evaporation designed |
| **Nebula (zg file scents)** | `constellation-zg/src/core/pheromone.zig`; design `docs/TOWER_STIGMERGY_DESIGN_0812.md` | **Docs + unwired code** — API exists; stars bypass `emit` (`design doc:70-74`) |
| **Herdr-spine claim tokens** | `~/herdr-spine/docs/pheromones.md`, `bin/spine-claim` | **Live (advisory)** — cooperative `claim_*` TTL tokens; not a mutex |
| **Spine (spawn/control)** | `~/herdr-spine/` (`spine-spawn`, ctl-fleet); `~/cursor-shim/cursor-spine` | **Live** — two spawn paths (pi/claude vs cursor) |
| **Spine (ring buffer)** | Lisp `src/spine.lisp` (v6 FC); zg bounded buffer concepts | **Historical / docs** — not the live control plane |
| **Outer loop / houses (macro)** | `madewell/.madewell/LIFECYCLE.md`; `~/.madewell-meta/outer-loop/` | **Spec + meta instruments** — discovery/commit mature; build/land ○ |
| **Inner loop / four phases** | same + `~/.madewell-meta/inner-loop/` | **Spec + partial instruments** — verify ◐; gate half TBD |
| **Cycles** | `.madewell/madewell.json` + `work/events.jsonl` schema (`SPEC.md:45-55`) | **Spec live; instances partial** — Arc/constellation dogfood |
| **Stars / roles (6-star scaffold)** | `~/agent-core/primitives/profiles/` (concierge, coordinator, orchestrator, coder, test-maker, tester, arbiter); `models.json` | **Live (cursor-shim fleet)** — mapped in `inner-loop-verify.md:24-46` |
| **Dawn/Meridian/Descent/Night** | `inner-loop-verify.md:24-31` (mapping table only) | **Docs-only naming** — not separate runtime modules |
| **nQ / orbit questions** | `inner-loop-verify.md:140-145`; zg `polaris.zig` `RulingKind` | **Partial** — arbiter profile + doc protocol live; zg orbit code not in cursor path |
| **Markarian / concierge** | `primitives/profiles/concierge.md`; Circadian `<mind:*>` wake injection | **Live (operator tier)** — routes, does not implement; memory at wake |
| **Separated verify / isolation wall** | `cursor-spine:389-437`; `cursor-fleet make`; `inner-loop-verify.md:53-86` | **Live (cursor fleet)** — mechanical gate + forced coder worktree |
| **Telemetry / event bus** | `~/.tower/board.jsonl`, `ledger.jsonl`, `odometer.jsonl`; `statem.ts`; pi `tower-auto.ts` | **Live** — multi-plane COMMS-ARCH |
| **State machine / ratchet** | `madewell/SPEC.md`; `statem/README.md` | **Spec + live host tracker** — events.jsonl landing in constellation repos [UNKNOWN completion] |
| **Rumen walls / metabolism** | `~/rumen/` | **Design-only** |
| **Grounding / compile-in rules** | CC/pi grounding hooks; cursor `hooks.json` slim-guard | **Live (partial Rumen tier-1)** — ad hoc fences, not Rumen packs |
| **CTRL / fleet execution pane** | `control-flow.md:79-84`; `herdr-spine/docs/ctl-fleet.md` | **Live** |
| **Cache geometry / fanout briefs** | `control-flow.md:25-34` | **Live (law)** — prefix/tail spawn discipline |

---

## 5. How much of Constellation is already alive

Qualitative bands (no false precision):

| Layer | Band | Rationale |
|---|---|---|
| **Terminal substrate + spawn law** | **~75% live** | herdr + control-flow + spine-spawn/cursor-spine operational |
| **Message bus + comms planes** | **~70% live** | Tower mature; stigmergy plane young (19 pheromone rows) |
| **Made Well grammar (spec + meta)** | **~55% mature on paper** | LIFECYCLE + SPEC normative; build/land instruments ○; verify ◐ |
| **Inner-loop verify beat (cursor)** | **~80% of that slice** | Gate + worktree wall live; test-maker raw-path discipline gap noted (`inner-loop-verify.md:78-85`) |
| **constellation-zg runtime (stars/Nebula/markarian loop as code)** | **~15% wired** | Pheromone API mostly unused; filename schism (`TOWER_STIGMERGY_DESIGN_0812.md:70-79`) |
| **Rumen enforcement** | **~5%** | Design + 2 validation runs; no live pack on fleet |
| **Unified Constellation-as-one-system** | **~35–45%** | Same ideas under herdr/Tower/Madewell/cursor-shim names; not one executable constellation runtime |

**Honest summary:** The **orchestration fabric** Constellation kept re-implementing is largely alive under other names. The **zg-specific executable** (Nebula file ring, wired star orchestrator, Markarian watch loop in Zig) is mostly design + partial code, not the path the machine runs day-to-day.

---

## 6. Separated-verification: fabric vs flag

### What the shell gate gets right (fabric)

1. **Lowest spawn primitive** — gate lives in `cursor-spine`, not agent discipline (`cursor-spine:389-398`, `inner-loop-verify.md:109-116`).
2. **Criteria-before-code** — coder refused until `~/cursor-shim/.verify/<unit-key>/.authored` exists; authored via `verify-mark` / `cursor-fleet make` (`cursor-spine:407-415`, `309-324`).
3. **Filesystem isolation wall** — coder **always** forced `--worktree` in git repos (`cursor-spine:421-433`); `cursor-fleet make` parallel worktrees for implementer + test-maker (`inner-loop-verify.md:91-99`).
4. **Four-role separation** — profiles map to implementer / test-maker / tester / arbiter (`inner-loop-verify.md:39-46`).
5. **nQ on failure** — tester routes Q to arbiter, not self-diagnosis (`inner-loop-verify.md:140-145`).

### What makes it a flag (not full fabric)

1. **Env bypass** — `CURSOR_VERIFY_GATE=off` lifts **both** criteria gate and forced worktree together (`cursor-spine:401-404`, `427`).
2. **Audit plane mismatch** — bypass rows append to `TOWER_LEDGER` defaulting to `~/.tower/board.jsonl` (`cursor-spine:59`, `403-404`), not a dedicated audit ledger; doc says "Tower ledger" (`inner-loop-verify.md:131-133`) while code targets board plane.
3. **Non-repo fallback** — outside git repos, worktree N/A → "profile-discipline fallback" only (`cursor-spine:428-441`).
4. **test-maker asymmetry** — raw `cursor-spine test-maker` without `--worktree` relies on discipline; only `make` path guarantees symmetric isolation (`inner-loop-verify.md:78-85`).
5. **Harness scope** — gate enforced for **cursor-shim fleet**; pi/claude paths use spine-spawn/herdr skill without this shell gate [UNKNOWN: equivalent mechanical gate elsewhere].
6. **Madewell module gap** — meta verify module still lists "Encode builder≠verifier isolation as a hard gate" as open (`inner-loop/verify/MODULE.md:29`).

**CORD architectural takeaway:** Separated verify is **real mechanical fabric at the cursor spawn primitive** for git-backed code work, with a **single audited break-glass**. It is not yet **universal Made Well ratchet state** — it lives in host telemetry (`cursor-shim/.verify/`), same class as Tower per SPEC §1.

---

## 7. What to STOP building (duplication evidence)

| Stop | Because already exists |
|---|---|
| **In-repo OS-process supervisor** (new Lisp/Zig star runner) | herdr owns pane/process lifecycle; FC#3 was historical (`board v6-slices` claims ran in herdr panes anyway) |
| **Second message bus / Nebula parallel to Tower** | Tower + pheromones.jsonl live; zg Nebula unwired (`TOWER_STIGMERGY_DESIGN_0812.md:61-62`) |
| **Custom multiplexer / fleet dashboard** | herdr + CTRL + statem + twr (`control-flow.md:74-90`) |
| **Another spawn wrapper** bypassing spine-spawn / cursor-spine | Verified-submit discipline codified (`spawn.md:1-8`) |
| **Rewriting Made Well state machine** | LIFECYCLE + SPEC + statem transition table |
| **Parallel verify gate in agent prompts only** | Extend `cursor-spine` / `verify-mark`; meta module still open but host gate exists |
| **Document pile for conventions without metabolism** | Rumen's stated purpose (`README.md:56-62`); interim: grounding hook + rules |
| **Tower-in-kernel collision fixes** | Resolved: host telemetry vs ratchet (`tower-review.md:54-60`) |

---

## 8. Open questions for CORD

1. **Pheromone unification** — Tower `pheromones.jsonl` vs herdr `claim_*` tokens vs zg Nebula filename scents: one stigmergy model or three coexistence layers?
2. **GAP-A3 (Rumen attachment)** — Verify/Land only, or also native Dark Phase / catabolic review at Land? (Prior board: d003 + GAP-A3 batched operator gate.)
3. **GAP-A2 (events.jsonl ratchet)** — Status of landing Made Well `work/events.jsonl` in constellation repos vs Tower-as-telemetry-only.
4. **Audit plane** — Should `verify-gate-bypass` rows go to `ledger.jsonl` or a dedicated audit topic, not `board.jsonl`?
5. **test-maker worktree** — Force `--worktree` on all test-maker spawns (symmetric wall) or accept discipline gap?
6. **Cross-harness verify** — Mechanical gate for pi/claude spine-spawn path, or cursor-only by design?
7. **Build/Land outer-loop instruments** — `INDEX.md:28-29` still ○; tower-review Q3 operational half [UNKNOWN].
8. **Constellation-zg code path** — Wire zg pheromone.zig to Tower, or treat zg runtime as research fork and map concepts only?

---

## Sources (this session)

- `~/madewell/SPEC.md`, `MADEWELL.md`, `.madewell/LIFECYCLE.md`
- `~/.madewell-meta/INDEX.md`, `wire--two-doors-into-the-pipe.md`, `inner-loop/verify/MODULE.md`, `outer-loop/build/tower-review.md`
- `~/rumen/README.md`, `ENGINE-SPEC.md`, `NOMENCLATURE.md`
- `~/agent-core/primitives/skills/herdr/SKILL.md`, `rules/control-flow.md`, `tools/statem/README.md`, `profiles/concierge.md`, `profiles/models.json`
- `~/.tower/COMMS-ARCH.md`, `~/.tower/pheromones.jsonl` (19 lines)
- `~/cursor-shim/cursor-spine`, `docs/inner-loop-verify.md`
- `~/herdr-spine/docs/spawn.md`, `docs/pheromones.md`
- `~/constellation-zg/docs/TOWER_STIGMERGY_DESIGN_0812.md`
- Board backup evidence for Lisp FC#3: `agent-core/briefs/tower/bus-data/backups/board.jsonl.*` (v6-slices claims)

---

**Verdict:** Constellation's orchestration intent is **already alive in fragments** — herdr (substrate), Tower (bus + partial stigmergy), Madewell (ratchet grammar), agent-core (roles), cursor-shim (verify fabric). The missing piece is **unification and ratchet landing**, not rebuilding supervision or messaging from scratch.

**Pane status:** idle — report complete; board posted.