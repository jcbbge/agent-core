# SAGT R2 — tower-stigmergy: code baseline extraction

Mission: constellation-zg (Zig agent-factory OS, ~/constellation-zg) is gaining a
stigmergic Tower design. You are extracting what the repo's Zig code ACTUALLY implements
for pheromone/stigmergic coordination, so a design doc can be written against fact.
Read-only research. Do NOT use emojis anywhere.

Model tier: researcher (cursor/composer-2.5:fast) — extraction against explicit questions.

## Pre-Verified Facts (CORD verified all of these personally, 2026-08-12)

- Repo root: /Users/jrg/constellation-zg. Zig 0.16.0 project (build.zig, src/).
- `rg -li pheromone src/` hits: src/core/actor.zig, src/core/fleet.zig,
  src/core/markarian.zig, src/core/nebula.zig, src/core/pheromone.zig,
  src/core/primitive.zig, src/core/simulate.zig, src/root.zig
- File sizes (wc -l, this session): pheromone.zig 315, nebula.zig 325, fleet.zig 188,
  markarian.zig 559, actor.zig 534, primitive.zig 107.
- src/core/ also contains: broadcast.zig, discovery.zig, event.zig, ingest.zig, loop.zig,
  orbit.zig, orchestrator.zig, polaris.zig, provider.zig, registry.zig, render.zig,
  session.zig, spawn.zig, spawn_harness.zig, spawn_harness_bridge.zig, spine.zig,
  star.zig, telemetry.zig
- src/harness/ contains: config.zig, firmament.zig, http_transport.zig, memory.zig,
  pipeline.zig, provider.zig, root.zig, star.zig + *_test.zig files
- nebula/directives/ holds 12 star directive files (6 stars x v1/v2).
- WORK.md:59 claims "Pheromone protocol complete — emit, read, detect, scan implemented —
  2026-05-03"; WORK.md:89 claims "pheromone ring wired — all 4 stars read and emit".
  VERIFY these claims against the code and say whether they hold.
- Zig stdlib reference if needed: ~/source/zig/std/ (rg only; do not run coraline).

## Parallel Work Notice

Two sibling researchers are in flight in the same workspace:
- R1 owns all Markdown DOCS (repo root .md, docs/, workspace/, journal/) — you do NOT
  analyze docs except where a code comment requires it.
- R3 owns ~/.tower/ and ~/herdr-spine/ — you do NOT read those.
Ignore any uncommitted changes in the repo. Concern yourself only with your task.

## Tower (mid-run communication)

- Post one CLAIM line when you start and one DONE line when finished, topic
  `constellation-zg/tower-stigmergy`, from cwd /Users/jrg/constellation-zg.
  No tower MCP in pi: append one JSON line to ~/.tower/board.jsonl —
  {"id":"<rand>","ts":"<iso>","cwd":"/Users/jrg/constellation-zg","type":"finding",
  "from":"sagt-r2-code","topic":"constellation-zg/tower-stigmergy","body":"..."}
- On this Herdr host: `/Users/jrg/herdr-spine/bin/spine-report task "R2 code baseline"`
  at start and `spine-report verdict "<result>"` at the end.
- Questions route up: write them in your notes file under a BLOCKED section and finish
  what you can; do not mail the operator.

## Tasks

1. Read src/core/pheromone.zig in full. Document: the pheromone data model (struct
   fields, types), the emit/read/detect/scan operations with exact signatures, storage
   format and paths, any decay/evaporation logic, any routing/addressing fields.
   Done when: every pub fn in pheromone.zig appears in your notes with a file:line cite.
2. Read src/core/nebula.zig in full. Document: the Nebula data model as IMPLEMENTED
   (paths, file formats, trajectory state), and how pheromones are stored/read there.
3. Trace the emit/read call sites: who emits pheromones (orbit.zig, polaris.zig,
   markarian.zig, fleet.zig, actor.zig, orchestrator.zig, simulate.zig, loop.zig)?
   For each call site: file:line, what triggers the emission, what type is emitted.
   Done when: every call site of pheromone emit/read/detect/scan functions is listed
   (rg for the function names; confirm each hit).
4. Answer with file:line citations:
   a. Is there any decay/evaporation implemented? Any TTL, strength decrement, expiry?
   b. Is there any routing — does a pheromone name a recipient, a role, a house?
   c. Is there anything that lets an IDLE agent discover available work?
   d. What is the nQ / orbit question protocol as implemented (orbit.zig, polaris.zig)?
   e. What does markarian.zig actually do about fleet status (watch loop, STATUS reads)?
   f. What event/signal kinds exist in event.zig / primitive.zig relevant to
      coordination (Pheromone, Silence, Decision, User)?
5. Write findings to /Users/jrg/constellation-zg/workspace/research-tower-stigmergy-r2-code.md
   — done when: the file exists, every claim carries a file:line citation from a file
   you read this session, ambiguities marked [UNKNOWN], anything beyond the code labeled
   [PROPOSAL].
6. Final action: write the .done marker —
   `mkdir -p ~/agent-core/briefs/tower-stigmergy/.done && touch ~/agent-core/briefs/tower-stigmergy/.done/r2-code`
   then post your DONE line to the board.

## Constraints

- Touch ONLY: /Users/jrg/constellation-zg/workspace/research-tower-stigmergy-r2-code.md
  (create) and the .done marker. Do not commit. Do not modify any other file.
- Read-only on all source. Do NOT run zig build or zig build test — read code only.
- Epistemics: cite or [UNKNOWN]. If WORK.md claims something the code doesn't have,
  say so plainly — that is a finding, not a problem to fix.

## Report back with (board DONE line body)

- Path to notes file, the implemented pheromone API surface (one line per pub fn),
  whether decay and routing exist in code (yes/no + cite), and any [UNKNOWN]s.
