# ORCH [spine-twin-sync] — Sync herdr-spine cc-hooks bootstrap twin

You own ONE unit: bring `~/herdr-spine/cc-hooks/server.mjs` in byte-sync with
the canonical `~/agent-core/primitives/mcps/tower/server.mjs` so the bootstrap
fallback is not a stale pre-F1/F4/write-path copy. Do NOT use emojis.

Field: you were dispatched against claimed work `ph-msro1zir-mo7s`
(CORD Tower hold). When you take the unit, emit `work-claimed` ref that id
(or ref CORD's claim chain per field reader — act once), heartbeat, then
`work-done` with evidence when drift contested FAIL clears.

## Pre-Verified Facts (CORD 2026-08-13)

1. Handoff from CORD bus-data (`cord-bus-data.done`): "herdr-spine/cc-hooks/server.mjs
   stale twin → CORD Tower".
2. Live sha diverge: canonical `6047ced3…` vs cc-hooks `5657cf0f…`.
   `ask-bridge.mjs` and `stop-verdict.mjs` in cc-hooks already MATCH canonical.
3. `install.sh` prefers canonical when present; cc-hooks is bootstrap-only.
   Syncing the twin does not change live `~/.tower/server.mjs` (symlink to
   canonical). It stops drift-check contested FAIL and keeps fresh-machine
   bootstrap current.
4. Repo: `~/herdr-spine`, work on a branch, **do not push**. Do not delete
   cc-hooks/. Attic/operator-reserved deletions stay reserved.
5. Acceptance: after land on spine branch (CORD merges to spine main if clean),
   `bun ~/agent-core/primitives/mcps/tower/drift-check.mjs` shows **0 FAIL**
   for `server.mjs vs spine` (other FAILs not yours).
6. Topics: `tower/spine-twin` + `tower/fully-operational`. Stigmergy required.

## Tasks

1. Copy or equivalent sync: cc-hooks/server.mjs := canonical server.mjs
   (preserve history via commit message; prove sha match).
2. Run drift-check; paste output with 0 FAIL on contested server line.
3. Commit on a spine branch; CORD lands to spine main.
4. Field: work-done ref `ph-msro1zir-mo7s` + evidence path.

## Constraints

- Touch ONLY herdr-spine/cc-hooks/server.mjs (and evidence under
  `briefs/tower/spine-twin-evidence/`). No agent-core production edits.
- No push. Visible panes. Heartbeat claims.

## Report back with

SHAs before/after, drift-check tail, pheromone work-done id.
