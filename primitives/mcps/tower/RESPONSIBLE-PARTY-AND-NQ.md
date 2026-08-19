# RESPONSIBLE-PARTY & nQ — the escalation topology of the Tower bus

Status: DESIGN OF RECORD (2026-08-11, operator mandate — after a live
production-down of the coordination plane: a blocking question could not be
closed by a human reply and re-injected on every agent turn across every pane
of a repo, storming the operator). This file is the enforced companion to
`COMMS-ARCH.md`: COMMS-ARCH names the *planes*; this names the *hierarchy and
the escalation budget* that keep the operator plane rare. Where the two touch,
they agree by construction; COMMS-ARCH's "operator NEVER receives fleet mail
verbatim; the coordinator exercises judgment" is exactly what the nQ budget
below makes mechanical.

Lineage of the idea: this is the constellation **nQ protocol** ported to Tower.
`constellation-zg/src/core/orbit.zig:9` — *"nQ = the number of unresolved
questions a star holds. A star must reach nQ=0 before emitting its
deliverable."* `constellation/docs/excavation/60-m1-archive.md:183` —
*"nQ=0 with a hard ceiling and mandatory escalation … maximum three orbits;
then a human is required."* Escalation always travels **one link up** a routing
table (`orbit.zig:16-22 answeringStar`); the human is reached **only** through
the top tier (Markarian/Concierge). We keep the semantics; the mechanism is a
derived-routing ledger, not a file poller.

---

## 1. The topology — four bands, one responsible party per link

```
Facilitation   →  Concierge      (rank 0)  the ONLY human-facing tier
Coordination   →  Coordinator    (rank 1)  reads fleet mail, exercises judgment
Orchestration  →  Orchestrator   (rank 2)  owns its workers, runs the work
Delegation     →  Agent/Subagent (rank 3/4) ephemeral executors
```

Delegation flows **down**; escalation/reporting flows **up**, one link at a
time. The operator (the human, rank −1) sits above Facilitation and is reached
only from it, only after the budget below is spent.

**The responsible party is never null.** Every spawned agent, at spawn, records
its **parent** (the pane that spawned it) and its **role/rank**. That record is
durable (a `kind:"lineage"` ledger row) and lasts the agent's whole lifecycle.
An agent with no recorded parent is a top-of-tree surface (Coordinator /
Concierge) and its escalation target is the operator directly.

---

## 2. nQ — the escalation budget

A question is born with a budget **`nq` (default 3)** and a target **`to`** =
the asker's responsible party (its parent), *not* the operator.

- While `nq > 0`, the question is the responsible party's to answer. It is
  surfaced **only** to that one party (never fanned across the repo's panes).
- The responsible party does one of three things (the constellation
  ANSWER / USE-DEFAULT / ABANDON restarts):
  1. **Answer** it (a coordinator can and should answer a subordinate's
     question — `tower_relay({answers})`).
  2. **Escalate** it (`tower_escalate`) — decrements `nq`, re-targets `to` one
     link up (its own parent). This appends a `kind:"escalation"` row; effective
     routing is derived from the latest escalation, never mutated in place.
  3. **Abandon** the unit of work (answer with an ABANDON ruling).
- The operator (human) is reached **only** when `to` has climbed to `operator`
  — i.e. the budget is spent or the asker was already a top-of-tree surface.
  **No question reaches the human until the 3-turn budget is exhausted.**

Effective routing (derived, append-only):
- **Well-formed first.** A question without a non-empty trimmed `message` is
  malformed — dead-letter it (`~/.tower/dead-letter.jsonl`); do **not**
  compute `effectiveTo` toward the operator. Content-free rows
  (`id`/`ts`/`cwd`/`kind` only) caused the 2026-08-13 doorbell storm when
  the legacy fallback applied blindly (COMMS-ARCH §Alarm rationalization).
- `effectiveTo(q)` = `to` of the latest `escalation` row referencing `q.id`,
  else `q.to`, else (legacy well-formed, no `to`) `operator`.
- `effectiveNq(q)` = `(q.nq ?? 0) − count(escalation rows for q.id)`.
- A question surfaces to a pane iff it is well-formed **and**
  (`effectiveTo === thatPane`, or (`effectiveTo === "operator"` and the pane
  is a top-of-tree/coordinator surface)). One question → exactly one surface.
  No storm.

---

## 3. The ruling rubric — stamped on every question

Every question carries the decision rubric so the responsible party rules by it
rather than reflexively escalating. Escalate only when the rubric genuinely
cannot decide **and** the budget is spent:

> - Does it lead to **craft, beauty, and care**?
> - What choice leads to **world-class DX**?
> - What decision provides a **memorable and lovable UX**?
> - What gets us closer to an **efficient, optimized agentic experience**?

Rule with the rubric. The human is the last resort, not the first reflex.

---

## 4. The human-answer path (the bug that caused the outage)

A human's typed reply in the operator surface **closes** the open operator
question it is answering — it becomes a real `kind:"answer"` row (`ref` = the
oldest open operator-scoped question). Before this fix, a reply was inert
(only `tower_relay({answers})` wrote an answer), so the question never closed
and re-injected forever. Guard: a leading-slash command or empty text is not an
answer.

---

## 5. Invariants (enforced, not advised)

1. Every spawned agent has a recorded responsible party for its whole life.
2. A question is directed at exactly one responsible party and surfaces to
   exactly one surface.
3. The operator is reached only after `nq` is spent (≤ 3 turns up the chain),
   or when the asker is a top-of-tree surface.
4. A human reply at the operator surface closes the question it answers.
5. Routing changes are additive (`escalation` rows); the ledger is never
   rewritten.
6. Status is never mail (COMMS-ARCH §Four planes) — nQ governs the *question*
   plane only; it never turns a status flip into an operator summons.

Implementation: `~/.pi/agent/extensions/tower-auto.ts` (tower_ask routing,
tower_escalate, injection scoping + nQ, human-answer path),
`~/muster/bin/muster-spawn` (lineage row + `parent=` token at spawn),
muster parent-wake (reads `parent=` pane token to resolve spawner).
Grammar (`tower-ledger.mjs`) is unchanged —
all new fields are additive.

---

## 6. Field expression of nQ

The field expression of nQ (alongside the ledger plane in §2) closes the gap
between inbox semantics and the stigmergic trace. The ledger plane (§2) owns
question birth, escalation rows, and derived routing.
The stigmergic field (COMMS-ARCH plane 5) must express the same semantics in
the trace so escalation is **observable in the environment**, not only in the
inbox plane. The two planes agree by construction; they are not two copies that
drift.

**Vocabulary (preserved verbatim from constellation):**
`constellation-zg/src/core/orbit.zig:9` — *"nQ = the number of unresolved
questions a star holds. A star must reach nQ=0 before emitting its
deliverable."* Escalation always travels **one link up** a routing table
(`orbit.zig:16-22 answeringStar`); the human is reached **only** through the
top tier (Markarian/Concierge).

### `need-help` on the field

When an agent cannot proceed, it emits `need-help` instead of silence or
push-and-wait. Required semantics:

| Field | Meaning |
|---|---|
| `nq` | Remaining escalation budget: `(initial_nq ?? 3) − count(escalation rows for this question)`. Mirrors `effectiveNq(q)` on the ledger. |
| `route` | Derivation hint resolving **one link up the lineage** — the responsible party at the next tier. Never a hard address; never fanned across panes. |
| `ref` | Binds to the ledger question id. The field row and the ledger row are one truth: `ref` = `q.id` from the open `kind:"question"` row. |

### Field ↔ ledger binding

- Birth: agent opens a ledger question (`tower_ask` / equivalent) **and**
  emits `need-help` with `ref` = that question's id, `nq` = initial budget,
  `route` = parent derivation hint.
- Escalation: append a ledger `kind:"escalation"` row **and** emit a new
  `need-help` pheromone (append-only; never mutate in place) with decremented
  `nq` and `route` re-derived one link up — consistent with `effectiveTo` /
  `effectiveNq` being derived from the latest row.
- Answer: ledger `kind:"answer"` closes the question; the agent clears its local
  open-question set before emitting `work-done`.

### THE LOAD-BEARING INVARIANT: nQ=0 before deliverable

An actor must reach **nQ=0** — no unresolved questions it owns — before emitting
`work-done` or any deliverable. Field check: if open questions remain, refuse
`work-done` and either continue independent work or emit `need-help` naming what
is blocked. This is the rule that makes the whole protocol mean something —
without it, an agent can declare victory over an open question.

### One surface (no regression)

One question → exactly one surface. No storm. Route derivation must yield
precisely the responsible party; never fan `need-help` across a repo's panes.
The operator is reached only when the budget is spent, and only through rank 0.
