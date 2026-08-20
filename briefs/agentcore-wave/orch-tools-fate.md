# ORCH [boot-card and statem: gather the evidence for a build-or-deprecate ruling]

slug: `tools-fate` · branch: `wave/tools-fate`

Read `CONTRACT.md` in this directory first.

## Mission

Two authored tools have source trees in the store and **no installed binary**:
`boot-card` and `statem`. Because neither has a registry row, it is currently
impossible to tell "never built" from "built once and silently broken." Gather
the evidence for a ruling: build and register each, or move it to `_deprecated/`
with a lineage entry.

**Your task is evidence and a recommendation, not the ruling.** You may build a
tool locally to test whether it builds — that is evidence. You may not install a
binary to PATH, and you may not move anything to `_deprecated/` in this brief.

## Pre-Verified Facts (verified 2026-08-20)

- `~/agent-core/primitives/tools/` contains: `assay`, `bigfile`, `boot-card`,
  `component-verify`, `fleet-task`, `latch`, `slim`, `statem`, `vein`,
  `_deprecated/`, `README.md`.
- Registry `tool/` rows exist for exactly four: `slim`, `latch`, `vein`, `assay`.
  A sibling orchestrator (`orch-tool-rows`) is adding rows for the eight
  **installed** unrowed binaries and has been told to leave `boot-card` and
  `statem` to you. Do not add `tool/` rows for them either — that is the ruling's
  consequence, not yours.
- `command -v boot-card` → not found. `command -v statem` → not found.
- `command -v component-verify` → `~/.local/bin/component-verify` (installed).
  `command -v fleet-task` → `~/.local/bin/fleet-task` (installed). These two are
  the useful comparison: same store, same shape, actually installed.
- `primitives/tools/boot-card/` contains `test/acceptance.sh`.
- `primitives/tools/statem/` contains `README.md` and `statem.ts`, and **both have
  uncommitted modifications from another session** — they are in the repo's dirty
  set. Per CONTRACT.md you must not stage, revert, or fix them. You MAY read them.
- statem is documented as live in two places: the herdr skill's Observability
  section gives the invocation
  `bun ~/agent-core/primitives/tools/statem/statem.ts <project-root>` and
  describes it as a per-project Made Well tracker that derives stage/phase from
  `.madewell/` and rewrites glyph-only tab titles; `HARNESS-PARITY.md` also cites
  the statem README. So statem is **invoked by interpreter, not as a binary** —
  weigh whether it needs a `tool/` binary row at all, or a different assertion.
- `primitives/tools/README.md` documents what `_deprecated/` is for, and
  `primitives/COMPONENTS.md` now carries a **LINEAGE LAW**: a rename, rewrite,
  unbundling, or retirement lands with a lineage entry naming old name, new
  name(s), date, and reason; `_deprecated/` is a lineage record, not an attic.
- Baseline: `agent-core status` → `359 ok  0 stale  0 missing`.

## Tasks

1. Worktree per CONTRACT.md, sparse-scoped to `primitives/tools` and `primitives`.
2. **For each of boot-card and statem, establish:**
   - What is it for? Read its source and README. State its purpose in one sentence.
   - Does anything reference it? Search `~/agent-core`, `~/.claude`, `~/.pi`,
     `~/.cursor`, `~/muster`, and the registry for callers. Distinguish a doc
     mention from a real caller.
   - Does it build / run today? Try it. Capture the output verbatim, success or
     failure. For statem, run it against a real project root and see what happens.
   - Is its function already provided by something else on the machine?
   - How is it meant to be invoked — compiled binary, or interpreter script? This
     determines whether `tool/` is even the right primitive type for it.
3. **boot-card specifically:** it ships `test/acceptance.sh`. Run it. A tool with a
   passing acceptance suite and no installation is a different situation from one
   that does not build — say which it is.
4. **statem specifically:** it is actively documented as part of the observability
   surface, and its files are being edited right now by someone else. Weigh
   whether "not installed" is even a defect for an interpreter-invoked script, or
   whether the real gap is that nothing asserts the script exists.
5. Write `~/agent-core/briefs/agentcore-wave/FINDING-tools-fate.md`:
   - one-paragraph verdict per tool, operator-rulable on its own;
   - the evidence table (purpose · callers · builds? · duplicated? · invocation
     shape);
   - **a recommendation per tool** — build+install+register, register-as-script,
     or deprecate-with-lineage-entry — with the tradeoff stated and a default
     named;
   - if the recommendation is deprecate, include the **exact lineage entry text**
     you would add to `COMPONENTS.md`, ready to paste, so the ruling is one step
     from execution;
   - what you did NOT verify.
6. Commit the finding. Deposit a `report` with both verdicts inline, then `done`.

## Constraints

- **Install nothing to PATH. Move nothing to `_deprecated/`. Add no `tool/` rows.**
- Do not touch `primitives/tools/statem/statem.ts` or its README — read-only, and
  they are someone else's uncommitted work.
- Building inside your worktree to test is fine; leave no build artifacts in the
  commit.

## Done-when

- `FINDING-tools-fate.md` exists with a verdict, evidence table, and a
  recommendation for **each** of the two tools.
- The build/run attempt for each is captured verbatim, including failures.
- `boot-card/test/acceptance.sh` has been run and its result recorded.
- The invocation-shape question (binary vs interpreter script) is answered for
  both, because it decides the primitive type.
- Any deprecate recommendation carries paste-ready lineage text.
- `agent-core status` still 0 stale, 0 missing. Committed on `wave/tools-fate`.

## Report-back

Deposit `report` to `concierge` with both verdict paragraphs and both
recommendations, then `done`. Write `orch-tools-fate.md.done`.
