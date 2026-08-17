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
| `agnt-spine-delivery` | the **IMPLEMENTER** | `bin/handlers/_spine_common.py`, `bin/handlers/90-courier`, `bin/handlers/10-notify`, `bin/handlers/17-field-pull`, `bin/handlers/16-parent-wake` |
| `agnt-spine-delivery-test` | the **TEST-MAKER** | `test/no-private-delivery.py` |

Find your name from your pane's `name=` token. **If you cannot tell, post
`need-help` and stop.** Do not read the other seat's worktree.

**Your repo is `~/herdr-spine`**, not agent-core. Its remote is
`git@github.com:jcbbge/herdr-spine.git`.

## Handler law (binding, `~/herdr-spine/docs/dispatcher.md`)

**python3 stdlib only. One-shot subprocesses. No timers. No threads. All
failures log to stderr and exit 0.** Each handler has a 5s budget and the whole
dispatcher invocation shares ~10s (`dispatcher.md:83-85`). macOS ships bash 3.2.

## IMPLEMENTER (`agnt-spine-delivery`)

### Order of work — this order is a ruling, not a preference

**The DOOR closes LAST.** Gating `notify()` / `verified_prompt()` the moment
they are written would break every not-yet-migrated handler instantly. Handlers
log and exit 0, so the machine would silently lose **all** toasts and **all**
spawner wakes with no symptom — on a live bus, with a fleet running on it. Do
these in order:

1. **`deposit()` binding in `_spine_common.py`.** It shells to the canonical
   implementation and marshals the receipt. **It must not reimplement policy** —
   handlers are stdlib-only by contract, and the canonical queue is
   `deposit.mjs` (CONTRACT §7, already built).
2. **`90-courier` — the NUDGE.** Touch the nudge file, exit 0. **No delivery
   logic. None.** Per CORD condition 4, this is what keeps the DOOR intact. The
   resident courier owns delivery; `agnt-courier` publishes the nudge path and
   contract to the board.
3. **Migrate the three handlers** (DESIGN §6):
   - `10-notify` — delete `toast_allowed()` (`:334`). Both gate sites (`:422`
     blocked, `:494` done) become `deposit(to="operator:", ...)`. Board line
     unchanged. **A suppressed summons becomes a deferred one.**
   - `17-field-pull` — delete `pace_allows()` (`:179`) / `pace_record()`
     (`:191`). The offer becomes `deposit(to=f"pane:{pane_id}", ...)`. Its other
     declines (`:252` pane gone, `:257` bridge-exempt, `:262` operator-focused)
     **also become deposits** — the courier decides deliverability, not the
     sender.
   - `16-parent-wake` — **SUBSUME, DO NOT REGRESS.** It is already an outbox
     (`herdr-spine 6c07649`): it queues before deciding (`:198`), and pacing
     (`:204`) and operator-focus (`:200`) defer rather than cancel. That shape
     is right and this design generalises it. Delete its private outbox; the
     behavior must be preserved through the primitive.
4. **Kill the fabricated completion** (DESIGN §6a) — `16-parent-wake:165` reads
   `if status not in ("done", "idle")`, then sends text hardcoded at `:210` to
   say **"is done"**. A freshly spawned pane passes through `idle` before its
   prompt lands, so **every spawn fabricates a completion for its spawner.**
   Verified live by your ORCH in `~/.tower/board.jsonl`: `worker AGNT
   deposit-core (w3R:p1R) -> idle; spawner w3R:p1Q` at `2026-08-17T01:01:42Z`
   produced a "your worker is done" message about a pane that was `working`,
   seconds old, with no `.done` marker.
   - A completion deposit must carry evidence (CONTRACT §5). **`idle` is not
     evidence.**
   - **Fix the prompt text.** A pane that genuinely goes idle holding a live
     claim is worth surfacing, but as what it is — `worker <name> went idle
     without depositing` — which is a `need-help` signal, **not** a completion.
     `-> idle` and `-> done` must be distinguishable in the board row **and** in
     the delivered prompt text.
4b. **Fix the verifier itself** (DESIGN §3a — CORD's Task 6b). This is the
   defect that makes at-least-once delivery unsafe, so it lands *before* the
   courier starts trusting it.

   `verified_prompt()` (`_spine_common.py:363-398`) waits `--until working`. If
   the target is **already working** there is no transition to observe, the wait
   times out, and it **raises — reporting non-delivery for a delivered
   message.** Your ORCH measured it returning the identical `FAIL` for two
   delivered and two undelivered messages (PROOF.md §0.3): in the
   already-working case its verdict is **uncorrelated with reality**, not merely
   pessimistic.

   Required behavior:
   - **Never raise merely because the target is busy.** "Already working" is a
     **distinct outcome** — a defer — and must not share a return path with a
     genuine delivery failure. A courier that requeues on it produces unbounded
     duplicate delivery concentrated on the busiest panes: amplification in
     place of loss, which is worse, because a lost message is silent while a
     duplicated one costs the receiver a turn every time.
   - **Accept a transcript echo as evidence**, matched on the `deposit_id`
     carried in the delivered text. That is the only way an already-working
     target is verifiable at all.
   - Report the three outcomes distinguishably: **delivered** (flip or echo),
     **deferred** (target busy), **failed** (reachable, attempted, demonstrably
     did not land).

5. **The DOOR, last** (DESIGN §7). Rename `notify()` (`:291`) and
   `verified_prompt()` (`:363`) private and gate them on `SPINE_COURIER=1`,
   which only the courier sets. Called from any other process they **raise**.
   Handlers get `deposit()` and nothing else. This removes the capability rather
   than discouraging its use: a handler physically cannot deliver, so it cannot
   invent a policy about when not to.
6. **Delete** `~/.tower/notify-pace.json`, `~/.tower/field-pull-pace.json`,
   `~/.tower/parent-wake-pace.json`, and confirm nothing recreates them.

### done when

- No handler outside `90-courier` contains pace, coalesce, or drop logic.
- `grep -l 'pace\|coalesc' bin/handlers/[0-9]*` returns only the courier's own
  callers — **report the literal output**, whatever it is.
- `notify()` / `verified_prompt()` raise without the courier's env stamp, proven
  by a **negative test** you ran and pasted.
- All three pace files are gone and stay gone.
- `16-parent-wake`'s outbox behavior is preserved, not regressed.

## TEST-MAKER (`agnt-spine-delivery-test`) — the HOOK

**Touch ONLY:** `test/no-private-delivery.py`.

DESIGN §7 names the path `~/herdr-spine/tests/no-private-delivery.py`. **That
directory does not exist** — the repo has `test/` (shell suites) and
`bin/handlers/tests/` (python). Your ORCH rules it lands at
`~/herdr-spine/test/no-private-delivery.py`, since `test/` is the suite root.
Cosmetic deviation from DESIGN, recorded deliberately.

The hook fails if any file in `bin/handlers/[0-9]*` **other than `90-courier`**:

- references a `*-pace.json` path, **or**
- calls `notify` / `verified_prompt`, **or**
- shells to `herdr … pane send` / `herdr notification show`.

This catches what the DOOR cannot see: a new handler that bypasses
`_spine_common` entirely.

### done when

- The hook exists, is wired into the spine test suite, and is registered in
  `~/agent-core/primitives/rules/ENFORCEMENT.md`.
- **You proved it by breaking it:** plant a deliberate violation, show the hook
  **fails**, then revert and show it passes. Paste both runs. A hook never seen
  to fail is not known to work.
- Report the honest enforcement label as shipped. DESIGN §7 already names the
  residual: a handler could still build a `subprocess.run` argv the patterns
  miss. That is **DOCTRINE**, not closable without sandboxing handler
  subprocesses, and out of scope here. **Say so plainly rather than claiming
  coverage you do not have** — a compilation bug recorded in the queue, not a
  rule to remember harder.
