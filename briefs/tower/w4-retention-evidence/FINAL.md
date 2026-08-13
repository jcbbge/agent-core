# ORCH [w4-retention] FINAL

**Pane:** w2Y:p9 · **Branch:** `orch/w4-retention` @ worktree  
`~/.spine/worktrees/agent-core/w4-retention`  
**Date:** 2026-08-13  
**Verdict:** **GO** (Phase-1 live applied for flight/deliverables; board/ledger
noop under triggers; Phase-2 JSONL truncate remains gated)

## Policy summary

- Archive never destroy; `~/.tower/archive/` + `manifest.jsonl`
- Phase-1 additive (JSONL: copy prefix + cursor meta, active unchanged;
  dirs: copy+verify then unlink from active)
- Phase-2 truncate/swap requires `TOWER_ROTATE_PHASE2_OK=1` + CORD/concierge yes
- Triggers: board >5MB/8000/90d; ledger >2MB/3000/180d; odometer >1MB/2000/365d;
  flight dir age 30d; deliverables 60d; pheromones deferred
- Reuse tower-ledger byte cursors (`archivePath`/`archivedByteEnd`); tower-auto
  must migrate to `inboxState` before Phase-2

## Commands

```bash
# Tests
cd ~/.spine/worktrees/agent-core/w4-retention
bun test primitives/mcps/tower/rotate.test.mjs   # 16 pass / 0 fail

# Dry-run / apply (worktree binary until symlink)
bun primitives/mcps/tower/rotate.mjs --store all --phase 1 --dry-run
bun primitives/mcps/tower/rotate.mjs --store flight --phase 1 --apply
bun primitives/mcps/tower/rotate.mjs --store deliverables --phase 1 --apply

# Deploy after land
ln -sf ~/agent-core/primitives/mcps/tower/rotate.mjs ~/.tower/rotate.mjs
```

## Sizes before → after (live)

| Store | Before | After | Notes |
|-------|--------|-------|-------|
| board.jsonl | 7176 lines / ~4.58MB | unchanged | Phase-1 noop (under triggers) |
| ledger.jsonl | 2736 lines / ~1.13MB | unchanged | noop |
| flight/ | 913 files / 3.8M | 771 files / 3.1M | −142 → archive/2026-06 + 2026-07 |
| deliverables/ | 458 files / 1.9M | 442 files / 1.8M | −16 → archive/2026-06 |
| archive/ | absent | 908K | manifest + buckets |

## SHAs (live apply backup)

Backup: `~/.tower-backups/w4-retention-20260813T154907Z/`

- board: `5887dc61ddca6c5a9a8a361f71f5529b848469c73670ff8e10b3a0bf8931703a`
- ledger: `962112b27a90366c3f1de0a1a2a216288df57975c1308a434cbabe1d7f45afd9`
- odometer: `c38c293d204ba3c4331e6a4eafd1b93550737e22988c0baafb0e8f64e3c7bb3b`

Proof-on-copy (pre-live): `rotate-proofs/20260813T152814Z/PROOF.md`

## Live rotate ran?

- Board/ledger: **yes, executed; result noop** (triggers not met)
- Flight/deliverables: **yes, Phase-1 apply** (142 + 16 moved)
- Phase-2 JSONL: **not run** (gated)

## Code landing (CORD)

Uncommitted on `orch/w4-retention`:

- `primitives/mcps/tower/rotate.mjs` (new)
- `primitives/mcps/tower/rotate.test.mjs` (new)
- `primitives/hooks/tower-ledger.mjs` (archive helpers)
- `primitives/hooks/tower-rotate.criteria.md` (new)
- evidence under `briefs/tower/w4-retention-evidence/`

nQ used: 2/3 (FailA bad-test + FailB bad-impl; then dir YYYY-MM/Phase-1 move).
No push. No commit by ORCH (await CORD land).

## GO/NO-GO

**UNIT GO** for Phase-1 retention tooling + live flight/deliverables rotation.
Fully-operational axis: still gated by w3 F1/F9/F4 (not this unit).
