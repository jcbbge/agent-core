# FINAL — ORCH w2-consumer-resilience
Date: 2026-08-13

## Verdict: GO (unit closed)

### What landed where

| Piece | Source | Status |
|-------|--------|--------|
| Core skip-and-count `parseJsonl` / `readJsonlStats` | bus-data `3e2e108` / merge `49698f6` | on main (superseded our first coder `jsonlIntegrity` arm) |
| `cli board` integrity footer | bus-data | on main |
| `cli status` integrity mirror | AGNT coder w2y-p18 → ORCH integrated to main | on main (dirty until CORD commit) |
| COMMS-ARCH §JSONL consumer integrity + compaction DEFERRED | AGNT coder w2y-p18 → ORCH integrated | on main (dirty) |
| `jsonl-integrity.test.mjs` | test-maker w2y-p19 + test-fix w2y-p1B | on main (dirty); **15 pass / 1 skip / 0 fail** |
| Consumer matrix | SAGT headless → ORCH collected | `CONSUMER-MATRIX.md` |

### Live proof (ORCH this session)

```
readJsonlStats(BOARD).bad_line_count === 26 (max bad line 2577)
bun ~/.tower/cli.mjs status → EXIT 0 + integrity: 26 unparseable line(s) on board
bun test jsonl-integrity.test.mjs → 15 pass / 1 skip / 0 fail
```

### Consumer matrix summary

throwers=0. GAPs: 40-tower-bridge no count surface; twr GAP-count-only; 10-notify/statem write-only.

### Pheromones

- Parent work-available: `ph-msrpa83e-efs6`
- Child emits: `ph-msrpdeat-w30f`, `ph-msrpdebg-gos7`
- Claims/heartbeats: see `pheromones.jsonl` from ORCH w2-consumer-resilience

### Deviations

1. Bus-data raced the same ledger partition; first make arm's API names discarded.
2. SAGT researcher (Ask/idle) failed twice to write evidence; collected from headless report.
3. `cli board` lost topic filter briefly in bus-data land (`boardFor(cwd)` only) — out of this unit; note for CORD.

### SHAs

- Main at close (pre-commit of our dirty files): run `git rev-parse HEAD` — tip includes flock+integrity merge.
- Dirty pending CORD land: `COMMS-ARCH.md`, `cli.mjs`, `jsonl-integrity.test.mjs`.
