# Make brief — fleet-task CLI (U1 + U2)

Do NOT use emojis anywhere (except the four status glyphs `○ ◐ ✓ ⊘` which are
required output of `render`).

You are one half of a bifurcated Made Well Make beat for the `fleet-task` CLI.
`cursor-fleet make` launched you (either **coder**/Implementer or
**test-maker**/Test Designer) into your **own git worktree**. Derive ONLY from
this plan. Do not seek the other half's artifacts. Workers never commit.

## Pre-Verified Facts (ORCH verified 2026-08-12)

- Design: `~/agent-core/research/fleet-task-tool-design.md` (commit `560bf07`) §1 data model, §1.4 one-in_progress, §1.5 rollups, §1.7 write merge, §2.1 verbs, §5 non-interference.
- Operator rulings OVERRIDE the design doc (`briefs/fleet-tasks/mission.md` §5b):
  - **D1** store = GLOBAL `~/.fleet-tasks/state.json` (NOT per-project).
  - **D3** bun/TypeScript v1. **D4** Tower transition findings YES. **D5** CLI only.
  - **D6** AGNT/SAGT write denied; CORD/ORCH write; all roles may read.
- Target dir ABSENT: `~/agent-core/primitives/tools/fleet-task/` (create whole).
- Live store ABSENT: `~/.fleet-tasks/` (created by `init`).
- bun 1.3.14 on PATH. Install pattern: `#!/usr/bin/env bun` shebang + chmod +x + symlink `~/.local/bin/fleet-task`.
- Style exemplar: `~/agent-core/primitives/tools/statem/` (flat `.ts` + README.md).
- Tower post: `bun ~/.tower/cli.mjs post finding "<topic>" "<body>" --from "<name>"` — REFUSES cwd in `/tmp`, `/private/tmp`, `/scratchpad`, `/var/folders`. Spawn with `cwd` = mission `project_root`.
- herdr role: `$HERDR_PANE_ID` → `herdr pane get <id>` → `tokens.role` values `1-CORD`|`2-ORCH`|`3-AGNT`|`4-SAGT`.
- Unrelated uncommitted changes exist in agent-core (cursor-parity). Ignore; never stage/revert/investigate.

## Parallel Work Notice

- **YOUR partition (this tool only):** `~/agent-core/primitives/tools/fleet-task/**`, test-scoped store under `$FLEET_TASKS_HOME` (never live `~/.fleet-tasks/` in tests), and (coder only) `~/.local/bin/fleet-task` symlink + live `~/.fleet-tasks/` via `init` smoke if needed.
- **NOT yours:** `~/herdr-spine/bin/ctl-fleet`, `~/herdr-spine/bin/handlers/`, `~/agent-core/cli/`, `~/.agent-core/registry`, `primitives/directives/`, `primitives/AGENTS.md`.
- No TodoWrite hooks/wraps/mirrors (design §5).
- Board topic: `agent-core/fleet-tasks`. Post findings at checkpoints.

## Role split (isolation wall)

### Implementer (`coder`)
- Create product files under `primitives/tools/fleet-task/`: entry CLI + any flat helper modules (no framework), `README.md`, shebang install.
- Symlink `~/.local/bin/fleet-task` → the entry script (absolute path).
- Do NOT write `*.test.ts` / test files.
- `.done`: `~/agent-core/briefs/fleet-tasks/.done/make-impl.done` listing every created/modified path + how to invoke.

### Test Designer (`test-maker`)
- Create ONLY test files under `primitives/tools/fleet-task/` (e.g. `fleet-task.test.ts` and any test helpers). Prefer `bun test`.
- Derive every test from the Acceptance Criteria below — never from implementation.
- Tests MUST set `FLEET_TASKS_HOME` to a fresh temp dir (never touch live `~/.fleet-tasks/`).
- Role gate tests may use `--role` / `FLEET_TASK_ROLE` (no mock of herdr required when flag override is the documented escape hatch); include one path documenting undeterminable-role deny.
- Tower failure test: force post fail by using a mission whose `project_root` is under `/tmp` — write must still exit 0 with stderr warning.
- Concurrency: two real processes writing concurrently without corruption/lost updates.
- Do NOT write product code or README.
- `.done`: `~/agent-core/briefs/fleet-tasks/.done/make-tests.done` with test command + criterion map.

## Pinned store schema (binding — do not deviate)

File: `$FLEET_TASKS_HOME/state.json` where default `FLEET_TASKS_HOME` = `~/.fleet-tasks`.

```json
{
  "version": 1,
  "missions": {
    "m-<slug>": {
      "id": "m-<slug>",
      "project": "agent-core",
      "project_root": "/Users/jrg/agent-core",
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
              "active_form": "optional",
              "owner_role": "cord|orch",
              "owner_pane": "optional",
              "owner_agent": "optional",
              "deps": [],
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

- `tasks` is an ARRAY; merge-by-id patches by `id`.
- `progress` / `rollup_status` DERIVED per design §1.5 on every write, then stored.
- Mission ids unique globally; `mission open` refuses duplicates.
- Unit ids unique globally across the store (lookup by `--unit` alone).
- Writes: atomic (tmp + rename) AND lockfile `$FLEET_TASKS_HOME/state.json.lock` with staleness reclamation and bounded wait ~5s.

### Rollup rules (design §1.5 — exact)

From child statuses (tasks→unit, units→mission):
- `completed` iff all children are `completed` or `cancelled` AND ≥1 `completed`
- `cancelled` iff all children `cancelled`
- `in_progress` if any child `in_progress` OR (any `completed` AND any `pending`)
- else `pending`
Empty children → `pending`, progress all zeros, total 0.

### One in_progress (design §1.4)

- Per ORCH unit: at most one task with `status=in_progress` among tasks with `owner_role=orch` in that unit.
- Per CORD mission scope: at most one `in_progress` among `owner_role=cord` tasks across that mission's units (mission hygiene).
- Violation → non-zero exit + clear stderr error (no silent coerce).

### Legal transitions

`pending → in_progress → completed|cancelled`; also `pending → cancelled`.
All other transitions → reject with clear error.

## Pinned CLI contract (names exact)

Entry: `fleet-task.ts` with shebang `#!/usr/bin/env bun`.

Global flags / env (any verb):
- `--role cord|orch|agnt|sagt` OR env `FLEET_TASK_ROLE` (override)
- Primary role resolve: `$HERDR_PANE_ID` → `herdr pane get` → map `1-CORD→cord`, `2-ORCH→orch`, `3-AGNT→agnt`, `4-SAGT→sagt`
- `FLEET_TASKS_HOME` overrides store root (default `~/.fleet-tasks`)
- Writes (init, mission open/close, unit open/close, write, prune): require cord|orch. agnt|sagt → deny. Undeterminable → deny naming `--role` escape hatch. Fail-closed.
- Reads (read, render, mission show, unit show): allowed for every role including undeterminable.

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

`write` semantics (§1.7):
- `merge=false` — replace the task list for that unit (seed/reset).
- `merge=true` — patch by `id`; omitted ids unchanged; unknown new ids append.
- Task fields required on create: `id`, `content`, `status`, `owner_role`.
- On success print JSON including at least `{ "ok": true, "needs_in_progress": bool, "unit": {...}, "mission": {...} }` where `needs_in_progress` is true when the owner scope that was written has ≥1 pending and 0 in_progress.
- Completed/cancelled rows persist until `prune`.

`render` glyphs (exact): `○` pending, `◐` in_progress, `✓` completed, `⊘` cancelled. One task per line; include unit/mission headers as needed. stdout only.

Tower side effect (D4): when a unit or mission `rollup_status` CHANGES after a write (including open/close that changes rollup), spawn:
`bun ~/.tower/cli.mjs post finding "<project>/fleet-tasks" "<one-line: <id> <old>→<new>>" --from "fleet-task@<project>"`
with `cwd` = that mission's `project_root`. Post failure → warn stderr, write still exits 0.

## Acceptance Criteria (each must be an executable test unless marked human)

**AC1 — init + mission/unit open.** From empty `FLEET_TASKS_HOME`: `init` creates `state.json`; `mission open` then `unit open` persist schema-shaped records; duplicate `mission open` same id fails.

**AC2 — write seed + merge patch.** `write --merge false` seeds tasks; `write --merge true` patches by id leaving others; `read`/`unit show` reflect both; `progress`/`rollup_status` match §1.5.

**AC3 — render glyphs.** After mixed statuses, `render --unit` prints the four glyphs correctly for each status.

**AC4 — illegal transition rejected.** e.g. `completed → pending` or `completed → in_progress` exits non-zero with clear error; store unchanged for that task.

**AC5 — second in_progress rejected.** Two orch-owned tasks both `in_progress` in one unit → reject; store keeps single in_progress invariant.

**AC6 — needs_in_progress flag.** Write that leaves pending>0 and in_progress=0 for that owner scope returns `needs_in_progress: true` in stdout JSON.

**AC7 — prune.** Completed/cancelled rows remain until `prune --completed` / `prune --cancelled`; after prune they are gone; rollups recompute.

**AC8 — role write gate (D6).** `--role agnt` write denied; `--role orch` write allowed; no role / undeterminable write denied with message mentioning `--role`; `--role agnt` read allowed.

**AC9 — Tower transition finding (D4).** With `project_root` = a real non-tmp path (e.g. `/Users/jrg/agent-core`), a write that changes unit or mission rollup appends a board finding (verify via `~/.tower/board.jsonl` tail or `bun ~/.tower/cli.mjs board` from that root). Body/from/topic match contract.

**AC10 — Tower post failure soft.** Mission with `project_root` under `/tmp`: rollup-changing write exits 0; stderr contains a warning about the Tower post failure.

**AC11 — concurrent writers.** Two processes concurrently performing writes against the same `FLEET_TASKS_HOME` produce no corrupt JSON and no lost updates (final state is a valid merge of both writers' ops). Lockfile required.

**AC12 — install path.** Entry runnable as `bun <path>/fleet-task.ts`; after symlink, `fleet-task` on PATH works. (Test-maker: invoke via `bun …/fleet-task.ts` with `FLEET_TASKS_HOME`. Coder documents symlink. ORCH verifies PATH install on main.)

## Constraints

- Touch ONLY your role's files under `primitives/tools/fleet-task/**` (+ coder: `~/.local/bin/fleet-task`). Do not commit.
- No mocks of the store — real files under temp `FLEET_TASKS_HOME`.
- Match statem style: flat bun/ts, comments state constraints not narration.
- If schema must deviate: STOP and board-post to `agent-core/fleet-tasks` before coding (ctl-fleet ORCH depends on this shape).

## Report back

Board finding on `agent-core/fleet-tasks` + your `.done` file. Include worktree path so ORCH can integrate into `~/agent-core` main checkout.
