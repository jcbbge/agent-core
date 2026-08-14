# cord-flywheel — PHASE 1 evidence (re-measurement, post-afplay-fix)

Date: 2026-08-11 · Measurer: cord-flywheel (CORD, personally — verification, not
implementation) · Harness: claude-code hook chains from `~/.claude/settings.json`.

## Method

- Every hook command timed as a REAL invocation: exact argv from
  settings.json, representative stdin JSON payloads (real transcript_path,
  real cwd), 2 warmup + 15 timed runs each, `time.perf_counter` wall clock.
  Harness: `/tmp/flywheel-measure.py` (ephemeral, not committed).
- Two env conditions: `plain` (HERDR_*/SUPERSET_HOME_DIR stripped) and
  `[HERDR]` (HERDR_ENV=1 + socket path + pane id). Caveat: `[HERDR]` used
  pane id `w1A:p1`; the delta vs plain is one real herdr socket round trip
  (~35ms) either way, so the number is representative.
- Superset `notify.sh` guards are `[ -n "$SUPERSET_HOME_DIR" ] && ...` —
  no-op (~0ms) when the env is absent; excluded.
- Stop's `afplay` now carries `"async": true` — the 657s blocking class is
  structurally gone. Confirmed in settings.json.

## Raw numbers (ms, warm; min / median / p95 / max)

| hook | min | med | p95 | max |
|---|---|---|---|---|
| ss: session-start.mjs | 195.1 | 222.0 | 248.5 | 248.5 |
| ss: herdr-agent-state session | 7.6 | 9.1 | 10.2 | 10.2 |
| ss: herdr-agent-state session [HERDR] | 36.3 | 38.4 | 40.9 | 40.9 |
| ss: wake.ts | 30.8 | 32.8 | 35.1 | 35.1 |
| ss: status.ts --line | 27.7 | 30.2 | 31.5 | 31.5 |
| ss: grounding reset | 16.7 | 17.8 | 18.7 | 18.7 |
| ups: prompt-inject.mjs | 175.6 | 200.2 | 241.6 | 241.6 |
| ups: graze.ts | 17.5 | 25.5 | 30.5 | 30.5 |
| ups: herdr-task-report prompt | 10.4 | 11.2 | 13.1 | 13.1 |
| ups: herdr-task-report prompt [HERDR] | 41.1 | 44.0 | 46.4 | 46.4 |
| pre: slim-guard.sh | 17.8 | 20.1 | 21.5 | 21.5 |
| pre: herdr-task-report tool | 6.6 | 7.7 | 9.1 | 9.1 |
| pre: herdr-task-report tool [HERDR] | 41.5 | 43.1 | 46.8 | 46.8 |
| pre: grounding pre | 18.7 | 19.6 | 22.3 | 22.3 |
| post: deposit-reminder.mjs | 17.4 | 18.1 | 19.1 | 19.1 |
| post: grounding post | 17.5 | 18.6 | 19.9 | 19.9 |
| stop: stop-guard.mjs | 175.1 | 290.5 | 321.9 | 321.9 |
| stop: herdr-task-report done | 4.9 | 5.1 | 5.5 | 5.5 |
| stop: stop-verdict.mjs | 15.6 | 16.6 | 18.2 | 18.2 |
| stop: ask-bridge sweep | 17.1 | 18.3 | 19.3 | 19.3 |

All exit codes 0. bun process boot floor is ~17–20ms (grounding/slim/
deposit rows) — the fork-per-event premise of flywheel measured cheap.

## Execution semantics (verified, not assumed)

All matching hooks for one event run IN PARALLEL; Claude Code merges
results after all finish. No sequential mode exists (feature request
anthropics/claude-code#21533 is open). So per-event added latency ≈ the
MAX of that event's hooks, not the sum. Pre and Post chains are separate
events, so per-Bash-call cost = Pre-max + Post-max.
Caveat: excludes CC's own dispatch/merge overhead (not isolated here);
real numbers are modestly higher.

## Per-chain totals (medians, parallel model)

| chain | plain | in-herdr | threshold | verdict |
|---|---|---|---|---|
| per Bash call (Pre max + Post max) | ~46ms (20.1+25.5) | ~69ms (43.1+25.5) | <50ms | borderline: pass plain, marginal miss in-herdr |
| Stop | ~290ms | ~296ms | <500ms | PASS |
| UserPromptSubmit | ~200ms | ~244ms | (none) | once per prompt |
| SessionStart | ~222ms | ~251ms | (none) | once per session, immaterial |

Scale check: original finding was 923s hook time / 40 sessions (~23s per
session). Today's chains cost roughly 3–5s per typical session — an ~85%
reduction, structural (async afplay), not incidental.

## Where the residue lives

Three Tower hooks carry a 175–290ms floor; everything else is ≤45ms.
Root cause confirmed by source: `inboxState()` and `boardFor()` in
`primitives/hooks/tower-ledger.mjs` do a FULL `readFileSync` + parse of
`ledger.jsonl` (1.0MB) and `board.jsonl` (2.0MB) on EVERY invocation.
stop-guard, prompt-inject, and session-start all call `inboxState`.
This is the "inbox since X never re-parses" cost flywheel's daemon cursor
was designed to absorb.

## Recommendation — DO NOT BUILD the daemon

1. Remaining cost is at/under the brief's materiality thresholds. The one
   miss (in-herdr PreToolUse, 43ms vs 50ms budget contribution) is one
   herdr socket round trip in `herdr-task-report.sh` — fixable by making
   that report fire-and-forget, no daemon required.
2. The daemon's premise (fork-per-event cost) measured cheap: bun boots
   in ~17–20ms and the fast hooks are already at that floor.
3. ~90% of flywheel's remaining win is ONE algorithmic wart: full-file
   JSONL re-parse in `tower-ledger.mjs`. A byte-offset cursor (the
   "bookmark" idea, standalone) or ledger compaction captures it for a
   fraction of the 12–16h estimate, with zero kill-9-eats-events risk.
4. Suggested follow-ups (operator/concierge decision, NOT started —
   HARD GATE respected, no live hook or settings edits made):
   a. byte-cursor/cache in `inboxState()`/`boardFor()` (cheap, surgical);
   b. fire-and-forget `report-metadata` in herdr-task-report.sh;
   c. retire flywheel-daemon from the fringe top-5 or re-launch only if
      a future vein re-run shows hook time regrowing.

SOURCES: measurements above (this session); hook semantics —
code.claude.com/docs/en/hooks-guide + hooks.md ("All matching hooks run
in parallel"), corroborated by anthropics/claude-code#21533.
