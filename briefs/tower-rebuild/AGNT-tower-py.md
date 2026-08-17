# AGNT — tower.py: the python client for the new bus

Parent: `orch-tower-spine` (unit 1 of the tower cutover). This brief is
self-contained and binding. Where it differs from anything else you read, this
brief wins.

**Two seats read this brief, and you are exactly one of them.** This unit went
through the Plan→Implementation bifurcation door (`spine-spawn make`), which
refuses implementation until test criteria exist and enforces one law: *the test
agent is NOT the implementation agent; criteria come BEFORE code.* Your pane label
and worktree say which seat you hold.

- **The test seat** owns Task 2 and nothing else. Author the criteria against the
  semantics below and against `tower.mjs`. You do **not** write `tower.py`, and
  you do not soften a criterion to match an implementation you can see.
- **The implementation seat** owns Task 1 and nothing else. Write `tower.py` and
  make the criteria pass. You do **not** author or edit the test file. If a
  criterion is wrong, report it — do not rewrite it.

If you find yourself holding both, that is a spawn defect: stop and report it
rather than doing the other seat's job.

---

## Pre-Verified Facts

Every fact below was run by the orchestrator on 2026-08-17. Trust these. Verify
anything not on this list before you assert it.

**The reference implementation you are mirroring**
- `~/agent-core/primitives/tower/tower.mjs` — the whole bus, zero dependencies,
  17228 bytes. Read it end to end before writing a line. Its exports, verified by
  `grep -n '^export' primitives/tower/tower.mjs`: `open()`, `send(db,m)`,
  `inbox(db,consumer,limit)`, `cursorOf(db,consumer)`, `ack(db,consumer,id)`,
  `log(db,{topic,recipient,limit})`, `resolvePane(name)`, `wake(db,name)`.
- `node primitives/tower/tower.test.mjs` → **14 passed, 0 failed**.
- CLI on PATH: `~/.local/bin/tower`. Verbs, the entire surface:
  `tower send --from <who> [--to <agent>] [--topic <t>] [--kind <k>] [--dedup <key>] [--reply-to <id>] [--wake] <body>` ·
  `tower inbox <consumer> [--limit N] [--json]` · `tower ack <consumer> <id>` ·
  `tower wake <agent>` · `tower log [--topic t] [--to agent] [--limit N] [--json]` ·
  `tower stat`
- Paths are env-overridable, verified at `tower.mjs:45-47`:
  `TOWER_HOME` (default `~/.tower`), `TOWER_DB` (default `$TOWER_HOME/tower.db`),
  `SPINE_SPAWN`. **Your python client must honour the same two env vars with the
  same precedence** — that is how the CLI and your client land in one temp DB.

**The schema, copied from `tower.mjs:118-141`. Byte-compatible or you have failed.**
```sql
CREATE TABLE IF NOT EXISTS msg (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  ts        INTEGER NOT NULL,
  sender    TEXT    NOT NULL,
  recipient TEXT,              -- durable agent name; NULL = broadcast
  topic     TEXT,
  kind      TEXT    NOT NULL,  -- note|finding|deliverable|question|answer|alert
  body      TEXT    NOT NULL,
  reply_to  INTEGER,           -- correlates an answer to its question
  dedup     TEXT UNIQUE        -- idempotency: retry is free, dupes are refused
);
CREATE INDEX IF NOT EXISTS msg_recipient_idx ON msg(recipient, id);
CREATE INDEX IF NOT EXISTS msg_topic_idx     ON msg(topic, id);

CREATE TABLE IF NOT EXISTS cursor (
  consumer TEXT PRIMARY KEY,
  acked_id INTEGER NOT NULL DEFAULT 0,
  updated  INTEGER NOT NULL
);
```
`ts` is **milliseconds** (`Date.now()`), not seconds. Python must write
`int(time.time() * 1000)`.

**Semantics, each one verified against the cited lines. Mirror exactly.**
- `open()` (`tower.mjs:143`): build the schema **only when `msg` is missing** —
  `SELECT name FROM sqlite_master WHERE type='table' AND name='msg'`. Running
  `CREATE TABLE` on every open takes a write lock on every invocation.
- `send()` (`tower.mjs:156`): `kind` defaults to `"note"`; missing `sender` or
  `body` raises. Returns `{id, duplicate}`. On a `dedup` UNIQUE collision it
  **returns the existing id with `duplicate: True`** — it does not raise.
- `inbox()` (`tower.mjs:181`): `WHERE id > cursor AND (recipient = ? OR recipient
  IS NULL) AND sender <> ? ORDER BY id LIMIT ?`. A consumer sees broadcasts, never
  its own sends.
- `cursorOf()` (`tower.mjs:192`): **absent row means 0, never latest.** A consumer
  that has never run reads the log from the beginning.
- `ack()` (`tower.mjs:200`): monotonic — `max(current, id)`, upsert via
  `ON CONFLICT(consumer) DO UPDATE`. An ack can never rewind.
- `log()` (`tower.mjs:211`): optional topic/recipient filters, `ORDER BY id DESC
  LIMIT ?`, then **reversed** before returning.
- Delivery is at-least-once by design. `--dedup` makes a retry free.

**Three fixed bugs you must not reintroduce.** Read `openDb()` at
`primitives/tower/tower.mjs:53` and `withRetry()` at `:101` before writing python.
1. **`journal_mode` must be READ before it is written.** Writing it takes a brief
   exclusive lock; issued unconditionally on every open, concurrent cold starts
   collide and SQLITE_BUSY kills the process before it has sent anything. Measured
   in the comment at `tower.mjs:82-87`: **157/160 with the unconditional pragma,
   240/240 without it.** Read the pragma (reading takes no lock), write only when
   it disagrees with `wal`.
2. **`busy_timeout` is per connection**, set unconditionally and first, on every
   connection you open — not once globally, not folded into the schema blob (some
   multi-statement exec paths silently skip it, and a `busy_timeout` that did not
   apply looks exactly like one that did until the bus is under real contention).
   `tower.mjs` uses `15000`.
3. **Retrying is the bus's job, not the caller's.** `withRetry` (`tower.mjs:101`):
   8 tries, backoff 20ms doubling to a 1000ms ceiling, retry only when the error
   matches `SQLITE_BUSY|database is locked`, re-raise anything else. In python the
   matching sleep is `time.sleep(ms/1000)`. Wrap the same three call sites
   `tower.mjs` wraps: the schema build, the `send` INSERT, the `ack` upsert.

**Runtime**
- `python3` on this machine is **3.9.6** — the system python. Target 3.9. No
  `match`, no `X | Y` unions at runtime, no `tomllib`.
- `python3 -c "import sqlite3; print(sqlite3.sqlite_version)"` → **3.51.0**.
  `sqlite3` is stdlib. **Add no dependency** — "i dont want another fucking
  dependency" is the operator's literal instruction, and it is why this file
  exists at all.
- `node -v` → v25.9.0; `bun -v` → 1.3.14. Bun ships a `node:sqlite` that imports
  cleanly but exports nothing; `tower.mjs` feature-detects around it. That is not
  your problem and not a thing to "fix".

**Callers you are unblocking** (do not edit them — other agents own them):
`~/herdr-spine/bin/handlers/_spine_common.py` and five `bin/spine-*` python
binaries will `import tower`. They are **handlers that run per event and must not
shell out per message** — so the module API is the product, not the CLI. Design
for `import tower` from a script whose cwd is arbitrary.

---

## BLAST RADIUS — read this before your first edit

`~/.tower/tower.db` is the **live** bus. Five agent panes on this machine are
reading and writing it right now, including the orchestrator waiting on you and
the coordinator above them.

**Never point a test at `~/.tower/tower.db`.** Every test sets `TOWER_HOME` to a
fresh `mktemp -d`. If you are unsure whether a command you are about to run
touches the live DB, run `tower stat` first and read which path it prints.

---

## Tasks

### Task 1 — write `~/agent-core/primitives/tower/tower.py`

stdlib `sqlite3` only. Mirror `tower.mjs`'s send/inbox/ack/cursor semantics
exactly, per the facts above. Provide, at minimum, the module-level API:
`open()`, `send(db, **m)`, `inbox(db, consumer, limit=100)`,
`cursorOf`-equivalent, `ack(db, consumer, id)`, `log(db, topic=None,
recipient=None, limit=50)`. Name them idiomatically for python
(`cursor_of`, `reply_to`) but keep the semantics identical; if you rename, say so
in your report so the callers' brief can be corrected.

`resolvePane`/`wake` are **out of scope** — they shell out to `shepherd` and
nothing in python needs them yet. Do not port them. If you disagree, say so in
your report; do not write them on your own judgement.

- **Done when, all four, each with literal pasted output:**
  1. **Interleave.** A python writer and the `tower` CLI interleave **100 writes
     each** into one temp DB (`TOWER_HOME=$(mktemp -d)`), concurrently, not
     sequentially. **200 rows land, 0 lost.** Prove the count with a query, and
     prove the interleaving was real (e.g. senders alternate in the id order).
  2. `PRAGMA integrity_check` on that temp DB returns exactly `ok`.
  3. `python3 -c "import tower"` succeeds with **no pip install**. Paste the
     command including how the module was put on the path.
  4. **Cross-runtime read-back.** `tower inbox` (node) sees rows written by
     python, and your python `inbox()` sees rows written by the CLI, in the same
     temp DB. A shared table that only each side can read is not a bus.

### Task 2 — the regression tests for the three fixed bugs

A test file next to the client. These are the bugs the rebuild exists to kill;
an untested fix is a fix that comes back.

- **Done when:** the suite runs green under `python3` with no third-party test
  runner (stdlib `unittest` is fine; do not add pytest as a dependency), and it
  covers at minimum:
  - a `dedup` collision **returns the existing id** and does not raise;
  - a brand-new consumer's `inbox` returns row **1**, not zero rows;
  - `ack` is monotonic — acking a lower id after a higher one does not rewind;
  - `inbox` excludes the consumer's own sends and includes broadcasts
    (`recipient IS NULL`);
  - concurrent opens do not fail on `journal_mode` (spawn several processes
    opening at once against a cold temp DB; assert every one exits 0).

  Paste the invocation and its output.

---

## Touch ONLY

- `~/agent-core/primitives/tower/tower.py` (new)
- one new test file under `~/agent-core/primitives/tower/`

**Explicitly NOT yours** — other agents and other units own these, concurrently:
`~/herdr-spine/**` · `~/agent-core/primitives/tower/tower.mjs` ·
`~/agent-core/primitives/tower/tower.test.mjs` · `~/agent-core/primitives/hooks/**` ·
`~/agent-core/primitives/mcps/**` · `~/agent-core/primitives/tools/**` ·
`~/agent-core/primitives/plugins/**` · any `*.md` under `primitives/` ·
`~/.local/bin/tower` · `~/.claude/settings.json` · `~/.claude.json` ·
`~/.cursor/mcp.json` · `~/.pi/agent/extensions/**`.

If your work needs a change in someone else's partition — including a bug you find
in `tower.mjs` — **report it, do not edit it.**

---

## Standing rules

- **Evidence before assertion.** Every claim in your report cites a command you
  ran this session. `UNKNOWN` is a complete answer. Do not report a done-when as
  met unless you ran it and read its output.
- **Do not bypass** `credential-guard`, the grounding hook, the write-gate, or the
  spawn-door. A refusal is information. If the grounding hook blocks a second
  write to a file, Read the file first — the read comes before the retry, not
  after the refusal. Compose consecutive edits to one file into a single call.
- Stage explicitly. **Never `git add -A`.**
- Commit convention per `AGENTS.md` (PHASE/DONE/TODO/BLOCKED, Co-Authored-By).
  Commit your own branch; do **not** merge to main — the orchestrator integrates.
- **Never test against `~/.tower/tower.db`.** Temp `TOWER_HOME` only.

## Tower

Report per task, not per session:
```
tower send --from agnt-tower-py --to orch-tower-spine \
  --kind finding --topic tower/cutover "<body>"
```
Body carries: what landed · the exact command that proves it · what you left open.
A task is not done because it was attempted — it is done when its done-when
condition was **run** and **passed**. Post a CLAIM when you start, findings as you
go, and read your own inbox before going idle: `tower inbox agnt-tower-py`.

Two acceptable stopping states, and only two: every done-condition met, or a
posted blocked/`need-help` naming what is needed and who owns it, **after** you
have finished everything not dependent on it. "Reported and awaited instruction"
is not a stopping state.

## Report back with

1. Task 1 — the interleave command and its **literal** output (200/0 lost), the
   `integrity_check` output, the `import tower` proof, and the cross-runtime
   read-back evidence.
2. Task 2 — the test invocation and its output; one line per bug covered.
3. The final public API you settled on, as a signature list, with any name that
   differs from `tower.mjs` called out — downstream briefs are written against it.
4. Anything you found that contradicts this brief. A brief defect is the
   orchestrator's fault, not yours — report it plainly.
