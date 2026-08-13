# Test criteria — circadian-wake / cold-start sessionStart (BEFORE code)

Unit: restore `sessionStart` hooks on persistent interactive cursor-spine cold
spawns by not passing `--resume` immediately after `create-chat`.
Repo: `~/cursor-shim`. Suite: `bash docs/qa-verify.sh` (dry-run / static only;
must never spawn real panes). Baseline at plan time: 90 passed, 0 failed —
must stay green and GROW.

## Intent (from Task-1 evidence)

- `-p` / researcher headless: sessionStart fires; wake reaches agent.
- Interactive + `create-chat` then immediate `--resume`: sessionStart suppressed
  (scoreboard delta 0, agent_session null, WAKE_SEEN=no).
- Interactive without `--resume`: sessionStart fires; wake reaches agent.
- Root cause is shim cold-start `--resume`, not hooks.json / wake.ts.

## Automated criteria (qa-verify dry-run / static)

1. Cold interactive path must NOT append `--resume` to `IA_ARGS` after minting
   a fresh `create-chat` id. Source must document why (sessionStart suppression).
2. Cold KEEP `-p` path must NOT append `--resume` to `CA_ARGS` after a fresh
   `create-chat` either (same suppression risk).
3. `create-chat` remains gated to `KEEP=1` (persistent tiers only).
4. `cursor-spine resume <chat_id>` subcommand still passes `--resume` (true warm
   re-entry path preserved).
5. Interactive dry-run `cmd` line for coordinator/orchestrator must not contain
   `--resume` (cold spawn shape).
6. New qa-verify section `### Circadian cold-start sessionStart` covers the
   above with mechanical assertions; suite still never spawns real panes.
7. Prior Lever 4 checks that required `IA_ARGS+=(--resume` / `CA_ARGS+=(--resume`
   on the cold path are updated to match the new contract (resume subcommand
   only), not left failing.
8. `bash docs/qa-verify.sh` exits 0; PASS count >= 90 + new cases; FAIL = 0.
9. Touch ONLY `~/cursor-shim` (cursor-spine, docs/qa-verify.sh, docs/ as needed).
   No edits to `~/.cursor/hooks.json`, `~/circadian`, or wake kill-switch R7.
10. No mocks. No live pane spawns inside the suite.

## Out of scope for this unit's automated suite

- Live scoreboard delta / WAKE_SEEN echo (ORCH Task-4 live prove, not qa-verify).
- Instr-file wake weave (not required if cold-start fix restores hooks).
