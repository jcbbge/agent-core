# AGNT brief — latch GATE ZERO sleeper (sacrificial)

You are agnt-latch-sleeper. Do NOT use emojis. Sacrificial pane for GATE ZERO.
Your only job is to stay in a long shell sleep so orch-latch's blocker can
wait on your agent_status flip.

## Pre-Verified Facts

- You are in workspace w1Q, cwd `/Users/jrg/agent-core`.
- Do not build or edit latch. Do not commit.
- Tower topic: `agent-core/latch-vein`. From: `agnt-latch-sleeper`.

## Parallel Work Notice

orch-latch / agnt-latch-block own the experiment. You only sleep.

## Tower

Post one CLAIM at start, one DONE finding at end. No operator mail.

## Tasks

1. CLAIM: `CLAIM agnt-latch-sleeper: sleeping 600s for GATE ZERO`.
2. Run exactly one shell command and wait for it to finish:
   ```
   sleep 600
   ```
   Use a tool timeout / block_until of at least 620000 ms so the harness
   does not cut the sleep short. Do not poll, do not multitask.
3. After sleep returns, write marker:
   `~/agent-core/briefs/fringe/done/agnt-latch-sleeper.done`
   containing ISO timestamp and the word `awake`.
4. DONE finding: `DONE agnt-latch-sleeper: 600s sleep finished`.
5. Idle.

## Constraints

- Touch ONLY the `.done` marker path above.
- Do not commit. Do not run latch. Do not inspect other panes.

## Report back with

Board DONE + `.done` marker with timestamp. That is the entire report.
