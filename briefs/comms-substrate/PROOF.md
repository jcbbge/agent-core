# PROOF — the comms substrate, proven on real panes

Unit 3 evidence, authored by `orch-deposit-courier` (pane `w3R:p1Q`).

**NO MOCKS.** Every run below is against the live bus, real panes, and real
files. A mocked bus proves nothing about a bus whose defect was that it lied
about delivery.

Every pane id and timestamp is recorded so CORD can re-derive each result
independently from `~/.tower/board.jsonl` without trusting this document.

---

## 0. BASELINE — the defects, captured live before any fix landed

This section is the "before". It was not staged: both specimens were produced by
the ordinary act of spawning this unit's own Wave 1 workers, and both were
verified against instruments rather than believed.

### 0.1 The fabricated completion (DESIGN §6a)

At **2026-08-17T01:01:42Z**, `orch-deposit-courier` (`w3R:p1Q`) received the
prompt:

```
your worker AGNT deposit-core is done — collect via board + .done
```

`AGNT deposit-core` (`w3R:p1R`) had been alive for seconds and had produced
nothing. Three independent instruments, all disagreeing with the message:

| Instrument | Command | Observed |
|---|---|---|
| herdr pane state | `herdr pane list` | `w3R:p1R` `agent_status = working` |
| `.done` marker | `ls ~/.tower/*deposit-core*.done` | no matches |
| the board row itself | `board.jsonl`, topic `herdr-spine/parent-wake` | `worker AGNT deposit-core (w3R:p1R) -> idle; spawner w3R:p1Q` |

The triggering status was **`idle`**, not `done`. `16-parent-wake:165`
(`if status not in ("done", "idle")`) treats them identically, then delivers
text hardcoded at `:210` to say *"is done"*. Reproducible on demand: it fires
for **every spawn**.

### 0.2 The silent drop (DESIGN §3) — same spawner, six seconds later

The sibling event is on the board:

```
2026-08-17T01:01:48Z  worker AGNT deposit-core-test (w3R:p1S) -> idle; spawner w3R:p1Q
```

**It never reached `w3R:p1Q` at all.** Two completions owed to one spawner
inside the 60s pace window: one delivered, one silently gone, with no queue, no
retry, and no dead-letter row.

### 0.3 The verifier's report carries no information (DESIGN §3a)

CORD found that `verified_prompt()` (`_spine_common.py:363-398`) waits
`--until working`, so an **already-working** target never transitions, the wait
times out, and it raises — reporting non-delivery for a delivered message.

I reproduced it four times in one command and, unlike the original sighting,
**established ground truth for every case.** Delivering the CONTRACT §6a
amendment to four working panes:

| Pane | `spine-spawn prompt` reported | Ground truth (`herdr pane read --source recent`) |
|---|---|---|
| `w3R:p1R` `AGNT deposit-core` | `FAIL: prompt NOT verified as submitted` | **delivered** |
| `w3R:p1S` `AGNT deposit-core-test` | `FAIL: prompt NOT verified as submitted` | **delivered** |
| `w3R:p1T` `AGNT stuck-cli` | `FAIL: prompt NOT verified as submitted` | **not delivered** |
| `w3R:p1V` `AGNT stuck-cli-test` | `FAIL: prompt NOT verified as submitted` | **not delivered** |

**The finding is sharper than "it under-reports success."** The verifier
returned the identical verdict for two successes and two genuine failures. In
the already-working case its output is **uncorrelated with reality** — it is not
a pessimistic signal that could be safely over-trusted, it is *no signal at
all*. A courier that requeued on this verdict would duplicate the two delivered
messages forever while never learning that the other two needed resending.

This is why CORD's DESIGN §3a rules that a busy target is a **defer**, never a
failure, and why evidence must include a transcript echo matched on
`deposit_id`. Both halves are load-bearing: the defer prevents amplification,
the echo is what makes an already-working target verifiable at all.

Redelivery to `w3R:p1T` and `w3R:p1V` was then **deferred until those panes
flipped**, rather than retried into a working pane — the capability-gated
behavior this unit is building, applied by hand to its own traffic.

### 0.4 Why these belong in one section

Six seconds, one spawner, both defects: the bus **fabricated** a message that
was not true, and **dropped** a message that was owed. Neither left a record of
having done so.

This is also the argument for shipping DESIGN §6a alongside the primitive rather
than after it. Today the false completion is at least subject to the drop rule
that loses one in three messages. Once delivery is guaranteed, the false
completion becomes *reliably* delivered to every spawner, forever — improving
delivery without fixing fabrication converts an intermittent lie into a
dependable one.

**Re-derive independently:**

```bash
python3 - <<'EOF'
import json
rows = [json.loads(l) for l in open('/Users/jrg/.tower/board.jsonl') if l.strip()]
for r in rows:
    if r.get('topic') == 'herdr-spine/parent-wake' and 'w3R:p1Q' in r.get('body', ''):
        print(r['ts'], '|', r['body'])
EOF
```

---

## 1. Task 5.1 — the three-worker burst

*Pending. Runs after the primitive, courier, and migration land.*

## 2. Task 5.2 — the operator-focused case delivers rather than deferring forever

*Pending. This is the path that requires the pulse; if it passes without the
launchd agent running, the test is wrong.*

## 3. Task 6 — the fabricated completion is refused at the door

*Pending. Must show a real spawn producing a refusal receipt in
`dead-letter.jsonl` with a non-empty reason, a genuinely finished worker still
delivering, and `-> idle` distinguishable from `-> done` in both the board row
and the delivered prompt text.*

---

SOURCES: `herdr pane list` and `~/.tower/board.jsonl` (topic
`herdr-spine/parent-wake`) read live 2026-08-17T01:01-01:03Z;
`~/herdr-spine/bin/handlers/16-parent-wake:165,210` read; spawn transcripts of
`spine-spawn make deposit-core` and `make stuck-cli`, this session.
