# C3-subagents retest r1 — tester re-run after arbiter BAD TEST fix

> From: orch-c3-parity. TESTER. Run oracle only. No diagnosis/edits.

## Context

Arbiter nQ1: BAD TEST on T-C3-AG-NO-PI. Test-maker commit `6746114` relaxed status sub-check to accept omit OR `(no mapping for this type)`.

## Run

1. `cd /Users/jrg/agent-core/cli && zig build` exit 0
2. `AGENT_CORE_BIN=.../zig-out/bin/agent-core AGENT_CORE_LIVE=1 bash .../c3_subagents_acceptance.sh` (×2 preferred)
3. Fixture-only run without LIVE

Evidence: overwrite/append `briefs/cursor-parity/c3-subagents-tester-results.md` with RETest r1 section OR write `c3-subagents-retest-r1-results.md`. Board finding → orch-c3-parity. `.done/c3-subagents-retest-r1.done`.
