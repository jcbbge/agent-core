# FLOCK-INTEGRITY-PROOF — Tower append lock + JSONL integrity stats (T2+T3)

Agent: AGNT flock-integrity (coder)  
Worktree: `/Users/jrg/.cursor/worktrees/agent-core/wt-agnt-coder-w2z-pf`  
Date: 2026-08-13

---

## 1. T2 — Flock append

### Mechanism

`primitives/hooks/tower-ledger.mjs` — `append()` now:

1. `openSync(file, 'a')` on the target JSONL
2. `flock(fd, LOCK_EX)` via Bun `bun:ffi` → `libc.dylib` on macOS (`libc.so.6` on Linux)
3. `writeSync(fd, JSON.stringify(obj) + '\n')` (stringify under lock)
4. `flock(fd, LOCK_UN)` then `closeSync(fd)`

Fallback if FFI unavailable: per-file lockfile `${file}.append.lock` (wx + spin), same critical section.

### Patches

| Path | Change |
|---|---|
| `primitives/hooks/tower-ledger.mjs` | Flocked `append()`; `parseJsonl` / `readJsonlStats` exports |
| `primitives/mcps/tower/cli.mjs` | `post` routes through `append(BOARD, row)`; `board` footer shows integrity stats |

`server.mjs` `board_post` already used `append(BOARD, …)` — inherits flock on deploy.

### Residual limits (unlocked board/ledger writers)

| Writer | Path | Notes |
|---|---|---|
| statem transition posts | `primitives/tools/statem/statem.ts:97` | Bare `appendFileSync(BOARD, …)` — out of this unit's partition; should migrate to `append()` |
| Test seed helpers | `server-drift.test.mjs` | Test-only direct ledger seed |
| Attic backup | `attic/cli.mjs.bak-*` | Not deployed |

All production MCP + CLI board/ledger paths in the Tower MCP tree now go through flocked `append()`.

---

## 2. Concurrent stress proof

Command (worktree, temp file, real parallel processes):

```bash
cd /Users/jrg/.cursor/worktrees/agent-core/wt-agnt-coder-w2z-pf
STRESS_DIR=$(mktemp -d)
export STRESS_FILE="$STRESS_DIR/stress.jsonl"
export N=32 DURATION=3
for i in $(seq 1 $N); do
  WRITER_ID=$i bun -e "
import { append } from './primitives/hooks/tower-ledger.mjs'
const file = process.env.STRESS_FILE
const n = Number(process.env.WRITER_ID)
const end = Date.now() + Number(process.env.DURATION) * 1000
while (Date.now() < end) {
  append(file, { id: 'w'+n+'-'+Date.now(), ts: new Date().toISOString(), n, v: Math.random() })
}
" &
done
wait
bun -e "
import { readFileSync } from 'node:fs'
const raw = readFileSync(process.env.STRESS_FILE, 'utf8')
const lines = raw.split('\n').filter(Boolean)
let concat = 0, parseOk = 0, parseBad = 0
for (const line of lines) {
  try { JSON.parse(line); parseOk++ } catch { parseBad++; if (/\\}\\{/.test(line)) concat++ }
}
console.log('lines:', lines.length, 'parse_ok:', parseOk, 'parse_bad:', parseBad, 'concat_count:', concat)
"
rm -rf "$STRESS_DIR"
```

Output (2026-08-13 session):

```
N=32 duration=3s flock=libc.flock
lines: 206502 parse_ok: 206502 parse_bad: 0 concat_count: 0
```

---

## 3. T3 — Tolerate and count

### API

- `parseJsonl(text)` → `{ rows, bad_line_count, bad_line_numbers }`
- `readJsonlStats(file)` → same shape; `rows` excludes unparseable lines
- `readAllFull(file)` → `readJsonlStats(file).rows` (backward compatible)

### User-visible surface

`bun primitives/mcps/tower/cli.mjs board` (from any repo cwd) — footer after scoped rows:

```
integrity: 26 unparseable line(s) on board (max bad line 2577)
```

Machine rows without `from` still render with `from ?? '?'` in the board listing.

### Live proof

```bash
cd /Users/jrg/.cursor/worktrees/agent-core/wt-agnt-coder-w2z-pf
bun primitives/mcps/tower/cli.mjs board | tail -1
bun -e "
import { readJsonlStats, BOARD } from './primitives/mcps/tower/lib.mjs'
const s = readJsonlStats(BOARD)
console.log(JSON.stringify({ bad_line_count: s.bad_line_count, max: Math.max(...s.bad_line_numbers) }))
"
```

Output (2026-08-13 session):

```
integrity: 26 unparseable line(s) on board (max bad line 2577)
{"bad_line_count":26,"max":2577}
```

Original 26 damaged lines remain on live `~/.tower/board.jsonl` (append-only; no compaction).

---

## 4. Deploy note

Canonical source patches land via `~/.tower/lib.mjs` symlink to `primitives/hooks/tower-ledger.mjs` and `~/.tower/cli.mjs` symlink after merge/sync. Until merge, proof commands use worktree paths above.
