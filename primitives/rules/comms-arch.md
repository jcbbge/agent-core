# COMMS-ARCH — the fleet↔operator communications substrate

Status: DESIGN OF RECORD (2026-08-10, operator mandate), re-grounded 2026-08-17
onto the **durable log** (`muster-deposit` / `pending` / `collect` / `status`) and
**herdr** pane observation. The retired bus (MCP stdio server, per-line-JSON
logs, six private outboxes, SQLite `tower` CLI) is dead — do not call it.

Consumers who defer to this file for comms law rather than restating it:
`control-flow.md` §Communications. Dead provenance only:
`rules/tower-orchestration.md` (filename on disk; not live law).

The substrate is operational when `muster status` returns and
`muster verify` exits 0. There is no separate "substrate proof" gate — the
field CLI and the hash-chained events ARE the substrate.

## The one rule

**Every message has exactly one audience, and reaches it exactly once, in
full.** Everything below is a corollary.

On the durable log this is structural: a deposit names exactly one recipient
via `--to <name>` — there is no ambiguous shape, and no component derives an
audience the sender did not name.

**Companion:** the hierarchy and escalation budget that keep the operator
plane rare live in
[`responsible-party-and-nq.md`](responsible-party-and-nq.md) — every spawned
agent has a durable responsible party (its parent), a question climbs ONE
link up per turn with an `nq` budget (default 3), and reaches the human only
after the budget is spent.

## Five planes, strictly separated

1. **STATUS (observability)** — herdr pane states + sidebar tokens. Who is
   alive, working, blocked, done. Pull-based: anyone who cares reads it
   (`herdr api snapshot`, `muster status`). NEVER converted into mail. Never
   triggers a relay obligation.
2. **FLEET MAIL (agent→agent)** — briefs, CLAIMs, DONE reports, rulings.
   Addressed hierarchically: worker→its orchestrator, orchestrator→the
   coordinator. Carried as `muster-deposit --from <who> --to <parent> --kind
   report|done --body "<...>"`. The operator NEVER receives fleet mail
   verbatim — the coordinator reads it, exercises judgment, and reports what
   matters.
3. **OPERATOR MAIL (→ operator)** — a deposit qualifies only if explicitly
   addressed: `muster-deposit --to operator --kind question|report --body
   "<...>"`. Legitimate senders: the coordinator does NOT need this plane
   (its output IS the operator conversation); agents use it only for
   genuinely operator-urgent items the coordinator cannot answer (external
   credentials, destructive-action approval) or when no coordinator exists
   (headless fleets).
4. **OPERATOR DIRECTIVES (operator → fleet)** — flow through the concierge
   (the conversation) or directly into a pane (herdr prompt after the pane's
   `agent_status` flips to `working`). When direct, the receiving agent
   records it on the field (`muster-deposit --from <who> --to <parent> --kind
   report --body "<directive summary>"`) so the coordinator's picture stays
   whole.
5. **STIGMERGIC FIELD (environmental)** — ranks 1–4 coordinate **through
   the environment**, never by messaging peers directly. Work leaves visible
   traces via hierarchical deposits and herdr snapshot; collection =
   `muster-deposit pending` + herdr snapshot. NO peer addressee; NEVER operator mail.

### Plane 5 — stigmergic coordination (mandatory scope)

**Applies to ranks 1–4** — Coordinator → Orchestrator → Agent/Subagent.
Those tiers coordinate **through the environment**, never by talking
directly to each other. Rank 0 (Concierge) is the explicit exception (see
below).

**What survives, on real verbs:**
- **Deposit, never deliver.** Emit with `muster-deposit --from <who> --to
  <parent> --kind report|done|need-help --body "<evidence>"` — always up
  the hierarchy, never to a peer. An agent changes the environment and
  stops; it does not hand instructions to a named peer.
- **The pull loop (mandatory).** Post work with evidence (`muster-deposit
  --kind report`); **read the field before ever going idle**
  (`muster-deposit pending --to <me>`); collect handled rows with `muster-deposit collect
  <dep-id>`; post `need-help` instead of silence.
- **Two acceptable stopping states, and only two:** every done-condition
  met (post `muster-deposit --kind done`), or a posted `need-help` naming
  what is needed and who owns it, *after* proceeding with everything not
  dependent on it. "Reported and awaited instruction" is not a stopping
  state.
- **Idempotence by deposit id:** each `muster-deposit` prints `dep-<12hex>`;
  act on an id at most once; retries reference the same id in follow-up
  bodies when idempotence matters.
- **Two complementary mechanisms — brief BOTH:** herdr pane metadata tokens
  (`herdr pane report-metadata`; sidebar `$claim` / `$task`) cover *resource
  ownership* — advisory, not a lock, last-writer-wins, vanishes when expired,
  no audit. The durable log covers *work distribution* — durable, auditable,
  append-only. Tokens have liveness without durability; the field has durability
  without liveness.

**DIES — deleted, not translated:**
- There is no TTL on any deposit, no read-time evaporation, and no heartbeat
  primitive on the durable log. The sentence "an unheartbeated claim
  evaporates so the work returns to the field" is **false** and must not be
  restated.
- **Failure recovery for a claim whose owner died is UNKNOWN.** No muster
  primitive provides it. An uncollected deposit sits in `pending` forever,
  visible on read, with no mechanism to expire or reclaim it. Do not invent
  a verb for this and do not quietly keep the decay prose. Report this gap;
  do not silently work around it in a brief.

#### Concierge exception (rank 0)

Rank 0 facilitates the movable parts. The Concierge may address panes
directly — operator directives into a pane, re-briefing, reviving,
re-partitioning scope, relaying an operator ruling. That is plane 4
(OPERATOR DIRECTIVES), not a stigmergy violation, and it must be stated so
no future concierge flagellates itself for doing its job and no coordinator
mistakes concierge behavior for a licence to message peers directly.

**Leave-a-trace obligation:** a directive delivered into a pane must also be
**recorded on the field** (`muster-deposit --from <who> --to <parent> --kind
report --body "<...>"`), so the substrate carries it and a successor can
reconstruct why an agent changed course. Facilitation is exempt from
stigmergy, not from leaving a trace.

#### nQ on the field

Authority: [`responsible-party-and-nq.md`](responsible-party-and-nq.md). The
field must carry nQ semantics observable in the trace: `need-help` rows
carry the remaining budget in their body and `--ref` the question they
correspond to when applicable. **How the field's `need-help` nQ is kept
consistent with the mail-plane question's nQ is UNKNOWN** — no automated
derivation exists; today it is a discipline the emitting agent must keep
by hand.

## Hard invariants

- **Addressing is explicit, with no fallback.** A deposit always names
  `--to <name>`. There is no legacy "well-formed question with no `to`
  defaults to operator" rule — that derivation engine does not exist here.
  If a message needs the operator, the sender says so: `--to operator`.
- **Validation at emit is enforced by the write path itself, not by
  convention.** The field door (`muster-deposit`) refuses kinds outside
  `{done, need-help, report, question}` and empty `--from`/`--to`/`--body`
  before any row is written — a malformed deposit never enters the log.
  **Enforcer: DOOR** (the `muster-deposit` CLI is the only write path).
- **No truncation.** If a message enters the field, it enters whole — `body`
  is the literal argument, stored and returned verbatim. Preview/summary
  strings (herdr `verdict`/`task` tokens) are display strings and must
  never be passed as a message body.
- **Delivery is verified at the substrate, not assumed.** `muster-deposit`
  prints `dep-<12hex>` on success; a caller that does not get an id back
  has not sent anything. Pane prompt delivery is separately best-effort
  (wait for `agent_status` = `working` before treating a prompt as delivered)
  and its failure never implies the deposit was lost.
- **Collect by id.** `muster-deposit collect <dep-id>` retires a deposit from
  `pending`; uncollected deposits remain visible to readers. **Enforcer:
  DOOR** (field append + collect record).
- **Prompt is a latency optimization, never a delivery step.** The deposit
  is durable before a pane prompt lands; a slow pane costs waiting, not
  mail. Do not treat a slow prompt as a failed deposit.

## What "unread" replaces

There is no "marked delivered," no verbatim-relay guarantee, no six private
outboxes, and no courier process. **Unread is computed, not marked:**
`muster-deposit pending --to <consumer>` returns uncollected deposits addressed to that
consumer. Nothing can be silently dropped because collection is explicit —
the old machinery that existed solely to answer "did this get delivered"
(relay-acknowledgment tools, pace files, courier process, per-handler
outboxes) is deleted outright, not reimplemented.

Collection at the coordinator: `muster-deposit pending --to <role>` + `muster-deposit collect
<dep-id>` after handling. Pane state: **herdr skill** snapshot.

## Notifications (operator rubric, 2026-08-10)

A toast is a SUMMONS, and summonses are rare. "Status is not mail" extends
to: **status is not a toast.**

- Notify ONLY for: (1) TASK COMPLETION — an ORCH finishing its unit of work
  (cycle landed / gate verdict / final report posted); (2) a genuine
  operator summons (blocked question addressed to the operator); (3) an
  alert. NEVER for AGNT/SAGT activity or completions — those are status
  plane (herdr snapshot / CTRL pane) only.
- Content must be contextual and readable at a glance: role + HUMAN work
  name + outcome ("ORCH c004-ux — cycle complete, gate green 450/0"), never
  ids, never truncated token fragments.
- Pace: if a notification would fire within 60s of a previous one from the
  same source, coalesce or drop — a flashing stream is the same as silence.
- If the display duration is configurable, it must be long enough to read;
  if not, the content must survive on the durable log so a missed flash costs
  nothing.
- **UNKNOWN:** whether every notification-bridge handler has been repointed
  at the durable log; do not claim this wiring works until confirmed.

## Alarm rationalization (2026-08-14)

Process-control discipline (EEMUA): a plant fails dark operation not from
missing sensors but from alarm floods that train the operator to ignore
alarms. **Every signal names the consumer action it demands, or it is
deleted.**

- **Validate at emit — now DOOR, not DOCTRINE.** The field door refuses an
  empty `body` and invalid kinds before persistence (see Hard invariants
  above). A `question` with no real content cannot exist on the field at
  all.
- **Watch:** alarms answered vs ignored. Working when every doorbell
  produces an action and no alarm class is ignored twice. **Enforcer:
  DOCTRINE** — nothing on the field counts unanswered alerts; this remains
  a human/coordinator discipline.

## Project isolation (operator, 2026-08-10)

- Fleet-mail bodies carry project context in the deposit body and in brief
  paths (`briefs/<project>/…`); the stigmergic field is the same muster
  `deposits.jsonl` scoped by `--from`/`--to` naming discipline.
  **Enforcer: DOCTRINE** — this is a naming convention; nothing in the
  field refuses a wrongly-scoped deposit.
- **Gone:** the retired bus scoped reads by `cwd` on each row and by topic
  prefix. The durable log carries no `cwd` column — project isolation is
  naming discipline plus brief partitioning only.
- Agents post from their real working cwd as a matter of house discipline,
  not because the field enforces or records it.

## Gone — deleted, not translated

- The retired bus MCP stdio server and every tool it exposed.
- The retired `tower` CLI, `primitives/tower/tower.mjs`, and `~/.tower/`
  SQLite state — **DEAD** (filenames may remain on disk as provenance; do
  not call).
- The three per-line-JSON logs (board, ledger, field signals) and their
  reader modules.
- The JSONL consumer-integrity law — the field uses skip-and-count on
  unparseable lines; the write path is a typed door.
- "Mailbox ≠ substrate" and its named write-gate-proof-file gate for the
  deleted MCP.
- The verbatim-relay guarantee, relay-acknowledgment tool, pace files,
  courier process, and six private outboxes.
- The migration table and numbered migration-order list — retirement is
  done.
- The decay/TTL/heartbeat half of stigmergic plane 5 — failure recovery is
  UNKNOWN, not reimplemented.
- The legacy "well-formed question, no `to`, defaults to operator" fallback
  and its dead-letter sink.
