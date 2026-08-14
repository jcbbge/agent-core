# ORCH [w3-prove-planes] — Prove every Tower plane by exercise

You own ONE unit: make "fully operational" mean **proven by end-to-end exercise**,
not by reading code and concluding it should work. Drive each plane, capture
evidence on disk, report honest gaps. Do NOT use emojis anywhere.

Your CORD is `CORD [Tower]` (pane `w2Y:p1`, workspace `w2Y`). You report to it.
You decompose and dispatch AGNT workers into your own tab; you never implement
production patches yourself unless a done-when requires a tiny gated fix that
CORD explicitly authorizes mid-unit. Default: prove first, fix only what blocks
proof and is inside Constraints.

---

## Scope fence (concierge 2026-08-13 — hard)

**NOT YOURS — CORD bus-data (w2Z) owns exclusively:**
- Repairing / rewriting `~/.tower/board.jsonl`
- Recovering malformed rows, authorless semantic rows
- Writer patches / write-path changes
- Row-shape schema ruling

If you discover data corruption or writer defects: post once to
`tower/bus-data` and move on. Do not "help."

**Watch `tower/bus-data` for the schema ruling** before asserting a single board
row shape in consumer-resilience claims. Until then: tolerate multiple shapes
(including machine rows without `from`: `lineage`, `verify-gate-bypass`).

**Durable fence file:** `~/agent-core/briefs/tower/CORD-SCOPE-2026-08-13.md`

## Pre-Verified Facts (CORD verified 2026-08-13 this session)

1. W0 CLOSED: agent-core `tower/w0-version-control` @ `cab69eb` (lands `1722f56`);
   `bun ~/agent-core/primitives/mcps/tower/drift-check.mjs` EXIT 0 (0 FAIL);
   `~/.tower/cli.mjs` is symlink, sha matches canonical; herdr-spine `main` =
   `b42132e` (unpushed). Evidence: `briefs/tower/w0-closeout-evidence/`.
2. CLI verbs (from `cli.mjs:293`): `status inbox board post emit field scan burn
   all projects`. Note audit F9: `board <topic>` may silently ignore topic —
   prove or refute live; if true, record as plane defect (fix only if CORD
   authorizes — default is document).
3. MCP tools in `server.mjs`: `send_to_user`, `ask_user`, `reply`, `check_inbox`,
   `mark_relayed`, `board_post`, `board_read`, `relay_inbox`, `pheromone_emit`,
   `pheromone_field`.
4. Project isolation / worktree collapse: `normCwd` / board scoping live in
   `~/agent-core/primitives/hooks/tower-ledger.mjs` (re-exported via
   `~/.tower/lib.mjs`). Prove with a real worktree cwd under
   `~/.spine/worktrees/` or an Arc worktree — one project must not see another's
   rows.
5. Spine bridge handlers exist: `~/herdr-spine/bin/handlers/10-notify`,
   `40-tower-bridge`.
6. Richest prior diagnosis (do not re-audit from scratch):  
   `~/agent-core/briefs/tower-bus-audit-FINDINGS.md`  
   Especially F1 (`send_to_user` never sets `to:"operator"` — 458/467 live
   deliverables exempt from relay guard), F2 (CC answer-path), F4
   (`mark_relayed`), F5 (no request validation), F9 (board topic filter),
   F11 (truncation). F3 (cli drift) is SUPERSEDED by W0 — do not reopen.
7. COMMS-ARCH verbatim guarantee: only operator-addressed mail blocks turn-end
   — alerts, deliverables with `to:"operator"`, open questions. Status flips are
   not mail. Fleet mail must not leak to the operator plane. Prove this with
   ledger/board inspection + tool returns — **do not spam the human**. Prefer
   synthetic rows + reading `inboxState` / ledger tails over doorbell storms.
8. Live bus: Arc fleet posting now; bus-data may rewrite board under lock. Your
   appends must go through MCP/CLI only. Back up nothing destructive; you should
   not need state rewrites for W3.
9. Board topics: your claims/findings → `tower/w3-prove-planes`; gate summaries
   also on `tower/fully-operational`. Post short bodies STANDALONE (never batch
   `board_post` with another tool call).
10. `cli.test.mjs` exists — extend only with tests that lock the proofs you
    establish; do not "fix" unrelated pre-existing failures (hang test, etc.).

## Parallel Work Notice

- CORD bus-data on w2Z — exclusive writer/data lane. Ignore their uncommitted
  edits to board/writer files; do not investigate or "fix" them.
- CORD Tower on w2Y:p1 — gates only.
- Arc ORCHs on w2X — different project; use them as isolation counterparts when
  proving project scoping, do not disturb their work.

## Tower

- MCP preferred (`board_post` / `board_read` / ledger tools).
- CLI: `bun ~/.tower/cli.mjs <verb>…` (BOARD-anchored post path — safe).
- Never `echo >> ~/.tower/board.jsonl`.
- Doorbell: only if a proof step truly requires operator-visible completion per
  COMMS-ARCH rubric — default avoid; record "doorbell not exercised — gap" if
  skipped for safety.

## Tasks

1. **Board plane** — done when: evidence file shows (a) claim/finding/note round
   trip via MCP and CLI; (b) `<project>/<topic>` isolation between two cwds;
   (c) worktree cwd collapses to project via `normCwd` (paste before/after paths
   and which rows each cwd sees); (d) statement of how consumers behave on
   multi-shape rows *without* repairing data — count/tolerate, citing bus-data
   ruling if present else "ruling pending."

2. **Ledger / Q&A plane** — done when: `ask_user` → ledger row → `check_inbox` /
   `relay_inbox` / `reply` / `mark_relayed` exercised with evidence. Prefer a
   closed loop that does **not** require the human: create a question scoped to
   a throwaway cwd, answer via `reply`/`relay_inbox` as the answering party
   would, prove inbox clears. Document F1/F4 behavior as proven or refuted with
   live counts — if F1 still false, that is a **named gap or authorized fix**,
   not a silent pass.

3. **Verbatim guarantee** — done when: matrix of cases with ledger evidence:
   - `send_to_user` deliverable without `to` (current API) — does it enter
     unrelayed? (audit says no — re-prove)
   - alert behavior
   - status/progress does not become operator mail
   - fleet board finding does not appear as operator deliverable  
   Honest gap OK; assumed success is not.

4. **Deliverables, flight, odometer, pheromones** — done when: each has a live
   write+read proof (`pheromone_emit`/`pheromone_field`, flight snapshot
   presence or hook path, odometer burn/scan, deliverables dir append or tool
   path). Paths and exit codes in evidence.

5. **MCP + CLI surfaces** — done when: every MCP tool in fact 3 and every CLI
   verb in fact 2 has a row in
   `briefs/tower/w3-prove-planes-evidence/SURFACE.md` with: invoked how,
   result, pass/fail/gap. Truncation on `board` verb documented.

6. **Spine bridge + doorbell** — done when: `10-notify` and `40-tower-bridge`
   mapped (what events → what board/ledger rows) with at least one live or
   recent-row proof each; doorbell rubric stated with what was / was not safe
   to fire. Gaps named.

7. **Tests that keep it true** — done when: `cli.test.mjs` (or adjacent test
   file under canonical tower home) gains coverage for at least the proofs that
   are mechanical (e.g. topic filter if fixed, isolation helper, send_to_user
   `to` default if CORD authorized a fix). If no code fix this unit, add a
   failing test that encodes F1 or F9 as a regression lock **only if** CORD
   says go — otherwise document the test plan in evidence without landing red
   main.

8. **Final report** — done when: board finding on `tower/fully-operational`
   lists each plane as PROVEN / UNBROKEN / GAP with evidence paths;
   `.done` at `briefs/tower/w3-prove-planes-evidence/.done`.

## Constraints

- Touch ONLY (unless CORD authorizes a specific fix mid-unit via board):
  - `~/agent-core/briefs/tower/w3-prove-planes-evidence/**` (create)
  - optionally `~/agent-core/primitives/mcps/tower/cli.test.mjs` (or new test
    file beside it) for locking proofs — no drive-by refactors
  - production fixes to `server.mjs` / `cli.mjs` / `tower-ledger.mjs` **only**
    if a plane cannot be proven without them AND CORD posts an explicit
    authorize-fix finding first (default is prove + gap)
- Do NOT: mutate `board.jsonl` except via normal append APIs; edit writer
  internals; delete flight/deliverables; push remotes; use in-process
  background subagents — visible panes via `cursor-fleet worker|make` only.
- Live fleets: prefer additive appends under topic `tower/w3-prove-planes`.
- Archive never destroy — W4 is a later unit; do not invent rotation here.

## Report back with

Per plane: PROVEN / UNBROKEN / GAP, exact commands, evidence paths, any nq
used, GO/NO-GO for "planes proven enough to call the bus fully operational
on the exercise axis (data axis owned by bus-data)."
