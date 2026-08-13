# Test criteria — T2 recover-26 (from plan only)

| Assert | Criterion |
|--------|-----------|
| inventory consumed | Worker read INVENTORY.json with bad_lines length 26 |
| 26 handled | Every bad line number has either recovery append(s) or quarantine file `quarantine/line-NNNN.raw` plus unrecoverable note |
| append-only | Original 26 lines still present and still unparseable on live board; no truncation |
| recovery rows parse | Every row appended by this unit JSON.parse-succeeds |
| provenance | Each recovery note carries original line number, damage_class, inferred-vs-read distinction |
| no fabricated fields | id/from/topic only when read from damaged line, never guessed |
| report + done | RECOVERY-REPORT.md and agnt-t2-recover-26.done exist |
