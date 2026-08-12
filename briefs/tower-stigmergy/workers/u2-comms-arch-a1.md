Amend ~/.tower/COMMS-ARCH.md with Amendment A1: fifth plane STIGMERGIC FIELD. Do NOT use emojis anywhere. Independent of U1 code. Do not commit.

## Pre-Verified Facts (ORCH verified 2026-08-12 ~16:48 UTC)
- Design §5 Amendment A1 and operator ruling D2 (mission.md §5a): adopt fifth plane STIGMERGIC FIELD.
- Current file: `~/.tower/COMMS-ARCH.md` (168 lines). Section header today: "Four planes, strictly separated" (line 27). Hard invariants include "Dedupe by id, ack by id" (line 70). Component table starts line 73.
- Baseline shasum: `0fad1d9e5e8823d0df1904df66d246bf92f9412076ba2db894c4e879b709cd13` COMMS-ARCH.md.
- Backup law: before edit `cp ~/.tower/COMMS-ARCH.md ~/.tower/COMMS-ARCH.md.bak-$(date -u +%Y%m%dT%H%M%SZ)` then shasum before/after.

## Parallel Work Notice
U1 owns tower-ledger.mjs, cli.mjs, server.mjs, pheromone tests — do NOT touch those. Parallel missions own ctl-fleet*, agent-core/cli/, registry — ignore. This brief owns COMMS-ARCH.md ONLY.

## Tower
- Post finding to topic `constellation-zg/tower-stigmergy` with before/after shasums from real repo cwd (`~/herdr-spine` or `~/constellation-zg`).
- Operator mail: NONE.

## Tasks
1. Backup COMMS-ARCH.md per backup law; record before shasum.
2. Change "Four planes, strictly separated" → five planes. Add plane 5: **STIGMERGIC FIELD (environmental)** — machine-facing, decaying, non-addressed coordination signals on `~/.tower/pheromones.jsonl`. Semantics that MUST appear verbatim in spirit (precise enough for parallel missions to cite as law):
   - emitted with mandatory evidence; observed only through scoped field reader `pheromoneField`
   - NO addressee; NEVER relayed
   - NEVER operator mail; never enter ledger inbox planes
   - `route` is a derivation hint (to_pane > to_role > lineage > topic-scope), not an address
   - TTLs per D5 (work-available 15–60min, work-claimed 30s+heartbeat, work-done 24h, need-help nQ-bounded) with read-time evaporation over the append-only log (the log never shrinks)
   - one rule survives: each plane keeps exactly one audience discipline; the field's audience is whoever the route derives to at read time
3. Update "What each existing component becomes" table with a pheromone / pheromones.jsonl row.
4. Extend "Dedupe by id, ack by id" with: claims/dones carry `ref` to exact pheromone ids.
5. Change NOTHING else (no drive-by edits to other sections).
6. After shasum; post board finding; write `~/agent-core/briefs/tower-stigmergy/workers/u2-comms-arch.done` listing backup path + before/after hashes.

## Constraints
- Touch ONLY: `~/.tower/COMMS-ARCH.md` (+ its `.bak-*`). Do not commit.
- No other ~/.tower files.

## Report back with
- Exact section diffs summarized
- before/after shasum
- backup filename
- confirmation no other content changed (aside from plane count wording and the mandated additions)
- DID NOT COMMIT
