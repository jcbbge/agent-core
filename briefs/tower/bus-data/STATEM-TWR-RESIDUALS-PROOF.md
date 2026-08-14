# STATEM-TWR-RESIDUALS-PROOF — flocked statem append + twr integrity surface (T1+T2)

Agent: AGNT statem-twr-residuals (coder)  
Worktree: `/Users/jrg/.cursor/worktrees/agent-core/wt-agnt-coder-w2z-pp`  
Date: 2026-08-13

---

## 1. T1 — flocked statem writes

### Change

`primitives/tools/statem/statem.ts` — `appendBoard()` now calls flocked `append(BOARD, row)` from `~/.tower/lib.mjs` instead of bare `appendFileSync(BOARD, JSON.stringify(row) + "\n")`.

- Removed `appendFileSync` import (kept `writeFileSync` for baseline).
- Row shape unchanged: `type:finding`, `from:statem@<project>`, `topic:statem`.
- `--board` override honored: resolved CLI path passed to `append()`.

### Verification

```bash
grep -n 'appendFileSync' primitives/tools/statem/statem.ts
# (no matches)
```

### Smoke — temp board + transition via flocked path

```bash
SMOKE=$(mktemp -d)
mkdir -p "$SMOKE/.madewell/cycles"
cat > "$SMOKE/.madewell/madewell.json" <<'EOF'
{"stage":"discovery","active":[{"cycle":".madewell/cycles/c001.json"}]}
EOF
cat > "$SMOKE/.madewell/cycles/c001.json" <<'EOF'
{"id":"c001","phase":"imagine","imagine":[{"id":"d001","status":"active"}]}
EOF
BOARD="$SMOKE/board.jsonl"
BASELINE="$SMOKE/baseline.json"
echo '{"outer":"build","cycles":{"c001":{"phase":"imagine","items":{"d001":"active"}}}}' > "$BASELINE"
bun primitives/tools/statem/statem.ts "$SMOKE" --once --board "$BOARD" --baseline "$BASELINE" --no-tabs
cat "$BOARD"
bun -e "
import { readJsonlStats } from '/Users/jrg/.tower/lib.mjs'
const s = readJsonlStats(process.argv[1])
console.log('lines:', s.rows.length, 'bad_line_count:', s.bad_line_count)
" "$BOARD"
rm -rf "$SMOKE"
```

Output (2026-08-13 session):

```
2026-08-14T00:13:20.567Z tmp.JDe4tDuhxf OUTER build→discovery
statem: state — {"outer":"discovery","cycles":{"c001":{"phase":"imagine","items":{"d001":"active"}}}}
{"id":"statem-mss71lpy-fv3j","ts":"2026-08-14T00:13:20.566Z","cwd":"/private/var/folders/.../tmp.JDe4tDuhxf","type":"finding","from":"statem@tmp.JDe4tDuhxf","topic":"statem","body":"tmp.JDe4tDuhxf OUTER build→discovery"}
lines: 1 bad_line_count: 0
```

One parseable finding row written via flocked `append()`.

---

## 2. T2 — twr integrity surface

### Change

`primitives/tools/statem/twr.ts`:

- Import `readJsonlStats` from `~/.tower/lib.mjs`.
- Footer line reports `bad_line_count` and max bad line number (matches `cli.mjs board`/`status` pattern).
- Added `--once` flag for single-tick proof runs.

Scoped project rows unchanged; integrity stats cover the active `--board` path (default live board).

### Live board baseline

```bash
bun -e "
import { readJsonlStats, BOARD } from '/Users/jrg/.tower/lib.mjs'
const s = readJsonlStats(BOARD)
console.log(JSON.stringify({ bad_line_count: s.bad_line_count, max_bad: s.bad_line_numbers.length ? Math.max(...s.bad_line_numbers) : 0 }))
"
```

Output:

```
{"bad_line_count":26,"max_bad":2577}
```

### twr --once proof

```bash
bun primitives/tools/statem/twr.ts /Users/jrg/agent-core --once 2>&1 | tail -5
```

Output (footer line, ANSI stripped):

```
integrity: 26 unparseable line(s) on board (max bad line 2577)
```

Count matches `readJsonlStats` on live `~/.tower/board.jsonl`. No throw on bad lines.

---

## 3. Files touched

| Path | Change |
|---|---|
| `primitives/tools/statem/statem.ts` | flocked `append()` for board writes |
| `primitives/tools/statem/twr.ts` | `readJsonlStats` footer + `--once` |

Tests: not authored by implementer (test-maker partition).
