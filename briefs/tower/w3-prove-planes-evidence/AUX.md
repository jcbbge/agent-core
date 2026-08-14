# AUX — deliverables · flight · odometer · pheromones

Agent: AGNT w3-aux  
Evidence root: `/Users/jrg/agent-core/briefs/tower/w3-prove-planes-evidence/`  
Board CLAIM: `t-msrkt94i-xlfk` on `tower/w3-prove-planes`  
Probe topic: `tower/w3-probe-phero`  
Session: 2026-08-13

---

## Summary

| Subsystem    | Verdict   | Notes |
|-------------|-----------|-------|
| Deliverables | PROVEN   | MCP `send_to_user` → ledger + file; read-back OK |
| Flight       | PROVEN   | Recent snapshots present; hook path documented |
| Odometer     | UNBROKEN | `burn` EXIT 0; no new append this window |
| Pheromones   | PROVEN   | MCP + CLI emit/field round-trip; three ids |

Raw transcripts: `raw/aux/*.txt`

---

## 1. Deliverables — PROVEN

**Write path:** MCP `send_to_user` with `kind:"deliverable"` (Tower server handler).

Source: `/Users/jrg/agent-core/primitives/mcps/tower/server.mjs` — appends ledger row, then `writeFileSync` to `~/.tower/deliverables/${id}-${slug}.md`.

**Exercise:**

```
MCP send_to_user(kind=deliverable, title=w3-aux-deliverable-probe, from=AGNT w3-aux)
→ t-msrktbyd-yezv
→ /Users/jrg/.tower/deliverables/t-msrktbyd-yezv-w3-aux-deliverable-probe.md
```

**Read-back:** file exists; content matches message verbatim. EXIT 0.

**Ledger corroboration:** `/Users/jrg/.tower/ledger.jsonl:2681`

**Pre-existing dir:** `~/.tower/deliverables/` holds 450+ historical files (e.g. `t-mq9xssuc-y5kg-optimistic-writes-design-through-the-dat.md`). Append mechanism live before this probe.

Transcript: `raw/aux/deliverable-probe.txt`

---

## 2. Flight — PROVEN

**Write path:** `flight-recorder.mjs` hook (PreCompact + SessionEnd).

- Canonical: `/Users/jrg/agent-core/primitives/hooks/flight-recorder.mjs`
- MCP shim: `/Users/jrg/agent-core/primitives/mcps/tower/hooks/flight-recorder.mjs`
- Target: `~/.tower/flight/<date>-<event>-<session8>.md`
- Contract: always `exit 0`; never block the flight.

**Presence (recent):**

| File | mtime |
|------|-------|
| `/Users/jrg/.tower/flight/2026-08-13-cursor-sessionEnd-d9325e36.md` | Aug 13 08:04 |
| `/Users/jrg/.tower/flight/2026-08-13-sessionEnd-d9325e36.md` | Aug 13 08:04 |
| `/Users/jrg/.tower/flight/2026-08-13-SessionEnd-45ffad6f.md` | Aug 13 07:31 |

Sample snapshot includes git status, diff stat, last commits, Tower pending counts. No new snapshot written during this probe (read-only proof).

Transcript: `raw/aux/flight-probe.txt`

---

## 3. Odometer — UNBROKEN

**Plane:** `~/.tower/odometer.jsonl` (287596 bytes, mtime Aug 13 00:28 — pre-checked fact confirmed).

**Commands:**

```bash
bun ~/.tower/cli.mjs burn   # EXIT 0 — daily + per-spawn rollup
bun ~/.tower/cli.mjs scan   # EXIT 0 — "No pheromone rows for this scope" (pheromone-scoped in this cwd)
```

**Recent line evidence** (tail, not appended this session):

```json
{"ts":"2026-08-13T05:28:11.452Z","session":"45ffad6f-...","cwd":"/Users/jrg/.tower","tool":"SubagentStop","phase":"stop","tokens":22395,...}
```

**GAP:** This probe exercised read/aggregate (`burn`) only. No fresh SubagentStop/Agent row landed during the probe window — append path not re-fired live. Plane file intact and readable.

Transcript: `raw/aux/odometer-probe.txt`

---

## 4. Pheromones — PROVEN

**Plane:** `~/.tower/pheromones.jsonl`  
**Probe topic:** `tower/w3-probe-phero`

| Step | Tool | Id | Scent |
|------|------|-----|-------|
| 1 | MCP `pheromone_emit` | `ph-msrktby6-if3n` | work-available |
| 2 | CLI `emit work-claimed` | `ph-msrktc4o-lwwz` | work-claimed |
| 3 | CLI `emit work-done` | `ph-msrkteq6-7ymi` | work-done |

**Field read-back:**

- MCP `pheromone_field` → open bucket contains `ph-msrktby6-if3n`
- CLI `bun ~/.tower/cli.mjs field tower/w3-probe-phero` → EXIT 0, lists open scents

All emits EXIT 0. Rows visible in `pheromones.jsonl` tail.

Transcript: `raw/aux/phero-probe.txt`

---

## Doorbell (default avoid)

**Not exercised.** Per brief: default avoid; document rubric.

**Rubric (from 10-notify docstring + COMMS-ARCH):**

- Toast = SUMMONS (T1): blocked panes → toast + board alert; worker done → board only, no toast; non-worker done → toast + board.
- Contextual title/body (T2); 60s pace per (pane, kind) (T3); board line always written even if toast dropped (T4).

**Safe to skip here:** this AGNT partition is evidence capture only — no operator summons, no pane status flip, no `herdr notification show`. Firing a doorbell would violate "default avoid" and add noise.

**Gap recorded:** doorbell not exercised — gap.

---

## Board

CLAIM posted: `t-msrkt94i-xlfk` (type claim, from AGNT w3-aux, topic tower/w3-prove-planes).

Spine bridge mapping: see `SPINE.md`.
