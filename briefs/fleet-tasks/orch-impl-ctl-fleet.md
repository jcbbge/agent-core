# ORCH ctl-fleet-tasks — TASKS section in the Engine Shop CTRL pane (unit U3)

Model tier: shim default (operator mandate — no overrides). Do NOT use emojis anywhere.

You are ORCH ctl-fleet-tasks, spawned by CORD fleet-tasks (pane w2H:p1, workspace w2H). You own one
inner Made Well loop (Imagine → Plan → Make → Verify) for adding a **TASKS section** to
`~/herdr-spine/bin/ctl-fleet` — the operator-facing render of the new fleet-task whiteboard. The
CLI that writes the store is being built IN PARALLEL by ORCH fleet-task-cli against the pinned
schema below; you build against that schema with fixtures, never against the live store.
Implementation code goes through `cursor-fleet make <slug> --brief <p>` (enforced Verify beat:
bifurcated coder/test-maker worktrees, tester, arbiter, nQ≤3 — full spec
`~/cursor-shim/docs/inner-loop-verify.md`). You plan, decompose, dispatch, gate. Workers never
commit; you do not commit either — CORD gates all commits.

## Authority (read first, binding)

- **Design doc:** `~/agent-core/research/fleet-task-tool-design.md` (committed `560bf07` in
  ~/agent-core) — §1.1 status glyphs, §1.5 rollup semantics, §3.1 TASKS render spec + cost model,
  §3.3 UX rules.
- **Operator rulings** (`~/agent-core/briefs/fleet-tasks/mission.md` §5b): D1 store = GLOBAL
  `~/.fleet-tasks/state.json` · D2 chrome = CTRL TASKS section (this unit) · D3 bun/ts.
- API ground truth with line citations: `~/agent-core/briefs/fleet-tasks/research-plane-surfaces.md` §4.

## Pre-Verified Facts (CORD verified each personally, 2026-08-12 ~16:50 UTC)

- Target file: `~/herdr-spine/bin/ctl-fleet` — 560 lines, bun (`#!/usr/bin/env bun`), herdr-spine
  git HEAD `bb307a4`, working tree CLEAN for this path.
- Disk I/O discipline (hard rule of this file): ALL disk reads happen inside `refreshSlow()`
  (lines 274-295), the 5s tick. Render path (250ms dirty ticks) is pure over cached state.
- Reuse the existing mtime-cached reader `loadJson(path)` (lines 250-259) for the store — same
  pattern WORK uses for `.madewell/`.
- Render integration: machine plane `renderWorkMachine` (lines 433-448) and project plane
  `renderWorkProject` (449-478) are called from `render()` at lines 524-525. Add
  `renderTasksMachine` / `renderTasksProject` beside them, called the same way.
- Silence-rule precedent: SHIPPED (`renderShippedMachine`, 479-508) emits NO header when there is
  no data. TASKS follows the same rule: store absent/unparseable/no missions → no TASKS section at
  all (never an error banner in the operator's chrome).
- Existing glyph language: `GLYPH`/`COLOR`/`DIM`/`RESET` at lines 423-428; `truncate()` at 418.
- TASKS glyphs (design §1.1, exact): `○` pending · `◐` in_progress · `✓` completed · `⊘` cancelled.
- bun 1.3.14 on PATH. herdr 0.8.0 socket at `~/.config/herdr/herdr.sock` (already used by ctl-fleet).
- The live CTRL fleet pane is `w29:p12` (workspace w29, machine plane) — do NOT restart, kill, or
  write to it. CORD performs the live-render verification at collection.

## Pinned store schema (shared with ORCH fleet-task-cli — binding)

Global store `~/.fleet-tasks/state.json`:

```json
{
  "version": 1,
  "missions": {
    "m-<slug>": {
      "id": "m-<slug>", "project": "agent-core", "project_root": "/abs/path",
      "title": "human title",
      "rollup_status": "pending|in_progress|completed|cancelled",
      "progress": { "pending": 0, "in_progress": 0, "completed": 0, "cancelled": 0, "total": 0 },
      "created_at": "ISO8601", "updated_at": "ISO8601",
      "units": {
        "u-<slug>": {
          "id": "u-<slug>", "title": "human title", "owner_agent": "orch-<slug>",
          "rollup_status": "...", "progress": { "...": 0 },
          "created_at": "...", "updated_at": "...",
          "tasks": [
            { "id": "t1", "content": "human title", "status": "pending|in_progress|completed|cancelled",
              "active_form": "optional", "owner_role": "cord|orch", "owner_agent": "optional",
              "created_at": "...", "updated_at": "..." }
          ]
        }
      }
    }
  }
}
```

`progress`/`rollup_status` are precomputed by the writer — you READ them, never derive. If a
store row is missing them, treat the mission as malformed and skip it silently. If the parallel
ORCH posts a schema deviation to board topic `agent-core/fleet-tasks`, that post governs — check
the board at Plan time.

## Render spec (design §3.1 + §1.5, adapted to the global store)

Machine plane (default): one block per project that has ≥1 mission, grouped by `mission.project`:

```
TASKS
  agent-core  m-fleet-tasks  ✓2 ◐1 ○3 ⊘0
    ORCH fleet-task-cli  ◐ Drafting the CLI core
      ✓ Schema pinned
      ◐ Draft the CLI core
      ○ Board + .done
```

- Project line: project name + mission id + counts `✓N ◐M ○P ⊘Q` from mission `progress`.
- Unit line: owner (`ORCH <unit title>` — or `CORD` when `owner_role` is cord) + the unit's single
  `in_progress` task's `active_form` (fallback `content`); if none in_progress, the unit
  `rollup_status` glyph + title.
- Task rows: glyph + `content`, indented under the unit; completed/cancelled stay visible
  (design §3.3 rule 3) — but a unit whose `rollup_status` is `completed`/`cancelled` may collapse
  to its one summary line to keep the section tight.
- Project plane (`--project <root>`): same block filtered to missions whose `project` equals the
  scoped project name.
- Placement: TASKS section directly ABOVE the WORK section in both planes.
- Cost model (hard): one mtime-cached `loadJson` of the store inside `refreshSlow()`; pure render
  on dirty ticks; ZERO new herdr socket verbs; no disk I/O outside `refreshSlow`.
- Testability seam (required): env var `FLEET_TASKS_STORE` overrides the default store path, so
  tests and fixtures never touch the live `~/.fleet-tasks/state.json`.

## Parallel Work Notice (disjointness is law — three other missions are LIVE)

- **YOUR partition:** `~/herdr-spine/bin/ctl-fleet` ONLY (single file), plus an optional short
  TASKS paragraph in `~/herdr-spine/docs/ctl-fleet.md`. Test fixtures live under your own
  worktree(s), never in `~/.fleet-tasks/`.
- **NOT yours:** `~/herdr-spine/bin/handlers/` — owned by the PARALLEL tower-stigmergy mission
  (live now; expect unrelated uncommitted changes in ~/herdr-spine — do not investigate, revert,
  or fix them). `~/agent-core/primitives/tools/fleet-task/` and `~/.fleet-tasks/` — owned by the
  PARALLEL ORCH fleet-task-cli; you NEVER write the store, and you never spawn
  `~/.local/bin/fleet-task` from ctl-fleet (read the JSON file directly).
- **Comms trap (verified by CORD):** Tower board rows are scoped to the poster's cwd
  (`normCwd`). You work in `~/herdr-spine`, but this mission's board lives under the
  **agent-core** scope. Your `mcp__tower__*` MCP tools (launched with your cwd) would post to the
  WRONG scope — invisible to CORD. Therefore ALL board traffic for this mission goes through the
  Tower CLI executed from `~/agent-core`:
  - Post: `cd ~/agent-core && bun ~/.tower/cli.mjs post finding "agent-core/fleet-tasks" "<body>" --from "ORCH ctl-fleet-tasks"`
  - Read: `cd ~/agent-core && bun ~/.tower/cli.mjs board` (filter topic `agent-core/fleet-tasks`)
  - (Verified: `cli.mjs post <claim|finding|note> <topic> "<body>" [--from <name>]`.)

## Tower (mid-run communication)

- CLAIM your partition on `agent-core/fleet-tasks` at start (via the CLI path above); findings at
  checkpoints; DONE report as a board `finding`.
- Questions route UP to CORD fleet-tasks via a board `note` (same CLI path, type `note`) with
  body starting `to: CORD fleet-tasks —` — never to the operator.
- On this Herdr host: `~/herdr-spine/bin/spine-report task "<what>"` at unit start and
  `spine-report verdict "<result>"` when done.

## Tasks

1. **Store reader.** `loadTasksStore()` inside `refreshSlow()` using `loadJson` on
   `FLEET_TASKS_STORE` ?? `~/.fleet-tasks/state.json`; cached snapshot consumed by render.
   Done when: absent file, unparseable JSON, and missing-rollup rows all yield "no TASKS section"
   with zero throw and zero render-path disk I/O.
2. **Machine-plane render** per the spec above, placed above WORK in `render()`.
   Done when: a fixture with two projects × missions × units × tasks in all four states renders
   exactly the spec'd shape (glyphs, counts, indentation, collapse rule), truncated to terminal
   width via existing `truncate()`.
3. **Project-plane render** — same block filtered to the scoped project.
   Done when: `--project` mode shows only that project's missions.
4. **Optional docs paragraph** in `~/herdr-spine/docs/ctl-fleet.md` describing the TASKS section.
5. **Human-QA item** (Verify beat requires it for UI): emit a `/qa-doc`-shaped checklist entry —
   what changed, how to verify (run ctl-fleet with `FLEET_TASKS_STORE=<fixture>`), what to expect,
   class=human. The tester never ticks it; CORD performs the live check at collection.

## Constraints

- Touch ONLY: `~/herdr-spine/bin/ctl-fleet`, optionally `~/herdr-spine/docs/ctl-fleet.md`,
  fixtures/tests inside your worktrees. Do not commit (CORD gates).
- Testing: NO MOCKS — fixture JSON files on disk, real ctl-fleet process render captured from
  stdout. Never point a test at the live store path.
- Verification: the Verify beat via `cursor-fleet make` is mandatory; exit gate = every automated
  test green (reproduced) and green in the MAIN checkout (`~/herdr-spine`), left UNCOMMITTED.
- Match ctl-fleet's existing style (flat bun/ts single file, terse, constraint comments only).
  No new dependencies. No new socket subscriptions.

## Report back with

Board finding on `agent-core/fleet-tasks` + `.done` marker
`~/agent-core/briefs/fleet-tasks/.done/impl-ctl-fleet.done` containing: per-file diff summary
(every file created/modified, fixtures included), test command + tail output, a captured sample
render of the TASKS section from a fixture (the human-QA artifact), and any deviations with reasons.
