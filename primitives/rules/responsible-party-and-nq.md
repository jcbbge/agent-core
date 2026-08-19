# RESPONSIBLE-PARTY & nQ — the escalation topology of the Tower bus

Status: DESIGN OF RECORD (2026-08-11, operator mandate — after a live
production-down of the coordination plane: a blocking question could not be
closed by a human reply and re-injected on every agent turn across every
pane of a repo, storming the operator), re-grounded 2026-08-17 onto the
rebuilt bus (`primitives/tower/tower.mjs`, CLI `tower`). This file is the
enforced companion to [`comms-arch.md`](comms-arch.md): that file names the
*planes*; this names the *hierarchy and the escalation budget* that keep the
operator plane rare.

Lineage of the idea: this is the constellation **nQ protocol** ported first
to the old Tower bus, now to this one. `constellation-zg/src/core/orbit.zig:9`
— *"nQ = the number of unresolved questions a star holds. A star must reach
nQ=0 before emitting its deliverable."* `constellation/docs/excavation/
60-m1-archive.md:183` — *"nQ=0 with a hard ceiling and mandatory escalation …
maximum three orbits; then a human is required."* Escalation always travels
**one link up** a routing table; the human is reached **only** through the
top tier (Concierge). We keep the semantics; the new bus provides only a log
and a cursor — no derivation engine, no escalation ledger, no dead-letter
table (see §4 UNKNOWN).

---

## 1. The topology — four bands, one responsible party per link

```
Facilitation   →  Concierge      (rank 0)  the ONLY human-facing tier
Coordination   →  Coordinator    (rank 1)  reads fleet mail, exercises judgment
Orchestration  →  Orchestrator   (rank 2)  owns its workers, runs the work
Delegation     →  Agent/Subagent (rank 3/4) ephemeral executors
```

Delegation flows **down**; escalation/reporting flows **up**, one link at a
time. The operator (the human, rank −1) sits above Facilitation and is
reached only from it, only after the budget below is spent.

**The responsible party is never null, in principle.** Every spawned agent,
at spawn, has a **parent** (the pane that spawned it) and a role/rank. An
agent with no parent is a top-of-tree surface (Coordinator / Concierge) and
its escalation target is the operator directly.

**UNKNOWN — how "the responsible party" is recorded on the new bus.**
`grep -in 'lineage|parent|responsible' primitives/tower/tower.mjs` returns
**zero hits**: `tower.mjs` has no lineage table, no parent column, and no
concept of a responsible party — it is a message log, not a hierarchy
store. What exists today, verified by reading the code (not this file's
partition, cited not owned):
- `muster-spawn`'s `stamp_lineage()` (`~/muster/bin/muster-spawn`)
  still appends a lineage row to the old flat-file agent ledger this
  cutover deletes (the path is built from `~/.tower` and a filename this
  file's dead-vocabulary rule bars from restating — see the file itself for
  the literal path). **This is a real, unfixed gap**, reported to
  `orch-tower-law` (see this unit's Tower findings), not fixed here: it is
  outside this file's partition.
- The same function also stamps `parent=<pane-id>` as **herdr pane
  metadata** (a separate write), independent of any
  ledger file. Muster reads that token back to resolve a worker's spawner pane.
- That mechanism yields a **pane id**, not a durable Tower agent name — and
  `tower send --to` addresses durable names (`tower.mjs`'s own design note:
  "Identity is never a pane id"). How an agent turns "my parent's pane id"
  into "my parent's durable Tower name" to actually send it a question was
  **not verified this session** and is not demonstrated below. Report this
  as an open gap before relying on it in a brief.

---

## 2. nQ — the escalation budget

A question is born with a budget **`nq` (default 3)** and a target — the
asker's responsible party (its parent), *not* the operator.

- While `nq > 0`, the question is the responsible party's to answer. It is
  surfaced **only** to that one party (never fanned across the repo's
  panes).
- The responsible party does one of three things:
  1. **Answer** it: `tower send --from <parent> --to <asker> --kind answer
     --reply-to <question-id> <answer-text>` (demonstrated this session,
     see report — a coordinator can and should answer a subordinate's
     question).
  2. **Escalate** it: a *new* message, one link up, `--reply-to` the
     original question id — never a mutation of the original row. Track
     the remaining budget in the escalation's own body (e.g. `nq=2`); there
     is no ledger field for it (see §4).
  3. **Abandon** the unit of work — answer with an explicit ABANDON ruling
     (`--kind answer --reply-to <id>`, body states abandonment).
- The operator (human) is reached **only** when the question has climbed to
  a top-of-tree surface and the budget is spent — i.e. `tower send --to
  operator --kind question`. **No question reaches the human until the
  3-turn budget is exhausted.**

**Mechanics, re-grounded:**
- A question: `tower send --from <asker> --to <parent> --kind question
  --dedup <key> "<message>"`.
- An answer: `tower send --from <parent> --to <asker> --kind answer
  --reply-to <question-id> "<answer>"`. Demonstrated this session:
  `tower send --from claude-concierge --to agnt-comms-arch --kind answer
  --reply-to 37 "demo answer to q37"` → `{"id":38,"duplicate":false}`;
  `tower inbox agnt-comms-arch --json` then shows that row with
  `"reply_to":37`.
- Escalation: a new `tower send --to <grandparent> --kind question
  --reply-to <original-question-id>` — the chain of `reply_to` links is the
  append-only escalation trail; nothing is ever mutated in place.
- The load-bearing correctness property `send()` already gives for free: a
  question with an empty `body` cannot be created at all (`send()` throws
  before persistence) — so "malformed question" as a category is
  structurally impossible on this bus, not merely filtered on read.

---

## 3. The ruling rubric — stamped on every question

Every question carries the decision rubric so the responsible party rules
by it rather than reflexively escalating. Escalate only when the rubric
genuinely cannot decide **and** the budget is spent:

> - Does it lead to **craft, beauty, and care**?
> - What choice leads to **world-class DX**?
> - What decision provides a **memorable and lovable UX**?
> - What gets us closer to an **efficient, optimized agentic experience**?

Rule with the rubric. The human is the last resort, not the first reflex.

---

## 4. What the old bus computed automatically, that this bus does not

The old bus's automatic question-routing derivation, its dedicated
escalation-row kind, and its dead-letter sink for malformed rows lived in a
pi extension reading the old message ledger — machinery outside
`tower.mjs` that this cutover does not carry forward as a verified fact. On
the new bus:

- **There is no automatic routing-derivation computation.** Nothing derives
  "who currently owns this question" or "how much budget is left" from the
  log. An agent tracks its own remaining `nq` and addresses its own
  escalations; if two escalations happen concurrently there is no
  ledger-side reconciliation. **UNKNOWN** whether this needs a computed
  view or stays a per-agent discipline — flag, do not invent a verb.
- **There is no dedicated escalation-row kind and no dead-letter table.**
  Escalations are ordinary `question` rows chained by `reply_to` (see §2);
  malformed rows cannot exist at all (§2), so there is nothing to
  dead-letter.
- **The human-answer path (the bug that caused the 2026-08-11 outage) is
  UNKNOWN on the new bus.** The old fix was: a human's typed reply at the
  operator surface automatically becomes an answer row closing the oldest
  open operator-scoped question, so it stops re-injecting. Whether any
  harness adapter does this automatically against `tower.mjs` today, or
  whether the human/Concierge must issue `tower send --to <asker> --kind
  answer --reply-to <id>` by hand, **was not verified this session** — it
  lives in harness-adapter code (pi extension / CC hook), not in
  `tower.mjs`, and is outside this file's partition. Do not assume the
  automatic close still exists until an owning unit confirms it.

---

## 5. Invariants

1. Every spawned agent has, in principle, a responsible party for its whole
   life. **How that is recorded and resolved to a durable Tower name on
   this bus is UNKNOWN — see §1.** **Enforcer: DOCTRINE** (no mechanism
   verified).
2. A question is directed at exactly one responsible party
   (`tower send --to <name>`) and surfaces to exactly one consumer's inbox
   (`tower inbox <name>` filters to rows addressed to it or broadcast —
   verified by reading `tower.mjs`'s `inbox()` query, which selects rows
   where the recipient matches the consumer or is null). **Enforcer: DOOR**
   for "one consumer's inbox holds exactly the rows addressed to it or
   broadcast" (that query is the only inbox implementation); **DOCTRINE**
   for "never fan a question across multiple panes" (nothing stops a sender
   from `--to`-ing more than one name in separate sends).
3. The operator is reached only after `nq` is spent (≤ 3 turns up the
   chain), or when the asker was already a top-of-tree surface. **Enforcer:
   DOCTRINE** — nothing on the bus counts turns or refuses a premature
   `--to operator` send; this is judgment, not a gate.
4. A human reply at the operator surface should close the question it
   answers. **UNKNOWN whether this is automatic on the new bus — see §4.**
5. Routing changes are additive: escalation is a new message with
   `--reply-to`, never an edit of the original row. **Enforcer: DOOR** —
   there is no update statement anywhere in `tower.mjs`; `msg` rows are
   never mutated, only inserted (verified by reading the schema and every
   write path).
6. Status is never mail ([`comms-arch.md`](comms-arch.md) §Five planes) —
   nQ governs the *question* plane only; it never turns a status flip into
   an operator summons.

---

## 6. Field expression of nQ

The stigmergic field ([`comms-arch.md`](comms-arch.md) §Plane 5) must
express the same nQ semantics in the trace so escalation is **observable in
the environment**, not only in the mail plane. The two planes agree by
convention (not by construction — see §4, there is no automated
reconciliation on this bus).

**Vocabulary (preserved verbatim from constellation):**
`constellation-zg/src/core/orbit.zig:9` — *"nQ = the number of unresolved
questions a star holds. A star must reach nQ=0 before emitting its
deliverable."* Escalation always travels **one link up**; the human is
reached **only** through the top tier (Concierge).

### `need-help` on the field

When an agent cannot proceed, it emits `need-help` instead of silence or
push-and-wait:

```
tower send --from <who> --topic <project>/field --kind need-help \
  --reply-to <question-id> --dedup <key> "nq=<remaining> route=<parent-hint> <what is blocked>"
```

| Concept | Mechanics on this bus |
|---|---|
| `nq` | Remaining escalation budget. No column for it — state it in the body; nothing derives it automatically (§4). |
| `route` | A derivation hint naming the responsible party one link up. Never a hard `--to` on a field row — the field stays non-addressed (`comms-arch.md` §Plane 5). |
| `ref` | Binds the field row to the mail-plane question: `--reply-to <question-id>`, a real foreign key into `msg.id`, not a convention. |

### THE LOAD-BEARING INVARIANT: nQ=0 before deliverable

An actor must reach **nQ=0** — no unresolved questions it owns — before
emitting `work-done` or any deliverable (`tower send --kind deliverable` or
`--kind work-done`). If open questions remain: refuse `work-done` and
either continue independent work or emit `need-help` naming what is
blocked. This is the rule that makes the whole protocol mean something —
without it, an agent can declare victory over an open question. **Enforcer:
DOCTRINE.** No hook on this bus checks a sender's open-question count
before accepting a `deliverable`/`work-done` send; `send()` accepts any
well-formed row regardless of what the sender still owes. Treat this as a
compilation gap, not a rule to remember harder.

### One surface (no regression)

One question → exactly one surface. No storm. Route derivation must yield
precisely the responsible party; never fan `need-help` across a repo's
panes. The operator is reached only when the budget is spent, and only
through rank 0. **Enforcer: DOCTRINE** — nothing on the bus prevents a
sender from addressing the same question to two different parties in two
sends; this is discipline, not a gate.
