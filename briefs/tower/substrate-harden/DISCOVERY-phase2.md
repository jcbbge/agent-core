# Discovery — Tower Phase 2 (write discipline)

**Stage:** Discovery (outer take-in). Candidates, not queue members.
**Date:** 2026-08-14
**Source:** operator session (AI-chat + prior research notes + Phase 1 GROUND)
**Participants:** operator; concierge; CORD [Tower] Phase 1
**Maturity:** PLANNING on the failure mode (grounded in code); IDEATION on home-repo / Fut / RuntimeAdapter
**Signal density:** HIGH
**Ground:** `briefs/tower/substrate-harden/PHASE1-GROUND.md`

Do NOT use emojis anywhere.

---

## Classification

This is not a blank-slate redesign. Phase 1 already ruled: **gate-and-schema-harden, not rewrite.**
The hierarchy (Operator → CORD → ORCH → AGNT) and Herdr as runtime stay. Tower already has
four typed scents, a real append path, and working sense APIs. What does not exist is a
mechanical refusal when an agent finishes without depositing.

---

## The One Thing

**"Done" is still a private event.** Herdr can flip idle. A `.done` file can appear. A
sidebar verdict can light. None of those are the environment. Semantic completion was
defined as a successful write to the field — and then left as a prompt. Until the
environment can refuse a finish, stigmergy is a costume on a messenger bus. That is the
entire Phase 2. Everything else is secondary.

---

## Lenses

### Substance — what the work must do

Make finish-without-deposit mechanically hard. One official write path already exists
(`pheromone_emit` / CLI `emit`). Do not invent a second. The missing piece is a gate:
if a pane holds a live `work-claimed` (or a brief-stamped claim id), Stop / idle
completion is refused unless a matching `work-done` exists or a live `need-help` is
posted.

Smallest useful version: that gate + one probe topic that proves an agent cannot go
idle silent.

### People

- Operator: coordination plane he currently is, by hand. He needs the environment to
  hold the discipline he already proved works when he copy-pastes.
- CORD/ORCH: must sense cheaply. They already can (`pheromone_field`) when writes happen.
- Workers: will skip optional tools. Do not train them; constrain them.

### Process — how it actually works today

Shadow workflow: brief says emit; agent writes code; touches `.done`; pane goes idle;
spawner reaps. Field never sees `work-done`. `17-field-pull` may re-offer open work to
an idle pane — it does not invent a completion. `stop-guard` only blocks on operator
mail / open questions. `40-tower-bridge` fabrication is OFF (correct: status is not mail).
`spine-claim` is a parallel ownership system (Herdr tokens + board) that can release
without ever touching pheromones.

### Gap

- No `task.started` / `blocked` / `failed` scents — not required to fix the failure mode.
- `work-done.ref` doctrine says "the claim"; field derivation completes when
  `ref === available.id`. Live majority follows the code (125 vs 9). Unfixed, the gate
  will encode the wrong id and look like it "doesn't work."
- Claim TTL 30s + heartbeat-by-shell-loop: field lies about ownership; agents abandon it.
- No RuntimeAdapter. Fine. Defer.

### Subtext

The operator's charge ("Tower has never worked") is not a request for a new product.
It is the same sentence as Phase 1's histogram: 518 claimed / 146 done. He already
named the mechanism in the meta-prompt: write is optional; lifecycle ≠ semantic
completion. The research notes keep offering Fut, Elixir, Zig, a `~/tower` extract.
He then said: focus the current setup; language is secondary. **Adopted-untested
vocabulary to translate once:** "RuntimeAdapter", "TraceType", "deposit_trace" — map
onto existing `pheromone_emit` / four scents. Do not mint a parallel schema.

What he stopped asking about: replacing Herdr. That is released.

### Meta

Discovery for this machine's bus should not live in Arc's `STAGING.md`. This artifact
is the pool item. Commit is the valve — admit **one** unit (the write gate) into Build.

---

## Named patterns

| Name | Meaning |
|---|---|
| **Private done** | Lifecycle or filesystem says finished; field does not. |
| **Prompt-optional deposit** | The official write exists; nothing refuses its absence. |
| **Dual claim** | `spine-claim` (tokens+board) vs pheromone `work-claimed`. Finishing one is not the other. |
| **Ref fork** | Docs point `work-done.ref` at the claim row; runtime completes the available id. |
| **Thirty-second lie** | Claim TTL trains the field to forget owners mid-unit. |

---

## Routed findings

| ID | Lens | Finding | Route | Evidence |
|---|---|---|---|---|
| d-write-gate | Substance | Stop/idle must refuse unless `work-done` or `need-help` exists for the live claim. | **discovery** (Commit first) | PHASE1 §3–§5; `stop-guard.mjs`; `40-tower-bridge` |
| d-ref-align | Gap | One meaning for `work-done.ref` — recommend available id (matches code + 125/146 live). | **discovery** (same Build, first slice or tight sibling) | PHASE1 §8; `pheromoneFieldFromRows` |
| d-claim-ttl | Process | Heartbeat is unusable at 30s; raise TTL and/or add a first-class heartbeat. | **discovery** (after gate, or same cycle if cheap) | `SCENT_TTL_DEFAULTS`; codify-stigmergy.done |
| d-identity-card | Substance | Document work_item_id = available.id, agent_id = from, payload_ref = brief/artifact. | **discovery** (docs, same cycle) | PHASE1 §6 |
| — | People | Extract `~/tower` as product home | **release** | W0 already split code/state; does not fix private done |
| — | Process | Fut / RuntimeAdapter this wave | **release** | No local Fut; adapter is a later seam |
| — | Substance | Expand to 8 TraceTypes before the gate | **release** | Four scents already cover claim/done/need |
| — | Gap | Rewrite Tower / new store (Postgres) | **release** | Append path works; failure is enforcement |

---

## Proposed queue (Commit valve — not yet admitted)

Ready to queue (route: discovery):

- **[d-write-gate]** "Finish is not a feeling" — mechanical write gate on Stop/idle.
  Scope: `primitives/mcps/tower/hooks/` (beside `stop-guard.mjs`), optional
  `17-field-pull` / bridge touch, probe topic `tower/substrate-harden-probe`.
  Includes **d-ref-align** as a prerequisite slice (gate will encode the wrong id
  if left forked).
- **[d-claim-ttl]** Claim TTL / heartbeat — only if the gate lands and the 30s lie
  still bites in the probe.
- **[d-identity-card]** One-page identity card in COMMS-ARCH — cheap, same Land.

Needs a decision before queueing:

- None that block d-write-gate. Ref meaning: **ruled here as available id** unless
  the operator overturns (code + live majority already chose).

Releasing (not kept this wave):

- `~/tower` extract, Fut, RuntimeAdapter, TraceType expansion, store rewrite.

**Recommended Commit:** admit **only** `d-write-gate` (+ ref-align as its first
Imagine item). That is one outer-loop iteration.

---

## Imagine seed (for the Cycle, once Committed)

1. Align `work-done.ref` = available id in COMMS-ARCH + emit docs + one test.
2. Implement the refuse-to-idle/stop gate; prove with probe topic.
3. Identity card paragraph in COMMS-ARCH.
4. TTL/heartbeat only if probe still shows evaporating claims as the blocker.

Verify: an agent with a live claim cannot end cleanly without `work-done` or
`need-help`. Disposable topic. No production board surgery.

---

## Out of this Discovery

Arc leftovers (pull, Neon teardown, canary, re-scope) are a **different project
queue**. They do not enter this item.
