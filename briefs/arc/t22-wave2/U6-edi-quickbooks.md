# UNIT — EDI invoices → QuickBooks journals (STG-669)

Read `~/agent-core/briefs/arc/t22-wave2/COMMON.md` first.

## Your item

**STG-669 — EDI invoices → QuickBooks journals with proportional sales tax.**
[CONTRADICTS T14 / STG-156]
Nathaniel emailed a chart of accounts. Food purveyor invoices code to three
buckets (food / supplies / other); supplies+other are taxed, food is not; tax
printed at the bottom is split **proportionally** across the taxed categories
(and some invoices show tax per line). Finalize-in-source is the cursor that
emits the journal. **T14 / synthesis P-federation: Arc tags COA and does not emit
journals; QuickBooks is SoT.** This call asks for the emit. Reconcile before
building — possible homes: Arc, a Bento-replacement AP tool, or Mimi.
Route: `platform/BACKLOG-integrations-other.md` — **must reconcile with STG-156
before any code.** Verify with: Nathaniel, whoever owns AP.

## What to hash out

- **This item contradicts a standing architectural stance, and that is the whole
  job.** T14 / STG-156 says Arc tags chart-of-accounts and does *not* emit
  journals; QuickBooks is the system of record. Nathaniel is now asking for the
  emit. **Read STG-156 before you form a view.** Either the stance bends, or the
  emit lives somewhere that is not Arc.
- **Three candidate homes are named: Arc, a Bento-replacement AP tool, or Mimi.**
  Ruling the home is the decision; the tax arithmetic is the easy part. Note that
  "Mimi" as a home collides with the Jan 1 payroll cliff (STG-668) — a seat holds
  that item; flag, do not absorb.
- **The proportional-tax rule is specifiable and worth writing precisely:**
  supplies + other are taxed, food is not, bottom-line tax splits proportionally
  across the taxed categories — *and some invoices already show tax per line*, so
  the algorithm needs both paths.
- `[UNKNOWN]` — who owns AP. The route says "verify with whoever owns AP" and does
  not name them.
- `[UNKNOWN]` — the chart of accounts Nathaniel emailed. Locate it; it is the
  input. Note that a clean CoA sheet has been an outstanding external dependency
  in this pipeline for a while (see the T19 handoff notes on CoA blocking the
  Section facet).
