# ORCH — tower-tools: the tools that read the old JSONL store

You own **Unit 4** of the tower cutover. Parent: `ORCH tower-cutover` (the
coordinator seat) — report to `orch-tower-cutover`.

Read `briefs/tower-rebuild/CORD-tower-cutover.md` for the operator ruling. This
brief is the part you own; where they differ, **this brief wins** — it carries
corrections the coordinator verified afterwards.

---

## Pre-Verified Facts

Run by the coordinator on 2026-08-17. Trust these; verify anything not listed.

**The new bus**
- `~/agent-core/primitives/tower/tower.mjs` — zero dependencies. Exports (verified
  by grep): `open()`, `send(db,m)`, `inbox(db,consumer,limit)`,
  `cursorOf(db,consumer)`, `ack(db,consumer,id)`, `log(db,{topic,recipient,limit})`,
  `resolvePane(name)`, `wake(db,name)`.
- `node primitives/tower/tower.test.mjs` → **14 passed, 0 failed** (run 2026-08-17).
- CLI on PATH: `~/.local/bin/tower`, verbs
  `send|inbox|ack|wake|log|stat`, `--json` available on `inbox` and `log`.
- Live DB: `~/.tower/tower.db` (SQLite, WAL).
- Schema, two tables: `msg(id,ts,sender,recipient,topic,kind,body,reply_to,dedup UNIQUE)`
  append-only; `cursor(consumer,acked_id,updated)`. Unread is computed as
  `id > acked_id`; a new consumer starts at **0**, never at latest.
- **Reachable with zero dependencies from every runtime here** — verified:
  `node:sqlite` (node v25.9.0), `bun:sqlite` (bun 1.3.14), python3 stdlib `sqlite3`
  (3.51.0), `sqlite3` CLI (3.51.0). That last one matters to you: **Zig has no
  driver and needs none** — see Task 3.

**Ruling: no MCP server.** `mcp__tower__*` ceases to exist. Do not port `server.mjs`.
Do not add a dependency to anything — the operator's instruction was literal.

**What is going away underneath you.** `~/.tower/board.jsonl` (12,834 rows),
`ledger.jsonl` (3,110), `odometer.jsonl` (1,080), `pheromones.jsonl`,
`dead-letter.jsonl` — all of it moves to `~/.tower/archive/pre-rebuild/` in Unit 5
and is **not migrated into the new DB** (operator ruling: rip it out; the tarball
`~/.tower-backup-20260816-204214.tar.gz` is the archive). So a tool that reads
board.jsonl is not "repointed at a moved file" — its data source ceases to exist
and it must read the `msg` table instead.

**Your file surface — grep counts verified 2026-08-17**
(pattern: `mcps/tower|\.tower/cli\.mjs|\.tower/lib\.mjs|mcp__tower|board\.jsonl|ledger\.jsonl`):
```
3  primitives/tools/statem/statem.ts
3  primitives/plugins/tower.ts
2  primitives/tools/statem/twr.ts
2  primitives/tools/latch/src/wait_board.zig
1  primitives/tools/latch/src/main.zig
1  primitives/tools/fleet-task/test-helpers.ts
1  primitives/tools/boot-card/test/acceptance.sh
   primitives/tools/statem/statem-twr-residuals.test.mjs
   primitives/tools/latch/test/acceptance-matrix.sh
   primitives/tools/vein/test/acceptance/pass12-commands.csv
   primitives/tools/vein/test/acceptance/pass3-commands.csv
```

Two corrections to the CORD brief's list:
- It names `tools/fleet-task/tower.ts` and `tools/boot-card/boot-card.mjs`. The
  actual hits are `tools/fleet-task/test-helpers.ts` and
  `tools/boot-card/test/acceptance.sh`. Verify the real filenames before you brief
  a worker on them.
- It does not mention **vein's acceptance CSVs**. Those are recorded corpus
  fixtures, not live callers — a `bun ~/.tower/cli.mjs` string inside a fixture of
  *commands agents historically ran* is **evidence, not a caller**. Do not rewrite
  history to make a grep go green. Say so in your report; the coordinator will
  exclude them from Unit 5's acceptance grep.

**latch is Zig.** `primitives/tools/latch/src/wait_board.zig` waits on board topics
by reading `board.jsonl`. It is installed at `~/.local/bin/latch` and it is a
**hook-enforced** utensil — the utensil guard denies bare `sleep`/sleep-poll and
points agents here, so a broken `latch --board` strands every agent that obeys the
law. Zig has no SQLite driver and does not need one: the `sqlite3` CLI (3.51.0) is
on PATH, and reading `msg` where `id > cursor` is a single query. Prefer the
smallest thing that works over vendoring anything.

---

## Tasks

### Task 1 — statem + twr
`primitives/tools/statem/statem.ts`, `primitives/tools/statem/twr.ts`, and
`primitives/tools/statem/statem-twr-residuals.test.mjs`.
- **Done when:** statem's own test suite passes against the new store. Name the
  exact invocation and paste the tail of its output.

### Task 2 — plugins, fleet-task, boot-card
`primitives/plugins/tower.ts`, `primitives/tools/fleet-task/test-helpers.ts`,
`primitives/tools/boot-card/test/acceptance.sh`.

`plugins/tower.ts` may exist only to wrap the MCP server. If its reason for
existing is gone, **retiring it is the correct outcome** — do not port dead code.
Judge it and say which.
- **Done when:** each tool's own test suite passes against the new store, or the
  tool is retired with a stated reason. Per tool, name the command and the result.

### Task 3 — latch
`primitives/tools/latch/src/wait_board.zig`, `src/main.zig`,
`test/acceptance-matrix.sh`.

`latch wait --board <topic>` must block on the new `msg` table and keep its
**distinct truth-legal exit codes per outcome** — that contract is the whole point
of the tool and it does not change.
- **Done when:** `zig build` succeeds, the acceptance matrix passes, and you
  demonstrate live: start `latch wait --board tower/cutover` in one shell, send a
  matching message with `tower send` from another, and show it returning with the
  right exit code. Paste both.
- **Then reinstall it** to `~/.local/bin/latch` and confirm `latch --help` exits 0.
  A stale binary on PATH with a rebuilt source is the failure mode here.

### Task 4 — the vein fixtures
Do **not** edit `primitives/tools/vein/test/acceptance/pass*-commands.csv`.
- **Done when:** you have confirmed in one command that these are recorded corpus
  fixtures rather than live callers, and said so in your report so the coordinator
  can exclude them from the final acceptance grep.

---

## Touch ONLY

- `~/agent-core/primitives/tools/statem/**`
- `~/agent-core/primitives/tools/fleet-task/**`
- `~/agent-core/primitives/tools/boot-card/**`
- `~/agent-core/primitives/tools/latch/**`
- `~/agent-core/primitives/plugins/tower.ts`

**Explicitly NOT yours** (other units own them, concurrently):
`~/agent-core/primitives/tower/**` · `~/agent-core/primitives/hooks/**` ·
`~/agent-core/primitives/mcps/tower/**` (read-only; deleted in Unit 5) ·
`~/agent-core/primitives/tools/vein/**` (read-only — Task 4 is a read) ·
`~/herdr-spine/**` · any `*.md` under `primitives/` ·
`~/.claude/settings.json`, `~/.claude.json`, `~/.cursor/mcp.json`,
`~/.pi/agent/extensions/**`.

If your work needs a change in someone else's partition, **post a finding, do not
edit it**.

---

## Standing rules

- **Evidence before assertion.** Every claim cites a command run this session.
  `UNKNOWN` is a complete answer.
- Decompose into SUBTASKS and dispatch workers per `primitives/rules/two-queues.md`.
  One TASK = one worktree, one SUBTASK = one branch. You do not implement.
- **Do not bypass** `credential-guard`, the grounding hook, the write-gate, or the
  spawn-door. A refusal is information. If the grounding hook blocks a second write,
  Read the file first — do not push a door that says pull.
- Test against a temp `TOWER_HOME`. **Never against the live `~/.tower/tower.db`** —
  the coordinator and four other panes are reading it right now.
- **No mocks for the store.** These tools are being migrated precisely because the
  store changed; a mocked store proves nothing. Use a real temp SQLite DB.
- Stage explicitly. **Never `git add -A`.**
- Commit convention per `AGENTS.md`. Push on green to `jcbbge` remotes only.

## Tower

```
tower send --from orch-tower-tools --to orch-tower-cutover \
  --kind finding --topic tower/cutover "<body>"
```
Report per task. A task is done when its done-when condition was **run** and
**passed**. Read your inbox before going idle: `tower inbox orch-tower-tools`.

## Report back with

1. Per tool: **ported / rewritten / retired**, the test invocation, and its result.
2. The latch live demonstration — both shells, the exit code — and proof the
   installed binary at `~/.local/bin/latch` was rebuilt, not left stale.
3. Your ruling on `plugins/tower.ts`: does it survive the deletion of the MCP server?
4. The vein-fixture finding, so Unit 5's acceptance grep can exclude them honestly.
5. Anything that contradicts this brief. A brief defect is the coordinator's fault
   — report it plainly.
