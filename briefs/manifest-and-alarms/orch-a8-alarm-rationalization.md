ORCH A8 — Alarm rationalization: reject content-free questions; dead-letter; no operator fallback for malformed.

Repo: ~/agent-core (Tower canonical under primitives/mcps/tower/ + primitives/hooks/tower-ledger.mjs). Deployed ~/.tower/* are symlinks into canonical — edit canonical only. Do NOT use emojis anywhere.

Mission: stop content-free ledger `question` rows (`id/ts/cwd/kind` only) from blocking turn-end and routing to the operator via the legacy `effectiveTo` fallback. Validate at emit; dead-letter malformed; keep legacy-but-valid questions working.

## Pre-Verified Facts (CORD Tower verified 2026-08-14)

- Brief: `/Users/jrg/agent-core/briefs/A1-A2-A8-manifest-and-alarms.md` §A8.
- Live content-free questions in `~/.tower/ledger.jsonl`: `t-mr32yq0p-nj75` (2026-07-02) and `t-msrop8g6-w17h` (2026-08-13) — only keys `id,ts,cwd,kind` (no `from`, `message`, `to`).
- `cli.test.mjs` already fixtures `questionNoMessage` (id `t-mr32yq0p-nj75`) for render safety — extend tests for inbox exclusion + emit reject.
- Inbox choke points (both must filter):
  - `~/agent-core/primitives/hooks/tower-ledger.mjs` `inboxStateFromFull` / `deriveInboxState` (~L419, ~L436): today `openQuestions = all unanswered kind:question`.
  - `~/agent-core/primitives/mcps/tower/lib.mjs` `deriveInboxStateFromCursor` (~L49): same filter.
- Emit paths that mint questions:
  - `~/agent-core/primitives/mcps/tower/server.mjs` `ask_user` (~L208–211) — appends without validating non-empty `message`.
  - `~/herdr-spine/cc-hooks/server.mjs` twin ask_user (same shape) — keep drift-check green if you touch MCP server; prefer shared validate in ledger append.
  - `~/herdr-spine/extensions/tower-auto.ts` already rejects empty question before append (~L415–420).
  - `40-tower-bridge` mints with `$q` token + `to:"operator"` — well-formed when it mints; do not invent screen-scrape questions.
- Doctrine (edit canonical; deployed are symlinks — verified):
  - `~/agent-core/primitives/mcps/tower/COMMS-ARCH.md` Hard invariants: "Rows without `to` are legacy: kind `question` defaults to operator-visible" (~L159–163) — this fallback is the storm. Amend: malformed ≠ legacy-valid.
  - `~/agent-core/primitives/mcps/tower/RESPONSIBLE-PARTY-AND-NQ.md` `effectiveTo(q)` (~L66–67): `else (legacy, no to) operator` — amend: only when well-formed.
- A1 night orders already on disk (do not rewrite): `briefs/manifest-and-alarms/A1-NIGHT-ORDERS.md`.
- A2 shape proposal is separate (`A2-GROUND-MANIFEST-SHAPE.md`); do not implement A2 exhaust in this unit.
- Test runner: `cd ~/agent-core/primitives/mcps/tower && bun test` (and ledger tests beside `tower-ledger.mjs` if present).

## Parallel Work Notice

- CORD Tower owns coordination on `tower/manifest-and-alarms`; A2 co-sign is with CORD cursor-shim — ignore their files under `~/cursor-shim`.
- Ignore unrelated dirty trees under agent-core (models.json, other briefs, .verify, etc.). Touch only A8 files listed in Done-when.
- Board topic: `tower/manifest-and-alarms`. Field claim the WA for A8 if/when CORD emits one; otherwise claim via board + heartbeat on this brief.

## Tower

- Post claim/finding/done to board topic `tower/manifest-and-alarms` with `--from "ORCH a8-alarms"`.
- Field: claim with `ref`, heartbeat ~20s TTL 30s, `work-done` with evidence (commit sha + test output path).
- No operator mail unless blocked on a real decision (you should not need one).
- nQ=0 before work-done.

## File partition (you own)

1. `primitives/hooks/tower-ledger.mjs` — shared `isWellFormedQuestion(row)`, reject/throw or return error from `append` when `kind==="question"` and malformed; filter `openQuestions` to well-formed only; on read of legacy malformed, append once to dead-letter surface (see below) without putting them in inbox.
2. `primitives/mcps/tower/lib.mjs` — same openQuestions filter (or import shared helper from ledger).
3. `primitives/mcps/tower/server.mjs` — `ask_user`: refuse empty/whitespace `question` before append; return loud error string (do not persist).
4. Dead-letter: `~/.tower/dead-letter.jsonl` (path constant beside LEDGER in tower-ledger.mjs) — append `{id,ts,cwd,kind:"dead-letter",reason:"malformed-question",ref:<original id>,row:<original>}`. Idempotent by original id (do not flood).
5. `COMMS-ARCH.md` + `RESPONSIBLE-PARTY-AND-NQ.md` — doctrine paragraphs for emit validation + malformed vs legacy-valid + dead-letter (CORD drafted intent in A1; you land the mechanical wording). Optional one-line pointer from COMMS-ARCH notifications section to `briefs/manifest-and-alarms/A1-NIGHT-ORDERS.md`.
6. Tests: unit tests for well-formed predicate, emit reject, inbox exclusion of content-free fixture, dead-letter idempotence. Prefer temp ledger via env if existing tests do; else pure function tests.

Out of scope: rotating/compacting live ledger; deleting historical rows; A2 ground manifest hooks; cursor-shim A3.

## Branch / land

- Branch first from main: `fix/a8-alarm-rationalization` (or equivalent).
- One unit, one branch, one PR if remote expects it; otherwise land commit on branch and report sha. Stage explicitly — never `git add -A`.
- Commit message follows agent-core handoff convention (PHASE/DONE/TODO).

## Done-when (all required)

1. `isWellFormedQuestion` rejects rows missing non-empty string `message` (trim). Document whether `from` is required — prefer required for new emits; legacy with message but no from may remain "legacy-valid" for inbox if you justify in finding.
2. `ask_user` / append path cannot persist content-free questions (test proves reject).
3. `inboxState` / cursor derive paths never list content-free questions in `openQuestions` (test with fixture shape of `t-msrop8g6-w17h`).
4. Malformed legacy rows can be dead-lettered without appearing as operator-blocking open questions.
5. COMMS-ARCH + RESPONSIBLE-PARTY amended: operator fallback applies only to well-formed questions; malformed → dead-letter, never doorbell.
6. `bun test` in `primitives/mcps/tower` passes (and any new ledger tests).
7. Board finding + `.done` marker under `briefs/manifest-and-alarms/` with commit sha; field `work-done` if you claimed a WA.

## Report-back

Board finding on `tower/manifest-and-alarms`: files touched, sha, test counts, residual risks. Reap yourself when CORD verifies.
