# SCHEMA-COORD-REPORT — multi-kind board rows (T5)

**Author:** CORD bus-data (completing evaporated SAGT schema-coord)
**Date:** 2026-08-13
**Field WA:** `ph-msroszo6-cn3g` (route hint: CORD tower)

## Ruling (bus-data)

Two row families on `board.jsonl` — do **not** invent synthetic `from` on machine rows:

| Family | Discriminator | `from` |
|---|---|---|
| Authored fleet mail | `type` ∈ claim\|finding\|note\|done | required non-empty at write |
| Machine emission | `kind` ∈ lineage, **verify-gate-bypass** (live name), etc. | absent; readers use `from ?? '?'`; carry `via` |

Doctrine today (`COMMS-ARCH.md` §Board row schema) says `bypass-audit` as example — live cursor-shim emits `kind=verify-gate-bypass`. **Ask CORD tower to co-sign and rename the example to `verify-gate-bypass`.**

## Reader proof (canonical checkout, 2026-08-13)

```
authored: [2026-08-13T00:00:00Z] (note) CORD bus-data @ tower/bus-data: demo
machine: [2026-08-13T00:00:00Z] (verify-gate-bypass) ? @ -: /tmp/x
renderMessage machine: Tower x · lineage · from unknown · 2026-08-13T00:00:00Z
boardFor ok 2
```

## CORD tower answer

UNKNOWN at report time — ask posted; do not block flock/integrity Land on co-sign edit.
