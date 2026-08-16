# SAGT [residual-scan-r2] — write RESIDUAL-APPEND-SCAN.md (retry)

Prior SAGT panes self-reaped without writing artifacts. This retry MUST write files under the MAIN checkout (not a worktree): `/Users/jrg/agent-core/briefs/tower/bus-data/`. Do NOT use emojis. No production edits. No commit.

## Pre-Verified Facts (ORCH verified)

- Known in-fence residual (fixed on branch): `primitives/tools/statem/statem.ts` bare BOARD append — migrating on `tower/bus-data-residuals`.
- Search under `/Users/jrg/agent-core/primitives` for `appendFileSync` writing `board.jsonl`/BOARD outside flocked `append()`. Exclude `_attic`, tests.
- Known out-of-fence WAs already open: cursor-shim `ph-mss6xokq-2ui4`, spine twin `ph-mss6xokt-8xif` — reference, do not duplicate unless new evidence.
- Absolute output paths (REQUIRED):
  - `/Users/jrg/agent-core/briefs/tower/bus-data/RESIDUAL-APPEND-SCAN.md`
  - `/Users/jrg/agent-core/briefs/tower/bus-data/sagt-residual-scan.done`
  Also copy same two files into `/Users/jrg/.cursor/worktrees/agent-core/wt-orch-bus-data-residuals/briefs/tower/bus-data/` if that dir exists.

## Tower

- Topic `tower/bus-data`, from=`SAGT residual-scan-r2`. Emit WA for each NEW out-of-fence BOARD writer. Never hand-append board.jsonl.

## Tasks

1. Complete the scan note + `.done` at the absolute paths above. — done when: both files exist on disk (`ls` proves it).
2. Emit WA only for new BOARD bypasses.

## Constraints

- Touch ONLY those brief files (+ pheromone emits). Do not modify production sources.

## Report back with

- residual list
- WA ids or "none new"
- `ls -la` of both absolute paths
