# AGNT — herdr-spine handlers: off board.jsonl, onto the new bus

Your partition is `~/herdr-spine/bin/handlers/**`. Nothing else.

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

You are `agnt-spine-handlers`.

## The python client you call

`~/agent-core/primitives/tower/tower.py` — stdlib `sqlite3` only, written by
`agnt-tower-py` and verified by the orchestrator before you were spawned. Its
public API, and the exact import line that works from a handler, are pasted below
by the orchestrator at dispatch:

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

## Your files — every count verified by grep on 2026-08-17

`grep -rIn 'mcps/tower\|\.tower/cli\.mjs\|\.tower/lib\.mjs\|mcp__tower\|board\.jsonl\|ledger\.jsonl'`
hits inside your partition:

| file | lines | hits | what it is |
|---|---|---|---|
| `bin/handlers/_spine_common.py` | 406 | 7 (32,33,167,252,328) | the shared library — `board_append()` at :327 |
| `bin/handlers/40-tower-bridge` | 471 | 2 (5,94) | the **ledger** plane bridge |
| `bin/handlers/10-notify` | 511 | 2 (12,116) | the **board** plane writer |
| `bin/handlers/17-field-pull` | 313 | 1 (222) | the stigmergic-field puller |
| `bin/handlers/tests/test_board_append_flock.py` | 230 | 2 (95,145) | the oracle test for `board_append` |

**`_spine_common.py` is imported by nine files** — verified by
`grep -rIln '_spine_common\|spine_common' bin cc-hooks test`:
`10-notify`, `15-restore-view`, `16-parent-wake`, `17-field-pull`,
`18-worktree-reconcile`, `20-reflex`, `30-choreo`, `40-tower-bridge`,
`tests/test_board_append_flock.py`. All nine are in **your** partition. Change the
library and prove it against all nine — a signature change you only checked in
`10-notify` breaks six handlers silently at the next event.

**The two planes you are collapsing.** They are separate today by an explicit
ownership rule, and the new bus has one log:
- `40-tower-bridge` owns `~/.tower/ledger.jsonl` (`LEDGER_PATH` at :94, appender
  `ledger_append()` at :134, O_APPEND + its own id scheme `b36()`/`new_id()` at
  :107/:115). Its header cites *"NO dual-write — the ownership rule is
  TOWER-AUTO-CONTRACT §4"*.
- `10-notify` owns `~/.tower/board.jsonl` via `_spine_common.board_append()`.

On the new bus both are `tower.send(...)`; the plane distinction becomes `topic`
and `kind`. **You choose the mapping and you justify it in your report.** Preserve
the no-dual-write property: one event must not produce two rows.

**`board_append()` as it stands today** (`_spine_common.py:327`) — signature
`board_append(entry_type, body, from_name, topic)`, writes one JSON line under
`fcntl.flock(LOCK_EX)` with keys `id` (`spec-<uuid4>`), `ts` (ISO-8601 Z, **seconds**),
`cwd` (`HERDR_PLUGIN_ROOT` or cwd), `type`, `from`, `topic`, `body`. Path is
`TOWER_BOARD_PATH`, overridable via **`SPINE_BOARD_PATH`** for testing (`:33`).

Three things to carry across deliberately, because losing any of them silently is
exactly the failure this cutover exists to end:
- **`ts` changes units** — ISO-seconds today, integer **milliseconds** on the new
  bus.
- **`cwd` has no column** in `msg`. Decide where it goes (topic? body?) and say so
  — several consumers scope by cwd (`40-tower-bridge:202 scan_ledger_tail(pane_cwd)`
  does a realpath compare).
- **The test-path env var must survive.** `SPINE_BOARD_PATH` redirected the board
  so tests never polluted the real one. Its replacement is `TOWER_HOME`/`TOWER_DB`;
  make sure the test suite actually redirects, and prove it.

## Tasks

### Task 1 — `_spine_common.py`: repoint the bus verbs at `tower.py`

Repoint `board_append(...)` and any sibling bus verb at the python client.
Handlers run **per event inside a 5s dispatcher budget** — they **must not shell
out per message.** Import the module; do not `subprocess` the `tower` CLI.

- **Done when:** `grep -rIn 'mcps/tower\|\.tower/cli\.mjs\|\.tower/lib\.mjs\|mcp__tower\|board\.jsonl\|ledger\.jsonl' bin/handlers/` returns **zero hits**,
  and each of the nine importers still imports and runs — prove it with something
  stronger than a grep (at minimum `python3 -c 'import ...'` per file, or the
  handler's own smoke path). Paste the output.
- **Also done when:** you can state, with a command as evidence, that no handler
  exceeds the 5s budget on the new path. If you cannot measure it, say `UNKNOWN`
  and say why — do not assert it.

### Task 2 — the handler test suite

`test_board_append_flock.py` documents its own runner in its docstring:
`python3 bin/handlers/tests/test_board_append_flock.py` (line 8). It is an
**oracle test — "Authored from plan/brief only — never from implementation"**
(line 5). Honour that: if it fails against the new store, the honest question is
whether the *contract* it asserts still holds, not how to make it green.

The flock contract is a **file**-append contract. SQLite serializes writers
itself, so `fcntl.flock` on a JSONL path has no counterpart. That is a contract
that ceased to exist, not a test to delete quietly.

- **Done when:** the suite either **passes against the new store**, or is
  **replaced by its honest equivalent** — a test asserting the property that
  actually matters now (concurrent handler writes all land, none lost, cursors
  stay monotonic). **Name which** you did, and paste the invocation and output.
  Deleting it and reporting the partition green is a service failure.
- Find the suite's real invocation before you assume one — check for a Makefile
  or CI target as well as the docstring. There is no `Makefile`, `pytest.ini`,
  `setup.cfg`, `pyproject.toml`, or `tox.ini` at the repo root (verified).

### Task 3 — `10-notify`, `40-tower-bridge`, `17-field-pull`

Port each, or remove it as obsolete, and justify the call.

**`17-field-pull` carries a known architectural gap — read this before you touch
it.** It is the stigmergic-field puller. The new bus has **no `emit` or `field`
verb**; its entire surface is listed in the shared prefix above. Line 222 prints
guidance telling agents to run `bun ~/.tower/cli.mjs emit work-claimed …`, which
will not exist. COMMS-ARCH plane 5 makes stigmergy mandatory for ranks 1–4, so
this is a real hole, and the orchestrator has escalated it to the coordinator.

**Do not invent a field protocol.** Until a ruling arrives, the standing default
is: **remove the dead `emit` guidance so it cannot mislead an agent, leave the
puller's read path intact, and report the gap as open.** If a ruling reaches you
via `tower inbox agnt-spine-handlers`, follow the ruling instead and say so.

- **Done when:** for each of the three files you state **ported** or **removed**,
  with the reason, and the partition-wide grep in Task 1 is zero. For anything
  removed, name what depended on it and how you checked nothing else did.

## Touch ONLY

- `~/herdr-spine/bin/handlers/**`

**Explicitly NOT yours** — siblings and other units own these, concurrently:
`~/herdr-spine/bin/spine-*` · `~/herdr-spine/cc-hooks/**` ·
`~/herdr-spine/install.sh` · `~/herdr-spine/extensions/**` ·
`~/herdr-spine/test/**` · `~/agent-core/primitives/tower/**` ·
`~/agent-core/primitives/hooks/**` · `~/agent-core/primitives/mcps/**` ·
`~/agent-core/primitives/tools/**` · `~/agent-core/primitives/plugins/**` ·
any `*.md` under `primitives/` · `~/.tower/**` · `~/.claude/settings.json` ·
`~/.claude.json` · `~/.cursor/mcp.json` · `~/.pi/agent/extensions/**`.

## Report back with

1. Task 1 — the zero-hit grep output; the per-importer proof for all nine files;
   the 5s-budget evidence or an explicit `UNKNOWN`.
2. Task 2 — the suite's real invocation and its output; whether
   `test_board_append_flock.py` passes as-is or was replaced, and by what.
3. Task 3 — one line per file: **ported** or **removed**, and why. The disposition
   of the `17-field-pull` emit guidance, and whether you acted on a ruling or the
   standing default.
4. Your plane-collapse mapping: how ledger-vs-board became topic/kind, how `cwd`
   survived, and how you preserved no-dual-write.
5. Anything you found that contradicts this brief. A brief defect is the
   orchestrator's fault, not yours — report it plainly.
