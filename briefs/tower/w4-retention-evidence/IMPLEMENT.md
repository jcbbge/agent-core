# AGNT w4-rotate implementation notes

**Date:** 2026-08-13  
**Partition:** coder (implementer)

## Files created/modified

| Path | Action |
|------|--------|
| `primitives/mcps/tower/rotate.mjs` | **new** — CLI rotate entry point |
| `primitives/hooks/tower-ledger.mjs` | **modified** — archive read-across, cursor fields, exports |
| `briefs/tower/w4-retention-evidence/POLICY.md` | copied from spine worktree (policy already verified by ORCH) |
| `briefs/tower/w4-retention-evidence/rotate-proofs/20260813T152814Z/PROOF.md` | proof artifacts |
| `briefs/tower/w4-retention-evidence/DEPLOY-ROTATE.md` | deploy symlink instructions |

## rotate.mjs surface

```bash
bun primitives/mcps/tower/rotate.mjs \
  --store board|ledger|odometer|flight|deliverables|all|pheromones \
  [--dry-run] [--apply] \
  [--phase 1|2] \
  [--evidence-dir PATH] \
  [--tower-home PATH] \
  [--older-than Nd]   # directory stores
```

Environment:

- `TOWER_HOME` — proof/disposable tree root (default `~/.tower`)
- `TOWER_ROTATE_PHASE2_OK=1` — required for `--phase 2`

Lock: `$TOWER_HOME/cursors/rotate.lock` (pid file, same pattern as ledger cursors).

## tower-ledger.mjs changes

- `TOWER_HOME` env override on `TOWER` and derived paths
- `ARCHIVE`, `ARCHIVE_MANIFEST` constants
- `loadArchiveMeta(store)`, `readArchivedPrefix`, `writeStoreArchiveCursor`
- `readAllFull(file, archiveMeta?)` concatenates archive prefix + active tail (skips overlap via `archivedByteEnd`)
- Cursor JSON fields: `archivePath`, `archivedByteEnd`, `_loadedArchiveEnd`
- `syncLedgerInboxCursor` / `syncBoardScopeCursor` rebuild from archive+active when archive metadata changes; incremental tail reads start at `max(offset, archivedByteEnd)`
- Exported `readTailBytes`, `cursorValid`, `withCursorLock` for rotate/tests

## Deviations

1. **Proof inflation:** Live board is under POLICY triggers; proof copy appended real JSONL lines to exceed 8000-line / 5MB thresholds. Documented in PROOF.md — not a code flag.
2. **Odometer cursor:** No odometer byte cursor exists today; Phase-1 odometer rotate archives prefix + manifest only (no cursor sidecar update). Matches POLICY "odometer burn stays full-read on active file."
3. **Pheromones:** `--store pheromones` returns defer message per POLICY; no-op.

## Not done (out of partition / blocked)

- `rotate.test.mjs` — test-maker parallel lane
- Live `~/.tower` apply — proof-on-copy only
- Phase-2 truncate — gated
- `cli.mjs` / `server.mjs` — w3 fence
