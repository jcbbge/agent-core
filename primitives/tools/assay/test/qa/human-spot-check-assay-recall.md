# Human QA — assay recall multi-needle spot-check

**class = human**

- [x] **what changed:** `primitives/tools/assay/src/match.zig` (multi-needle claim-derived matching) · **how to verify:** take the golden report after the change, pick 5 atoms newly marked present in s1/s2 that were absent at baseline, open the cited transcript lines, confirm each is a genuine presence (the claim's substance really appears), not a lexical accident · **what to expect:** 5/5 genuine · [x] pass / [ ] fail

**Result (executed by CORD w29:p2, 2026-08-12, per brief addendum): 5/5 GENUINE — PASS.**

Method: per-atom presence probes compiled from HEAD `match.zig` (old) and the
combined verify tree (new), run over s1/s2 labels + sessions; flipped set =
HIT-new ∧ MISS-old. All 10 flipped atoms are hand-labeled `present=true,
decoy=false` (zero invented positives). Five opened at the cited transcript
lines:

| Atom | Instrument hit | Hand-label evidence | Verdict |
|------|---------------|---------------------|---------|
| s1 "The cliff is complexity accretion." | line 229 | line 229, same phrase | genuine — verbatim substance |
| s1 "Demonstrated, not asserted. Ground truth…" | line 31 | line 31, same phrase | genuine — labeler cited the same line |
| s2 "…passive telemetry sink…" | line 27 | line 85 (same episode substance) | genuine — atom recurs; earlier occurrence |
| s2 "Obedience to the exact command syntax…" | line 391 | (labeler evidence empty) | genuine — "exact done-when commands … from the brief" |
| s2 "…reply with exactly the word ACK…" | line 30 | line 47 (same ACK pattern) | genuine — instruction-echo pattern quoted |

Note for the operator: re-checkable via the same probe procedure; probe
sources preserved at `/tmp/assay-probe/` (ephemeral).
