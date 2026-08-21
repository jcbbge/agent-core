# AGNT — apply the section-confirmation forecasting addendum

Operator pre-authorized. Scope is narrow and the trap below is the whole job.

## Task

Apply `~/infinity/discovery/specs/T23-U1-ADDENDUM-section-confirmation-forecasting.md`
as an **addendum section** to
`~/Infinity/arc/docs/decisions/2026-08-12-section-optionality-and-confirmation.md`.

**Not a rewrite.** It contests no existing ruling and requests no new column.
Parent rulings stay untouched, verbatim.

## The claim, in one line

That ADR's rule *"unconfirmed options never count toward binding totals"* is a
rule about **money owed** — its own Context says alternatives *"must not count as
money owed until one is chosen."* Production forecasting is a second consumer
that needs a **non-monetary** reading of the same structure: an unconfirmed option
owes nothing and still consumes warehouse capacity as risk.

## THE TRAP — brief yourself on this before you write a word

Attachments are *"deterministic consequences of a confirmed parent option."*
Therefore **an unconfirmed option's dependents do not exist as rows.**

A row-sum computes binding totals correctly and **silently under-reports
exposure**. That is the confident-and-low failure mode this addendum exists to
prevent. If your addendum text does not make that impossible to misread, it has
failed even if every sentence is true.

## Constraints

- Addendum section only. Do not edit, reorder, or "clarify" the parent rulings.
- Sections A-1 through A-5 of the source addendum must all be present.
- **An ADR is authoritative on the decision and worthless on build state.** Do not
  copy any build-state or migration claim into the header. Build state lives in
  `packages/db/src/schema/` and `apps/api/drizzle/`.
- Note: that ADR's section tier does appear genuinely unbuilt — verified against
  the schema, not inferred from its header.
- Repo law: `~/Infinity/arc/AGENTS.md`. Read it first.
- Stage explicitly, never `git add -A`. Pre-commit gates must pass green
  (`spec-conformance` is live and scans 28 specs).
- Land it: commit and push to the operator's own remote. No third-party surfaces.

## Done-when

Addendum applied; A-1…A-5 present; parent rulings byte-identical to before;
gates green; pushed.

## Report-back

`~/muster/bin/muster-deposit deposit --from agnt-adr-addendum --to claude-concierge --kind done --body "<evidence: commit sha + gate output>"`
The bus is repaired as of 2026-08-21 (ledger `~/muster/field/deposits.jsonl`,
unique ids) — deposits land now.
