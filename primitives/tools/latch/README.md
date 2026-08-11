# latch

Blocking wait/hold primitive for herdr panes, filesystem paths, Tower board topics, and fleet gates.

Single Zig binary (stdlib only). Sub-10 ms start; truth-legal exit codes.

## Verbs

```
latch wait --pane <pane-id> [--until <status>] [--timeout <dur>]
latch wait --file <path> [--timeout <dur>]
latch wait --board <topic> [--timeout <dur>]
latch hold <gate> [--timeout <dur>]
latch --help
```

Exactly one of `--pane`, `--file`, or `--board` is required for `wait`.

## Behavior

### `wait --pane`

Blocks on herdr socket NDJSON events until the pane's `agent_status` matches.

- Default success: status is `idle` or `done`.
- `--until <status>`: match one explicit status.
- Socket: `$HERDR_SOCKET_PATH` or `~/.config/herdr/herdr.sock`.

### `wait --file`

Blocks via kqueue `EVFILT_VNODE` until the path exists or changes.

- If the path already exists at start, exits 0 immediately.
- If the path appears while waiting (e.g. another shell `touch`es it), exits 0.
- If the path is deleted after being observed, exits 4 (vanished).

### `wait --board`

Blocks on `$TOWER_HOME/board.jsonl` (or `~/.tower/board.jsonl`) until a **new** row with the given `topic` is appended.

- Saves a byte offset at subscribe time; only scans appended lines (append-only correctness).
- Exits 0 when a matching topic lands.

### `hold <gate>`

Blocks until a human/peer stamps `~/.fleet/gates/<gate>` (file created or touched).

- Creates `~/.fleet/gates/` on demand.
- Gate names must not contain path separators or `..`.
- If the gate file already exists at start, exits 0 immediately.

## Exit codes

| Code | Meaning |
|------|---------|
| 0 | Event matched |
| 2 | Usage / resolution error |
| 3 | Timeout (`--timeout` elapsed) |
| 4 | Target vanished (pane closed, watched file deleted) |

Default timeout: `30m`. Forms: `30s`, `10m`, `1h`.

Timeout ≠ success. Target death ≠ success.

## Examples

```bash
# Wait for a worker pane to finish
latch wait --pane w1Q:p5 --timeout 30m

# Wait for a deploy stamp file
latch wait --file /tmp/migration-live --timeout 10m

# Wait for a Tower finding on a topic
latch wait --board agent-core/latch-vein --timeout 5m

# Hold until operator stamps a gate
latch hold migration-live --timeout 1h
```

## Build

```bash
cd ~/agent-core/primitives/tools/latch
zig build
zig build test
```

Binary: `zig-out/bin/latch`. Install to `~/.local/bin` is out of scope for this tree.

## Non-goals

- No install/sync via agent-core registry in this phase.
- No mock kqueue/socket tests claiming live behavior (unit tests cover pure helpers only).
- Linux FSEvents path not implemented (macOS arm64 target only in `build.zig`).

## Module layout

| File | Role |
|------|------|
| `src/main.zig` | CLI dispatch |
| `src/argv.zig` | Arg parsing, mutual exclusion |
| `src/wait.zig` | `--pane` (herdr socket) |
| `src/wait_file.zig` | `--file` (kqueue vnode) |
| `src/wait_board.zig` | `--board` (kqueue + tail scan) |
| `src/hold.zig` | `hold` (gate stamp) |
| `src/duration.zig` | Duration parsing |
| `src/kqueue_util.zig` | kqueue helpers |
