---
name: build-skill
description: >
  Compile a skill/prompt/artifact into a more activating version of itself, measured
  not by a judge's taste but by a held-out activation suite. Use when you want to
  make a skill 10x better at firing a model into high-quality operation — "break
  this down with the perspicuity of Karpathy," not "rephrase this." Scaffolds a
  multi-agent matrix (diverse free OpenRouter families) + a neutral-task
  attractor suite + an optional grounding hook. NOT a prose-polishing service.
metadata:
  author: jrg
  version: "0.1"
  tags: skill-building, activation-power, multi-agent, attractor, compilation
  lineage: criticality-matrix, bench, karpathy-autoresearch
---

# Build-Skill — compile, don't describe

You are improving a skill/prompt/artifact so it fires a model into high-quality
operation when loaded. The objective is **activation power**, not elegance: the
register of "break this down with the perspicuity of Karpathy and the
perspicacity of Feynman," not "rephrase this."

## The two layers (the key finding — read this first)

A skill has two layers, and they generalize differently:

- **The prose layer** (the document) is a **family-dependent attractor**. A
  gain measured on one model may be the subject's prior, not the skill. Measure
  it on ≥2 families before trusting a claim.
- **The mechanism layer** (a hook) is a **model-agnostic floor**. It enforces
  behavior regardless of priors. Trust only the hook for universal claims.

Build both. The prose is a family-tuned cue; the hook is the universal floor.

## The protocol — run these in order

1. **Scaffold.** `~/auto-research/skill-for-building-skills/bin/new-run.sh
   <target-skill.md> <run-name>`. Snapshots the target, derives a draft gate
   (distinctive tokens), emits suite templates, git-inits the run dir.

2. **Author the citation layer (do not skip).** Edit `activation_suite.jsonl`
   (explicit, names the skill's domain) and `neutral_suite.jsonl` (neutral tasks
   that NEVER name the domain — the attractor test). The suite quality is
   load-bearing: a wrong held-out set produces a confident wrong answer. Model
   the neutral scenarios on a real codebase of yours (read-only).

3. **Baseline.** `python3 templates/suite.py input/SKILL.md` and
   `python3 templates/neutral_suite.py input/SKILL.md` on the ORIGINAL, on ≥2
   model families (local Qwen + one OpenRouter family). The gaps are the real
   targets. If there are no gaps, stop — there is nothing to optimize.

4. **Run the matrix.** `bash templates/run-matrix.sh <run-name>` spawns N pi
   agents in a herdr tab, diverse free OpenRouter families, each reading the
   brief and writing a candidate; a selector converges them. ~$0.

5. **Verify by citation, cross-family.** Re-run the suites on each candidate
   on ≥2 families. Keep only candidates that fix a gap AND don't regress
   (citation-required, regression-gated). The judge is advisory; the suite is
   ground truth. **Do not trust a keep that doesn't reproduce on a second
   family** — it's a prior, not a skill property.

6. **Subtract before you add.** If a candidate regresses, the move is to
   remove, not scaffold (dose, don't pile — adding description regressed us).
   Aim for the catalytic minimum: the smallest change that shifts the basin.

7. **When prose plateaus, compile the hook.** If `leads_ground`-style
   behavior won't move (the model performs the skill instead of doing the
   work), build `templates/grounding-hook.ts` into the run's `.pi/extensions/`.
   The hook enforces by construction what prose can only ask. Safe because
   grounding is read-only — fire aggressively.

8. **Promote, with the original backed up.** Only after cross-family
   citation. Never overwrite without a backup. The live artifact is a manual,
  human act.

## What this skill is NOT

- Not a prose-polisher. A judge liking your rewrite is not a citation.
- Not a single-model loop. The matrix's whole point is cross-family
  disagreement breaking the monoculture.
- Not "optimize for size." Optimize for activation. Smaller often helps
  (catalytic minimum) but is never the goal.

## The templates

```
bin/new-run.sh             scaffold a run from a target skill
templates/prepare.py       auto-calibrate: snapshot + derive draft gate + baseline
templates/suite.py         explicit-suite scorer (generic)
templates/neutral_suite.py neutral-task attractor scorer (generic)
templates/grounding-hook.ts the model-agnostic floor (generic)
templates/matrix-brief.md  layer-0 agent brief (fill the objective + constraints)
templates/run-matrix.sh    herdr orchestrator: spawn, prompt, poll, extract, select
```

## Self-demonstration

This skill was built by its own method: criticality (6/10 → 10/10 on Qwen,
Pareto-or-tie cross-family) + the grounding hook (closed `leads_ground` by
construction on every family). The run that proved it lives at
`~/auto-research/runs/criticality-matrix/`; the full finding at
`~/auto-research/runs/criticality-matrix/SKILL-FOR-BUILDING-SKILLS.md`.