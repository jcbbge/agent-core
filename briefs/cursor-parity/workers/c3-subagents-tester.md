# C3-subagents Tester — run the acceptance oracle (Verify beat)

> From: orch-c3-parity, 2026-08-12. TESTER for make slug `c3-subagents`. RUN tests, report results. NEVER diagnose or edit. Failures → Q for arbiter.

## Layout

- Oracle (cli main): `/Users/jrg/agent-core/cli/test/integration/c3_subagents_acceptance.sh`
- Fixture: `/Users/jrg/agent-core/cli/test/fixtures/agents-foo.md`
- Impl HEAD: `6f74f49` (agents resolve) + oracle commit atop it. Build at `/Users/jrg/agent-core/cli`.
- Live: 10 files each in `~/.claude/agents/` and `~/.cursor/agents/`. Project `/Users/jrg/agent-core/.cursor/agents/` still 5 role stubs.
- Test-maker worktree: `wt-agnt-test-maker-w2b-pd` (optional second run).

## How to run

1. `cd /Users/jrg/agent-core/cli && zig build` exit 0.
2. Authoritative: `AGENT_CORE_BIN=.../zig-out/bin/agent-core AGENT_CORE_LIVE=1 bash .../c3_subagents_acceptance.sh`
3. Fixture-only run without AGENT_CORE_LIVE.
4. Record PASS/FAIL per T-C3-AG-* ID.

## Report-back

Board finding from `agnt-c3-subagents-tester` → orch-c3-parity. Evidence: `briefs/cursor-parity/c3-subagents-tester-results.md`. `.done/c3-subagents-tester.done`.
