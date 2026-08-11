# Tower — Fleet Orchestration Protocol

**Scope: the orchestrator role only** — applies to the agent that decomposes
a block into chunks and delegates them (see the Workflow section of
CLAUDE.md). The coordinator (session agent) and workers ignore this file
entirely (do not check boards, do not spawn to satisfy it) — except that a
coordinator relaying fleet messages surfaced by the harness still relays them
verbatim.

Tower is the message bus between the user, the orchestrator (the main agent),
and every subagent/workflow/background task. Server: `~/.tower/server.mjs`
(MCP, tools under `mcp__tower__*`). State: append-only JSONL in `~/.tower/`.
Control panel: `/tower`. Brief generator: `/brief`. Pre-flight verifier: `scout` agent.

Comms law (the four planes, addressing, no-fabrication/no-truncation
invariants, notification pacing, project isolation) is owned by
`~/.tower/COMMS-ARCH.md` — this file states only the operator-facing
mechanics of driving Tower as an orchestrator/subagent; where the two would
otherwise disagree, COMMS-ARCH.md wins (it is dated later and is the
design of record).

## The verbatim guarantee (how send_to_user works here)

Fleet messages of kind `deliverable` or `alert` are meant to BLOCK the
orchestrator's turn-end (Stop hook, exit 2) until relayed to the user
**verbatim** and acknowledged via `mcp__tower__mark_relayed`. Addressing and
the four-plane model (STATUS/FLEET MAIL/OPERATOR MAIL/OPERATOR DIRECTIVES)
are governed by `~/.tower/COMMS-ARCH.md` — read it for the `to:"operator"`
rule this guarantee now depends on.

**Currently broken for `deliverable` (verified 2026-08-10, tracked at
COMMS-ARCH.md migration item 4):** the Stop-hook guard (`stop-guard.mjs`)
and `check_inbox` both read `inboxState()` (`lib.mjs`), which only treats a
`deliverable` as unrelayed when its row carries `to:"operator"` explicitly.
`send_to_user` (`server.mjs`) never sets `to` on any row it writes — so
every deliverable sent through the documented tool currently has `to`
undefined and can NEVER trigger the guard. `alert` still works as
documented (its row qualifies when `to` is undefined OR `"operator"`). Until
`send_to_user` mints `to:"operator"` on deliverables, do not rely on the
Stop hook to catch an unrelayed deliverable — relay it the moment it's
sent, same as before this guarantee existed.

Relay format: full content, attributed — "from <agent> (<time>): ..." —
never summarized, never elided. Deliverables are also written to
`~/.tower/deliverables/` (= `~/.claude/tower/deliverables/`, a symlink) as
files; mention the path when relaying.

`progress` messages are ambient: they appear in `/tower` and in prompt-time
context injections, never block, and need no ack.

## The brief gate — a hook HARD-BLOCKS non-compliant spawns (read before first spawn)

`~/.claude/tower/hooks/enforce-brief.mjs` (PreToolUse on Agent) rejects any spawn whose
prompt is ≥400 chars unless the brief contains ALL FOUR:

1. a **"Pre-Verified Facts"** section (that literal phrase, case-insensitive)
2. a **Tower** section (board topic + send kinds) — or an explicit waiver:
   `TOWER-WAIVED: <reason>` (e.g. single-turn report-back agent). Silent omission blocks;
   stated waiver passes.
3. a **"Report back with"** completion contract
4. explicit **done-when** conditions per task (`done when:` / `exits 0` / `must pass`)

Exempt: `scout`, `Explore`, `Plan`, `claude-code-guide`, `statusline-setup` agent types,
and prompts under 400 chars. Everything else — including hand-written and
madewell-template briefs — must carry the four sections ON THE FIRST ATTEMPT. Write them
in from the start (`/brief` includes all four); do not discover the gate by hitting it.

## As orchestrator

- **Every deliverable and ask_user ALSO rings the doorbell (2026-07-27, hard
  rule).** The coordinator relay is the verbatim channel, but it only fires when
  the coordinator's session is awake — on 2026-07-27 two human gates sat
  unrelayed for hours while the user believed the fleet was dead. The moment you
  call `mcp__tower__send_to_user` (kind=deliverable or alert) or
  `mcp__tower__ask_user`, also run:
  `herdr notification show "<gate/deliverable title>" --body "<one line>" --sound request`
  so the event reaches the human's screen the moment it exists. The notification
  is the doorbell; the Tower message remains the letter. Put this instruction in
  every worker/orchestrator brief you write.
- Put a Tower section in every spawn brief (use `/brief` — it includes one):
  which kinds to send, what `from` name to use, which board topic to share.
- When a fleet question surfaces (`ask_user`), present it to the user
  verbatim; when they answer, call `mcp__tower__reply` with the question id,
  quoting them faithfully. The asking agent is polling for it.
- Check `/tower` (or the injected [Tower] context) at turn start; relay before
  starting new work. Never end a turn around the guard — it exists so nothing
  the fleet surfaced for the user dies in an agent transcript.
- Before multi-agent fan-outs, name a board topic in the briefs so peers
  coordinate file claims and share findings instead of colliding.
- **Liveness doctrine (2026-07-23, project-agnostic, non-negotiable).** Workers
  spawn as Herdr panes in a dedicated `<task>-workers` tab (grid layout,
  --no-focus, close each pane when its worker finishes) so agent_status stays
  observable. Headless workers are the exception and require ALL of: per-worker
  log file, `.done` marker as final action, spawn-time CLAIM post to the board
  carrying the PID. Every worker's FIRST action is its CLAIM (pane id or PID).
  Never report a worker "launched" or "running" without pane- or process-level
  evidence (`pgrep -fl` — plain, never a chained/proxied grep, which has
  produced false "nothing running" readings). Silence + no pane/process
  activity for 10+ minutes = presumed dead; investigate immediately.

## As a subagent (these instructions belong in briefs)

- Your final message reaches only the orchestrator. Anything the USER must see
  exactly as written — generated content, drafted text, a result with exact
  numbers — goes through `mcp__tower__send_to_user` (kind=deliverable) the
  moment it exists, not at the end — AND rings the doorbell in the same breath:
  `herdr notification show "<title>" --body "<one line>" --sound request`.
  A deliverable without its notification is a letter with no doorbell — it
  waits for a relay leg that may be asleep.
- Hit a decision only the user can make? `mcp__tower__ask_user`, keep working
  on what is not blocked, poll `mcp__tower__check_inbox`.
- Post claims before touching shared surfaces and findings that would change a
  peer's plan to the board (`board_post`); read it first (`board_read`).
- Do not spam: progress at meaningful checkpoints with specific numbers, not
  heartbeats.

## Tokenomics (the odometer is watching)

Every Agent/Task/Workflow spawn is recorded to `~/.claude/tower/odometer.jsonl`
(PostToolUse hook); `bun ~/.claude/tower/cli.mjs burn` shows daily burn and
per-spawn detail, and `/tower` shows today's total. Use it:

- Pick the model tier per brief (the /brief skill, step 4): haiku for
  mechanical spec-complete work, sonnet for standard execution, top tier only
  for judgment. Defaulting everything to the largest model is the single
  biggest avoidable cost in fleet work.
- Reports back from agents: structured and terse (counts, paths, verdicts),
  not prose — orchestrator context is the scarcest resource.
- A spawn that cost more tokens than doing it inline was a partitioning
  mistake; note it in the next /retro.

## Flight recorder (context continuity)

PreCompact and SessionEnd snapshot the working state (git status/diff/log +
Tower pending) to `~/.claude/tower/flight/` — deterministic, no model in the
loop. SessionStart injects a pointer to the latest snapshot (<24h). After a
compaction or in a fresh session, read it when the summary feels thin: it is
the working set as it actually was, not as the summary remembers it.

## Self-inquiry

Run `/retro` at session end or after milestones: corrections, surprises,
waste, and friction become memories, rule edits, and brief-template fixes.
Lessons that live only in a conversation are lessons lost.

## Maintenance

The ledger and board are APPEND-ONLY, ALWAYS (2026-07-24: a mid-program
hand-edit truncated board.jsonl to 127 bytes and destroyed live coordination
state). Never hand-edit, rewrite, sed -i, or "clean up" either file while any
program is running — noise is acceptable, truncation is not. Prune ONLY
between programs, only by archiving (`mv board.jsonl board.$(date +%F).jsonl`),
never by deletion or in-place edits. Deliverable files persist independently.

## One truth plane (2026-07-24)

Herdr is the single human surface. The board plugs INTO it — board content
reaches the human through Herdr surfaces (spine notifications for alerts, the
greeting/inbox for digests, sidebar tokens for presence), never by asking the
human to read the file. Agents write the board (append-only) as the durable
machine ledger; humans see Herdr. A coordination plane the sidebar cannot
show is a plane that does not exist.
