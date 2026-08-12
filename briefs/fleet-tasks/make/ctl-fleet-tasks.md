# MAKE brief — ctl-fleet TASKS section (U3)

Shared plan for `cursor-fleet make ctl-fleet-tasks`. Implementer (coder) and
Test-Maker fork from THIS file only — neither reads the other's worktree.

ORCH: ctl-fleet-tasks (w2H:p3). CORD: fleet-tasks (w2H:p1). No commits.

## Intent

Add a **TASKS** section to `~/herdr-spine/bin/ctl-fleet` that renders the global
fleet-task whiteboard (`~/.fleet-tasks/state.json`, overridable via
`FLEET_TASKS_STORE`) for the operator in the Engine Shop CTRL pane. Read-only.
Silence when empty. Pure render on dirty ticks; disk I/O only in `refreshSlow()`.

## Partition (HARD)

Touch ONLY:
- `bin/ctl-fleet` (required)
- `docs/ctl-fleet.md` (optional short TASKS paragraph)
- Test fixtures + test files under the worktree (never `~/.fleet-tasks/`)

Do NOT touch: `bin/handlers/`, `~/.fleet-tasks/`, `primitives/tools/fleet-task/`,
any other herdr-spine paths. Do NOT spawn `fleet-task`. Do NOT commit.

## Pinned store schema (binding — read, never derive rollups)

```json
{
  "version": 1,
  "missions": {
    "m-<slug>": {
      "id": "m-<slug>",
      "project": "agent-core",
      "project_root": "/abs/path",
      "title": "human title",
      "rollup_status": "pending|in_progress|completed|cancelled",
      "progress": { "pending": 0, "in_progress": 0, "completed": 0, "cancelled": 0, "total": 0 },
      "created_at": "ISO8601",
      "updated_at": "ISO8601",
      "units": {
        "u-<slug>": {
          "id": "u-<slug>",
          "title": "human title",
          "owner_agent": "orch-<slug>",
          "rollup_status": "pending|in_progress|completed|cancelled",
          "progress": { "pending": 0, "in_progress": 0, "completed": 0, "cancelled": 0, "total": 0 },
          "created_at": "ISO8601",
          "updated_at": "ISO8601",
          "tasks": [
            {
              "id": "t1",
              "content": "human title",
              "status": "pending|in_progress|completed|cancelled",
              "active_form": "optional present-tense string",
              "owner_role": "cord|orch",
              "owner_agent": "optional",
              "created_at": "ISO8601",
              "updated_at": "ISO8601"
            }
          ]
        }
      }
    }
  }
}
```

Malformed missions (missing `rollup_status` or `progress`) → skip silently.
Absent / unparseable store → no TASKS section (no throw, no error banner).

## Render spec (exact)

Glyphs (exact): `○` pending · `◐` in_progress · `✓` completed · `⊘` cancelled.

### Machine plane (default)

One block per project that has ≥1 valid mission, grouped by `mission.project`
(sorted). TASKS sits **directly above** WORK.

```
TASKS
  agent-core  m-fleet-tasks  ✓2 ◐1 ○3 ⊘0
    ORCH fleet-task-cli  ◐ Drafting the CLI core
      ✓ Schema pinned
      ◐ Draft the CLI core
      ○ Board + .done
```

Rules:
1. Project line: `<project>  <mission.id>  ✓N ◐M ○P ⊘Q` using mission `progress`
   counts (N=completed, M=in_progress, P=pending, Q=cancelled). Do not recompute.
2. Unit line role prefix: `ORCH` if the unit's tasks' `owner_role` is `orch`
   (or absent / owner_agent starts with `orch-`); `CORD` when `owner_role` is
   `cord` (or owner_agent starts with `cord-`). Prefer an in-progress task's
   `owner_role` if present; else first task; else infer from `owner_agent`.
3. Unit line body when any task is `in_progress`: glyph `◐` + that task's
   `active_form` if non-empty, else `content`. (At most one in_progress expected.)
4. Unit line body when none in_progress: unit `rollup_status` glyph + unit `title`.
5. Task rows under the unit: `glyph content`, indented. Completed and cancelled
   stay visible.
6. Collapse: if unit `rollup_status` is `completed` or `cancelled`, emit ONLY the
   unit summary line (no task rows).
7. Truncate every line with existing `truncate(s, cols)`.
8. Silence: zero valid missions after load → omit the entire TASKS header/block.

### Project plane (`--project <root>`)

Same block, filtered to missions where `mission.project === basename(root)`
(or equals the scoped project name already used by ctl-fleet as `PROJECT_NAME`).
Still above WORK. Silence if none match.

## Implementation requirements (coder)

1. `FLEET_TASKS_STORE` env overrides default path `~/.fleet-tasks/state.json`.
2. `loadTasksStore()` (name flexible) called from `refreshSlow()` via existing
   `loadJson(path)` — mtime-cached. Cache snapshot in a module-level variable
   consumed by render. Zero disk I/O on the 250ms render path.
3. `renderTasksMachine(lines, cols)` and `renderTasksProject(lines, cols)` beside
   the WORK renderers; call them from `render()` **before** WORK in both planes.
4. Match existing style: flat bun/ts single file, terse, no new deps, no new
   herdr socket verbs.
5. Optional: one short TASKS paragraph in `docs/ctl-fleet.md`.
6. Testability: prefer a dump seam so tests can capture one frame without a
   forever loop — e.g. env `CTL_FLEET_DUMP=1` (or argv `--dump`) that connects,
   runs one `pollSnapshot`/`refreshSlow`, renders once to stdout (still with
   clear codes OK — tests strip ANSI), then exits 0. If you add this, keep it
   minimal and document in a comment. Do not restart/kill live CTRL `w29:p12`.

## Acceptance criteria (Test-Maker derives tests from these ONLY)

### A1 — Silence / malformed (automated)
Given `FLEET_TASKS_STORE` pointing at (a) missing path, (b) unparseable JSON,
(c) valid JSON with a mission missing `progress` or `rollup_status` and no other
valid missions: ctl-fleet dump/render stdout contains no `TASKS` header and
process does not throw / non-zero solely due to the store.

### A2 — Machine-plane shape (automated)
Fixture with TWO projects, each with ≥1 mission; units/tasks covering all four
statuses; at least one unit collapsed (`rollup_status` completed or cancelled);
at least one unit with an `in_progress` task that has `active_form`.
Running machine-plane dump with `FLEET_TASKS_STORE=<fixture>` must produce a
TASKS block above WORK matching the spec: glyphs, mission progress counts from
fixture (not recomputed), indentation, collapse (no task rows under collapsed
units), `ORCH`/`CORD` prefixes, `active_form` on the in-progress unit line.

### A3 — Project-plane filter (automated)
Same fixture; `--project <root>` for one of the two projects shows only that
project's missions under TASKS; the other project's mission id/name must not
appear in the TASKS block.

### A4 — No live store touch (automated)
Tests never read or write `~/.fleet-tasks/state.json`. All fixtures live under
the test worktree (e.g. `test/fixtures/fleet-tasks/*.json`).

### A5 — Cost model (automated or hybrid)
`loadJson` / store read is only reachable from `refreshSlow` (static grep or
structural assertion). Render path does not call `readFileSync`/`statSync` for
the tasks store.

### A6 — Human QA (class=human, `/qa-doc` shape — Tester never ticks)
- **what changed:** TASKS section in `bin/ctl-fleet` above WORK; optional docs.
- **how to verify:**
  `FLEET_TASKS_STORE=<fixture> bun bin/ctl-fleet` (or dump) and inspect chrome;
  CORD live check against Engine Shop later — do not touch `w29:p12`.
- **what to expect:** TASKS block per A2 shape; absent store → no section.
- **class:** human
- **[ ] pass / [ ] fail**

## Test law

NO MOCKS. Fixture JSON on disk. Real ctl-fleet process (or dump mode) stdout
captured. Strip ANSI if needed. Never point at the live store.

## Done-when (workers)

Coder: implementation landed in worktree partition; `.done` note for ORCH.
Test-Maker: automated suite for A1–A5 + human-QA item A6 written; `.done` note.
Neither commits. ORCH runs Verify (tester → arbiter nQ≤3) and leaves green
changes uncommitted in `~/herdr-spine` main checkout.
