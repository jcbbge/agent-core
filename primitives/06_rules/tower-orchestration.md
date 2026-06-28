# Tower — Fleet Orchestration Protocol

Tower is the message bus between the user, the orchestrator (main agent), and every subagent/workflow/background task.

**Server:** `~/.tower/server.mjs` (MCP stdio)
**State:** Append-only JSONL in `~/.tower/` (namespaced by project cwd)
**Control panel:** `/tower` command

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     TOWER ORCHESTRATION                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ~/.tower/                                                      │
│  ├── server.mjs      ← MCP server (stdio)                       │
│  ├── cli.mjs         ← CLI interface                            │
│  ├── lib.mjs         ← Shared library                           │
│  ├── ledger.jsonl    ← Messages, questions, answers, acks       │
│  ├── board.jsonl     ← Blackboard (claims, findings)            │
│  ├── odometer.jsonl  ← Token burn tracking                      │
│  ├── deliverables/   ← Generated content files                  │
│  └── flight/         ← Session snapshots                        │
│                                                                 │
│  Project namespacing: entries record cwd, filtered by project   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## MCP Tools

| Tool | Purpose |
|------|---------|
| `send_to_user` | Surface message to user (deliverable/alert/progress) |
| `ask_user` | Ask user a question mid-run |
| `reply` | Record user's answer |
| `check_inbox` | Poll for answers |
| `mark_relayed` | Acknowledge after relaying verbatim |
| `board_post` | Claim file ownership, share findings |
| `board_read` | Check peer claims |

---

## The Verbatim Guarantee

Fleet messages of kind `deliverable` or `alert` **BLOCK** the orchestrator's turn-end until relayed to the user **verbatim** and acknowledged via `mark_relayed`.

Relay format: full content, attributed — "from <agent> (<time>): ..." — never summarized, never elided.

`progress` messages are ambient: they appear in `/tower`, never block, no ack needed.

---

## As Orchestrator

1. **Check `/tower` at turn start** — relay pending messages before starting new work
2. **Put Tower section in every spawn brief** — which kinds to send, what `from` name to use
3. **When questions surface** — present verbatim to user, call `reply` with their answer
4. **Before multi-agent fan-outs** — name a board topic so peers coordinate file claims
5. **Never end a turn with unrelayed messages** — the guard exists so nothing dies in a transcript

---

## As Subagent (Include in Briefs)

1. **Deliverables go through Tower** — your final message reaches only the orchestrator; anything the USER must see goes through `send_to_user(kind=deliverable)` immediately
2. **Hit a user-only decision?** — `ask_user`, keep working on unblocked items, poll `check_inbox`
3. **Post claims before touching shared surfaces** — `board_post` before editing files others might touch
4. **Read the board first** — `board_read` before assuming you can edit a file
5. **Progress at checkpoints only** — specific numbers, not heartbeats

---

## Tokenomics

Every spawn is recorded to `~/.tower/odometer.jsonl`. Check burn with `bun ~/.tower/cli.mjs burn`.

- **Pick model tier per brief** — haiku for mechanical work, sonnet for standard, top tier only for judgment
- **Reports from agents: structured and terse** — counts, paths, verdicts, not prose
- **A spawn that cost more than inline was a partitioning mistake** — note it in /retro

---

## Flight Recorder

Session snapshots saved to `~/.tower/flight/` — git status/diff/log + Tower pending. Read when summary feels thin after compaction.

---

## Maintenance

Ledger is append-only. Prune by deleting `~/.tower/ledger.jsonl` / `board.jsonl` when stale. Deliverable files persist independently.
