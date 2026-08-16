# AGNT [statem-twr-test-bounce] — fix fixture count assert (nQ)

Repo worktree: `/Users/jrg/.cursor/worktrees/agent-core/wt-orch-bus-data-residuals`
Branch: `tower/bus-data-residuals`. Do NOT use emojis.

## Pre-Verified Facts (CORD verified this session)

- `bun test primitives/tools/statem/statem-twr-residuals.test.mjs` → **7 pass / 1 fail**
- Fail: `twr integrity surface — bad_line_count > fixture with N bad lines → twr --once reports exact bad_line_count`
  Expected **3**, Received **4** at test.mjs ~L295
- Live `twr --once` correctly shows `integrity: 26` — production path GO; oracle fixture assert wrong or fixture builds 4 bad lines.
- Touch ONLY the test file (+ optional criteria) and a `.done` marker. No production edits. No commit.

## Tower

- from=`AGNT statem-twr-test-bounce`, topic=`tower/bus-data`
- TOWER-WAIVED for pheromones (micro bounce); board finding when green.

## Tasks

1. Diagnose why fixture yields 4 vs expected 3 (extra blank/concat/header?). — done when: root cause named in finding.
2. Fix test to assert truth (exact fixture count) without weakening live AC. — done when: `bun test primitives/tools/statem/statem-twr-residuals.test.mjs` → 8/8.
3. Write `briefs/tower/bus-data/agnt-statem-twr-test-bounce.done` with command tail.

## Report back with

- root cause one line
- test exit + pass count
