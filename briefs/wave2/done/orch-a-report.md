# ORCH-A report — wave2 consolidation

## Per-worker outcomes

| Worker | Scope | Done-when evidence | Deviations |
|---|---|---|---|
| A1 pH session-skills | Thin session-start/end in store; symlink deploy; register | status ✓ both; symlinks verified; .done a1 | Skills 122/105 lines (>80 target) — standing directives kept |
| A2 pJ store-purge | Attic retired rot; skill sync; debugging merge; registry | status 27 ok/0 stale; attic inventory; .done a2 | none |
| A3 pK agents-reorg | Thin repo AGENTS.md; stage list + commit draft | AGENTS.md Zig 0.16.0 / pi+cc only; a3-*.txt | Stage list amended by ORCH (attic supersedes plugins/ adds) |
| A4 pM lifecycle | tower-ledger + flight/stop shims; pipe-tests | a4-pipe-tests.txt all exit 0; ORCH retest exit 0 | grounding + task-report deferred (a4-deferred.md) |

## Integration commits
- `3deb7e7` chore(agent-core): wave2 ORCH-A one-source consolidation

## Pipe-test evidence (ORCH re-verified)
- flight-recorder shim: exit 0
- stop-verdict shim (HERDR_ENV=0): exit 0
- `bun ~/.tower/cli.mjs inbox`: exit 0

## Deferred
- grounding-hook.cc/pi twins → next wave (a4-deferred.md)
- herdr-task-report.sh/ts → next wave
- Untracked leftover skills/bigfile/non-wave2 briefs — not ORCH-A scope
- Live home-dir shims (`~/.tower/lib.mjs`, hooks, pi extensions) not in git (by design)

## Reap
- Closed panes w1M:pH/pJ/pK/pM and tab w1M:tA
