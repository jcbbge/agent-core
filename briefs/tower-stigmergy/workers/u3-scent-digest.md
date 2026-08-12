Implement herdr-spine idle-flip handler `bin/handlers/50-scent-digest` (design §4.6 direction A). Python3 stdlib only. Do NOT use emojis anywhere. Workers never commit — ORCH gates.

## Pre-Verified Facts (ORCH verified 2026-08-12 ~16:53 UTC)
- U1 landed: `bun ~/.tower/cli.mjs field --json` returns `{open,claimed,done,evaporated,help}` scoped by process cwd. Live smoke: emit→open→claim→claimed green. agent-core commit `7fe23dd`.
- Dispatcher contract `~/herdr-spine/docs/dispatcher.md`: every executable in `bin/handlers/` not starting with `.`/`_` runs per `pane.agent_status_changed`, sorted by basename, 5s budget, env `HERDR_PLUGIN_EVENT_JSON` (+ HERDR_SOCKET_PATH, HERDR_BIN_PATH, HERDR_PLUGIN_STATE_DIR), all failures log stderr + exit 0. Prefix 50 fits wave-B FIELD.
- Template: `~/herdr-spine/bin/handlers/16-parent-wake` — status filter, role normalize `^\d+-` (:41-44), 60s pace JSON (:57-87), focused suppress, verified_prompt, board_append, all-failures-exit-0 (:166-171).
- `_spine_common.py` as `sc`: log :37 · parse_event :43 · get_panes :81 · pane_of :93 · pane_name :121 · board_append :326 · find_focused :353 · verified_prompt :361.
- Bridge-exempt pattern (`10-notify:381-388`): read `~/.tower/bridge-exempt` one pane id per line; skip if match.
- Route resolution order (design §4.5): to_pane == pane_id → to_role == normalized role → no route / topic-scope = environmental claim by any idle agent in namespace. need-help out of scope for digest.
- herdr-spine @ `63e1010`. Partition: NEW file `bin/handlers/50-scent-digest` (+ NEW test file only). Do NOT touch `bin/ctl-fleet*`.
- CLI path overridable via `SCENT_DIGEST_CLI` env (tests inject fixture script). Pace path: `~/.tower/scent-digest-pace.json` overridable via `SPINE_SCENT_DIGEST_PACE_PATH`.

## Parallel Work Notice
Parallel ORCH ctl-fleet-tasks owns `bin/ctl-fleet*` — ignore their uncommitted work. U1/U2 done; do not edit ~/.tower/server.mjs|cli.mjs|COMMS-ARCH.md or agent-core hooks. Board topic: `constellation-zg/tower-stigmergy`.

## Tower
- Findings to `constellation-zg/tower-stigmergy` from real repo cwd. Operator mail: NONE.
- spine-report task/verdict at start/end.

## Tasks

### Shared behavior (plan for both profiles)
Handler fires only on `status == "idle"`. One `sc.get_panes()`; resolve cwd, role (strip `^\d+-`), human name. No cwd → log exit 0.
Shell out to `bun ~/.tower/cli.mjs field --json` WITH pane cwd as process cwd (NEVER reimplement derivation in python). Non-zero/unparseable → log exit 0.
Route-match over open set per §4.5. If matches: ONE `sc.verified_prompt` digest naming each open item (scent, from, payload_ref, claim recipe: `bun ~/.tower/cli.mjs emit work-claimed <topic> <payload> --ref <id> --evidence <path>`). Cap 5, oldest first.
Pacing 60s per pane_id; dropped-by-pacing logged. Board note every event (prompted or paced) via `sc.board_append("note", body, "spine-daemon", "herdr-spine/scent-digest")`. Suppress bridge-exempt + focused pane. No fabrication — mint no pheromones.

### test-maker ONLY (from THIS brief — NEVER read handler impl)
1. Author `~/herdr-spine/bin/handlers/tests/test_50_scent_digest.py` (or `~/herdr-spine/test/test_50_scent_digest.py` if that matches nearby test layout — prefer colocated under handlers/tests/ if creating new dir is needed; keep path under herdr-spine only).
2. Fixtures: synthetic `HERDR_PLUGIN_EVENT_JSON` idle event; fixture CLI shell script emitting canned field JSON via `SCENT_DIGEST_CLI`; temp pace path via `SPINE_SCENT_DIGEST_PACE_PATH`.
3. Asserts: prompt issued on match; no prompt on empty field; pacing suppresses second event within 60s; bridge-exempt suppressed; non-idle status no-op; exit 0 on garbage JSON.
4. Runner: `python3 <test_path>` exits 0 when handler+fixtures correct. Write criteria to `~/agent-core/briefs/tower-stigmergy/workers/u3-criteria.md`. Touch `~/agent-core/briefs/tower-stigmergy/workers/u3-test-maker.done`.

### coder ONLY (NEVER read `*.test.py` / test files)
1. Create executable `~/herdr-spine/bin/handlers/50-scent-digest` (shebang python3, chmod +x) implementing the shared behavior above.
2. Study 16-parent-wake for patterns; import `_spine_common` via sys.path insert like siblings.
3. Touch `~/agent-core/briefs/tower-stigmergy/workers/u3-coder.done`. Do NOT commit. Do NOT write tests.

## Constraints
- Touch ONLY: `bin/handlers/50-scent-digest` (coder) and the one new test file (test-maker) + worker markers under briefs/tower-stigmergy/workers/.
- No mocks of herdr beyond env-injected fixtures; real subprocess to fixture CLI.
- Verification (tester/ORCH): `python3 <test_path>` exits 0; handler is executable; `file` shows python script.

## Report back with
- Paths shipped, chmod confirmation, per-file summary
- Test command + exit code (test-maker lists expected asserts; coder does not run tests)
- DID NOT COMMIT
