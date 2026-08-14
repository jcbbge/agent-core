---
name: wave-rollup
description: >
  Produce the daily wave rollup an operator can read cold — CTRL git numbers,
  product-named units answering five questions, verify-phase visibility, and an
  append-only carry-forward ledger of substrate that exists but is not wired.
  Prefer mechanical extraction over spawning. Use after a wave closes, mid-wave
  for an idempotent refresh, or when the operator asks for the day briefing.
---

# wave-rollup — daily wave briefing

Generate one artifact per wave. The operator may have **zero contextual
awareness** and is still legally responsible for every commit. Quality floor:
the hand-written exemplar under `briefs/wave-rollup/EXEMPLAR-handwritten-*.md`
— "perfect but can be better / great but weak." Match or beat it.

Spend is the binding constraint. Prefer mechanical extraction (scripts + git +
board reads) over spawning agents. Prefer a read over a sweep. Idempotent:
safe to re-run mid-wave.

## Outputs

1. **Markdown (default)** — terminal-readable pane artifact.
2. **Atelier HTML (optional)** — single-file 16:9 deck via the `atelier` skill.
   Do not invent a presentation layer.

Phoropter UX: wide frame first, then lens depth on any axis (one migration,
one unit's diff, architecture picture, next-wave implications) without losing
the frame.

## The five questions (every unit)

Quoted from the unit brief / operator framing — every product unit answers:

1. **Original intent** — what the work set out to do, in product terms.
2. **What changed** — the actual diff, named concretely (tables, files, endpoints).
3. **What it solves** — real-world problem, ideally traced to discovery
   (`STG-` item, transcript, named request).
4. **Where it sits** — component-level placement: which layer, what it connects
   to, which seam it closes.
5. **Trajectory** — what it means for what comes next.

## CTRL — mandatory, from git only

*"in addition to '53 commits, 7 migrations' I want to see CTRL level data as
well. Files touched. LOC differentials."*

Never estimate. Run the extractor:

```bash
bun ~/agent-core/primitives/skills/wave-rollup/scripts/extract-ctrl.ts \
  --repo <repo> --range <base>..<head> [--top 15] [--json]
```

Example (Arc 2026-08-13 dogfood range):

```bash
bun ~/agent-core/primitives/skills/wave-rollup/scripts/extract-ctrl.ts \
  --repo ~/Infinity/arc --range c203706..origin/main --top 15
```

The script prints (or `--json` emits):

- commits (all + non-merge)
- files changed, insertions, deletions (must match `git diff --shortstat`)
- churn by area (`apps/*`, `packages/*`, rolled-up `docs`, other top-level)
- migrations added with one-line descriptions from SQL header comments (else filename)
- top-N files by churn (`insertions + deletions`)

Use `origin/<branch>` (or fetch first) when local branch may lag. Smoke: for the
Arc calibration range, totals must be **164 / +15021 / −923** (±0).

## Verify-phase visibility

*"I need stronger and more visibility into the verify phase of the inner loop."*

Surface per unit (and summarize for the wave):

| Field | Rule |
| --- | --- |
| Suites authored | Name the test files; mark integration vs unit |
| Author role | test-maker **≠** implementer — they must be different agents when attribution exists |
| What ran | Commands / CI evidence actually observed |
| Pass / fail | From reproduced runs only |
| Human still checks | Explicit residual |
| Arbiter rulings | Verdict + pointer when present |

**Never report a green that was claimed rather than reproduced.** Where
attribution or run evidence is absent, write an honest gap — do not invent
pass/fail or roles from narrative.

High-churn `*.integration.test.ts` / coherence tests are verify work; they
must not disappear into an undifferentiated LOC dump.

## Carry-forward ledger

Standing section: **already built, not wired.** Stops the next wave from
rebuilding substrate that already exists.

Four fields per entry:

| Field | Meaning |
| --- | --- |
| what exists | Named substrate / capability |
| where | `file:line` (and PR only as trailing anchor) |
| what it is missing | The gap that blocks use |
| what would wire it | Concrete next move (caller, ruling, UI) — not a rebuild |

Rules:

- **Append-only** across waves.
- **Retire** an entry only when something consumes it (note retired-at + consumer).
- Made Well **ground** reads the ledger as **INPUT** before planning.
- Validate every seed against the repo before publishing.

### Store path (primary)

`~/agent-core/briefs/wave-rollup/CARRY-FORWARD.md`

Project-local `.madewell/carry-forward.md` is a recognized alternate; when both
exist, merge by `id` (primary wins on conflict) and prefer writing back to the
primary unless the wave is project-scoped and the operator asks otherwise.

Machine-readable: YAML frontmatter entries (or JSONL sibling) plus a human
section copied into each rollup.

## Operator vocabulary (hard law)

No fleet-internal codes as primary names in operator-facing output:

- Ban as primary carriers: stream codes (`WS-B`, `WS-D`, …), pane ids, workspace
  ids, brief filenames, board topics, PR numbers as titles.
- Name work by product: "Galley data plane," "portal client auth,"
  "multi-location inventory."
- PR numbers may appear as **trailing anchors** only.

## Methodology-neutral stages

Do **not** decide whether Land rolls up before the inner queue drains, or
whether a project's outer stage is a scalar vs a rollup of cycle states.
Present stage/phase evidence in a shape that accepts either ruling later.

## Procedure

1. Resolve repo + rev range (fetch remote tip if needed).
2. Run `extract-ctrl.ts`; paste CTRL block into the rollup (±0 on totals).
3. Cluster commits into product units (not stream codes). For each unit, answer
   the five questions from git + discovery + board evidence.
4. Build the **Verify** section from suites + board/field evidence; mark gaps.
5. Read/update `CARRY-FORWARD.md` — validate, append, retire.
6. Write markdown to the agreed path (dogfood default:
   `briefs/wave-rollup/dogfood/<date>-<project>.md`).
7. Optionally render atelier HTML beside it.
8. Self-grade vs the exemplar; iterate if weaker.

## Sources of truth

| Claim type | Source |
| --- | --- |
| Churn, migrations, file lists | git (`extract-ctrl.ts`) |
| Verify evidence, rulings | Tower board + pheromone field |
| "What it solves" | discovery (`STG-`, analyses), operator words |
| Carry-forward locations | repo at the wave tip (`file:line`) |

An assertion with no source is a defect. Prefer `UNKNOWN` over invention.
