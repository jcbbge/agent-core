# orch-vein evidence — DONE

## Workers (all .done verified, panes reaped)
- agnt-vein-scaffold (w1Q:p5) — skeleton + CLI pin
- agnt-vein-extract / classify / report (w1Q:p6–p8) — module bodies
- agnt-vein-accept (w1Q:pB) — wire + acceptance; unblocked once for CC hang (io_ctx takeDelimiter)

## ORCH-verified acceptance (2026-08-11)

### Pass-1/2 (40 sessions) — GREEN exact
- calls 2246 (1597 CC / 649 pi)
- result bytes 1,988,837
- rewrite-ineligible 2080/2246 (92.6%); eligible 166 / 243,668 B
- exact ≥3 loops 33 / excess 162
- errors 298 = 274 generic / 16 syntax / 3 missing-file / 3 timeout / 2 test
- hooks 1826 / 922998 ms; afplay 312 / 657476 ms (71.2%)

### Pass-3 (20 sessions) — GREEN exact (after classifier fix)
- calls 988 (618 CC / 370 pi); bytes 1,049,463
- eligible 63 / 83,181 B
- errors 85 = 61 generic / 14 dead-path / 5 syntax / 5 timeout
- hooks 266 / 161961 ms; afplay 53 / 111276 ms

### Other gates
- zig build + zig build test exit 0
- schema-drift: UNKNOWN + exit 4
- wall: pass3 scan 0.08s; pass12 scan 0.31s (seconds, not minutes)

## Artifacts
`~/agent-core/primitives/tools/vein/` (slim layout)
`test/acceptance/pass12-*` and `pass3-*`
Worker evidence under `briefs/fringe/latch-vein/workers/`

## Commits
None (CORD owns commits). Install out of scope.

---

## Addendum — truth-law hole (CORD gate, 2026-08-11)

**Hole:** sessions-file entries that failed resolve were silently skipped (`scan.zig` `catch continue`; `main.zig` `.skip`), so bad ids and relative `.jsonl` paths exited 0 with header-only CSV.

**Worker:** `agnt-vein-resolve-fix` (w1Q:pW, reaped). Pin: unresolvable → **exit 3** + per-token **stderr** `UNKNOWN: unresolvable session <token>`; existing relative `.jsonl` resolves honestly; schema-drift of a resolved file stays **exit 4** + stdout `UNKNOWN`.

### ORCH re-verify

| Check | Result |
|-------|--------|
| (a) bad id `no-such-session-id-12345` | exit **3**; stderr names token; stdout empty; no CSV written |
| (b) relative `test/fixtures/schema-drift.jsonl` | honest resolve → exit **4**; stdout `UNKNOWN` |
| (c) pass12 CSV + 4 reports vs prior acceptance | **byte-identical** (`cmp`); scan 0.26s |
| (c) pass3 CSV + 4 reports vs prior acceptance | **byte-identical** (`cmp`); scan 0.07s |
| (d) `zig build` + `zig build test` | exit **0** |

Worker evidence: `briefs/fringe/latch-vein/workers/agnt-vein-resolve-fix.evidence.md`
README documents the exit-3 pin under Exit codes / Truth law.
