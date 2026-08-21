# CORD — the loop has no quality gate at either end

Escalated by the closed T23 Lookahead seat as the one thing it could not act on.
Source: `~/infinity/discovery/specs/ACTIONS-for-concierge-T23-U1.md` §A7 and
`specs/PROCESS-premature-binding-madewell.md`.

**This is a thinking thread, not a build thread.** The operator wants to talk it
through with you in this pane. Do not open an implementation.

## The finding

The Made Well loop has no quality gate at either end.

- **Outbound:** `Rumen`, the outbound quality organ, is **unbuilt**. That is why
  Land *"warns"* rather than blocks — `land.md` says the walls are *"a
  check-engine light, never a shutdown"*, and wiring them to block is
  *"the quality organ's job (Rumen)"*, Rumen risk R3.
- **Inbound:** Ideate's grounding duty was **never written down**. So *bounded*
  does not yet mean *grounded and bounded* — which means
  *"after promote there are no further product decisions"*
  (`~/Infinity/arc/docs/decisions/2026-08-20-imagine-before-promote.md`) cannot be
  honestly asserted.

The rule that was drafted for the inbound half, already applied to two brief
COMMON files by the concierge on 2026-08-21:

> **Ideate grounds everything its commitment depends on. Plan grounds only what
> its decomposition depends on.**

## The synthesis that collapses it into one lever

`~/agent-core/research/peer-refraction-madewell-topology.md` already diagnosed
this class as **write-side production with no designated reader**:
`tax.jsonl` provisioned with its reader unbuilt and zero bytes in a month; the
staging pool at 168 items with *"nothing reads it except a human choosing to."*

Premature binding is the same defect from the write side: **a cached value with no
invalidation path is a write with no reader.**

> **These are not new rules to follow. They are missing readers to install.**

Mapping: P3 is a reader for ADR headers. P4 is a reader for the staging pool.
P1/A4 is the reader the Commit gate never had.

## The recommendation you are inheriting

Weigh P1–P4 **against that research doc's existing recommendations**, rather than
running this as a separate thread. Same root cause, different face. The Lookahead
seat was explicit that the lever is **not discipline — it is readers.**

## What is already in motion (do not duplicate)

- **P1 (partial):** the file-partition clause was struck from both wave COMMON
  briefs and the grounding rule written in, by the concierge, 2026-08-21. The
  other half — naming the grounding duty in the ADR with an owner — is open.
- **P2 → P3:** live with `orch-doc-status-hygiene` (ADR header hygiene, then the
  `spec-conformance` assertion). Ordering constraint held: P2 first.
- **P4:** assigned to the T23 index seat (staging-pool reader, proposes only).

So your live scope is: **the loop-level question** — Rumen, the Ideate grounding
duty and its owner, and whether P1–P4 fold into the topology research or stand
alone.

## Your first move

Read the research doc and `PROCESS-premature-binding-madewell.md`, then open with
a compact orientation and think it through with the operator in short turns.
Bring him forks, not a report.

## Constraints

- No implementation. No new organ built on a hunch.
- `Rumen` is unbuilt — verify what exists before describing it. Mark `[UNKNOWN]`
  rather than inferring; this operator rejects invented values.
- Do not message peer seats. Report to `claude-concierge`.

## Report-back

`~/muster/bin/muster-deposit deposit --from cord-loop-gates --to claude-concierge --kind report|question --body "<...>"`
Bus repaired 2026-08-21: ledger `~/muster/field/deposits.jsonl`, unique ids.
