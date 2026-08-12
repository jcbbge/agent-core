# scent-digest-dryrun — test criteria addendum

Authored by test-maker from plan/brief only (dry-run gate on `50-scent-digest`).
Extends `u3-criteria.md`; does not replace it.

## Dry-run gate (default when live flag absent)

| Assert name | Criterion |
|-------------|-----------|
| `dry_run_absent no live env` | Harness does not set `SPINE_SCENT_DIGEST_LIVE_PATH` |
| `dry_run_absent no live file under HOME` | No `~/.tower/scent-digest-live` under harness `HOME` |
| `dry_run_absent exit 0` | Idle flip with routed open item exits 0 |
| `dry_run_absent no prompt` | No `verified_prompt` / fake `agent prompt` call |
| `dry_run_absent stderr log` | Dry-run logged to stderr via `sc.log` |
| `dry_run_absent board note` | Board append for digest event |
| `dry_run_absent board dry-run` | Board body contains `dry-run` outcome |
| `dry_run_absent board pheromone id` | Board body lists matched pheromone id(s) |
| `dry_run_absent pace mtime unchanged` | Pace file mtime unchanged (no `prompt_allowed`) |
| `dry_run_absent pace content unchanged` | Pace file content unchanged |

## Live flag enables prompt path

| Assert name | Criterion |
|-------------|-----------|
| `live_flag_prompt live env set` | Temp empty file at `SPINE_SCENT_DIGEST_LIVE_PATH` |
| `live_flag_prompt exit 0` | Idle flip with routed open item exits 0 |
| `live_flag_prompt issues prompt` | Exactly one `verified_prompt` |
| `live_flag_prompt names scent` | Digest names `scent` |
| `live_flag_prompt names from` | Digest names emitter `from` |
| `live_flag_prompt names payload_ref` | Digest names `payload_ref` |
| `live_flag_prompt includes claim recipe` | Digest includes work-claimed emit recipe |
| `live_flag_prompt board note` | One board append per digest event |
| `live_flag_prompt board topic` | Topic `herdr-spine/scent-digest` |
| `live_flag_prompt board from` | From `spine-daemon` |
| `live_flag_prompt board type` | Type `note` |
| `live_flag_prompt board not dry-run` | Board body is live outcome, not `dry-run` |

## Existing live-path tests (harness live flag)

Tests that exercise prompt/pacing must set `live=True` on `Harness` so
`SPINE_SCENT_DIGEST_LIVE_PATH` points at a temp empty file:

- `test_prompt_on_route_match` — unchanged asserts, live flag on
- `test_pacing_suppresses_second` — unchanged asserts, live flag on

Unchanged paths (no live flag required): empty field, bridge-exempt, non-idle,
focused, CLI failure, no cwd.

## Fixture contract (addendum)

- `SPINE_SCENT_DIGEST_LIVE_PATH` — optional; temp empty file enables live prompt path
- Default (env unset, file absent under `HOME`): dry-run for idle+matches

## Run command (tester, not test-maker)

```bash
python3 bin/handlers/tests/test_50_scent_digest.py
```

Expected: exit 0 with **11** tests when handler implements the plan.
