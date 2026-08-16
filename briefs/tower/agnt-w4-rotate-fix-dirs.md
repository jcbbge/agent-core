# AGNT [w4-rotate-fix-dirs] — Flight/deliverables archive layout + Phase-1 move

Model: sonnet. Do NOT use emojis. Do not commit.

## Pre-Verified Facts (ORCH verified 2026-08-13)

- Tree: `/Users/jrg/.spine/worktrees/agent-core/w4-retention`
- Suite currently green: `bun test primitives/mcps/tower/rotate.test.mjs` → 14/14.
- Bug A (ORCH read `rotate.mjs:362-369`): `planDir` sets
  `archiveDir = archive/<store>/<current-UTC-YYYY-MM>` for ALL moves.
  Live dry-run listed June/July flight files but summary path
  `archive/flight/2026-08`. POLICY §3 requires `archive/flight/YYYY-MM/`
  (and deliverables) by **file date**, not rotate-run month.
- Bug B (ORCH read `applyDirPlan:374-404`): Phase-1 only `copyFileSync`;
  `unlinkSync` only when `phase === 2`. POLICY §2/§4: directory Phase-1 is
  copy+verify then remove aged from active (archive retains bytes; never
  destroy). Live apply allowed for that move without further yes.
- Live dry-run: board/ledger/odometer noop (under triggers); flight has
  139 files mtime+30d; deliverables 1 file mtime+60d.
- Tests: `directory stores — flight archive layout` may need update if it
  assumed single current-month bucket — you may edit that test only as
  needed for per-file YYYY-MM (same agent owns rotate.mjs + its test for
  this dir behavior to avoid split-brain; keep other tests green).

## Parallel Work Notice

No other w4 workers. Topic `tower/w4-retention`.

## Tower

CLAIM + findings on `tower/w4-retention`. Done:
`briefs/tower/w4-retention-evidence/agnt-w4-rotate-fix-dirs.done`.

## Tasks

1. Per-file month bucket — done when: each moved file lands in
   `archive/<store>/YYYY-MM/` derived from that file's mtime (UTC
   YYYY-MM); dry-run evidence lists distinct months when inputs span months.
2. Phase-1 dir move — done when: after sha verify of copy, Phase-1 removes
   source from active; archive retains bytes; second apply does not
   destroy archive.
3. Tests green — done when: `bun test primitives/mcps/tower/rotate.test.mjs`
   → 0 fail (update flight layout test if needed).
4. Marker `.done` with before/after of a disposable dir proof under
   evidence or /tmp.

## Constraints

- Touch ONLY: `primitives/mcps/tower/rotate.mjs`,
  `primitives/mcps/tower/rotate.test.mjs`, evidence `.done` (+ optional
  proof notes under `briefs/tower/w4-retention-evidence/`).
- No live `~/.tower` apply in this brief (ORCH will dispatch live next).
- No commit. No Phase-2 JSONL truncate.

## Report back with

How YYYY-MM is derived; Phase-1 unlink confirmation; test counts.
