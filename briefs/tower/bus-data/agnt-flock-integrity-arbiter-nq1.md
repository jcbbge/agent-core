# ARBITER nQ1 — flock-integrity test red

Unit slug: flock-integrity. Integration tree:
`/Users/jrg/.cursor/worktrees/agent-core/wt-orch-flock-integrity` on branch `tower/flock-integrity`.

Do NOT use emojis. Do NOT fix code or tests. Verdict only. Write
`briefs/tower/bus-data/agnt-flock-integrity-arbiter-nq1.done` with ruling.

## Pre-Verified Facts (ORCH verified)

- Plan brief: `briefs/tower/bus-data/agnt-flock-integrity.md` done-when for T3:
  "`readAllFull` / parse path returns or records `{ rows, bad_line_count, bad_line_numbers? }`"
  — "or records" allows a stats sibling.
- Implementer: `readAllFull` still returns `rows[]`; added `parseJsonl` + `readJsonlStats`;
  cli `board` footer shows live count. Proof: FLOCK-INTEGRITY-PROOF.md.
- Test-maker: `flock-integrity.test.mjs` asserts `readAllFull(file).bad_line_count`.
- `bun test primitives/mcps/tower/flock-integrity.test.mjs` in integration wt: **3 pass / 7 fail** (ran twice, same).
- Passing: concurrent stress concat=0; single-process append; one renderMessage(lib) case.
- Failing: all `readAllFull(...).bad_line_count` expects (undefined); one renderMessage(ledger)
  `not.toContain('undefined')` — output has second line literally `undefined` (same class as
  prior write-path flake that was repaired to `/from (unknown|\?)/` without banning the word undefined in message body).
- Live integrity via integrated cli: `integrity: 26 unparseable line(s) on board (max bad line 2577)`.
- write-path.test.mjs still 13/13 on same tree.

## Tasks

1. Rule exactly one: BAD TEST | BAD IMPLEMENTATION | PRE-EXISTING/OUT-OF-SCOPE.
2. One-line rationale + route (test-maker / coder / human).
3. Write `.done` with ruling.

## Constraints

- Touch ONLY: `briefs/tower/bus-data/agnt-flock-integrity-arbiter-nq1.done` (and optional short report under briefs/tower/bus-data/). No production edits.

## Report back with

- ruling, rationale, route, .done path
