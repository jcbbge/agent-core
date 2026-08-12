# SAGT R3 — tower-stigmergy: the live emission edge (Tower + herdr-spine)

Mission: constellation-zg is gaining a stigmergic Tower design — Tower (~/.tower/) as a
pheromone bus for fleet work coordination. You are mapping the EXISTING emission edge:
how agent lifecycle events currently become signals, and what pheromone-like machinery
already runs on this machine. STRICTLY READ-ONLY: ~/.tower/ is the live message bus the
running fleet depends on, and herdr-spine is live infrastructure. Do NOT use emojis.

Model tier: researcher (cursor/composer-2.5:fast) — extraction against explicit questions.

## Pre-Verified Facts (CORD verified all of these personally, 2026-08-12)

- ~/.tower/ exists, is NOT a git repo. Contents: server.mjs, cli.mjs, lib.mjs,
  COMMS-ARCH.md, RESPONSIBLE-PARTY-AND-NQ.md, board.jsonl, ledger.jsonl, odometer.jsonl,
  deliverables/, flight/, hooks/, plus .bak copies and statem-*.json.
- Tower MCP tools (live): send_to_user, ask_user, reply, check_inbox, mark_relayed,
  board_post, board_read, relay_inbox. CLI: `bun ~/.tower/cli.mjs`.
- COMMS-ARCH.md (read in full this session): four planes (STATUS / FLEET MAIL /
  OPERATOR MAIL / OPERATOR DIRECTIVES); one rule — every message has exactly one
  audience, reaches it exactly once, in full. Status is not mail. Board topics are
  project-namespaced `<project-slug>/<topic>`. board_post refuses scratch/temp cwds.
  Known open items are enumerated in its Migration order section (items 4-6).
- ~/herdr-spine/bin/handlers/ contains: _spine_common.py, 10-notify, 15-restore-view,
  16-parent-wake, 20-reflex, 30-choreo, 40-tower-bridge.
- ~/herdr-spine/docs/ contains: pheromones.md, spawn.md, tower-bridge.md,
  spine-tokens.md, choreography.md, dispatcher.md, reflexes.md, sigils.md, inbox.md,
  greeting.md, wormholes.md, synthetic-agents.md, MANUAL.md, install.md, ctl-fleet.md,
  ACCEPTANCE*.md.
- ~/herdr-spine/bin/ contains spine-report, spine-claim, spine-spawn and more.
- herdr 0.8.0 emits pane.agent_status_changed events over ~/.config/herdr/herdr.sock
  (NDJSON, events.subscribe). States: idle, working, blocked, done, unknown.
- The brief skill documents spine-claim as "advisory coordination among cooperating
  workers" and points to herdr-spine/docs/pheromones.md for "the full contest-semantics
  and heartbeat-cadence contract" — this is already pheromone machinery. Study it.

## Parallel Work Notice

Two sibling researchers are in flight in the tower-stigmergy workspace:
- R1 owns constellation-zg Markdown docs; R2 owns constellation-zg src/ Zig code.
  You do NOT read /Users/jrg/constellation-zg at all.
Your partition: ~/.tower/ and ~/herdr-spine/ ONLY.

## Tower (mid-run communication)

- Post one CLAIM line when you start and one DONE line when finished, topic
  `constellation-zg/tower-stigmergy`. Your cwd for board purposes is
  /Users/jrg/constellation-zg (the project this work belongs to — post FROM that cwd;
  board_post refuses scratch dirs). No tower MCP in pi: append one JSON line to
  ~/.tower/board.jsonl — {"id":"<rand>","ts":"<iso>",
  "cwd":"/Users/jrg/constellation-zg","type":"finding","from":"sagt-r3-edge",
  "topic":"constellation-zg/tower-stigmergy","body":"..."}
- On this Herdr host: `/Users/jrg/herdr-spine/bin/spine-report task "R3 emission edge"`
  at start and `spine-report verdict "<result>"` at the end.
- Questions route up: write them in your notes file under a BLOCKED section and finish
  what you can; do not mail the operator.

## Tasks

1. Read ~/herdr-spine/docs/pheromones.md in full. Document the spine-claim pheromone
   contract: claim/heartbeat/release, TTL, contest semantics, storage location, file
   format. This is the machine's existing literal-pheromone system — map it precisely.
2. Read ~/herdr-spine/bin/handlers/10-notify and 40-tower-bridge (and _spine_common.py
   as needed). Document the event flow: herdr pane.agent_status_changed -> handler ->
   what exactly lands in board.jsonl / ledger.jsonl (row shapes, fields, topics).
   Note what 15/16/20/30 do at one line each.
3. Read ~/.tower/lib.mjs and server.mjs enough to document: board.jsonl and
   ledger.jsonl row schemas (every field), the scoped readers (boardFor/inboxState),
   how `to` addressing works, what the MCP tools write. Sample 3-5 real lines from
   board.jsonl and ledger.jsonl (tail) as concrete examples — quote them.
4. Read ~/herdr-spine/docs/spine-tokens.md and skim spawn.md. Document the pane token
   system (task/verdict/role/name) as a status channel: who sets tokens, who reads
   them, how they evaporate (restart), how CTRL/sidebar render them.
5. Answer with file:line citations:
   a. Today, how does a COMPLETED unit of work become visible, end to end? Where does
      the chain break (why does work "go into the void")?
   b. Today, how could an IDLE agent discover available work without polling? Is there
      any push/subscribe path to agents, or only human-facing surfaces?
   c. What addressing/routing exists (to:, topic namespacing, hierarchy) and what is
      missing for work-generated-by-X -> acted-on-by-Y routing?
   d. What decay/evaporation exists anywhere (token TTLs, claim TTLs, odometer)?
   e. Which COMMS-ARCH invariants constrain a pheromone-bus design, and which of its
      open migration items (4-6) intersect it?
6. Write findings to /Users/jrg/constellation-zg/workspace/research-tower-stigmergy-r3-edge.md
   — done when: the file exists, every claim carries a file:line citation from a file
   you read this session, ambiguities marked [UNKNOWN], anything beyond the code/docs
   labeled [PROPOSAL].
7. Final action: write the .done marker —
   `mkdir -p ~/agent-core/briefs/tower-stigmergy/.done && touch ~/agent-core/briefs/tower-stigmergy/.done/r3-edge`
   then post your DONE line to the board.

## Constraints

- STRICTLY READ-ONLY on ~/.tower/ and ~/herdr-spine/ — no edits, no CLI mutations,
  no board posts except your CLAIM/DONE lines, no test claims/releases via spine-claim.
- Touch ONLY: /Users/jrg/constellation-zg/workspace/research-tower-stigmergy-r3-edge.md
  (create), the .done marker, and your two board.jsonl lines. Do not commit.
- Epistemics: cite or [UNKNOWN]. The running fleet depends on these systems — observe,
  never perturb.

## Report back with (board DONE line body)

- Path to notes file, the end-to-end completion-visibility chain in one sentence, the
  single biggest gap for idle-agent work discovery, and any [UNKNOWN]s.
