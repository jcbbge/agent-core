# ORCH [bus-data-residuals] — close unlocked writers + integrity surfaces

You own ONE unit: finish residual write-path / consumer gaps left after flock Land
and W2 consumer-resilience. Imagine → Plan → Make → Verify. `cursor-fleet` only.
Do NOT use emojis. No compaction. No live `board.jsonl` rewrite.

## Pre-Verified Facts (CORD verified 2026-08-13 this session)

- Core bus-data Land done: flock `LOCK_EX` in `tower-ledger.mjs` `append()`; cli board
  footer live `integrity: 26 unparseable line(s) on board (max bad line 2577)`.
- Compaction **DEFERRED** (concierge NO). Attribution 46/46 append-only done.
- `primitives/tools/statem/statem.ts:97` still `appendFileSync(BOARD, JSON.stringify(row)+"\n")`
  — CONSUMER-MATRIX **GAP-write-only**; bypasses flocked `append()`.
- `primitives/tools/statem/twr.ts` inherits tolerate via `boardFor`/`readAll` but
  **GAP-count-only** — does not surface `bad_line_count`.
- `COMMS-ARCH.md` L182–183 and L196–197 still claim **no kernel/file lock on append**
  — STALE vs live `LOCK_EX` in `tower-ledger.mjs`. Machine-kind example still says
  `bypass-audit`; live cursor-shim emits `verify-gate-bypass`.
- W2 landed integrity doctrine at COMMS-ARCH §JSONL consumer integrity +
  `jsonl-integrity.test.mjs` — do not regress; extend.
- Field claims (CORD holds, heartbeat or re-claim): `ph-mss6xmo5-71z2` (statem),
  `ph-mss6xnca-p9ex` (twr). Doctrine WA `ph-mss6xnwh-wkn4` routed CORD tower —
  you may fix the factual flock lie + name `verify-gate-bypass`; post finding
  `to: CORD tower` for co-sign.
- Repo `/Users/jrg/agent-core` on `main`. Prefer branch `tower/bus-data-residuals`.
  `cursor-fleet make` for code units.

## Parallel Work Notice

- CORD tower (w2Y) owns retention/planes; spine twin WA `ph-mss6xokt-8xif` is theirs.
- cursor-shim printf WA `ph-mss6xokq-2ui4` is out of this fence.
- Ignore unrelated dirty tree (`models.json`, wave-rollup, etc.).

## Tower / stigmergy

- Topic `tower/bus-data`, from=`ORCH bus-data-residuals` / worker names.
- Claim/heartbeat/work-done with `ref` + evidence. No hand-append.

## Tasks

### T1 — migrate statem board writes to flocked `append()`
- done when: `statem.ts` imports and uses `append` from tower lib/ledger (no bare
  `appendFileSync` to BOARD); proof in report; tests or live transition smoke.

### T2 — twr surfaces integrity count
- done when: `twr.ts` prints or returns `bad_line_count` (via `readJsonlStats` or
  equivalent) without throwing on bad lines; proven against live board (~26).

### T3 — COMMS-ARCH factual sync
- done when: remove/correct "no file lock on append" language to match flocked
  `append()`; machine-emission examples name `verify-gate-bypass`; board finding
  `to: CORD tower` for co-sign. Do not weaken JSONL consumer integrity section.

### T4 — residual scan
- done when: short note listing any remaining bare `appendFileSync`→BOARD writers
  under `primitives/` (excluding attic/tests); emit WA for each out-of-fence item.

## Constraints

- Touch ONLY: `primitives/tools/statem/statem.ts`, `primitives/tools/statem/twr.ts`,
  `primitives/mcps/tower/COMMS-ARCH.md`, `briefs/tower/bus-data/**` (proofs/done),
  tests under those partitions if needed.
- Workers never commit; you integrate after Verify; CORD Lands.

## Report back with

- diff summary + proof commands/outputs (statem path, twr integrity, COMMS-ARCH)
- field work-done refs
- `.done` at `briefs/tower/bus-data/orch-bus-data-residuals.done`

SOURCES: CONSUMER-MATRIX.md; FLOCK-INTEGRITY-PROOF.md; COMMS-ARCH.md L182-197;
statem.ts:97; live cli board integrity 26; field ids above.
