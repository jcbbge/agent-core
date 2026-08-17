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
| `agnt-stuck-cli` | the **IMPLEMENTER** | `primitives/mcps/tower/cli.mjs` |
| `agnt-stuck-cli-test` | the **TEST-MAKER** | `primitives/mcps/tower/stuck.test.mjs` |

Find your name: `echo $HERDR_PANE_ID` then `herdr pane list`, or read the
`name=` token on your own pane. **If you cannot determine which seat you are,
post a `need-help` finding and stop — do not guess.**

**The law of this fork:** the test agent is NOT the implementation agent;
criteria come BEFORE code. **Do not read the other seat's work, and do not do
the other seat's job.**

## Shared subject matter (both seats)

Two new CLI verbs on `cli.mjs`, per CONTRACT §8 and DESIGN §4.

A parallel unit is building `deposit.mjs` in a worktree you cannot see. **Code
and test against the pinned surface in CONTRACT §7** — it may not exist on disk
yet. That is expected.

**The queue logic is NOT yours.** `cli.mjs` parses, calls `deposit.mjs`,
formats, and sets an exit code. If a function you need is missing from CONTRACT
§7, post a finding and ask — **do not add a private copy.** Two implementations
of this queue is the exact failure this whole unit exists to remove.

---

## IF YOU ARE THE IMPLEMENTER (`agnt-stuck-cli`)

**Touch ONLY:** `primitives/mcps/tower/cli.mjs`.

Add two verbs to the `if (cmd === ...)` chain (starts at `cli.mjs:111`) and
update the usage string (`cli.mjs:316`). Follow the existing `post` (`:153`) and
`emit` (`:188`) verbs for flag-parsing and usage-string style.

### 1. `deposit` (CONTRACT §8)

```
bun ~/.tower/cli.mjs deposit <to> <kind> "<body>" --from <name>
        [--ref <id>] [--ttl <seconds>]
        [--evidence-status <s>] [--evidence-done-marker <path>]
        [--evidence-work-done-ref <id>] [--evidence-verdict <token>]
```

Prints the receipt as one JSON line. **Exit 0 accepted, exit 1 refused.** A
refusal is not an error to hide — it is the product. Print the reason.

This is the seam the python handler binding shells to, so argument parsing and
exit codes are load-bearing.

### 2. `stuck` (DESIGN §4)

One line per non-empty inbox: **addressee** (round-tripped through
`unslugAddressee` back to the real URI, never the raw slug), **engine
liveness**, **queued count**, **oldest age**, **attempts**, **next attempt**,
**last error**. Then the dead-letter tail with reasons.

- **Exit 0** nothing owed past threshold; **exit 1** something is stuck. The
  non-zero exit is what makes it composable with `latch` and gateable by a hook
  rather than something a human must read.
- **Incapable of silence:** on an empty queue print `nothing owed`. It must
  **never** print nothing — a command that prints nothing is indistinguishable
  from a command that is broken, which is the failure mode this entire unit is
  about.
- An inbox whose addressee has no live engine and no successor prints as
  `stranded`. Liveness for a `pane:` addressee resolves against the live pane
  list; a pane id that is gone is dead, not merely quiet.

### done when

- Both verbs work end to end against a real `TOWER_HOME` temp dir with real
  files, driven from the shell, with the real output pasted.
- `stuck` demonstrates **both** exit codes from the shell.
- `stuck` prints `nothing owed` on an empty queue — demonstrated.
- `deposit` demonstrates exit 0 on accept and exit 1 on refusal, including a
  `no-completion-evidence: idle is not done` refusal.
- The usage string lists both new verbs.
- **No queue logic lives in `cli.mjs`.**

### Report back with

- The literal shell transcript of each demonstration, including `echo $?` codes.
- The exact usage string as shipped.
- Any pinned name in CONTRACT §7 that was missing or wrong, and the finding you
  posted.

---

## IF YOU ARE THE TEST-MAKER (`agnt-stuck-cli-test`)

**Touch ONLY:** `primitives/mcps/tower/stuck.test.mjs`.

You are the **acceptance authority** for the CLI verbs. Write from `DESIGN.md`
§4 and `CONTRACT.md` §8 **only**. The implementation is in a worktree you cannot
see. **A test that passes because you weakened it to match code you peeked at is
worse than no test.** Failing right now is expected and correct.

### Prove

- One line per non-empty inbox carrying **all seven** fields: addressee, engine
  liveness, queued count, oldest age, attempts, next attempt, last error.
- The addressee **round-trips** through the slug back to its original URI — a
  test that would fail if someone swapped in a lossy or hashed slug.
- `nothing owed` is printed on an empty queue. **Assert it is incapable of
  silence** — empty stdout is a failure, not a pass.
- **Exit 0** when nothing is stuck, **exit 1** when something is. Assert both,
  by exit code, not by output text.
- An orphaned inbox (no live engine, no successor) reports as `stranded`.
- `deposit` exits 0 on accept and 1 on refusal, and prints a parseable receipt
  JSON line carrying `deposit_id`, `accepted`, `reason`.
- A `completion` deposit whose only evidence is `status=idle` is refused through
  the CLI with exit 1 and reason `no-completion-evidence: idle is not done`.

### Rules for your tests

- **NO MOCKS.** Drive the real CLI as a subprocess against a real `TOWER_HOME`
  temp dir; assert real exit codes and real stdout. Never touch live `~/.tower`.
- Read `cli.test.mjs` first and match its style and runner. **Do not invent a
  new test runner.**
- Deterministic. No sleeps as synchronisation.

### done when

- `stuck.test.mjs` exists, runs under the existing runner, and is honest about
  the current state of the tree.
- Every item above has a test that would actually catch its violation, and you
  can name the mutation each detects.
- No test inspects the implementer's work to decide what to assert.

### Report back with

- Test names mapped to the items above.
- The exact mutation the `nothing owed` and exit-code tests detect.
- The literal pass/fail output of your run, whatever it is. Report failures
  faithfully.
- Any criterion untestable as written, with a board finding.
