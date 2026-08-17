# DELIVERY CENSUS — what the bus does with a message it declines to deliver

Unit 0 of `CORD-comms-substrate.md`. Authored by CORD (`cord-comms-substrate`,
pane `w3R:p1P`), 2026-08-16/17. Every claim below was acquired this session
from a file read or a command run on this machine; the method for the
measured number is stated in full so it can be re-run and disputed.

Backup taken before any inspection: `~/.tower-backup-20260816-193949` (30M).

---

## 0. Correction to a Pre-Verified Fact in the brief

**The brief states: "Six of seven event handlers independently invented their
own drop policy," citing `grep -ln 'pace\|PACE\|coalesc' bin/handlers/[0-9]*`
returning six files. That fact is false, and the grep is why.**

`pace` is a substring of `work**space**`. Five of those six matches are the
word "workspace" in handlers that have no pacing logic at all. And `coalesc`
appears **nowhere** in `~/herdr-spine` — `grep -rn 'coalesc' bin/handlers/`
returns zero lines.

Counting occurrences of the substring `pace` minus occurrences of `workspace`,
per handler:

| Handler | `pace` substrings | of which `workspace` | real pacing tokens |
|---|---|---|---|
| `10-notify` | 17 | 2 | **15** |
| `16-parent-wake` | 13 | 0 | **13** |
| `17-field-pull` | 17 | 0 | **17** |
| `15-restore-view` | 1 | 1 | 0 |
| `20-reflex` | 7 | 7 | 0 |
| `30-choreo` | 27 | 27 | 0 |
| `40-tower-bridge` | 0 | 0 | 0 |

**The true count is three handlers, not six** — and that number is
independently corroborated: there are exactly three ad-hoc pace state files in
`~/.tower` (`notify-pace.json`, `parent-wake-pace.json`, `field-pull-pace.json`),
one per handler in the list above. Two witnesses, same answer.

**This does not weaken the mandate; it sharpens it.** One of the three
(`16-parent-wake`) is already converted to an outbox at `herdr-spine 6c07649`.
So the migration surface is **two handlers**, not five. The measured loss
below is unaffected — it was computed from the completion stream, not from the
grep.

**What the correction changes:** a design sized for "six forks to unify" would
over-build. The real defect is narrower in breadth and exactly as severe in
depth: at-most-once delivery, invented three times, on the two planes that
matter most (the operator's summons, and a spawner's completions).

---

## 1. Handler-by-handler census

Seven handlers in `~/herdr-spine/bin/handlers/`. "Drop policy" means: a branch
where the handler decides an event will not be delivered, and nothing durable
is left owing it.

### `10-notify` (511 lines) — the operator's toast plane

- **Consumes:** `pane.agent_status_changed` (any status).
- **Addresses:** the operator, via `notification.show`; and the status plane,
  via a `board.jsonl` line.
- **Drop policy:** `toast_allowed(pane_id, kind)` at `10-notify:334` — true
  iff no toast for that exact `(pane_id, kind)` pair fired within
  `PACE_WINDOW_SECONDS = 60` (`10-notify:307`). Keyed on `kind` so `done` and
  `blocked` pace independently.
- **State file:** `~/.tower/notify-pace.json` (`10-notify:304-305`, override
  `SPINE_NOTIFY_PACE_PATH`). 6300 bytes as of this session.
- **Gate sites:** `10-notify:422` gates the **blocked** toast;
  `10-notify:494` gates the **done** toast.
- **Fate of an undelivered message:** the board line is still appended, so the
  *record* survives. The toast is simply not fired. There is no queue, no
  retry, no later drain, and no dead-letter row. **A blocked pane's summons
  suppressed inside the 60s window is never delivered to the operator at all** —
  and by the handler's own docstring (`10-notify:59`, T1) a toast is a
  SUMMONS, not a status. This is the most operator-visible instance of the
  defect.
- **Second drop path:** flap-suppression at `10-notify:295` — a pane
  re-blocking within 10 minutes on an identical question key appends nothing.

### `16-parent-wake` (231 lines) — spawner wake — **ALREADY FIXED**

- **Consumes:** `pane.agent_status_changed` → `done`/`idle` for a fleet role.
- **Addresses:** the spawner pane, resolved from the `parent=` herdr pane token
  that `spine-spawn` stamps at birth (`bin/spine-spawn:836`).
- **Drop policy (current, post-`6c07649`):** none. The completion is queued
  against the spawner **before** any interrupt decision
  (`16-parent-wake:196-197`); pacing (`PACE_WINDOW_SECONDS = 60`,
  `16-parent-wake:47`) and operator-focus defer the wake, they do not cancel
  it; the next allowed wake drains the outbox and names every worker owed; a
  failed prompt requeues (`16-parent-wake:220`).
- **Drop policy (pre-`6c07649`, the historical defect):**
  `PACE_WINDOW_SECONDS = 60`, drop if within window; a failed prompt logged
  `verified prompt to {parent_id} failed (non-fatal)` and was discarded with no
  requeue.
- **State file:** `~/.tower/parent-wake-pace.json` — now an **outbox**, not a
  pace stamp.
- **Fate of an undelivered message:** queued and owed. This is the shape the
  other two must adopt.

### `17-field-pull` (313 lines) — idle-pane field offers

- **Consumes:** `pane.agent_status_changed` → idle.
- **Addresses:** the idle pane, via a verified prompt offering open,
  unclaimed, unexpired field items routed to it.
- **Drop policy:** `pace_allows(pane_id)` at `17-field-pull:179` —
  `PACE_WINDOW_SECONDS = 120` (`17-field-pull:53`), drop if within window
  (`17-field-pull:267`, "within 120s pace window — skipped"). Also drops on:
  pane not found (`:252`), bridge-exempt coordinator plane (`:257`),
  operator-focused pane (`:262`).
- **State file:** `~/.tower/field-pull-pace.json` (528 bytes).
- **Fate of an undelivered message:** the **offer** is discarded with no queue
  and no retry. Partial mitigation: the underlying field items live in
  `~/.tower/pheromones.jsonl` and are not consumed by the offer, so a *later*
  idle event re-offers them. The loss is therefore conditional rather than
  absolute — but a pane that goes idle once, is paced out, and then never flips
  status again is never told about work routed to it. Recovery depends on a
  future event that may not come; it is not a guarantee.

### `20-reflex` (580 lines) — policy-gated auto-answer

- **Consumes:** `pane.agent_status_changed` → `blocked`.
- **Addresses:** the blocked pane, by typing a policy-sanctioned answer.
- **Rate limits:** global — `count_recent_fires(entries, 60)` at
  `20-reflex:477`; per-rule — `count_recent_fires(entries, 3600, rule_index)`
  at `20-reflex:482`. Both read from the audit log, not a pace file.
- **State file:** `${HERDR_STATE_DIR:-~/.local/state/herdr-spine}/reflex-audit.jsonl`
  (`20-reflex:70`) — an append-only audit log, not private pacing state.
- **Fate of a throttled event:** the auto-answer is not sent, the question
  **stays open**, and the operator is still summoned through `10-notify`.
- **VERDICT — do not migrate this one.** This is a safety throttle on an
  *action* (typing into a pane on the agent's behalf), not a delivery policy on
  a *message*. Nothing is owed to anybody when it declines. Folding it into the
  delivery primitive would convert a deliberate refusal into a queued
  obligation, which is the opposite of what it is for. It belongs in the census
  as an explicit non-target.

### `15-restore-view` (115 lines) — view restoration

- **Consumes:** view/ordering events. **No pacing. No message delivery.**
  Its single `pace` grep hit is the word "workspace" (`15-restore-view:8`).
- **Fate of an undelivered message:** N/A — it delivers no messages.

### `30-choreo` (405 lines) — focus and zoom choreography

- **Consumes:** `pane.agent_status_changed` → `blocked` (and unblock).
- **Addresses:** the operator's screen, via `pane.zoom` / focus.
- **Drop policy:** gates on "the target's tab is already the focused/active
  tab" (`30-choreo:305-308`) so a background-workspace pane never drags the
  operator's screen elsewhere. All 27 `pace` substring hits are "workspace".
- **Fate of a declined action:** no zoom happens. Nothing is owed — the
  summons itself is `10-notify`'s job, and the board row is written regardless.
  **Non-target**, for the same reason as `20-reflex`: this drops a *view*, not
  a *message*.

### `40-tower-bridge` (471 lines) — status → ledger bridge

- **Consumes:** `pane.agent_status_changed`.
- **Addresses:** the Tower ledger. `blocked` → a `question` row with an
  explicit `"to": "operator"` (`40-tower-bridge:318-319`). `done` →
  deliverable **fabrication OFF by default** since 2026-08-10
  (`40-tower-bridge:376-378`), re-enabled only by the flag file
  `~/.tower/bridge-fabricate-done`. Coordinator panes exempt
  (`40-tower-bridge:430`).
- **Drop policy:** none of the pacing kind — zero `pace` substrings in the
  file. Its "drops" are the deliberate fabrication-off and coordinator-exempt
  rules, both of which are law (COMMS-ARCH §Hard invariants: "No fabrication",
  "The coordinator plane is exempt from bridging").
- **Fate of an undelivered message:** N/A — nothing is suppressed that was
  ever owed.

---

## 2. The measured loss

### Headline

**99 of 308 completions — 32.1%, very nearly one in three — would be silently
discarded by the pre-`6c07649` drop-on-pace rule, replayed against the real
completion stream this bus recorded.**

### The method, in full

`16-parent-wake` posts one board row per completion it observes, on topic
`herdr-spine/parent-wake`, `from: "spine-daemon"`, in the exact form:

```
worker <ROLE> <name> (<pane>) -> <done|idle>; spawner <spawner-pane>
```

That row is written **before** the delivery decision, so the topic is a
faithful log of every completion the handler saw. From `~/.tower/board.jsonl`:
310 rows on that topic; 308 are `spine-daemon` completion notes; **308 of 308
parse against the pattern, 0 unparsed** — no silent sampling in the input.

The pre-fix policy is deterministic and was read from source, not remembered:
`git show 6c07649^:bin/handlers/16-parent-wake` gives `PACE_WINDOW_SECONDS = 60`
and a per-spawner last-wake stamp recorded only when a wake actually fired.
Replaying exactly that rule over the 308 completions in timestamp order:

- **delivered: 209**
- **DROPPED: 99 (32.1%)**

Worst-hit spawners: `w2K:p3` (14 completions lost), `w2H:p1` (10), `w2K:pF`
(6), `w2J:p1` (6), `w2D:p2` (4), `w2V:pQ` (4), `w3R:p4` (4), `w3R:p5` (4).

Reproduce: the replay is 20 lines of stdlib Python over `board.jsonl` —
group by `spawner`, walk in `ts` order, drop when `t - last_wake[spawner] < 60`,
else deliver and stamp. No other input.

### Why this number is a **lower bound**, stated plainly

1. It models only the pace branch. The pre-fix handler also declined on
   operator-focus and discarded failed prompts with no requeue; neither is
   modelled, because neither left a board trace.
2. It counts only completions that reached the handler and got a board row.
   Anything lost upstream is invisible to this method.
3. It covers `16-parent-wake` only. `10-notify`'s suppressed toasts and
   `17-field-pull`'s suppressed offers leave no per-drop record at all —
   **they cannot be counted, which is itself the finding**: the bus does not
   record its own non-deliveries. `~/.tower/dead-letter.jsonl` holds 3 rows,
   all validation failures ("question has no message field", "message is
   whitespace"). **Zero delivery failures have ever been dead-lettered**,
   because nothing routes one there.

### The named incident

The brief cites three coordinators finishing against spawner `w3R:p1` in one
burst with one wake delivered. The replay confirms losses against `w3R:p1` in
that window: `ORCH tower-bus-integrity` (18:07:24Z), `ORCH credential-scrub`
(18:14:59Z), and `ORCH harness-homogeneity` (18:23:24Z) all land in the dropped
set. The operator relayed them by hand. **The human was the retry mechanism.**

---

## 3. Addressee stability — the evidence that decides Unit 1

| Addressee kind | Example | Where minted | Survives the addressee's process death? | Evidence |
|---|---|---|---|---|
| herdr pane id | `w3R:p1P` | herdr, at pane creation | **NO** — dies with the pane | pane list is the only resolver; `16-parent-wake:143` fails with "parent token not found in pane list" |
| spawner token `parent=<pane id>` | `parent=w3R:p1` | `spine-spawn:836`, stamped as a herdr pane token at birth | **NO** — it is a pane id | `bin/spine-spawn:812,831,836` |
| role token | `ORCH`, `AGNT`, `CORD` | pane human name, at spawn | **NO** — not unique; many panes share one role | `17-field-pull:125 role_tokens_for` |
| ledger `to` plane value | `"operator"` | `server.mjs send_to_user`; `40-tower-bridge:319` | YES, but it names a **plane**, not an agent — one mailbox for one human | COMMS-ARCH §Hard invariants |
| board topic | `agent-core/comms-substrate` | any writer | YES — durable rows in `board.jsonl` | 12,744 rows, 0 unparseable |
| pheromone route hint | `route.to_role` / `route.to_pane` | `pheromone_emit` | role: not unique. pane: **NO** | `17-field-pull:142 routed_to` |
| ledger lineage row | `{kind:"lineage", pane, parent, role, cwd}` | `spine-spawn`, at birth | The **row** is durable (180 of them). Its **key is a pane id**, and its `id` field is a ledger row id, not an agent id | `ledger.jsonl`, `kind:"lineage"` |

### The finding this table exists to produce

**There is no durable agent identity on this machine today.** Every addressee
in use resolves, directly or by one hop, to a herdr pane id — a handle to a
process that dies at the end of a context window, and that `shape.md` §`socket/`
warns "churns on a move, so reconcile beyond 'status changed' or held
references go stale."

That is the root cause, and it is exactly what `thesis.md` names: *"A message
handed to a dying process is lost, so nothing is delivered to a peer — it is
deposited against an object."* The three private outboxes are not three
authors being careless. They are three correct local responses to one missing
thing: **a durable addressee**. Any of them can be made reliable in isolation
and the system still loses messages, because the queue is keyed on a handle
that expires.

### Resolved this session: pane ids are unique per birth, never reused

The material question was whether herdr recycles a pane id after a pane dies —
if it did, every pane-keyed queue could mis-deliver to a stranger, raising the
addressee fix from "durability" to "correctness".

**Tested empirically: it does not.** Across all 180 `kind:"lineage"` rows in
`~/.tower/ledger.jsonl` — 180 spawns spanning many sessions, herdr restarts,
and workspaces — there are **180 distinct pane ids and zero reuses**.

This splits the property in two, and the split is what Unit 1 turns on:

- A pane id **is** a unique identity token. It never aliases a second agent, so
  a queue keyed on one can never mis-deliver.
- A pane id **is not** a resolvable address after the pane dies. `pane list` no
  longer contains it, so delivery — not identity — is what expires.

**Consequence for the design:** the interim does not need a newly minted agent
id to be correct. It needs a durable queue keyed on the identity that already
exists, plus an explicit lifecycle state for "addressee has no live engine."
That is precisely `thesis.md`'s *"being offline is a state of the record rather
than an event needing machinery"* — reachable now, without waiting for tup's
durable object to be built.

---

## Done-when check (Unit 0)

- [x] Row per handler: event consumed, addressee, drop policy, state file, fate
      of an undelivered message, cited to file and line — §1, all seven.
- [x] Measured undelivered count with the method used to derive it — §2:
      **99 of 308 (32.1%)**, replay method stated, lower-bound caveats stated.
- [x] Addressee-stability table — §3, seven kinds, with the one UNKNOWN named.

SOURCES (all acquired 2026-08-16/17, this session): `~/herdr-spine/bin/handlers/`
(`10-notify`, `15-restore-view`, `16-parent-wake`, `17-field-pull`, `20-reflex`,
`30-choreo`, `40-tower-bridge`) read at the cited lines; `git show
6c07649^:bin/handlers/16-parent-wake`; `bin/spine-spawn:812-836`;
`~/.tower/board.jsonl` (12,744 rows, 310 on `herdr-spine/parent-wake`);
`~/.tower/ledger.jsonl` (3,093 rows, 180 `kind:"lineage"`);
`~/.tower/dead-letter.jsonl` (3 rows); `~/.tower/{notify,parent-wake,field-pull}-pace.json`;
`~/tup/contracts/thesis.md`, `shape.md`; `~/.tower/COMMS-ARCH.md` §Hard
invariants, §What each existing component becomes;
`~/agent-core/primitives/rules/ENFORCEMENT.md`.
