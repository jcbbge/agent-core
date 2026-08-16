# AGNT [f1-f4] — Close F1 (deliverable `to`) + F4 (`mark_relayed` refuse)

Read `/Users/jrg/agent-core/briefs/tower/w3-plane-fixes-evidence/SHARED-PREFIX.md` first — shared prefix. Everything below is your partition.

Mission: in the unit worktree, patch Tower `server.mjs` so operator-addressed send kinds carry `to:'operator'` (F1) and `mark_relayed` refuses ids not currently unrelayed (F4). Lock both with a focused real MCP test file. Do NOT use emojis.

## Pre-Verified Facts (lead verified all of these personally)

See SHARED-PREFIX.md. Partition anchors (re-read in worktree before edit):
- F1: `primitives/mcps/tower/server.mjs` case `send_to_user` ~187-202 — no `to` field.
- Unrelayed rule: `primitives/hooks/tower-ledger.mjs` ~349-353.
- F4: same file case `mark_relayed` ~236-239 — blind ack append.
- `inboxState` already imported in `server.mjs` line 30.
- Exemplar MCP test harness: `primitives/mcps/tower/write-path.test.mjs` `withMcp`.

## Parallel Work Notice

See SHARED-PREFIX. Sibling AGNT f9 owns `cli.mjs` + `cli.test.mjs` only.
Ignore those files. You own server + plane-fixes tests + optional COMMS-ARCH note.

## Tower

- CLAIM on `tower/w3-plane-fixes` from=`AGNT f1-f4` before edits.
- Findings with probe ids / test tails as you go.
- No doorbell.

## Tasks

1. **F1** — done when: for `kind` in `{deliverable, alert}`, ledger entry sets
   `to: 'operator'` by default (accept explicit `to` if you add schema support;
   default remains operator). `progress` must NOT set operator-blocking `to`
   (omit `to`, or set a non-operator value — must stay out of unrelayed).
   Test in `plane-fixes.test.mjs` locks the default via real MCP spawn +
   ledger/inboxState inspection (no mocks).

2. **F4** — done when: `mark_relayed` checks caller ids against
   `inboxState(CWD).unrelayed` (or equivalent scoped unrelayed set). Ids not
   in that set are refused with a clear error string; **no ack row** is
   appended for a refused call (if some ids valid and some not: refuse the
   whole call with no ack — simplest correct behavior). Document in a short
   comment near the case (and optionally one line in COMMS-ARCH.md migration
   item 4 closeout) that the operator-facing relay path (`relay_inbox` /
   orchestrator after verbatim display) is the intended clearer. Test locks
   refuse-of-arbitrary-id (no silent clear).

3. **COMMS-ARCH** — done when: if migration item 4 names the F1 fix, add one
   short note that it is implemented (default `to:'operator'` on
   deliverable/alert). Skip if item already closed; do not rewrite the doc.

4. **Marker** — done when:
   `/Users/jrg/agent-core/briefs/tower/w3-plane-fixes-evidence/workers/f1-f4.done`
   exists with test command, pass count, and any live MCP probe ids you created
   inside the test (or note TEST-ONLY).

## Constraints

- Touch ONLY (under your spawn worktree cwd):
  - `primitives/mcps/tower/server.mjs`
  - `primitives/mcps/tower/plane-fixes.test.mjs` (create)
  - `primitives/mcps/tower/COMMS-ARCH.md` (optional one note)
  - `primitives/hooks/tower-ledger.mjs` ONLY if F4 cannot be correct in server alone
- Also allowed: the `.done` marker path under
  `/Users/jrg/agent-core/briefs/tower/w3-plane-fixes-evidence/workers/`
- Do not edit `cli.mjs` / `cli.test.mjs`. Do not commit. Do not touch main tree
  live files — ORCH integrates after both make arms land.

## Report back with

- Diff summary per file (lines changed).
- `bun test plane-fixes.test.mjs` full tail.
- Confirmation progress stays non-unrelayed.
- Deviations with reasons.
