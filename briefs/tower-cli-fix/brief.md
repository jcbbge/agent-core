# AGNT tower-cli-fix — defensive parsing in ~/.tower/cli.mjs

> From: CONCIERGE (operator directive 2026-08-12, "fan out for 8"). Small fix, one agent.

## Bug

`bun ~/.tower/cli.mjs status` crashes:

```
TypeError: undefined is not an object (evaluating 'p.message.slice')
    at /Users/jrg/.tower/cli.mjs:95:66
```

Some `ledger.jsonl` entries lack a `.message` field; the CLI assumes it. Observed live 2026-08-12 ~18:28 UTC. The MCP server path (`~/.tower/server.mjs`) is unaffected — this is CLI-side rendering only.

## Task

1. Fix the crash at `cli.mjs:95` (defensive access, sensible fallback rendering for entries missing `message`).
2. Audit ALL of `cli.mjs` for the same class of bug — every property access on parsed JSONL rows (ledger, board, odometer) must tolerate missing/malformed fields. Rows are append-only and written by many harnesses; partial rows are a fact of life.
3. Regression coverage: check for an existing test setup under `~/.tower/`; if none, add a minimal `cli.test.mjs` (bun test) with fixture rows reproducing the crash shape. Demonstrate red-on-old / green-on-new.
4. Verify every cli.mjs subcommand exits 0 against the LIVE state files.

## Constraints (hard)

- `~/.tower/` is LIVE fleet state. NEVER write to `board.jsonl`, `ledger.jsonl`, `odometer.jsonl`, `deliverables/`, `flight/`. Read-only against state. Only `cli.mjs` (+ new test file) may change.
- Not a git repo — no commits. Report the exact diff in your final message.
- Do not touch `server.mjs` or any other file.

## Done-when

- `bun ~/.tower/cli.mjs status` (and all other subcommands) exit 0 on live state.
- Regression test exists and was demonstrated red against the old code, green against the fix.
- Findings posted to board topic `tower/cli-fix` with the diff summary.
