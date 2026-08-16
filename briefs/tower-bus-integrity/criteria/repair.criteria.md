# Criteria — AGNT repair (authored by ORCH board-repair, before implementation)

Authored by the verifier, not the implementer. This task rewrites a live,
append-only bus that other agents are writing to. Data loss is the failure mode
that matters; a clean integrity line over a truncated board is the worst
possible outcome and must be caught here.

## R1 — the integrity line is clean
`bun ~/.tower/cli.mjs board agent-core/tower-bus-integrity` emits
`integrity: 0 unparseable lines on board`, captured verbatim.

## R2 — a verified backup existed before the first write
Backup file exists; source sha256 == backup sha256, both recorded, both taken
BEFORE the swap. Timestamps prove the ordering.

## R3 — 26 in, 26 accounted for
`quarantine/DISPOSITION.md` lists all 26 original line numbers, each marked
repaired-in-place or quarantined-with-reason. No line number missing, none
invented.

## R4 — the arithmetic closes
`post_swap_lines == pre_swap_lines - removed + recovered + appended_during_swap`
with every term a real measured number, and the identity actually holding.

## R5 — no live row was lost (the one that matters)
The tail beyond line 2577 is byte-identical before and after the swap, proven by
hash. Independently: every `id` present in the pre-swap backup is present in the
post-swap board, except those explicitly quarantined. Check this by extracting
ids from both and diffing — a row count that matches while an id vanished is
still data loss.

## R6 — recovered rows kept their identity
Spot-check at least three recovered rows: original `id`, `ts`, `from`, `topic`,
`cwd` preserved, body not rewritten.

## R7 — the swap was atomic and claimed
A `rename` was used, not a truncate-rewrite. A `spine-claim` on
`~/.tower/board.jsonl` was held across the procedure and released after.

## R8 — nothing carrying the credential is staged
`git status --short` shows no staged file containing `srt:[0-9a-f]{32}`.
Backups and quarantined raw rows are untracked or ignored.

## R9 — the board still parses end to end
A full re-parse reports `bad_count: 0` over `total_nonempty` lines, and
`total_nonempty` is consistent with R4.
