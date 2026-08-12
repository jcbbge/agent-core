# AGNT tower-inbox-fix — defensive row rendering in ~/.tower/lib.mjs

> From: CONCIERGE (operator directive 2026-08-12). Residual flagged by the tower-cli-fix unit (board `tower/cli-fix`, t-msqfluz0-tj3w).

## Bug

`cli.mjs inbox` calls `renderMessage()` in `~/.tower/lib.mjs`, which assumes `m.message` exists. Partial/malformed ledger rows (a fact of life — append-only, written by many harnesses) will crash the inbox view the same way `status` crashed before today's fix.

## Task

1. Harden `renderMessage()` (and any sibling renderers in `lib.mjs` with the same assumption) against missing/malformed fields — sensible fallback rendering, same style as today's `cli.mjs` hardening (`rowPreview`, `dayOf`, `timeOf` helpers there are the pattern; reuse or mirror them).
2. Extend `~/.tower/cli.test.mjs` with regression coverage: fixture rows missing `message`/`ts`/etc. through the inbox render path. Demonstrate red-on-old / green-on-new (keep a timestamped backup copy for the red run, as the prior unit did).
3. Verify `bun ~/.tower/cli.mjs inbox` and all other read-only subcommands exit 0 against LIVE state.

## Constraints (hard)

- `~/.tower/` is LIVE fleet state. NEVER write to `board.jsonl`, `ledger.jsonl`, `odometer.jsonl`, `deliverables/`, `flight/`. Only `lib.mjs` + `cli.test.mjs` may change.
- Not a git repo — no commits. Report the exact diff.
- Do not touch `server.mjs` semantics; `lib.mjs` may be shared with it — keep changes purely defensive (no behavior change on well-formed rows).

## Done-when

- `inbox` + all read-only subcommands exit 0 on live state.
- Regression tests red-on-old / green-on-new, full suite green.
- Findings + diff summary posted to board topic `tower/cli-fix`.
