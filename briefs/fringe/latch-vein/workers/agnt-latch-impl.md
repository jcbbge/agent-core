# AGNT brief — latch full implementation (post–GATE ZERO)

You are agnt-latch-impl. Do NOT use emojis. You extend the GATE ZERO
prototype into the full latch tool. Never commit. Install is out of scope.

## Pre-Verified Facts (orch-latch verified this session)

- GATE ZERO **GREEN** (evidence:
  `~/agent-core/briefs/fringe/latch-vein/gate-zero-evidence.md`):
  ~593s blocking `latch wait --pane` inside pi; harness did not kill/nag;
  exit 0 on sleeper `done`.
- Zig 0.16.0; stdlib only; macOS arm64. Layout already exists at
  `~/agent-core/primitives/tools/latch/` (build.zig, src/{main,lib,duration,wait}.zig,
  test/root.zig, README.md, zig-out/bin/latch).
- Design source: `~/agent-core/research/fringe-tooling-brainstorm.md` §4.1.
- Required surface:
  ```
  latch wait --pane <pane-id> [--until <status>] [--timeout <dur>]
  latch wait --file <path> [--timeout <dur>]
  latch wait --board <topic> [--timeout <dur>]
  latch hold <gate> [--timeout <dur>]
  latch --help
  ```
- Exit codes (truth law — never collapse): `0` event · `3` timeout ·
  `4` target vanished · `2` usage. Default timeout `30m`; forms `30s`/`10m`/`1h`.
- `--pane` default success: `idle` OR `done` (already implemented).
- `--file`: block via kqueue `EVFILT_VNODE` until the path exists or changes;
  exit 0. Exit 4 if the watched path is deleted after being observed (or
  document the exact vanished rule you implement in README + tests).
- `--board <topic>`: kqueue on `~/.tower/board.jsonl` + incremental
  tail-scan from a saved offset at subscribe time; exit 0 when a **new**
  row with that topic lands (append-only → offset cursor is correct).
  Board path may follow `$TOWER_HOME/board.jsonl` if set, else
  `~/.tower/board.jsonl`.
- `hold <gate>`: block until human/peer stamps `~/.fleet/gates/<gate>`
  (file created/touched). Create `~/.fleet/gates/` on demand (dir did not
  exist at project start; create as needed). Exit 0 when stamp appears;
  3 on timeout; 2 on bad gate name (reject path separators / `..`).
- Exactly one of `--pane` / `--file` / `--board` for `wait`; otherwise exit 2.
- Grounding hook: consecutive Edits to one file need a fresh Read between them.
- Tower: `cd ~/agent-core && bun ~/.tower/cli.mjs post <claim|finding|note> agent-core/latch-vein "<body>" --from agnt-latch-impl`
- `agent-core sync` forbidden. Do not install to ~/.local/bin.

## Parallel Work Notice

- orch-vein workers may touch other trees under agent-core — ignore them.
- Touch ONLY the latch partition below. A later verify AGNT owns live demos
  under `test/*.sh` and `briefs/fringe/latch-vein/acceptance-evidence.md`
  — you may add unit tests under `test/*.zig` / `test/root.zig` only.

## Tower

CLAIM first. Findings at meaningful checkpoints. DONE finding with digests.
Questions → orch-latch via board note.

## Tasks

1. CLAIM on `agent-core/latch-vein`.
2. Implement `--file`, `--board`, and `hold` with the exit-code matrix above.
   Prefer small modules (`wait_file.zig`, `wait_board.zig`, `hold.zig`) and
   keep pane wait working (do not regress GATE ZERO behavior).
3. Update `README.md` to full-tool docs (verbs, exits, examples, non-goals).
4. Unit tests: duration parsing, argv mutual exclusion, gate-name rejection,
   board topic match helper if extracted — `zig build test` must exit 0.
5. Short local smokes (not the full acceptance matrix — verify AGNT owns that):
   - usage error → exit 2
   - `latch wait --file` on a path you `touch` after starting (short timeout ok)
   - `latch hold` with a gate you stamp from another shell (short)
   - `latch wait --board` with a topic you post to (short)
6. `zig build` and `zig build test` exit 0.
7. DONE finding + `~/agent-core/briefs/fringe/done/agnt-latch-impl.done`.

## Constraints

- Touch ONLY:
  - `~/agent-core/primitives/tools/latch/**`
  - `~/agent-core/briefs/fringe/done/agnt-latch-impl.done`
- Do not commit. Do not edit orch briefs or gate-zero-evidence.md.
- No mocks of kqueue/socket in tests that claim live behavior — unit-test
  pure helpers; live acceptance is the verify AGNT's job.

## Report back with

DONE finding must list every file touched, build/test exits, CLI grammar
final, short smoke commands + exits, deviations with reasons.
