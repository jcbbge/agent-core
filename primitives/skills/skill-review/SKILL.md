---
name: skill-review
description: >
  Review a skill against substantive quality standards — a 7-category rubric with JSON
  output, single-pass full-rubric review, and a determinism contract. Use for: "review a
  skill", "check skill quality", "does this skill need evals", "review skill quality".
  Adapted for the pi / agent-core skill library from intercom/2x-skills skill-review.
metadata:
  author: jrg (ported from intercom/2x-skills, MIT)
  version: "0.1.0"
  tags: skills, quality, review, rubric, pi, agent-core
  gateway: strudel pantry (roots ~/.pi/agent + ~/agent-core/primitives)
---

# Skill Review

## Purpose
Review skills for substantive quality — whether a skill gives the agent the right kind of
content, has appropriate test coverage, uses hooks effectively, and lives in the right place.
This targets **substance**, not surface: frontmatter format, word count, and writing style
are assumed handled elsewhere (`creating-skills`).

**pi / agent-core context** (differs from the Claude-Code original):
- Skills live in `~/agent-core/primitives/skills/<name>/` (global) or `.pi/skills/`,
  `.pi/agent/skills/` (project/user). There is no plugin marketplace; "reach" =
  global-in-agent-core (widely shared) vs project-local vs user-local.
- The gateway is the strudel pantry (roots `~/.pi/agent` + `~/agent-core/primitives`), not a
  `${CLAUDE_PLUGIN_ROOT}`. When a reference says "plugin root," read it as "the skill dir and
  any shared scripts the SKILL.md invokes under agent-core."
- Tools a skill instructs are pi tools / utensils; "allowed-tools" maps to whatever the skill
  declares it will call.

The rubric is **authoritative and closed.** Every finding type is enumerated in the
per-category reference files. Match against the rubric; do not invent new buckets. A concern
that fits no enumerated finding type goes in the `out_of_rubric[]` channel — never inline as
Critical/Major/Minor.

**Closed ≠ conservative.** "Closed" constrains the *set* of finding types you may emit; it
does not mean hesitate to apply the ones that exist. The judgment-bound types
(`operational-guardrail-untested`, `contradictory-instructions`, `procedure-smell-with-consequence`,
the orchestration pair) are the most *under*-fired, because the defect is buried in an
otherwise-sound skill. For these, `pass` is a claim to be EARNED — mark a category `pass`
only after positively checking the predicate (enumerate every guardrail and cross-check the
evals, read every referenced script, compare every same-condition instruction pair), not
because nothing jumped out.

## How a review runs
A review is a **single pass**: load every category reference, evaluate all seven categories,
emit the full JSON. No triage gate — no category is skipped for looking clean, so a finding
can't be missed because its reference was never opened.

1. **Read the skill folder and the scripts it invokes.** SKILL.md body + frontmatter,
   `references/` listing, `evals/` listing (if any), and any scripts the skill ships or
   invokes (both `scripts/` in the skill folder AND shared scripts under agent-core that the
   SKILL.md tells the agent to run). Glob for referenced script paths and read them — "no
   `scripts/` dir" ≠ "no scripts to review." Every check is done by reading (read/grep/glob).
   Note the skill's **reach** (global agent-core vs project/user-local) and diff status
   (`M` if modified in this change) — Test Coverage and stale-eval checks depend on both.
2. **Load all seven category references** (see Reference Files) before evaluating. Load
   `suggested-rewrites.md` too if any finding needs a rewrite. Applying a category without
   its reference loaded is not permitted.
3. **Evaluate every category.** No matching finding → `{"status":"pass","findings":[]}`;
   otherwise emit findings with `finding_type`, `severity`, `deterministic`, `location`,
   `explanation`, `fix`, optional `suggested_rewrite`.
4. **Emit structured JSON** — all seven categories including passes. The contract ends at the
   JSON.

## Categories
| Category | Scope | Deep dive |
|---|---|---|
| **Structural Discipline** | Body shape + progressive-disclosure hygiene | `references/structural.md` |
| **Integrity** | Claims resolve: references/tool/paired-file/prose-count agree; instructions don't contradict; bundled scripts work | `references/integrity.md` |
| **Test Coverage** | Evals exist for broad-reach skills; operational guardrails exercised; evals test what they claim | `references/test-coverage.md` |
| **Security** | No credential exposure, no plaintext-secret instructions, safe shell idioms | `references/security.md` |
| **Content Quality** | Context vs instructions, procedure smell, weak completion criteria, no-op instructions | `references/content-quality.md` |
| **Convention** | Placement + triggering: where it lives, similar-skill duplication, hooks, invocation mode, repo-convention adherence | `references/convention.md` |
| **Cost** | Runtime token patterns: bash chains, tool result-size, field projection, response style | `references/cost.md` |

**Boundaries:** Structural owns body shape (length, body↔references duplication); Cost owns
runtime spending (script-extractable chains, response narration). Content Quality = what's IN
the body; Convention = where it LIVES and how it FIRES. Integrity asks *do claims hold?*;
Security asks *is it safe?* (`rm -rf "$unvalidated"` is Security; a crash on a documented
input is Integrity — a both-defect is filed at the more severe). The one intentional
two-finding case: a skill that is mostly deterministic glue end-to-end is filed in BOTH Cost
(`script-extractable-orchestration`) AND Convention (`orchestration-shaped-skill`), Major by
default, fire on *dominance* of glue not mere presence; a single extractable chain is
Cost-only (`scriptable-bash-chain`).

## Output contract
**The final message MUST be a single fenced ```json``` block matching the schema — nothing
else.** No headings, no narration. The JSON is the artifact.

```json
{
  "skill": "<skill-name-and-path>",
  "categories": [
    { "name": "Structural Discipline", "status": "pass", "findings": [] },
    { "name": "Integrity", "status": "findings", "findings": [
      { "finding_type": "broken-reference", "severity": "major", "deterministic": true,
        "location": "SKILL.md:42",
        "explanation": "Reference to `references/foo.md` does not exist in the skill folder.",
        "fix": "Create the file, fix the path, or remove the claim.",
        "suggested_rewrite": null } ] }
  ],
  "out_of_rubric": [
    { "location": "SKILL.md:54",
      "explanation": "Unusual caching strategy that fits no current finding type.",
      "rationale": "Cost-adjacent but not an enumerated pattern. Logged for rubric review." }
  ]
}
```

Field rules:
- `categories[]` includes all seven in rubric order, even when empty. `pass` when
  `findings: []`, else `findings`.
- `finding_type` is a kebab-case id defined in the per-category reference. Do not invent ids.
- `severity` = `critical | major | minor`, the value the reference assigns (incl. escalation).
- `deterministic: true` = follows mechanically from reading the file (must be stable across
  reruns); `false` = judgment-bound (rerun variance expected).
- `location`, `explanation`, `fix` required on every finding; `suggested_rewrite` per the
  category's rewrite policy (`null` when policy is prose-only).
- `out_of_rubric[]` = `location` + `explanation` + `rationale`; logged for periodic rubric
  review (promote a finding type after ≥3 instances or a security implication).

## Determinism contract
Same skill + same rubric → same findings. NOT byte-identical output. The contract:
- **Severity stability** — each deterministic finding type has the same severity across runs.
- **Finding-set stability** — the set of deterministic finding types present is identical.
- **Order stability** — categories and findings in rubric order.
- **Not promised** — prose wording of `explanation`/`fix`/`suggested_rewrite`.
Mark `deterministic: true` only when presence AND severity follow mechanically from the file.
A deterministic finding that flickers between runs is a reviewer bug, not acceptable variance.

## Reference files
Load all seven at the start of every review; load `suggested-rewrites.md` when a finding
carries a rewrite.
- `references/structural.md` — body↔references duplication, conditional reference loading.
- `references/integrity.md` — existence + equivalence; reference blast-radius rules.
- `references/test-coverage.md` — eval-requirement by reach, operational-guardrail predicate.
- `references/security.md` — credential paste, plaintext secrets, executable-script bugs.
- `references/content-quality.md` — procedure smell, context-vs-instructions, rewrite method.
- `references/convention.md` — placement, similar-skill duplication, hooks, repo conventions.
- `references/cost.md` — bash chains, tool result-size, field projection, response style.
- `references/suggested-rewrites.md` — format spec for the rewrite block.
