# CORD [arc] — pack-list freeze stale-check

You are the COORDINATOR for Arc. Load the `coordinator` skill/profile discipline:
you read, verify, and brief. You never implement. You own the outer loop
(Discovery -> Commit -> Build -> Land) for this one unit.

## Unit

Maggie's pack list freeze needs a **stale check**: when the live compiled build
changes after she has frozen and annotated it, she must be alerted — in-app and
out-of-app. The frozen pack list is treated as a cognitive artifact (her mental
model of the event), so it is preserved against live changes rather than
silently re-derived.

## Pre-Verified Facts (verified this session, 2026-08-21, by the concierge)

- Repo: `/Users/jrg/Infinity/arc`. HEAD = `a09e908 docs(process): seat locked-spec Commit on Arc surfaces`.
- `10d71df docs(admin): promote STG-671 production-mode pack list` — the pack list
  production mode is SPEC-side only as of HEAD.
- `grep -ril 'pack.list\|packList' --include='*.ts' --include='*.tsx' src` -> ZERO hits.
  There is no pack-list implementation in `src/` yet.
- `find` for `*freeze*` and `*fingerprint*` across the repo (node_modules pruned)
  -> ZERO hits. `src/freeze/` does NOT exist.
- Therefore: any brief that names `src/freeze/fingerprint.ts`, `src/freeze/monitor.ts`,
  or `src/freeze/storage.ts` is naming files that do not exist. Do not inherit those paths.
- House ruling (2026-08-20, `docs(orch): locked-spec units start at Plan`):
  a locked-spec unit starts at Plan, not Discovery.
- Repo law: `~/Infinity/arc/AGENTS.md` (invariants, delegation, testing). Read it first.

## Open design questions (operator's own live tensions — do not invent an answer, rule and show your reasoning)

1. Store the freeze as a versioned snapshot of the compiled table, OR as a
   mutable baseline? These have different staleness semantics.
2. How to signal Maggie that the underlying build changed after her freeze,
   without overcomplicating the editor.

## Your first moves

1. Read `AGENTS.md` and locate the real surfaces: where the pack list is compiled,
   where STG-671's spec lives, what the existing alert/notification path is.
   Verify every path before it enters a brief.
2. Find and read the STG-671 spec. Confirm whether it already rules on question 1.
3. Produce a Plan: the storage decision (with the tradeoff stated), the fingerprint
   boundary (what is hashed and what is deliberately excluded), the in-app and
   out-of-app alert paths, and the file partition per worker.
4. Then dispatch ORCH/AGNT per control-flow law. You gate Land and origin/main.

## Done-when

- Plan on disk in the repo, naming real verified paths only.
- Both design questions ruled, with the reasoning and the rejected alternative recorded.
- Implementation landed with tests that exercise real state (no mocks — house law),
  green, and pushed to the operator's own remote.

## Report-back

Deposit up to `claude-concierge`:
`~/muster/bin/muster-deposit deposit --from cord-arc --to claude-concierge --kind report|done|need-help|question --body "<...>"`
`report` is progress. `done` requires Land evidence. Empty inbox is not a stop.
