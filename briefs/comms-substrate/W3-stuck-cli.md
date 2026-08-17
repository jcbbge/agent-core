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

# YOUR TASK — W3, the CLI verbs

Registration name: `agnt-stuck-cli`. Human name: `AGNT stuck-cli`.

## Your file partition — this file and no other

**Touch ONLY:** `primitives/mcps/tower/cli.mjs`.

- `~/agent-core/primitives/mcps/tower/cli.mjs` — **yours alone.**

**You do NOT write tests.** `AGNT deposit-criteria` is authoring `stuck.test.mjs`
from the same CONTRACT, in parallel, right now. Do not create it.

**You do NOT touch `deposit.mjs`** — `AGNT deposit-core` owns it and is building
it in parallel. **Import from it; do not implement queue logic yourself.** If a
function you need is missing from CONTRACT §7's pinned surface, post a finding
and ask — do not add a private copy. Two implementations of this queue is the
exact failure this unit exists to remove.

Your code may land before `deposit.mjs` exists. That is fine — code against the
pinned surface in CONTRACT §7.

## Build

Add two verbs to the `if (cmd === ...)` chain (starts at `cli.mjs:111`) and
update the usage string (`cli.mjs:316`).

### 1. `deposit` (CONTRACT §8)

```
bun ~/.tower/cli.mjs deposit <to> <kind> "<body>" --from <name>
        [--ref <id>] [--ttl <seconds>]
        [--evidence-status <s>] [--evidence-done-marker <path>]
        [--evidence-work-done-ref <id>] [--evidence-verdict <token>]
```

Prints the receipt as one JSON line. **Exit 0 accepted, exit 1 refused.** A
refusal is not an error to hide — it is the product. Print the reason.

This verb is the seam the python handler binding shells to, so its argument
parsing and exit codes are load-bearing. Follow the existing `post` and `emit`
verbs (`cli.mjs:153`, `:188`) for flag-parsing style and usage-string form.

### 2. `stuck` (DESIGN §4, CONTRACT §8)

One line per non-empty inbox: **addressee** (round-tripped through
`unslugAddressee` back to the real URI, not the slug), **engine liveness**,
**queued count**, **oldest age**, **attempts**, **next attempt**, **last
error**. Then the dead-letter tail with reasons.

- **Exit 0** nothing owed past threshold; **exit 1** something is stuck. The
  non-zero exit is what makes it composable with `latch` and gateable by a hook,
  rather than something a human has to read.
- **Incapable of silence:** on an empty queue it prints `nothing owed`. It must
  **never** print nothing. A command that prints nothing is indistinguishable
  from a command that is broken — which is the failure mode this whole unit is
  about.
- An inbox whose addressee has no live engine and no successor prints as
  `stranded`. Engine liveness for a `pane:` addressee is resolved against the
  live pane list; a pane id that is gone is dead, not merely quiet.

## done when

- Both verbs work end to end against a real `TOWER_HOME` temp dir with real
  files, driven from the shell, and you have pasted the real output.
- `stuck` exits 0/1 correctly — demonstrate **both** exit codes from the shell.
- `stuck` prints `nothing owed` on an empty queue — demonstrate it.
- `deposit` exits 0 on accept and 1 on refusal — demonstrate **both**, including
  a `no-completion-evidence: idle is not done` refusal.
- The usage string at `cli.mjs:316` lists both new verbs.
- No queue logic is implemented in `cli.mjs`. It parses, calls `deposit.mjs`,
  formats, and sets an exit code.

## Report back with (post to the board topic, then write `.done`)

- The literal shell transcript of each demonstration above, including the
  `echo $?` exit codes.
- The exact usage string as shipped.
- Any pinned name in CONTRACT §7 that was missing or wrong for your needs, and
  the finding you posted about it.
