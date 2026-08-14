# C3-hooks Tester — run the acceptance oracle (Verify beat)

> From: orch-c3-parity. TESTER for `c3-hooks`. RUN only. No diagnose/edit.

## Layout

- Oracle: `/Users/jrg/agent-core/cli/test/integration/c3_hooks_acceptance.sh`
- Fixtures: `cli/test/fixtures/hooks-sample.json`, `hook-slim-guard.sh`
- Impl HEAD: `9cf255d` (hooks merge) + oracle commit atop. Build `/Users/jrg/agent-core/cli`.
- Live: `~/.cursor/hooks.json` (herdr sessionStart unmarked + managed slim + legacy unmarked slim-guard-cursor); script `~/.cursor/hooks/slim-guard.sh`.
- Before snapshot: `briefs/cursor-parity/hooks.json.before-c3-hooks`

## Run

1. `zig build` exit 0
2. `AGENT_CORE_BIN=... bash .../c3_hooks_acceptance.sh` (authoritative; LIVE if suite supports)
3. Record PASS/FAIL per T-C3-HK-*

Evidence: `briefs/cursor-parity/c3-hooks-tester-results.md`. Board → orch-c3-parity. `.done/c3-hooks-tester.done`.
