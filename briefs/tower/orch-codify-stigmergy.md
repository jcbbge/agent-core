Codify stigmergic coordination + nQ semantics into infrastructure doctrine files. Do NOT use emojis anywhere.

You are ORCH for `tower/codify-stigmergy`. CORD Tower coordinates. Practice the loop you are codifying: claim the field WA (or child WAs you emit), heartbeat every ~20s, work-done with ref + evidence. Board topic: `tower/codify-stigmergy`.

## Pre-Verified Facts (CORD verified 2026-08-13 resume)

- Unit brief (read in full first): `/Users/jrg/agent-core/briefs/codify-stigmergy-and-nq.md`
- nQ authority (read in full before writing a word of Part 3): `/Users/jrg/agent-core/primitives/mcps/tower/RESPONSIBLE-PARTY-AND-NQ.md` — also deployed via symlink at `~/.tower/RESPONSIBLE-PARTY-AND-NQ.md`
- COMMS-ARCH plane 5 already names the field; extend it — do not rewrite planes 1–4 from scratch. Canonical: `~/agent-core/primitives/mcps/tower/COMMS-ARCH.md` (symlinked to `~/.tower/COMMS-ARCH.md`). Editing canonical updates deployed.
- control-flow.md: `~/agent-core/primitives/rules/control-flow.md`
- Profiles: `~/agent-core/primitives/profiles/{coordinator,orchestrator,coder,researcher,concierge}.md`
- brief skill: `~/agent-core/primitives/skills/brief/SKILL.md` (already has a pull-loop section — extend, keep consistent)
- cursor-fleet: `~/cursor-shim/rules/cursor-fleet.md` (comms section still says four planes / push framing — bring in step)
- Partition: CORD bus-data owns board.jsonl writer/schema. You own field/pheromone SEMANTICS + doctrine prose. If nQ fields imply a pheromones.jsonl row-shape change, post the proposed shape to `tower/bus-data` and do not unilaterally change the writer.
- Quote the law; do not paraphrase where restating existing rules.
- Prior CORD WA evaporated after claim without ORCH spawn (heartbeat shell died) — usability finding: document that claim TTL 30s requires a reliable heartbeat; propose fix in the doctrine if the loop is awkward.
- Parent WA id at dispatch: see field `tower/codify-stigmergy` open/claimed (claim with ref).
- Do not touch Arc or constellation fleets' files.
- agent-core branch first; small commits; CORD lands to main after verify.

## Parallel Work Notice

- ORCH a6-baseline on w2Y:p1E is a separate unit (`agent-core/a6-baseline`) — ignore; do not claim its files or board topic.
- Ignore unrelated dirty trees in agent-core.
- Wave-rollup already landed — do not reopen.

## Tower

- Board: `tower/codify-stigmergy`
- Field from `~/agent-core` cwd. Evidence mandatory.
- Progress findings at every real checkpoint.

## Tasks

1. Branch `docs/codify-stigmergy-nq` from agent-core main — done when: branch exists.
2. Part 1 — stigmergic mandatory for ranks 1–4 in COMMS-ARCH plane 5 + control-flow + coordinator/orchestrator/coder/researcher profiles: deposit never deliver; route is derivation hint not address; pull loop; two stopping states only; decay as coordination; spine-claim vs field complementary; stalled fleet = wrong brief not missing scheduler. Done when: files cite COMMS-ARCH / pheromones.md contest semantics; wording agrees by construction.
3. Part 2 — concierge exception in concierge.md + COMMS-ARCH + control-flow: may address panes (plane 4); MUST leave board trace. Done when: exception stated once clearly.
4. Part 3 — nQ on the field in RESPONSIBLE-PARTY-AND-NQ.md + COMMS-ARCH: need-help carries nq + route derivation one link up; ref binds to ledger question id; escalation is append-only trace event; **nQ=0 before work-done/deliverable** — specify how the field expresses and checks (refuse or need-help if open questions); one question → exactly one surface (no storm); operator only when budget spent via rank 0. Done when: orbit.zig vocabulary preserved; load-bearing invariant explicit; no regression of one-surface law.
5. Extend brief/SKILL.md + cursor-fleet.md to match — done when: no push-and-wait framing remains as standing instruction for ranks 1–4.
6. Practice finding: run available→claimed→heartbeat→done yourself; report whether the loop was usable; if awkward, propose the fix in the doctrine (this is acceptance-critical).
7. Land commits on the branch + `.done` at `briefs/tower/codify-stigmergy.done` + board FINAL finding. Do not merge to main — CORD gates.

## Constraints

- Touch ONLY the doctrine/profile/skill/cursor-fleet files listed in the unit brief. Prose doctrine, not runtime code — unless a tiny comment in emit schema docs is required to name new optional fields (prefer docs-only; row-shape → bus-data).
- No mocks. Quote existing law verbatim when restating.
- Verification: `rg` checks that profiles contain pull-loop / two stopping states; COMMS-ARCH mentions nQ=0 before deliverable; RESPONSIBLE-PARTY has field expression section.

## Report back with

- Commit SHAs on the branch
- Per-file summary
- Loop usability finding (mandatory)
- Any proposed pheromone shape change posted to tower/bus-data (or none)
- Field claim/done ids
- Deviations
