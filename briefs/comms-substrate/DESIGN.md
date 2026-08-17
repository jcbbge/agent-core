# DESIGN — the deposit/courier substrate: one delivery path, no message dropped

Unit 1 of `CORD-comms-substrate.md`. Ruled by CORD (`cord-comms-substrate`),
2026-08-17, on the evidence in `DELIVERY-CENSUS.md`. Binding on Units 2-4.

**The guarantee this design exists to make true:** a message that enters this
system is delivered to its addressee, or lands in `dead-letter.jsonl` with a
reason. There is no third outcome. Pacing, focus, and liveness may change
*when* a message arrives. Nothing may change *whether*.

---

## 1. The move: take delivery away from senders

The census found three handlers that each invented at-most-once delivery. The
tempting reading is that three authors were careless. Read the dispatcher
contract instead (`~/herdr-spine/docs/dispatcher.md:81`): **handlers are
one-shot subprocesses with no timers and no threads.** A one-shot process that
must deliver *right now* has exactly two moves available — send, or don't. The
drop policy was not carelessness. It was the only degree of freedom the
architecture left, which is why three independent authors found it and why a
fourth would find it again.

So the fix is not "give every sender a queue."

> **Handlers become depositors. One courier owns delivery for the whole
> machine.**

- A **depositor** ends its job at `deposit()`. It never types into a pane,
  never fires a toast, never decides whether now is a good time. It cannot drop
  a message because it has no delivery code to skip.
- The **courier** is the only writer of prompts and toasts on this machine. It
  drains inboxes, applies pacing as *deferral*, verifies the submit, acks on
  success, requeues on failure, dead-letters on policy exhaustion.

### Why this is not the convergent answer

The convergent answer — "add retries and a queue to each handler, standardize
the pace file format" — keeps N delivery paths and makes them uniform.
Uniformly wrong is still wrong, and it re-forks the day someone writes handler
eight, because the *capability* to hand-roll a drop is still sitting in every
handler's import list.

This design leaves **one** delivery path and N−1 senders that are structurally
incapable of delivering. Handler eight cannot re-fork the law, because handler
eight has no delivery verb to fork. `shape.md` §`kernel/` states the
constraint this satisfies: *"one canonical body with thin per-engine adapters;
a forked law rots silently, because each fork stays plausible on its own."*
The census proved the rot; this removes the fork site rather than tidying the
forks.

The test to hold this design to: **not "do all handlers now behave the same?"
but "can a new handler misbehave at all?"**

---

## 2. Addressing — the answer, and what it defers

### The evidence

`DELIVERY-CENSUS.md` §3 established two facts that pull in opposite directions:

1. Every addressee in use resolves, directly or by one hop, to a herdr pane id
   — a handle to a process that dies at the end of a context window.
2. **Pane ids are never reused.** 180 lineage rows, 180 distinct pane ids, zero
   collisions.

So the property splits: a pane id **is** a unique identity that can never
alias a second agent; it **is not** a resolvable address once the pane is gone.
*Delivery* expires. *Identity* does not.

### The ruling

**Address a typed URI, keyed on the identity that already exists. Do not mint a
new id, and do not wait for tup's durable object.**

Every deposit carries `to:` in one of these forms, from day one:

| Scheme | Example | Status |
|---|---|---|
| `pane:` | `pane:w3R:p1P` | live — the interim addressee |
| `operator:` | `operator:` | live — the human plane |
| `role:` | `role:ORCH@agent-core` | live — resolved to a pane set at delivery time, not at deposit time |
| `agent:` | `agent:a-mswi9zhh-1cfj` | **reserved, refused today** with `reason: "agent: scheme not yet implemented"` |

The queue lives at `~/.tower/objects/<url-safe-addressee>/inbox.jsonl`. That
directory is `thesis.md`'s object record in miniature: *"A deposit against an
object with no engine seated in it queues inside that object's record, so being
offline is a state of the record rather than an event needing machinery."*
Offline stops being an event the sender must handle and becomes a field on the
record — which is exactly the machinery the three private outboxes were
re-inventing.

### The cost, stated plainly

**What this buys:** correctness today, with no new identity system, no
migration of 180 existing lineage rows, and no dependency on `durable/` — which
`shape.md` marks *"Nothing here is built."* The zero-reuse evidence is what
makes it sound; without that finding this would be unsafe.

**What this defers:** an agent re-seated after context death gets a **new** pane
id, so deposits owed to its previous incarnation are orphaned in the old
inbox. Under tup's durable object the re-seated engine would inherit the same
object and drain the same inbox. Three consequences, all accepted deliberately:

1. Orphaned inboxes are **not silent**. `tower stuck` (§4) reports them as
   `stranded: addressee has no live engine and no successor`.
2. An operator/coordinator verb `tower deliver --reassign <old> <new>` moves a
   stranded inbox to a successor. Manual, audited, and rare.
3. **The migration to tup is a rename, not a rewrite.** Because the addressee
   is a typed URI from day one, adopting the durable object means minting
   `agent:` ids at the spawn door and changing the string senders pass. The
   queue, the courier, the refusal door, the dead-letter, and the observability
   verb are all unchanged. That is the entire reason the URI is typed on day
   one instead of "later, when we need it."

**This is an interim, and it is labelled one.** It is not a claim that pane
identity is the right long-term addressee. It is the claim that the right
long-term addressee is not built, that a correct system is reachable now, and
that this shape does not have to be undone to get there.

---

## 3. The primitive

One implementation, two thin bindings — never two implementations.

- **Canonical:** `~/.tower/lib.mjs` gains the deposit/queue/dead-letter core,
  beside the existing `tower-ledger.mjs` writers. It already owns flocked
  append (`herdr-spine 25c1ef0`, `LOCK_EX`) and JSONL row validation.
- **Python binding:** `_spine_common.py` gains `deposit(...)`, which shells to
  the canonical implementation. Handlers are python3-stdlib-only by contract
  (`docs/dispatcher.md`), so the binding must not reimplement policy — it
  marshals and returns the receipt.

### `deposit(to, kind, body, from_name, ref=None, ttl=None) -> Receipt`

Every call returns a `Receipt` — `{deposit_id, accepted, reason}`. **There is no
return path that means "silently didn't happen."**

**Typed refusal at the door.** A deposit is refused, with a receipt and a
`dead-letter.jsonl` row carrying `reason`, when:

| Refusal | Reason string |
|---|---|
| unknown or malformed `to:` scheme | `bad-addressee: <value>` |
| `agent:` scheme | `agent: scheme not yet implemented` |
| empty / whitespace `body` | `empty-body` (matches the existing `questionRejectReason()` precedent) |
| `kind` not in the allowed set | `unknown-kind: <value>` |
| a status-plane `kind` addressed to `operator:` | `status-is-not-mail` (COMMS-ARCH §Plane separation, enforced mechanically for the first time) |
| a `question` past its nQ budget | `nq-exhausted` |
| missing `from` | `unauthored` (COMMS-ARCH §Board row schema already requires it) |

Refusal is loud and recorded. Today a drop produces nothing at all — the census
found **zero** delivery failures ever dead-lettered, against 3 validation
failures. That asymmetry is the bug in one number.

### Queue row states

`queued` → `delivering` → `delivered` → `acked`, with `attempts`,
`next_attempt_at`, `last_error`.

- **Delivery is verified at the substrate.** The courier observes the submit
  (status flip or transcript echo) before writing `delivered`. This is not new
  policy — COMMS-ARCH §Hard invariants already says *"A send without evidence
  is a non-send."* What is new is that a non-send now has somewhere to go.
- **Failure requeues** with backoff: `attempts += 1`, `next_attempt_at = now +
  min(2^attempts, 300)s`.
- **Exhaustion dead-letters** with a mandatory reason:
  `undeliverable after N attempts: <last_error>`, or `ttl-expired`.

### The invariant that kills the whole bug class

> **Pacing writes a future time. It never writes a terminal state.**

`pace_allows()` returning False must set `next_attempt_at` and return the item
to `queued`. It may never `return` out of the delivery path, and it may never
be the last thing that happens to a message. If that one sentence holds, the
32.1% loss cannot recur — and it is checkable by reading one function rather
than auditing every handler.

### 3a. The verifier under-reports success — and at-least-once amplifies it

**Found live, in this unit's own traffic, immediately after §6a.** CORD sent
the brief amendment to `ORCH deposit-courier` via `spine-spawn prompt`. The
message **arrived** — the pane transcript shows the ORCH read it and replied
*"CORD amended the brief mid-flight. Re-reading both before I decompose."* The
substrate nonetheless reported:

```
FAIL: w3R:p1Q: prompt NOT verified as submitted (status working).
Do not report this node as tasked.
```

The cause is in `_spine_common.py:363-398`. `verified_prompt()` waits
`--until working`. **If the target is already `working`, there is no transition
to observe**, the wait times out, and the function raises `RuntimeError` —
declaring non-delivery for a message that was demonstrably delivered. The only
fallback (`:380`) handles a buffered "Pasted text" paste, not an
already-working target.

### Sharpened by ground truth: the verifier is not pessimistic, it is *uncorrelated*

CORD's initial read was that `verified_prompt()` under-reports success — a
pessimistic oracle. `ORCH deposit-courier` measured all four cases instead of
accepting that, delivering one amendment to four working panes and then
checking each transcript with `herdr pane read --source recent --lines 600`:

| Pane | `spine-spawn prompt` verdict | Ground truth |
|---|---|---|
| `w3R:p1R` | FAIL: not verified (status working) | **DELIVERED** |
| `w3R:p1S` | FAIL: not verified (status working) | **DELIVERED** |
| `w3R:p1T` | FAIL: not verified (status working) | **NOT delivered** |
| `w3R:p1V` | FAIL: not verified (status working) | **NOT delivered** |

**Four identical verdicts, two opposite realities.** In the already-working
case the verifier's output is not a conservative signal that could be safely
over-trusted — **it is no signal at all.**

This raises the severity rather than changing the ruling. A courier requeueing
on this verdict would **duplicate the two delivered messages forever while
never learning the other two needed resending** — amplification and loss
simultaneously, produced by one bad oracle. Both halves of the ruling below are
therefore load-bearing and neither is optional: the **defer** prevents the
amplification, and the **`deposit_id` transcript echo** is the only thing that
makes an already-working target verifiable at all.

### Why this is fatal to the design as written, if left alone

The courier writes `delivered` only on a verified submit and **requeues on
failure**. Feed it a verifier that returns failure for every delivery into a
busy pane and the consequence is mechanical:

> **At-least-once + a verifier that under-reports success = unbounded duplicate
> delivery, concentrated on exactly the panes that are busiest.**

The unit would ship message *amplification* in place of message *loss*, and
every duplicate is an interruption — the precise harm pacing existed to
prevent. This is a worse failure than the one being fixed, because a lost
message is at least silent while a duplicated one costs the receiver a turn
every time.

### The ruling

1. **Capability-gated delivery is the default, not an optimization.** The
   courier delivers when the target *can receive* — on the flip to `idle` or
   `blocked` — rather than typing into a `working` pane. `shape.md` §`field/`
   already specifies this: *"capability-gated delivery, queued and drained on a
   status flip when a target cannot take a message mid-turn."* A `working`
   target is a **defer**, never a failure and never a requeue.
2. **Evidence of delivery is flip OR transcript echo.** COMMS-ARCH §Hard
   invariants already sanctions both — *"must observe the submit (status flip
   or transcript echo)"*. `verified_prompt()` implements only the first half.
   The courier must implement both, matching the echo on the `deposit_id`
   carried in the delivered text so the match is exact rather than fuzzy.
3. **"Already working" is a distinct outcome** in the queue state machine,
   with its own transition (`queued` → deferred, `next_attempt_at` set). It
   must never share a code path with a genuine delivery failure. Collapsing
   those two into one `except` is how this bug reaches production.

`verified_prompt()`'s flip-only rule is the reason the whole fleet cannot
message a busy peer without lying about the outcome in one direction or the
other. Fixing it is in scope here because the courier is its only remaining
caller after §7 closes the door.

### Coalescing, kept — of interruptions, never of content

`16-parent-wake 6c07649` proved the right shape and it is subsumed, not
redone: on drain, the courier delivers **all** items owed to one addressee in
**one** prompt, naming every one. That bounds how often a pane is interrupted
while preserving every message. COMMS-ARCH §Hard invariants ("No truncation")
binds here: coalescing the interruption is required; summarising the contents
is forbidden.

---

## 4. Observability — "is anything stuck, and why", in one command

```
bun ~/.tower/cli.mjs stuck        # alias: tower stuck
```

One line per non-empty inbox: addressee, engine live/dead/stranded, count
queued, oldest age, attempts, next attempt, last error. Then the dead-letter
tail with reasons.

- **Exit 0** = nothing owed past threshold. **Exit 1** = something is stuck.
  A non-zero exit makes it composable with `latch` and gateable by a hook,
  rather than something a human reads.
- **Incapable of silence** (`thesis.md`): with an empty queue it prints
  `nothing owed` — never nothing. A command that prints nothing is
  indistinguishable from a command that is broken, which is the failure mode
  this whole unit is about.

---

## 5. Where the courier runs — and the honest cost

The dispatcher forbids timers and threads in handlers, so the courier cannot be
a daemon a handler spawns. It is **one script invoked two ways**, both running
the same code under one lock file so two never run concurrently:

1. **Event-driven drain** — a handler numbered last (`90-courier`). The
   dispatcher runs handlers in sorted numeric order as separate subprocesses
   (`docs/dispatcher.md:23-24`), so every event ends with a drain pass. This
   covers the common case at zero latency.
2. **The pulse** — a launchd agent firing every 15s. This is the liveness
   floor, and it is **not optional**: event-driven drain alone has the exact
   bug being fixed. If a message is deferred and no further event ever arrives,
   it waits forever. Unit 3 task 2 (the operator-focused case must deliver
   rather than defer forever) is precisely this path, and it cannot pass
   without a pulse.

**The cost, named:** one new always-on launchd agent
(`~/dotfiles/launchagents/`). That is a real addition to the machine's
standing services and it is the price of the guarantee. `shape.md` §`deploy/`
already anticipates it — *"the pulse — the one owner of mechanical time... not
a speedometer, a pulse — emergent failure recovery is fiction without it."*
This unit builds the delivery-scoped pulse; it does not build the general one.

---

## 5a. CORD RULING — §5's two-invocation shape is superseded (2026-08-17)

§5 above stands as written, per house law that a correction stands beside what
it corrected. **It is wrong on one point, and the error is CORD's.** §5
specified "event-driven drain at zero latency" without pricing it against the
dispatcher's budget. `ORCH deposit-courier` measured it instead of assuming,
and the measurement holds:

- `bun` startup on this machine: 0.93s / 0.94s / 0.87s over three runs.
- `dispatcher.md:83-85` — the whole dispatcher invocation shares a ~10s herdr
  plugin-command timeout, on top of each handler's 5s.
- `90-courier` runs 7th of 7, behind six other handlers.
- `verified_prompt()` default timeout is 4000ms (`_spine_common.py:363`).

Arithmetic: the canonical queue is JS (§3, one implementation never two), so a
python `90-courier` needs ≥2 bun round-trips per pass (~1.8s) plus a 4s
verified prompt ≈ 5.8s in one handler — over the 5s per-handler budget on its
own, and most of the shared ~10s budget while running last. **A drain cannot
live inside a handler.** The brief was defective; the worker caught it. That is
the system working.

### The ruling: option B — nudge plus a resident courier

The launchd agent runs **one persistent process** that owns the lock, ticks
internally, and watches a nudge file. `90-courier` becomes a ~5ms one-shot that
touches the nudge file and exits 0.

This preserves everything §5 was for — one body of code, one lock, an always-on
launchd agent, a non-optional liveness floor, near-zero-latency event drain —
and drops only §5's letter, that the pulse be a 15s re-spawn.

**Option C (pulse-only, no nudge) is rejected on UX.** It puts up to 15s of
latency on every toast and every wake, including the operator's summons — the
one plane this entire unit exists to protect. A blocked agent waiting on a
human is the case where latency is felt most; trading it away to save a
resident process is the wrong trade.

**Cost, restated honestly:** §5 priced "one new always-on launchd agent." This
is a **resident** one. Note the direction of the CPU trade — a held process
that mostly sleeps is *cheaper* than a 0.9s bun spawn every 15s (a ~6%
continuous duty cycle). The real cost is memory footprint and one more
long-lived thing on the machine, which is operator-visible. Accepted.

### Conditions on the ruling — a resident courier introduces two new failure modes, and both must be closed

1. **A dead courier must be loud.** The courier writes a heartbeat. `tower
   stuck` (§4) reports a stale heartbeat as `courier not ticking since <T>` and
   **exits non-zero**. The launchd agent sets `KeepAlive` so it restarts. A
   delivery system whose deliverer can die quietly is exactly the silence this
   unit was sent to eliminate, relocated one level up.
2. **In-flight state must survive a crash.** The two-shot design could not lose
   in-flight work; a resident one can. Every `delivering` row is a **lease**:
   if it sits in `delivering` past a timeout, it returns to `queued`
   automatically. Without this, a courier crash mid-delivery strands the
   message permanently — voiding the exact guarantee being sold.
3. **The internal tick stays ≤15s**, so the liveness floor is the one §5
   promised and Unit 3's operator-focused test still means what it meant.
4. **The nudge handler contains no delivery logic** — touch a file, exit 0.
   This is what keeps the §7 DOOR intact: a 5ms one-shot with no delivery verb
   in scope cannot grow a private drop policy.

## 6. Migration

| Handler | Action |
|---|---|
| `10-notify` | `toast_allowed()` (`:334`) deleted. Both gate sites (`:422` blocked, `:494` done) become `deposit(to="operator:", ...)`. Board line unchanged. **A suppressed summons becomes a deferred one.** |
| `17-field-pull` | `pace_allows()` (`:179`) / `pace_record()` (`:191`) deleted. The offer becomes `deposit(to=f"pane:{pane_id}", ...)`. Its other declines (`:252` pane gone, `:257` bridge-exempt, `:262` operator-focused) become deposits too — the courier decides deliverability, not the sender. |
| `16-parent-wake` | Outbox logic deleted; behavior preserved via the primitive. **Subsumed, not regressed** — verified by Unit 3's burst test, which is the same case it was fixed for. |
| `20-reflex` | **NOT MIGRATED — deliberate.** Its limits (`:477` global/60s, `:482` per-rule/3600s) throttle an *action* (typing an answer on an agent's behalf), not a *message*. Nothing is owed when it declines; the question stays open and the operator is still summoned. Folding it in would convert a deliberate refusal into a queued obligation — the opposite of its purpose. Recorded as a non-target so a later reader does not "finish the job." |
| `30-choreo`, `15-restore-view`, `40-tower-bridge` | **NOT MIGRATED — no delivery.** Choreo drops a *view*; restore-view delivers nothing; tower-bridge writes ledger rows and its declines are law (fabrication-off, coordinator-exempt). |

**Deleted on completion:** `~/.tower/notify-pace.json`,
`~/.tower/field-pull-pace.json`, `~/.tower/parent-wake-pace.json`.

---

## 6a. The fabricated completion — found live, in this unit's own traffic

While dispatching this unit's own ORCH, CORD received the message *"your worker
ORCH deposit-courier is done"* **10 seconds after spawning it**. The worker was
`working` and had produced nothing. Verified against the instruments rather
than believed: `herdr pane list` showed `w3R:p1Q working`, no `.done` marker
existed, and no board finding had been posted.

The board row behind it, from `~/.tower/board.jsonl`:

```
2026-08-17T00:50:51Z note spine-daemon
  worker ORCH deposit-courier (w3R:p1Q) -> idle; spawner w3R:p1P
```

The status was **`idle`**, not `done`. `16-parent-wake:165` treats them
identically — `if status not in ("done", "idle")` — and then delivers a prompt
whose text is hardcoded *"your worker \<name\> is done"*. A freshly spawned
pane passes through `idle` before its prompt lands, so **every spawn fabricates
a completion for its spawner.** It happened to CORD's own spawn too: at
`00:38:54Z` the concierge was told `ORCH comms-substrate` was done, two seconds
after it was created and before it had read its brief.

### Why this belongs in this unit and cannot wait

1. **It is the same law, violated from the other side.** COMMS-ARCH §Hard
   invariants: *"No fabrication. No component invents mail from status
   transitions."* `40-tower-bridge` had fabrication turned off by operator
   mandate in 2026-08-10 for exactly this reason (`:376-378`).
   `16-parent-wake` fabricates identically and was never covered. Control-flow
   law is equally explicit: collect via board + `.done`; *"idle after DONE is
   correct (status is not mail)."* `idle` is defined as **not** a completion
   signal, and the handler treats it as one.
2. **This unit's own work makes it worse.** Today a fabricated completion is at
   least subject to the drop-on-pace rule that loses one in three messages.
   After Unit 2, delivery is guaranteed — so the false completion becomes
   *reliably* delivered, to every spawner, forever. **Improving delivery
   without fixing fabrication converts an intermittent lie into a dependable
   one.** Shipping the primitive without this fix is a net regression in
   trust, which is the one currency the substrate has.

### The rule

**A completion deposit requires evidence. Status alone is never evidence.**

`deposit(kind="completion", ...)` is refused at the door unless it carries at
least one of:

- `status == "done"` observed on the pane, **or**
- a `.done` marker on disk for that worker, **or**
- a `work-done` pheromone whose `ref` names the worker's claim, **or**
- a `$verdict` token stamped on the pane.

A bare `idle` flip carrying none of these is refused with
`reason: "no-completion-evidence: idle is not done"` and a dead-letter row. It
is refused **loudly** — the whole point of §3 is that a refusal leaves a
receipt, so this failure becomes countable instead of invisible.

This is the `status-is-not-mail` refusal in §3's table, applied to the case
that actually fires. It costs nothing extra to build: the door already exists
in the design, and this is one more row in its table.

**Second-order fix, same site:** the prompt text must stop asserting `done`
when it means `idle`. A pane that genuinely goes idle holding a live claim is
worth surfacing, but as what it is — `worker <name> went idle without
depositing` — which is a `need-help` signal, not a completion.

---

## 7. Enforcer (per `primitives/rules/ENFORCEMENT.md`)

**Status: DOOR + HOOK, with one named residual DOCTRINE.**

A delivery guarantee that depends on handler authors remembering is DOCTRINE
and will fail exactly as this one did — three times, plausibly, each in
isolation. So the guarantee is compiled in:

- **DOOR (primary).** `_spine_common.py` exports exactly two delivery verbs
  today: `notify()` (`:291`) and `verified_prompt()` (`:363`). Both are renamed
  private and gated on an env stamp only the courier sets
  (`SPINE_COURIER=1`); called from any other process they raise. Handlers get
  `deposit()` and nothing else. **A handler physically cannot deliver, so it
  cannot invent a policy about when not to.** This is the enforcer that matters
  — it removes the capability rather than discouraging its use.

- **HOOK (secondary).** `~/herdr-spine/tests/no-private-delivery.py`, run in
  the spine test suite and registered in ENFORCEMENT.md, fails if any file in
  `bin/handlers/[0-9]*` other than `90-courier`: references a `*-pace.json`
  path; calls `notify`/`verified_prompt`; or shells to `herdr … pane send` /
  `herdr notification show`. This catches the regression the door cannot see:
  a new handler that bypasses `_spine_common` entirely.

- **Residual DOCTRINE, named honestly.** A handler could still build a
  `subprocess.run` argv the grep does not match. The hook is a fence around the
  known shapes, not a wall. It is not closable without sandboxing handler
  subprocesses, which is out of scope for this unit. **Recorded as a compilation
  bug in the queue, not a rule to remember harder.**

Ledger row for `ENFORCEMENT.md`:

| Law | Source | Enforcer | Status | Coverage |
|---|---|---|---|---|
| Delivery guarantee (delivered, or dead-lettered with a reason; no private drop policies) | `primitives/rules/message-delivery.md` | DOOR: `_spine_common.py` delivery verbs gated to `SPINE_COURIER=1`. HOOK: `tests/no-private-delivery.py` | DOOR+HOOK | herdr-spine handlers. Residual DOCTRINE: raw `subprocess` argv the hook's patterns miss |

---

## 8. Done-when check (Unit 1)

- [x] Single deposit primitive specified: addressing (§2), typed refusal with
      receipt (§3), durable per-addressee queue (§3), at-least-once with ack
      (§3), dead-letter with mandatory reason (§3), pacing that defers and
      never drops (§3, the invariant).
- [x] Addressee question answered explicitly on Unit 0 evidence, with the
      choice **and its cost** stated, and what it defers named (§2).
- [x] Observability: one command, exit-coded, incapable of silence (§4).
- [x] Migration of every handler that delivers, deletion of all three private
      pace files, and explicit non-targets with reasons (§6).
- [x] Enforcer named: **DOOR + HOOK**, residual DOCTRINE labelled (§7).
- [x] Argued why this is not the convergent "uniform retries per handler"
      answer (§1).

SOURCES: `DELIVERY-CENSUS.md` (this unit, 2026-08-16/17);
`~/herdr-spine/bin/handlers/_spine_common.py:291,363`;
`~/herdr-spine/docs/dispatcher.md:23-24,81`;
`~/herdr-spine/bin/handlers/{10-notify,16-parent-wake,17-field-pull,20-reflex}`
at the cited lines; `herdr-spine` commits `6c07649`, `25c1ef0`;
`~/tup/contracts/thesis.md`, `shape.md` §`kernel/` §`socket/` §`field/`
§`durable/` §`deploy/`; `~/.tower/COMMS-ARCH.md` §Hard invariants;
`~/agent-core/primitives/rules/ENFORCEMENT.md`.
