# ORCH — tower-law: rewrite the law that describes a bus which no longer exists

You own **Unit 6** of the tower cutover. Parent: `ORCH tower-cutover` (the
coordinator seat) — report to `orch-tower-cutover`.

Read `briefs/tower-rebuild/CORD-tower-cutover.md` for the operator ruling. This
brief is the part you own; where they differ, **this brief wins**.

Your unit is documentation, which means it is the unit most likely to be done
carelessly and the one whose defects last longest. Every one of these files is
**injected into a live agent's context at wake**. A doc that tells an agent to call
`mcp__tower__board_post` after this cutover is not stale prose — it is a runtime
instruction to call a tool that does not exist, and the agent will burn a turn
discovering that. Treat each line as code.

---

## Pre-Verified Facts

Run by the coordinator on 2026-08-17. Trust these; verify anything not listed.

**The new bus — this is the vocabulary the law must now speak**
- `~/agent-core/primitives/tower/tower.mjs`, zero dependencies. Exports (verified by
  grep): `open()`, `send(db,m)`, `inbox(db,consumer,limit)`, `cursorOf(db,consumer)`,
  `ack(db,consumer,id)`, `log(db,{topic,recipient,limit})`, `resolvePane(name)`,
  `wake(db,name)`.
- `node primitives/tower/tower.test.mjs` → **14 passed, 0 failed** (run 2026-08-17).
- CLI on PATH at `~/.local/bin/tower`. The **entire** surface:
```
tower send  --from <who> [--to <agent>] [--topic <t>] [--kind <k>]
            [--dedup <key>] [--reply-to <id>] [--wake] <body>
tower inbox <consumer> [--limit N] [--json]
tower ack   <consumer> <id>
tower wake  <agent>
tower log   [--topic t] [--to agent] [--limit N] [--json]
tower stat
```
- Two tables: `msg(id,ts,sender,recipient,topic,kind,body,reply_to,dedup UNIQUE)`
  append-only; `cursor(consumer,acked_id,updated)` — the only mutable table.
- **Unread is computed**, not marked: `id > acked_id`. A new consumer starts at
  **0**, never at latest. Delivery is at-least-once; `--dedup` makes a retry free.
- Live DB `~/.tower/tower.db`. `tower wake <agent>` resolves a durable name to its
  current pane via `shepherd agent list --all --json` (best-effort) and delivers.

**The old vocabulary is dead.** These names must not survive anywhere under
`primitives/`: `mcp__tower__*`, `board_post`, `board_read`, `check_inbox`,
`mark_relayed`, `send_to_user`, `ask_user`, `reply`, `pheromone_emit`,
`pheromone_field`, `board.jsonl`, `ledger.jsonl`, `bun ~/.tower/cli.mjs`.

**Ruling: no MCP server.** The old bus shipped an MCP stdio server needing a
registration per harness plus a per-harness adapter. A CLI reaches all of them with
none of that, and "minimal barebones" was the operator's explicit instruction. Every
doc, profile, and skill naming an `mcp__tower__*` tool must name a CLI verb instead.

**Three conceptual deletions the docs have not caught up to.** These are the ones
that require thinking, not find-and-replace:

1. **Nothing is ever "marked delivered."** The old `mark_relayed` verb, the
   verbatim-relay guarantee, the pace files, the courier, and the six private
   outboxes all existed to solve "did this message get delivered?" A per-consumer
   cursor dissolves that question. `COMMS-ARCH.md`'s delivery model is describing
   machinery that no longer exists.
2. **The `no-private-delivery` / `SPINE_COURIER` law is orphaned.**
   `rules/ENFORCEMENT.md` gained a row on 2026-08-17 registering DOOR =
   `_spine_common` delivery verbs gated on `SPINE_COURIER=1`. **That enforcer was
   cancelled by this rebuild.** Re-derive the row against the new bus. Keep the
   `no-private-delivery` HOOK **only if it still names a real failure** — rule 1 of
   that scanner (a handler keeping its own `*-pace.json`) plainly still does; rule 2
   (a handler calling `notify`/`verified_prompt`) presumed the cancelled DOOR. This
   is a judgment call and it is yours; make it explicitly and defend it in one line.
3. **`ENFORCEMENT.md`'s row "Board row is exactly one newline-terminated JSON
   object" is obsolete** — there is no JSONL. Its integrity guarantee is now
   SQLite's, which is a different claim with a different enforcer.

**Enforcement law applies to every row you write** (`rules/ENFORCEMENT.md`,
2026-08-14): every law names its enforcer — **DOOR** (the sanctioned tool's only
path), **HOOK** (mechanical refusal), or the honest **DOCTRINE** label (unenforced;
a compilation bug, not a rule to remember harder). A new law lands with its enforcer
named or its DOCTRINE label explicit. **Do not silently upgrade a DOCTRINE row to
DOOR because the new bus feels tidier.** If the enforcer does not exist, the label
is DOCTRINE and that is the honest answer.

**Your file surface.** Thirty `.md` files under `primitives/` reference the old bus,
plus `~/.tower/COMMS-ARCH.md`:
- `primitives/AGENTS.md` §Tower — the canonical core, composed into every harness
  entrypoint at sync time. **Edit the canonical source, never a deployed entrypoint**
  (`~/.claude/CLAUDE.md`, `~/.pi/agent/AGENTS.md`, `~/AGENTS.md` are all generated).
- `primitives/HARNESS-PARITY.md`
- `primitives/rules/{ENFORCEMENT,control-flow,session-lifecycle,tower-orchestration}.md`
- `primitives/profiles/{concierge,coordinator,orchestrator,coder,researcher}.md`
- `primitives/skills/{brief,concierge,coordinator,ending-session,herdr,tup}/SKILL.md`
- `primitives/commands/tower.md`
- `~/.tower/COMMS-ARCH.md` — **the big one.**
- The 16 `.md` files under `primitives/mcps/tower/` are **deleted wholesale in Unit 5**.
  Do not edit them. If any contains law worth keeping, **say so in your report** and
  the coordinator will rule on where it lands before the delete runs.

**A constraint on the profiles.** `primitives/profiles/{concierge,coordinator,orchestrator}.md`
were committed at `7902624` less than an hour ago, wiring them to the new
`primitives/rules/two-queues.md`. Rebase your understanding on the current HEAD;
do not resurrect the pre-`7902624` text.

**Also true, and easy to break:** these profiles carry the fleet's stigmergic
coordination law, which speaks of `pheromone_emit` / `pheromone_field`. Those MCP
verbs are going away. Whether the stigmergic *field* survives as a `--topic` on the
new bus, or whether it goes away with the machinery, is **not settled** and is the
one genuine open question in your unit. Do not quietly delete a coordination law
because its verb changed, and do not invent a replacement verb that does not exist.
If the rubric cannot decide, escalate to the coordinator — that is what the seat is
for. Your nQ budget is 3.

---

## Tasks

### Task 1 — `~/.tower/COMMS-ARCH.md`
Rewrite it against the bus that exists. Its delivery model, `mark_relayed`
vocabulary, verbatim-relay guarantee, and pace/courier machinery all describe a
system that has been deleted.
- **Done when:** no verb in it is absent from the six-verb CLI surface above, and
  every routing claim it makes is one you can demonstrate with a `tower` command.

### Task 2 — the rules
`rules/{ENFORCEMENT,control-flow,session-lifecycle,tower-orchestration}.md`.
Includes the three conceptual deletions above.
- **Done when:** every row names DOOR / HOOK / DOCTRINE honestly; the JSONL-integrity
  row is gone or re-derived; the `SPINE_COURIER` row is re-ruled with your reasoning
  stated in one line.

### Task 3 — profiles, skills, commands, AGENTS.md
The five profiles, the six skills, `commands/tower.md`, `AGENTS.md` §Tower,
`HARNESS-PARITY.md`.
- **Done when:** the acceptance grep below returns zero, and every place that used to
  name an `mcp__tower__*` tool now names the CLI verb that replaces it.

### Task 4 — acceptance
- **Done when:**
```
grep -rIn 'mcp__tower\|board_post\|board_read\|check_inbox\|mark_relayed\|pheromone_emit\|pheromone_field\|board\.jsonl\|ledger\.jsonl\|\.tower/cli\.mjs' \
  ~/agent-core/primitives --include='*.md' \
  | grep -v '/mcps/tower/' | grep -v '/_attic/'
```
returns **zero lines**, and the same grep over `~/.tower/COMMS-ARCH.md` returns zero.
Paste the literal output.

---

## Touch ONLY

- `~/.tower/COMMS-ARCH.md`
- `~/agent-core/primitives/**/*.md` **except** `primitives/mcps/tower/**` (deleted in
  Unit 5 — read-only to you) and `primitives/_attic/**` (historical record — never edit)
- `~/agent-core/briefs/**` only to *read*

**Explicitly NOT yours** (other units own them, concurrently): every non-`.md` file
in the repo. `primitives/tower/**` · `primitives/hooks/**` · `primitives/tools/**` ·
`primitives/plugins/**` · `~/herdr-spine/**` · `~/.claude/settings.json` ·
`~/.claude.json` · `~/.cursor/mcp.json` · `~/.pi/agent/extensions/**`.

You will be documenting behavior that three sibling ORCHs are still implementing.
**Do not document what you wish were true.** If a doc needs a fact you cannot verify
because the code is still being written, mark it `UNKNOWN` and post a finding rather
than guessing — guess-and-disclose is banned by the epistemics law.

If your work needs a change in someone else's partition, **post a finding, do not
edit it**.

---

## Standing rules

- **Evidence before assertion.** Every claim cites a command run this session.
  `UNKNOWN` is a complete answer.
- Decompose into SUBTASKS and dispatch workers per `primitives/rules/two-queues.md`.
  One TASK = one worktree, one SUBTASK = one branch. You do not implement.
- **One write per file per thought.** These are long documents and the grounding
  guard blocks a second consecutive write to the same file with no evidence loaded
  between. Compose all edits to a file into a single call. If you genuinely need a
  second write, **Read it first, by contract** — the read comes before the attempt,
  not after the refusal. If the door says push, do not pull.
- Stage explicitly. **Never `git add -A`.**
- Commit convention per `AGENTS.md`. Push on green to `jcbbge` remotes only.

## Tower

```
tower send --from orch-tower-law --to orch-tower-cutover \
  --kind finding --topic tower/cutover "<body>"
```
Report per task. A task is done when its done-when condition was **run** and
**passed**. Read your inbox before going idle: `tower inbox orch-tower-law`.

## Report back with

1. The Task 4 acceptance grep, literal output.
2. Your re-ruling of the `SPINE_COURIER` / `no-private-delivery` ENFORCEMENT row,
   with the one-line defense.
3. Your ruling — or your escalation — on whether the stigmergic field survives, and
   under what verb.
4. Any law inside `primitives/mcps/tower/*.md` worth rescuing before Unit 5 deletes
   the directory, named file by file.
5. Every place you wrote `UNKNOWN` because a sibling unit had not landed yet.
6. Anything that contradicts this brief. A brief defect is the coordinator's fault
   — report it plainly.
