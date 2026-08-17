# AGNT — the spine-* binaries: off the old bus, including the spawn door

Your partition is `~/herdr-spine/bin/spine-*`. Nothing else. **One of your eight
files is the door every agent in this fleet is spawned through — read BLAST RADIUS
twice.**

---

## SHARED PREFIX — identical in all three sibling briefs of unit 1

Parent: `orch-tower-spine` (unit 1 of the tower cutover). This brief is
self-contained and binding. Where it differs from anything else you read — the
CORD brief, the ORCH brief, a comment in the code — **this brief wins**.

You have two path-disjoint siblings running **right now** against the same repo,
in their own worktrees:
- `agnt-spine-handlers` → `~/herdr-spine/bin/handlers/**`
- `agnt-spine-bins` → `~/herdr-spine/bin/spine-*`
- `agnt-spine-hooks` → `~/herdr-spine/cc-hooks/**` and `~/herdr-spine/install.sh`

If your work needs a change in a sibling's partition, **post a finding, do not
edit it.** The orchestrator integrates; you never merge to main.

### The ruling

**There is no MCP server.** The new bus is CLI + module only. `mcp__tower__*` tool
names cease to exist. Do not port `server.mjs`. **Add no dependency** — "i dont
want another fucking dependency" is the operator's literal instruction, and it is
why the new bus exists at all.

A file removed because its reason for existing is gone is a **correct outcome**.
Say so explicitly in your report rather than porting dead code into the new world.

### The new bus — every fact here was run by the orchestrator on 2026-08-17

- `~/agent-core/primitives/tower/tower.mjs` — the whole bus, zero dependencies.
  Exports, verified by `grep -n '^export' primitives/tower/tower.mjs`: `open()`,
  `send(db,m)`, `inbox(db,consumer,limit)`, `cursorOf(db,consumer)`,
  `ack(db,consumer,id)`, `log(db,{topic,recipient,limit})`, `resolvePane(name)`,
  `wake(db,name)`.
- `node primitives/tower/tower.test.mjs` → **14 passed, 0 failed**.
- CLI on PATH at `~/.local/bin/tower`. `tower stat` prints the db path, the
  message count, and one line per consumer cursor. Verbs — **the entire surface**:
  `tower send --from <who> [--to <agent>] [--topic <t>] [--kind <k>] [--dedup <key>] [--reply-to <id>] [--wake] <body>` ·
  `tower inbox <consumer> [--limit N] [--json]` · `tower ack <consumer> <id>` ·
  `tower wake <agent>` · `tower log [--topic t] [--to agent] [--limit N] [--json]` ·
  `tower stat`
- Env overrides, verified at `tower.mjs:45-47`: `TOWER_HOME` (default `~/.tower`),
  `TOWER_DB` (default `$TOWER_HOME/tower.db`), `SPINE_SPAWN`.
- Schema, two tables. `msg(id,ts,sender,recipient,topic,kind,body,reply_to,dedup
  UNIQUE)` is **append-only** — no statement in `tower.mjs` updates or deletes a
  row. `cursor(consumer,acked_id,updated)` is the only mutable table. Unread is
  computed as `id > acked_id`. `ts` is **milliseconds**. `recipient IS NULL` means
  broadcast. `kind` is one of `note|finding|deliverable|question|answer|alert`.
- **A new consumer starts at 0, never at latest** (`cursorOf`, `tower.mjs:192`):
  an agent that has never run reads the log from the beginning rather than
  skipping to the end.
- Delivery is **at-least-once**. `--dedup` makes a retry free: a dedup collision
  returns the existing id instead of raising, so callers may retry blindly.
- `ack` is monotonic (`tower.mjs:200`) — it can never rewind.

**Three fixed bugs nobody on this unit may reintroduce.** Read `openDb()` at
`primitives/tower/tower.mjs:53` and `withRetry()` at `:101` before you touch bus
code:
1. `journal_mode` must be **read before it is written** — writing takes a brief
   exclusive lock, and concurrent cold starts collide on it. Measured in the
   comment at `tower.mjs:82-87`: **157/160 with the unconditional pragma, 240/240
   without it.**
2. `busy_timeout` is set **per connection**, unconditionally and first — never
   once globally, never folded into a multi-statement schema blob where some exec
   paths silently skip it.
3. Retrying `SQLITE_BUSY` is **the bus's job, not the caller's** — 8 tries, 20ms
   backoff doubling to a 1000ms ceiling.

You do not reimplement any of that. Call the client.

### Runtime facts

- `python3` is **3.9.6** (system python). Target 3.9 — no `match`, no runtime
  `X | Y` unions. `sqlite3` is stdlib, lib version **3.51.0**.
- `node -v` → v25.9.0. `bun -v` → 1.3.14.
- SQLite reaches every runtime this fleet uses with **zero dependencies**. Bun's
  `node:sqlite` imports but exports nothing; `tower.mjs` feature-detects around
  it. **Do not "fix" that by adding a driver.**

### Repo state — corrected against the CORD brief, verified this session

- `git -C ~/herdr-spine status --short` → **empty. The tree is CLEAN**, HEAD
  `aaebe31`. The CORD brief describes a dirty tree with `bin/handlers/90-courier`
  and `test/no-private-delivery.py`; **neither file exists.** There is no
  abandoned courier work to keep or revert. If you see otherwise, stop and report
  it — someone else is writing in your repo.
- Branch `spine/spine-delivery-test` does **not** exist. `e5e1bd8` is a dangling
  commit reachable only by SHA (`git show e5e1bd8:test/no-private-delivery.py`).
  Do not build on it without saying so.
- `~/agent-core/primitives/rules/two-queues.md` does **not** exist — added in
  `7902624`, reverted in `5ed725e`. Any instruction citing it is uncitable.
- Backup exists: `~/.tower-backup-20260816-204214.tar.gz` (5.7 MB, 1630 entries,
  verified readable). Nothing in `~/.tower/` is unrecoverable.

### BLAST RADIUS — read this before your first edit

`~/.tower/tower.db` is the **live** bus. Five agent panes on this machine are
reading and writing it right now, including the orchestrator waiting on you and
the coordinator above them. **Never point a test at it.** Every test sets
`TOWER_HOME` to a fresh `mktemp -d`. If you are unsure whether a command touches
the live DB, run `tower stat` first and read which path it prints.

`~/herdr-spine/bin/spine-spawn` is the door **every agent in this fleet is spawned
through**, including you and your siblings. `~/herdr-spine/bin/handlers/**` are
live event handlers with a **5s per-handler dispatcher budget**. You are working
in a worktree, so `main`'s copies stay intact while you edit — **keep it that
way.** Do not install anything into `~/.claude/`, `~/.tower/`, or any deployed
path; do not run `install.sh`; do not run `bun install` or `npm install` from a
worktree (it can corrupt the shared repo's `core.hooksPath`).

### Standing rules

- **Evidence before assertion.** Every claim in your report cites a command you
  ran this session. `UNKNOWN` is a complete answer. A task is not done because it
  was attempted — it is done when its done-when condition was **run** and
  **passed**, and you read the output.
- **Do not bypass** `credential-guard`, the grounding hook, the write-gate, or the
  spawn-door. A refusal is information. If the grounding hook blocks a second
  write to a file, **Read the file first** — the read comes before the retry, not
  after the refusal. Compose consecutive edits to one file into a single call.
- Stage explicitly. **Never `git add -A`.**
- Commit convention per `AGENTS.md` (PHASE/DONE/TODO/BLOCKED, Co-Authored-By).
  Commit on your own branch. **Do not merge to main** — the orchestrator
  integrates and commits the unit.
- Push on green to `jcbbge` remotes only.

### Tower

Report per task, not per session:
```
tower send --from <your-registration> --to orch-tower-spine \
  --kind finding --topic tower/cutover "<body>"
```
Body carries: what landed · the exact command that proves it · what you left open.
Post a CLAIM when you start, findings as you go, and read your own inbox before
going idle: `tower inbox <your-registration>`.

Two acceptable stopping states, and only two: every done-condition met, or a
posted blocked/`need-help` naming what is needed and who owns it, **after** you
have finished everything not dependent on it. "Reported and awaited instruction"
is not a stopping state.

---

## END SHARED PREFIX — your partition begins here

You are `agnt-spine-bins`.

## The python client you call

`~/agent-core/primitives/tower/tower.py` — stdlib `sqlite3` only, written by
`agnt-tower-py` and verified by the orchestrator before you were spawned. Its
public API, and the exact import line that works from a `bin/spine-*` script, are
pasted below by the orchestrator at dispatch:

**CLIENT API — verified by the orchestrator on 2026-08-17**, against
`~/agent-core/primitives/tower/tower.py` as merged to agent-core main at `b44d81e`.

`import tower` **does not work bare** — verified: from `/tmp`, `python3 -c "import
tower"` is `ModuleNotFoundError`. There is no deploy step and no `pip install`.
Every caller uses this preamble, which the orchestrator ran from `/tmp` with no
`PYTHONPATH` set:

```python
import os, sys
sys.path.insert(0, os.path.expanduser("~/agent-core/primitives/tower"))
import tower
```
→ `preamble ok: /Users/jrg/agent-core/primitives/tower/tower.py`

Signatures, from `inspect.signature`:
```
open()                                    # honours TOWER_HOME, then TOWER_DB (TOWER_DB wins)
send(db, sender=None, body=None, recipient=None, topic=None,
     kind='note', reply_to=None, dedup=None)
inbox(db, consumer, limit=100)
cursor_of(db, consumer)                   # snake_case; tower.mjs spells it cursorOf
ack(db, consumer, id)
log(db, topic=None, recipient=None, limit=50)
```
- `send` returns a **plain dict**: `{'id': 74, 'duplicate': False}`.
- `inbox`/`log` return **a list of plain dicts** with exactly the `msg` columns:
  `{'id','ts','sender','recipient','topic','kind','body','reply_to','dedup'}`.
  `ts` is an integer in **milliseconds**.
- **`wake` and `resolve_pane` do not exist** in the python client, deliberately —
  they shell out to `shepherd` and were left to the node side. If your file needs
  to wake a pane, shell out to the `tower wake <agent>` CLI and say so in your
  report; **do not write your own resolver.**
- `tower.Path` appears in `dir(tower)` — that is a leaked `pathlib` import, not
  API. Do not use it.

Suite status at dispatch: `python3 -m unittest test_tower` from
`primitives/tower/` → **Ran 50 tests, OK**, and python's `sqlite_master` is now
byte-identical to the node CLI's (orchestrator-verified with `diff`). You are
building on a green client.

Your three **bash** scripts have no module option and must shell out to the
`tower` CLI. That is correct for them: they are invoked once per human-scale
action, not per event. Only the python binaries should import.

## THE SPAWN DOOR — the law for this partition

`bin/spine-spawn` is 1556 lines and is how the coordinator, the orchestrator, your
two siblings, and every future worker come into existence. If you break it, the
cutover cannot dispatch and nobody can spawn a replacement to fix it.

**Never leave `spine-spawn` broken between edits.** After **any** change to it,
immediately run all four and confirm **exit 0**:
```
spine-spawn --help ; echo $?
spine-spawn orch --help ; echo $?
spine-spawn worker --help ; echo $?
spine-spawn make --help ; echo $?
```
(Run them against **your worktree's copy**, by path — not the installed one on
`PATH`, which belongs to the live fleet.)

Do not batch a `spine-spawn` edit with an untested change to anything it imports.
Change the dependency, prove it in isolation, and only then touch the caller.
`spine-spawn` does **not** import `_spine_common.py` — verified; it carries its
own inline ledger writer at `:789` (`_LEDGER_PATH`) with `_tower_id()` mirroring
`tower-ledger.mjs`'s `t-<base36 ms>-<4 base36 rand>` id scheme. That inline writer
is yours to port.

`spine-spawn` also enforces a **verify gate** — it refuses an implementation spawn
when no test criteria are authored for the unit, with the law *"the test agent is
NOT the implementation agent; criteria come BEFORE code."* Your port must not
weaken, disable, or route around that gate. If your change makes the gate's
refusal path unreachable, that is a regression; say so.

## Your eight files — verified by grep and `head -1` on 2026-08-17

| file | lines | lang | hits | what the hits are |
|---|---|---|---|---|
| `bin/spine-spawn` | 1556 | python3 | 2 (713, 789) | `:713` normCwd semantics comment; `:789` inline `_LEDGER_PATH` writer |
| `bin/spine-inbox` | 693 | python3 | 2 (34, 175) | reads ledger tail, last 500 lines / 512KB max |
| `bin/spine-greeting` | 607 | python3 | 2 (53, 55) | `BOARD_FILE`, parses board in file order (`:271`) |
| `bin/spine-fleet` | 459 | python3 | 6 (9,14,47,79,122,238) | `LEDGER` at `:47`; mirrors `scanProjects()`/`inboxState()` from the **deleted** `cli.mjs`/`lib.mjs` |
| `bin/spine-claim` | 268 | bash | 2 (22, 37) | `BOARD_PATH="${SPINE_BOARD_PATH:-$HOME/.tower/board.jsonl}"` |
| `bin/spine-wave` | 149 | python3 | 2 (25, 31) | `TOWER_BOARD`, reads CLAIM lines by topic |
| `bin/spine-workspace` | 68 | bash | 1 (15) | `CLI="$HOME/.tower/cli.mjs"`; posts `bun "$CLI" post note house/workspaces "$1" --from "$FROM"` |
| `bin/spine-ruling` | 41 | bash | 1 (15) | same `CLI` shape |

**`spine-workspace` and `spine-ruling` are near-trivial** — a single `bun "$CLI"
post note <topic> <body> --from <who>` becomes
`tower send --from "$FROM" --topic <topic> --kind note "<body>"`. Note the
existing calls end in `>/dev/null 2>&1 || true`: **posting is best-effort and must
stay best-effort.** A bus failure must never fail a workspace create/close.

**`spine-fleet` is the hard one.** Six of its hits are comments claiming parity
with `scanProjects()` in `~/.tower/cli.mjs` and `inboxState()` in
`~/.tower/lib.mjs` — **files that are being deleted.** You cannot preserve parity
with a file that will not exist. Derive its TRAFFIC pane (`:14` — "unrelayed"
ledger entries) from the new bus's own primitives: unread is `id > acked_id`, so
"unrelayed" is a cursor question now, and `tower stat` already prints exactly that
per consumer. Say in your report what the new definition of "unrelayed" is, and
whether it is equivalent to the old one or merely analogous. **If it is only
analogous, say so** — a silently changed definition in a fleet dashboard is how
people stop trusting the dashboard.

**`spine-inbox` reads a bounded tail** (last 500 lines / 512KB, `:34`) — that
bound existed because the ledger was an unbounded append-only file. `tower inbox`
takes `--limit`. Preserve a bound; do not replace it with an unbounded query.

**`spine-claim` and `spine-wave` are a pair** — claims are written by
`spine-claim` (bash, board.jsonl) and read by `spine-wave` (python, CLAIM lines
filtered by topic). Port them **together and consistently**: a claim written in
one shape and read in another is a silent no-op, and this cutover exists because
32.1% of completions died in exactly that kind of gap. Prove the round trip:
write a claim with the ported `spine-claim`, read it back with the ported
`spine-wave`, in a temp `TOWER_HOME`.

`SPINE_BOARD_PATH` was the test-redirect env var. Its replacement is
`TOWER_HOME`/`TOWER_DB`. Make sure the redirect still works, and prove it — a test
that silently writes to the real bus is worse than no test.

## Tasks

### Task 1 — the two bash one-liners: `spine-workspace`, `spine-ruling`
Smallest blast radius, do them first to shake out the CLI's shape.
- **Done when:** both scripts run end to end against a temp `TOWER_HOME`, the
  message appears in `tower log --topic house/workspaces`, and posting failure
  still exits 0 (prove the best-effort property by pointing at an unwritable
  `TOWER_HOME`). Paste the output.

### Task 2 — `spine-claim` + `spine-wave` as one pair
- **Done when:** the claim round trip passes in a temp `TOWER_HOME` — write with
  `spine-claim`, read with `spine-wave`, claim found by topic. Paste it.

### Task 3 — `spine-inbox`, `spine-greeting`, `spine-fleet`
- **Done when:** each runs without error against a temp `TOWER_HOME` containing
  seeded messages and produces output you have **read and checked**, not merely
  observed to be non-empty. Paste each invocation and its output. For
  `spine-fleet`, state the new definition of "unrelayed" and whether it is
  equivalent or analogous.

### Task 4 — `spine-spawn`, last and alone
- **Done when:** the inline ledger writer at `:789` is ported, **and** the four
  `--help` invocations above all exit 0, **and** the verify gate still refuses an
  ungated implementation spawn (prove it — a refusal you triggered on purpose is
  the evidence). Paste all of it.
- **Do not** perform a live end-to-end spawn from your worktree. The orchestrator
  runs that after integration, against the merged tree. Say in your report that
  you left it to the gate-holder.

### Task 5 — the partition grep
- **Done when:** `grep -rIn 'mcps/tower\|\.tower/cli\.mjs\|\.tower/lib\.mjs\|mcp__tower\|board\.jsonl\|ledger\.jsonl' bin/spine-*`
  returns **zero hits**. Paste it. Comments count — a comment claiming parity with
  a deleted file is stale documentation, which is the failure mode this whole
  cutover is cleaning up.

## Touch ONLY

- `~/herdr-spine/bin/spine-*` (the eight files above)

**Explicitly NOT yours** — siblings and other units own these, concurrently:
`~/herdr-spine/bin/handlers/**` · `~/herdr-spine/cc-hooks/**` ·
`~/herdr-spine/install.sh` · `~/herdr-spine/extensions/**` ·
`~/herdr-spine/test/**` · `~/agent-core/primitives/tower/**` ·
`~/agent-core/primitives/hooks/**` · `~/agent-core/primitives/mcps/**` ·
`~/agent-core/primitives/tools/**` · `~/agent-core/primitives/plugins/**` ·
any `*.md` under `primitives/` · `~/.tower/**` · `~/.claude/settings.json` ·
`~/.claude.json` · `~/.cursor/mcp.json` · `~/.pi/agent/extensions/**`.

`_spine_common.py` belongs to `agnt-spine-handlers`. `spine-spawn` does not import
it; if you find a `bin/spine-*` file that does, **post a finding — do not edit the
library.**

## Report back with

1. Per task: the exact command run and its literal output.
2. Task 4 — the four `--help` exit codes, and the deliberate verify-gate refusal.
3. Task 5 — the zero-hit grep output.
4. `spine-fleet`: the new definition of "unrelayed", equivalent or analogous.
5. One line per file you **deleted rather than ported**, with why, and what you
   checked to confirm nothing else depended on it.
6. Anything you found that contradicts this brief. A brief defect is the
   orchestrator's fault, not yours — report it plainly.
