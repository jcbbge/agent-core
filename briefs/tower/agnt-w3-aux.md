# AGNT [aux-spine] — Prove deliverables/flight/odometer/pheromones + spine bridge

Read `/Users/jrg/agent-core/briefs/tower/w3-prove-planes-evidence/SHARED-PREFIX.md` first — it is the shared prefix. Everything below is your partition.

## Pre-Verified Facts (lead verified all of these personally)

See SHARED-PREFIX. Live presence pre-checked:
- `~/.tower/deliverables/` has files (e.g. `t-mq9xssuc-…`).
- `~/.tower/flight/` has SessionEnd/PreCompact snapshots.
- `~/.tower/odometer.jsonl` exists (~287KB, mtime observed).
- `~/.tower/pheromones.jsonl` exists.
- `10-notify` docstring: blocked→toast+board alert; done workers→board no toast; non-workers→toast+board; title beacon.
- `40-tower-bridge` docstring: agent_status_changed → ledger (blocked→question, working/idle drains, done+$verdict→deliverable). Ownership: board=`10-notify`, ledger=`40-tower-bridge`.

CLI: `emit` / `field` / `burn` / `scan` map to pheromone + odometer planes.

## Parallel Work Notice

See SHARED-PREFIX. Partition map:
- YOU write: `AUX.md`, `SPINE.md`, `raw/aux/**`, `workers/aux.done`
- Do not write BOARD/LEDGER/VERBATIM/SURFACE.

## Tower

- CLAIM on `tower/w3-prove-planes` from=`AGNT w3-aux`.
- Pheromone topic for probes: `tower/w3-probe-phero`.
- Doorbell: default avoid; document rubric + what was / was not safe to fire.

## Tasks

1. Deliverables — done when: `AUX.md` shows live write path (via `send_to_user` deliverable file creation and/or existing dir append mechanism) + read-back of a file path; include exit codes.
2. Flight — done when: document flight snapshot presence OR hook path that writes `~/.tower/flight/` (cite hook file under `primitives/mcps/tower/hooks/` or `~/.tower/`), with at least one recent file listed.
3. Odometer — done when: `bun ~/.tower/cli.mjs burn` and/or `scan` exercised; paste output + show a new or recent `odometer.jsonl` line evidence.
4. Pheromones — done when: `pheromone_emit` (MCP or CLI `emit`) + `pheromone_field` / CLI `field` round-trip on topic `tower/w3-probe-phero`; paste ids.
5. Spine bridge — done when: `SPINE.md` maps `10-notify` and `40-tower-bridge` (events → board/ledger rows) with at least one live or recent-row proof each (grep board/ledger for handler signatures / via fields / known shapes). Doorbell rubric stated; gaps named if doorbell not fired.
6. Do not patch handlers.

## Constraints

- Touch ONLY: `.../AUX.md`, `SPINE.md`, `raw/aux/**`, `workers/aux.done`.
- Absolute paths. No production edits. No commits. Do not delete flight/deliverables.

## Report back with

- Per subsystem: PROVEN / UNBROKEN / GAP.
- Commands + evidence paths.
- `workers/aux.done` after AUX.md + SPINE.md complete.
