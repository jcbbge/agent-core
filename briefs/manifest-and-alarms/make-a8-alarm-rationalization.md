# MAKE A8 — Alarm rationalization (code + tests)

Repo: `/Users/jrg/agent-core`. Branch: `fix/a8-alarm-rationalization` (HEAD docs commit `73fd284` already landed COMMS-ARCH + RESPONSIBLE-PARTY A8 doctrine — do not rewrite doctrine). Do NOT use emojis anywhere. Do NOT commit (ORCH integrates).

Mission: stop content-free ledger `question` rows from entering `openQuestions` / blocking turn-end / routing to operator. Validate at emit; dead-letter malformed legacy rows idempotently; keep legacy-but-valid questions (non-empty message, optional missing `from`) in inbox.

## Pre-Verified Facts (ORCH verified 2026-08-14)

- Live content-free questions in `~/.tower/ledger.jsonl`: `t-mr32yq0p-nj75` and `t-msrop8g6-w17h` — keys only `id,ts,cwd,kind` (no `from`, `message`, `to`). Confirmed via python parse this session.
- `~/.tower/dead-letter.jsonl` does NOT exist yet.
- `~/agent-core/primitives/hooks/tower-ledger.mjs`:
  - `LEDGER` at L25; `append(file, obj)` at L115–131 — no question validation today.
  - `inboxStateFromFull` L419: `openQuestions = rows.filter((r) => r.kind === 'question' && !answeredIds.has(r.id))`
  - `deriveInboxState` L436: same filter.
  - Exports `_test.inboxStateFromFull` etc. at L472–478.
- `~/agent-core/primitives/mcps/tower/lib.mjs` re-exports ledger (`export * from '../../hooks/tower-ledger.mjs'`). `deriveInboxStateFromCursor` L49 has the same unfiltered `openQuestions` filter — must also filter (or call shared helper).
- `~/agent-core/primitives/mcps/tower/server.mjs` `ask_user` L208–211: builds `{kind:'question', from, message: args.question, ...}` and `append(LEDGER, entry)` with no empty check.
- Doctrine already on branch at `73fd284`: COMMS-ARCH §Alarm rationalization + Hard invariants; RESPONSIBLE-PARTY `effectiveTo` well-formed-first. Optional A1 pointer already present (~COMMS-ARCH L241). Do not touch doctrine files.
- `cli.test.mjs` fixtures `questionNoMessage` id `t-mr32yq0p-nj75` (render safety only today).
- Test baseline (this session): `cd ~/agent-core/primitives/mcps/tower && bun test` → 93 pass / 1 skip / 7 fail. Failures are pre-existing unrelated (server.bak, relay_inbox, board drift, etc.). A8 must not add failures; new A8 tests must pass. Do not "fix" the 7 unrelated fails.
- Deployed `~/.tower/*` are symlinks into canonical — edit canonical only (`primitives/hooks/tower-ledger.mjs`, `primitives/mcps/tower/{lib,server,cli.test}.mjs` or new test file beside them).
- `~/herdr-spine/extensions/tower-auto.ts` already rejects empty question (~L415–420). Prefer shared validate in ledger `append` so twin MCP paths stay consistent; do NOT edit herdr-spine in this unit unless drift-check requires a one-line import (prefer not).
- Out of scope: rotating/compacting live ledger; deleting historical rows; A2; cursor-shim; `models.json`; other dirty trees.

## Parallel Work Notice

- Board topic: `tower/manifest-and-alarms`. Post CLAIM then findings with `--from` your role (`AGNT a8-coder` / `AGNT a8-test-maker` / etc.).
- Ignore dirty `primitives/profiles/models.json` and unrelated untracked briefs.
- CORD Tower + A2 shape work may be concurrent — do not touch `A1-NIGHT-ORDERS.md` or `A2-GROUND-MANIFEST-SHAPE.md`.

## Tower

- Post claim/finding to `tower/manifest-and-alarms`.
- No operator mail. nQ=0.
- Write `.done` under `briefs/manifest-and-alarms/workers/` when your partition is complete (e.g. `a8-coder.done`, `a8-test-maker.done`).

## Contract — well-formedness (binding for both sides)

`isWellFormedQuestion(row)` returns true iff:
1. `row.kind === "question"`, AND
2. `typeof row.message === "string"` AND `row.message.trim().length > 0`.

`from` policy (document in coder finding):
- **New emits** (`ask_user` / append of new questions): require non-empty trimmed `from` as well (loud reject if missing).
- **Inbox / legacy-valid**: a historical row with non-empty `message` but missing `from` MAY remain openQuestions (legacy-valid). Content-free rows (no message) are never inbox-eligible.

Malformed (not well-formed question of kind question, or kind question failing the message rule): never in `openQuestions`; on discovery during inbox derive/read, dead-letter once.

## Tasks — Implementer (coder)

Touch ONLY:
- `primitives/hooks/tower-ledger.mjs`
- `primitives/mcps/tower/lib.mjs` (only if needed to wire `deriveInboxStateFromCursor`; prefer exporting helpers from ledger and using them in both places)
- `primitives/mcps/tower/server.mjs` (`ask_user` refuse path)

1. Export `DEAD_LETTER = join(TOWER, 'dead-letter.jsonl')` beside `LEDGER`.
2. Export `isWellFormedQuestion(row)` per contract above.
3. Export `deadLetterMalformedQuestion(row)` — append once to DEAD_LETTER:
   `{id, ts, cwd, kind:"dead-letter", reason:"malformed-question", ref:<original id>, row:<original>}`
   Idempotent by original id (scan existing dead-letter refs; no flood). Use `append()` for the write.
4. In `append(file, obj)`: when `file === LEDGER` (or path ends with ledger.jsonl) AND `obj.kind === "question"` AND not well-formed (message rule; and for new emits also empty from), throw Error with loud message — do not persist. (Whitespace-only message must reject.)
5. Filter `openQuestions` in `inboxStateFromFull` and `deriveInboxState` to well-formed only. When a scoped/unscoped read encounters unanswered malformed questions, call dead-letter helper (idempotent) without including them in openQuestions.
6. `lib.mjs` `deriveInboxStateFromCursor`: same openQuestions filter + dead-letter side effect (or shared helper used by all three sites).
7. `server.mjs` `ask_user`: before append, if `!(args.question && String(args.question).trim())` OR missing/empty `from`, return loud error string and do not append. (Defense in depth even if append also throws.)

Done when: exports exist; append cannot persist content-free questions; both inbox derive paths exclude content-free; dead-letter path exists; ask_user returns error string without persist; doctrine files untouched.

Do NOT write or edit test files (test-maker owns tests). Do NOT commit.

## Tasks — Test-Maker

Touch ONLY test files under `primitives/mcps/tower/` (prefer new `a8-alarm.test.mjs` or extend `cli.test.mjs`). Do NOT read or edit implementation files under `hooks/` or `server.mjs` / `lib.mjs` bodies beyond importing public exports the brief names.

Write tests (no mocks) that assert intent:

1. `isWellFormedQuestion` — false for `{kind:"question"}` / whitespace message; true for non-empty message; document from policy via comments matching contract.
2. Emit reject — calling `append(LEDGER, contentFreeQuestion)` throws OR using a temp ledger path via env if the harness supports it; must prove content-free cannot persist. If live LEDGER must not be polluted: use `TOWER` override / temp dir if existing tests show a pattern; else test the predicate + a small exported `assertQuestionAppendable(obj)` if coder exports it — prefer testing against temp files. **Never append content-free rows to the live `~/.tower/ledger.jsonl`.**
3. Inbox exclusion — given fixture shape of `t-msrop8g6-w17h` / `questionNoMessage`, `openQuestions` from derive helpers must not include it (unit-level with injected rows / `_test.inboxStateFromFull` if temp LEDGER feasible; else pure filter helper tests).
4. Dead-letter idempotence — two calls with same original id → one dead-letter row (temp DEAD_LETTER path if possible).

Done when: tests exist on disk covering 1–4; no implementation edits; no commit.

## Tasks — Tester (after both land)

Run: `cd ~/agent-core/primitives/mcps/tower && bun test`
- New A8 tests must pass.
- Pre-existing 7 fails may remain; do not expand scope to fix them.
- Report pass/fail counts and which A8 tests ran.

## Constraints

- NO MOCKS.
- Stage nothing; do not `git add` / commit.
- Match surrounding style; minimal comments.
- One plate: coder owns impl files; test-maker owns test files only.

## Report back with

- Files touched + per-file summary
- Exact export names added
- `from` policy one-liner
- Test file path + test names
- Deviations with reasons
- Path to worker `.done` marker
