# Test criteria — flock-integrity (T2 flock append + T3 tolerate-and-count)

Authored by test-maker from plan/brief only (`agnt-test-maker-w2z-pg.md` TASK +
Pre-Verified Facts). Each assert maps to an acceptance criterion. Tests live in
`flock-integrity.test.mjs`; the tester runs them — test-maker does not.

## readJsonlStats tolerate-and-count — clean file (AC: a)

| Assert name | Criterion |
|-------------|-----------|
| `empty file → bad_line_count=0, rows=[]` | Temp empty JSONL → `readJsonlStats` returns `{ rows: [], bad_line_count: 0 }`; `readAllFull` returns `[]` |
| `valid lines only → bad_line_count=0, rows length matches` | Temp file with only parseable rows → `readJsonlStats.bad_line_count === 0`; `rows.length` equals good line count; `readAllFull` length matches |

## readJsonlStats tolerate-and-count — damaged lines (AC: b)

| Assert name | Criterion |
|-------------|-----------|
| `N bad lines → bad_line_count=N, rows exclude them` | Fixture with N unparseable lines interleaved with good rows → `readJsonlStats.bad_line_count === N`; returned `rows` contain only good objects; optional `bad_line_numbers` lists 1-based damaged line indices when surfaced |
| `all-bad file → bad_line_count=line count, rows=[]` | Every physical line unparseable → full count; `rows` empty |

## Reader tolerance — machine rows without from (AC: c)

| Assert name | Criterion |
|-------------|-----------|
| `renderMessage tolerates kind+via row without from (lib)` | Fixture `{ kind, via, topic, body, ts, cwd, id }` with no `from` → lib `renderMessage` does not throw; output shows `from ?` or `from unknown` |
| `renderMessage tolerates kind+via row without from (tower-ledger)` | Same fixture → tower-ledger `renderMessage` does not throw; output shows `from ?` or `from unknown` |
| `readAllFull rows missing from still render via renderMessage` | Machine row round-trip through `readAllFull` + `renderMessage` — no throw; `from ?? '?'` (or `unknown`) in output |

## Flock append — concurrent stress (AC: d)

| Assert name | Criterion |
|-------------|-----------|
| `parallel processes via append() → zero concatenated-object lines` | N real Bun worker processes each call exported `append()` M times on one temp JSONL → after join, zero lines matching concatenated-object pattern (`}{`); every line `JSON.parse`-succeeds; line count === N×M |
| `single-process rapid append() → each line is one parseable object` | Sequential rapid `append()` calls → newline-terminated file; zero concat/unparseable lines |

## Append serializer shape (T2 supporting)

| Assert name | Criterion |
|-------------|-----------|
| `append writes newline-terminated parseable JSON under lock` | `append(file, obj)` → `\n`-terminated; line parses; `readJsonlStats` reports `bad_line_count=0` |

## Out of scope for test-maker oracle (coder / human proof)

| Item | Owner |
|------|-------|
| Live `~/.tower/board.jsonl` bad_line_count ≈ 26 on CLI/MCP surface | Coder proof in `FLOCK-INTEGRITY-PROOF.md` |
| Residual unlocked writers bypassing `append()` | Coder documents in proof |
| Compaction / rewrite of live board | DEFERRED — not tested |

## Run command (tester, not test-maker)

```bash
bun test /Users/jrg/agent-core/primitives/mcps/tower/flock-integrity.test.mjs
```

Or from the canonical tower directory:

```bash
cd ~/agent-core/primitives/mcps/tower && bun test flock-integrity.test.mjs
```
