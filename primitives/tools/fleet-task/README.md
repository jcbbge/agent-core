# fleet-task

CORD/ORCH whiteboard CLI — global store at `~/.fleet-tasks/state.json`
(override with `FLEET_TASKS_HOME`). Harness TodoWrite stays the personal notebook;
this is the fleet-visible sticky-note layer.

## Install

```sh
chmod +x primitives/tools/fleet-task/fleet-task.ts
ln -sf "$(realpath primitives/tools/fleet-task/fleet-task.ts)" ~/.local/bin/fleet-task
```

Requires **bun** on PATH (`#!/usr/bin/env bun`).

## Role gate (D6)

| Role | write | read/render |
|------|-------|-------------|
| cord, orch | yes | yes |
| agnt, sagt | no | yes |
| undeterminable | no | yes |

Override: `--role cord|orch|agnt|sagt` or `FLEET_TASK_ROLE`.
Primary resolve: `$HERDR_PANE_ID` → `herdr pane get` → `tokens.role`
(`1-CORD`→cord, `2-ORCH`→orch, `3-AGNT`→agnt, `4-SAGT`→sagt).

## Verbs

```
fleet-task init
fleet-task mission open --id m-<slug> --project <name> --project-root <abs> --title <text>
fleet-task mission close --id m-<slug>
fleet-task mission show --id m-<slug>
fleet-task unit open --mission m-<slug> --id u-<slug> --title <text> --owner-agent <name>
fleet-task unit close --mission m-<slug> --id u-<slug>
fleet-task unit show --id u-<slug>
fleet-task write --unit <id> --merge true|false --json '<array>'
fleet-task read [--unit <id>|--mission <id>|--status <status>]
fleet-task render [--unit <id>|--mission <id>]
fleet-task prune --unit <id> --completed|--cancelled
```

`write --merge false` replaces the unit task list; `merge true` patches by `id`.
Completed/cancelled rows persist until `prune`. At most one `in_progress` per
`owner_role=orch` in a unit and per `owner_role=cord` across a mission.

`render` glyphs: `○` pending · `◐` in_progress · `✓` completed · `⊘` cancelled.

On unit/mission rollup change, posts a Tower finding to `<project>/fleet-tasks`
from `fleet-task@<project>` with `cwd` = mission `project_root`. Post failure
warns on stderr; the write still exits 0.

## Modules

| File | Role |
|------|------|
| `fleet-task.ts` | CLI entry + verbs |
| `types.ts` | Schema types |
| `store.ts` | Atomic write + lockfile |
| `rollup.ts` | §1.5 rollup derivation |
| `validate.ts` | Transitions + in_progress |
| `role.ts` | Role resolve + write gate |
| `tower.ts` | Transition findings |

Design: `~/agent-core/research/fleet-task-tool-design.md`. Operator store ruling
D1: global `~/.fleet-tasks/`, not per-project.
