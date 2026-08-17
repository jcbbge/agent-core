# Brief — comms-substrate, Wave 1

You are a worker in the `agent-core/comms-substrate` unit. Your ORCH is
`orch-deposit-courier` (pane `w3R:p1Q`). Do NOT speak a wake greeting. Execute
this brief.

**Do NOT use emojis anywhere.**

## Read these first, in full, before writing a line

1. `~/agent-core/briefs/comms-substrate/DESIGN.md` — **binding.** The design is
   not yours to change. If you believe it is wrong, post a finding to the board
   and ask; do not redesign silently.
2. `~/agent-core/briefs/comms-substrate/CONTRACT.md` — **binding, pinned by your
   ORCH.** Exact names, paths, row shapes, signatures, and reason strings. Other
   workers are coding against these names *right now*, in parallel. You may not
   change a pinned name. If one is wrong, post a finding and ask.
3. `~/agent-core/briefs/comms-substrate/DELIVERY-CENSUS.md` — the evidence.

## What this unit is fixing (so you understand what "done" means)

This bus loses messages and does not record that it lost them. Measured against
the real completion stream: **99 of 308 completions — 32.1% — were silently
discarded** by a drop-on-pace rule. `~/.tower/dead-letter.jsonl` holds 3 rows,
all validation failures; **zero delivery failures have ever been dead-lettered**,
because nothing routes one there. The human was the retry mechanism.

The guarantee being made true: **a message that enters this system is delivered
to its addressee, or lands in `dead-letter.jsonl` with a reason. There is no
third outcome.** Pacing, focus, and liveness may change *when* a message
arrives. Nothing may change *whether*.

## Pre-Verified Facts (your ORCH ran every command and read every line, 2026-08-17)

- `~/.tower/` is **NOT a git repo**. Its `.mjs` files are **symlinks** into
  `~/agent-core/primitives/mcps/tower/`, which IS git-tracked. **Edit the
  agent-core path.** The change is live via the symlink immediately. Never
  replace a symlink with a regular file.
- `primitives/hooks/tower-ledger.mjs:41` — `export const TOWER =
  process.env.TOWER_HOME || join(homedir(), '.tower')`. **`TOWER_HOME` is
  honored**, so tests use real files in a temp dir without touching live state.
- `tower-ledger.mjs:182` `append(file, obj)` is the **flocked** (`LOCK_EX`)
  append. Precedent `herdr-spine 25c1ef0`. Also available: `appendLine:176`,
  `jsonlRowRejectReason:142`, `deadLetter:238`, `deadLetterOnce:251`,
  `deadLetterPath:194`, `readDeadLetters:259`. **Import these. Do not fork them.**
- `primitives/mcps/tower/lib.mjs` is 68 lines and re-exports
  `../../hooks/tower-ledger.mjs` at line 6.
- `primitives/mcps/tower/cli.mjs` is 323 lines; command dispatch is an
  `if (cmd === 'status') ... else if` chain from line 111; usage string at 316.
- `~/.tower/*.jsonl` (`board.jsonl`, `ledger.jsonl`, `dead-letter.jsonl`,
  `pheromones.jsonl`, `odometer.jsonl`) are **untracked state** and must never
  enter git.
- Existing tower tests to sit beside and match in style:
  `dead-letter.test.mjs`, `write-path.test.mjs`, `jsonl-integrity.test.mjs`,
  `flock-integrity.test.mjs`, `plane-fixes.test.mjs`, `ref-align.test.mjs`,
  `cli.test.mjs`, `rotate.test.mjs`, `server-drift.test.mjs`.
- Backups of live Tower state exist (`~/.tower-backup-orch-20260816-195122`).
  You still must not mutate live state: use `TOWER_HOME`.

## Tower

Board topic: `agent-core/comms-substrate`.

- Post a CLAIM **first**, findings **during**, and write your `.done` **last**:
  `bun ~/.tower/cli.mjs post <claim|finding|note> agent-core/comms-substrate "<body>" --from "<your-name>"`
- Stigmergic coordination is mandatory: `bun ~/.tower/cli.mjs emit work-claimed
  agent-core/comms-substrate <payload_ref> --ref <id> --evidence <path> --from <you>`;
  read the field before going idle (`bun ~/.tower/cli.mjs field`); `work-done`
  with `ref` when finished; **`need-help` instead of silence**.
- `.done` marker: write `~/.tower/<your-registration-name>.done` as your last
  action, after your report lands on the board.
- **Do not commit.** Your ORCH commits. Leave your work in the tree.
- **Do not message the operator.** Fleet mail goes to the board topic.

## Constraints binding on every worker in this unit

- **No mocks of the bus.** Real files, real paths, under a `TOWER_HOME` temp
  dir. A mocked bus proves nothing about a bus whose defect was that it lied
  about delivery.
- Every new append path uses the flocked `append()`.
- **Never** put a credential literal in any file you write.
- Do not bypass `credential-guard`, the grounding hook, or the write-gate. A
  refusal is information; work with it, never around it.
- **One write per file per thought** — compose consecutive edits into a single
  call. If you need a second write to a file, Read it first, by contract.
- Stay inside your file partition. **No two workers in this wave share a file.**
  Touching a file outside your partition is a defect, not thoroughness.

---

# THIS BRIEF ADDRESSES TWO SEATS. FIND YOURS FIRST.

| Registration name | You are | You write |
|---|---|---|
| `agnt-courier` | the **IMPLEMENTER** | `primitives/mcps/tower/courier.mjs` and `~/dotfiles/launchagents/com.tower.courier.plist` |
| `agnt-courier-test` | the **TEST-MAKER** | `primitives/mcps/tower/courier.test.mjs` |

Find your name from your pane's `name=` token. **If you cannot tell which seat
you are, post `need-help` and stop — do not guess.** The test agent is not the
implementation agent. Do not read the other seat's worktree.

**Note on repos:** your worktree isolates `agent-core` only. The launchd plist
lives in `~/dotfiles` and is edited in its main tree. No other worker in this
unit touches `~/dotfiles`.

## The courier is the ONLY writer of prompts and toasts on this machine

Handlers deposit. The courier delivers. It drains inboxes, applies pacing as
**deferral**, verifies the submit, acks on success, requeues on genuine failure,
and dead-letters on policy exhaustion. `deposit.mjs` (CONTRACT §7) is already
built — **import it. Do not reimplement queue logic.** Two implementations of
this queue is the exact failure this unit exists to remove.

## CORD's ruling — why this is a resident process (DESIGN §5a)

DESIGN §5 originally specified a `90-courier` handler that drains in-process,
plus a launchd agent re-firing every 15s. Your ORCH measured that this cannot
work: **bun startup is ~0.9s** on this machine, the **whole** dispatcher
invocation shares a **~10s** timeout across all handlers
(`~/herdr-spine/docs/dispatcher.md:83-85`), each handler has 5s, `90-courier`
runs 7th of 7, and `verified_prompt` alone budgets 4s. CORD accepted the
measurement and ruled **Option B**, landed as DESIGN §5a.

**The shape:** one **resident** courier process under launchd `KeepAlive`, which
owns the lock and ticks internally. `90-courier` becomes a **nudge** — it
touches a file and exits.

### The four binding conditions (CORD, non-negotiable)

A resident courier adds two failure modes the two-shot design did not have.
These conditions exist to close exactly those, and your work is judged on them:

1. **A dead courier must be LOUD.** Heartbeat on every tick. `tower stuck`
   reports a stale courier and **exits non-zero**. launchd `KeepAlive`.
   A silently dead courier would restore the original bug — messages owed and
   nothing delivering them — with no symptom.
2. **Every `delivering` row is a LEASE** that returns to `queued` past a
   timeout. A crash mid-delivery must not strand a message forever in
   `delivering` — neither delivered nor dead-lettered is the third outcome the
   design forbids.
   **The queue side of this is already built and is NOT yours to write:**
   `deposit.mjs` exports `LEASE_TIMEOUT_SECONDS = 120` and
   `reclaimLeases(to, now) -> [deposit_id]` (CONTRACT §6d). **Call it at the top
   of every drain pass.** Reclaim burns no attempt and sets neither
   `last_error` nor `deferred_reason` — a courier crash is not the addressee's
   fault and not a delivery failure.
3. **Internal tick ≤ 15s**, so the liveness floor is the one DESIGN §5 promised
   and Unit 3's operator-focused test still means what it meant.
4. **The nudge handler contains NO delivery logic** — touch a file, exit 0.
   This is what keeps the §7 DOOR intact: a handler that cannot deliver cannot
   invent a policy about when not to.

## Delivery semantics — CONTRACT §6a, binding

- **Capability-gated: NEVER type into a `working` pane.** Deliver on the flip to
  `idle` or `blocked`.
- A busy target is a **DEFER** — `deferred_reason` set, `state` stays `queued`,
  **`attempts` unchanged**, `next_attempt_at` pushed. Never a failure, never a
  requeue. If deferral burned an attempt, a healthy-but-busy addressee would
  march to `MAX_ATTEMPTS` and have its mail **dead-lettered for being busy**.
- **Evidence of delivery = a status flip OR a transcript echo matched on
  `deposit_id`.** `verified_prompt` implements only the first, and its verdict
  for an already-working target is **uncorrelated with reality** — your ORCH
  measured it returning the identical `FAIL` for two delivered and two
  undelivered messages (PROOF.md §0.3). Do not trust that verdict alone.
- **Coalescing of interruptions, never of content:** one drain delivers **all**
  due items for one addressee in **one** prompt, naming every one, and naming
  each item's `deposit_id` so the echo is matchable. Full bodies always; the ids
  are carried in addition, never instead. COMMS-ARCH "No truncation" binds.
- `last_error` and `deferred_reason` are **never written by the same event.**

## IMPLEMENTER (`agnt-courier`) — done when

- `courier.mjs` runs resident: single-instance under one lock file, internal
  tick ≤15s, heartbeat written every tick.
- **Two concurrent invocations provably cannot both drain** — prove the lock by
  running two and showing one refuses. Lock proven, not asserted.
- Leases: a `delivering` row abandoned by a killed courier returns to `queued`.
  **Demonstrate it by killing the process mid-delivery**, not by reasoning.
- The courier verifies each submit before writing `delivered`, using both
  evidence forms.
- `90-courier` is **not yours** — the spine unit writes the nudge. Define and
  document the nudge file path and contract so that unit can implement against
  it, and post it to the board.
- `~/dotfiles/launchagents/com.tower.courier.plist` exists, is installed
  (symlink into `~/Library/LaunchAgents/`, matching the convention used by
  `com.localllm.server.plist`), is loaded, and is **observed running**.
- Report the exact `launchctl` commands and their real output.

## TEST-MAKER (`agnt-courier-test`) — done when

Write from DESIGN §5/§5a and CONTRACT §6a only. **NO MOCKS** — real files under
a `TOWER_HOME` temp dir, real processes. Prove:

- Two concurrent couriers: exactly one drains. Assert on real observed behavior.
- A killed courier's `delivering` lease returns to `queued` past the timeout.
- Tick interval is ≤15s.
- A stale heartbeat makes `stuck` exit non-zero.
- A `working` target produces a **defer**: `deferred_reason` set, `state` still
  `queued`, **`attempts` unchanged**. Assert `attempts` explicitly — this is the
  test that stops a busy pane's mail being dead-lettered for being busy.
- Coalescing: N items owed to one addressee produce **one** prompt naming all N,
  with every `deposit_id` present and **no body truncated or summarised**.
- A genuine failure sets `last_error` and increments `attempts`, and the same
  row does **not** carry `deferred_reason`.

Report test names mapped to each item, the mutation each detects, and the
literal pass/fail output — failing before the implementation lands is expected
and correct.
