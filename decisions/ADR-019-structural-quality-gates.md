# ADR-019: Skill quality gates must be visible output, not internal checklists

**Date:** 2026-03-21
**Status:** Accepted

## Context

When creating the `/delegate` skill, a quality checklist was placed at the bottom of the skill file as an instruction to run before delivering output. After delivery, obvious flaws were surfaced — naming collisions, missing sections, structural gaps. When asked why the checklist wasn't run first, the answer was task completion bias: generative mode doesn't automatically switch to evaluative mode.

The proposed fix was a memory note ("remember to self-review before delivery"). Josh correctly identified this as insufficient — a rule that depends on the rule-follower's discretion to invoke it fails under the same conditions that caused the original failure.

## Decision

Quality gates in skills must produce visible output. The synthesis, checklist, and verification steps must appear as emitted blocks in the response — not as internal reasoning that may or may not happen.

If a step is internal, it can be skipped silently. If a step is visible output, skipping it produces an obviously incomplete artifact.

## Consequences

**Easier:**
- Users can audit whether the quality pass was actually done
- Skipped gates are immediately visible — a `[–]` with no explanation is defined as unacceptable
- The correct behavior becomes the only path to a complete-looking output

**Harder:**
- Outputs are longer — synthesis block + document + checklist results every time
- Requires discipline in skill design to identify which gates should be visible vs. truly internal

**New problems:**
- Some workflows may not need visible synthesis — need judgment about when to apply this pattern

## Alternatives Rejected

| Alternative | Why rejected |
|---|---|
| Memory note: "remember to self-review" | Same failure mode as the original problem — depends on discretion of the entity with the behavioral gap |
| Post-delivery critique pass | Still requires mode-switching; doesn't prevent the gap, just catches it after |
| External reviewer agent | Overkill for routine skill output; adds latency |

## Resonance

The insight was clean: you can't fix a behavioral gap with a memo addressed to the entity with the behavioral gap. The fix has to be structural — make the wrong behavior produce a visibly broken artifact. This applies beyond skills. Any time a process has quality requirements, those requirements should be embedded in the output format, not in the hope that the producer will remember to apply them.
