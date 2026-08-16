# CORD [Tower] — Substrate harden Phase 1 (GROUND ONLY)

**Operator mandate, 2026-08-14.** Concierge-filed from the operator's meta-prompt
plus prior research notes (Karpathy/Feynman harden brief; stigmergy transition;
Fut as secondary RuntimeAdapter consideration). Arc leftovers are PARKED until
this lane reports Phase 1 ground.

**You are the Coordinator for Tower.** Read, verify, decompose, brief, gate.
You do NOT implement. Phase 1 is discovery. Phase 2 prescribe is FORBIDDEN until
the operator (via concierge) opens it after reviewing your ground report.

Do NOT use emojis anywhere.

---

## Mission

Harden the real agent coordination substrate already on this machine. The
hierarchy is correct and preserved:

Operator → Coordination (CORD) → Orchestration (ORCH) → Sub-agents (AGNT/SAGT)

Herdr stays as the runtime unless Phase 1 proves it is the primary blocker
(it is not expected to be). The real problem is Tower: begun as a direct
messaging bus, forced toward a stigmergic medium, transition incomplete.

**Dominant failure mode (operator):** an agent finishes work; the runtime may
even report completed; yet no durable, typed, queryable trace is written;
other agents cannot sense what happened.

**Expert target (preserve; do not blank-slate redesign):** stigmergy with hard
discipline — typed traces in a shared substrate; semantic completion = successful
deposit, not Herdr lifecycle and not the agent's declaration; one official write
path; RuntimeAdapter is a later thin seam (Herdr today, Fut/fork/custom later).

Style: practical clarity + mechanistic insight. Cut complexity. Name actual
failure mechanisms. Ground in code that exists. Discover first. Only then
(Phase 2, later) prescribe the smallest changes.

---

## Pre-Verified Facts (concierge verified 2026-08-14 this session)

### Homes (do not re-litigate without evidence)

- **Canonical code (git-tracked):** `/Users/jrg/agent-core/primitives/mcps/tower/`
  — `server.mjs`, `cli.mjs`, `lib.mjs`, `rotate.mjs`, `COMMS-ARCH.md`,
  `RESPONSIBLE-PARTY-AND-NQ.md`, `hooks/`, tests, `DEPLOYMENT.md`, `README.md`.
- **Deployed runtime + ALL state:** `/Users/jrg/.tower/` — NOT a git repo.
  Most code paths are symlinks into the canonical dir; state JSONL lives only here.
- **Compat alias:** `/Users/jrg/.claude/tower` → `/Users/jrg/.tower`.
- **Share/install package (separate, not the runtime):** `/Users/jrg/tower-share/`
  (not a git repo; touched 2026-08-14).
- **W0 ruling (DEPLOYMENT.md):** code in agent-core, state in `~/.tower`,
  deploy via symlink. `git init ~/.tower` was considered and rejected (re-entangles
  code and live state). Extract to `~/tower` as a standalone product repo is an
  OPEN operator decision for Phase 2+, not Phase 1.

### Live stores (sizes at verification)

- `board.jsonl` ≈ 11663 lines — fleet blackboard (claims/findings/notes).
- `ledger.jsonl` ≈ 2812 lines — operator mail / questions / deliverables / acks.
- `pheromones.jsonl` ≈ 787 lines — stigmergic field (plane 5).

### Live pheromone scent histogram (failure-mode signal)

- `work-claimed` 518
- `work-done` 146
- `work-available` 109
- `need-help` 14

Claim≫done is consistent with "finish without durable completion trace."

### Official write/sense surfaces already in code (`server.mjs`)

- **Direct/mail plane:** `send_to_user`, `ask_user`, `reply`, `check_inbox`,
  `mark_relayed`, `relay_inbox` → `ledger.jsonl`.
- **Board plane:** `board_post`, `board_read` → `board.jsonl`.
- **Stigmergic plane:** `pheromone_emit`, `pheromone_field` → `pheromones.jsonl`.
  Documented scents: `work-available`, `work-claimed`, `work-done`, `need-help`.
  Evidence mandatory; `from=` required; `ref` required for claimed/done.

### Known critical defects already audited (re-verify; do not invent)

- `briefs/tower-bus-audit-FINDINGS.md` — Finding 1: `send_to_user(deliverable)`
  does not set `to:"operator"`, so Stop-hook relay guard almost never engages
  (458/467 historical rows at audit time). Finding 2: question-close storm fix
  is pi-side; CC path still prompt-adherence. Treat audit as prior art; re-check
  against current HEAD of `server.mjs` / `tower-ledger.mjs`.

### Adjacent runtime / finish machinery (sense, do not replace in Phase 1)

- Herdr: multiplexer, pane lifecycle, agent_status.
- herdr-spine: `spine-report`, `spine-claim`, `docs/pheromones.md` (contest
  semantics / heartbeat).
- Made Well / cursor-shim verify-mark / tax.jsonl — completion marks outside
  Tower; note mismatches if semantic "done" lands there without a pheromone.
- Fut (`https://fut.sh/`): NO local checkout found under `~/` or `~/source`.
  Out of Phase 1 scope except as a named future RuntimeAdapter candidate.

### Operator source materials (read in full before exploring)

- This brief's meta-prompt intent: expert target + Phase 1/2 split + principles
  (write path non-optional; small typed vocabulary; append-mostly; cheap sensing;
  smallest surface; TS pragmatic).
- Prior conversation notes (paste retained in session; concierge summary):
  human-in-the-loop already proves fan-out; bottleneck is substrate write
  discipline; language choice secondary until write/sense loop is solid;
  RuntimeAdapter later; do not wholesale replace Herdr for Fut now.

### Standing doctrine already claiming stigmergy (compare intent vs code)

- `primitives/mcps/tower/COMMS-ARCH.md` plane 5 — deposit never deliver;
  pheromones have no addressee; never relayed as operator mail.
- `briefs/tower/codify-stigmergy.done` + `orch-codify-stigmergy.md` — doctrine
  was codified; Phase 1 must say whether runtime enforcement followed.

---

## Parallel Work Notice

- Arc leftovers from battery-death flight are PARKED — do not investigate
  `~/Infinity/arc` uncommitted madewell/orch-resume work.
- Certified-week A3/A4/A5/A6 lanes are PARKED for this CORD unless they
  collide with Tower substrate files you must read.
- Existing CORD Tower scope fence: `briefs/tower/CORD-SCOPE-2026-08-13.md` —
  respect closed items; this Phase 1 is a NEW unit, not a silent reopen of W0–W5.
- Board topic: `tower/substrate-harden`. Claim before overlapping reads that
  become writes later; Phase 1 itself is read-only on code/state.

---

## Tower (mid-run communication)

- Progress with numbers: `send_to_user` kind=progress, from=`cord-tower`.
- Ground report deliverable: kind=deliverable with `to` semantics that actually
  reach the operator plane (do not repeat Finding 1 — if the tool cannot set
  `to`, ALSO write the report to disk and doorbell).
- Board: topic `tower/substrate-harden`.
- spine-report task/verdict on Herdr host.

---

## Tasks (Phase 1 ONLY — GROUND)

1. **Locate and map Tower surfaces** — done when: a single report section lists
   every write entrypoint (MCP tools, CLI verbs, spine writers, hooks) with file
   paths and whether each appends board / ledger / pheromones / other.

2. **Extract the real hardened trace schema from code** — done when: the exact
   pheromone row shape and scent enum are quoted from `lib.mjs` /
   `emitPheromone` (or equivalent), plus board and ledger row shapes; NO invented
   schema. Note gaps vs the operator's aspirational TraceType list
   (`task.claimed|started|completed|blocked|failed|observation|need|danger`).

3. **Show the current write path** — done when: for a typical AGNT finishing a
   partitioned task, the report names what the brief/profile/hooks tell it to
   write, which tool it must call, and what happens if it skips the call
   ( mechanistically — which gate fires or fails to).

4. **Show completion signaling** — done when: Herdr `agent_status` /
   spine-report / `.done` files / Made Well verify-mark / pheromone `work-done`
   are each classified as lifecycle vs semantic, and the report states which
   combination (if any) is currently required for "done = gone."

5. **Identify finish-without-write mechanisms** — done when: at least three
   concrete mechanisms are named with code or live-log evidence (prompt-optional
   tool call is one; claim≫done histogram is supporting evidence not a mechanism).

6. **Locate work-item identity, agent identity, adapters** — done when: what
   today plays the role of `work_item_id` / `agent_id` is named (topic? claim
   token? pane id? brief path?), and whether any RuntimeAdapter interface exists
   (expected: no).

7. **Sensing paths** — done when: `pheromone_field`, board_read, CLI field
   verbs, CTRL/TOWR consumers, and any idle-field-pull hooks are listed with
   "works / partial / unused" verdicts grounded in code or live exercise.

8. **Intent vs control-flow mismatches** — done when: a short table maps
   COMMS-ARCH plane-5 claims to actual enforcement (or lack) in server/hooks/spine.

9. **Deliver ground report** — done when: one markdown file exists at
   `~/agent-core/briefs/tower/substrate-harden/PHASE1-GROUND.md` containing
   all above, ending with **Next 2–4 concrete actions** (files/functions/
   verification steps) but NO rewrite implementation and NO home-repo migration.

---

## Constraints

- READ-ONLY on production state and code. No schema changes. No `git init`.
  No moves to `~/tower`. No Fut install. No Phase 2 prescribe beyond a
  short ordered next-actions list at the end of the ground report.
- Touch ONLY: create `briefs/tower/substrate-harden/` + the ground report;
  board posts on `tower/substrate-harden`. Do not commit.
- Testing: if you exercise write paths, use a disposable topic under
  `tower/substrate-harden-probe` and say so; never corrupt live topics.
- Re-verify any fact you inherit from this brief before asserting it.

---

## Report back with

- Path to `PHASE1-GROUND.md`
- One-paragraph verdict: is the substrate rewrite-shaped, or gate-and-schema-
  harden-shaped, based on what you found (judgment allowed ONLY after ground)
- The ordered next 2–4 actions
- Deviations from Pre-Verified Facts, with evidence

---

## Operator meta-prompt (authoritative intent — summarize, do not dilute)

Discover first. Prescribe only after ground. Preserve hierarchy and Herdr.
Make write path non-optional and verifiable. Keep trace vocabulary small and
typed. Prefer append-mostly log with clear identity. Sensing must be cheap for
CORD/ORCH. Smallest surface that removes finish-without-deposit. Language
secondary (TS pragmatic). RuntimeAdapter later. Focus current Tower setup —
rewrite only if code proves the middle is unfixable; if so, scope tightly
around schema + write gate + sensing.
