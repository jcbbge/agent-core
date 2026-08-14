# ORCH [w3-plane-fixes] — Close F1, F9, F4 so the exercise axis can go green

You own ONE unit: fix the three live plane defects W3 proved, with tests and
live re-proof. Do NOT use emojis. Data/writer/compaction stay with bus-data.

Your CORD is `CORD [Tower]` (w2Y:p1). Dispatch AGNTs via `cursor-fleet`; workers
never commit; you gate. Work in a **git worktree** — the main
`~/agent-core` checkout currently serves live symlinks from
`tower/board-write-path-hardening` and must not be branch-switched.

## Pre-Verified Facts (CORD 2026-08-13)

1. W3 UNIT GO — evidence `briefs/tower/w3-prove-planes-evidence/FINAL.md`.
   Fully-operational NO-GO until these three close.
2. **F1 CONFIRMED LIVE:** `server.mjs` `send_to_user` builds
   `{ id, ts, cwd, kind, title, from, message }` with **no `to`**.
   `tower-ledger.mjs:349-353` requires `deliverable && to==='operator'` for
   unrelayed; alert allows `to` undefined. Probe `t-msrktfc5-p1ey` has
   `to: null`. Tool return still claims turn-end guard for non-progress.
3. **F9 CONFIRMED LIVE:** `cli.mjs` `board` branch calls `boardFor(cwd)` and
   **ignores** `process.argv[3]` topic. With-topic and without-topic outputs
   byte-identical (52 lines). MCP `board_read` already passes `{ topic }`.
4. **F4 CONFIRMED LIVE:** `server.mjs:236-239` `mark_relayed` only appends
   `{ kind:'ack', ids }` — no check that ids are unrelayed, no proof of
   display. Clearing is trust-on-say-so.
5. COMMS-ARCH migration item 4 already names the F1 fix. Schema for authored
   board rows (type+from) was landed by bus-data — do not fight it.
6. Fence: do not rewrite `board.jsonl`; do not change write-path authorship
   rules except as needed for ledger `to` field; post writer issues to
   `tower/bus-data`.
7. Branch from current tip (includes write-path hardening). Topic:
   `tower/w3-plane-fixes` + gate posts to `tower/fully-operational`.

## CORD AUTHORIZE-FIX (explicit)

You are authorized to patch:
- `primitives/mcps/tower/server.mjs` — F1 + F4
- `primitives/mcps/tower/cli.mjs` — F9
- `primitives/hooks/tower-ledger.mjs` — only if F4 needs ack semantics help
- `primitives/mcps/tower/cli.test.mjs` and/or new focused tests beside them
- `primitives/mcps/tower/COMMS-ARCH.md` — one short note if the migration item
  closes

## Tasks

1. **F1** — done when: `send_to_user` for `kind` in `{deliverable, alert}` sets
   `to: 'operator'` (or accepts explicit `to` if schema adds it, defaulting
   operator). `progress` stays non-blocking / not unrelayed. Live proof:
   post a probe deliverable, show it in `inboxState(...).unrelayed` (or
   `cli.mjs status` unrelayed list). Test locks the default.
2. **F9** — done when: `bun ~/.tower/cli.mjs board <topic>` filters to that
   topic (project scope still via cwd). Empty topic / omitted arg keeps
   current project-wide listing. Live proof: with-topic output ≠ without-topic
   when multiple topics exist; probe rows under `tower/w3-plane-fixes` appear
   only in filtered view. Test locks filter.
3. **F4** — done when: `mark_relayed` refuses ids that are not currently in
   the caller's unrelayed set (clear error, no ack row for refuses), and
   documents that the operator-facing relay path is the intended clearer.
   Stronger display-proof is welcome if cheap; minimum is no silent clear of
   arbitrary ids. Live proof + test.
4. **Re-prove + report** — done when: evidence dir
   `briefs/tower/w3-plane-fixes-evidence/` with before/after; board final on
   `tower/fully-operational`; `.done` written; recommend GO/NO-GO for
   exercise-axis fully-operational.

## Constraints

- Worktree only; never `git checkout` away from live tip in main tree.
- Do not push. Do not touch bus-data compaction. Do not delete state.
- No mocks. Visible panes only.
- After deploy-affecting edits: `bun ~/.tower/cli.mjs status` EXIT 0; note
  drift-check may still FAIL on bus-data's write-path.test REPO_ONLY gap —
  that is their item, not yours to "fix" by deleting tests.

## Report back with

SHAs, test tails, live probe ids, GO/NO-GO for exercise axis.
