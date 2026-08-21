---
name: brief
description: Generate a spawn-ready agent brief from a task description. Enforces the delegation protocol (pre-verified facts, exact done conditions) plus every codified orchestration lesson - parallel-work notices, file partitions, floor baselines, no-mock testing, CI-exact verification, fleet comms via the muster skill. Use before fanning work out to subagents; pairs with the scout agent for fact verification.
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

## Purpose and intent
<Two or three sentences, plain language, no machinery: what this unit is FOR
and why it exists. An agent that cannot say this cannot open a session with the
operator. REQUIRED whenever the brief seats an operator-facing session.>

## Vocabulary (REQUIRED when the brief carries domain terms)
<Every domain term the agent will use, defined, with provenance and confidence.
One row per term: the term | what it means | who said it and where | whether it
is defined anywhere or is an open unknown.>

| Term | Meaning | Provenance | Status |
|---|---|---|---|
| <"against the wood wall"> | <a stack destination inside a building> | <Maggie, transcript 0819> | <UNDEFINED — no bin granularity exists> |

<A term lifted from a transcript is NOT shared vocabulary just because it sits
in quotation marks. If the brief cannot define it, mark it UNDEFINED here — that
is the honest state and it belongs in the brief, not discovered mid-session.>

## Pre-Verified Facts (lead verified all of these personally)
- <file X exists at /absolute/path; cited code confirmed at :NN>
- <command Y: `exact command` run from /dir — exits 0, output: ...>
- <test baseline: at least N pass, 0 fail — count may GROW while you work>
- <env quirks: e.g. wrapper scripts, NEVER-do variants and why>

## Parallel Work Notice
<who else is in flight, which files they own, "ignore uncommitted changes to
X/Y/Z — do not investigate, revert, or fix them. Concern yourself only with
your task."> <If fleet coordination matters: invoke the **muster skill** — post
reports to parent with `~/muster/bin/muster-deposit deposit --from <role> --to
<parent> --kind report --body "<...>"`; read your inbox with `~/muster/bin/muster-deposit
pending --to <role>` before claiming work.>

## Fleet comms (invoke the muster skill)

TOWER-WAIVED: retired bus absorbed by muster-deposit; durable comms go through the
**muster skill** only — do not call the retired bus (CLI, MCP, or its home dir).

Mid-run communication names the **muster skill** and **herdr skill** by skill
name — not hardcoded retired-bus paths or verbs. Do not paste either
encyclopedia into the brief.

- **Addressed mail (parent/child):** `~/muster/bin/muster-deposit deposit --from
  <role> --to <parent> --kind done|need-help|report|question --body "<...>"` —
  prints `dep-<id>`. Read inbox: `~/muster/bin/muster-deposit pending --to
  <role>`. Acknowledge: `~/muster/bin/muster-deposit collect <dep-id>`.
  Kinds and refusals: muster skill.
- **Operator-visible outcomes:** route through the coordinator (concierge
  plane); workers deposit `report`/`need-help`/`done` to parent — not to the
  operator directly unless the brief explicitly names an operator summons.
- **On a Herdr host (self-report):** invoke the **herdr skill** —
  `herdr pane report-metadata <id> --token task="<what I'm doing>"` at the start
  of each unit of work and `--token name="<result>"` when done, so the fleet
  sidebar shows purpose without attaching to the pane.
- **Resource ownership:** disjoint file partitions stated in every brief —
  do not teach `spine-claim`; there is no muster-claim binary.
- **MANDATORY — brief the stigmergic pull loop for ranks 1–4**, or the agent
  will park. This system is stigmergic by design (muster skill, comms-arch.md
  plane 5). A brief that only says "deposit a report to parent" teaches
  push-and-wait, and an agent taught that **stops the moment it has reported**
  — waiting for a scheduler that does not exist. Measured 2026-08-13: whole
  fleets parked simultaneously because every brief omitted this.
  **Scope (ranks 1–4 only).** Stigmergic coordination is MANDATORY for
  Coordinator → Orchestrator → Agent/Subagent (ranks 1–4). Those tiers
  coordinate **through the environment**, never by talking directly to each
  other. The **Concierge (rank 0) is the explicit exception** — it may
  address panes directly to facilitate the movable parts; that is operator
  directives, not a stigmergy violation. A directive delivered into a pane must
  also leave a trace on the field (muster-deposit).
  **Never teach push-and-wait for ranks 1–4.** Do not instruct workers to
  "post findings and wait," "route questions to the concierge," or treat a
  deposit as a stopping state. Addressed deposits are parent/child mail; the
  pull loop is how work moves. Brief both when needed, but the pull loop is
  the standing behavior — not "report and await instruction."
  Every brief for ranks 1–4 must carry the pull loop on muster-deposit verbs
  (invoke muster skill — do not invent bus verbs):
  - **Deposit** work others could take: `~/muster/bin/muster-deposit deposit
    --from <role> --to <parent> --kind report --body "<what, evidence
    mandatory>"` — an emit without evidence is not an emit.
  - **Read the field before ever going idle:** `~/muster/bin/muster-deposit
    pending --to <role>`.
  - **`done` / `need-help` deposits**, `--ref` what you claimed; **`need-help`**
    instead of going quiet.
  - **`need-help` carries nQ semantics** (muster skill / responsible-party law):
    include remaining escalation budget; `--ref` the question id; one question
    → exactly one surface. No storm.
  - **nQ=0 before deliverable.** An actor must not emit `done` while it holds
    unresolved questions. Post `need-help` (or close the question) first.
  - **Failure recovery for a dead claimant is UNKNOWN** — the durable log has
    no TTL/decay/heartbeat primitive. Do not brief cadences that do not exist.
    Do not claim abandoned work silently returns to the field. Post
    `need-help` naming the gap.
  - Verbs: `~/muster/bin/muster-deposit deposit`, `pending`, `collect` — full
    law in the muster skill.
  - State the two acceptable stopping conditions explicitly: **every
    done-condition met**, or **a posted `need-help` naming what is needed and
    who owns it, after proceeding with everything that does not depend on it.**
    "Reported and awaited instruction" is not a stopping state.

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

## Step 3b — Ground before machinery (operator-facing briefs)

**Operator correction, 2026-08-21 — he had to request this repeatedly across
several seats.** A brief that seats an interactive session with the operator MUST
carry `## Purpose and intent` and `## Vocabulary`, and MUST instruct the agent to
open with them, in this order: purpose and intent → vocabulary with provenance →
only then forks and options.

The failure being prevented: a technically flawless options table built on
vocabulary the operator never agreed to. He then spends his turn asking what the
words mean instead of deciding. Machinery-first reads as fluency and functions as
an interruption tax.

**The test:** if answering your decision request requires the operator to first
ask "what does that mean?", it is not a decision request — it is an unfinished
one.

Corollary for unknowns: an undefined term is a first-class `[UNKNOWN]`, named as
such. Never carry an undefined term inside a fork as though it were understood,
and never manufacture a definition to make a gate.

APPLIES: briefs seating operator-facing or concierge-facing sessions —
clay-blocking, discovery, design, anything conversational.
DOES NOT APPLY: worker/coder/implementer briefs whose only audience is another
agent already fluent in the machinery. Re-grounding there is noise.

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
"Coordinated fan-out contract" in the **herdr skill** (brief on disk, disjoint
partitions, muster-deposit, `.done` marker, coordinator gates).

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
  spawns missing Pre-Verified Facts / TOWER-WAIVED (with reason) /
  Report / done-when sections. Include `TOWER-WAIVED:` when fleet comms go
  through muster-deposit only.

Output the finished brief in a single fenced block, ready to paste into a
Task/Agent prompt. After it, list anything you could not verify and what you
recommend (scout run, user question) before spawning.

## Worked example — the 2026-08-21 incident this rule came from

A coordinator seat holding STG-676 (the "In-a-Night Sheet") presented the
operator a bounded three-sided shape and a two-option promote-or-hold fork. The
analysis was correct and the seat was honest about its unknowns. The operator's
reply was:

> "sorry, i need more contextual information to make an informed decision. i
> dont know what 'against the wood wall' means, i dont know what 'tour_ready'
> means? what is the purpose and intent of your assignment?"

Three separate failures in one reply, all upstream in the brief:

1. **Purpose and intent were never stated.** The seat knew why it existed; the
   operator was never told.
2. **`tour_ready` was carried as a machine-shaped identifier** for a concept
   with no definition anywhere. Formatting it as a field name implied a
   definition existed.
3. **"Against the wood wall" was quoted as though self-evident.** It is a stack
   destination inside a building, from Maggie's transcript, and no bin
   granularity exists to express it.

The seat's own diagnosis afterward was exactly right and worth keeping:
*"Fair — I've been talking machinery without laying the ground."*

The operator's framing of the fix, which is why this lives in the skill and not
in a one-off relay: *"it's not so much an issue with agents spawned but future
agents is my bigger concern."* A relay fixes one session. A brief-template
requirement fixes the class.
