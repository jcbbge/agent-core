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
