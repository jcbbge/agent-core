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

`spine-spawn make` forked this unit into an **implementer** and a
**test-maker**, in separate git worktrees with **no cross-sight**. You are one
of them. Your herdr registration name tells you which:

| Registration name | You are | You write |
|---|---|---|
| `agnt-deposit-core` | the **IMPLEMENTER** | `primitives/mcps/tower/deposit.mjs`, `primitives/mcps/tower/lib.mjs` |
| `agnt-deposit-core-test` | the **TEST-MAKER** | `primitives/mcps/tower/deposit.test.mjs` |

Find your name: `echo $HERDR_PANE_ID` then `herdr pane list`, or read the
`name=` token on your own pane. **If you cannot determine which seat you are,
post a `need-help` finding and stop — do not guess.**

**The law of this fork:** the test agent is NOT the implementation agent;
criteria come BEFORE code. **Do not read the other seat's work, and do not do
the other seat's job.** If you are the test-maker, the implementation may not
exist yet. That is correct, not a blocker.

## Shared subject matter (both seats)

Implement/verify DESIGN.md §3 and §6a to the surface pinned in CONTRACT.md §7.
The deposit primitive is the single delivery door: `deposit()` accepts or
refuses, and a refusal always leaves a receipt AND a `dead-letter.jsonl` row
with a non-empty reason. **There is no return path meaning "silently didn't
happen."**

> **THE INVARIANT THIS UNIT IS JUDGED ON (DESIGN §3): pacing writes a future
> time, never a terminal state.** A paced message stays `queued` and still owed,
> with `next_attempt_at` pushed forward. If that one sentence holds, the 32.1%
> loss cannot recur — and it stays checkable by reading one function instead of
> auditing every handler.

### The live fabrication bug you are fixing (DESIGN §6a)

`16-parent-wake:165` reads `if status not in ("done", "idle")` and then sends a
prompt hardcoded `"your worker <name> is done"`. A freshly spawned pane passes
through `idle` before its prompt lands, so **every spawn fabricates a completion
for its spawner.** Verified by your ORCH in `~/.tower/board.jsonl`:

```
2026-08-17T00:50:51Z note spine-daemon
  worker ORCH deposit-courier (w3R:p1Q) -> idle; spawner w3R:p1P
```

That row produced a "your worker is done" message about pane `w3R:p1Q` ten
seconds after it was born, while it was `working` with nothing produced. It
happened to this unit's own ORCH and to CORD's own spawn.

The door you are building is what makes that refusable: `kind: "completion"`
requires evidence per CONTRACT §5, and **`"idle"` is not evidence.**

---

## IF YOU ARE THE IMPLEMENTER (`agnt-deposit-core`)

**Touch ONLY:** `primitives/mcps/tower/deposit.mjs`, `primitives/mcps/tower/lib.mjs`.

Do **not** create `deposit.test.mjs` — the test-maker owns it and is authoring
it right now from the same CONTRACT. Do **not** touch `cli.mjs` — a different
unit owns it.

### Build

1. **Addressing** (CONTRACT §2) — four schemes, the pinned reversible slug
   functions, `inboxPath()`.
2. **`deposit()`** (CONTRACT §4) — every refusal with its **exact** reason
   string, each returning a receipt and writing a dead-letter row.
3. **Completion evidence** (CONTRACT §5) — the §6a fix above.
4. **Append-only queue folded by `deposit_id`** (CONTRACT §3) — every state
   change appends; current state is the last row for that id. Never rewrite a
   file in place.
5. **Retry / TTL / pacing** (CONTRACT §6) — backoff, `MAX_ATTEMPTS`,
   dead-letter on exhaustion and on TTL expiry.

### done when

- `deposit.mjs` exports **every** name in CONTRACT §7 with the pinned signature;
  `lib.mjs` re-exports it.
- Every refusal in CONTRACT §4 returns a receipt AND writes a dead-letter row
  with that exact non-empty reason.
- All due items for one addressee are retrievable in one call (`dueItems`) so
  the courier can name every one in a single prompt. **Content is never
  summarised or truncated.**
- No code path can leave a message neither owed nor dead-lettered.
- `bun -e "import('/Users/jrg/agent-core/primitives/mcps/tower/deposit.mjs').then(m=>console.log(Object.keys(m).sort().join(',')))"` prints the full export list.
- You ran it against a `TOWER_HOME` temp dir and saw real rows in a real
  `inbox.jsonl` and a real `dead-letter.jsonl`.

### Report back with

- The literal export list your module produces.
- One real `inbox.jsonl` row and one real refused `dead-letter.jsonl` row from
  your own run, with the `TOWER_HOME` you used.
- Any CONTRACT or DESIGN item that was wrong, and what you found instead.
- Anything you could not close, named plainly.

---

## IF YOU ARE THE TEST-MAKER (`agnt-deposit-core-test`)

**Touch ONLY:** `primitives/mcps/tower/deposit.test.mjs`.

You are the **acceptance authority**. Write your tests from `DESIGN.md` and
`CONTRACT.md` **only**. The implementation is being built in a worktree you
cannot see, and you must not go looking for it. **A test that passes because you
weakened it to match code you peeked at is worse than no test.** Your tests
failing right now is the expected and correct result.

### Prove — DESIGN §3 done-when (a)-(f), plus §6a

- **(a)** A burst of deposits to one addressee **loses nothing** — deposit N
  rapidly, fold the inbox, get exactly N distinct `deposit_id`s.
- **(b)** A deposit to an addressee with **no live engine queues rather than
  drops** — the row is `queued` and still owed.
- **(c)** A delivery failure **requeues with backoff** — `attempts` increments,
  `next_attempt_at` advances per `min(2**attempts, 300)s`.
- **(d)** Undeliverable-after-policy lands in `dead-letter.jsonl` with a
  **non-empty** reason — cover both `MAX_ATTEMPTS` exhaustion and `ttl-expired`.
- **(e)** Pacing **bounds interruption frequency and never produces a terminal
  state.** Prove that after a pace refusal the message is still `queued` and
  still owed with `next_attempt_at` in the future, and that **no sequence of
  pace decisions can make a message cease to be owed.** This is the invariant
  that kills the bug class — make this test the sharpest one you write.
- **(f)** **Every** refusal category in CONTRACT §4's table returns a receipt and
  writes a dead-letter row with that **exact** reason string. Table-drive it; a
  missing row is a hole in the guarantee.
- **§6a** — `kind: "completion"` carrying `evidence.status === "idle"` and
  nothing else is refused with exactly
  `no-completion-evidence: idle is not done`. Each of the four evidence forms in
  CONTRACT §5 individually **accepts**.

### Rules for your tests

- **NO MOCKS.** Real files, real appends, real `dead-letter.jsonl`, under a
  per-test `TOWER_HOME` temp dir (`tower-ledger.mjs:41` honors it). Never touch
  live `~/.tower` state. Clean up your temp dirs.
- Read `dead-letter.test.mjs` and `jsonl-integrity.test.mjs` first and match
  their style and runner. **Do not invent a new test runner.**
- Assert the **exact** pinned reason strings — not a substring, not a regex that
  would pass on a near-miss.
- Deterministic. No sleeps as synchronisation.

### done when

- `deposit.test.mjs` exists, runs under the existing runner, and is **honest
  about the current state of the tree**.
- Every item above has a test that would **actually catch** its violation, and
  for each you can name the mutation it detects.
- No test imports or inspects the implementer's work to decide what to assert.

### Report back with

- Test names mapped one-to-one to (a)-(f) and §6a.
- For (e) and §6a specifically: the exact mutation each test detects.
- The literal pass/fail output of your run, whatever it is. **Report failures
  faithfully** — failing now is expected.
- Any criterion you found untestable as written, named plainly, with a board
  finding.
