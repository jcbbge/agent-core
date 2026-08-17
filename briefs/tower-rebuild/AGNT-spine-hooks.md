# AGNT — cc-hooks and install.sh: retire the MCP server, keep the installer honest

Your partition is `~/herdr-spine/cc-hooks/**` and `~/herdr-spine/install.sh`.
Nothing else. **Most of your partition exists to serve an MCP server that is being
deleted — your job is as much subtraction as porting.**

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

You are `agnt-spine-hooks`.

## The python client you call

`~/agent-core/primitives/tower/tower.py` — written by `agnt-tower-py`, verified by
the orchestrator before you were spawned. Its API is pasted below at dispatch:

**CLIENT API — verified by the orchestrator on 2026-08-17**, against
`~/agent-core/primitives/tower/tower.py` as merged to agent-core main at `b44d81e`.
Suite green: `python3 -m unittest test_tower` from `primitives/tower/` → **Ran 50
tests, OK**.

You will likely need none of it — your partition is JS and bash. It is here only
so that if you do touch python, you use the one preamble the whole unit uses
(verified from `/tmp` with no `PYTHONPATH`):

```python
import os, sys
sys.path.insert(0, os.path.expanduser("~/agent-core/primitives/tower"))
import tower
```

`open()` · `send(db, sender=, body=, recipient=, topic=, kind='note', reply_to=,
dedup=)` → `{'id': int, 'duplicate': bool}` · `inbox(db, consumer, limit=100)` ·
`cursor_of(db, consumer)` · `ack(db, consumer, id)` ·
`log(db, topic=, recipient=, limit=50)`. Rows are plain dicts of the `msg`
columns; `ts` is milliseconds. **`wake`/`resolve_pane` do not exist in python** —
shell out to `tower wake <agent>` if you need them.

Your partition is JS and bash, not python, so you will mostly want
`~/agent-core/primitives/tower/tower.mjs` (importable module) or the `tower` CLI.
Hooks are latency-sensitive; prefer the module import over spawning a CLI process
where the hook's runtime allows it.

## The four files, verified by grep and `ls` on 2026-08-17

`ls cc-hooks/` → `README.md`, `server.mjs`, `ask-bridge.mjs`, and two others
(confirm the full list yourself; the orchestrator's listing was truncated).

| file | lines | hits | disposition the orchestrator expects — **verify, don't assume** |
|---|---|---|---|
| `cc-hooks/server.mjs` | 380 | 2 (22, 23) | **DELETE.** Its own header, `:1-5`: *"Tower — fleet message bus for Claude Code. MCP stdio server, zero deps."* This IS the MCP server the ruling deletes. |
| `cc-hooks/ask-bridge.mjs` | 308 | 4 (4, 20, 147, 236) | **PARTIAL PORT.** Not all of it is tower. |
| `install.sh` | 379 | 2 (222, 292) | **PORT + SUBTRACT.** It installs the deleted server. |
| `cc-hooks/README.md` | — | 2 (8, 9) | **UPDATE.** Names `~/agent-core/primitives/mcps/tower/` as canonical home. |

**`cc-hooks/README.md` is easy to miss and is inside the done-when.** The
orchestrator's Task-3 grep covers all of `~/herdr-spine/cc-hooks`, so the README's
two hits must reach zero as well. Sixteen files must be clean across the unit, not
fifteen — the CORD brief's file table omits this one.

### `ask-bridge.mjs` — port the live parts, cut the dead branch

Its header (`:4`) says it bridges *"(AskUserQuestion, PermissionRequest) and
`mcp__tower__ask_user`, then sweeps $q away once…"*. Registered matchers, from
`install.sh:292`:
- `PreToolUse` / `AskUserQuestion` — **not tower.** Stays.
- `PreToolUse` / `PermissionRequest` (matcher `*`) — **not tower.** Stays.
- `PostToolUse` / `mcp__tower__ask_user` — **dead.** The tool name ceases to
  exist, so this matcher can never fire again. Remove it and its handler branch
  (`ask-bridge.mjs:236` guards `tool_name !== 'mcp__tower__ask_user'`).
- `Stop` → `stop-verdict.mjs` + `ask-bridge.mjs sweep`, `SessionEnd` →
  `ask-bridge.mjs clear` — verify whether these depend on tower at all.

`ask-bridge.mjs:147` calls `~/.tower/lib.mjs` a *"system file"* and reuses "the
same derivations". `lib.mjs` is being deleted. Either re-derive against the new bus
or drop the derivation — **do not leave a require/import of a file that will not
exist.** A hook that throws on load can break the harness for every session on
this machine.

### `install.sh` — the dangerous one

Read `install.sh:215-300` before editing. Two things it does that must change:

**Step 2 (`:222`)** installs `~/.tower/server.mjs`, preferring
`${TOWER_AUTO_CANONICAL_DIR:-$HOME/agent-core/primitives/mcps/tower}/server.mjs`
and falling back to `cc-hooks/server.mjs`. That whole step installs the deleted
MCP server. **Remove it.** Note the comment it carries, which is a real hazard
worth preserving elsewhere if any copy logic survives: a symlinked deploy path is
never written through, because *"cp follows a symlink and silently rewrites its
target in place, proven 2026-08-13 (T2a/T2b, agnt-w0-install-reconcile)."*

**Step 4 (`:292`)** merges hook registrations into `~/.claude/settings.json`,
including the `PostToolUse` / `mcp__tower__ask_user` entry. That entry must go.

**`~/.claude/settings.json` is NOT your partition — and `install.sh` writes it.**
This is the sharpest edge in your unit. You are editing what the installer
*would* write; you are **not** running the installer. **Do not execute
`install.sh`, and do not execute any function extracted from it, against real
paths.** If you must exercise it, do so against a redirected `HOME` or an
explicitly sandboxed prefix, and prove in your report which paths it touched.

Also check: does `install.sh` need to install the new `tower` CLI or client at all,
or is `~/.local/bin/tower` deployed by another unit? **Do not add an install step
for a file another unit owns.** If it is unowned, say so as a finding rather than
claiming the ground.

## Tasks

### Task 1 — `cc-hooks/server.mjs`
Confirm from the file itself that it is the MCP server, then delete it.
- **Done when:** the file is gone, and you have named **every** referrer you found
  (grep the whole repo, not just your partition) and confirmed each is either
  removed by you or is a sibling's problem you posted as a finding. A dangling
  reference to a deleted file is a broken install, not a clean subtraction.

### Task 2 — `cc-hooks/ask-bridge.mjs`
Remove the `mcp__tower__ask_user` branch; re-derive or drop the `lib.mjs`
dependency; leave the non-tower matchers working.
- **Done when:** `node --check cc-hooks/ask-bridge.mjs` (or the runtime's
  equivalent syntax check) exits 0, the file loads without referencing any deleted
  path, and you can show — with a command — that the `AskUserQuestion` and
  `PermissionRequest` paths still function. If you cannot exercise them safely
  without touching live settings, say `UNKNOWN` and say exactly what you could not
  test. **Do not claim a hook works because it parses.**

### Task 3 — `install.sh`
Remove step 2 entirely; remove the `mcp__tower__ask_user` registration from step 4;
leave every non-tower registration intact.
- **Done when:** `bash -n install.sh` exits 0, **and** you have produced evidence
  of what the installer would now write — a dry run against a redirected `HOME`,
  or the diff of the registration table, or both. Paste it. State plainly that you
  did not run it against the real `~/.claude/settings.json`.

### Task 4 — `cc-hooks/README.md`
Update it to describe the new world: CLI + module, no MCP server, no
`primitives/mcps/tower` canonical home.
- **Done when:** its two hits are gone and the text is *true* — a README that
  merely passes the grep while still describing a bus that no longer exists is a
  worse outcome than leaving it alone.

### Task 5 — the partition grep
- **Done when:** `grep -rIn 'mcps/tower\|\.tower/cli\.mjs\|\.tower/lib\.mjs\|mcp__tower\|board\.jsonl\|ledger\.jsonl' cc-hooks install.sh`
  returns **zero hits**. Paste it.

## Touch ONLY

- `~/herdr-spine/cc-hooks/**`
- `~/herdr-spine/install.sh`

**Explicitly NOT yours** — siblings and other units own these, concurrently:
`~/herdr-spine/bin/**` (both siblings) · `~/herdr-spine/extensions/**` ·
`~/herdr-spine/test/**` · `~/agent-core/primitives/tower/**` ·
`~/agent-core/primitives/hooks/**` · `~/agent-core/primitives/mcps/**` ·
`~/agent-core/primitives/tools/**` · `~/agent-core/primitives/plugins/**` ·
any `*.md` under `primitives/` · `~/.tower/**` · `~/.claude/settings.json` ·
`~/.claude.json` · `~/.cursor/mcp.json` · `~/.pi/agent/extensions/**`.

Deleting `~/agent-core/primitives/mcps/tower/server.mjs` is **another unit's job**,
not yours — you only stop referring to it.

## Report back with

1. Per task: the exact command run and its literal output.
2. Task 1 — every referrer of `server.mjs` you found, repo-wide, and its
   disposition.
3. Task 3 — the evidence of what `install.sh` would now write, and an explicit
   statement that you did not run it against real paths.
4. Task 5 — the zero-hit grep output.
5. One line per file you **deleted rather than ported**, with why.
6. Whether `install.sh` should install the new `tower` CLI, and who owns that —
   a finding, not a change.
7. Anything you found that contradicts this brief. A brief defect is the
   orchestrator's fault, not yours — report it plainly.
