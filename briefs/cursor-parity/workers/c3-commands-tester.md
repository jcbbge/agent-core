# C3-commands Tester — run the acceptance oracle (Verify beat)

> From: orch-c3-parity, 2026-08-12. You are the TESTER for make slug `c3-commands`. You RUN tests and report results. You NEVER diagnose failures and NEVER edit code or tests — a failed test is a Q for the arbiter.

## Layout (orch-verified)

- Oracle (committed to cli main): `/Users/jrg/agent-core/cli/test/integration/c3_commands_acceptance.sh`
- Fixture: `/Users/jrg/agent-core/cli/test/fixtures/command-tower.md`
- Implementation HEAD: `1a8246e` (oracle) atop `bca1682` (resolveDeployPath fallback). Binary: build at `/Users/jrg/agent-core/cli`.
- Coder worktree: `/Users/jrg/.cursor/worktrees/agent-core/wt-agnt-coder-w2b-p9` (may lack oracle — authoritative run is MAIN cli tree which has both impl + oracle).
- Test-maker worktree: `/Users/jrg/.cursor/worktrees/agent-core/wt-agnt-test-maker-w2b-pa` (has oracle; may lag impl HEAD — run registry-fixture criteria there too with AGENT_CORE_BIN pointing at main build).
- Live deploys already synced by coder (six files under ~/.claude/commands, ~/.pi/agent/prompts, ~/.cursor/commands).

## How to run

1. `cd /Users/jrg/agent-core/cli && zig build` — must exit 0.
2. Authoritative: `AGENT_CORE_BIN=/Users/jrg/agent-core/cli/zig-out/bin/agent-core AGENT_CORE_LIVE=1 bash /Users/jrg/agent-core/cli/test/integration/c3_commands_acceptance.sh`
3. Also run once WITHOUT AGENT_CORE_LIVE (fixture-only) to confirm fixtures alone are green.
4. Optionally run the copy in the test-maker worktree with AGENT_CORE_BIN=main build (fixture criteria).

Record PASS/FAIL per criterion ID (T-C3-CMD-*), suite summary, exit codes.

## Report-back

Board finding to `agent-core/cursor-parity` from `agnt-c3-commands-tester`, addressed to orch-c3-parity. Evidence file: `briefs/cursor-parity/c3-commands-tester-results.md`. Write `.done/c3-commands-tester.done`. No diagnosis on failure.
