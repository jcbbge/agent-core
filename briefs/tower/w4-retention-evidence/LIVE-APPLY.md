# LIVE-APPLY — Phase-1 live rotation (w4-retention)

**Agent:** agnt-w4-live-apply  
**Executed:** 2026-08-13T15:49:07Z – 2026-08-13T15:49:13Z UTC  
**Rotate binary:** `primitives/mcps/tower/rotate.mjs` (worktree)  
**Phase:** 1 only (`--phase 1 --apply`). No Phase-2. No `TOWER_ROTATE_PHASE2_OK`.

## Backup

**Path:** `~/.tower-backups/w4-retention-20260813T154907Z/`

| Artifact | SHA256 (pre-copy) | Bytes | Lines |
|----------|-------------------|-------|-------|
| board.jsonl | `5887dc61ddca6c5a9a8a361f71f5529b848469c73670ff8e10b3a0bf8931703a` | 4,581,396 | 7,176 |
| ledger.jsonl | `962112b27a90366c3f1de0a1a2a216288df57975c1308a434cbabe1d7f45afd9` | 1,133,636 | 2,736 |
| odometer.jsonl | `c38c293d204ba3c4331e6a4eafd1b93550737e22988c0baafb0e8f64e3c7bb3b` | 287,596 | — |

**Inventory (pre-apply):** flight 913 files · deliverables 458 files  
**SHA256SUMS:** written in backup root; board+ledger SHAs verified unchanged after copy.

Note: ORCH pre-verified board/ledger SHAs in brief were stale (live files appended since ORCH measure). Re-measured immediately before backup; above SHAs are authoritative for this apply.

## Board / ledger (JSONL)

| Store | Dry-run | Apply | Result |
|-------|---------|-------|--------|
| board | noop | noop | Triggers not met (size/line/age below thresholds) |
| ledger | noop | noop | Triggers not met |

**Post-apply:** board SHA/lines/bytes unchanged · ledger SHA/lines/bytes unchanged.

## Flight / deliverables (dir stores)

| Store | Dry-run | Apply | Moved | Archive paths |
|-------|---------|-------|-------|---------------|
| flight | 142 files | 142 files | 142 | `archive/flight/2026-06/`, `archive/flight/2026-07/` |
| deliverables | 16 files | 16 files | 16 | `archive/deliverables/2026-06/` |

**Active counts:** flight 913 → 771 (−142) · deliverables 458 → 442 (−16)  
**Archive file counts:** flight 142 · deliverables 16

### Sample copy-verify

- Sample: `archive/flight/2026-06/2026-06-22-SessionEnd-660a11bf.md`
- SHA256: `b1a0cfa1f319f4fbb3fb636d29fa1cb21a0e8e735e38629955d2f2ab3857bc53`
- Present in pre-apply backup inventory; absent from active `flight/` after apply.
- SHA matches manifest row `rot-msrp1akg`.

## Manifest

Three Phase-1 rows appended to `~/.tower/archive/manifest.jsonl`:

- `rot-msrp1aj6` — flight 2026-07 (51 files)
- `rot-msrp1akg` — flight 2026-06 (91 files)
- `rot-msrp1alk` — deliverables 2026-06 (16 files)

Evidence JSON: `briefs/tower/w4-retention-evidence/rotate-result.json`

## Post-verify

| Check | Result |
|-------|--------|
| `bun ~/.tower/cli.mjs status` | EXIT 0 |
| board JSONL unchanged (noop) | SHA + line count match pre-apply |
| flight active count | decreased by 142 |
| deliverables active count | decreased by 16 |
| copy verify mid-flight | no abort needed |

## Verdict

**GO** — Phase-1 live apply complete. Board/ledger noop as expected; flight and deliverables archived with verified copy and active unlink. Backup at `~/.tower-backups/w4-retention-20260813T154907Z/`.
