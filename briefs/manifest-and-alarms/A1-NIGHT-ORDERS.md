# Night orders v1 — what rings, what trays, what dies

**Status:** LAW (CORD Tower, 2026-08-14). Companion to `COMMS-ARCH.md` notifications
rubric and `RESPONSIBLE-PARTY-AND-NQ.md`. Field topic: `tower/manifest-and-alarms`.

**Jidoka framing:** the machine is the counterparty; the operator is the exception
handler. He never watches. He is summoned — or he is not.

---

## Immediate (doorbell + operator mail)

Ring **only** when the operator must act *now* and no fleet tier can:

| Class | Consumer action | Source law |
|---|---|---|
| Destructive / irreversible approval | Approve or refuse | COMMS-ARCH operator mail |
| External credential / secret the fleet cannot hold | Supply or refuse | same |
| `nq` budget spent — question climbed to `operator` with a real body | Answer the question | RESPONSIBLE-PARTY §2 |
| Alert with actionable exception (prod-down, data loss, security) | Intervene | COMMS-ARCH notify rubric |
| ORCH cycle **landed** final report the operator asked to see | Read / ack deliverable | notify: task completion |

One message → one audience → once → in full. Status flips never ring.

## Tray (batched; one or two sittings/day)

Accumulate for pull-based review — **no toast**:

| Class | Tray | Who clears |
|---|---|---|
| Board findings / fleet mail | `twr` / board topic | CORD, then Concierge summary if needed |
| Progress beacons | `/tower` progress | ignore unless CORD escalates |
| Deliverables **not** tagged operator-urgent | deliverables/ + board | CORD rolls up; Concierge surfaces digest |
| `need-help` / open questions with `to` ≠ operator | responsible party's inbox | parent answers / escalates |
| Coverage / staleness **flags** (A3 fail-visible) | board + field | CORD cursor-shim + CORD Tower |
| Heartbeat / claim TTL churn | field scan | ignore (decay is the scheduler) |

## Deleted (never born, or dead-lettered)

| Class | Fate | Why |
|---|---|---|
| Status → mail fabrication | OFF (flag-gated) | status ≠ mail |
| Content-free `question` (`id/ts/cwd/kind` only) | reject at emit; dead-letter if legacy | doorbell storm (A8) |
| Fleet mail addressed to operator by accident | coordinator judgment — do not relay verbatim | COMMS-ARCH one rule |
| Duplicate toast for already-acked id | forbidden | dedupe by id |
| "I'm done" without operator-addressed deliverable | board finding only | no summons |

## Ambiguity — who decides

| Ambiguity | Decider | Escalation |
|---|---|---|
| Is this an exception or a tray item? | **CORD** of the project | Concierge if CORD is the asker |
| Does this burn an nQ step? | Responsible party (parent) | escalate one link |
| New alarm **class** (first sighting) | Concierge proposes; operator confirms once | then enters this page |
| Conflict between this page and a brief | This page + COMMS-ARCH win | brief is wrong |

Default when unsure: **tray**, not doorbell. A missed toast is recoverable; a trained-ignore flood is not (EEMUA).

## Watch

- Interruptions per session vs tray batch size.
- Working when: tray cleared in ≤2 sittings/day **and** a week with zero non-alarm doorbells.
