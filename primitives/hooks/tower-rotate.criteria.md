# Test criteria — w4-rotate / Tower Phase-1 rotation

Authored by test-maker from `agnt-w4-rotate` TASK + `POLICY.md` only. Each assert
maps to an acceptance criterion. Tests live in `primitives/mcps/tower/rotate.test.mjs`;
the tester runs them — test-maker does not.

## rotate.mjs entrypoint (task 1)

| Assert name | Criterion |
|-------------|-----------|
| `rotate.mjs is present beside oracle tests` | Script exists at `primitives/mcps/tower/rotate.mjs` |

## Dry-run no-write (task 4)

| Assert name | Criterion |
|-------------|-----------|
| `board --dry-run --phase 1 leaves board bytes and archive tree unchanged` | `bun rotate.mjs --store board --phase 1 --dry-run` with `TOWER_HOME=<proof>` → exit 0; active `board.jsonl` bytes unchanged; no `archive/board/*.jsonl`; no `archive/manifest.jsonl`; live `~/.tower/board.jsonl` size unchanged |

## Phase-1 archive completeness (task 4 + task 1 manifest)

| Assert name | Criterion |
|-------------|-----------|
| `Phase-1 apply copies prefix to archive/board; active file bytes unchanged; manifest row valid` | `--apply --phase 1 --store board` on eligible fixture → exit 0; active file byte-identical pre/post; `archive/board/<store>-<stamp>.jsonl` exists; manifest row matches POLICY §3 schema (`store`, `phase`, `archivedByteEnd`, `archivedLineCount`, `activeSizeBefore === activeSizeAfter`, `sha256`, `dryRun: false`, `operator: rotate.mjs`); archive bytes === active prefix `[0, archivedByteEnd)`; sha256 matches manifest |

## Phase-2 gated (task 4 + task 1 `--phase`)

| Assert name | Criterion |
|-------------|-----------|
| `Phase-2 --apply refuses without TOWER_ROTATE_PHASE2_OK=1` | `--phase 2 --apply` without env → non-zero exit; message mentions Phase-2 gate; active bytes unchanged |
| `Phase-2 --dry-run may plan but live shrink still blocked without env` | `--phase 2 --dry-run` without env → exit 0 (plan-only); apply remains gated (row above) |

## Lock contention (task 4 + POLICY §4)

| Assert name | Criterion |
|-------------|-----------|
| `refuses when cursors/rotate.lock is held` | Pre-create `$TOWER_HOME/cursors/rotate.lock` → rotate refuses (non-zero); message mentions lock/busy |

## Never-destroy (task 4 + POLICY invariant)

| Assert name | Criterion |
|-------------|-----------|
| `archive files survive second dry-run; manifest only appends` | After Phase-1 apply, second `--dry-run` → all prior archive files exist with identical sha256; manifest line count never decreases |

## Ledger read-across (task 2)

| Assert name | Criterion |
|-------------|-----------|
| `after Phase-1 board rotate, boardFor matches TOWER_LEDGER_NO_CURSOR=1 baseline` | Pre-rotate full-read `boardFor` ids === post-rotate cursor-path and full-read ids |
| `cursor sidecar gains archivePath + archivedByteEnd after board Phase-1` | `cursors/board.scope.cursor.json` contains non-empty `archivePath` + `archivedByteEnd > 0`; archive file exists |
| `ledger Phase-1 leaves ledger.jsonl bytes unchanged; inboxState parity` | Ledger `--apply --phase 1` → active ledger bytes unchanged; `inboxState` JSON identical pre/post |

## Store flags + deferrals (task 1 + constraints)

| Assert name | Criterion |
|-------------|-----------|
| `--store all skips pheromones with defer/no-op message` | `--store all --dry-run` → stdout/stderr mentions pheromone defer/skip; no `archive/pheromones/` |
| `invalid --store exits non-zero` | Unknown store → non-zero exit |

## Directory stores (POLICY §3)

| Assert name | Criterion |
|-------------|-----------|
| `flight --older-than moves aged .md into archive/flight/YYYY-MM/` | File mtime >30d → after `--store flight --older-than 30d --phase 1 --apply`, copy under `archive/flight/YYYY-MM/` with same content |

## Evidence dir (task 1 + task 3)

| Assert name | Criterion |
|-------------|-----------|
| `--evidence-dir receives dry-run plan output without touching live tower` | Flag accepted; exit 0; live board unchanged |

## Human QA (automation dishonest — route to /qa-doc)

| Item | What changed | How to verify | Expect | Class |
|------|--------------|---------------|--------|-------|
| Phase-1 live apply readiness | `rotate.mjs` + ledger helpers after proof-on-copy | ORCH re-runs dry-run + apply on worktree `rotate-proofs/<stamp>/` copy per POLICY §4; inspect `PROOF.md` | sha256(line counts) match manifest; `boardFor`/`inboxState` parity vs `TOWER_LEDGER_NO_CURSOR=1`; EXIT 0 | human |
| Phase-2 live truncate | N/A until gated | Attempt `--phase 2 --apply` on live without concierge yes | Must refuse regardless of proof | human |
| Flight cross-archive hook read | POLICY §7 UNKNOWN | After flight rotation, confirm hooks scanning `<24h` active `flight/` still behave; older snapshots only in archive | No silent loss of operator-visible recent flight | human |

## Residual risks (document-only)

| Item | Note |
|------|------|
| Odometer / deliverables rotation | Same invariants as board/ledger; add oracle rows when implementer ships store handlers |
| `~/.tower/rotate.mjs` symlink deploy | CORD/ops — document in `DEPLOY-ROTATE.md`; not asserted here |
| Trigger edge at exactly 8000/3000 lines | Fixtures use 8100/3100 to avoid off-by-one ambiguity |

## Run command (tester, not test-maker)

```bash
bun test /Users/jrg/.cursor/worktrees/w4-retention/wt-agnt-test-maker-w2y-pp/primitives/mcps/tower/rotate.test.mjs
```

Or from the tower MCP directory:

```bash
cd ~/agent-core/primitives/mcps/tower && bun test rotate.test.mjs
```
