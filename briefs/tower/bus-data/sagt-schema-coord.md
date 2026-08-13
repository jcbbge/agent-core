# SAGT [schema-coord] — multi-kind co-sign ask to CORD tower (T5)

Repo `/Users/jrg/agent-core`. Coordinate schema ruling with CORD tower — do not unilaterally rewrite doctrine. Do NOT use emojis anywhere.

## Pre-Verified Facts (ORCH verified 2026-08-13 this session)

- `primitives/mcps/tower/COMMS-ARCH.md` §Board row schema (2026-08-13) already states two families: authored (`type` + required `from`) vs machine (`kind` + `via`, no invented `from`). Examples name `lineage`, `bypass-audit` — **`verify-gate-bypass` is not named explicitly**.
- cursor-shim docs (`~/cursor-shim/docs/inner-loop-verify.md`) audit a `verify-gate-bypass` machine emission — that kind must be named in doctrine if co-signed.
- Open field WA: `ph-msroszo6-cn3g` on topic `tower/bus-data`, route hint `to_role: CORD tower`, payload `COMMS-ARCH.md`, evidence `CONCIERGE-RULING-compaction.md`.
- CORD tower sits on workspace w2Y. You post findings; they edit/co-sign COMMS-ARCH.
- Readers already tolerate missing `from` (`from ?? '?'`) on board_read / boardFor / twr — cite existing WRITE-PATH-PROOF.md §3; do not re-patch readers unless a gap is proven.

## Parallel Work Notice

- AGNT flock-integrity owns `tower-ledger.mjs` / cli append+count — stay off those files.
- Do not edit `COMMS-ARCH.md` yourself.
- Compaction DEFERRED — out of scope.

## Tower

- Topic `tower/bus-data`, from=`SAGT schema-coord`.
- Claim field WA `ph-msroszo6-cn3g` (`work-claimed` with `ref`), heartbeat while working, `work-done` with `ref` + evidence when finding posted.
- Never hand-append board.jsonl — use MCP board_post or `bun ~/.tower/cli.mjs post`.

## Tasks

1. Claim `ph-msroszo6-cn3g`. — done when: field shows your claim.
2. Post a **finding** on `tower/bus-data` addressed to `CORD tower` stating: (a) multi-kind ruling already in COMMS-ARCH; (b) ask them to co-sign/extend the machine-emission examples to name `verify-gate-bypass` explicitly; (c) readers must keep tolerating both families without inventing `from` on machine rows. — done when: board finding id recorded.
3. Prove readers against both families with a short command (temp or documented) showing authored+machine render; paste into `briefs/tower/bus-data/SCHEMA-COORD-REPORT.md`. — done when: report file exists.
4. Write `briefs/tower/bus-data/sagt-schema-coord.done`.

## Constraints

- Touch ONLY: `briefs/tower/bus-data/SCHEMA-COORD-REPORT.md`, `briefs/tower/bus-data/sagt-schema-coord.done`. Board/field posts allowed. Do not commit. Do not edit COMMS-ARCH.

## Report back with

- pheromone claim/done ids
- board finding id + body summary
- SCHEMA-COORD-REPORT.md path
- whether CORD tower answered (yes/no/UNKNOWN — do not wait forever; post and close)
