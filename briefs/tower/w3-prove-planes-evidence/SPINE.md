# SPINE — 10-notify · 40-tower-bridge

Agent: AGNT w3-aux  
Handlers: `/Users/jrg/herdr-spine/bin/handlers/10-notify`, `/Users/jrg/herdr-spine/bin/handlers/40-tower-bridge`  
Ownership: board = `10-notify` · ledger = `40-tower-bridge` (no dual-write)

---

## Event → plane map

```
herdr pane.agent_status_changed
        │
        ├─► 10-notify ──► ~/.tower/board.jsonl
        │     blocked  → type:alert  (+ toast SUMMONS)
        │     done     → type:finding (worker: board only; else toast+board)
        │     any      → title beacon via client.window_title.set
        │
        └─► 40-tower-bridge ──► ~/.tower/ledger.jsonl
              blocked           → kind:question (or adopt existing open question)
              working/idle      → kind:answer "(resolved in pane)" if mapping open
              done + $verdict    → kind:deliverable + deliverable file (§7)
              done, no $verdict  → nothing (10-notify board line only)
```

Dispatcher: `bin/spine-hook` invokes every executable handler in `bin/handlers/` per event.

---

## 10-notify — board plane

**Handler:** `/Users/jrg/herdr-spine/bin/handlers/10-notify`

| Event | Board row | Toast |
|-------|-----------|-------|
| `agent_status == blocked` | `type:"alert"`, body `{agent} blocked on {name} ({ws}): {question}` | YES (SUMMONS, sound=request) |
| `agent_status == done`, worker pane | `type:"finding"`, body `{agent} done on {name} ({ws}): {$verdict}` | NO |
| `agent_status == done`, non-worker | same finding row | YES (sound=done) |

**Live proof — blocked → alert**

- Board: `/Users/jrg/.tower/board.jsonl:6280`
- Id: `spine-af38c43c-c509-490b-8c3a-fd2d5bd54645`
- ts: `2026-08-13T12:46:19Z`
- from: `spine-daemon`
- type: `alert`
- body prefix: `claude blocked on CONCIERGE (concierge): PR #239 reverses...`

**Live proof — done → finding**

- Board: `/Users/jrg/.tower/board.jsonl:6410`
- Id: `spine-024533ac-5b77-4312-ba91-0d7acb69f187`
- ts: `2026-08-13T13:36:24Z`
- from: `spine-daemon`
- type: `finding`
- body prefix: `cursor done on ORCH tower w0 closeout (tower): GO: W0 landed cab69eb...`

**Source cites:** `sc.board_append("alert", ...)` line ~417; `sc.board_append("finding", ...)` line ~483.

**Verdict:** PROVEN (recent rows match handler contract)

---

## 40-tower-bridge — ledger plane

**Handler:** `/Users/jrg/herdr-spine/bin/handlers/40-tower-bridge`

| Event | Ledger row | Notes |
|-------|------------|-------|
| blocked (new) | `kind:"question"`, `from:"{agent}@{human-name}"`, real question text | adopt-check may skip duplicate within 60s |
| working/idle/unknown | `kind:"answer"`, `ref:<question-id>`, `message:"(resolved in pane)"` | self-draining |
| done + $verdict | `kind:"deliverable"` + file under `~/.tower/deliverables/` | no $verdict → skip |

**Live proof — blocked → question**

- Ledger: `/Users/jrg/.tower/ledger.jsonl:2623`
- Id: `t-msqybioo-hp6n`
- ts: `2026-08-13T03:21:20.472Z`
- kind: `question`
- from: `claude@CONCIERGE`
- message: `Which wave should I open next?`
- Pairs with board alert `spine-69941b20` (same episode, -1s)

**Live proof — idle/working drain → answer**

- Ledger: `/Users/jrg/.tower/ledger.jsonl:2624`
- Id: `t-msqyda1c-6y6w`
- kind: `answer`
- ref: `t-msqybioo-hp6n`
- message: `(resolved in pane)`
- from: `claude@CONCIERGE`

**done → deliverable (ledger)**

- Contract: `40-tower-bridge` writes `kind:"deliverable"` when pane done carries `$verdict`.
- Ledger contains deliverable rows (e.g. `t-msqv76mb-f59r` concierge session close).
- **GAP:** No grep hit tying a specific recent `spine-daemon` done event to a new ledger deliverable + file in the same second window as board finding `spine-024533ac`. Board done path PROVEN; ledger deliverable append for spine-done+$verdict **UNBROKEN** (contract + historical rows) but not re-fired live in this probe.

**Verdict:** question/answer pair PROVEN; deliverable-on-done GAP for live paired proof

---

## Doorbell rubric (10-notify owns toasts)

From handler docstring (T1–T4) and `~/.tower/COMMS-ARCH.md`:

1. **Rare:** toast = summons only; worker activity/completion is status-plane (board), not toast.
2. **Contextual:** title = role + human work name; body = distilled $verdict (sentence-aware trim).
3. **Paced:** drop duplicate (pane_id, kind) within 60s; board line always written anyway.
4. **Duration:** system delivery chain documented in handler.

**This probe:** doorbell not fired (default avoid). Evidence AGNT did not trigger `agent_status_changed` on a live pane. **Gap:** desktop notification path not exercised.

**What would be safe to fire:** none during w3-aux — would spam operator for a synthetic status flip.

**What was correctly skipped:** `herdr notification show` for blocked/done simulation.

---

## Cross-plane correlation (one blocked episode)

| Plane | Id | ts | Shape |
|-------|-----|-----|-------|
| board | spine-69941b20-... | 2026-08-13T03:21:19Z | alert, blocked question |
| ledger | t-msqybioo-hp6n | 2026-08-13T03:21:20.472Z | question, claude@CONCIERGE |
| ledger | t-msqyda1c-6y6w | 2026-08-13T03:22:42.576Z | answer, resolved in pane |

Demonstrates 10-notify + 40-tower-bridge both consumed the same herdr event without dual-writing the same plane.

---

## Subsystem verdicts (spine bridge)

| Component | Verdict |
|-----------|---------|
| 10-notify → board alert (blocked) | PROVEN |
| 10-notify → board finding (done) | PROVEN |
| 40-tower-bridge → question | PROVEN |
| 40-tower-bridge → answer drain | PROVEN |
| 40-tower-bridge → deliverable on done+$verdict | GAP (live pair not captured) |
| Doorbell / notification.show | GAP (not exercised) |

Raw grep transcript: `raw/aux/spine-grep.txt`

No handler patches made (per brief).
