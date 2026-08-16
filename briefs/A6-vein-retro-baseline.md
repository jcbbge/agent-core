# A6 — vein retro-baseline (Rumen R3 prototype). READ-ONLY.

**Operator committed this ahead of product work, 2026-08-13.** Half a day, read-only, zero
risk. It **prices everything downstream before anything depends on it** — so it runs first.

Source decision brief: `~/agent-core/research/peer-ignition-decision-brief.md`. Read it for
context, then execute this.

## The one sentence

Mine the existing session-transcript corpus with `vein` to produce **per-unit-class
correction-tax priors with honest error bars**, so that certifying a class into unattended
("dark") running is an empirical decision tonight rather than an experiment next week.

## Why it is first

Certification of a unit class into dark running needs a threshold. A threshold needs a
baseline. The designated ledger — `.madewell/work/tax.jsonl` in Arc — is **0 bytes, created
July 13, never written**, and `git log --grep="LEARNED:"` returns **0 of 849 commits**. So
there is no forward baseline and waiting for one costs a week. The corpus already exists.
`vein` is the transcript-corpus miner built precisely as *"the acceptance instrument for
tooling decisions"* — this is its designed job.

**Either answer is a win.** If correction tax is measurable, certification gets its
instrument. If it is unmeasurable noise, the certification thesis loses its instrument and
the operator learns that for half a day instead of after building the gate. **Do not
manufacture a signal.** A clean "this is noise" is the more valuable result and must be
reported as plainly as a positive one.

## What to produce

`~/agent-core/research/A6-tax-baseline-2026-08-13.md`, containing:

1. **Method, reproducible.** The exact `vein` invocations, corpus scope (which transcript
   dirs, which date range, how many sessions), and what was excluded and why.
2. **Unit-class taxonomy**, derived from the corpus rather than assumed. Candidate classes
   from the certification ladder: docs-only · test-authoring · mechanical refactor ·
   feature-with-schema · irreversible/data ops. If the corpus does not support a class
   boundary, say so and collapse it.
3. **Per-class correction tax**, defined explicitly before measuring. Proposed definition —
   **override it if the corpus supports better**: rework attributable to the unit after it
   was first declared done (re-prompts correcting the work, reverts, follow-up fix commits,
   arbiter/QA bounces, operator corrections of framing or fact). Report as a rate with an
   error bar and an n, never a bare mean.
4. **Signal-to-noise on the tax metric itself** — the brief's own watch item for this task.
   If the variance swamps the between-class differences, that is the headline finding.
5. **A recommended provisional threshold per class**, with the explicit caveat that it is a
   prior to be revised, plus **reversion criteria** (what tax spike drops a class back to lit).
6. **A "cannot be answered from the corpus" list.** Anything the transcripts cannot support.

## Hard constraints

- **READ-ONLY.** Mine transcripts, git history, the board, and pheromones. Change no
  behavior, no config, no gate. Write exactly one file plus your board/field rows.
- **No fabricated precision.** An honest wide error bar beats a fake tight one. If n is
  small for a class, say the n and refuse the threshold.
- **Do not invent classes to make the ladder look complete.** The ladder is a hypothesis.
- Corpus locations to check: `~/.claude/projects/*/**.jsonl` (Claude Code transcripts),
  pi/cursor session captures under `~/agent-core/primitives/hooks/` outputs and
  `~/.tower/flight/`, plus `~/.tower/board.jsonl` and `~/.tower/ledger.jsonl`. Confirm what
  actually exists before scoping — do not assume.
- `vein` is at `~/.local/bin/vein`, source `~/agent-core/primitives/tools/vein/`. **Read its
  skill/usage first**; do not reimplement mining it already does.

## Stigmergy — mandatory, this is not optional plumbing

You coordinate through the environment, not by waiting to be prompted.

- **Emit `work-available`** with evidence when you have a claimable sub-chunk.
- **Claim with `ref`**, heartbeat while working, **`work-done` with `ref`** when finished.
- **`need-help`** instead of going silent.
- Post a progress line to board topic `agent-core/a6-baseline` at every real checkpoint.
  **Silence reads as death.**
- Verbs: `bun ~/.tower/cli.mjs emit <scent> <topic> <payload_ref> --evidence <path> --from
  <you>` · `… field` · `… post finding <topic> "<body>" --from <you>`.

**Two acceptable stopping states, and only two:** every deliverable above produced, or a
posted `need-help`/BLOCKED naming exactly what you need and who owns it — after doing
everything that does not depend on it. "Reported and awaited instruction" is not one.

## Report

Final line to the concierge: the headline number per class, whether the signal is real or
noise, the report path, and what the corpus could not answer.
