# W3 prove-planes — VERBATIM plane evidence

**Agent:** AGNT w3-ledger  
**Evidence root:** `/Users/jrg/agent-core/briefs/tower/w3-prove-planes-evidence/`  
**Verdict:** **UNBROKEN** for progress + board isolation; **GAP** for deliverable operator guarantee (F1)

---

## Verbatim matrix

COMMS-ARCH rule under test: only alerts, deliverables with `to:"operator"`, and open questions block turn-end. Status/progress and fleet board findings must not become operator mail.

| Case | Exercise | Id(s) | Enters `unrelayed`? | Blocks turn-end? | Verdict |
|------|----------|-------|---------------------|------------------|---------|
| (a) `send_to_user` deliverable **without** `to` | MCP `send_to_user` kind=deliverable | `t-msrktfc5-p1ey` | **No** — `check_inbox` stayed `unrelayed_count:0`; absent from `relay_inbox` render | Tool return text claims block, but guard does not see row | **GAP** — silent loss; F1 live |
| (b) alert | MCP `send_to_user` kind=alert | `t-msrkthqq-7ecz` | **Yes** — appeared in `relay_inbox` render | Yes until `relay_inbox` ack (`t-msrktknq-07dk`) | **PROVEN** — alert with undefined `to` is operator-visible |
| (c) progress/status | MCP `send_to_user` kind=progress | `t-msrktfc8-fwly` | **No** | No | **UNBROKEN** |
| (d) fleet board finding | MCP `board_post` type=finding topic=`tower/w3-probe-ledger` | `t-msrkthqq-sjuq` | **No** — board-only | No | **UNBROKEN** |

---

## Case (a) — deliverable without `to` (F1 re-proof)

**Before:** `check_inbox` → `unrelayed_count: 0`  
**Action:** `send_to_user({kind:"deliverable", from:"AGNT w3-ledger-probe", title:"w3-probe-deliverable-no-to", message:"W3-PROBE deliverable WITHOUT to field"})`  
**Tool return:** "cannot end its turn until this is relayed" (misleading vs guard)  
**After:** `check_inbox` → still `unrelayed_count: 0`; `relay_inbox` did not render this id  
**Ledger row:** no `to` field present

```json
{"id":"t-msrktfc5-p1ey","kind":"deliverable","from":"AGNT w3-ledger-probe","title":"w3-probe-deliverable-no-to"}
```

**Population:** 453 of 462 deliverables (98.05%) lack `to:"operator"` — see `raw/ledger/ledger-counts.json`.

---

## Case (b) — alert

**Action:** `send_to_user({kind:"alert", ...})` → id `t-msrkthqq-7ecz`  
**relay_inbox render (excerpt):**

```
Tower t-msrkthqq-7ecz · alert · w3-probe-alert · from AGNT w3-ledger-probe
W3-PROBE alert — synthetic urgent probe, not real urgency
```

**Ack:** `{"id":"t-msrktknq-07dk","kind":"ack","ids":["t-msrkthqq-7ecz"]}`  
**Doorbell:** not exercised — gap recorded.

---

## Case (c) — progress

**Action:** `send_to_user({kind:"progress", ...})` → id `t-msrktfc8-fwly`  
**After:** never in `unrelayed`; `relay_inbox` clear for deliverables/alerts from this probe  
**Ledger:** 1462 progress rows in full scan — none participate in `unrelayed` filter.

---

## Case (d) — fleet board finding

**Action:** `board_post({topic:"tower/w3-probe-ledger", type:"finding", ...})` → id `t-msrkthqq-sjuq`  
**Surface:** `~/.tower/board.jsonl` only  
**After:** `relay_inbox` / `check_inbox` unchanged for operator plane; no deliverable row minted.

---

## F1 / F4 summary

| Finding | Live result | Numbers |
|---------|-------------|---------|
| F1 — `send_to_user` never sets `to:"operator"` on deliverables | **CONFIRMED** | 453/462 deliverables without operator `to`; probe `t-msrktfc5-p1ey` invisible to guard |
| F4 — `mark_relayed` clears guard without display proof | **CONFIRMED** | `t-msrktnl7-njgn` cleared via `mark_relayed` alone; see `raw/ledger/mark-relayed-transcript.json` |

---

## Plane summary

| Plane | Verdict |
|-------|---------|
| verbatim (alert path) | PROVEN |
| verbatim (progress isolation) | UNBROKEN |
| verbatim (board isolation) | UNBROKEN |
| verbatim (deliverable guarantee) | GAP — F1 |

**Raw transcript:** `/Users/jrg/agent-core/briefs/tower/w3-prove-planes-evidence/raw/ledger/verbatim-probes-transcript.json`
