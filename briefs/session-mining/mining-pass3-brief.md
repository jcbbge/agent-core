# SESSION MINING PASS 3 — 20 fresh sessions, verdict stress-test

## Mission
Extend the session-mining study (`~/agent-core/research/session-mining-verbs.md`, passes 1-2: 40 sessions, 2,246 calls) with 20 UNANALYZED sessions. Primary question: does the pass-1/2 verdict hold — "no safe slim verb additions; hooks and retry loops are the real waste" — or does fresh data break it? Secondary: deepen the retry-loop taxonomy and failure-pattern catalog; the operator acts on these.

RESOURCE LAW (operator): batches of 10 (5 CC + 5 pi per batch, or 10+10 split across two batches — your call, never more than 10 sessions in flight per batch). Scripts only; raw transcript bodies NEVER enter your context; read only your own aggregates.

## Pre-Verified Facts (coordinator-verified)
- Prior pass artifacts live at `/private/tmp/claude-501/-Users-jrg/de008bc7-28c8-4fb1-b78f-8f99be78c736/scratchpad/mining/` — `commands.csv` (has session ids of all 40 analyzed sessions — your EXCLUDE list), extractors `cc-batch*-extract.json`, `analyze.py`. Reuse/extend them; copy anything durable to `~/agent-core/briefs/session-mining/fixtures-p3/` since scratchpads are ephemeral.
- Transcript stores: CC `~/.claude/projects/<dir>/*.jsonl` (418 files >100KB), pi `~/.pi/agent/sessions/<dir>/*.jsonl` (287 files >100KB). EXCLUDE: the 40 prior ids, anything modified in the last 30 min, `-private-tmp*` dirs.
- Since pass 2 the machine changed: rtk was REMOVED and replaced by `slim` (6 verbs, allowlisted via slim-guard.sh); the Stop-hook afplay is now async. Old transcripts predate this — treat rtk-era measurements as historical baseline, and note any session young enough to show slim-era behavior.
- slim's verbs + measured savings: ls 78% / ps 98% / git status 62-80% / git log 61% / wc 90% / df 12%.
- Tower posting: `cd /Users/jrg/agent-core && bun ~/.tower/cli.mjs post <claim|finding|note> agent-core/session-mining "<body>" --from agnt-mining-p3`.

## File partition — write ONLY under
- Scratch: `/private/tmp/claude-501/-Users-jrg/de008bc7-28c8-4fb1-b78f-8f99be78c736/scratchpad/mining-p3/`
- Durable fixtures: `~/agent-core/briefs/session-mining/fixtures-p3/`
- Deliverable: APPEND a clearly-marked "## Pass 3 (20 sessions)" section to `~/agent-core/research/session-mining-verbs.md` (do not rewrite prior sections)
Never commit. No git mutations.

## Tasks
1. Selection + batch 1 (10 new sessions): reuse/adapt the extractors; merge into a pass-3 CSV. Done when the batch-1 verb table exists with session ids and zero overlap with the prior 40.
2. Batch 2 (10 more). Done when merged pass-3 table + a three-way stability column (pass1/pass2/pass3 rank) exists.
3. Verdict stress-test: does "no new verbs" survive? Any verb crossing the frequency×bytes bar that passes slim's safety boundary (no pipes/compounds, deterministic output shape)? Done when an explicit HOLDS / BREAKS(+verb list) verdict with numbers is recorded.
4. Retry-loop taxonomy: classify the exact-repeat loops (waiting-on-state? error-retry? flag-fumbling? permission?) with counts and the single best prevention per class. Done when the taxonomy table exists.
5. Failure catalog: commands erroring consistently across sessions (missing binaries, wrong flags, dead paths) + one surprises section. Done when each has counts or an explicit none-found.

## Report back with
Final message: pass-3 verdict (HOLDS/BREAKS + evidence), the stability table condensed, retry taxonomy, top failure patterns, surprises. Board: claim at start, finding per batch, final `DONE MINING-P3:`. LAST action: `touch ~/agent-core/briefs/session-mining/mining-p3.done`.
