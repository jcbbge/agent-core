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

# YOUR TASK — W1, the deposit primitive

Registration name: `agnt-deposit-core`. Human name: `AGNT deposit-core`.

## Your file partition — these files and no others

**Touch ONLY:** `primitives/mcps/tower/deposit.mjs`, `primitives/mcps/tower/lib.mjs`.

- `~/agent-core/primitives/mcps/tower/deposit.mjs` — **NEW. Yours alone.**
- `~/agent-core/primitives/mcps/tower/lib.mjs` — **one added re-export line
  only.** Nothing else in this file.

**You do NOT write tests.** A different worker (`AGNT deposit-criteria`) is
authoring the acceptance tests from the same CONTRACT, in parallel, right now.
That separation is deliberate: the party writing acceptance criteria is not the
party writing the implementation. Do not create `deposit.test.mjs` — you will
collide with them. Do not read their tests and code to them.

**You do NOT touch `cli.mjs`** — `AGNT stuck-cli` owns it.

## Build

Implement DESIGN.md §3 and §6a, to the exact surface pinned in CONTRACT.md §7.

1. **Addressing** (CONTRACT §2) — the four schemes, the pinned reversible slug
   functions, `inboxPath()`.
2. **`deposit()`** (CONTRACT §4) — every refusal in the table, with the **exact**
   reason string, each returning a receipt **and** writing a dead-letter row.
3. **Completion evidence** (CONTRACT §5, DESIGN §6a) — this is the fix for a
   live fabrication bug: `16-parent-wake:165` treats `idle` as `done` and sends a
   prompt hardcoded "is done", so **every spawn fabricates a completion for its
   spawner**. Verified in `~/.tower/board.jsonl`: at `2026-08-17T00:50:51Z`,
   `worker ORCH deposit-courier (w3R:p1Q) -> idle` produced a "your worker is
   done" message 10 seconds after that pane was born, while it was `working`
   with nothing produced. Your door is what makes that refusable. `"idle"` is
   **not** evidence.
4. **Append-only queue folded by `deposit_id`** (CONTRACT §3) — every state
   change appends; current state is the last row for that id. Do not rewrite
   files in place.
5. **Retry / TTL / pacing** (CONTRACT §6) — backoff, `MAX_ATTEMPTS`, dead-letter
   on exhaustion and on TTL.

> **The invariant your code is judged on: pacing writes a future time, never a
> terminal state.** `paceGate()` returns a decision; it must be impossible for a
> pace result to be the last thing that happens to a message. If that one
> sentence holds, the 32.1% loss cannot recur, and it stays checkable by reading
> one function instead of auditing every handler.

## done when

- `deposit.mjs` exports **every** name in CONTRACT.md §7 with the pinned
  signature, and `lib.mjs` re-exports it.
- Every refusal in CONTRACT §4 returns a receipt AND writes a dead-letter row
  with that exact non-empty reason string.
- Coalescing support exists at the API level: all due items for one addressee are
  retrievable in one call (`dueItems`) so the courier can name every one of them
  in a single prompt. **Content is never summarised or truncated.**
- No path in your code can leave a message neither owed nor dead-lettered.
- `node --check` / import-clean: `bun -e "import('/Users/jrg/agent-core/primitives/mcps/tower/deposit.mjs').then(m=>console.log(Object.keys(m).join(',')))"` prints the full export list.
- You have run the code against a `TOWER_HOME` temp dir at least once and
  observed real rows in a real `inbox.jsonl` and a real `dead-letter.jsonl`.

## Report back with (post to the board topic, then write `.done`)

- The literal export list your module produces.
- The literal contents of one `inbox.jsonl` row and one refused `dead-letter.jsonl`
  row from your own real run, with the `TOWER_HOME` you used.
- Any CONTRACT or DESIGN item you found wrong, and what you found instead.
- Anything you could not close, named plainly.
