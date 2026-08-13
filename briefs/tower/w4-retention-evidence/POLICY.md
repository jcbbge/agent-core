# Tower Retention and Rotation Policy

**Status:** POLICY ONLY — no live rotation until `rotate.mjs` is implemented and proofed (Made Well w4-rotate unit).

**Author:** AGNT w4-policy  
**Date:** 2026-08-13  
**Repo:** agent-core (Tower canonical code in `primitives/hooks/tower-ledger.mjs`, deployed via `~/.tower/lib.mjs`)

**Invariant (CORD fence):** Archive, never destroy. Every byte rotated out of an active path must land under `~/.tower/archive/` with a manifest audit row before any live truncate or swap. Board repair/compaction is owned by the bus-data lane — this policy does not rewrite corrupt lines.

**Live baseline (remeasured 2026-08-13T15:22Z):**

| Path | Lines | Size | Notes |
|------|------:|-----:|-------|
| `board.jsonl` | 6900 | ~4.2 MB | Largest hot JSONL |
| `ledger.jsonl` | 2703 | ~1.1 MB | Inbox derivation source |
| `odometer.jsonl` | 1026 | ~281 KB | Burn analytics |
| `pheromones.jsonl` | 33 | ~8 KB | TTL-scented; tiny |
| `flight/` | — | 3.8 MB | Markdown snapshots |
| `deliverables/` | — | 1.9 MB | Per-deliverable files |
| `archive/` | — | absent | Created on first rotation |

Cursor sidecars today: `cursors/ledger.inbox.cursor.json` (~2.2 MB), `cursors/board.scope.cursor.json` (~4.3 MB), `cursors/ledger.jsonl.offset.json` (62 B, `{offset,size,mtimeMs}`). Lock pattern: `withCursorLock` + `*.lock` pid files under `cursors/`.

---

## 1. Consumer survey

Each consumer below must keep working after rotation by reusing the **existing** byte-cursor system in `tower-ledger.mjs` (`syncLedgerInboxCursor`, `syncBoardScopeCursor`, `cursorValid`, `readTailBytes`). Do not introduce a second competing cursor store.

| Consumer | Read pattern today | Uses byte cursor? | Post-rotation keep-working strategy |
|----------|-------------------|-------------------|-------------------------------------|
| **`bun ~/.tower/cli.mjs`** | `inboxState` / `boardFor` / `ledgerInboxCursor` for status, inbox, board, all, projects; `readAll(ODOMETER)` full-file for burn/status; `readAllFull(PHEROMONES)` for scan/field | **Yes** for ledger inbox + board scope; **full-read** for odometer + pheromone scan | Route ledger/board through extended cursors that merge `archive/` prefix + active tail; odometer burn stays full-read on active file until odometer rotation ships (active file stays small post-truncate); pheromones unchanged (defer rotation). |
| **`primitives/hooks/tower-ledger.mjs`** | Canonical parsers; cursor sync with full-read fallback on lock failure or `TOWER_LEDGER_NO_CURSOR=1` | **Yes** (ledger.inbox, board.scope) | Add `readArchivedPrefix(fileKind)` helper; extend cursor JSON with `archivePath` + `archivedByteEnd`; `cursorValid` false on shrink still rebuilds from archive+active. |
| **`~/.tower/lib.mjs` → MCP `server.mjs`** | `inboxState`, `boardFor`, append-only writes to ledger/board/deliverables | **Yes** (via lib re-export) | Same cursor extensions; writes always append to active files only. |
| **`herdr-spine/cc-hooks/server.mjs`** | Same as MCP server (`inboxState`, `boardFor`, `append(BOARD,…)`) | **Yes** when linked to current lib | Deploy rotates with lib.mjs symlink; no separate read path. |
| **`bun twr.ts`** (`primitives/tools/statem/twr.ts`) | Default: `boardFor` (cursor). Change-detection tick: **full `readFileSync(boardPath)`** every 2s; `--board` override: `readAll` full-file filter | **Partial** — scoped rows via cursor; poll path full-reads | Replace poll signature with `stat.size` + `stat.mtimeMs` (and last line id via tail read); scoped render stays on `boardFor` after cursor learns archive boundary. |
| **`bun statem.ts`** | Append-only `appendFileSync(BOARD,…)`; reads `.madewell/` only | **Write-only** to board | Unaffected by rotation reads; append target remains active `board.jsonl`. |
| **`ctl-fleet`** (`herdr-spine/docs/ctl-fleet.md`) | **Does not read** Tower JSONL in production (board CLAIM path investigated and rejected); reads agent transcripts | **N/A** | No rotation work required for ctl-fleet reads. Re-evaluate only if CLAIM-from-board is revived. |
| **CC/pi hooks** (`session-start`, `flight-recorder`, `prompt-inject`, `stop-guard`, `session-capture-cursor`, `ask-bridge`) | `inboxState(cwd)` via lib/tower-ledger | **Yes** | Inherit cursor extensions automatically when hooks import current lib. |
| **`flight-recorder.mjs` + `session-start.mjs`** | `inboxState` + **`readdirSync(FLIGHT)`** mtime scan (<24h latest) | Cursor for ledger; **dir scan** for flight | Flight rotation moves aged `.md` into `archive/flight/`; readers scan active `flight/` only (archive on demand via `--flight-archive` — [UNKNOWN] whether hook needs cross-archive read; default: active dir only). |
| **`~/.pi/agent/extensions/tower-auto.ts`** + **`herdr-spine/extensions/tower-auto.ts`** | Local `readAll(LEDGER)` **full-file** on every turn start | **No** — bypasses cursors | **Must migrate** to `inboxState` from `~/.tower/lib.mjs` (or shared import); until then rotation/truncation breaks inbox parity. Policy blocks Phase-2 truncate until tower-auto uses lib cursor path. |
| **Odometer hooks** (`odometer.mjs`, `odometer-stop.mjs`) | Append-only; stop hook reads full odometer for dedup window | **Append-only** / full-read on stop | Append to active file; rotation copies prefix to archive; stop-hook dedup reads active + optional same-day archive slice. |
| **Spine board append** (MCP `board_post`, `cli.mjs post`, `lib.mjs append(BOARD)`) | Write-only | **N/A** | Always append to active inode; never write into `archive/`. |

**Gap to close before Phase-2:** `tower-auto.ts` full-read ledger (both pi and herdr-spine copies). **Gap to close before production twr at scale:** twr poll full-read.

---

## 2. Retention triggers

Triggers fire **whichever threshold is hit first**. Rotation is **eligible**, not automatic — operator or scheduled job runs `rotate.mjs` (after implementation + dry-run proof).

Justification uses live sizes above: board is the only JSONL near pain today (~4.2 MB / 6900 lines); ledger is half that; odometer and pheromones are low pressure; flight and deliverables are directory growth curves, not single append streams.

| Store | Size trigger | Line/count trigger | Age trigger | Phase-1 action | Phase-2 (needs yes) |
|-------|-------------:|-------------------:|------------:|----------------|---------------------|
| **board.jsonl** | active file **> 5 MB** | **> 8000** lines | prefix older than **90 days** (by first row ts in candidate prefix) | Copy prefix bytes to `archive/board/`; record manifest; set cursor `archivedByteEnd` | Truncate active or atomic swap to fresh active after proof |
| **ledger.jsonl** | **> 2 MB** | **> 3000** lines | prefix **> 180 days** | Same pattern under `archive/ledger/` | Truncate/swap after proof |
| **odometer.jsonl** | **> 1 MB** | **> 2000** lines | prefix **> 365 days** | Same under `archive/odometer/` | Truncate/swap after proof |
| **pheromones.jsonl** | **> 256 KB** | **> 500** lines | — | **Defer** — live 33 lines / ~8 KB; TTL + `pheromoneFieldFromRows` already expire scents | Revisit when >500 lines; no Phase-1 until then |
| **flight/** | dir total **> 5 MB** | — | files with mtime **> 30 days** | Move (copy + verify) to `archive/flight/YYYY-MM/`; leave active dir with recent snapshots only | Delete from active only after copy verified (not destroy — archive holds bytes) |
| **deliverables/** | dir total **> 3 MB** | — | files **> 60 days** | Move to `archive/deliverables/YYYY-MM/` | Same as flight |

**Cursor sidecar hygiene:** When active JSONL shrinks (Phase-2), `cursorValid` already invalidates on shrink (`st.size < cursor.offset` → rebuild). Rebuild must replay from `archivePath` + active file, not assume empty prefix.

**Board compaction:** Removing the 26 corrupt lines (bus-data `COMPACTION-PROPOSAL.md`) is **out of scope** for rotation and still requires separate concierge yes — rotation must not conflate with repair.

---

## 3. Archive layout

```
~/.tower/archive/
  manifest.jsonl          # append-only audit: every rotation event
  board/
    board-<stamp>.jsonl   # e.g. board-20260813T152200Z.jsonl
  ledger/
    ledger-<stamp>.jsonl
  odometer/
    odometer-<stamp>.jsonl
  flight/
    YYYY-MM/
      <original-filename>.md
  deliverables/
    YYYY-MM/
      <original-filename>.md
```

**Never-destroy invariant:** No `rm` of rotated content. Phase-2 "truncate active" means the live path gets shorter; archived bytes remain in `archive/` forever unless a future **separate** cold-storage policy (not this unit) moves them off-machine with explicit operator yes.

**Manifest row schema** (one JSON line per rotation):

```json
{
  "id": "rot-<ts>",
  "ts": "ISO-8601",
  "store": "board|ledger|odometer|flight|deliverables",
  "phase": 1,
  "archivePath": "~/.tower/archive/board/board-....jsonl",
  "archivedByteEnd": 1234567,
  "archivedLineCount": 4200,
  "activePath": "~/.tower/board.jsonl",
  "activeSizeBefore": 4400000,
  "activeSizeAfter": 4400000,
  "sha256": "<archive file hash>",
  "dryRun": false,
  "operator": "rotate.mjs"
}
```

**Read across the boundary (JSONL stores):**

1. Cursor load: if `archivedByteEnd > 0`, parse archived file `[0, archivedByteEnd)` once (or mmap cache) into the same in-memory shapes `ingestLedgerRow` / `ingestBoardRow` use today.
2. Active tail: existing `readTailBytes(active, cursor.offset)` where `cursor.offset` is relative to **active file only** after Phase-2; during Phase-1, `cursor.offset` may still equal active size while archive holds duplicate prefix (readers must dedupe by byte range, not double-count — implementer uses manifest `archivedByteEnd` to skip overlapping active prefix until truncate).
3. Full-read bypass (`TOWER_LEDGER_NO_CURSOR=1`, lock fallback): concatenate archive + active parse, same as today’s `readAllFull` semantics.

**Phase-1 vs Phase-2 live apply:**

| Phase | What happens to live file | Consumer impact | Approval |
|-------|---------------------------|-----------------|----------|
| **Phase-1 (additive prefix copy)** | Unchanged size; prefix copied to archive; manifest + cursor metadata updated | Readers taught to use archive+active; disk usage **does not** drop yet | **Allowed without further yes** after dry-run proof on copy |
| **Phase-2 (truncate or atomic swap)** | Active file shortened or replaced; writers keep appending | Requires cursor rebuild + tower-auto migration + twr poll fix | **BLOCKED until concierge/CORD explicit yes** after disposable proof (see bus-data swap evidence pattern) |

---

## 4. Rotate contract

**Entry points (implementer surface — not built in this unit):**

```bash
# Primary (preferred — isolated from cli.mjs w3 churn)
bun ~/.tower/rotate.mjs --store board --dry-run
bun ~/.tower/rotate.mjs --store board --phase 1 --apply
bun ~/.tower/rotate.mjs --store flight --older-than 30d --dry-run

# Alias (optional, if w3 plane merges)
bun ~/.tower/cli.mjs rotate --store ledger --dry-run
```

**Flags (minimum):**

| Flag | Meaning |
|------|---------|
| `--store board\|ledger\|odometer\|flight\|deliverables\|all` | Target store |
| `--dry-run` | Plan only; no writes to live or archive |
| `--phase 1\|2` | Phase-1 copy-only vs Phase-2 truncate/swap (Phase-2 refuses without `TOWER_ROTATE_PHASE2_OK=1`) |
| `--older-than Nd` | Directory stores only |
| `--evidence-dir PATH` | Proof artifacts (default: worktree `briefs/tower/w4-retention-evidence/rotate-proofs/<stamp>/`) |

**Lock file:** `~/.tower/cursors/rotate.lock` — same `wx` pid-file pattern as `withCursorLock` in `tower-ledger.mjs`. Refuse to start if lock held. JSONL cursor locks (`ledger.inbox.lock`) are independent; rotate must not hold inbox lock across long copies.

**Proof-on-copy requirement:** Before any `--apply`, run against a **full copy** of relevant state:

1. Default proof root: `briefs/tower/w4-retention-evidence/rotate-proofs/<stamp>/` (worktree) or `/tmp/tower-rotate-proof-<stamp>/`.
2. Copy `board.jsonl` / `ledger.jsonl` / etc. + `cursors/` into proof root.
3. Execute rotate logic against the copy.
4. Verify: `sha256(archive segment)` matches manifest; parse line count equals expected; `boardFor` / `inboxState` on proof tree match pre-rotation baseline from `TOWER_LEDGER_NO_CURSOR=1` full-read.
5. Write `PROOF.md` + hashes into evidence dir.

**What live apply is allowed without further yes:**

- Phase-1 `--apply` for any store after successful dry-run + proof-on-copy in evidence dir.
- Directory moves (flight/deliverables) to `archive/` after copy verify, with active dir removal of **only** the verified copy (archive retains original).

**What requires concierge/CORD yes:**

- Phase-2 truncate or atomic swap of `board.jsonl`, `ledger.jsonl`, or `odometer.jsonl`.
- Any operation that shrinks or replaces a live JSONL inode while writers may be active without tail-merge plan (see `COMPACTION-PROPOSAL.md` P5–P6 pattern).
- Board repair/compaction (26 bad lines) — separate bus-data gate.

**Post-rotate cursor updates:** Atomically write cursor JSON with new `archivePath`, `archivedByteEnd`, reset active-relative `offset` on Phase-2; bump `mtimeMs`/`size` from post-rotate stat.

---

## 5. Implementation sequencing (for ORCH w4-rotate — not this unit)

1. `rotate.mjs` + `tower-ledger.mjs` archive helpers + manifest writer.
2. Migrate `tower-auto.ts` to lib `inboxState` (both pi and herdr-spine).
3. Fix `twr.ts` poll to stat-based change detection.
4. Proof-on-copy in worktree evidence dir.
5. Phase-1 live board prefix archive (largest win, no truncate).
6. Phase-2 board truncate — **wait for yes**.
7. Flight/deliverables date-bucket moves (parallel, low risk).

---

## 6. Per-consumer one-liners (post-rotation)

- **cli.mjs:** Extended ledger/board cursors read archive prefix + active tail; odometer/pheromones unchanged until their rotation runs.
- **tower-ledger.mjs / lib.mjs / server.mjs:** Single cursor system gains archive fields; full-read fallback concatenates archive+active.
- **twr.ts:** Poll via stat/tail; render via `boardFor` with archive-aware cursor.
- **statem.ts:** Append-only — no change.
- **ctl-fleet:** No Tower JSONL reads — no change.
- **Hooks (session-start, flight-recorder, stop-guard, …):** Inherit lib `inboxState` archive support.
- **tower-auto.ts:** Must call lib `inboxState` — **required before Phase-2**.
- **Odometer hooks:** Append to active; dedup reads active (+ recent archive if rotated).
- **Spine/MCP/cli post:** Append to active board/ledger only.

---

## 7. UNKNOWN

- Whether any operator workflow requires **flight** snapshots older than 30 days from the active `flight/` dir without explicitly passing an archive path — default policy keeps them in `archive/flight/` only.
- Exact scheduling mechanism (launchd vs manual vs herdr cron) for running `rotate.mjs --dry-run` weekly — [UNKNOWN]; policy defines triggers, not scheduler.
- Whether `ledger.jsonl.offset.json` is consumed by production code today or is test-only artifact — grep in agent-core store shows no reader besides test cursors; treat as experimental; **do not** build rotation around it without audit.

---

## Sources

- Live sizes: `wc -l`, `du -sh` on `~/.tower/` 2026-08-13T15:22Z (this session).
- Cursor behavior: `primitives/hooks/tower-ledger.mjs` (`cursorValid`, `syncLedgerInboxCursor`, `syncBoardScopeCursor`, `withCursorLock`).
- Consumers: `primitives/mcps/tower/cli.mjs`, `server.mjs`, `primitives/tools/statem/twr.ts`, `statem.ts`, `primitives/hooks/flight-recorder.mjs`, `~/.pi/agent/extensions/tower-auto.ts`, `herdr-spine/docs/ctl-fleet.md` (lines 318–322).
- CORD fence: brief `agnt-coder-w2y-ph.md`, ORCH board findings on `tower/w4-retention`, `briefs/tower/bus-data/COMPACTION-PROPOSAL.md`.
