# W3 prove-planes — LEDGER plane evidence

**Agent:** AGNT w3-ledger  
**Evidence root:** `/Users/jrg/agent-core/briefs/tower/w3-prove-planes-evidence/`  
**Verdict:** **PROVEN** (Q&A loop, mark_relayed/F4, live counts) with one documented gap (doorbell not exercised)

---

## CLAIM

Posted to `tower/w3-prove-planes` as `t-msrksyha-ztvr` (from `AGNT w3-ledger`).

---

## Task 1 — Q&A closed loop without human

**Status:** PROVEN

### Path A: `ask_user` → `reply` → `check_inbox`

| Step | Tool | Key args | Return excerpt |
|------|------|----------|----------------|
| 1 | `check_inbox` | `from=AGNT w3-ledger-probe` | `unrelayed_count: 0`, no open Q |
| 2 | `ask_user` | question W3-PROBE 2+2 | Question id `t-msrkt6ci-siuh` |
| 3 | `check_inbox` | `question_id=t-msrkt6ci-siuh` | `still_unanswered: [t-msrkt6ci-siuh]` |
| 4 | `reply` | `question_id=t-msrkt6ci-siuh`, answer `four` | Answer recorded |
| 5 | `check_inbox` | `question_id=t-msrkt6ci-siuh` | answer `four`, `still_unanswered: []` |

**Ledger excerpts** (`~/.tower/ledger.jsonl`):

```json
{"id":"t-msrkt6ci-siuh","kind":"question","from":"AGNT w3-ledger-probe","message":"W3-PROBE: synthetic closed-loop test — what is 2+2? (answer: four)"}
{"id":"t-msrkt9y6-yohi","kind":"answer","ref":"t-msrkt6ci-siuh","message":"four"}
```

### Path B: `ask_user` → `relay_inbox` answers param → `check_inbox`

| Step | Tool | Key args | Return excerpt |
|------|------|----------|----------------|
| 1 | `ask_user` | color of sky probe | Question id `t-msrktfcb-8uxu` |
| 2 | `relay_inbox` | `answers: [{question_id: t-msrktfcb-8uxu, answer: blue}]` | Rendered unrelayed alert + recorded answer for `t-msrktfcb-8uxu` |
| 3 | `check_inbox` | `question_id=t-msrktfcb-8uxu` | answer `blue`, openQ cleared |

**Raw transcript:** `/Users/jrg/agent-core/briefs/tower/w3-prove-planes-evidence/raw/ledger/qa-loop-transcript.json`

---

## Task 2 — `mark_relayed` / F4

**Status:** PROVEN (F4 refuted as safe — guard clearable without display proof)

| Step | Tool | Return |
|------|------|--------|
| 1 | `send_to_user` (alert) | id `t-msrktnl7-njgn` |
| 2 | `check_inbox` | `unrelayed_count: 1` |
| 3 | `mark_relayed` | `ids: [t-msrktnl7-njgn]` — **no relay/doorbell performed** |
| 4 | `check_inbox` | `unrelayed_count: 0` |

**Ledger ack row:**

```json
{"id":"t-msrktrby-yi6x","kind":"ack","ids":["t-msrktnl7-njgn"]}
```

**Raw transcript:** `/Users/jrg/agent-core/briefs/tower/w3-prove-planes-evidence/raw/ledger/mark-relayed-transcript.json`

---

## Task 4 — Live counts (F1)

**Status:** PROVEN — F1 still false in production data

**Method:** Full scan of `~/.tower/ledger.jsonl` (2693 lines) at probe time.

| Kind | Total | With `to:"operator"` | Without `to:"operator"` |
|------|-------|----------------------|---------------------------|
| deliverable | 462 | 9 (1.95%) | 453 (98.05%) |
| alert | 10 | — | unrelayed at scan end: 0 |
| progress | 1462 | N/A (never operator mail) | — |

**F1 ruling:** `send_to_user(kind:deliverable)` never sets `to`; `inboxState` requires `r.to === 'operator'` for deliverables. Live probe id `t-msrktfc5-p1ey` has no `to` field and never entered `unrelayed`.

**Raw counts:** `/Users/jrg/agent-core/briefs/tower/w3-prove-planes-evidence/raw/ledger/ledger-counts.json`

---

## Gaps

- **Doorbell:** not exercised (brief default). Alert/progress probes used synthetic W3-PROBE labels only.
- **Unrelated open questions:** cleared by sibling `AGNT w3-surfaces` during shared `relay_inbox` call (`t-msrktev3-k02o`); not in scope.

---

## Plane summary

| Plane | Verdict |
|-------|---------|
| ledger (Q&A loop) | PROVEN |
| ledger (mark_relayed / F4) | PROVEN — F4 confirmed live |
| ledger (F1 counts) | PROVEN — F1 confirmed live (453/462 deliverables lack operator routing) |

**Evidence paths:**

- `/Users/jrg/agent-core/briefs/tower/w3-prove-planes-evidence/LEDGER.md`
- `/Users/jrg/agent-core/briefs/tower/w3-prove-planes-evidence/raw/ledger/qa-loop-transcript.json`
- `/Users/jrg/agent-core/briefs/tower/w3-prove-planes-evidence/raw/ledger/mark-relayed-transcript.json`
- `/Users/jrg/agent-core/briefs/tower/w3-prove-planes-evidence/raw/ledger/ledger-counts.json`
