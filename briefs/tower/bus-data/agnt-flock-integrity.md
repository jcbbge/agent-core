# AGNT unit [flock-integrity] — flock append + tolerate-and-count (T2+T3)

Repo `/Users/jrg/agent-core` on branch from `main` (unit slug `flock-integrity`). Close the unlocked-append class and make every board JSONL consumer tolerate AND COUNT damage. Do NOT use emojis anywhere. This brief is the `cursor-fleet make` unit (coder + test-maker bifurcated).

## Pre-Verified Facts (ORCH verified 2026-08-13 this session)

- Live `~/.tower/board.jsonl` still has exactly **26** unparseable lines; max bad line **2577**; recovery/quarantine already exist. Do not rewrite or delete those lines.
- `primitives/hooks/tower-ledger.mjs:76` — `export const append = (file, obj) => appendFileSync(file, JSON.stringify(obj) + '\n')` — **no flock**.
- `primitives/mcps/tower/lib.mjs` re-exports `../../hooks/tower-ledger.mjs` — patching ledger patches deploy via `~/.tower/lib.mjs` symlink.
- `primitives/mcps/tower/cli.mjs` post path (~L150–166) uses bare `appendFileSync(BOARD, …)` — second unlocked path. `server.mjs` board_post already calls `append()` from lib.
- `parseLines` / `readAllFull` (~L174–191 in tower-ledger.mjs) skip bad lines via catch→null→filter — silent tolerance, **no count surface**.
- Concierge ruled compaction NO; proposal is DEFERRED. Do not compact. Append-only only.
- Bun has no `fs.flock` export; macOS has `flock(2)`; Python `fcntl` works. Acceptable: real exclusive lock around stringify+append (fcntl/flock via Bun native/ffi, or exclusive lockfile held for the critical section). Lock per write — no maintenance window / no whole-file rewrite.
- Dirty working tree may include unrelated `cli.mjs`/`server.mjs` edits on the main checkout (topic filter / mark_relayed) owned by CORD tower planes work — your worktrees fork clean from the make baseline; do not investigate or merge those dirty edits. Touch only your partition in the worktree.
- Exemplar tests: `primitives/mcps/tower/write-path.test.mjs` (13/13 on main). Extend or add sibling `flock-integrity.test.mjs` / criteria — no mocks of flock away.
- Proof path (exact): `/Users/jrg/agent-core/briefs/tower/bus-data/FLOCK-INTEGRITY-PROOF.md`

## Parallel Work Notice

- CORD tower (w2Y) owns retention/planes/doctrine (`COMMS-ARCH.md`) — do not edit COMMS-ARCH.
- ORCH bus-data-hardening owns integration; you do not commit.
- Compaction DEFERRED — out of scope.
- Ignore unrelated dirty/untracked briefs.

## Tower

- Board topic `tower/bus-data`, from=`AGNT flock-integrity` (coder) / `AGNT flock-integrity-tests` (test-maker).
- CLAIM first, findings during, `.done` last. Prove via cli/MCP — never hand-append board.jsonl.
- Field: heartbeat claims on flock `ph-msro2bbg-xpzs` and integrity `ph-msrosz2u-zaf2` while working (30s TTL); work-done with `ref` + evidence when your half finishes (coder owns flock evidence; test-maker owns criteria evidence — ORCH closes field after verify).
- spine-report task/verdict on Herdr.

## Tasks

### Implementer (coder) — T2 + T3 code

1. **Flock append (T2):** Change `append()` in `tower-ledger.mjs` so stringify+append runs under a real exclusive lock (flock/fcntl or equivalent). Route `cli.mjs` post through the same `append()` helper — no second unlocked board write. — done when: only one unlocked-append path remains for board/ledger via `append()`; residual limits documented in proof (e.g. writers that bypass `append()`).
2. **Concurrent stress proof:** Run N parallel writers (real processes) against a temp JSONL using the new `append()`; show zero concatenated-object lines. Record command + output in proof. — done when: proof shows N, duration, parse check, concat count=0.
3. **Tolerate AND COUNT (T3):** Extend parse/`readAllFull` (or add a stats sibling used by readers) so consumers get `{ rows, bad_line_count, bad_line_numbers? }` (or equivalent recorded stats). Wire at least one user-visible surface: prefer `cli.mjs board` footer and/or `board_read` return text and/or `twr` — pick and prove. Live board via that surface must report **26** (or current) bad lines, not hide them. — done when: live command output shows the count; machine rows without `from` still render (`from ?? '?'`).
4. Write `briefs/tower/bus-data/FLOCK-INTEGRITY-PROOF.md` with flock residual limits + integrity command proof.
5. Write `briefs/tower/bus-data/agnt-flock-integrity.done`.

### Test-maker — intent tests only

- From this plan only (do not read implementer code): author executable tests for (a) clean file → bad_line_count=0; (b) file with N bad lines → count=N and rows exclude them; (c) machine rows (`kind`+`via`, no `from`) still render; (d) concurrent append stress (or harness calling the same append API) produces no concatenated objects. No mocks. Write `.done` for test-maker half. Do not run the full fleet against live board.jsonl destructively — use temp files for stress/count unit tests; live count proof is coder's.

## Constraints

- Touch ONLY: `primitives/hooks/tower-ledger.mjs`, `primitives/mcps/tower/cli.mjs`, `primitives/mcps/tower/server.mjs` (only if board_read surfacing needs it), `primitives/mcps/tower/*flock*` / `*integrity*` test+criteria files, `primitives/tools/statem/twr.ts` (only if chosen as surface), `briefs/tower/bus-data/FLOCK-INTEGRITY-PROOF.md`, `briefs/tower/bus-data/agnt-flock-integrity.done`, `briefs/tower/bus-data/agnt-flock-integrity-tests.done` (test-maker). Do not commit.
- Do not edit `COMMS-ARCH.md`. Do not compact/delete/rewrite live board lines.
- Testing: real files / real parallel appends; no mocks of flock away.
- Prefer non-downtime: lock per write.

## Report back with

- paths changed
- flock mechanism chosen + residual limits
- stress command + concat=0 evidence
- integrity surface command + live bad_line_count output (≈26)
- test file paths + pass counts (if you ran them; test-maker may not run)
- `.done` paths
