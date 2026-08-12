# U3 test criteria — test_50_scent_digest.py

Authored by test-maker from plan only (design §4.5 / §4.6 direction A + brief shared acceptance).
Each assert maps to an acceptance criterion.

## Idle gate (shared behavior)

| Assert name | Criterion |
|-------------|-----------|
| `non_idle working exit 0` | Handler ignores non-idle `agent_status` (working) |
| `non_idle working no prompt` | No `agent prompt` for working status |
| `non_idle done exit 0` | Handler ignores done status |
| `non_idle done no prompt` | No prompt on done flip |
| `non_idle blocked exit 0` | Handler ignores blocked status |
| `non_idle blocked no prompt` | No prompt on blocked flip |

## Field read + route match (§4.5 / §4.6 A)

| Assert name | Criterion |
|-------------|-----------|
| `prompt_on_match exit 0` | Idle flip with matching open item exits 0 |
| `prompt_on_match issues prompt` | Exactly one `sc.verified_prompt` (`agent prompt` via fake herdr) |
| `prompt_on_match names scent` | Digest names `scent` |
| `prompt_on_match names from` | Digest names emitter `from` |
| `prompt_on_match names payload_ref` | Digest names `payload_ref` |
| `prompt_on_match includes claim recipe` | Digest includes `bun ~/.tower/cli.mjs emit work-claimed ...` recipe |
| `empty_field exit 0` | Idle flip with empty `open` exits 0 |
| `empty_field no prompt` | No prompt when `open` is empty |
| `empty_field board note` | Board still records the digest event |

## Pacing (60s per pane_id, 16-parent-wake precedent)

| Assert name | Criterion |
|-------------|-----------|
| `pacing first exit 0` | First idle digest in window exits 0 |
| `pacing first prompts` | First event delivers prompt |
| `pacing second exit 0` | Second event within 60s exits 0 |
| `pacing second suppressed` | Second event does not prompt again |
| `pacing second logs drop` | Dropped-by-pacing is logged (not silent) |
| `pacing second board note` | Paced-out event still boards |

## Suppression (bridge-exempt + focused)

| Assert name | Criterion |
|-------------|-----------|
| `bridge_exempt exit 0` | Bridge-exempt pane exits 0 |
| `bridge_exempt no prompt` | No prompt for `~/.tower/bridge-exempt` pane id |
| `bridge_exempt logged` | Suppression logged |
| `focused exit 0` | Focused idle pane exits 0 |
| `focused no prompt` | No prompt when pane is operator-focused |
| `focused logged` | Focus suppression logged |

## Field CLI failure tolerance

| Assert name | Criterion |
|-------------|-----------|
| `garbage_field exit 0` | Unparseable `field --json` output -> exit 0 |
| `garbage_field no prompt` | No prompt on parse failure |
| `garbage_field stderr log` | Failure logged to stderr |
| `field_cli_nonzero exit 0` | Non-zero field CLI exit -> exit 0 |
| `field_cli_nonzero no prompt` | No prompt on CLI failure |

## Pane prerequisites

| Assert name | Criterion |
|-------------|-----------|
| `no_cwd exit 0` | Pane missing `cwd` -> log and exit 0 |
| `no_cwd no prompt` | No prompt without resolvable cwd |

## Board contract

| Assert name | Criterion |
|-------------|-----------|
| `prompt_on_match board note` | One board append per digest event |
| `prompt_on_match board topic` | Topic `herdr-spine/scent-digest` |
| `prompt_on_match board from` | From `spine-daemon` |
| `prompt_on_match board type` | Type `note` |

## Fixture contract (test isolation)

- `HERDR_PLUGIN_EVENT_JSON` — synthetic idle/blocking events
- `HERDR_BIN_PATH` — fake herdr shell script (real subprocess; logs `pane list` + `agent prompt`)
- `SCENT_DIGEST_CLI` — fixture shell script emitting canned `{open,claimed,done,evaporated,help}` JSON
- `SPINE_SCENT_DIGEST_PACE_PATH` — temp pace JSON (60s window)
- `SPINE_BOARD_PATH` — scratch board (never `~/.tower/board.jsonl`)
- `HOME` — temp dir so `~/.tower/bridge-exempt` is injectable
- Handler field CLI invoked with **pane cwd** as subprocess cwd (not reimplemented in tests)

## Run command (tester, not test-maker)

```bash
python3 ~/herdr-spine/bin/handlers/tests/test_50_scent_digest.py
```

Expected: exit 0 when handler + fixtures are correct. Test-maker does **not** run this command.
