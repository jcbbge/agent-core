Mine the existing Claude Code + pi session-transcript corpus with `vein` (and git/board/ledger only as supporting evidence) and write ONE research file: `~/agent-core/research/A6-tax-baseline-2026-08-13.md` with per-unit-class correction-tax priors and honest error bars. This is A6 (Rumen R3 prototype) from `~/agent-core/research/peer-ignition-decision-brief.md`. Do NOT use emojis anywhere. Do not commit. READ-ONLY except that one research file plus Tower board/field rows.

Tier: coder (CURSOR_VERIFY_GATE=off — research deliverable, not Plan→Impl product code). Break-glass is intentional and audited.

## Pre-Verified Facts (ORCH orch-orchestrator-w2y-p1e verified 2026-08-13)

- `vein` binary: `/Users/jrg/.local/bin/vein` exists, `--help` exits 0; source `~/agent-core/primitives/tools/vein/`. Skill: `~/agent-core/primitives/skills/vein/SKILL.md` (or `~/.cursor/skills-cursor/vein/SKILL.md`).
- Vein CLI (exact):
  - `vein scan --sessions <path> [--out <commands.csv>]`
  - `vein scan --last N [--out <commands.csv>]`
  - `vein report --sessions <path> [--out-dir <dir>]`
  - `vein report --last N [--out-dir <dir>]`
  - `vein report --csv <commands.csv> [--out-dir <dir>]`
  - Exit: 0 ok · 2 usage · 3 I/O · 4 schema-UNKNOWN. Never invent aggregates on UNKNOWN.
- Smoke: `vein report --last 5 --out-dir /tmp/vein-a6-smoke` produced `verbs.md retries.md hooks.md failures.md` (exit 0).
- Oracle / CSV schema: `~/agent-core/research/session-mining-verbs.md` (Method section) — read before interpreting vein output.
- Arc tax ledger: `~/Infinity/arc/.madewell/work/tax.jsonl` is **0 bytes** (wc -c → 0).
- `git log --grep='LEARNED:'` in `~/Infinity/arc` → **0** commits; HEAD commit count **849**. Same LEARNED grep in `~/agent-core` → **0**.
- Deliverable path does **not** exist yet: `~/agent-core/research/A6-tax-baseline-2026-08-13.md`.
- Corpus inventory (confirm before scoping; do not assume):
  - CC: `find ~/.claude/projects -name '*.jsonl'` → **543** files; depth-2 only → **357**; deeper nesting → **186**. Date range (depth-2 mtime): oldest ~2026-07-14, newest ~2026-08-13.
  - pi: `find ~/.pi/agent/sessions -name '*.jsonl'` → **1705**; mtime oldest ~2026-04-12, newest ~2026-08-12.
  - `~/.tower/flight/` → **781** files (SessionEnd markdown, not vein JSONL).
  - `~/.tower/board.jsonl` (~4.9MB), `ledger.jsonl` (~1.1MB), `pheromones.jsonl` (~193KB) exist.
  - `~/agent-core/primitives/hooks/` holds hook scripts (session-capture-cursor.mjs etc.) — **not** a transcript dump dir; confirm any capture outputs elsewhere before including.
- Vein `--last N` selects newest N across **CC + pi only** (not tower flight). For reproducible scope prefer `--sessions <listfile>` with an explicit list you write under `/tmp/a6-baseline/` (scratch OK; not the deliverable).
- Operator unit brief (same content as your mission): `~/agent-core/briefs/A6-vein-retro-baseline.md`.
- Decision context: `~/agent-core/research/peer-ignition-decision-brief.md` §A6.
- Candidate ladder classes (hypothesis only — collapse if unsupported): docs-only · test-authoring · mechanical refactor · feature-with-schema · irreversible/data ops.
- Proposed tax definition (override if corpus supports better): rework after first declared-done — re-prompts correcting work, reverts, follow-up fix commits, arbiter/QA bounces, operator corrections of framing/fact. Rate + error bar + n; never bare mean.
- Either answer wins: measurable tax **or** honest "noise / unmeasurable". Do not manufacture signal.

## Parallel Work Notice

You are the sole writer of `~/agent-core/research/A6-tax-baseline-2026-08-13.md`. No sibling owns that path. Ignore unrelated uncommitted work elsewhere. Post claims/findings to Tower topic `agent-core/a6-baseline` (board_post / CLI). Read the board before claiming. Stigmergy: emit/claim/heartbeat/work-done on the pheromone field with evidence; silence reads as death.

## Tower (mid-run communication)

- Board topic: `agent-core/a6-baseline`
- CLAIM first (board + pheromone `work-claimed` with ref to the work-available you take).
- Progress findings at real checkpoints (corpus N chosen, class taxonomy locked, tax numbers computed) — specific numbers, not heartbeats.
- Pheromones: `bun ~/.tower/cli.mjs emit <scent> agent-core/a6-baseline <payload_ref> --evidence <path> --from agnt-a6-tax-baseline` (or MCP pheromone_emit). Scents: work-claimed → work-done (with ref) / need-help.
- On Herdr: `spine-report task "…"` at start and `spine-report verdict "…"` when done.
- Final report to ORCH via board finding + `.done` marker (below). Do not send operator mail unless genuinely blocked on an operator-only decision.

## Tasks

1. Read vein skill + `session-mining-verbs.md` Method; confirm corpus paths and choose an explicit, reproducible session list (write list under `/tmp/a6-baseline/sessions.txt`). Record exclusions and why. — done when: list file exists; board finding posts corpus N, dirs, date range, exclusions.
2. Run `vein scan` / `vein report` with the exact invocations you will cite; park CSV/report under `/tmp/a6-baseline/` (not the deliverable). — done when: report artifacts exist; invocations are copy-pasteable into the Method section.
3. Derive unit-class taxonomy from the corpus (and supporting git/board only if transcripts alone are insufficient). Collapse ladder classes the corpus cannot support — do not invent classes to complete the ladder. — done when: taxonomy + collapse decisions are explicit in a board finding.
4. Define correction tax **before** aggregating; measure per class as rate with error bar and n. Compute signal-to-noise (between-class differences vs within-class variance). If variance swamps differences, that is the headline. — done when: numbers exist with n and bars, or an explicit refuse-threshold for small-n classes.
5. Write **only** `~/agent-core/research/A6-tax-baseline-2026-08-13.md` containing all six required sections: Method · Taxonomy · Per-class tax · S/N on the metric · Provisional thresholds + reversion criteria · Cannot-be-answered list. — done when: file exists and contains those six sections; no other repo files modified.
6. Post final board finding with headline per class + signal-vs-noise verdict; emit `work-done`; write `.done` marker. — done when: marker path below exists with the required body.

## Constraints

- Touch ONLY: `~/agent-core/research/A6-tax-baseline-2026-08-13.md` (plus `/tmp/a6-baseline/**` scratch and Tower board/pheromone appends).
- Do not commit. Do not change behavior, config, gates, hooks, or vein source.
- No fabricated precision. Small n → say n and refuse the threshold.
- Do not invent classes. Prefer "this is noise" over a fake prior.
- Vein is the miner — do not reimplement mining it already does; augment with git/board only where vein cannot speak to "declared done → rework".

## Report back with

- Path of the research file.
- Exact vein invocations used.
- Corpus N + date range + exclusions.
- Per-class tax table (rate, error bar, n) or collapse/refuse notes.
- Headline: signal real or noise.
- Cannot-be-answered list (bullets).
- Any deviation from the proposed tax definition and why.

## Done marker

Write `~/agent-core/briefs/a6-baseline/workers/agnt-a6-tax-baseline.done` containing:

```
DONE
report: ~/agent-core/research/A6-tax-baseline-2026-08-13.md
signal: <real|noise|mixed> — <one line>
headline: <one line per class or "collapsed: …">
```
