# ORCH circadian-wake — wire circadian wake into herdr-spawned cursor agents

Repo: `~/cursor-shim` (bash shim, git main @ 6c85350). Mission: when the
operator starts a fresh cursor agent in herdr via the shim, it must receive
the circadian wake (memory substrate) the way pi and claude agents already
do. Do NOT use emojis anywhere.

Board topic: `cursor-shim/circadian-wake`. `.done` dir:
`~/agent-core/briefs/circadian-cursor/.done/` (create it).

## Pre-Verified Facts (CORD verified each personally, this session, 2026-08-12 ~21:40 UTC)

- `~/.cursor/hooks.json` HAS `sessionStart` registered:
  `bash ~/agent-core/primitives/hooks/session-boundary-cursor.sh` (timeout 15),
  plus `bash ~/.cursor/herdr-agent-state.sh session`. Read the file; confirmed.
- The hook script (read in full) injects Session Boundary Contract legs 1-4 as
  `{"additional_context": "..."}` on stdout; leg 4 runs
  `~/.bun/bin/bun ~/circadian/src/wake.ts` with cwd = `workspace_roots[0]`
  (fallback `$PWD`); always exits 0. Its header claims the
  `additional_context` schema was "confirmed by local repro test 2026-08-12" —
  the operator's lived experience contradicts it for herdr-spawned cursor
  agents. Trust the operator; treat the repro claim as suspect until
  reproduced.
- **The suspected gap is REAL:** `~/cursor-shim/cursor-spine` composes the
  instruction as ROLE_PROMPT + DIRECTIVE_HEADER + TASK (lines ~456-475) and
  delivers it via `.instr/<name>.md` (interactive, lines ~606-609) or
  `$JOB/instr` (-p runner, line ~641). Full read: NO circadian weaving
  anywhere in the shim.
- **Reference-implementation correction (verified):** `~/herdr-spine/bin/spine-spawn`
  does NOT weave wake either (grep-verified). pi gets circadian via
  `~/.pi/agent/extensions/circadian-mind.ts` (session hook); claude via
  `~/.claude/settings.json`. So the harness-injection point for cursor is
  either the `sessionStart` hook (if the CLI honors it) or the shim's
  instr-file build (if it doesn't). The concierge brief's "spawn path" claim
  was inaccurate — noted, brief fixed here.
- **wake.ts live behavior (ran once from ~/cursor-shim this session):**
  kill-switch R7 is ACTIVE — stdout payload is `[Circadian] WAKE …` +
  `<mind:constitution>` + NOW only; SELF/USER/greeting withheld; obs/diagnostic
  lines go to stderr (the hook discards stderr). This is normal upstream
  behavior — do NOT weaken or "fix" it.
- **wake.ts is tier-aware:** it classifies via `HERDR_ROLE` env first, else
  the herdr pane token `role` looked up via the pane id (verified: it
  classified this CORD pane `w2M:p1` as `token.role=1-CORD`, slim=false).
  Executor tiers (3-AGNT/4-SAGT) get the slim payload. Implication for an
  instr-file port: at spawn time the spawner's pane context would
  misclassify — run wake with `HERDR_ROLE=<target role token>` and
  cwd = the spawn's `--dir` so tier and cwd-anchored evidence are the
  SPAWNED agent's, not the spawner's.
- **Scoreboard instrument (verified):** every wake run appends one row to
  `~/circadian/mind/scoreboard.jsonl` (wake.ts:342). 469 rows at briefing
  time. Row-count delta across a fresh spawn is a clean, read-only detector
  for "did wake execute".
- cursor-agent: version `2026.08.11-e8db854` at `~/.local/bin/cursor-agent`.
- Baseline gate: `bash ~/cursor-shim/docs/qa-verify.sh` = **90 passed, 0
  failed**, working tree clean. Must stay green and GROW with new dry-run
  cases; the suite must never spawn real panes (cf. 78fa55c/6c85350).
- Shim spawn requires `HERDR_ENV=1` (you will be in a herdr pane; fine).
  The shim has TWO launch paths and they may differ on hooks: interactive
  TUI (`herdr agent start --kind cursor`, persistent tiers) and `-p` runner
  (researcher/headless/async). Probe BOTH.
- Verify gate (hard): `coder` spawns are REFUSED without `verify-mark`;
  `cursor-fleet make <slug> --brief <path>` runs the enforced bifurcation
  (test-maker + coder, separate worktrees). Worktree wall is repo-conditional;
  `~/cursor-shim` qualifies — full bifurcation applies.

## Parallel Work Notice

None. You own `~/cursor-shim` for this unit. If you find uncommitted changes
that are not yours, stop and report — do not revert or investigate.

## Tower (mid-run communication)

- Findings/status: board posts to topic `cursor-shim/circadian-wake`
  (tower MCP `board_post`; shell fallback: append to `~/.tower/board.jsonl`
  from your real repo cwd).
- Questions climb to CORD (this pane, w2M:p1) — nQ budget 3. Rule by the
  rubric (craft · DX · UX · agentic efficiency) first; escalate only what the
  rubric genuinely cannot decide.
- Operator mail (`to:"operator"`): NONE except through CORD. You report to
  me; I gate and relay.
- `spine-report task "<what>"` at unit start, `spine-report verdict` at end.

## Tasks

1. **Diagnose with evidence — probe BOTH launch paths.** In a scratch
   workspace (mktemp dir, NOT the repo), spawn cursor-agent via the shim
   (a) `-p` path (e.g. `researcher --headless` with a trivial prompt) and
   (b) interactive path (`herdr agent start --kind cursor` as cursor-spine
   does it). Instrument: `~/circadian/mind/scoreboard.jsonl` row-count delta
   (wake side effect), plus any herdr-agent-state side effect, plus direct
   evidence the `additional_context` reached the agent where observable.
   Done when: a board finding states, per launch path, whether
   `~/.cursor/hooks.json` `sessionStart` fires under cursor-agent
   `2026.08.11-e8db854` in a herdr pane — with the captured numbers/output,
   and (if it fires) precisely where the output goes / is lost.
2. **Plan the wiring, then gate it.** Based on task-1 evidence:
   - Hooks fire → fix why the wake doesn't reach the agent (env, cwd,
     schema, timeout). Do NOT change `~/.cursor/hooks.json` semantics for
     the IDE path unless your evidence says it is broken there too.
   - Hooks don't fire → port wake injection into cursor-spine's instr-file
     build: run `bun ~/circadian/src/wake.ts` at spawn time with
     `HERDR_ROLE=<target role token>` and cwd = spawn `--dir`, weave stdout
     into the instruction (data only, never interpreted; stderr discarded;
     wake failure never blocks a spawn). Keep the byte-identical-prefix
     cache geometry: the wake block is per-spawn volatility — place it
     BELOW the `--- TASK ---` marker or in the task zone, never in the
     shared prefix.
   Done when: plan posted to the board; `cursor-spine verify-mark` criteria
   authored (test criteria BEFORE code — the gate refuses otherwise).
3. **Make via the Verify beat.** `cursor-fleet make circadian-wake --brief
   <this file>` — bifurcated test-maker/coder in separate worktrees, tester
   runs, arbiter triages failures, nQ ceiling 3. New qa-verify cases for the
   wake wiring at dry-run level only (suite must never spawn real panes).
   Done when: `bash docs/qa-verify.sh` green at 90 + new cases, reproduced
   by the tester, green on main.
4. **Prove it live.** Spawn a fresh cursor agent in herdr via the shim and
   capture its actual received context: it contains the wake payload
   (`[Circadian] WAKE` + constitution + NOW per kill-switch). Role matrix:
   a fleet-role spawn (e.g. coder/researcher) gets the tier-appropriate
   payload per wake.ts classification (HERDR_ROLE set correctly); a
   non-role spawn gets the standard wake. NOTE: under active kill-switch
   R7, greeting is already withheld globally — document the matrix as it
   actually behaves; do not fake a distinction the kill-switch masks.
   Done when: captured evidence (instr file + spawned agent's own echo of
   its context) posted to the board.
5. **Close the unit.** `.done` markers in
   `~/agent-core/briefs/circadian-cursor/.done/`; final report to CORD.
   Done when: report delivered with the evidence index.

## Constraints

- Touch ONLY: `~/cursor-shim` (cursor-spine, docs/qa-verify.sh, docs/ as
  needed). Never `~/.cursor/hooks.json` semantics unless task-1 evidence
  indicts the IDE path. Never `~/circadian` internals.
- Do not commit — CORD gates and lands all commits.
- Testing: NO MOCKS. Suite additions dry-run level only.
- Kill-switch mode (R7) is intended payload — constitution + NOW. Do not
  weaken it.
- Reap every pane you spawn at collection (done = gone); never reap
  CTRL/TOWR or the operator's pane.

## Report back with

- Task-1 evidence verbatim (scoreboard deltas, probe outputs, per launch
  path) and the conclusion.
- Which wiring path was taken and why (one paragraph).
- Per-file diff summary of every file created or modified (including
  dotfiles/config); qa-verify tail showing total counts.
- Live-capture proof excerpts (task 4) with pane ids.
- Deviations from this brief, with reasons.
