# ORCH — tower-spine: the python client, and every herdr-spine caller

You own **Unit 1** of the tower cutover, expanded. Parent: `ORCH tower-cutover`
(the coordinator seat) — report to registration `orch-tower-cutover`.

Read `briefs/tower-rebuild/CORD-tower-cutover.md` for the operator ruling and the
shape of the whole cutover. This brief is the part you own. Where the two differ,
**this brief wins** — it carries corrections the coordinator verified afterwards.

---

## Pre-Verified Facts

Every fact below was run by the coordinator on 2026-08-17. Trust these. Verify
anything not on this list before you assert it.

**The new bus**
- `~/agent-core/primitives/tower/tower.mjs` — the whole bus, zero dependencies.
  Exports, verified by `grep -n '^export' primitives/tower/tower.mjs`:
  `open()`, `send(db,m)`, `inbox(db,consumer,limit)`, `cursorOf(db,consumer)`,
  `ack(db,consumer,id)`, `log(db,{topic,recipient,limit})`, `resolvePane(name)`,
  `wake(db,name)`.
- `node primitives/tower/tower.test.mjs` → **14 passed, 0 failed** (run 2026-08-17).
- CLI on PATH: `~/.local/bin/tower`. `tower stat` verified working; it reports
  `db /Users/jrg/.tower/tower.db`, message count, and one line per consumer cursor.
- Verbs, the entire surface:
  `tower send --from <who> [--to <agent>] [--topic <t>] [--kind <k>] [--dedup <key>] [--reply-to <id>] [--wake] <body>` ·
  `tower inbox <consumer> [--limit N] [--json]` · `tower ack <consumer> <id>` ·
  `tower wake <agent>` · `tower log [--topic t] [--to agent] [--limit N] [--json]` · `tower stat`
- Schema, two tables: `msg(id,ts,sender,recipient,topic,kind,body,reply_to,dedup UNIQUE)`
  append-only; `cursor(consumer,acked_id,updated)` — the only mutable table. Unread
  is computed as `id > acked_id`. **A new consumer starts at 0, never at latest.**
- Delivery is at-least-once. `--dedup` makes a retry free.

**Ruling: there is no MCP server.** The new bus is CLI + module only. `mcp__tower__*`
tool names cease to exist. Do not port `server.mjs`. Do not add a dependency —
"i dont want another fucking dependency" is the operator's literal instruction.

**SQLite reaches every runtime this fleet uses with zero dependencies** — verified:
`node:sqlite` (node v25.9.0), `bun:sqlite` (bun 1.3.14), python3 stdlib `sqlite3`
(3.51.0), `sqlite3` CLI (3.51.0). Bun's `node:sqlite` imports but exports nothing;
`tower.mjs` feature-detects around it. **Do not "fix" that by adding a driver.**

**Two fixed bugs you must not reintroduce** (they are why `tower.mjs` looks the way
it does — read `openDb()` at `primitives/tower/tower.mjs:53` and `withRetry()` at
`:101` before writing a line of python):
1. `journal_mode` must be **READ before it is written**. Setting it takes an
   exclusive lock, which killed writes under concurrent load.
2. `busy_timeout` must be set **per connection**, not once globally.
3. A `dedup` collision **returns the existing id** rather than raising.

**Your file surface — counts verified by grep on 2026-08-17.** The CORD brief said
"6 files under ~/herdr-spine"; the real count is **15 live files**. This is the
correction that expanded your unit:

```
7  bin/handlers/_spine_common.py
6  bin/spine-fleet
4  cc-hooks/ask-bridge.mjs
3  bin/spine-greeting
2  bin/spine-spawn          ← the spawn door itself; see BLAST RADIUS below
2  bin/spine-inbox
2  bin/spine-claim
2  bin/spine-wave
2  bin/handlers/40-tower-bridge
2  cc-hooks/server.mjs
2  install.sh
1  bin/spine-workspace
1  bin/spine-ruling
1  bin/handlers/17-field-pull
1  bin/handlers/10-notify
```
(counts = lines matching `mcps/tower|\.tower/cli\.mjs|\.tower/lib\.mjs|mcp__tower|board\.jsonl|ledger\.jsonl`)

**herdr-spine is dirty right now.** `git -C ~/herdr-spine status --short` shows
modified `bin/handlers/{10-notify,16-parent-wake,17-field-pull,_spine_common.py}`
and untracked `bin/handlers/90-courier`, `test/no-private-delivery.py`. **That is
abandoned courier work from a cancelled unit.** `90-courier` is dead — do not
migrate it, do not commit it. The other edits were the cancelled architecture's
`SPINE_COURIER`/deposit gating; read them for context if useful, then decide
deliberately what survives. Say in your report what you kept and what you reverted.

**Already salvaged, do not redo:** `briefs/comms-substrate/DELIVERY-CENSUS.md`
(the 99/308 = 32.1% silent-loss measurement) is committed on agent-core main at
`c0b27e7`. `test/no-private-delivery.py` is committed in the herdr-spine worktree
branch `spine/spine-delivery-test` at `e5e1bd8` — **not merged to main**. Whether
that hook still names a real failure under the new bus is an open question the
coordinator has NOT ruled on; rule 1 (a handler keeping its own `*-pace.json`)
plainly still does, rule 2 (calls `notify`/`verified_prompt`) presumed the
cancelled DOOR. If you land it, re-derive it against the new bus and say so.

**Backup exists.** `~/.tower-backup-20260816-204214.tar.gz` (5.7 MB, 1630 entries,
verified readable). Nothing in `~/.tower/` is unrecoverable.

---

## BLAST RADIUS — read this before your first edit

`bin/spine-spawn` is the door every agent in this fleet is spawned through,
**including the workers you are about to spawn and the coordinator waiting on
you**. If you break it, the cutover cannot dispatch.

Law for this unit: **never leave `spine-spawn` broken between edits.** After any
change to it, immediately run `spine-spawn --help` and `spine-spawn orch --help`
and confirm exit 0. Do not batch a `spine-spawn` edit with an untested library
change. If you must change `_spine_common.py` in a way `spine-spawn` depends on,
change the library, prove it in isolation, and only then touch the caller.

Five other agent panes are live on this machine right now. `~/.tower/tower.db` is
the **live** bus — the coordinator and the concierge are reading it. Test against
a temp `TOWER_HOME`, never against the live DB.

---

## Tasks

### Task 1 — `primitives/tower/tower.py`
Write the python client. stdlib `sqlite3` only. It mirrors `tower.mjs`'s
send/inbox/ack/cursor semantics **exactly** — same table shapes, same "new consumer
starts at 0", same at-least-once delivery, same dedup-returns-existing-id, same
`busy_timeout`-per-connection, same journal_mode-read-before-write.

- **Done when:** a python writer and the `tower` CLI interleave **100 writes each**
  into one temp DB, **200 rows land, 0 lost**, `PRAGMA integrity_check` returns
  `ok`; and `python3 -c "import tower"` succeeds with **no pip install**. Paste the
  command and its output in your report.

### Task 2 — `bin/handlers/_spine_common.py`
Repoint `board_append(...)` (and any sibling bus verb) at `tower.py`. Handlers are
python and run per-event; they **must not shell out per message**.

- **Done when:** `python3 -m pytest bin/handlers/tests/` (or whatever that suite's
  actual invocation is — find it, do not assume) passes, and
  `bin/handlers/tests/test_board_append_flock.py` either passes against the new
  store or is replaced by its honest equivalent. Name which.

### Task 3 — the `spine-*` binaries and `cc-hooks`
`bin/spine-{fleet,greeting,spawn,inbox,claim,wave,workspace,ruling}`,
`bin/handlers/{10-notify,17-field-pull,40-tower-bridge}`,
`cc-hooks/{ask-bridge.mjs,server.mjs}`, `install.sh`.

Some of these are not "port the call" — `40-tower-bridge` and `cc-hooks/server.mjs`
exist to bridge the **MCP server that is being deleted**. Judge each: port, or
remove as obsolete. A file removed because its reason for existing is gone is a
correct outcome; say so explicitly rather than porting dead code.

- **Done when:** `grep -rIn 'mcps/tower\|\.tower/cli\.mjs\|\.tower/lib\.mjs\|mcp__tower\|board\.jsonl\|ledger\.jsonl' ~/herdr-spine/bin ~/herdr-spine/cc-hooks ~/herdr-spine/install.sh`
  returns **zero hits**, AND `spine-spawn --help`, `spine-spawn orch --help`,
  `spine-inbox --help`, `spine-claim --help` all exit 0, AND one real end-to-end
  spawn works (spawn a throwaway pane, confirm it starts, reap it).

---

## Touch ONLY

- `~/agent-core/primitives/tower/tower.py` (new file — this is your only agent-core write)
- `~/herdr-spine/bin/**`, `~/herdr-spine/cc-hooks/**`, `~/herdr-spine/install.sh`,
  `~/herdr-spine/test/**`

**Explicitly NOT yours** (other units own them, concurrently):
`~/herdr-spine/extensions/**` · `~/agent-core/primitives/hooks/**` ·
`~/agent-core/primitives/mcps/tower/**` · `~/agent-core/primitives/tools/**` ·
`~/agent-core/primitives/plugins/**` · any `*.md` under `primitives/` ·
`~/.claude/settings.json` · `~/.claude.json` · `~/.cursor/mcp.json` ·
`~/.pi/agent/extensions/**`.

If your work needs a change in someone else's partition, **post a finding, do not
edit it**.

---

## Standing rules

- **Evidence before assertion.** Every claim in your report cites a command you ran
  this session. `UNKNOWN` is a complete answer.
- Decompose into SUBTASKS and dispatch workers per `primitives/rules/two-queues.md`.
  One TASK = one worktree, one SUBTASK = one branch. You do not implement.
- **Do not bypass** `credential-guard`, the grounding hook, the write-gate, or the
  spawn-door. A refusal is information. If the grounding hook blocks a second write,
  Read the file first — do not push a door that says pull.
- Stage explicitly. **Never `git add -A`** — the tree has abandoned courier work in it.
- Commit convention per `AGENTS.md` (PHASE/DONE/TODO/BLOCKED, Co-Authored-By).
- Push on green to `jcbbge` remotes only.
- **Do not spawn anything into `~/.tower/tower.db` as a test target.** Temp DB only.

## Tower

Report per task, not per session:
```
tower send --from orch-tower-spine --to orch-tower-cutover \
  --kind finding --topic tower/cutover "<body>"
```
Body carries: what landed · the exact command that proves it · what you left open.
A task is not done because it was attempted — it is done when its done-when
condition was **run** and **passed**. Read your own inbox before going idle:
`tower inbox orch-tower-spine`.

## Report back with

1. Task 1 — the 200-row interleave command and its literal output, plus the
   `import tower` proof.
2. Task 2 — the handler test invocation and result; the disposition of
   `test_board_append_flock.py`.
3. Task 3 — the zero-hit grep output; the four `--help` exit codes; the live spawn
   evidence; and a line per file you **deleted rather than ported**, with why.
4. The disposition of the dirty herdr-spine tree: kept, reverted, or dropped, per file.
5. Anything you found that contradicts this brief. A brief defect is the
   coordinator's fault, not yours — report it plainly.
