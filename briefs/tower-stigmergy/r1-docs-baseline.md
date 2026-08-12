# SAGT R1 — tower-stigmergy: docs baseline extraction

Mission: constellation-zg (Zig agent-factory OS, ~/constellation-zg) is gaining a stigmergic
Tower design. You are extracting the DESIGNED stigmergic machinery from the repo's own
documents so a design doc can be written against fact. Read-only research. Do NOT use
emojis anywhere.

Model tier: researcher (cursor/composer-2.5:fast) — extraction against explicit questions.

## Pre-Verified Facts (CORD verified all of these personally, 2026-08-12)

- Repo root: /Users/jrg/constellation-zg (git repo). All paths below confirmed to exist this session.
- Docs to read (all exist): PROGRAM.md, VISION.md, TAXONOMY.md, TELEMETRY.md, WORK.md,
  VISUAL.md, AGENTS.md, compare_orchestration.md, UI_visualization_notes.md
- docs/ contains: ADLIYYE_CODEX.md, AUTONOMY_GRADIENT_0629.md, DAG_ARCHITECTURE_0629.md,
  HARNESS_RUNTIME_SPEC.md, RENDERING_ARCHITECTURE.md, RESONANCE_ARCHITECTURE_0629.md,
  TESTING_GUIDE.md (control-flow-magazine.html is generated art — skip)
- workspace/ contains: ORCHESTRATOR.md, handoff-latest.md, RESEARCH-orchestration-layer.md,
  prd-1-error-state-structure.md, prd-2-error-contract-spec.md, prd-3-nebula-error-pheromone.md,
  PRD-constellation-ui-*.md, cmd-k-brainstorm.md, tuna-transcript.md
- TAXONOMY.md:70 states: "Communication: Via Nebula (file-based pheromones), not direct IPC."
- TELEMETRY.md PRIMITIVE TAXONOMY section defines Signal primitives: Pheromone, Silence,
  User, Decision (~lines 598-609); FIVE OBSERVABILITY LAYERS section (~lines 612-645)
  puts desire lines / pheromones at Layer 4, stored in Nebula, NOT in the spine.
- WORK.md:59 records "Pheromone protocol complete — emit, read, detect, scan implemented —
  2026-05-03" and WORK.md:89 "pheromone ring wired — all 4 stars read and emit".
- VISION.md LINEAGE table: iteration 2 (TS) contributed "Pheromone model, stigmergic
  coordination, nQ=0 protocol" (archived ~/constellation-ts); PRIOR ART section lists
  ADR-009-surrealdb-as-constellation-nebula.md (stigmergic store design).
- journal/ dir exists at repo root (dispatches; skim for stigmergy-relevant entries only).

## Parallel Work Notice

Two sibling researchers are in flight in the same workspace:
- R2 owns src/ CODE (all .zig files) — you do NOT read src/ except to resolve a doc
  claim's pointer (cite, don't analyze code).
- R3 owns ~/.tower/ and ~/herdr-spine/ — you do NOT read those.
Ignore any uncommitted changes in the repo. Concern yourself only with your task.

## Tower (mid-run communication)

- Post one CLAIM line when you start and one DONE line when finished, topic
  `constellation-zg/tower-stigmergy`, from cwd /Users/jrg/constellation-zg.
  No tower MCP in pi: append one JSON line to ~/.tower/board.jsonl —
  {"id":"<rand>","ts":"<iso>","cwd":"/Users/jrg/constellation-zg","type":"finding",
  "from":"sagt-r1-docs","topic":"constellation-zg/tower-stigmergy","body":"..."}
- On this Herdr host: `/Users/jrg/herdr-spine/bin/spine-report task "R1 docs baseline"`
  at start and `spine-report verdict "<result>"` at the end.
- Questions route up: write them in your notes file under a BLOCKED section and finish
  what you can; do not mail the operator.

## Tasks

1. Read every doc listed above (skip the .html). For each, extract what it establishes
   about stigmergic coordination — done when every doc is either cited at least once in
   your notes or explicitly listed as "no stigmergic content".
2. Answer these questions, each with file + line citations:
   a. What pheromone/signal TYPES does the design define? (names, fields, lifecycle)
   b. What DECAY / evaporation mechanics are designed, if any?
   c. What ROUTING mechanics are designed — how does a signal find its actor?
      (nQ protocol, orbit, escalate_to_concierge, Polaris arbitration, Nebula paths)
   d. What EMISSION points are designed — when does an agent emit a pheromone?
   e. What is the Nebula data model as designed (paths, file formats, trajectory state)?
   f. What do the workspace/ PRDs (esp. prd-3-nebula-error-pheromone.md) specify?
   g. What does the design say about IDLE agents discovering work, if anything?
   h. What prior-art pointers exist (constellation-ts, ADR-009) and what do the docs
      claim is in them? (Do NOT read the archives — record the pointers only.)
3. Write findings to /Users/jrg/constellation-zg/workspace/research-tower-stigmergy-r1-docs.md
   — done when: the file exists, every claim carries a `file:line` citation from a file
   you read this session, ambiguities are marked [UNKNOWN], and anything you suggest
   beyond the docs is labeled [PROPOSAL].
4. Final action: write the .done marker —
   `mkdir -p ~/agent-core/briefs/tower-stigmergy/.done && touch ~/agent-core/briefs/tower-stigmergy/.done/r1-docs`
   then post your DONE line to the board.

## Constraints

- Touch ONLY: /Users/jrg/constellation-zg/workspace/research-tower-stigmergy-r1-docs.md
  (create) and the .done marker. Do not commit. Do not modify any other file.
- Read-only everywhere else. No builds, no tests — this is document research.
- Epistemics: cite or [UNKNOWN]. Do not invent pheromone mechanics the docs don't have.

## Report back with (board DONE line body)

- Path to notes file, count of docs read, the pheromone/signal type list you found
  (one line), and any [UNKNOWN]s that block the design phase.
