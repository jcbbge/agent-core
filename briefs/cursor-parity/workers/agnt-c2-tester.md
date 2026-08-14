# C2 Tester — run the acceptance oracle (Verify beat, tester role)

> From: cord-agent-core, 2026-08-12. You are the TESTER for unit C2 (directive composition). You RUN tests and report results. You NEVER diagnose failures and NEVER edit code or tests — a failed test is a Q for the arbiter, not your problem to fix.

## The layout (verified by CORD this session)

- Acceptance suite: `/Users/jrg/.cursor/worktrees/agent-core/wt-agnt-test-maker-w2b-p5/cli/test/integration/c2_acceptance.sh`
- Fixtures: `/Users/jrg/.cursor/worktrees/agent-core/wt-agnt-test-maker-w2b-p5/cli/test/fixtures/` (core-minimal.md, delta-*.md, golden-composed-*.md, registry-c2-minimal, registry-missing-delta)
- Implementation under test: MAIN repo cli at `/Users/jrg/agent-core/cli`, HEAD `b126d56` `feat(directive): compose core+delta at deploy for directive/core` (the composition transform + delta parser field).
- Factored primitives under test: staged in `/Users/jrg/.cursor/worktrees/agent-core/wt-agnt-coder-w2b-p4` (`primitives/AGENTS.md` modified, `primitives/directives/{claude-code,pi,cursor}.md` added). The MAIN repo `/Users/jrg/agent-core/primitives/` does NOT have these yet (CORD gates the outer-repo commit).
- Live entrypoints (`~/.claude/CLAUDE.md`, `~/.pi/agent/AGENTS.md`, `~/AGENTS.md`) were already synced by the coder and should be composed regular files.

## How to run

1. Build the implementation: `cd /Users/jrg/agent-core/cli && zig build` (must exit 0; if not, that's a Q — report it, do not fix).
2. The suite computes `REPO_ROOT` relative to its own location, so its repo-content checks (T-C2-DELTA-FILES-EXIST, T-C2-CANONICAL-POINTER, T-C2-HAND-COMPOSED-BYTES) must run against a tree that HAS the factored primitives. Stage that tree: copy the suite + fixtures into the coder worktree at the same relative path (`cli/test/integration/`, `cli/test/fixtures/` — the coder worktree's `cli/` may be an uninitialized submodule dir; create the dirs plainly, do NOT touch any git state) and run:
   `AGENT_CORE_BIN=/Users/jrg/agent-core/cli/zig-out/bin/agent-core bash /Users/jrg/.cursor/worktrees/agent-core/wt-agnt-coder-w2b-p4/cli/test/integration/c2_acceptance.sh`
3. ALSO run the suite once from its original home (test-maker worktree) with the same `AGENT_CORE_BIN` — the registry-fixture tests (T-C2-STATUS-OK, STALE-MISMATCH, STALE-SYMLINK, MISSING-DELTA-CLI) are self-contained and must pass there too; the repo-content checks are expected to fail/skip there (that worktree has unfactored primitives) — record but do not count those against the implementation.
4. Record exact PASS/FAIL per criterion ID, the suite's final line (`integration: N passed, N failed`), and exit codes.

## Report-back

Post ONE finding to board topic `agent-core/cursor-parity` from `agnt-c2-tester`, addressed to cord-agent-core: per-criterion PASS/FAIL table, suite summary lines, exit codes, and a provenance block (`date -u`; binary path; cli HEAD). If anything failed, say ONLY what failed and the raw output — no diagnosis. Then write `/Users/jrg/agent-core/briefs/cursor-parity/.done/c2-tester.done`.
