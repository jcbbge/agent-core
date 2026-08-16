# A1 / A2 / A8 — night orders, the ground manifest, alarm rationalization

Operator committed the peer's ignition sequence, 2026-08-14. Source of record:
`~/agent-core/research/peer-ignition-decision-brief.md`. `A0` is complete; `A6` is running;
`A3/A4/A5` went to `CORD cursor-shim`, who owns the spawn primitive and the finisher.

**These three land on YOU because you own the comms law and the doctrine files.** A2 is the
producer for cursor-shim's keystone gate — **coordinate with them on the manifest shape
before either side builds**, and do it through the field rather than by waiting.

---

## A2 — The ground manifest (do this FIRST; A3 blocks on it) · half day

**`/ground` Step 3 emits a machine-readable `deps:` block with a coverage field.**

The design that survived the peer exchange, and the reason it survives: **`deps` is never
hand-authored. It is exhaust.** `/ground` is already mandatory and already reads the files it
grounds on; a hook logs those reads and emits the block mechanically. That is the git move —
the artifact is a by-product of compulsory work, not a form anyone fills in. A hand-authored
`deps` block would be `tax.jsonl` one layer up, with more ceremony: **0 bytes, one month.**

Measured hook surfaces, so you do not have to rediscover them:

- **Claude Code** — `PostToolUse` with matcher `*` fires after **every** tool including
  `Bash`, and a grounding hook already rides there. Full capture available today, no new
  surface.
- **Cursor** — exposes exactly four events: `sessionStart`, `preToolUse`, `sessionEnd`,
  `preCompact`. **There is no `PostToolUse`**, and the only registered matcher is `Shell`.
  Capture must happen pre-call.
- **pi** — carries its own `grounding-hook.ts`.

**So exhaust capture is strongest on Claude Code and weakest on cursor** — the exact inverse
of A5's batch record, which must ship cursor-first. Two fences pointing opposite directions;
do not let a single "cursor-first" policy be written for both.

**The coverage field is not optional, and it is the part that keeps this honest.** The real
fault line is not the harness, it is the **read path**: tonight's grounding ran overwhelmingly
through the shell — `wc -c`, `git rev-list`, `grep -n`, `python3`, `curl` — including *both*
facts that overturned the concierge's thesis. A tool-level read hook would have captured
almost none of it. Bash is interceptable on CC, but knowing *which files* a shell command
touched requires parsing the command and is lossy by nature: `git log` names no file,
`super-search` shells out through its own layers, a python heredoc reads whatever it likes.

Therefore the graph will have silent holes on every harness. **A graph that hides its own
holes is worse than no graph, because the gate downstream trusts it** — the same rule this
project applied to a repaired board row that must admit it was repaired. Record what was
observed **and** the coverage, so A3 can fail closed on staleness and fail *visible* on
incompleteness.

Watch: manifest presence on spawned briefs; audit-vs-declaration discrepancy on CC. Working
when 100% of spawned briefs carry one and the discrepancy rate is low and falling.

## A1 — Night orders v1 · 1 hour

**Write down what wakes the operator versus what waits in a tray.**

He is one person with ten threads; the doorbell is the scarcest channel on the machine. Night
orders are the standing rule for which signals are exceptions and which accumulate for a
batched read.

- Ground it in the existing law rather than inventing: `COMMS-ARCH.md` already says only
  operator-addressed mail blocks turn-end, status is never mail, and notifications are for
  task completion, a genuine summons, or an alert.
- The jidoka framing from the exchange: **the machine is the counterparty and the operator is
  the exception handler.** He never watches; he is summoned.
- Deliverable is short and usable — one page naming: what rings immediately, what trays, what
  is deleted outright, and who decides when a class is ambiguous.
- Watch: interruptions per session vs tray batch size. Working when the tray is cleared in one
  or two sittings a day and a week passes with zero non-alarm doorbells.

## A8 — Alarm rationalization · background

Process-control discipline (EEMUA): **a plant fails dark operation not from missing sensors
but from alarm floods that train the operator to ignore alarms.**

The rule: **every signal names the consumer action it demands, or it is deleted.**
`COMMS-ARCH` already crawls toward this; finish it. The doorbell that rings on a non-exception
is what makes the real exception invisible at 2am.

Concrete instance to fix while you are in there: tonight a ledger question carrying **only
`id`, `ts`, `cwd`, `kind`** — no `from`, no `message`, no `to` — blocked turn-end and routed
itself to the operator, because `effectiveTo` falls back to `operator` when `to` is absent.
That is the exact storm `RESPONSIBLE-PARTY-AND-NQ.md` was written after, recurring. Two fixes:
validate questions at **emit** and reject malformed ones loudly rather than persisting them;
and distinguish "legacy but valid" from "malformed" before applying the operator fallback —
a content-free row belongs in a dead-letter surface, never on the doorbell.

Watch: alarms answered vs ignored. Working when every doorbell produces an action and no alarm
class is ignored twice.

---

## Contract

Branch first; one unit, one branch, one PR each. Canonical-vs-deployed applies to every
doctrine file you touch: `COMMS-ARCH.md` and `RESPONSIBLE-PARTY-AND-NQ.md` exist both at
`~/.tower/` (the copy that EXECUTES) and `~/agent-core/primitives/mcps/tower/` (git-tracked
canonical). Edit canonical, mirror to deployed, say so in the text — a doctrine change present
only in the repo is not a change.

**Coordinate through the environment.** `17-field-pull` now injects routed work when you go
idle, so emit `work-available` for the manifest-shape decision addressed to `CORD cursor-shim`
rather than waiting to be asked. Claim with `ref`, heartbeat, `work-done` with `ref`,
`need-help` instead of silence. Post to `tower/manifest-and-alarms`.

Sequencing: **A2 first — cursor-shim's keystone is blocked on its shape.** A1 next (one hour,
high leverage). A8 rides in the background.
