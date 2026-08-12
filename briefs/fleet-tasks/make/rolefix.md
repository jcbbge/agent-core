# Make brief — fleet-task roleFromHerdr envelope path (U1 defect)

Do NOT use emojis anywhere.

You are one half of a bifurcated Made Well Make beat for a one-line defect fix.
`cursor-fleet make` launched you (either **coder**/Implementer or
**test-maker**/Test Designer) into your **own git worktree**. Derive ONLY from
this plan. Do not seek the other half's artifacts. Workers never commit.

## Defect (binding)

`roleFromHerdr()` in `primitives/tools/fleet-task/role.ts` parses
`herdr pane get <id>` stdout as top-level `{ tokens?: { role?: string } }`.

The real herdr 0.8.0 envelope (captured live 2026-08-12 from `herdr pane get w2H:p1`)
is top-level `{ id, result }` with role at `result.pane.tokens.role`.

Live fixture (byte-faithful capture; also on disk at
`~/agent-core/briefs/fleet-tasks/make/fixtures-herdr-pane-get-w2H-p1.json`):

```json
{"id":"cli:pane:get","result":{"pane":{"agent":"cursor","agent_status":"working","cwd":"/Users/jrg/agent-core","display_agent":"CORD fleet-tasks","focused":false,"foreground_cwd":"/Users/jrg/agent-core","label":"CORD fleet-tasks","pane_id":"w2H:p1","revision":124,"scroll":{"max_offset_from_bottom":668,"offset_from_bottom":0,"viewport_rows":53},"tab_id":"w2H:t1","terminal_id":"term_658dc46b347991bb","terminal_title":"Cord Coordinator W2H","terminal_title_stripped":"Cord Coordinator W2H","tokens":{"name":"fleet-tasks","role":"1-CORD","task":"MCP:board post"},"workspace_id":"w2H"},"type":"pane_info"}}
```

Top-level keys are ONLY `id` and `result`. There is NO top-level `tokens`.
Consequence of the bug: `data.tokens?.role` is always undefined → every herdr-pane
caller resolves "undeterminable" → write denied.

`HERDR_MAP` keys remain: `1-CORD`|`2-ORCH`|`3-AGNT`|`4-SAGT`.

## Pre-Verified Facts (ORCH verified)

- Only consumer of the envelope is `roleFromHerdr()` in `role.ts`.
- Suite today: `cd ~/agent-core/primitives/tools/fleet-task && bun test fleet-task.test.ts` → 12/12.
- Suite convention: NO MOCKS of product behavior; tests use `FLEET_TASKS_HOME` temp dirs and
  real subprocesses (`test-helpers.ts`). `runFleetTask` clears `HERDR_PANE_ID` /
  `FLEET_TASK_ROLE` unless explicitly passed in `extraEnv`.
- Live store `~/.fleet-tasks/` is being dogfooded by CORD — never write it from tests.
- Unrelated uncommitted work exists elsewhere in the repo — never stage/touch outside partition.
- Install: `~/.local/bin/fleet-task` → main `fleet-task.ts` (leave pointing at MAIN after
  you finish; do not leave a worktree symlink).

## Parallel Work Notice

- **coder partition:** `primitives/tools/fleet-task/role.ts` ONLY. No test files.
- **test-maker partition:** `primitives/tools/fleet-task/fleet-task.test.ts` and
  `test-helpers.ts` ONLY (helper only if needed for the fixture path). No product code.
- Board: `agent-core/fleet-tasks`. Questions UP to ORCH fleet-task-rolefix via board note.

## Role split (isolation wall)

### Implementer (`coder`)

- Fix `roleFromHerdr()` to read `result.pane.tokens.role` from the parsed JSON — the one
  verified shape above. No speculative multi-shape tolerance / fallback to top-level tokens.
- Do NOT write or edit any `*.test.ts` / test helpers.
- Do NOT commit. Do NOT touch files outside `role.ts`.
- `.done`: `~/agent-core/briefs/fleet-tasks/.done/make-rolefix-impl.done` with worktree path,
  diff summary for `role.ts`, and confirmation the symlink still targets MAIN if you touched it.

### Test Designer (`test-maker`)

- Add a regression test that would have caught this defect. Derive from THIS plan only —
  never read `role.ts`.
- The test MUST exercise the REAL `herdr pane get` JSON envelope shape. Use the live fixture
  above (or the on-disk capture). A hand-invented envelope shape is a mock in disguise.
  Honest patterns: (a) put the captured JSON behind a PATH-prepending stub binary named
  `herdr` that prints the fixture for `pane get <id>` and exits 0; or (b) any equivalent that
  feeds that exact JSON into the CLI's herdr call path. Do not invent a different key layout.
- Acceptance: with `HERDR_PANE_ID` set (and no `--role` / no `FLEET_TASK_ROLE`), a write verb
  against a temp `FLEET_TASKS_HOME` MUST succeed when the fixture carries `tokens.role=1-CORD`.
  When the same envelope shape carries `tokens.role=3-AGNT` (role field only swapped on the
  captured fixture — shape unchanged), write MUST still be denied.
- The CORD-fixture case MUST fail against the old (top-level tokens) code and pass against the
  fix. Name the test so the criterion is obvious (e.g. include `herdr-envelope` or `AC-role-envelope`).
- Do NOT write product code. Do NOT commit.
- `.done`: `~/agent-core/briefs/fleet-tasks/.done/make-rolefix-tests.done` with worktree path,
  test name(s), command to run, and how the fixture is supplied.

## Acceptance Criteria

1. **AC-role-envelope-cord:** Given the live-captured envelope with `result.pane.tokens.role=1-CORD`,
   and `HERDR_PANE_ID` set with no `--role` / no `FLEET_TASK_ROLE`, `fleet-task` write (or
   `mission open`) against a temp home succeeds (exit 0).
2. **AC-role-envelope-agnt:** Given the same envelope shape with `result.pane.tokens.role=3-AGNT`,
   write is denied (non-zero; deny message mentions role / `--role`).
3. **AC-suite:** Full suite green after integration on MAIN (`bun test fleet-task.test.ts`),
   count = prior 12 + new regression test(s).

## Constraints

- Touch ONLY the partition for your role. No commits.
- NO MOCKS of the envelope shape — use the captured fixture.
- Comments state constraints, not narration.
- Match existing code style.

## Report back

Board finding on `agent-core/fleet-tasks` + your `.done` marker.
