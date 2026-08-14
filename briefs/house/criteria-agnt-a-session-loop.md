# Acceptance criteria — AGNT A session-loop (law encode)

Unit: encode failures 1,3,4,6 + desk-card 7 into concierge profile/skill.
Not product code — house law markdown only.

## Must pass (ORCH verifies against disk)

1. `primitives/profiles/concierge.md` forbids "say the word" and "which first" (or equivalent ban on making the operator the scheduler). Session start / first operator message is authorization; open questions only on hard stops.
2. Same file states one load-bearing CORD held until Land or Park; other threads async and must not starve it; operator "top priority" = load-bearing.
3. Desk card states mailbox ≠ substrate; Tower operational only if PHASE2-WRITE-GATE-PROOF.md (or successor) exists and probe was run; else "mailbox only"; never "assume operational."
4. Collect = named artifact exists; no "I'll collect later" without latch/path.
5. Desk-card spawn line does not hardcode `--kind claude`; points at `primitives/directives/<harness>.md`.
6. `skills/concierge/SKILL.md` remains a door pointing at the profile (no doctrine sermon duplicated).
7. No edits outside the two exclusive files. No commit.
