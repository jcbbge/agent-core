# latch

Blocking wait/hold primitive for herdr panes, filesystem paths, Tower topics, and fleet gates.

Single Zig binary (stdlib only). Sub-10 ms start; truth-legal exit codes.

## Verbs

```
latch wait --pane <pane-id> [--until <status>]... [--timeout <dur>]
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
- `--until <status>`: match one explicit status. Repeat for any-of semantics
  (e.g. `--until done --until blocked` exits 0 when either lands).
- Socket: `$HERDR_SOCKET_PATH` or `~/.config/herdr/herdr.sock`.

### `wait --board`

Blocks on the Tower store — the `msg` table of `$TOWER_DB`, else
`$TOWER_HOME/tower.db`, else `~/.tower/tower.db` — until a **new** message with
the given `topic` is committed.

- Captures a baseline `MAX(id)` at subscribe time and only matches `id >`
  baseline. A message that was already there does **not** satisfy the wait.
- Topic comparison is exact.
- Exits 0 when a matching message lands.
- A store that does not exist yet is not an error: the baseline is 0 and the
  wait catches the first message written to it.

The flag is still `--board` because that is what every caller and hook already
types; the JSONL board it was named for is gone.

**How it reads the store:** it shells out to the `sqlite3` CLI (spawned with an
argv, never a shell), one query per poll. Zig has no SQLite driver and latch
takes no dependencies. The topic is hex-encoded into `CAST(x'…' AS TEXT)`, so
there is no quote to escape and no injection surface. If `sqlite3` is not on
PATH, `wait --board` exits 2 rather than silently timing out.

**Wakeup:** kqueue `EVFILT_VNODE` watches on both `tower.db` and `tower.db-wal`
are best-effort latency optimisations only. The store runs in WAL mode, so a
commit can land without touching `tower.db` at all. Correctness comes from the
200 ms poll floor, which runs whether or not the watch ever fires.

### `wait --file`

Blocks via kqueue `EVFILT_VNODE` until the path exists or changes.

- If the path already exists at start, exits 0 immediately.
- If the path appears while waiting (e.g. another shell `touch`es it), exits 0.
- If the path is deleted after being observed, exits 4 (vanished).

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
latch wait --board tower/cutover --timeout 5m
# ...satisfied by, from any other shell:
#   tower send --from demo --topic tower/cutover --kind finding "hello latch"

# Hold until operator stamps a gate
latch hold migration-live --timeout 1h
```

## Build

```bash
cd ~/agent-core/primitives/tools/latch
zig build
zig build test
```

Binary: `zig-out/bin/latch`. Installed copy on PATH: `~/.local/bin/latch` —
after a rebuild, copy it over, or the hook-enforced binary stays stale.

## Non-goals

- No install/sync via agent-core registry in this phase.
- No mock kqueue/socket/store tests claiming live behavior (unit tests cover
  pure helpers only; `test/acceptance-matrix.sh` covers the live paths).
- Linux FSEvents path not implemented (macOS arm64 target only in `build.zig`).

## Module layout

| File | Role |
|------|------|
| `src/main.zig` | CLI dispatch |
| `src/argv.zig` | Arg parsing, mutual exclusion |
| `src/wait.zig` | `--pane` (herdr socket) |
| `src/wait_file.zig` | `--file` (kqueue vnode) |
| `src/wait_board.zig` | `--board` (Tower `msg` table + kqueue) |
| `src/hold.zig` | `hold` (gate stamp) |
| `src/duration.zig` | Duration parsing |
| `src/kqueue_util.zig` | kqueue helpers |
