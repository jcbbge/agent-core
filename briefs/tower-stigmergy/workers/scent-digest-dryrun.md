# scent-digest-dryrun — dry-run gate on 50-scent-digest

Add a flag-file dry-run gate to herdr-spine handler `bin/handlers/50-scent-digest` so idle-flip digests log/board without prompting until `~/.tower/scent-digest-live` exists. Do NOT use emojis anywhere. Workers never commit — ORCH gates.

## Pre-Verified Facts (ORCH verified 2026-08-12 ~18:46 UTC)
- Handler exists: `/Users/jrg/herdr-spine/bin/handlers/50-scent-digest` (landed `248a35e`). Idle-only at status check (`status != "idle"` early return). Prompt block: pacing via `prompt_allowed` then `sc.verified_prompt(pane_id, format_digest(matches))`; outcome in {prompted, prompt-failed, paced-out}; always `board_note(...)` to topic `herdr-spine/scent-digest` from `spine-daemon`.
- `PACE_PATH` already env-overridable: `SPINE_SCENT_DIGEST_PACE_PATH` → default `~/.tower/scent-digest-pace.json`. Field CLI override: `SCENT_DIGEST_CLI`.
- Flag-file precedent in `40-tower-bridge`: `os.path.exists(os.path.expanduser("~/.tower/bridge-fabricate-done"))`, contents ignored.
- LIVE flag currently ABSENT: `ls ~/.tower/scent-digest-live` → No such file (verified). Production default after this change must be dry-run until CORD creates the flag.
- Tests: `/Users/jrg/herdr-spine/bin/handlers/tests/test_50_scent_digest.py` — 9 tests, `python3 bin/handlers/tests/test_50_scent_digest.py` exits 0 (reproduced). Harness sets `HOME` to tmp, injects `SPINE_SCENT_DIGEST_PACE_PATH`, `SCENT_DIGEST_CLI`, fake herdr. Existing 9 assert LIVE prompt behavior — they MUST keep that meaning by setting a temp live flag via `SPINE_SCENT_DIGEST_LIVE_PATH` (create empty file under harness tmp) for those tests.
- Partition: ONLY `bin/handlers/50-scent-digest` (coder) and `bin/handlers/tests/test_50_scent_digest.py` (+ optional criteria under briefs). Do NOT touch `bin/spine-spawn`, `bin/ctl-fleet*`, other handlers, `~/.tower` code, constellation-zg.
- herdr-spine HEAD at spawn: `872cf68` (verify-beat-port landed atop scent-digest). Work in your worktree only.

## Parallel Work Notice
Sibling missions own `bin/spine-spawn` (verify-beat-port) and `bin/ctl-fleet*` (fleet-tasks) — ignore uncommitted changes there; do not investigate, revert, or fix. Concern yourself only with your partition. Board: `constellation-zg/tower-stigmergy` from real repo cwd (`~/herdr-spine` or your worktree of it).

## Tower
- Post CLAIM first on topic `constellation-zg/tower-stigmergy`, findings during, `.done` marker last under `~/agent-core/briefs/tower-stigmergy/workers/`.
- Operator mail: NONE. No `to:"operator"`.
- spine-report task at start, verdict at end when on Herdr.

## Tasks

### Shared behavior (plan for BOTH profiles — derive only from this)

When idle flip has routed open matches:
1. Resolve `LIVE_PATH = os.environ.get("SPINE_SCENT_DIGEST_LIVE_PATH") or os.path.expanduser("~/.tower/scent-digest-live")` (define near `PACE_PATH`).
2. If `LIVE_PATH` does NOT exist as a filesystem path:
   - Do NOT call `prompt_allowed` (pace state untouched).
   - Do NOT call `verified_prompt`.
   - Board note outcome must be `dry-run` and body must list matched pheromone ids and the would-be recipient, e.g. `pane <name> (<pane_id>): N open match(es); dry-run (would prompt: ph-…, ph-…)`.
   - Log the dry-run likewise to stderr via `sc.log`.
3. If `LIVE_PATH` exists: current live behavior unchanged (pace → verified_prompt → outcome prompted|prompt-failed|paced-out → board note).
4. Module docstring: add one paragraph documenting the dry-run gate (default flag path, default dry-run when absent, env override `SPINE_SCENT_DIGEST_LIVE_PATH`).
5. Empty-match / suppress / non-idle / CLI failure paths unchanged.

### test-maker ONLY (from THIS brief — NEVER read handler implementation)
1. Extend `bin/handlers/tests/test_50_scent_digest.py` (+2 tests minimum).
2. Preserve meaning of existing 9: for tests that expect prompts/pacing, ensure harness creates a temp live flag file and exports `SPINE_SCENT_DIGEST_LIVE_PATH` pointing at it (so they still exercise live path). Do not weaken their asserts.
3. New test (a) flag absent: no `SPINE_SCENT_DIGEST_LIVE_PATH` / no live file under HOME → idle+matches → no prompt issued, board note body contains `dry-run` and pheromone id(s), pace file unchanged (missing or same mtime/content as before).
4. New test (b) flag present via temp `SPINE_SCENT_DIGEST_LIVE_PATH` → prompt path taken (same asserts as today's prompt_on_match style).
5. All 11+ green when handler implements the plan: `python3 bin/handlers/tests/test_50_scent_digest.py` exits 0.
6. Write criteria addendum to `~/agent-core/briefs/tower-stigmergy/workers/scent-digest-dryrun-criteria.md`. Touch `~/agent-core/briefs/tower-stigmergy/workers/scent-digest-dryrun-test-maker.done`.
7. Do NOT commit. Do NOT edit the handler.

### coder ONLY (NEVER read test files / `*.py` under tests/)
1. Edit `/Users/jrg/herdr-spine/bin/handlers/50-scent-digest` (in your worktree) per Shared behavior above.
2. Match surrounding style; chmod remains executable.
3. Touch `~/agent-core/briefs/tower-stigmergy/workers/scent-digest-dryrun-coder.done`.
4. Do NOT commit. Do NOT write or edit tests.

## Constraints
- Touch ONLY your partition files + worker markers under `briefs/tower-stigmergy/workers/`.
- Testing: no mocks beyond existing env-injected fixtures pattern; real subprocess to fixture CLI.
- Verification command (tester/ORCH, not you): `cd <merged-tree> && python3 bin/handlers/tests/test_50_scent_digest.py` exits 0 with ≥11 tests.
- Do not create `~/.tower/scent-digest-live` in the real home.

## Report back with
- Paths modified (absolute), per-file diff summary
- For test-maker: list of new assert names + expected total pass count
- For coder: confirm LIVE_PATH constant + dry-run branch locations (function/approx lines in YOUR file)
- Confirmation: DID NOT COMMIT
- Worktree path you wrote into
