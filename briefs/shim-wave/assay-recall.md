# assay matcher recall — claim-derived multi-needle match

Mission: assay's presence matcher has precision 1.0 but recall 0.063-0.300
(per-session, golden report in primitives/tools/assay/). Implement recall
proposal 1: claim-derived multi-needle matching — derive 2-3 distinctive
sub-phrases from each atom's full claim text (not just the hint slug) and
match any-of. The golden set (5 hand-labeled sessions) is the ONLY tuning
corpus; the decoy set is the wall.
Done when: zig build test exit 0 · golden recall strictly improves on at
least the two nonzero sessions (baseline 0.300/0.063) with NO invented
positives (spot-check 5 new matches against transcripts by hand) · decoy-FP
remains exactly 0/25 — a single decoy hit means the change is REJECTED, not
tuned around.
Partition: primitives/tools/assay/ only. Coordinate nothing — assay-writer
lane touches llm.zig; you own matcher files; if you must touch a shared
file, claim it on the board first.
Board topic: agent-core/assay-recall. On full verification write
~/agent-core/briefs/shim-wave/done/assay-recall.done (LAST action).

---

## CORD addendum — acceptance criteria (verified baseline, 2026-08-11)

Baseline reproduced this session on main (`zig build test` exit 0; `assay
golden --labels-dir ~/agent-core/briefs/fringe/assay-labels --no-classify`,
exit 5 = degraded-classify, expected):

| Session | presence precision | presence recall |
|---------|--------------------|-----------------|
| s1 | 1.000 | 0.300 |
| s2 | 1.000 | 0.063 |
| s3 | — | 0.000 |
| s4 | 1.000 | 0.788 |
| s5 | — | 0.000 |

Corpus decoy false-SHAPED: 0/25.

**Automated acceptance criteria (the Tester reproduces ALL):**

1. `zig build test` exit 0 in `primitives/tools/assay/`.
2. Golden presence recall: s1 strictly > 0.300 AND s2 strictly > 0.063.
3. No regression: s4 recall ≥ 0.788; every session's presence precision
   remains 1.000 (no invented positives).
4. Corpus decoy false-SHAPED remains exactly 0/25. A single decoy hit =
   REJECTED (do not tune around it; report back).
5. New unit tests cover the multi-needle semantics: each atom yields 2–3
   distinctive sub-phrases derived from its full claim text (not only the
   hint slug); presence = match on ANY needle; an atom with zero needles
   matched counts as absent.

**Human-QA item (class = human, /qa-doc shape) — CORD executes, operator may re-check:**

- [ ] what changed: `primitives/tools/assay/src/match.zig` (multi-needle
  claim-derived matching) · how to verify: take the golden report after the
  change, pick 5 atoms newly marked present in s1/s2 that were absent at
  baseline, open the cited transcript lines, confirm each is a genuine
  presence (the claim's substance really appears), not a lexical accident ·
  what to expect: 5/5 genuine · [ ] pass / [ ] fail

**Partition reminder:** this lane owns matcher files (`src/match.zig`,
matcher tests). `src/llm.zig` and classify belong to the assay-writer lane —
do not modify. Golden labels under `briefs/fringe/assay-labels/` are the
tuning corpus (data, readable); transcripts they cite are readable for
spot-checks.
