# AGNT test-maker bounce nQ1 — flock-integrity oracle fix

Arbiter nQ1 ruled **BAD TEST** → you. Do NOT use emojis. Do not touch implementer code (`tower-ledger.mjs` / `cli.mjs`).

## Pre-Verified Facts (ORCH + arbiter)

- Plan allowed stats sibling: implementer shipped `readJsonlStats`/`parseJsonl`; `readAllFull` remains `rows[]` for backward compat. Live surface: `cli board` integrity footer (26 / max 2577) — verified.
- Your suite asserted `readAllFull(file).bad_line_count` → undefined (6 fails).
- One fail: ledger `renderMessage` `not.toContain('undefined')` — unspec'd; prior write-path repair used `/from (unknown|\?)/` only. Absolute import to main checkout is wrong — import from worktree/`./lib.mjs` / relative ledger.
- Stress tests already pass — keep them.
- Integration tree (has impl+your tests): `/Users/jrg/.cursor/worktrees/agent-core/wt-orch-flock-integrity`
- Your original test wt: `/Users/jrg/.cursor/worktrees/agent-core/wt-agnt-test-maker-w2z-pg` (may lack impl — prefer editing tests in integration tree OR copy fixed tests there). Prefer work on integration tree for re-runability, OR write fixed files then ORCH copies.

## Parallel Work Notice

- ORCH w2-consumer-resilience claimed tower-ledger — you stay on test files only.
- Do not commit.

## Tower

- from=`AGNT flock-integrity-tests`, topic `tower/bus-data`. CLAIM → fix → finding → `.done`.

## Tasks

1. Fix `primitives/mcps/tower/flock-integrity.test.mjs` (+ criteria if needed):
   - Count assertions use `readJsonlStats` / `parseJsonl` (or destructure from those), not `readAllFull.bad_line_count`.
   - Machine-row render: assert from-fallback only; drop unspec'd undefined-ban; fix absolute ledger import.
2. Optionally run `bun test primitives/mcps/tower/flock-integrity.test.mjs` in integration tree to confirm green (allowed for bounce).
3. Write `briefs/tower/bus-data/agnt-flock-integrity-tests-nq1.done`.

## Constraints

- Touch ONLY: `primitives/mcps/tower/flock-integrity.test.mjs`, `primitives/mcps/tower/flock-integrity.criteria.md`, `briefs/tower/bus-data/agnt-flock-integrity-tests-nq1.done`. Do not commit. Do not edit tower-ledger/cli.

## Report back with

- what changed, test command + pass count, .done path
