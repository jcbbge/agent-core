# assay golden scoring notes

Hand labels (`*.labels.jsonl`): `{atom, decoy, present, label, evidence}` with
`label` in P3|P2|P0.

Instrument mapping for agreement:

| Hand | Instrument |
|------|------------|
| P3 SHAPED | SHAPED |
| P2 ECHOED | ECHOED |
| P0 inert | no post-wake hit |
| theme bleed | THEME-ONLY |

THEME-ONLY and UNCLASSIFIED are never counted as SHAPED.

**Presence** — instrument `present` = any post-wake phrase hit (match stage);
compared exactly to hand `present` per atom row.

**SHAPED recall floors** (unique atoms, hand P3, instrument SHAPED): s1≥8,
s2≥3, s4≥1. s3/s5: zero false SHAPED (instrument SHAPED when hand label is
not P3, or on decoys).

**Decoy FP** — corpus-wide false SHAPED on decoy rows must be 0/25.

**Dark sessions** — wake missing or `KILL SWITCH ACTIVE`: counted in
dark-rate, excluded from propagation stats.

Match line numbers are 1-based JSONL file lines (same convention as hand
`evidence: "line N: ..."`).

When classify/LLM is unavailable, hits remain UNCLASSIFIED; presence metrics
still computed from match; SHAPED agreement reported as degraded (never
invented labels).
