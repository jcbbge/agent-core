Codify stigmergic coordination + nQ into doctrine. Do NOT use emojis anywhere.
Repo: ~/agent-core on branch docs/codify-stigmergy-nq. You are an AGNT under ORCH orch-codify-stigmergy (w2Y:p1F). CORD Tower coordinates. Do not commit — ORCH integrates.

## Pre-Verified Facts (ORCH verified 2026-08-13)
- Unit brief: /Users/jrg/agent-core/briefs/codify-stigmergy-and-nq.md (read in full before editing).
- Canonical COMMS-ARCH (symlinked to ~/.tower/COMMS-ARCH.md): ~/agent-core/primitives/mcps/tower/COMMS-ARCH.md — plane 5 already at lines 49–59; EXTEND do not rewrite planes 1–4.
- Canonical RESPONSIBLE-PARTY-AND-NQ (symlinked): ~/agent-core/primitives/mcps/tower/RESPONSIBLE-PARTY-AND-NQ.md — orbit.zig vocabulary at lines 13–20; ledger nQ in §2; ADD field-expression section; do not regress one-surface law (§2 "One question → exactly one surface. No storm.").
- control-flow.md Communications (§65–71) only points at COMMS-ARCH; needs ranks 1–4 stigmergy + concierge exception.
- Contest semantics (quote, do not paraphrase): ~/herdr-spine/docs/pheromones.md §"Contest semantics — read HONESTLY: advisory, not a lock" — spine-claim is advisory last-writer-wins, not a mutex; complementary to field work-distribution.
- brief/SKILL.md already has MANDATORY pull-loop at lines 74–102; extend with scope bound (ranks 1–4) + nQ fields; remove any standing push-and-wait framing.
- cursor-fleet.md Comms law still says "Four planes" (line 139) — bring to five + pull loop; path ~/cursor-shim/rules/cursor-fleet.md (separate repo; stage/commit there only if brief says so — default: edit file, ORCH commits).
- Quote existing law verbatim when restating. Partition: CORD bus-data owns board.jsonl writer; if nQ implies pheromones.jsonl row-shape, POST proposed shape to board topic tower/bus-data — do not change the writer.
- Prior incident: claim TTL 30s without reliable heartbeat evaporates work (CORD WA evaporated mid-dispatch). Doctrine must name this; propose fix if loop awkward.
- Branch exists: docs/codify-stigmergy-nq (verified `git branch --show-current`).

## Parallel Work Notice
- Sibling AGNTs on tower/codify-stigmergy with DISJOINT file partitions — do not touch their files.
- ORCH a6-baseline (agent-core/a6-baseline, w2Y:p1E) — ignore.
- Ignore unrelated dirty trees in agent-core.
- CORD bus-data owns board writer — post shape proposals only.

## Tower
- Board: tower/codify-stigmergy — CLAIM first, findings during, .done last.
- Field: claim your child WA with ref; heartbeat every ~20s (TTL 30s); work-done with ref + evidence when done-when met.
- From cwd ~/agent-core. Evidence mandatory on every emit.
- MCP: pheromone_emit / pheromone_field / board_post / board_read.

## Tasks (AGNT doctrine-law — YOUR PARTITION ONLY)
1. Extend COMMS-ARCH plane 5: stigmergy MANDATORY for ranks 1–4 (Coordinator→Orchestrator→Agent/Subagent); deposit never deliver; route is derivation hint not address (state the --to-pane/--to-role trap); pull loop; two stopping states only; decay as coordination; spine-claim vs field complementary (cite pheromones.md Contest semantics); stalled fleet = wrong brief not missing scheduler; claim TTL 30s requires reliable heartbeat (usability). Concierge exception (Part 2): may address panes via plane 4; MUST leave board trace. Part 3 nQ on field: need-help carries nq + route one link up; ref binds ledger question id; escalation append-only; **nQ=0 before work-done/deliverable** (how field expresses/checks — refuse or need-help if open questions); one question one surface; operator only via rank 0 when budget spent. — done when: rg shows nQ=0 before deliverable; plane 5 cites ranks 1–4 + contest; concierge exception once; planes 1–4 untouched in substance.
2. Extend RESPONSIBLE-PARTY-AND-NQ.md with field-expression section preserving orbit.zig quotes verbatim; field↔ledger binding via ref; no regression of one-surface. — done when: section exists; orbit.zig vocabulary preserved.
3. Extend control-flow.md tier duties / Communications: ranks 1–4 stigmergic; concierge facilitates, exempt from stigmergy, leave-a-trace. — done when: both duties stated.
4. If optional pheromone fields needed (nq, ledger_question_id), post proposed row-shape to tower/bus-data — do not edit writer. — done when: post or explicit "none".
5. Write .done at /Users/jrg/agent-core/briefs/tower/codify-stigmergy/workers/doctrine-law.done with: files touched, rg evidence lines, shape-post id or none, deviations.

## Constraints
- Touch ONLY: primitives/mcps/tower/COMMS-ARCH.md, primitives/mcps/tower/RESPONSIBLE-PARTY-AND-NQ.md, primitives/rules/control-flow.md. Do not commit.
- No mocks. Quote law verbatim when restating.
- Verification: `rg -n 'nQ=0 before|pull loop|two stopping|ranks 1–4|concierge exception|field expression' primitives/mcps/tower/COMMS-ARCH.md primitives/mcps/tower/RESPONSIBLE-PARTY-AND-NQ.md primitives/rules/control-flow.md`

## Report back with
- Paths edited + what each gained
- Proposed pheromone shape (or none) + bus-data board id if any
- rg verification output
- Field claim/done ids
- Deviations
