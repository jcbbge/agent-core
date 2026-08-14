---
name: latch
description: Blocking wait/hold primitive for herdr panes, filesystem paths, Tower board topics, and fleet gates. Use instead of polling loops or sleep-retry cycles whenever waiting on another agent, a file, a board topic, or a human gate. Distinct truth-legal exit codes per outcome.
---

# latch — blocking wait primitive

Binary: `~/.local/bin/latch` (source `~/agent-core/primitives/tools/latch/`, Zig, stdlib only, sub-10ms start).

## Verbs

```bash
latch wait --pane <pane-id> [--until <status>]... [--timeout <dur>]
latch wait --file <path> [--timeout <dur>]
latch wait --board <topic> [--timeout <dur>]
latch hold <gate> [--timeout <dur>]
```

## When to use

- Waiting for a fleet pane to go `idle`/`done` — `latch wait --pane w29:p2`, never a sleep loop.
- Waiting for a `.done` marker or any file to appear/change — `latch wait --file`.
- Waiting for a Tower board topic to receive a new row — `latch wait --board <project>/<topic>` (byte-offset correct: only scans appends).
- Waiting on a human/peer gate — `latch hold <gate>` blocks until `~/.fleet/gates/<gate>` is stamped.

## Semantics

- `wait --pane`: default success = status `idle` or `done`; repeat `--until` for any-of. Socket: `$HERDR_SOCKET_PATH` or `~/.config/herdr/herdr.sock`.
- `wait --file`: exits 0 immediately if the path already exists; exit 4 if it vanishes after being observed.
- Exit codes are distinct per outcome (success / timeout / vanished / usage) — never collapsed; branch on them.
