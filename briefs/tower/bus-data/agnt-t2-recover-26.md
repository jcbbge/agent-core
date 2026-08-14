# AGNT [recover-26] — append-only recovery of unparseable board lines

Repo `/Users/jrg/agent-core`. Live board `~/.tower/board.jsonl` under concurrent append. Recover the 26 bad lines by APPEND of well-formed rows + quarantine of raw bytes. Do NOT rewrite, truncate, or delete anything on the live board. Do NOT use emojis anywhere.

## Pre-Verified Facts (ORCH verified 2026-08-13 this session)

- Bad line numbers (exact): **1, 2, 3, 553, 2113, 2502, 2504, 2507, 2511, 2513, 2514, 2515, 2516, 2521, 2523, 2525, 2527, 2530, 2542, 2556, 2559, 2569, 2571, 2573, 2574, 2577.**
- Inventory (T1 output, required input): `/Users/jrg/agent-core/briefs/tower/bus-data/INVENTORY.json` — read it first; use its damage_class and extractable fields.
- Backup exists under `briefs/tower/bus-data/backups/` — do not modify backups.
- Quarantine dir: `briefs/tower/bus-data/quarantine/`.
- CORD ruling: append-only recovery; provenance must state original line number, damage class, inferred-vs-read. No fabricated authors/ids/topics.
- Prior precedent: commit `8e54604` appended recovery rows; left bad lines in place.
- Post via `bun ~/.tower/cli.mjs post ... --from "AGNT recover-26"` from `/Users/jrg/agent-core`. For structured recovery rows that are not claim/finding/note, use a well-formed JSON object written ONLY through a small script that calls `JSON.stringify` + `fs.appendFileSync` (same shape as tower-ledger append) — NEVER shell-escaped hand JSON / printf / echo. Prefer cli.mjs when the row is a normal note/finding.
- Recommended recovery row shape (fields):
  - `type`: `"note"` (or `"finding"` if substantive)
  - `from`: `"AGNT recover-26"`
  - `topic`: `"tower/bus-data"`
  - `body`: human-readable summary
  - plus nested or body-embedded provenance: `recovery_of_line`, `damage_class`, `recovered` object with only fields marked `read` in inventory, `inferred` object only when clearly labeled inferred, `source_sha256` of backup used
- Concatenated lines (e.g. L2502 class): one appended row per recoverable object, each with provenance.
- Genuinely unrecoverable: write raw bytes to `briefs/tower/bus-data/quarantine/line-NNNN.raw` and append a note stating unrecoverable + quarantine path.

## Parallel Work Notice

- Sibling AGNT attribute-46 and AGNT compaction-proposal may run in parallel — they must not touch quarantine/ or your recovery notes' exclusive files. You own `quarantine/**` and `briefs/tower/bus-data/RECOVERY-REPORT.md`.
- Concurrent board appenders (w2X/w2Y) are live — append only; never seek/rewrite.
- Ignore unrelated dirty tree paths.

## Tower

- CLAIM first: topic `tower/bus-data`, from=`AGNT recover-26`.
- Finding when all 26 processed with counts (recovered / quarantined / parse check of new rows).
- Do not echo hand-built JSON into board.jsonl.
- spine-report task/verdict on Herdr.

## Tasks

1. Read INVENTORY.json; abort with board note to ORCH if missing or bad_lines≠26. — done when: inventory loaded.
2. For each of the 26: extract from live file by line number (do not trust backup alone for current bytes — prefer live line; if live differs from inventory note it). Classify; if recoverable, append well-formed recovery row(s) via JSON.stringify path; if not, quarantine raw + append unrecoverable note. — done when: 26/26 handled; each recoverable case has ≥1 new parseable append; quarantine files exist for unrecoverable.
3. Parse-check: scan board — original 26 lines may still fail parse (expected); every row YOU appended must `JSON.parse`. Record new line numbers of your appends in RECOVERY-REPORT.md. — done when: report proves zero parse failures among your appends.
4. Write `briefs/tower/bus-data/agnt-t2-recover-26.done`.

## Constraints

- Touch ONLY: `briefs/tower/bus-data/quarantine/**`, `briefs/tower/bus-data/RECOVERY-REPORT.md`, `briefs/tower/bus-data/agnt-t2-recover-26.done`, and append-only writes to `~/.tower/board.jsonl` via JSON.stringify. Do not commit. Do not modify INVENTORY.json or backups.
- No in-place rewrite of any board line.
- No mocks.

## Report back with

- recovered count / quarantined count / concatenated-split count
- RECOVERY-REPORT.md path
- proof commands + tails showing your appends parse
- list of unrecoverable lines with why
