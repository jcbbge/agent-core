# ORCH [bus-data-hardening] — flock + tolerant integrity counts (additive)

You own ONE unit: close the unlocked-append class and make every board consumer
tolerate-and-count damage. Made Well: Imagine → Plan → Make → Verify. Spawn via
`cursor-fleet` only. Do NOT use emojis. Never mutate live `board.jsonl` structure
(no delete/compact/rewrite of existing lines). Append-only only.

## Pre-Verified Facts (CORD verified 2026-08-13 this session)

- Concierge ruled compaction **NO** — `briefs/tower/bus-data/CONCIERGE-RULING-compaction.md`.
  Proposal status set to **DEFERRED** (not rejected). Do not execute compaction.
- Live board still has exactly **26** unparseable lines (same historical set ≤2577); recovery
  rows + quarantine already exist. Append-only recovery stands.
- `append` at `primitives/hooks/tower-ledger.mjs:76` =
  `appendFileSync(file, JSON.stringify(obj) + '\n')` — **no flock**.
- `cli.mjs` post path (~L166) also bare `appendFileSync(BOARD, …)` — same gap.
- `parseLines` in `tower-ledger.mjs` (~174–185) already skips bad lines via
  `JSON.parse` catch → `null` → filter — consumers are silently tolerant but
  **do not count or surface** damage. Concierge: a bus that hides damage is worse.
- Attribution of 46 authorless authored rows: already append-only done
  (`ATTRIBUTION-REPORT.md`, 23 attributed / 23 unattributed). Re-verify; do not
  fabricate authors; do not edit original rows.
- Schema ruling (CORD, already in `COMMS-ARCH.md` Board row schema): **two kinds** —
  authored (`type` + required `from`) vs machine (`kind` + `via`, no invented `from`).
  Name `verify-gate-bypass` explicitly if missing. Coordinate with **CORD tower**
  (w2Y) via board topic `tower/bus-data` + field WA `ph-msroszo6-cn3g` — do not
  unilaterally rewrite doctrine they own without a board finding they can co-sign.
- Repo: `/Users/jrg/agent-core`, branch start from `main`. Deploy: `~/.tower/*.mjs`
  symlinks into canonical. Live production — Arc/Tower fleets appending now.
- Prior flock WA claimed by CORD: `ph-msro2bbg-xpzs`. Integrity WA open:
  `ph-msrosz2u-zaf2`. Heartbeat claims (30s TTL).

## Parallel Work Notice

- `CORD tower` on w2Y owns retention/planes/doctrine — stay off their code partitions;
  schema co-sign is coordination only.
- Ignore unrelated dirty/untracked briefs. Touch only your partition.
- Compaction is DEFERRED — out of scope entirely.

## Tower / stigmergy

- Board topic `tower/bus-data`, from=`ORCH bus-data-hardening` (or worker names).
- Field: claim open work with `ref`, heartbeat, `work-done` with `ref` + evidence.
  MCP `pheromone_emit` / `pheromone_field` or `bun ~/.tower/cli.mjs emit|field`.
- No hand-append to board.jsonl.

## Tasks

### T1 — DEFERRED stamp (verify only)
- done when: `COMPACTION-PROPOSAL.md` header says DEFERRED / operator maintenance window;
  board note confirms; backup+INVENTORY+quarantine+recovery untouched.

### T2 — flock the append path (root-cause)
- done when: `append()` in `tower-ledger.mjs` serializes writers with a real flock (or
  equivalent exclusive lock) around the stringify+append; `cli.mjs` post uses the same
  `append()` helper (no second unlocked path). Concurrent append stress test (or
  equivalent proof) shows no concatenated-object lines under parallel writers.
  Document residual limits. Branch + `cursor-fleet make` for code change.
  Prefer non-downtime: lock per write, not a maintenance window.

### T3 — tolerate AND COUNT (visible integrity)
- done when: board JSONL readers expose skip+count: at minimum `readAllFull` /
  parse path returns or records `{ rows, bad_line_count, bad_line_numbers? }`,
  and at least one user-visible surface shows the number (`cli.mjs board` /
  `board_read` / `twr` — pick the sanctioned ones and prove). Live board must
  report **26** (or current) bad lines, not hide them. Tests cover: clean file,
  file with N bad lines, machine rows without `from` still render.

### T4 — attribution re-verify
- done when: confirm 46/46 still have append-only attribution or explicit
  unattributed markers on the board; report path `ATTRIBUTION-REPORT.md` still
  accurate. Append corrections only if gaps found — never edit originals.

### T5 — schema coordination
- done when: board finding to `CORD tower` stating multi-kind ruling + ask to
  co-sign/extend COMMS-ARCH (`verify-gate-bypass` named); field WA
  `ph-msroszo6-cn3g` claimed or answered; readers proven against both families.
  Do not invent synthetic `from` on machine rows.

## Constraints

- Touch ONLY: `briefs/tower/bus-data/**` (reports/done), `primitives/hooks/tower-ledger.mjs`,
  `primitives/mcps/tower/**` (cli/server/COMMS-ARCH/tests as needed),
  `primitives/tools/statem/twr.ts` if integrity surfaces there.
- No compaction. No live-log line deletion. Workers never commit; you integrate after Verify; CORD Lands.
- Testing: real files / real parallel appends; no mocks of flock away.

## Report back with

- flock proof (commands + that concat class cannot recur under N writers)
- integrity number proof on live board (command + output showing count ≈26)
- attribution re-verify summary
- schema coord status with CORD tower
- `.done` at `briefs/tower/bus-data/orch-bus-data-hardening.done`
- pheromone work-done refs for claimed ids

SOURCES: CONCIERGE-RULING-compaction.md; tower-ledger.mjs:76,174-191; cli.mjs:166;
COMMS-ARCH Board row schema; ATTRIBUTION-REPORT.md; field ids above.
