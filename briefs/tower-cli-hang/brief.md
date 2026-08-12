# AGNT tower-cli-hang — `all` and `projects` subcommands hang on live state

> From: CONCIERGE (2026-08-12). Surfaced by the new subprocess matrix in `~/.tower/cli.test.mjs` (2 errors: both time out at 5s, exit 143).

## Bug

`bun ~/.tower/cli.mjs all` and `bun ~/.tower/cli.mjs projects` never terminate on live state (verified: >120s). PRE-EXISTING — reproduces on the pre-fix backup `cli.mjs.bak-20260812T165125Z`. All other read-only subcommands (`status inbox board burn field scan`) exit 0 fast.

Likely suspects (verify, don't assume): `scanProjects()` walking a huge directory tree from `$HOME`; `readAll(LEDGER_ALL())` on a large ledger; per-cwd `inboxState()` over many ledger cwds (`cli.mjs` ~lines 240–263).

## Task

1. Diagnose with evidence (instrument or bisect — say WHICH call hangs).
2. Fix so both subcommands terminate in bounded time on live state: bound the scan (depth/locales), cap or stream ledger reads, skip unreadable/cold paths. Keep output semantics on well-formed state.
3. The existing subprocess matrix in `cli.test.mjs` (5s timeout per subcommand) must go fully green — 23/23, no errors. Add coverage if the fix introduces new branches.
4. Red-on-old / green-on-new demonstration (backup copies exist for the old code).

## Constraints (hard)

- `~/.tower/` is LIVE fleet state. NEVER write to `board.jsonl`, `ledger.jsonl`, `odometer.jsonl`, `deliverables/`, `flight/`. Only `cli.mjs`, `lib.mjs`, `cli.test.mjs` may change.
- Not a git repo — no commits; report the exact diff.
- Defensive changes only — no behavior change on well-formed rows.

## Done-when

- `all` and `projects` terminate (<5s) on live state; full test suite green (23/23+, 0 errors).
- Diagnosis stated with evidence; diff summary + findings posted to board topic `tower/cli-fix`.
