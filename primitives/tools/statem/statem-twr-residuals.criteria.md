# Test criteria — statem-twr-residuals (rebuilt onto the Tower `msg` table)

The oracle test file is authored by the **test seat** (`agnt-statem-test`,
worktree `statem-test`, commit `431dc18` on `spine/statem-test`) as the other
half of a bifurcated test/impl pair — it describes the contract, not this
worktree's code, and this worktree's `statem.ts`/`twr.ts` are graded against
it verbatim. Do not edit the test file to make it pass; if an assert in it
looks wrong, post a finding to the orchestrator and wait. This document
records what that suite checks, for readers of this partition.

Contract (posted as tower msg id 44, topic `tower/cutover`, agreed by both
seats):

1. **Isolation** is `TOWER_HOME`/`TOWER_DB`, exactly as
   `primitives/tower/tower.mjs` reads them. The old `--board <path>` flag is
   retired.
2. **Scoping.** `PROJECT = basename(realpathSync(<project-root>))`. statem
   writes one `msg` row per transition: `sender = "statem@" + PROJECT`,
   `topic = PROJECT + "/statem"`, `kind = "finding"`, `body` = the transition
   string, unchanged. twr scopes by topic prefix `PROJECT + "/"`.
3. **twr writes nothing, ever** — no `msg` rows, no cursor advances.
4. **The integrity footer reports `PRAGMA integrity_check`**, not a JSONL
   bad-line count — a sqlite table has no unparseable lines. Literal prefix
   `integrity: ` is load-bearing; the oracle keys on it.

The oracle reads the scratch store directly with `bun:sqlite` (readonly) —
it never asks `statem.ts`/`twr.ts` what they wrote; every assertion is
against the store itself, and every test runs in its own temp
`TOWER_HOME`, never the live `~/.tower/tower.db`.

## `statem → msg table (T1)`

| Test | Criterion |
|------|-----------|
| `a transition writes one finding row with the contracted sender/topic/kind` | Schema created on demand (no pre-made DB required); at least one row with `kind:finding`, `sender:statem@<project>`, `topic:<project>/statem`, numeric `ts` |
| `the OUTER transition body survives the store swap verbatim` | The transition table (`statem.ts`'s `transitions()`) is untouched by the migration — row body equals the exact pre-migration string, e.g. `<project> OUTER discovery→commit` |
| `body is a plain string, not a JSON-stringified board row` | No row body is a JSON envelope (`{id,ts,cwd,type,...}`) — catches a regression back toward the old board-row shape |
| `cold start seeds the baseline and writes no transitions` | First run with no baseline file writes zero `msg` rows — cold start is silent, matching pre-migration behavior |
| `TOWER_HOME isolates the write — nothing lands on the live bus` | A transition run against a temp `TOWER_HOME` never appears in the live `~/.tower/tower.db` |

## `twr → msg table (T2)`

| Test | Criterion |
|------|-----------|
| `renders statem rows under TRANSITIONS and other rows under FINDINGS` | Seeded statem-shaped row → TRANSITIONS; seeded non-statem row, same topic prefix → FINDINGS |
| `scoping is the topic prefix — another project is not rendered` | A row seeded under a different project's topic prefix never appears in this project's `twr --once` output |
| `twr writes nothing — the row count is identical across a run` | `msg` row count before and after a `twr --once` invocation is identical |
| `the integrity footer reports SQLite integrity, not a JSONL bad-line count` | Footer line matches `/integrity:\s*ok/i` against a healthy store — not a `bad_line_count` figure |
| `an empty store renders without throwing` | Zero rows → `twr --once` exits cleanly, no throw |

## `statem ⇄ twr residual — the two agree on the convention`

| Test | Criterion |
|------|-----------|
| `a transition statem wrote is a transition twr renders` | End-to-end: run `statem.ts --once`, then `twr.ts --once` against the same `TOWER_HOME`/project — the transition appears under TRANSITIONS |
| `an inner-phase transition round-trips end to end` | Same, for an `INNER` (cycle-phase) transition rather than an `OUTER` one |

## Out of scope for this suite

| Item | Owner |
|------|-------|
| Live `~/.tower/tower.db` row counts / cross-tool integration proof | Coder proof in the orchestrator's cutover report, not this oracle |
| Residual `~/.tower/lib.mjs` / `board.jsonl` references elsewhere in the repo | Sibling AGNT/SAGT partitions (not `primitives/tools/statem/**`) |
