# Tester brief — fleet-task CLI Verify

Do NOT use emojis anywhere (except noting render glyphs if asserting them).

You are the **tester** (Aldebaran). You RUN tests; you never edit code or tests.
First agent allowed to see both implementation and tests. Failures are a Q for
the arbiter — do not diagnose or fix.

## Pre-Verified Facts

- Integrated MAIN checkout path: `~/agent-core/primitives/tools/fleet-task/`
  contains BOTH product files (`fleet-task.ts` + helpers + README) and tests
  (`fleet-task.test.ts`, `test-helpers.ts`).
- Symlink: `~/.local/bin/fleet-task` → main `fleet-task.ts`.
- Plan/ACs: `~/agent-core/briefs/fleet-tasks/make/fleet-task-cli.md` (AC1–AC12).
- Criterion map: `~/agent-core/briefs/fleet-tasks/.done/make-tests.done`.

## Tasks

1. From `~/agent-core`, run exactly:
   ```
   cd ~/agent-core/primitives/tools/fleet-task && bun test fleet-task.test.ts
   ```
2. Report pass/fail with full command output (counts). If any fail, list failing
   test names + stderr; do NOT fix; hand Q to arbiter via your `.done` body.
3. Optionally confirm `cd /tmp && fleet-task read --role agnt` exits 0 (read
   allowed) — note result; not a substitute for the suite.

## Constraints

- Touch NOTHING under `primitives/tools/fleet-task/` (no edits).
- Do not commit.
- `.done`: `~/agent-core/briefs/fleet-tasks/.done/tester-cli.done` with
  pass|fail, command, full tail output, failing test names if any.

## Report back

Board finding on `agent-core/fleet-tasks` + `.done` file.
