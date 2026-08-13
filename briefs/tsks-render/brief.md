# make tsks-render — concierge-grade `fleet-task render`

> From: CONCIERGE (operator intake 2026-08-12 ~21:30 UTC). Binding.
> Repo: `/Users/jrg/agent-core` (git — worktree wall applies, full bifurcation).

## Operator verdict (verbatim, the authority)

"this looks like shit" — on the TSKS pane's current render:

```
m-fleet-tasks: fleet-task whiteboard
  m-fleet-tasks / u-cli: fleet-task CLI core + Tower findings
  m-fleet-tasks / u-ctl-fleet: CTRL TASKS section
  m-fleet-tasks / u-rolefix: Role envelope repair
  m-fleet-tasks / u-dogfood: Dogfood + evidence
```

## Design authority

`~/agent-core/primitives/profiles/concierge.md` rule 7: **no ids, no slugs, no
coordinates as primary labels — work is named by what it is.** The TSKS pane is
the operator's whiteboard; it must read like a task board, not a database dump.
Inspiration bar: Cursor's task tool — unambiguous done/not-done at a glance.

## Pre-verified facts (CONCIERGE, this session)

- Source: `~/agent-core/primitives/tools/fleet-task/fleet-task.ts` — `cmdRender`
  at lines 425–457. `GLYPH` map imported from `store.ts` (line 21); data types
  in `types.ts`. Store: `~/.fleet-tasks/state.json`.
- `~/.local/bin/fleet-task` is a SYMLINK to the source — edits are live
  immediately; no deploy step.
- Tests: `fleet-task.test.ts` (5 render tests exist) — run with
  `bun test` in the tool dir (verify the runner invocation yourself first).
- Completed missions have their tasks pruned — units render as bare lines with
  zero task rows. That state must render intentionally, not look broken.
- The TSKS pane runs `fleet-task render` on a 5s `clear`-loop — output must be
  flicker-stable (deterministic ordering, no timestamps in default view).

## Requirements

1. **Human titles primary.** Mission header = title; unit lines = title. Raw
   ids only behind a `--ids` flag (scripting escape hatch).
2. **Status at every level.** Units get a rollup glyph derived from their
   tasks (all done / in progress / pending — check `types.ts` for a unit
   status field first; derive if absent). Missions get a rollup + count
   (e.g. `3/5`).
3. **Tasks:** glyph + content; completed tasks visually muted (ANSI dim —
   plain fallback when not a tty or `NO_COLOR` set).
4. **Empty/pruned units** render as an intentional state (e.g. dimmed
   "tasks pruned — complete" or per unit status), never a bare line.
5. Default render stays a single bounded block — no pagination, no color
   noise; glyphs carry the semantics.
6. `--unit` / `--mission` scoped renders get the same treatment.

## Done-when

- `fleet-task render` against the LIVE store (`~/.fleet-tasks/state.json`)
  produces the new board; paste the before/after in your report.
- Render tests extended (rollup glyphs, --ids, muted-done, pruned-unit state,
  non-tty fallback); full suite green.
- Committed to main in agent-core (worktree → merge per the make protocol).
- Report-back: what changed, before/after capture, test count.
