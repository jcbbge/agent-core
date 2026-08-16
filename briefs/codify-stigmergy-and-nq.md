# UNIT — Codify stigmergic coordination + nQ semantics into the infrastructure

**Operator directive, 2026-08-13:** *"This needs to flow upstream into our infrastructure
and be codified. This only applies to coordinator > orchestrator > agents/subagents. You as
the concierge are the exception — you facilitate the movable parts. Another note: the trace
pheromones need to capture the nQ protocol semantics as well."*

Docs-and-doctrine unit. Precision matters more than volume: these files are read as law by
every agent on this machine, so a sloppy sentence becomes a fleet-wide behavior.

---

## Why this exists (the incident, so the doctrine carries its reason)

2026-08-13: twelve agents across four fleets parked simultaneously; the board went silent
for 42 minutes. Cause was **not** the substrate — it was that every brief said "post
findings to board topic X" and "route questions to the concierge," which teaches
push-and-wait. Agents stopped the moment they had reported, waiting for a scheduler that
does not exist by design. Measured: **19 pheromone rows against 6,400 board rows**;
`pheromone_field` scoped to Arc read `open: 0 · claimed: 0 · done: 0`. The fifth plane was
provisioned, specified down to its TTLs, proven by earlier agents running full
available→claimed→done cycles, and unused.

The concierge then misdiagnosed it as a missing wake chain and nearly bolted a
supervisor/heartbeat daemon onto a stigmergic system. **Codify against that too** — the
doctrine must say plainly that a stalled fleet means a wrong brief, not a missing scheduler.

## Doctrine to encode — three parts

### Part 1 — Stigmergic coordination is MANDATORY, and its SCOPE is bounded

Applies to **Coordinator → Orchestrator → Agent/Subagent** (ranks 1–4). Those tiers
coordinate **through the environment**, never by talking directly to each other:

- **Deposit, never deliver.** A pheromone has **no addressee**. An agent changes the
  environment and stops; it does not hand instructions to a named peer.
- **The substrate resolves audience at READ time.** `route` is a *derivation hint*
  (`to_pane` > `to_role` > lineage > topic-scope), explicitly *not* an address —
  "the field's audience is whoever the route derives to at read time." State the trap
  plainly: `--to-pane`/`--to-role` **look** like addressing, and using them as addresses
  reintroduces direct agent-to-agent messaging with extra steps.
- **The pull loop.** Emit `work-available` (with mandatory evidence); **read the field
  before ever going idle**; claim with `work-claimed` `ref`-ing the exact id; `work-done`
  `ref`-ing the claim; `need-help` instead of silence. **Heartbeat claims** — an
  unheartbeated `work-claimed` evaporates so the work returns to the field, which is how a
  dead agent is handled **with no supervisor**. Failure recovery is emergent from decay.
- **Two acceptable stopping states, and only two:** every done-condition met, or a posted
  blocked/`need-help` naming what is needed and who owns it, *after* proceeding with
  everything not dependent on it. "Reported and awaited instruction" is not a stopping state.
- **Decay is a coordination primitive, not cleanup.** TTLs per D5: `work-available` 15–60
  min, `work-claimed` 30s + heartbeat, `work-done` 24h, `need-help` nQ-bounded; read-time
  evaporation over an append-only log that never shrinks.
- **Idempotence by id** is what makes a non-addressed medium safe for concurrent readers:
  dedupe by id, ack by id, act at most once. Two agents may read the same
  `work-available`; only one claim binds.
- **Two complementary mechanisms — brief BOTH.** `spine-claim` (herdr tokens) covers
  *resource ownership*: advisory not a lock, last-writer-wins, races self-resolve at the
  next heartbeat; wins on liveness, vanishes when expired, no audit. The Tower field covers
  *work distribution*: durable, auditable, append-only, read-time evaporation. Tokens have
  liveness without durability; the board has durability without liveness. Cite
  `herdr-spine/docs/pheromones.md` §Contest semantics and `research/K4-pheromones.md`.

### Part 2 — The CONCIERGE is the explicit exception

The concierge is rank 0, the only human-facing tier, and it **facilitates the movable
parts**. It may address panes directly — operator directives into a pane, re-briefing,
reviving, re-partitioning scope, relaying an operator ruling. That is plane 4 (OPERATOR
DIRECTIVES), not a stigmergy violation, and it must be stated so no future concierge
flagellates itself for doing its job (this one did) and no coordinator mistakes concierge
behavior for a licence to message peers directly.

**The one obligation the exception carries:** a directive delivered into a pane must also be
**recorded on the board**, so the substrate carries it and a successor can reconstruct why
an agent changed course. Facilitation is exempt from stigmergy, not from leaving a trace.

### Part 3 — The trace pheromones must carry nQ semantics

nQ today lives only in the ledger (questions + append-only `kind:"escalation"` rows, with
`effectiveTo`/`effectiveNq` derived). The field says `need-help` is "nQ-bounded" but carries
none of the semantics. Close that gap so escalation is **observable in the trace**, not only
in the inbox plane.

Authority: `~/.tower/RESPONSIBLE-PARTY-AND-NQ.md` (read it in full first). Its lineage is
**Constellation's nQ protocol** — `constellation-zg/src/core/orbit.zig:9`: *"nQ = the number
of unresolved questions a star holds. A star must reach nQ=0 before emitting its
deliverable."* Keep that vocabulary; it is the operator's own.

What to specify:

1. **`need-help` carries `nq` and a derived responsible party.** `nq` = remaining budget
   (default 3, minus escalation count). The target is expressed as a **route derivation
   hint resolving one link up the lineage** — never a hard address, so the field's
   no-addressee law survives intact.
2. **`ref` binds field to ledger.** A `need-help` pheromone references the ledger question
   id, so the two planes are one truth rather than two copies that drift.
3. **Escalation becomes a trace event.** Emitting escalation decrements `nq` and re-derives
   the route one link up — appended, never mutated in place, consistent with
   `effectiveTo`/`effectiveNq` being derived from the latest row.
4. **THE LOAD-BEARING INVARIANT: nQ=0 before deliverable.** An actor must not emit
   `work-done` while it holds unresolved questions. Specify how the field expresses and
   checks that, because it is the rule that makes the whole protocol mean something —
   without it, an agent can declare victory over an open question.
5. **One question → exactly one surface. No storm.** Route derivation must yield precisely
   the responsible party; never fan `need-help` across a repo's panes. This file exists
   *because* a blocking question once re-injected on every agent turn across every pane and
   stormed the operator — do not regress it.
6. **The operator is reached only when the budget is spent**, and only through rank 0.

## Files to change

- `COMMS-ARCH.md` — plane 5: the scope bound, the concierge exception, and the nQ fields on
  `need-help`.
- `RESPONSIBLE-PARTY-AND-NQ.md` — the field expression of nQ alongside the ledger one.
- `~/agent-core/primitives/rules/control-flow.md` — tier duties: stigmergic coordination for
  ranks 1–4; concierge facilitates and is exempt but must leave a trace.
- `~/agent-core/primitives/profiles/{coordinator,orchestrator,coder,researcher}.md` — the
  pull loop as standing behavior, with the two stopping states.
- `~/agent-core/primitives/profiles/concierge.md` — the exception, stated once, with its
  leave-a-trace obligation.
- `~/agent-core/primitives/skills/brief/SKILL.md` — the concierge already added a MANDATORY
  pull-loop section today; extend it with the scope bound and the nQ fields, and keep it
  consistent with whatever you write above.
- `~/cursor-shim/rules/cursor-fleet.md` — carries its own comms section; keep it in step or
  cursor fleets inherit the old push-and-wait framing.

**CANONICAL vs DEPLOYED — do not get this wrong.** `COMMS-ARCH.md` and
`RESPONSIBLE-PARTY-AND-NQ.md` now exist both at `~/.tower/` (the copy that EXECUTES and
that agents read) and at `~/agent-core/primitives/mcps/tower/` (the git-tracked canonical
home, landed today at `5e281be`). Edit canonical, then ensure the deployed copy actually
carries it — a doctrine change present in the repo but not in the file agents read is not a
change. Coordinate with the canonical-source lane rather than fighting it.

## Partition — stay out of these

- **`CORD bus-data` owns** board-row repair, the `board.jsonl` writer, and the board row-shape
  schema ruling. **You own field/pheromone SEMANTICS and the doctrine files.** If your nQ
  fields imply a row-shape change to `pheromones.jsonl`, post it to `tower/bus-data` and let
  them rule on shape; you specify meaning.
- Do not touch the Arc or constellation fleets' files.

## Contract

- Branch first; small PRs; explicit staging. Doctrine changes land as prose, not as code.
- **Quote the law, do not paraphrase it.** Where you restate an existing rule, keep its
  exact wording so the files agree by construction rather than by luck.
- Every unit of work is a **visible pane**; relabel spawned panes with real work names.
- Practice what you are codifying: run your own lane through the field —
  emit `work-available`, claim, heartbeat, `work-done` — and report whether the loop was
  usable in practice. A doctrine written by someone who did not use the mechanism is a
  guess. If the loop is awkward, say so and propose the fix; that finding is worth as much
  as the doc.
- Post to `tower/codify-stigmergy`.

SOURCES: `~/.tower/COMMS-ARCH.md` (planes 1 and 5, D5 TTLs, route-derivation precedence),
`~/.tower/RESPONSIBLE-PARTY-AND-NQ.md` §§1–2 and the orbit.zig citations,
`~/herdr-spine/docs/pheromones.md` §Contest semantics, `~/.tower/pheromones.jsonl` (19 rows),
`board.jsonl` (6,437 lines), `pheromone_field` output, `brief/SKILL.md` as patched today —
all read or run 2026-08-13 by the concierge.
