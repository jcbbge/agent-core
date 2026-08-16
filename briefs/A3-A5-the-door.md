# A3 / A4 / A5 — the door, the rope, the batch record

Operator committed the peer's ignition sequence, 2026-08-14. Source of record:
`~/agent-core/research/peer-ignition-decision-brief.md` — read it, then execute this.
`A0` is already complete; `A6` (vein retro-baseline) is running in the tower workspace.

**These three land on YOU because you own the spawn primitive and the finisher.** The
governing law, established tonight and worth internalizing before you write a line:
**prose cannot refuse.** Skills explain; primitives enforce; Tower holds state. That is the
generalization of warn-vs-block, spec-vs-gate, and skill-vs-hook — one law, three faces.

Your exemplar already exists in your own file: `CURSOR_VERIFY_GATE` refuses a `coder` spawn
with no authored test criteria, from the lowest primitive, so no path routes around it.
**Every refusal below is modelled on that one.** Do not invent a second mechanism.

---

## A3 — Freshness gate (THE KEYSTONE) · ~1 day

**Refuse a spawn whose brief was cut against facts that have since moved.**

The empirical case, from tonight: `LIFECYCLE.md` carried one loop-law fact with **four
dependents** across two copies — pseudocode, an engine statement, a prose line, and a
vocabulary-table definition. Fixing the fact reconciled two; the other two were found by
hand, by grep, by the person who already knew about the problem. That is the whole thesis in
one file.

- Input is the **ground manifest** (`deps:` + coverage) that the Tower lane is building as
  A2 — coordinate, do not duplicate. Its shape: what a brief was cut against, with refs, and
  an explicit **coverage** field, because deps are captured as exhaust and exhaust has holes.
- **Stale deps → refuse.** Fail closed.
- **Absent deps → do NOT refuse outright.** Measured reason: grounding legitimately happens
  through the shell (`git log`, `grep`, `python3`, `curl`), which a tool-level read hook never
  sees. Absent-deps-blocks would refuse constantly and, worse, would *pass* work whose deps
  look complete and silently are not. **Fail closed on staleness; fail VISIBLE on
  incompleteness.**
- Break-glass exists, is loud, is audited — and per tonight's fix, the audit row **must carry
  `from`** and land in the plane you rule for it.
- **Log every override.** The named failure mode is the operator disabling a gate in
  irritation; a disabled gate teaches distrust and outlives itself. Overrides must be
  countable from day one, so "the thesis is wrong" stays distinguishable from "I was annoyed
  on a Tuesday."
- Watch: refusals by reason, false-refusal rate, overrides. Working when the line-17 class
  goes to zero, one true catch occurs, and overrides run under ~1 in 10.

## A4 — One door, three refusals + the rope · 1–2 days

The same door now holds **verify-criteria (exists) · freshness (A3) · WIP token**.

The rope is admission control: **refuse to admit new work while completed units sit
un-Landed.** `commit.md` already seeds it — *"in-flight items go first… never verdict fresh
ideas while half-built work sits unbounded."*

- **Tower holds the state** (what is in flight, what is finished-unreconciled); the primitive
  enforces; `commit.md` explains. Three layers, one enforcement point.
- Honest scoping note, conceded in the exchange: tonight's twelve-agent park was a
  **wake-chain** failure, not missing admission control — the coordinators carried no
  `parent` token so nothing woke them, and `17-field-pull` now covers the read side. **The
  rope keeps its justification (exit-side inventory: substrate landing faster than
  reconciliation absorbs it) but loses the park as evidence.** Do not cite it.
- Watch: in-flight vs cap; finished-unverified queue depth; admissions that still require the
  operator in conversation. Working when in-flight never exceeds the rope and admissions
  happen without him.

## A5 — Batch record via `cursor-finish` · ~1 day

**Do not build a new artifact.** `cursor-finish` is the only Land that actually runs in this
operation — it merges to main, runs `qa-verify`, tears down worktrees, and posts the operator
deliverable. Extend it; do not specify a sibling.

Add the four Land faces — **DELTA, LEARNED, PROPAGATED, TAX** — and append TAX to
`.madewell/work/tax.jsonl`.

The reason this is urgent, measured: that file is **0 bytes, created July 13**, and
`git log --grep="LEARNED:"` returns **0 of 849 commits**. Land's record was designed,
specified, provisioned, and never written once. A5 is the direct reversal of that.

- **PROPAGATED is the carry-forward**: what this unit's landing invalidated or unblocked.
  That is the edge that stops the next wave rebuilding what already shipped — tonight a
  client asked for a caller to substrate that had landed hours earlier, unwired.
- Cross-harness fence: `cursor-finish` is cursor-only. Document the fence explicitly rather
  than leaving a hole; claude/pi Lands are out of scope here and must be named as such.
- Watch: `tax.jsonl` row count; minutes-per-release at the operator's station. Working when
  the file grows with every Land.

## Rider — the dissimilarity rule

The six-agent inner loop is **dissimilar redundancy** (the avionics pattern: independent
channels, deliberately different implementations, so failures do not correlate). It carries a
design rule your model assignment currently satisfies only by accident: **never the same model
family for test-maker and implementer.** Encode it where the models are chosen so it cannot
drift — today `coder` and `test-maker` both resolve to `composer-2.5:fast`, which is exactly
the correlated-failure case the pattern exists to prevent. Raise it as a ruled proposal if
changing it costs rate-limit headroom; the operator's constraint is real.

---

## Contract

Branch first; one unit, one branch, one PR each — the sequence must obey the operator's own
laws rather than arriving as a monolith. `~/cursor-shim` is **load-bearing right now**: five
fleets spawn through `cursor-spine` while you work, so a broken spawn path stops the
operation. Additive and reversible; verify a real spawn still works after every change.
Anything destructive or irreversible comes to the concierge as a ruled proposal.

**Coordinate through the environment** — read the field before going idle, emit with evidence,
claim with `ref`, heartbeat, `work-done` with `ref`, `need-help` instead of silence. Note that
`17-field-pull` now injects routed work when you go idle, so silence is a choice, not an
accident. Post to `cursor-shim/the-door`.

Sequencing: **A3 first** (it is the keystone and A4 shares its door), then A4, then A5. A5 may
run in parallel if you have a second worker — it touches `cursor-finish`, not `cursor-spine`.
