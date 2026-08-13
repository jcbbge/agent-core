# CORD [Tower] — scope fence after bus-data split (2026-08-13)

## Not ours (CORD bus-data, workspace w2Z, topic `tower/bus-data`)

- Malformed `board.jsonl` rows and recovery
- Rows missing `from` (including distinguishing legitimate machine shapes)
- Writer path that produced corruption; verify/deploy writer patch
- Row-shape schema ruling
- Compaction proposal (awaiting concierge yes)
- drift-check REPO_ONLY for `write-path.test.mjs` + spine `server.mjs` contested sync

**Hard fence:** do not touch `board.jsonl` for repair, do not modify the writer.
If a data-integrity issue surfaces during W3–W5, post to `tower/bus-data` and move on.

## Ours (topic `tower/fully-operational`)

| Item | Status |
|---|---|
| W0 version control + cutover + drift gate | **CLOSED** (landed; live drift may FAIL on bus-data files — their fix) |
| W3 prove every plane by exercise | **UNIT GO** (evidence verified); exercise-axis fully-op **NO-GO** until F1/F9/F4 |
| W3 plane fixes (F1/F9/F4) | **IN FLIGHT** ORCH w2Y:p8 |
| W4 retention / rotation | **IN FLIGHT** ORCH w2Y:p9 |
| W5 remodel debris | Brief drafted; spawn after W4 gate |

Schema: bus-data ruled authored vs machine row kinds — consumers tolerate missing `from` on machine rows.

Stopping rule: only when all ours CLOSED, or BLOCKED row naming concierge-owned dependency.
