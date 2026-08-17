# ORCH — tower-hooks: migrate every hook off the old bus, and stop before the flip

You own **Unit 2** of the tower cutover, and you **stage** Unit 3. Parent:
`ORCH tower-cutover` (the coordinator seat) — report to `orch-tower-cutover`.

Read `briefs/tower-rebuild/CORD-tower-cutover.md` for the operator ruling. This
brief is the part you own; where they differ, **this brief wins** — it carries
corrections the coordinator verified afterwards.

This is the highest-risk unit in the cutover. Read the two laws below before you
read the tasks.

---

## LAW 1 — you do not flip the live config

`~/.claude/settings.json`, `~/.claude.json`, and `~/.cursor/mcp.json` are **live**.
Five other agent panes are running on this machine right now, and every one of them
executes these hooks on every tool call. A bad edit does not fail your unit — it
fails everyone's session simultaneously, including the coordinator's.

So: **build and prove the migrated hooks at their new paths. Do NOT edit
`~/.claude/settings.json`, `~/.claude.json`, or `~/.cursor/mcp.json`.** When your
hooks are green, post READY with the exact diff you would apply, and the
coordinator performs the flip at a quiet moment and reports the result back to you.

Writing a `.proposed` file next to the real one is fine. Editing the real one is a
service failure.

## LAW 2 — the write-gate is the dangerous one

The write-gate's claim/deposit check gates session **stop** in all three harnesses.
If it breaks **open**, completion discipline dies silently and nobody notices for
days. If it breaks **closed**, no session on this machine can stop. Test both
directions explicitly and show both in your report. "It didn't error" is not a test.

---

## Pre-Verified Facts

Run by the coordinator on 2026-08-17. Trust these; verify anything not listed.

**The new bus**
- `~/agent-core/primitives/tower/tower.mjs` — zero dependencies. Exports (verified
  by `grep -n '^export' primitives/tower/tower.mjs`): `open()`, `send(db,m)`,
  `inbox(db,consumer,limit)`, `cursorOf(db,consumer)`, `ack(db,consumer,id)`,
  `log(db,{topic,recipient,limit})`, `resolvePane(name)`, `wake(db,name)`.
- `node primitives/tower/tower.test.mjs` → **14 passed, 0 failed** (run 2026-08-17).
  That suite includes a case named *"concurrent cold-start writers (the pattern
  hooks use)"* — 50 concurrent cold-start sends, all exit 0, each landing exactly
  once. **That is your pattern.** Hooks are cold processes; the bus is built for it.
- CLI on PATH: `~/.local/bin/tower`, verbs `send|inbox|ack|wake|log|stat`.
- Live DB: `~/.tower/tower.db`. Unread is computed (`id > acked_id`); a new consumer
  starts at **0**, never at latest. Delivery is at-least-once; `--dedup <key>` makes
  a retry free — that is the right tool for a hook that may fire twice.

**Ruling: no MCP server.** `mcp__tower__*` ceases to exist. Any hook that matches on
an `mcp__tower__*` tool name (there is one — see below) is matching a name that will
never fire again. That hook is not "ported"; its matcher is obsolete.

**The live CC hook registrations** — read out of `~/.claude/settings.json` on
2026-08-17. Eleven distinct hooks resolve into `~/.tower/hooks/`:

| Event | Matcher | Command |
|---|---|---|
| SessionStart | `*` | `.tower/hooks/session-start.mjs` |
| UserPromptSubmit | `*` | `.tower/hooks/prompt-inject.mjs` |
| PreToolUse | `Agent\|Task` | `.tower/hooks/enforce-brief.mjs` |
| PreToolUse | `AskUserQuestion` | `.tower/hooks/ask-bridge.mjs pre` |
| PermissionRequest | `*` | `.tower/hooks/ask-bridge.mjs pre` |
| PostToolUse | `mcp__tower__ask_user` | `.tower/hooks/ask-bridge.mjs post` ← **obsolete matcher** |
| PostToolUse | `Agent\|Task\|Workflow` | `.tower/hooks/odometer.mjs` |
| PostToolUse | `Bash` | `.tower/hooks/deposit-reminder.mjs` |
| SubagentStop | `*` | `.tower/hooks/odometer-stop.mjs` |
| Stop | `*` | `.tower/hooks/stop-guard.mjs` |
| Stop | `*` | `.tower/hooks/write-gate.mjs` |
| Stop | `*` | `.tower/hooks/stop-verdict.mjs` |
| Stop | `*` | `.tower/hooks/ask-bridge.mjs sweep` |
| SessionEnd | `*` | `.tower/hooks/ask-bridge.mjs clear` |
| SessionEnd / PreCompact | `*` | `.tower/hooks/flight-recorder.mjs` |

**The CORD brief's hook list is incomplete** — it does not name `enforce-brief.mjs`,
`odometer.mjs`, or `odometer-stop.mjs`, all three of which are live. Work from the
table above, not from that list.

**Canonical sources vs deployed copies.** `~/.tower/hooks/` is a *deployed copy*;
the canonical source is `~/agent-core/primitives/mcps/tower/hooks/`. That directory
is **deleted in Unit 5**. Migrated hooks therefore need a new canonical home —
`~/agent-core/primitives/hooks/` is where every other live hook already lives
(`spawn-door.sh`, `utensil-guard.mjs`, `write-gate-pi.ts`, `write-gate-cursor.sh`,
`session-boundary-*`, `flight-recorder.mjs`, `stop-verdict.mjs`,
`session-capture-cursor.mjs`, `doorbell-cursor.sh`, `credential-guard.sh`, …).
Land your migrated hooks there. Say in your report how they get deployed to
`~/.tower/hooks/` — or whether the deploy step should stop existing.

**Files in `primitives/hooks/` that still reference the old bus** (grep counts,
2026-08-17):
```
4  primitives/hooks/tower-ledger.mjs        ← re-exported wholesale by the old lib.mjs
2  primitives/hooks/session-boundary-cursor.sh
1  primitives/hooks/spawn-door.sh
1  primitives/hooks/spawn-door-pi.ts
   primitives/hooks/tower-ledger-diff.test.mjs
   primitives/hooks/tower-pheromone.test.mjs
1  ~/.claude/hooks/grounding-hook.mjs
```
Note `primitives/mcps/tower/lib.mjs:6` is `export * from '../../hooks/tower-ledger.mjs'`
— the old lib is a thin re-export shell over `tower-ledger.mjs`. Understand that
relationship before you decide what `tower-ledger.mjs` becomes.

**Backup exists.** `~/.tower-backup-20260816-204214.tar.gz` (5.7 MB, 1630 entries,
verified readable). Nothing under `~/.tower/` is unrecoverable.

---

## Tasks

### Task 1 — migrate the eleven live CC hooks
Every hook in the table above moves off `~/.tower/lib.mjs` / `cli.mjs` onto
`tower.mjs`'s exports (import the module) or the `tower` CLI. Prefer the module —
these are hot paths and a subprocess per tool call is a real cost.

For each hook, decide and state: **ported**, **rewritten**, or **retired because
its reason for existing was the MCP server**. Retiring a hook whose purpose is gone
is a correct outcome; porting dead code is not.

- **Done when:** each hook runs green under its own test, and each one is exercised
  as a cold process the way the harness actually invokes it (stdin payload in,
  exit code + stdout out). Name the command per hook.

### Task 2 — the write-gate, both directions
The equivalents of `primitives/mcps/tower/write-gate.test.mjs` and
`dead-letter.test.mjs` pass against the new store.

- **Done when:** a live probe in Claude Code shows **claim → stop refused** and
  **deposit → stop clean**, and you paste both observed outcomes. Both directions
  or it isn't tested.

### Task 3 — parity across all three harnesses
`rules/ENFORCEMENT.md` parity law applies: CC + pi + cursor land in the same unit,
or the report states the gap explicitly and says why. In scope:
`write-gate-pi.ts`, `write-gate-cursor.sh`, `spawn-door-pi.ts`, `spawn-door.sh`,
`session-boundary-pi.ts`, `session-boundary-cursor.sh`, `session-capture-cursor.mjs`,
`doorbell-cursor.sh`, plus `~/.claude/hooks/grounding-hook.mjs`.

- **Done when:** `grep -rIn 'mcps/tower\|\.tower/cli\.mjs\|\.tower/lib\.mjs\|mcp__tower' ~/agent-core/primitives/hooks ~/.claude/hooks`
  returns zero hits, and each harness's hook has been executed at least once with a
  realistic payload.

### Task 4 — stage the config flip, do not perform it
Produce the exact edits for `~/.claude/settings.json` (repointed hook paths, the
obsolete `mcp__tower__ask_user` matcher removed), `~/.claude.json` (drop the
`"tower"` MCP server entry), and `~/.cursor/mcp.json` (drop `"tower"`, line 3, and
its `/Users/jrg/.tower/server.mjs` arg on line 7). Also stage the migration of
`~/.pi/agent/extensions/tower-auto.ts` and `tower-lifecycle.ts`, whose sources live
at `~/herdr-spine/extensions/`.

Write them as `.proposed` files or a patch. **Do not apply them.**

- **Done when:** every proposed config parses (`jq . <file>` exit 0 against the
  proposed content), the diff is posted to the coordinator, and you have said in
  one sentence what breaks if it is applied while other panes are running.

---

## Touch ONLY

- `~/agent-core/primitives/hooks/**`
- `~/.claude/hooks/grounding-hook.mjs`
- `~/herdr-spine/extensions/tower-auto.ts`, `~/herdr-spine/extensions/tower-lifecycle.ts`
- `~/.pi/agent/extensions/tower-auto.ts`, `~/.pi/agent/extensions/tower-lifecycle.ts`
- `*.proposed` / patch files anywhere

**Read-only, being deleted in Unit 5:** `~/agent-core/primitives/mcps/tower/**` —
read it all you like, write nothing into it.

**Explicitly NOT yours** (other units own them, concurrently):
`~/herdr-spine/bin/**` and `~/herdr-spine/cc-hooks/**` (tower-spine) ·
`~/agent-core/primitives/tower/tower.py` (tower-spine) ·
`~/agent-core/primitives/tools/**` and `primitives/plugins/**` (tower-tools) ·
any `*.md` under `primitives/` (tower-law) ·
`~/.claude/settings.json`, `~/.claude.json`, `~/.cursor/mcp.json` (LAW 1 — coordinator).

If your work needs a change in someone else's partition, **post a finding, do not
edit it**.

---

## Standing rules

- **Evidence before assertion.** Every claim cites a command run this session.
  `UNKNOWN` is a complete answer.
- Decompose into SUBTASKS and dispatch workers per `primitives/rules/two-queues.md`.
  One TASK = one worktree, one SUBTASK = one branch. You do not implement.
- **Do not bypass** `credential-guard`, the grounding hook, the write-gate, or the
  spawn-door — least of all the ones you are migrating. Disabling a gate to test
  around it is the one failure mode this unit cannot survive. If the grounding hook
  blocks a second write, Read the file first.
- Test against a temp `TOWER_HOME`. **Never against the live `~/.tower/tower.db`.**
- Stage explicitly. **Never `git add -A`.**
- Commit convention per `AGENTS.md`. Push on green to `jcbbge` remotes only.

## Tower

```
tower send --from orch-tower-hooks --to orch-tower-cutover \
  --kind finding --topic tower/cutover "<body>"
```
Report per task. A task is done when its done-when condition was **run** and
**passed**, not when it was attempted. Read your inbox before going idle:
`tower inbox orch-tower-hooks`.

## Report back with

1. A line per hook: **ported / rewritten / retired**, with the command that proves it.
2. The write-gate probe, both directions, verbatim.
3. The parity statement — CC, pi, cursor — or the explicit gap and its reason.
4. The staged config diff, and the `jq` exit codes proving it parses.
5. Your answer to the open question this unit inherits: does the deploy step to
   `~/.tower/hooks/` still need to exist, or should hooks be run from
   `primitives/hooks/` directly?
6. Anything that contradicts this brief. A brief defect is the coordinator's fault
   — report it plainly.
