# CORD — tower cutover: move the fleet onto the new bus, then delete the old one

**Operator ruling, 2026-08-16:** *"rip out all remnants of tower. i do not want
tower. install this. rebuild tower from scratch in its stripped down minimal
barebones version. keep sqlite but i dont want drizzle. i dont want another
fucking dependency."*

The replacement is built, tested and landed. Your job is the cutover: move every
caller onto it, then remove the old implementation. You are NOT redesigning the
bus. If you believe the design is wrong, post a finding and continue — do not
fork it.

---

## Pre-Verified Facts

The concierge ran every command below personally on 2026-08-16. Trust these; verify
anything not on this list before you assert it.

**The new bus — exists, tested, committed**
- `~/agent-core/primitives/tower/tower.mjs` — the whole bus, ~330 lines, zero deps.
- `~/agent-core/primitives/tower/tower.test.mjs` — `node primitives/tower/tower.test.mjs` → **14 passed, 0 failed**.
- Commits on `main`: `a382dbb` (core), `fee1993` (wake).
- `tower` is on PATH at `~/.local/bin/tower` (shim → `node ~/agent-core/primitives/tower/tower.mjs`). `tower stat` works.
- Live DB: `~/.tower/tower.db` (SQLite, WAL). Created on first write.

**Verbs (the entire surface):**
```
tower send  --from <who> [--to <agent>] [--topic <t>] [--kind <k>]
            [--dedup <key>] [--reply-to <id>] [--wake] <body>
tower inbox <consumer> [--limit N] [--json]
tower ack   <consumer> <id>
tower wake  <agent>
tower log   [--topic t] [--to agent] [--limit N] [--json]
tower stat
```

**Schema (two tables):** `msg(id,ts,sender,recipient,topic,kind,body,reply_to,dedup UNIQUE)`
append-only; `cursor(consumer,acked_id,updated)` — the only mutable table.
Unread is computed: `id > acked_id`. A new consumer starts at **0**, never at latest.

**Verified properties** (re-runnable, do not take on faith):
- 4 runtimes (node / bun / python3 / sqlite3 CLI) writing concurrently: **480/480 rows across 3 runs**, integrity ok, 0 dupes.
- Delivery is at-least-once. `--dedup` makes retry free.
- Live end-to-end: `tower send --to orch-credential-scrub --wake` → `{"woke":true,"pane":"w3R:p11"}`, prompt landed in the pane.

**SQLite is reachable with ZERO dependencies from every runtime this fleet uses** — verified:
`node:sqlite` (node v25.9.0) · `bun:sqlite` (bun 1.3.14) · python3 stdlib `sqlite3` (3.51.0) · `sqlite3` CLI (3.51.0).
Bun's `node:sqlite` imports but exports nothing — `tower.mjs` feature-detects. Do not "fix" this by adding a driver.

**shepherd — installed, running, is NOT a bus**
- `npm install --global @ryonakae/shepherd` done; `shepherd daemon start` running, socket `~/.shepherd/shepherd.sock`, state `~/.shepherd/state.db`.
- It is read-only observability. It has no send/reply/address verbs. It supplies **name → pane** resolution and durable `ag_*` identity. `tower wake` shells `shepherd agent list --all --json`.
- Do not route messages through shepherd. Do not modify shepherd.

**The old bus — what you are removing**
- `~/agent-core/primitives/mcps/tower/` — canonical source: `server.mjs`, `cli.mjs`, `lib.mjs`, `rotate.mjs`, `deposit.mjs`, `drift-check.mjs`, ~14 `*.test.mjs`, `hooks/` (ask-bridge, deposit-reminder, prompt-inject, stop-guard, write-gate), and 16 `*.md`.
- Deployed copy: `~/.tower/` — `server.mjs`, `cli.mjs`, `lib.mjs`, `rotate.mjs`, `hooks/` (11 files), `board.jsonl` (12,834 rows), `ledger.jsonl` (3,110), `odometer.jsonl` (1,080), `dead-letter.jsonl` (3), `pheromones.jsonl`, `*-pace.json`, `*.done`, `flight/`, `deliverables/`, `archive/`, `briefs/`, `cursors/`, `logs/`.
- **Full backup already taken:** `~/.tower-backup-20260816-204214.tar.gz` (5.7 MB, 1630 entries, verified readable). Nothing here is unrecoverable.

**Config holding old references** (counts verified by grep):
- `~/.claude/settings.json` — 17 hits
- `~/.claude.json` — 6 hits (MCP registration `"tower"`)
- `~/.cursor/mcp.json` — 2 hits (line 3 `"tower"`, line 7 `/Users/jrg/.tower/server.mjs`)
- `~/.cursor/hooks.json` — 0 hits
- pi extensions: `~/.pi/agent/extensions/tower-auto.ts`, `tower-lifecycle.ts`

**Code holding old references** — 25 files under `~/agent-core/primitives/` (hooks, mcps/tower, plugins/tower.ts, tools/statem/{statem.ts,twr.ts}, tools/fleet-task/tower.ts, tools/boot-card), 6 under `~/herdr-spine/` (`bin/handlers/_spine_common.py`, `cc-hooks/{ask-bridge,server}.mjs`, `extensions/tower-auto.ts`, `install.sh`, `uninstall.sh`), 1 in `~/cursor-shim/`, plus `~/.claude/hooks/grounding-hook.mjs`.

**Law/docs holding old references** — 30 `.md` under `primitives/`: `AGENTS.md`, `HARNESS-PARITY.md`, `rules/{ENFORCEMENT,control-flow,session-lifecycle,tower-orchestration}.md`, `profiles/{concierge,coordinator,orchestrator,coder,researcher}.md`, `skills/{brief,concierge,coordinator,ending-session,herdr}/SKILL.md`, `commands/tower.md`, and 16 under `mcps/tower/`.

---

## Ruling: no MCP server

The new bus is **CLI only**. The old one shipped an MCP stdio server and needed a
registration in every harness plus a per-harness adapter. A CLI reaches all of
them with none of that, and "minimal barebones" was the operator's explicit
instruction. Delete the MCP registrations; do not port `server.mjs`.

Consequence: `mcp__tower__*` tool names stop existing. Every doc, profile, and
skill naming them must name the CLI verb instead.

---

## Units

Work them in order. Units 1-2 are load-bearing for everything after.

### Unit 1 — Deploy + the python client
`tower.mjs` is the JS/CLI path. herdr-spine handlers are python and call
`sc.board_append(...)`; they must not shell out per message.

- Write `~/agent-core/primitives/tower/tower.py` — stdlib `sqlite3` only, mirroring
  send/inbox/ack/cursor semantics **exactly**, including: `busy_timeout` set per
  connection; `journal_mode` READ before write (setting it takes an exclusive lock
  and killed writes under load — this is a fixed bug, do not reintroduce it);
  `dedup` collision returns the existing id rather than raising.
- Repoint `~/herdr-spine/bin/handlers/_spine_common.py` `board_append` at it.
- **Done when:** a python handler and `tower` CLI interleave 100 writes each into
  one DB with 200 rows landed, 0 lost, `PRAGMA integrity_check` = ok; and
  `python3 -c "import tower"` needs no pip install.

### Unit 2 — Hooks
Migrate every hook off `~/.tower/lib.mjs` / `cli.mjs` onto `tower.mjs`'s exports
or the CLI. In `~/agent-core/primitives/hooks/` and `primitives/mcps/tower/hooks/`:
write-gate (+ `-pi.ts`, `-cursor.sh`), stop-guard, ask-bridge, deposit-reminder,
prompt-inject, flight-recorder, doorbell-cursor, spawn-door (+ `-pi.ts`),
session-boundary (`-pi.ts`, `-cursor.sh`), session-capture-cursor, odometer,
stop-verdict, session-start. Also `~/.claude/hooks/grounding-hook.mjs`.

The write-gate's claim/deposit check is the highest-risk item: it gates session
stop in all three harnesses. If it breaks open, completion discipline dies
silently; if it breaks closed, sessions cannot stop.

- **Done when:** every hook runs green under its own test; `write-gate.test.mjs`
  and `dead-letter.test.mjs` equivalents pass against the new store; and a live
  probe shows claim → refuse-stop, deposit → clean-stop, in CC.
- **Parity law applies** (`rules/ENFORCEMENT.md`): land CC + pi + cursor in the
  same unit, or the ledger row states the gap explicitly.

### Unit 3 — Config
Remove the `"tower"` MCP registration from `~/.claude.json` and `~/.cursor/mcp.json`;
repoint hook paths in `~/.claude/settings.json`; migrate `tower-auto.ts` and
`tower-lifecycle.ts` in `~/.pi/agent/extensions/` (and their `~/herdr-spine/extensions/` sources).
- **Done when:** `jq . ` parses every edited config; a fresh CC session starts with
  no `mcp__tower__*` and no hook errors in `~/.claude/logs`.

### Unit 4 — Tools
`primitives/tools/statem/{statem.ts,twr.ts}`, `tools/fleet-task/tower.ts`,
`tools/boot-card/boot-card.mjs`, `primitives/plugins/tower.ts`, plus the
`latch` and `boot-card` acceptance scripts that assert on board.jsonl.
- **Done when:** each tool's own test suite passes against the new store.

### Unit 5 — Delete the old bus
Only after 1-4 are green.
- `rm -rf ~/agent-core/primitives/mcps/tower/` and the stale deployed files in
  `~/.tower/` (`server.mjs`, `cli.mjs`, `lib.mjs`, `rotate.mjs`, `hooks/`, `*-pace.json`,
  `*.done`, `bridge-exempt`, `ask-bridge-state.json`, `write-gate-state.json`).
- **Keep** `~/.tower/tower.db`, `flight/`, `deliverables/`.
- **Do NOT migrate board.jsonl/ledger.jsonl data.** The operator said rip it out;
  the tarball is the archive. Move the JSONL files to `~/.tower/archive/pre-rebuild/`
  rather than deleting, then stop referencing them.
- **Done when:** `grep -rIl 'mcps/tower\|\.tower/cli\.mjs\|\.tower/lib\.mjs\|mcp__tower' ~/agent-core ~/herdr-spine ~/cursor-shim ~/.claude/hooks ~/.pi ~/.cursor --exclude-dir=node_modules --exclude-dir=.git` returns **zero** files outside `briefs/` and `archive/`.

### Unit 6 — Law
Rewrite the docs that describe the bus. `COMMS-ARCH.md` is the big one: its
delivery model, `mark_relayed` vocabulary, and pace/courier machinery all
describe a bus that no longer exists.
- `rules/ENFORCEMENT.md`: the row *"Board row is exactly one newline-terminated JSON object"* is obsolete (no JSONL). The row added 2026-08-17 for the delivery guarantee (private delivery verbs + `SPINE_COURIER` + `no-private-delivery.py`) describes a **courier/pace architecture the rebuild removes** — the cursor makes a courier unnecessary. Re-derive that row against the new bus; keep the `no-private-delivery` HOOK only if it still names a real failure.
- Update: `AGENTS.md` §Tower, `rules/{control-flow,session-lifecycle,tower-orchestration}.md`, all 5 profiles, all 6 skills, `commands/tower.md`, `HARNESS-PARITY.md`.
- Every law row names its enforcer (DOOR/HOOK/DOCTRINE) or wears the honest label.
- **Done when:** no doc under `primitives/` instructs an agent to call `mcp__tower__*`, `board_post`, `check_inbox`, or `mark_relayed`.

---

## Superseded work — stop it, don't merge it

`ORCH comms-substrate` and `ORCH deposit-courier` are building a courier + pace
outbox for the OLD bus (see the `ENFORCEMENT.md` row dated 2026-08-17, and
`briefs/comms-substrate/`). **That architecture is obsolete**: a per-consumer
cursor removes the need for a courier, a pace file, and the six private
outboxes at once. Nothing is ever "marked delivered", so nothing can be dropped
on pace.

Salvage before you discard: `DELIVERY-CENSUS.md` (the 99/308 measurement) is
evidence and must be kept; the `no-private-delivery.py` hook may still name a
real failure. The pace/courier implementation is dead.

Post a finding to topic `tower/cutover` recording what you salvaged and what you dropped.

---

## Standing rules

- **Evidence before assertion.** Every claim in a report cites a command run this
  session. `UNKNOWN` is a complete answer.
- **Do not bypass** `credential-guard`, the grounding hook, the write-gate, or the
  spawn-door. A refusal is information. If the grounding hook blocks a second
  write, Read the file first — do not push a door that says pull.
- Stage explicitly. Never `git add -A`.
- Commit convention per `AGENTS.md` (PHASE/DONE/TODO/BLOCKED, Co-Authored-By).
- **Push on green** to `jcbbge` remotes. Arc's `Infinity-Hospitality/arc` is gated — never push there.
- Report on the new bus: `tower send --from <you> --to claude-concierge --kind finding --topic tower/cutover "<body>"`. Dogfooding it is part of the acceptance.
- Spawn workers through `spine-spawn` with profiles; briefs name roles, never models or harnesses.

## Report back

To `claude-concierge` on topic `tower/cutover`, per unit: what landed, the command
that proves it, and what you left open. A unit is not done because it was
attempted — it is done when its done-when condition was run and passed.
