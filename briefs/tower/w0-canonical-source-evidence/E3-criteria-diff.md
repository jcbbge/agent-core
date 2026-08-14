# E3 — server-drift.criteria.md diff (T4c)

Author: `agnt-w0-driftcheck` · 2026-08-13 UTC. Full diff (also in
`git diff -- primitives/mcps/tower/server-drift.criteria.md` on branch
`spine/w0-driftcheck`).

## What changed, row by row, one line each

1. **Struck (not deleted) both rows in "SHA reconciliation"** that named
   `~/herdr-spine/cc-hooks/server.mjs` as canonical. Justification: fact 2
   — that assumption is overturned by E2's install.sh rewrite, which now
   treats `cc-hooks/` as a fresh-machine fallback, not canonical.
2. **Added a "Superseded" note above those rows** explaining why, dated,
   and naming the successor. Justification: the pre-existing failing
   criteria (fact 3) must stay "intact and honestly marked" — striking
   through and annotating preserves the historical row instead of
   deleting it, matching that same spirit for a row that's wrong rather
   than merely still-failing.
3. **Added a new "Drift check (T4)" section with 6 assert rows**
   (manifest discovery, `.mjs` mirror, `.md` mirror, contested-vs-spine,
   orphan, push-state). Justification: T4c's second requirement — "add
   rows for what your check asserts."
4. **Left every other section of the file untouched** — Drift resolution,
   Backup, Regression suite, MCP stdio smoke, relay_inbox behavior, Board
   findings, Human-only, Run command. Justification: those encode the
   oracle test's pre-existing criteria (fact 3's 4 known failures live
   among them) and this lane's file partition is "update the rows that
   are now false" — not a rewrite.

## Not changed, and why that's deliberate

The "Run command" section still says
`bun ~/.tower/server-drift.test.mjs` — that's the oracle test's own
invocation, unrelated to `drift-check.mjs`'s separate invocation line
(documented in the new T4 section and in `README.md`'s T5 addition
instead). Two different run commands for two different files is correct,
not an inconsistency.
