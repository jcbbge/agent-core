# Test criteria — statem-twr-residuals (T1 flocked statem + T2 twr integrity)

Authored by test-maker from plan/brief only (`agnt-test-maker-w2z-pr.md` TASK +
Pre-Verified Facts). Each assert maps to an acceptance criterion. Tests live in
`statem-twr-residuals.test.mjs`; the tester runs them — test-maker does not.

## statem board write — flocked append path (AC: a / T1)

| Assert name | Criterion |
|-------------|-----------|
| `transition append via --board temp → parseable finding row, zero bad lines` | Temp project + baseline mismatch triggers transition; `statem.ts --once --no-tabs --board <temp> --baseline <temp>` exits 0; new board bytes are newline-terminated; zero concat (`}{`) and zero unparseable lines; `readJsonlStats` reports `bad_line_count=0`; at least one new row has `type:finding`, `from` starts with `statem@`, `topic:statem` |
| `statem board lines are objects not double-stringified append payloads` | Every physical line `JSON.parse`s to an object (not a string wrapper); rows carry `type`, `from` matching `^statem@`, `topic:statem` — catches double-`JSON.stringify` misuse of flocked `append()` |
| `--board override honored — writes land on temp path not live board` | `--board <isolated temp>` receives rows; live `~/.tower/board.jsonl` byte length unchanged |

## twr integrity surface — bad_line_count (AC: b / T2)

| Assert name | Criterion |
|-------------|-----------|
| `fixture with N bad lines → twr --once reports exact bad_line_count` | Temp JSONL with N unparseable lines interleaved with good rows; `readJsonlStats(fixture).bad_line_count === N`; `twr.ts <project> --board fixture --once` exits 0 without throw; stdout/stderr integrity footer `integrity: N unparseable` surfaces count === N (oracle strips ANSI before parse — dim/color SGR codes false-match loose regex) |
| `all-good fixture → twr --once reports bad_line_count=0` | Parseable-only fixture → surfaced integrity count is 0 |
| `twr --once on damaged fixture does not throw` | Mixed good/bad fixture → `readJsonlStats` and `twr --once` both tolerate bad lines (no TypeError; exit 0) |

## twr render — good lines still parse and display (AC: c)

| Assert name | Criterion |
|-------------|-----------|
| `twr --once renders TRANSITIONS and FINDINGS for good rows amid bad lines` | Fixture with statem transition row + non-statem finding + bad line; `twr --once` output includes TRANSITIONS and FINDINGS sections and clipped-safe anchors from good rows (`/OUTER disc/`, `/oracle non-statem/`, oracle topic slug) — not full unclipped body text (twr clips to terminal width) |
| `readJsonlStats rows from fixture match twr-scoped good line count` | Two good + one bad → `readJsonlStats.rows.length === 2`, `bad_line_count === 1`; twr integrity surface agrees |

## Out of scope for test-maker oracle (coder / human proof)

| Item | Owner |
|------|-------|
| Live `~/.tower/board.jsonl` bad_line_count ≈ 26 on `twr.ts` against agent-core | Coder proof in `STATEM-TWR-RESIDUALS-PROOF.md` |
| Residual `appendFileSync` scan across repo (T4) | Sibling SAGT |
| COMMS-ARCH factual sync (T3) | Sibling AGNT |
| Source-level grep proving no `appendFileSync(` to BOARD in `statem.ts` | Coder proof |

## Run command (tester, not test-maker)

```bash
bun test /Users/jrg/.cursor/worktrees/agent-core/wt-agnt-test-maker-w2z-pr/primitives/tools/statem/statem-twr-residuals.test.mjs
```

Or from the statem tools directory:

```bash
cd ~/agent-core/primitives/tools/statem && bun test statem-twr-residuals.test.mjs
```

## Dependencies on implementer

- `statem.ts` must route board writes through flocked `append(BOARD, row)` (not bare `appendFileSync`).
- `twr.ts` must import `readJsonlStats` (or equivalent) and surface `bad_line_count` on header/footer; `--once` flag required for non-interactive oracle runs.
