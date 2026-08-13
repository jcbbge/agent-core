# Tower rotate Phase-1 proof

**Stamp:** 20260813T152814Z  
**Coder:** AGNT w4-rotate (coder)  
**Date:** 2026-08-13T15:28Z

## Proof tree

```
briefs/tower/w4-retention-evidence/rotate-proofs/20260813T152814Z/
  tower-copy/           # disposable TOWER_HOME
    board.jsonl         # copied from ~/.tower, inflated for triggers
    ledger.jsonl        # copied from ~/.tower (unchanged)
    archive/
      manifest.jsonl
      board/board-20260813T152830Z.jsonl
    cursors/
      board.scope.cursor.json
      rotate.lock       # transient during runs
  rotate-result.json
  PROOF.md
```

## Live baseline (pre-copy)

| File | Lines | Size |
|------|------:|-----:|
| `~/.tower/board.jsonl` | 6969 | 4.3M |
| `~/.tower/ledger.jsonl` | 2710 | 1.1M |

Live board is under POLICY triggers (5MB / 8000 lines). Proof copy was inflated by appending 200-line chunks until **8169 lines / 5182932 bytes** to exercise rotation logic on real JSONL.

## Commands (ORCH re-run)

```bash
PROOF_ROOT="briefs/tower/w4-retention-evidence/rotate-proofs/20260813T152814Z"
TOWER_COPY="$PROOF_ROOT/tower-copy"
ROTATE="primitives/mcps/tower/rotate.mjs"

# Dry-run (no writes)
TOWER_HOME="$TOWER_COPY" bun "$ROTATE" --store board --dry-run --evidence-dir "$PROOF_ROOT"

# Phase-1 apply on copy only
TOWER_HOME="$TOWER_COPY" bun "$ROTATE" --store board --phase 1 --apply --evidence-dir "$PROOF_ROOT"

# Phase-2 refusal (must exit non-zero)
TOWER_HOME="$TOWER_COPY" bun "$ROTATE" --store board --phase 2 --apply ; echo exit=$?

# Ledger noop (under thresholds on copy)
TOWER_HOME="$TOWER_COPY" bun "$ROTATE" --store ledger --dry-run
```

All commands above re-run **EXIT 0** except Phase-2 apply (**EXIT 1**, message: `Phase-2 refused`).

## Phase-1 apply results

| Check | Result |
|-------|--------|
| Active `board.jsonl` line count after apply | 8169 (unchanged) |
| Active `board.jsonl` size after apply | 5182932 bytes (unchanged) |
| Archive file | `archive/board/board-20260813T152830Z.jsonl` |
| Archived bytes (`archivedByteEnd`) | 79997 |
| Archived line count (manifest) | 125 |
| Archive sha256 | `1e7a06f0a4db4a0ed8f5284b6f8c7cb8a5b45feaf812a7720fe8128c020d45ff` |
| Prefix bytes match archive file | yes (`Buffer.compare` === 0) |
| Manifest row appended | yes (`archive/manifest.jsonl` 1 line) |
| Cursor `archivePath` + `archivedByteEnd` set | yes |
| Archive destroyed | no |

## Lock contention

Held `cursors/rotate.lock` externally; concurrent `--dry-run` exited **1** with `rotate lock held`.

## Read-across sanity

With `TOWER_HOME=$TOWER_COPY` and `TOWER_LEDGER_NO_CURSOR=1`, `readAllFull(BOARD)` returned **8124** parseable rows (45 source lines fail JSON parse in the inflated copy; same as pre-rotate full-read on that copy).

## Phase-1 live apply readiness

**No (not yet warranted on live).** Live `board.jsonl` is ~6969 lines / 4.3MB — below size and line triggers; rotate dry-run on live would noop. Code path is proven on copy; live Phase-1 apply should wait until POLICY triggers fire or operator schedules rotation after reviewing this proof.

Phase-2 live apply remains **BLOCKED** (`TOWER_ROTATE_PHASE2_OK=1` + concierge/CORD yes).
