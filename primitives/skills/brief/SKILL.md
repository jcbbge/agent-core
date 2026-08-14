---
name: brief
description: Generate a spawn-ready agent brief from a task description. Enforces the delegation protocol (pre-verified facts, exact done conditions) plus every codified orchestration lesson - parallel-work notices, file partitions, floor baselines, no-mock testing, CI-exact verification, Tower etiquette. Use before fanning work out to subagents; pairs with the scout agent for fact verification.
argument-hint: "<task description, or 'milestone <id>' for audit-plan tasks>"
---

Produce a spawn-ready brief for: $ARGUMENTS

A brief passes one test: **"if the lead handed this task to a senior colleague,
would any detail be ambiguous? would any open question block them?"** If yes
anywhere, the brief is not done.

## Step 1 — Resolve ambiguity BEFORE drafting

Scan the task for forks: any "or", any acceptance criterion with two readings,
any decision the worker would have to make that the lead should own. Resolve
each from context, code, or by asking the user NOW. A fork delegated is a
coin flipped.

## Step 2 — Gather and verify facts

Collect every fact the worker needs: file paths with line numbers, commands
with their exact invocations, test baselines, API shapes, env quirks. Then
verify them — either yourself (run the commands, read the cited lines) or by
spawning the `scout` agent with the draft facts (read-only verifier; returns a
corrected, paste-ready facts section). Facts you did not verify do not go in
the brief.

## Step 3 — Compose, using exactly this structure

```
<one-paragraph mission statement: repo, stack, what this task is. "Do NOT use emojis anywhere.">

## Pre-Verified Facts (lead verified all of these personally)
- <file X exists at /absolute/path; cited code confirmed at :NN>
- <command Y: `exact command` run from /dir — exits 0, output: ...>
- <test baseline: at least N pass, 0 fail — count may GROW while you work>
- <env quirks: e.g. wrapper scripts, NEVER-do variants and why>

## Parallel Work Notice
<who else is in flight, which files they own, "ignore uncommitted changes to
X/Y/Z — do not investigate, revert, or fix them. Concern yourself only with
your task."> <If fleet coordination matters: "post claims/findings to the
Tower board (mcp__tower__board_post, topic '<project-slug>/<topic>' —
project isolation, COMMS-ARCH.md §Project isolation); read it before
claiming files (mcp__tower__board_read).">

## Tower (mid-run communication)
- Deliverables/results the user must see verbatim: mcp__tower__send_to_user
  (kind=deliverable, from=<your role>). Urgent/load-bearing: kind=alert.
- Progress with specific numbers at meaningful checkpoints: kind=progress.
- A decision only the user can make: mcp__tower__ask_user, then poll
  mcp__tower__check_inbox while continuing other work.
- Harnesses without the tower MCP (e.g. pi): post via the Tower CLI —
  `bun ~/.tower/cli.mjs post <claim|finding|note> <project>/<topic> "<body>" --from "<role>"`.
  The CLI records `cwd` from your real repo cwd (never scratch/temp), requires
  non-empty `from` for authored types, and defaults `from` to `cli:$USER` when
  omitted. Do not hand-append JSON to `board.jsonl`.
- On a Herdr host (self-report): call `/Users/jrg/herdr-spine/bin/spine-report
  task "<what I'm doing>"` at the start of each unit of work and
  `spine-report verdict "<result>"` when done, so the fleet sidebar shows
  purpose without attaching to the pane (see herdr-spine/docs/spine-tokens.md).
- On a Herdr host with file/resource ownership at stake (wave-2 K4): claim
  owned files/resources with `/Users/jrg/herdr-spine/bin/spine-claim claim
  "<resource>" --ttl 30` as the first action, refresh with `spine-claim
  heartbeat "<resource>" --ttl 30` at roughly ttl/3 (about every 10s for the
  30s default) for the life of the task, and `spine-claim release
  "<resource>"` when done — this is advisory coordination among cooperating
  workers, not a lock (see herdr-spine/docs/pheromones.md for the full
  contest-semantics and heartbeat-cadence contract). `spine-report`
  communicates *what* an agent is doing to a human glancing at the sidebar;
  `spine-claim` communicates *which resources* are owned to peer agents and
  the orchestrator — use both together.
- **MANDATORY — brief the STIGMERGIC FIELD, or the agent will park.** This
  system is stigmergic by design (`~/.tower/COMMS-ARCH.md` plane 5, and plane
  1: *"Pull-based: anyone who cares reads it"*). A brief that only says "post
  findings to board topic X" teaches push-and-wait, and an agent taught that
  **stops the moment it has reported** — waiting for a scheduler that does not
  exist. Measured 2026-08-13: 19 pheromone rows against 6,400 board rows, and
  a whole fleet of twelve parked simultaneously because every brief omitted
  this. `spine-claim` covers *resource ownership*; this is different — it is
  how *work itself* moves.
  **Scope (ranks 1–4 only).** Stigmergic coordination is MANDATORY for
  Coordinator → Orchestrator → Agent/Subagent (ranks 1–4). Those tiers
  coordinate **through the environment**, never by talking directly to each
  other. The **Concierge (rank 0) is the explicit exception** — it may
  address panes directly to facilitate the movable parts; that is plane 4
  (OPERATOR DIRECTIVES), not a stigmergy violation. A directive delivered
  into a pane must also be **recorded on the board** so the substrate carries
  it. See `~/.tower/COMMS-ARCH.md` plane 5 and
  `~/.tower/RESPONSIBLE-PARTY-AND-NQ.md`.
  **Never teach push-and-wait for ranks 1–4.** Do not instruct workers to
  "post findings and wait," "route questions to the concierge," or treat
  board posts as a stopping state. Fleet mail (board CLAIMs/findings) is
  plane 2; the pull loop (plane 5) is how work moves. Brief both when needed,
  but the pull loop is the standing behavior — not "report and await
  instruction."
  Every brief for ranks 1–4 must carry the pull loop:
  - **Emit** work others could take: `work-available` with topic, payload ref,
    and **mandatory evidence** (an emit without evidence is not an emit).
  - **Read the field before ever going idle.** Open work you can take, you
    claim (`work-claimed`, `ref`-ing the exact pheromone id) and do.
  - **`work-done`** `ref`-ing what you claimed; **`need-help`** instead of
    going quiet.
  - **`need-help` carries nQ semantics** (`~/.tower/RESPONSIBLE-PARTY-AND-NQ.md`):
    include `nq` (remaining escalation budget, default 3 minus escalation
    count); express the target as a **route derivation hint resolving one
    link up the lineage** — never a hard address; `ref` the ledger question id
    so the field and inbox planes stay one truth. One question → exactly one
    surface. No storm.
  - **nQ=0 before deliverable.** An actor must not emit `work-done` while it
    holds unresolved questions — *"nQ = the number of unresolved questions a
    star holds. A star must reach nQ=0 before emitting its deliverable."*
    (`orbit.zig:9`). Post `need-help` (or close the question via the ledger)
    first.
  - **Heartbeat your claims** — an unheartbeated `work-claimed` evaporates by
    design so the work returns to the field. That is the mechanism that
    protects the fleet from a dead agent, and it only works if agents actually
    heartbeat. **Claim TTL is 30s** — heartbeat at roughly ttl/3 (~every 10–20s)
    or the claim evaporates mid-task (2026-08-13: CORD work-available
    evaporated mid-dispatch without reliable heartbeat).
  - TTLs per D5: `work-available` 15–60 min, `work-claimed` 30s + heartbeat,
    `work-done` 24h, `need-help` nQ-bounded; read-time evaporation over an
    append-only log. Dedupe by id, ack by id, act at most once.
  - Verbs: MCP `pheromone_emit` / `pheromone_field`, or
    `bun ~/.tower/cli.mjs emit <scent> <topic> <payload_ref> [--ref id]
    [--to-role r] [--evidence path] [--ttl N]` and `… field`.
  - State the two acceptable stopping conditions explicitly: **every
    done-condition met**, or **a posted BLOCKED/`need-help` naming what is
    needed and who owns it, after proceeding with everything that does not
    depend on it.** "Reported and awaited instruction" is not a stopping state.

## Tasks
1. <precise action> — done when: <exact, testable condition>
2. ...

## Constraints
- Touch ONLY: <explicit file list>. Do not commit.
- Testing: NO MOCKS, ever (real DB/data per AGENTS.md Testing Policy; cite the
  exemplar test file if one exists).
- Verification: run exactly as CI does — <the project's exact commands and dirs>.
- Match surrounding code style; comments state constraints, not narration.

## Report back with
<exactly what the completion message must contain: per-file diff summary,
test tails, deviations with reasons>
```

## Step 4 — Profile choice (never provider/model/`--kind` in briefs)

Briefs name **profiles/roles only** (`coordinator`, `orchestrator`, `coder`,
`scout`, …). **Never** put a provider, model name, or `--kind` in a brief —
those belong in harness directives and `profile-model`, not in spawn text.

- **Spawn verbs:** `~/agent-core/primitives/directives/<harness>.md` for this
  session's root harness.
- **Model selection:** via `profile-model` at spawn time; the brief states the
  **profile** only.
- **Tokenomics:** default profile down; if the task is mechanical, say so in
  the task spec — do not name a model tier in the brief.

A brief that hardcodes opus/fable/sonnet/claude-as-kind or `--kind` is
invalid — rewrite to profile + harness directive.

## Step 5 — Partition check (multi-agent fan-outs)

If this brief is one of several running in parallel: verify the file
partitions are disjoint; tasks sharing a file share an agent. Tasks under ~10
lines of verified change: do inline, don't spawn. State the same partition map
in every brief.

Spawn substrate: **Herdr is the control plane on this machine** — interactive
workers spawn as TUI panes, unattended batch workers headless. Follow the
"Coordinated fan-out contract" in the `herdr` skill (brief on disk, disjoint
partitions, CLAIM/DONE on the board, .done marker, coordinator gates).

## Step 6 — Codified lessons (hard requirements, learned the expensive way)

- **CI-config conditionals are unverifiable locally.** Any `if:`/ternary-
  emulation (`cond && X || Y`) in workflow YAML inside a brief must be marked
  `LIVE-VERIFY REQUIRED` with an explicit pass criterion the agent checks in
  a real run's log (2026-06-11: `cond && 0 || 1` always yields 1 — falsy
  short-circuit; the spec called it pre-verified and it wasn't).
- **Report ALL files created — including config.** The report contract must
  say "list every file you created or modified, including dotfiles/config";
  an agent once added a load-bearing bunfig.toml and never mentioned it.
- **Thresholds are set in the GATE'S environment.** Coverage/size floors
  measured with extra infrastructure attached (a DB, secrets) are invalid —
  the brief must state the exact environment the gate runs in and require the
  number be measured there (2026-06-11: floor set from DB-attached coverage
  failed in the DB-less gate).
- **Worktree agents + git-hook managers collide.** `bun install`/`prepare`
  from a worktree can corrupt the shared repo's `core.hooksPath` (fix:
  `lefthook install --reset-hooks-path` from the main checkout). Worktree
  briefs must say: do not run dependency install; run ring-0 gate commands
  manually before pushing.
- **Enforcement note:** the PreToolUse hook `enforce-brief.mjs` blocks Agent
  spawns missing Pre-Verified Facts / Tower (or TOWER-WAIVED + reason) /
  Report / done-when sections. Waiving Tower is allowed only explicitly.

Output the finished brief in a single fenced block, ready to paste into a
Task/Agent prompt. After it, list anything you could not verify and what you
recommend (scout run, user question) before spawning.
