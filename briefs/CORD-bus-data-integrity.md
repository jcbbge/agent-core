# CORD [bus-data] — Repair the Tower board's data, then prove the writer is fixed

You are the **Coordinator for one narrow lane: the integrity of the Tower board's data
and the write path that produces it.** You read, verify, decompose, brief, and gate. You
do not implement — an ORCH you spawn does the work.

Operator directive, 2026-08-13. Three ordered objectives:

1. **Fix the data.** Recover, repair, or glean as much information as possible out of the
   malformed rows and turn it into new, well-formed rows.
2. **Verify a patch is in place** for the write path that produced them.
3. **If it is not, create and deploy the patch.**

> **"We are live and in production, so tread lightly — this is trying to make mechanical
> repairs to a car while we are driving."** Take that literally. Two other fleets are
> posting to this board *right now*.

---

## Ground truth, measured 2026-08-13 (re-verify before acting; the file grows as you read)

`~/.tower/board.jsonl` — 6,437 lines, 6,411 parse as JSON.

### Finding A — 26 unparseable rows, and they look ALREADY FIXED

Exact line numbers: **1, 2, 3, 553, 2113, 2502, 2504, 2507, 2511, 2513, 2514, 2515, 2516,
2521, 2523, 2525, 2527, 2530, 2542, 2556, 2559, 2569, 2571, 2573, 2574, 2577.**

Two things fall out of that list, and they change the whole shape of the job:

- **The last malformed line is 2577 of 6,437 — roughly 40% through the file. The most
  recent ~3,860 rows are all clean.** That is strong evidence the writer bug was fixed.
- **22 of the 26 fall between lines 2502 and 2577** — a burst, i.e. one incident, not a
  steady drip. Lines 1-3 are separate: non-JSON tool output (`1 matches in 1F:`,
  `[file] 628 (1):`) plus a record truncated mid-field.

Known failure modes: non-JSON text written into the log; unescaped content inside `body`
(line 553); an invalid backslash escape (line 2113); two objects concatenated with no
newline between them (line 2502).

### Finding B — 500 rows carry NO `from` field, and this IS ongoing

Earliest `2026-08-10T23:31:51Z`, **latest `2026-08-13T13:39:01Z` — minutes ago.** By shape:

| shape | count | verdict |
| --- | --- | --- |
| `lineage` | 363 | probably legitimate — a machine emission, not authored mail |
| `verify-gate-bypass` | 91 | probably legitimate — audit record |
| `note` | 34 | **defect** — an authorless note |
| `finding` | 7 | **defect** — an authorless finding |
| `claim` | 3 | **defect** — an authorless claim |
| `done` | 2 | **defect** — an authorless completion |

So this splits cleanly: ~454 rows are a *second legitimate row shape* that consumers
wrongly assume has `from`, and **46 rows are genuine data loss** — a finding, claim, note,
or done with no author cannot be traced to the agent that made the claim, which is the
whole point of the board.

---

## The work

### Objective 1 — fix the data (do this first, and non-destructively)

- **Back up `board.jsonl` before touching a byte.** Copy, verify the copy, then work.
- **Recover, do not discard.** Every one of the 26 is partially readable: a truncated
  record still names its author and topic; two concatenated objects are two recoverable
  objects; an unescaped `body` is recoverable by re-escaping. Reconstruct what the row
  was trying to say and emit a well-formed replacement that **preserves provenance** —
  original line number, what was damaged, what was inferred versus read. A repaired row
  that hides the fact that it was repaired is worse than the damage.
- **Quarantine only what is genuinely unrecoverable**, into a separate file, with the raw
  bytes retained. **The board is the record — nothing is deleted.**
- For the **46 authorless semantic rows**, attribute where the author is recoverable from
  the row's own content, its `cwd`, or an adjacent row in the same topic and second. Where
  it is not recoverable, mark it explicitly unattributed rather than guessing an author.
  **A fabricated author is worse than an honest unknown.**
- Rewriting a live append-only log is the single most dangerous act in this lane. Decide
  and state your approach: in-place rewrite behind a lock and a verified backup, or a
  compaction into a new file with an atomic swap. Prefer whichever loses nothing if it is
  interrupted mid-way, and prove that property before you run it.

### Objective 2 — verify the patch, and beware the trap

The evidence above suggests the writer is already fixed. **Absence of recent corruption is
NOT proof of a fix** — it is equally consistent with the unsafe path simply not having been
exercised since. So verify the *code*, not the silence:

- Find the actual change. Tower's code is now version-controlled at
  `~/agent-core/primitives/mcps/tower/` (landed today at `5e281be`, with follow-on work on
  `spine/w0-swap` and `spine/w0-driftcheck`, and a closeout ORCH that reported into
  `agent-core` around `34011ee`). Read the history and the current writer. Note that
  `~/.tower/` is the copy that actually EXECUTES — a fix present in the repo but not in the
  deployed file is not a fix. Check both, and treat any divergence as a finding.
- The write path must guarantee, provably: a real serializer (never shell-built JSON),
  atomic newline-terminated append, locking against concurrent writers, and rejection of a
  malformed record loudly rather than persisting it.
- **The root cause was a documented instruction**, not just a code bug: the machine-wide
  agent context told any agent without MCP to `echo` a hand-built JSON line straight into
  `board.jsonl`. If that instruction still stands anywhere, the bug is still shipped even
  if the code is perfect. Check the docs as part of the patch.

### Objective 3 — if it is not patched, patch it

Spawn an ORCH and deploy it. Same care: additive, reversible, verified against the live
consumers afterward. Do not take the server down without a stated window.

### Objective 4 — rule on the schema split (this is what makes it a well-oiled machine)

`lineage` and `verify-gate-bypass` rows having no `from` is arguably correct — they are
machine emissions, not authored mail. But **every consumer that assumes `from` exists
breaks on them**, and mine did. Rule it: either those shapes get a synthetic author
(`from: "spine"`, `from: "cursor-shim"`) so one shape holds for all rows, or the schema
formally declares multiple row kinds and **every reader is fixed to handle them**. Either
is defensible; leaving it implicit is not. Write the decision down where a future writer
will find it.

---

## Contract

- **Live production.** An Arc fleet and a Tower fleet are both posting to this board while
  you work. Never take a lock you do not release. Never leave the file in a state where a
  concurrent append lands in the wrong place. Verify live readers (`TOWR` pane, `CTRL`
  panes, `statem`, `fleet-task`, the spine handlers, the MCP server) still work after every
  change.
- **Anything destructive or irreversible comes to the concierge as a ruled proposal** —
  you do not execute it. Rewriting the live board in place is exactly the class of act to
  route rather than assume.
- **Scope discipline.** You own board *data integrity* and its *write path*. You do NOT own
  Tower's plane-by-plane functional proof, retention/rotation, or remodel debris — a
  separate Tower coordinator owns those and has been told to stay off your lane. If you
  find something in their scope, post it to the board and move on.
- Branch first; small PRs; explicit staging. Every unit of work is a **visible pane**; no
  background in-process subagents. Reap what finishes — done = gone.
- Post to board topic `tower/bus-data`. Report per objective: what you changed, what you
  **proved and how**, what you could not recover and why.

## Harness

You are a Cursor fleet — operator's choice, so this side lane does not consume the
Anthropic window. Spawn only through the shim, never `spine-spawn`:
`cursor-fleet orch <slug> --brief <p> --workspace <id>`,
`cursor-fleet make <slug> --brief <p> --workspace <id>` for the enforced
Plan→Implementation bifurcation, `cursor-fleet worker <profile> --brief <p> --workspace
<id> --dir <worktree>`. Defaults are already set: grok for coordinator/orchestrator tiers,
composer for coding and sub agents. Names, roles, and lineage are stamped at birth by the
shim — but the shim stamps generic PROFILE names, so **relabel every pane you spawn with
its real work name** (`herdr pane rename` + `report-metadata --display-agent --token
name=`). A sidebar full of "ORCH orchestrator" is unreadable and the operator has already
called it out.

**One thing to hand upward, not to act on:** those 91 `verify-gate-bypass` rows mean the
Verify beat's break-glass has been used 91 times. That may be entirely legitimate, but it
bears on whether the gate is actually enforced. Post what the rows say — who, when, which
unit — as a finding on `tower/bus-data` and let the concierge carry it to the operator.

SOURCES: per-line JSON parse of `~/.tower/board.jsonl` at 6,437 lines with exact line
numbers and shape counts; `~/agent-core/primitives/mcps/tower/` at `5e281be`; agent-core
git log; `COMMS-ARCH.md`; machine-wide agent context (the hand-built-append instruction) —
all read or run 2026-08-13 by the concierge.
