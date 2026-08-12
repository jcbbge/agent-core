# Test-maker fix brief — fleet-task CLI nQ round 1 (bad tests)

Do NOT use emojis anywhere (except render glyph assertions if needed).

You are the **test-maker**. Arbiter ruled ALL FIVE failures **bad test**. Fix ONLY
the test files. Do NOT read or edit product implementation to "match" it — fix
tests to match the **plan/brief** (the arbiter already verified impl vs plan).

## Authority

- Plan: `~/agent-core/briefs/fleet-tasks/make/fleet-task-cli.md`
- Arbiter rulings (binding): `~/agent-core/briefs/fleet-tasks/.done/arbiter-cli-r1.done`
- Edit ONLY: `~/agent-core/primitives/tools/fleet-task/fleet-task.test.ts`
  and if needed `test-helpers.ts`. Working tree = MAIN `~/agent-core` (no worktree
  required for this fix pass — you are repairing tests in place after integration).

## Required fixes (from arbiter)

1. **AC1** — After `unit open`, expect mission.progress `{pending:1,total:1,...}`
   (mission has one unit child). Empty-children zeros only when mission has ZERO units.
2. **AC2** — Fix the TypeScript cast so `["u-ac2"]` is a runtime index AFTER the cast
   (see AC7 pattern at ~358). Also expect mission.progress as UNIT-rollup grain:
   one unit in_progress → `{in_progress:1, total:1, pending:0, completed:0, cancelled:0}`
   (NOT task-grain totals).
3. **AC9** — Do NOT jump `pending → completed`. Legal path:
   `pending → in_progress → completed` (two writes), then assert Tower finding.
4. **AC10** — Use a rollup-CHANGING write (e.g. seed or patch to `in_progress`) with
   `/tmp` project_root; then assert exit 0 + stderr Tower warning.
5. **AC11** — Drop flaky `sawLock` polling. Assert deterministically: both writers
   exit 0, state.json valid, both updates present (no lost updates). Optionally
   assert lock behavior by pre-holding a lock and observing bounded wait — but do
   not require observing ephemeral lockfile during free concurrent writes.

## Done when

- `.done`: `~/agent-core/briefs/fleet-tasks/.done/testmaker-cli-r1.done` listing
  what changed per AC.
- Board finding on `agent-core/fleet-tasks`.
- Do not run the suite (tester does). Do not commit. Do not edit product `.ts`
  (fleet-task.ts, store.ts, etc.).
