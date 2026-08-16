# AGNT [w4-live-apply] — Phase-1 live rotation (backup first)

Model: sonnet. Do NOT use emojis. Do not commit. Do not Phase-2.

## Pre-Verified Facts (ORCH verified 2026-08-13)

- Rotate binary (worktree):  
  `/Users/jrg/.spine/worktrees/agent-core/w4-retention/primitives/mcps/tower/rotate.mjs`  
  Tests: 16 pass / 0 fail. Dir fix: per-file `archive/<store>/YYYY-MM/` +
  Phase-1 unlink after verified copy.
- Live dry-run (ORCH): board/ledger/odometer → noop (under size/line/age
  triggers). Flight → ~139 files older than 30d into 2026-06 + 2026-07.
  Deliverables → 1 file older than 60d. Pheromones deferred.
- Pre-live SHAs (remeasure before apply):  
  board `b9fc5f3931b0df7e840bd0630fc9af392ec81f04e6f13a94bc80bceb950a9e5c`  
  ledger `9115ac3cb7b83344ddb7474203f09c2556717f5b56948a1a12da6ec233610acc`  
  (re-sha immediately before backup; sizes were board ~4.3MB/7134 lines,
  ledger ~1.1MB/2734 lines).
- Backup root: `~/.tower-backups/w4-retention-<stamp>/` (dir exists pattern
  under `~/.tower-backups/`).
- Evidence: worktree  
  `briefs/tower/w4-retention-evidence/LIVE-APPLY.md` + `.done`.
- Fence: archive never destroy; no board repair; Phase-1 only
  (`--phase 1 --apply`); no `TOWER_ROTATE_PHASE2_OK`.

## Parallel Work Notice

Solo. Topic `tower/w4-retention`.

## Tower

CLAIM first. Findings with before/after sizes and shas. No operator mail
unless something goes wrong (then alert + doorbell via herdr notification).

## Tasks

1. **Backup** — done when: copy `board.jsonl`, `ledger.jsonl`,
   `odometer.jsonl`, and inventory counts for `flight/` + `deliverables/`
   into `~/.tower-backups/w4-retention-<UTC-stamp>/` with `SHA256SUMS`
   written; board+ledger shas match pre-copy.
2. **Board/ledger Phase-1** — done when: dry-run then `--phase 1 --apply`
   for board and ledger; if noop, record that + triggers not met in
   LIVE-APPLY.md (still counts as live execute). Active file bytes must
   match pre-sha if noop / Phase-1 JSONL leave-active-unchanged.
3. **Flight + deliverables Phase-1** — done when: `--store flight` then
   `--store deliverables` with `--phase 1 --apply`; aged files present
   under `~/.tower/archive/flight/YYYY-MM/` and
   `archive/deliverables/YYYY-MM/`; removed from active only after copy
   verify; sample sha256 match; counts in LIVE-APPLY.md.
4. **Post-verify** — done when: `bun ~/.tower/cli.mjs status` EXIT 0 (or
   document failure unrelated to rotation); board line count unchanged for
   JSONL noop; flight active count decreased by moved count; manifest rows
   appended; LIVE-APPLY.md + `agnt-w4-live-apply.done` written.

## Constraints

- cwd: `/Users/jrg/.spine/worktrees/agent-core/w4-retention`
- Run rotate via worktree path (no need to symlink unless you document it).
- Touch ONLY: `~/.tower/archive/**`, rotate.lock transient, cursor archive
  metadata if JSONL apply writes any, backup dir, and evidence files under
  `briefs/tower/w4-retention-evidence/`. Do not edit rotate.mjs.
- Abort and restore from backup if copy verify fails mid-flight.
- No commit. No push. No Phase-2.

## Report back with

Backup path; before/after sizes+counts; shas; whether board/ledger were
noop; flight/deliverables moved counts; GO/NO-GO for unit.
