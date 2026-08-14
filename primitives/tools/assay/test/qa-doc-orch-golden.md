# QA — assay writer fix ORCH integration (class = human)

**Scope:** golden report regeneration after llm.zig Zig 0.16 Allocating-writer fix lands.
**Routing:** ORCH only — not unit-test assertions (decoy tuning and SHAPED floors are integration gates).

---

## H-ORCH-1 — SHAPED recall floors populated (not UNKNOWN)

1. **Task.** Writer fix restores live classify; golden report must show SHAPED agreement metrics instead of degraded UNKNOWN floors.
2. **Change + why.** `assay golden` runs classify against `http://127.0.0.1:10240/v1`; when HTTP response capture worked, per-session SHAPED recall floors are scored.
3. **How to verify.**
   ```bash
   cd ~/agent-core/primitives/tools/assay
   zig build && ./zig-out/bin/assay golden \
     --labels-dir ~/agent-core/briefs/fringe/assay-labels \
     --out ~/agent-core/briefs/fringe/assay-labels/golden-report.md
   grep -E 'SHAPED|UNKNOWN|Classify' ~/agent-core/briefs/fringe/assay-labels/golden-report.md
   ```
4. **Expect.** Report does not mark classify as DEGRADED; SHAPED recall floors show numeric values per design-notes (s1≥8, s2≥3, s4≥1; s3/s5 zero false SHAPED), not UNKNOWN.
5. **Acceptance.** class = human
   - [x] `assay golden` exits 0 (not 5)
   - [x] SHAPED floor lines are numeric, not UNKNOWN (FAIL/PASS evaluated; unique SHAPED on P3 currently 0)

---

## H-ORCH-2 — Decoy false-SHAPED remains exactly 0/25

1. **Task.** Writer fix must not regress the standing honesty metric: corpus decoy false-SHAPED stays 0/25.
2. **Change + why.** Decoy FP is sacred; any movement is a stop condition — do not tune thresholds to recover.
3. **How to verify.**
   ```bash
   grep -i 'decoy' ~/agent-core/briefs/fringe/assay-labels/golden-report.md
   ```
4. **Expect.** Line reads exactly `Decoy false-SHAPED: 0/25` (or equivalent wording with 0 false positives out of 25 decoys).
5. **Acceptance.** class = human
   - [x] Decoy false-SHAPED is exactly 0/25
   - [ ] If not 0/25: STOP, board alert to operator — no tuning
