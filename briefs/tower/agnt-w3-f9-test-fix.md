# AGNT [f9-test-fix] — Loosen F9 oracle (bad test, not bad impl)

Do NOT use emojis. You are the test-maker arm for unit w3-f9. Implementation
`cli.mjs` already filters — do NOT edit `cli.mjs`. Fix the oracle only.

## Pre-Verified Facts (ORCH verified 2026-08-13)

1. Impl in integration worktree
   `/Users/jrg/.spine/worktrees/agent-core/w3-plane-fixes/primitives/mcps/tower/cli.mjs`
   passes optional `process.argv[3]` into `boardFor(cwd, topic ? { topic } : {})`.
2. Live worktree CLI from cwd `/Users/jrg/agent-core`: unfiltered 53 lines,
   `tower/w3-plane-fixes` 5 lines — filter WORKS.
3. Your prior oracle failed because it required
   `spawnBoardLines().length === boardFor(AGENT_CORE).length` — observed
   boardFor=50 vs CLI lines=53 (cursor/damaged-row skew). That equality is
   NOT an AC. AC is: with multiple topics, filtered line count < unfiltered;
   every filtered line contains the topic; omitted/empty topic keeps
   project-wide listing (match unfiltered CLI line count, not boardFor).
4. Current failing file (edit THIS copy):
   `/Users/jrg/.spine/worktrees/agent-core/w3-plane-fixes/primitives/mcps/tower/cli.test.mjs`
   describe `board topic filter (AC: F9 CLI board <topic>)`.

## Tower

- CLAIM/finding on `tower/w3-plane-fixes` from=`AGNT f9-test-fix`.
- No doorbell.

## Tasks

1. Edit only the F9 describe block in
   `.../w3-plane-fixes/primitives/mcps/tower/cli.test.mjs` — done when:
   - Drop any expect that CLI line count equals `boardFor(...).length`.
   - Keep: filtered < unfiltered when multiple topics; filtered lines contain
     `@ ${FILTER_TOPIC}:` (or topic marker); omitted and empty topic produce
     the same line count as each other (project-wide).
   - `cd .../w3-plane-fixes/primitives/mcps/tower && bun test cli.test.mjs -t 'board topic filter'`
     → 0 fail.
2. Marker:
   `/Users/jrg/agent-core/briefs/tower/w3-plane-fixes-evidence/workers/f9-test-fix.done`
   with test tail.

## Constraints

- Touch ONLY the cli.test.mjs path under the integration worktree above.
- Do not edit cli.mjs / server.mjs. No commits. No mocks.

## Report back with

test tail, what assertion changed, deviations.
