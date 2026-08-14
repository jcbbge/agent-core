Flock herdr-spine bare board_append writers. Do NOT use emojis anywhere.

You are ORCH for unit `tower/spine-board-flock`. CORD Tower coordinates. Claim field WA `ph-mss83uru-k4zr` (and any child WAs you emit), heartbeat ~20s, work-done with evidence. Board topic: `tower/fully-operational` (also note on `tower/bus-data`).

## Pre-Verified Facts (CORD verified 2026-08-14)

- Residual: `briefs/tower/bus-data/RESIDUAL-APPEND-SCAN.md` lines 50–53 — herdr-spine bare BOARD appends.
- Live code: `/Users/jrg/herdr-spine/bin/handlers/_spine_common.py:326-340` — `board_append()` uses `open(..., "a")` + `json.dumps + "\n"` with **no flock**.
- Sibling: `/Users/jrg/herdr-spine/bin/spine-claim` lines ~99–100 — embedded `board_append()` same bare pattern (scan cites it).
- Canonical flocked writer (doctrine): `~/agent-core/primitives/hooks/tower-ledger.mjs` `append()` — `flock(2) LOCK_EX` (or lockfile fallback). Match that contract in Python via `fcntl.flock(fh.fileno(), fcntl.LOCK_EX)` around the write; still newline-terminated JSON line; still create parent dirs.
- Field WA: `ph-mss83uru-k4zr` topic `tower/bus-data`, route hint CORD tower, payload `_spine_common.py`, evidence RESIDUAL-APPEND-SCAN.md.
- Twin WA `ph-mss83urd-6shl` (cc-hooks/server.mjs) already CLOSED by CORD — three-way sha identical. Do not re-open.
- cursor-shim printf WAs are NOT yours (`to_role: CORD cursor-shim` / concierge need-help).
- Repo: `/Users/jrg/herdr-spine` is git. Branch first. CORD lands to main after verify.
- Existing tests under herdr-spine for handlers — extend or add a small unit test for flocked append if a test harness exists; otherwise live smoke with a temp `SPINE_BOARD_PATH`.

## Parallel Work Notice

- Ignore agent-core dirty unrelated files. Ignore cursor-shim. Ignore Arc.
- CORD bus-data owns board.jsonl schema/writer in agent-core — you only touch herdr-spine Python/shell board_append.

## Tower

- Claim/heartbeat/done on `ph-mss83uru-k4zr`.
- Findings on `tower/fully-operational` and a short note on `tower/bus-data`.

## Tasks

1. Branch `fix/spine-board-flock` on herdr-spine — done when: branch exists.
2. Flock `_spine_common.board_append` — done when: LOCK_EX held for the write; newline JSON; SPINE_BOARD_PATH still honored; no behavior change to entry shape.
3. Flock `spine-claim` embedded board_append (or factor to share `_spine_common.board_append` if safe/small) — done when: no bare open-append remains on those two sites (rg proof).
4. Smoke: write via board_append to a temp board path with concurrent writers if feasible; at minimum prove single write + file ends with `\n` + parseable JSON. Prefer existing tests.
5. Commit on branch + `.done` at `~/agent-core/briefs/tower/spine-board-flock.done` + board FINAL. Do not merge to herdr-spine main — CORD gates.

## Constraints

- Touch ONLY herdr-spine board_append sites (+ tests). No agent-core edits. No cursor-shim.
- Do not delete cc-hooks/. Do not change install.sh.
- Testing: no mocks of flock that hide failure; real fcntl.

## Report back with

- Commit SHA, diff summary, rg proof no bare append at cited lines, smoke output, field done id, deviations.
