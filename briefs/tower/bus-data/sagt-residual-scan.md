# SAGT [residual-scan] — bare appendFileSync→BOARD writers under primitives/ (T4)

Repo `/Users/jrg/agent-core`. Read-only scan + note + field WAs. Do NOT use emojis. No production edits. No commit. No live board rewrite.

## Pre-Verified Facts (ORCH verified 2026-08-13 this session)

- Known in-fence residual (being fixed by sibling): `primitives/tools/statem/statem.ts:97` `appendFileSync(BOARD, …)`.
- Flocked path: `tower-ledger.mjs` `append()` (uses `appendFileSync` only inside lockfile fallback — that is NOT a bare BOARD bypass).
- Exclude: `primitives/_attic/**`, `**/*test*`, and non-BOARD targets (deliverables, manifests, traces, audit logs).
- ORCH pre-scan hits (verify/refine): `statem.ts:97` (BOARD); `rotate.mjs:256` (manifestPath — likely not BOARD); `server.mjs:199` (deliverable path — not BOARD); `peer-session.ts` (TRACE_FILE — not BOARD); attic mind-wake / alembic — exclude.
- Out-of-fence already known: cursor-shim printf WA `ph-mss6xokq-2ui4`; spine twin `ph-mss6xokt-8xif` — do not duplicate; may reference.

## Parallel Work Notice

- Siblings own statem/twr/COMMS-ARCH — do not edit those files.
- Ignore unrelated dirty tree.

## Tower

- Topic `tower/bus-data`, from=`SAGT residual-scan`.
- Note on board when scan complete. Emit `work-available` pheromones for each remaining out-of-fence bare BOARD writer (evidence = file:line). Never hand-append board.jsonl.

## Tasks

1. Search `primitives/` for `appendFileSync` (and equivalent direct board appends) that write `board.jsonl` / BOARD outside flocked `append()`. Exclude attic + tests. — done when: short note lists each remaining hit with path:line and whether in/out of this ORCH fence.
2. Emit WA (topic `tower/bus-data`) for each out-of-fence BOARD writer still open after noting known cursor-shim/spine items. If none remain beyond known out-of-fence WAs, say so explicitly.
3. Write `briefs/tower/bus-data/RESIDUAL-APPEND-SCAN.md`.
4. Write `briefs/tower/bus-data/sagt-residual-scan.done`.

## Constraints

- Touch ONLY: `briefs/tower/bus-data/RESIDUAL-APPEND-SCAN.md`, `briefs/tower/bus-data/sagt-residual-scan.done`. Do not modify production sources. Do not commit.

## Report back with

- residual list (path:line + classification)
- WA ids emitted (or "none new")
- `.done` path
