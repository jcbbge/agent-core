# CONTRACT — pinned by ORCH deposit-courier, binding on every worker in this unit

`DESIGN.md` rules *what* is built. This file pins the *exact* names, paths, and
row shapes so that workers building in parallel cannot disagree. Where DESIGN.md
and this file conflict, DESIGN.md wins and you post a finding.

**You may not change anything in this file. If it is wrong, post a finding to
`agent-core/comms-substrate` and ask. Do not "improve" a pinned name — another
worker is coding against it right now.**

---

## 1. Where the code lives

| Thing | Path |
|---|---|
| Queue/deposit core (NEW) | `~/agent-core/primitives/mcps/tower/deposit.mjs` |
| Existing flocked writers (import from here, do not fork) | `~/agent-core/primitives/hooks/tower-ledger.mjs` |
| Re-export surface | `~/agent-core/primitives/mcps/tower/lib.mjs` |
| CLI | `~/agent-core/primitives/mcps/tower/cli.mjs` |
| Tests | `~/agent-core/primitives/mcps/tower/deposit.test.mjs`, `stuck.test.mjs` |

`~/.tower/*.mjs` are **symlinks** into `primitives/mcps/tower/`. Edit the
agent-core path. Never write through the symlink in a way that replaces it with
a regular file.

### Already built — import, never reimplement

From `../../hooks/tower-ledger.mjs`:

- `TOWER` — resolves to `process.env.TOWER_HOME || ~/.tower`. **Honored for
  tests.** Every path you compute must derive from `TOWER`, never from a
  hardcoded `~/.tower`, or the tests will scribble on live state.
- `append(file, obj)` — flocked (`LOCK_EX`) append of one JSON object as one
  JSONL line. This is the precedent set by `herdr-spine 25c1ef0`. **Every new
  append path uses it.**
- `appendLine(file, line)`, `jsonlRowRejectReason(line)`
- `deadLetter(row, reason)` — always writes. `deadLetterOnce(row, reason)` —
  at most once per row id.
- `deadLetterPath()`, `readDeadLetters()`

## 2. Addressing

Per DESIGN §2. Every deposit carries `to:` in exactly one of these forms:

| Scheme | Example | Behavior |
|---|---|---|
| `pane:` | `pane:w3R:p1P` | live |
| `operator:` | `operator:` | live |
| `role:` | `role:ORCH@agent-core` | live; resolved to a pane set at **delivery** time, never at deposit time |
| `agent:` | `agent:a-mswi9zhh-1cfj` | **refused today**, reason `agent: scheme not yet implemented` |

Anything else is refused `bad-addressee: <value>`.

### Slug — pinned exactly, both directions

```js
export function slugForAddressee(to) {
  return to.replace(/[^A-Za-z0-9._-]/g, ch =>
    '_' + ch.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0'))
}
export function unslugAddressee(slug) {
  return slug.replace(/_([0-9A-F]{2})/g, (_m, h) => String.fromCharCode(parseInt(h, 16)))
}
```

`pane:w3R:p1P` → `pane_3Aw3R_3Ap1P`. Reversible, so `stuck` prints the real
addressee. **Do not substitute base64, a hash, or a lossy `-` replacement** —
`stuck` must round-trip the addressee back for the operator to read.

Inbox path: `${TOWER}/objects/${slugForAddressee(to)}/inbox.jsonl`

## 3. The queue is append-only, folded by `deposit_id`

**This is the single most important pin in this file.** A queue needs mutable
state; JSONL under concurrent readers must not be rewritten in place. So:

> **Every state change APPENDS a new row carrying the same `deposit_id`. The
> current state of a deposit is the LAST row bearing its `deposit_id`.**

This keeps the flocked-append precedent, never truncates a file another process
is reading, and makes the whole history auditable. Compaction is explicitly out
of scope for this unit.

### Row shape

```json
{
  "deposit_id": "dep-<base36 ms>-<4 random base36>",
  "ts": "2026-08-17T00:50:51Z",
  "to": "pane:w3R:p1P",
  "kind": "completion",
  "body": "text, never truncated, never summarised",
  "from": "16-parent-wake",
  "ref": null,
  "ttl_s": null,
  "evidence": {},
  "state": "queued",
  "attempts": 0,
  "next_attempt_at": "2026-08-17T00:50:51Z",
  "last_error": null
}
```

- `ts` is the ISO time of **that row**. The deposit's creation time is the `ts`
  of its first row.
- States: `queued` → `delivering` → `delivered` → `acked`. Terminal-by-policy is
  a dead-letter row, never a queue state.
- Allowed `kind`: `completion`, `summons`, `offer`, `note`, `question`,
  `need-help`. Anything else → `unknown-kind: <value>`.
- **Status-plane kinds** = `note`, `offer`. Addressed to `operator:` these are
  refused `status-is-not-mail` (COMMS-ARCH §Plane separation — status is not
  mail; this is the first mechanical enforcement of it).

## 4. Refusals — exact reason strings

A refusal returns a receipt **and** writes a `dead-letter.jsonl` row with a
non-empty `reason`. There is no silent path.

| Condition | `reason` (exact string) |
|---|---|
| unknown/malformed `to:` scheme | `bad-addressee: <value>` |
| `agent:` scheme | `agent: scheme not yet implemented` |
| empty/whitespace `body` | `empty-body` |
| `kind` not in the allowed set | `unknown-kind: <value>` |
| status-plane `kind` to `operator:` | `status-is-not-mail` |
| `question` past nQ budget | `nq-exhausted` |
| missing/empty `from` | `unauthored` |
| `completion` without evidence (DESIGN §6a) | `no-completion-evidence: idle is not done` |

### Receipt

```js
{ deposit_id: string|null, accepted: boolean, reason: string|null }
```

`accepted: true` ⇒ `reason === null`. `accepted: false` ⇒ `reason` is a
non-empty string from the table above. **There is no third shape and no return
value meaning "silently didn't happen."**

## 5. Completion evidence (DESIGN §6a)

`kind: "completion"` is refused unless `evidence` carries at least one truthy:

| Field | Accepted when |
|---|---|
| `evidence.status` | `=== "done"` (the string `"idle"` is NOT evidence) |
| `evidence.done_marker` | a path string that **exists on disk** at deposit time |
| `evidence.work_done_ref` | non-empty pheromone id string |
| `evidence.verdict_token` | non-empty string |

A bare `idle` flip carrying none of these → `no-completion-evidence: idle is not
done`, refused loudly with a dead-letter row.

## 6. Retry, pacing, coalescing

- `MAX_ATTEMPTS = 8`
- Backoff on failure: `attempts += 1`, `next_attempt_at = now + min(2**attempts, 300)s`
- Exhaustion → dead-letter, reason `undeliverable after <N> attempts: <last_error>`
- TTL expiry → dead-letter, reason `ttl-expired`
- `PACE_WINDOW_SECONDS = 60`, per addressee.

> **THE INVARIANT (DESIGN §3). Pacing writes a future time. It never writes a
> terminal state.**
>
> A paced item stays `queued` with `next_attempt_at` pushed forward. Pacing may
> never `return` out of the delivery path and may never be the last thing that
> happens to a message. Any code path where a pace decision is followed by the
> message ceasing to be owed is a defect, not a feature.

- **Coalescing** — of interruptions, never of content. One drain delivers **all**
  due items owed to one addressee in **one** prompt, naming every one. COMMS-ARCH
  §Hard invariants ("No truncation") binds: summarising the contents is
  forbidden.

## 6a. AMENDMENT — deferral is not failure (CORD ruling, DESIGN §3a)

**Added 2026-08-17 after CONTRACT was first pinned. This overrides anything
above that conflicts with it. It is binding and it is not optional.**

CORD found a third live defect: `_spine_common.py:363-398` `verified_prompt()`
waits `--until working`. If the target is **already working**, there is no
transition to observe, the wait times out, and it **raises — declaring
non-delivery for a message that was actually delivered.** Observed live: CORD's
Task 6 amendment reached this ORCH and was acted on, while `spine-spawn`
reported `FAIL: prompt NOT verified as submitted`.

**Why this is fatal if left alone.** The courier writes `delivered` only on a
verified submit and requeues on failure. At-least-once delivery plus a verifier
that under-reports success equals **unbounded duplicate delivery**, concentrated
on the busiest panes. This unit would ship message *amplification* in place of
message *loss* — which is worse, because a lost message is silent while a
duplicated one costs the receiver a turn every single time.

### The rules

1. **Capability-gated delivery is the DEFAULT.** Deliver on the flip to `idle`
   or `blocked`. **Never type into a `working` pane.**
2. **A busy target is a DEFER — never a failure, never a requeue.**
3. **"Already working" is a distinct queue outcome and must never share a code
   path with a genuine delivery failure.**
4. **Evidence of delivery = a status flip OR a transcript echo matched on
   `deposit_id`.** COMMS-ARCH sanctions both; `verified_prompt` implements only
   the first. The second is what makes an already-working target verifiable.

### What this changes in the pinned surface

A new terminal-free outcome, **`deferred`**, joins the queue vocabulary:

```
queued -> delivering -> delivered -> acked
   ^          |
   +-- deferred (target busy, or paced)
```

- **`deferred` MUST NOT increment `attempts`.** This is the whole point. If a
  busy pane burned an attempt each pass, a healthy addressee under load would
  march to `MAX_ATTEMPTS` and get its mail **dead-lettered for being busy**.
  That would be a new silent-loss bug shipped inside the fix for silent loss.
- `deferred` sets `next_attempt_at` and returns the item to `queued`. Like
  pacing, **it writes a future time and never a terminal state.**
- `requeue()` is now **exclusively** for genuine delivery failures — the target
  was reachable, delivery was attempted, and it demonstrably did not land.

**Added export (CONTRACT §7):**

```js
export function markDeferred(to, ids, reason)   // no attempts increment; sets next_attempt_at
```

**Added `stuck` column (CONTRACT §8):** a deferred item reports its deferral
reason, so `deferred: target busy` is visibly distinct from an item that is
failing. An operator must never have to guess which one they are looking at.

#### The deferral field — pinned exactly (raised by `agnt-stuck-cli`, 01:06:41Z)

The first pin of §6a named `markDeferred(to, ids, reason)` but never said which
folded-row field `reason` lands in, so `deposit.mjs` and `cli.mjs` were each
about to guess. Pinned now, and it is not a guess for anyone:

| Field | Pinned value |
|---|---|
| `deferred_reason` | the string passed to `markDeferred`, e.g. `target busy`, `paced` |
| `state` | stays **`queued`** — a deferral is never its own terminal state |
| `attempts` | **unchanged** by a deferral |
| `next_attempt_at` | pushed to the future |

- A deferred item is therefore exactly: `state === 'queued'` **and**
  `deferred_reason` non-null. That pair is how `stuck` tells "deferred: target
  busy" apart from a plain queued item, and from one that is failing.
- **`deferred_reason` MUST be cleared to `null`** on a successful delivery and
  on a genuine delivery failure (where `last_error` is set instead). A stale
  deferral reason sitting on a failing row would tell the operator the exact
  opposite of what is happening.
- `last_error` and `deferred_reason` are **never** written by the same event.
  Rule 3 of §6a — the two outcomes must not share a code path — is enforced by
  that separation at the row level, so it is checkable by reading a row rather
  than by trusting the code.

`stuck` reads `deferred_reason` only. It does **not** need a fallback chain.

## 6b. TWO MORE PINS — both raised by workers, both my gaps

### The `inboxState` name collision (raised by `agnt-stuck-cli`, 01:10:45Z)

`tower-ledger.mjs` **already exports `inboxState(cwd)`** — board/ledger inbox
state, used throughout `cli.mjs` today. CONTRACT §7 pinned `deposit.mjs`
`inboxState(to)` for folded deposit rows: same name, different signature,
different meaning. Since `lib.mjs` re-exports with `export * from`, the two
would collide silently at the exact surface everything imports from.

**RULING — the deposit-side function is renamed:**

| Was pinned | Is now pinned |
|---|---|
| `inboxState(to)` | **`foldInbox(to)`** |

`foldInbox(to)` returns `Map<deposit_id, foldedRow>`, last-write-wins. The new
name says what it does — folds the append log by `deposit_id` — and cannot
collide with the ledger's `inboxState(cwd)`, which is **unchanged and still
means what it always meant**. Everywhere §7 says `inboxState`, read
`foldInbox`.

### The unpinned `stuck` threshold (raised by `agnt-stuck-cli-test`, 01:09:32Z)

DESIGN §4 says "exit 0 = nothing owed **past threshold**" and no threshold was
ever pinned, so a boundary test could not be written without inventing the
number. Correct catch. Pinned now:

```js
export const STUCK_THRESHOLD_SECONDS = 300
```

**`stuck` exits 1 if ANY of these hold; otherwise exit 0:**

1. an item with `state === 'queued'` whose `next_attempt_at` is more than
   `STUCK_THRESHOLD_SECONDS` in the past;
2. an item with `attempts >= MAX_ATTEMPTS` that is not yet terminal;
3. a `delivering` row past its lease (a crashed mid-delivery, CORD condition 2);
4. a **stranded** inbox — addressee has no live engine and no successor;
5. a **stale courier heartbeat** (CORD condition 1 — a dead courier must be
   loud; this is the condition that makes it loud).

300s is chosen against the machine's own timings: the pace window is 60s and the
courier's tick is ≤15s, so a healthy item is delivered well inside ~75s. An item
still owed five minutes past its due time is not slow, it is stuck.

Deferred items are **not** stuck merely for being deferred — they are stuck only
by rule 1, on the same overdue clock as anything else. A busy pane must not
raise an alarm just for being busy.

## 6c. PINS FORCED BY THE ACCEPTANCE RUN (ORCH verify beat)

First integration run of `deposit.test.mjs` against `deposit.mjs`: **55 pass, 9
fail.** Two of the failure causes are gaps in this contract, not implementation
defects. Pinned here so the fix is unambiguous.

### How far a deferral pushes `next_attempt_at`

§6a said a deferral "pushes `next_attempt_at` to the future" and **never said by
how much**, so `markDeferred` could satisfy the letter while leaving the item
immediately due — which is what happened, and it is what four §6a tests and both
(e) tests caught.

```js
export const DEFER_RETRY_SECONDS = 15
export function markDeferred(to, ids, reason, nextAttemptAt)  // 4th arg optional
```

- Omitting `nextAttemptAt` defaults to `now + DEFER_RETRY_SECONDS`. The 3-arg
  call pinned in §6a stays valid.
- **15s = one courier tick** (CORD condition 3). A busy pane usually frees up in
  seconds; pushing a busy-target defer by the full 60s pace window would make an
  idle pane wait a minute for mail it could have taken immediately — a UX
  regression on the operator's summons plane, caused by the fix.
- Pace deferrals pass the pace-derived time explicitly, from `paceGate`.

> **Binding, and the thing the tests actually check:** after **any** deferral or
> requeue, the item **MUST NOT be returned by `dueItems(to, now)`** at the same
> `now`. "Writes a future time" means a time that is actually in the future.

### The nQ budget, which was never defined

§4 pins the refusal `nq-exhausted` but this contract never said what the budget
is or how `deposit()` could possibly know a question exceeded it. The implementer
had no way to satisfy it and the refusal never fired.

```js
export const NQ_BUDGET = 3
```

- `deposit()` refuses `kind: "question"` with exactly `nq-exhausted` when the
  caller passes a numeric `nq` **greater than** `NQ_BUDGET`.
- If `nq` is absent, **no refusal** — the door does not invent a budget it was
  not told about. Guessing here would silently eat legitimate questions, which
  is the failure mode this unit exists to remove.

### Two genuine implementation defects (contract was already clear)

1. **`ttl-expired` is never written.** `expireTtl()` must dead-letter the
   expired item with exactly `ttl-expired` (§6). The run produced zero rows
   where one was required.
2. **A row carries `last_error` and `deferred_reason` simultaneously.** §6a
   forbids this explicitly: they are never written by the same event, and
   `deferred_reason` clears on a genuine failure. That row-level separation is
   the *only* mechanical check that deferral and failure do not share a code
   path — if both fields coexist, rule 3 of §6a is unenforced.

### A third finding, recorded (raised by `agnt-stuck-cli-test`, 01:09:32Z)

Today an unknown verb prints the usage string and **exits 0** — verified:
`bun cli.mjs stuck` and `bun cli.mjs deposit …` both exited 0 before either verb
existed. **Any acceptance test asserting only "exit 0" or "stdout is non-empty"
therefore passes vacuously against a CLI that does not implement the verb at
all.** Every test in this unit must assert on *specific* output or a *specific*
non-zero code. This is exactly the class of false-green the unit exists to
eliminate, found in the test harness itself.

### The delivered prompt must carry its `deposit_id`s

So the transcript echo in rule 4 is matchable, the coalesced prompt the courier
writes **names the `deposit_id` of every item it carries**. This is what lets
delivery be confirmed against an already-working pane without a status flip.
It does not license summarising content — COMMS-ARCH "No truncation" still
binds. The ids are carried **in addition to** the full bodies, never instead.

## 6d. LEASE RECLAIM — CORD condition 2, verified unmet

CORD read `deposit.mjs` directly (not the claim) and found: **nothing returns a
row stuck in `delivering` back to `queued`.** `markDeferred` and `requeue` are
correct and properly distinct, but condition 2 of the DESIGN §5a ruling is
unmet, and it voids the exact guarantee this unit sells — **a courier that
crashes mid-delivery strands that message permanently**, in a state no retry
path ever revisits. A message stuck in `delivering` forever is neither delivered
nor dead-lettered, which is the third outcome §0 says cannot exist.

This is more urgent under the resident courier than it was under the two-shot
design: a resident process holds leases across many messages, so one crash can
strand a batch.

```js
export const LEASE_TIMEOUT_SECONDS = 120
export function reclaimLeases(to, now)   // -> [deposit_id] reclaimed
```

- A row in `delivering` whose transition timestamp is older than
  `LEASE_TIMEOUT_SECONDS` returns to **`queued`**, with `next_attempt_at` set to
  `now` so the next drain picks it up.
- **Reclaim does NOT burn an attempt.** The message was never proven undelivered
  — the courier died, which is not the addressee's fault and not a delivery
  failure. Charging an attempt here would walk crash-interrupted messages toward
  `MAX_ATTEMPTS` and dead-letter them for the courier's own instability.
- Reclaim sets neither `last_error` nor `deferred_reason`. It is a **third,
  distinct** cause of requeue and must not borrow either field's meaning —
  same reasoning as §6a rule 3.
- 120s is four courier ticks (§6a `DEFER_RETRY_SECONDS` = 15, CORD condition 3
  caps the tick at 15s). Long enough that a slow-but-live delivery is never
  reclaimed out from under itself; short enough that a crash is recovered inside
  the `STUCK_THRESHOLD_SECONDS` = 300 window, so `stuck` never reports a
  permanent stranding that the system would have healed on its own.

`stuck` rule 3 (§6b) — "a `delivering` row past its lease" — is exactly this
condition, and is what makes an unreclaimed lease loud rather than silent.

## 7. Exported surface of `deposit.mjs` — pinned signatures

```js
export const PACE_WINDOW_SECONDS = 60
export const MAX_ATTEMPTS = 8
export const ALLOWED_KINDS          // Set
export const STATUS_PLANE_KINDS     // Set: note, offer

export function slugForAddressee(to)
export function unslugAddressee(slug)
export function inboxPath(to)

export function deposit({ to, kind, body, from, ref, ttl_s, evidence })  // -> Receipt

export function readInbox(to)        // raw append log, in order
export function inboxState(to)       // Map<deposit_id, foldedRow>, last-write-wins
export function listInboxes()        // [{ to, slug, path }]
export function dueItems(to, now)    // folded rows, state 'queued', next_attempt_at <= now
export function pendingItems(to)     // folded rows not in a terminal state

export function markDelivering(to, ids)
export function markDelivered(to, ids)
export function markAcked(to, ids)
export function requeue(to, id, error)          // attempts+1, backoff, last_error; dead-letters past MAX_ATTEMPTS
export function expireTtl(to, now)              // dead-letters ttl-expired items
export function paceGate(to, now)               // -> { allowed: bool, next_attempt_at: iso }
```

`paceGate` **returns a decision**; it never mutates a message into a terminal
state. Callers apply it by pushing `next_attempt_at`.

## 8. CLI surface — pinned

```
bun ~/.tower/cli.mjs deposit <to> <kind> "<body>" --from <name>
        [--ref <id>] [--ttl <seconds>]
        [--evidence-status <s>] [--evidence-done-marker <path>]
        [--evidence-work-done-ref <id>] [--evidence-verdict <token>]
```
Prints the receipt as one JSON line. **Exit 0 accepted, exit 1 refused.**

```
bun ~/.tower/cli.mjs stuck
```
Per DESIGN §4. One line per non-empty inbox: addressee, engine liveness, queued
count, oldest age, attempts, next attempt, last error. Then the dead-letter tail
with reasons. `nothing owed` on an empty queue — **never prints nothing**.
**Exit 0 nothing stuck, exit 1 something stuck.** Orphaned inboxes (no live
engine, no successor) report as `stranded`.

## 9. Non-negotiables

- **python3 stdlib only** in `bin/handlers/` — no third-party imports, no timers,
  no threads, one-shot, all failures log to stderr and **exit 0**
  (`~/herdr-spine/docs/dispatcher.md`).
- macOS ships **bash 3.2** — no `mapfile`, no associative arrays.
- Every new append path uses the flocked `append()`.
- `~/.tower/*.jsonl` state files are **not** tracked and must never enter git.
- **No mocks of the bus.** Tests run against real files under a `TOWER_HOME`
  temp dir. A mocked bus proves nothing about a bus whose defect was that it
  lied about delivery.
- **No emojis** anywhere.

SOURCES: `DESIGN.md` §2/§3/§4/§6a/§7 and `DELIVERY-CENSUS.md`, read in full
2026-08-17; `primitives/hooks/tower-ledger.mjs:41,115,176,182,238,251` read;
`~/herdr-spine/docs/dispatcher.md:51-53,83-85` read; `_spine_common.py:291,363`
read; `16-parent-wake:47,165,196-218` read; `~/.tower/board.jsonl` topic
`herdr-spine/parent-wake` inspected (311 rows); bun startup measured 3x
(0.93/0.94/0.87s) on this machine, 2026-08-17.
