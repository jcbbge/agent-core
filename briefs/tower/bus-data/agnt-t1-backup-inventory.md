# AGNT [backup + inventory] — T1 before any board mutation

Repo `/Users/jrg/agent-core`. Live board `~/.tower/board.jsonl` is append-only and under concurrent write from Arc (w2X) and Tower (w2Y). Your job is ONLY backup + inventory — no recovery appends, no attribution, no code patches. Do NOT use emojis anywhere.

## Pre-Verified Facts (ORCH verified 2026-08-13 this session)

- Seat: ORCH board-data-integrity on `w2Z:p2`; you spawn into workspace `w2Z`. Board topic: `tower/bus-data`.
- Live board at ORCH re-verify: **6465** non-empty lines; **26** fail `JSON.parse`; **6439** parse OK. sha256 source at re-verify: `b728161b4d9d7899c21e811a9c4016ab01c9fc9eb5d70522631b4002288c305e` (will drift — recompute at backup time).
- Unparseable line numbers (exact, stable): **1, 2, 3, 553, 2113, 2502, 2504, 2507, 2511, 2513, 2514, 2515, 2516, 2521, 2523, 2525, 2527, 2530, 2542, 2556, 2559, 2569, 2571, 2573, 2574, 2577.** Last bad = 2577; zero bad after that.
- Failure-mode samples (for inventory classification): L1/L2 non-JSON tool text; L3 truncated mid-object; L553 unescaped body (id=`t-find-1785206344-w1`, from=`worker-1`, topic=`tower-auto`); L2113 invalid escape (id=`ws1-done-1786216197`, from=`ws1`); L2502 concatenated objects (id=`c003-test-runner-claim`, from=`c003-test-runner`).
- Authorless authored rows (parseable, missing/empty `from`, type in claim|finding|note|done): **46** total — note×34, finding×7, claim×3, done×2. Earliest `2026-08-10T23:31:51.611Z` id=`t-msnv8p8c-b9mo`. Machine rows without from (do NOT invent authors): lineage×366, verify-gate-bypass×91 at re-verify.
- Output dirs already exist: `/Users/jrg/agent-core/briefs/tower/bus-data/backups/` and `.../quarantine/`.
- CORD ruling: do NOT compact/truncate/delete/in-place-rewrite `board.jsonl`. T1 only copies.
- Precedent: commit `8e54604` — backup before recovery; do not git-add board backups (credential risk).
- Git branch: `tower/w0-version-control`. Ignore dirty unrelated tree; touch only your partition.
- Post via `bun ~/.tower/cli.mjs post <type> tower/bus-data "..." --from "AGNT backup-inventory"` from `/Users/jrg/agent-core`. Do NOT hand-append JSON to board.jsonl.

## Parallel Work Notice

- CORD tower on w2Y and Arc fleet on w2X append to the same board continuously — your backup is a point-in-time copy; concurrent growth after copy is expected.
- Sibling workers for T2/T3/T4 will spawn AFTER your `.done` is verified — do not start recovery/attribution yourself.
- Ignore uncommitted changes to `primitives/profiles/models.json` and unrelated briefs.

## Tower

- CLAIM first on topic `tower/bus-data`, from=`AGNT backup-inventory`.
- Findings with specific counts when backup+inventory land.
- Shell: `bun ~/.tower/cli.mjs post claim|finding|note tower/bus-data "..." --from "AGNT backup-inventory"`.
- Do not echo hand-built JSON into `~/.tower/board.jsonl`.
- On Herdr: `spine-report task "..."` at start; `spine-report verdict "..."` when done.

## Tasks

1. Byte-identical backup of `~/.tower/board.jsonl` into `briefs/tower/bus-data/backups/board.jsonl.YYYYMMDDTHHMMSSZ.bak` (UTC stamp). Prefer `cp -p` then verify. — done when: sha256 of source and backup match (record both hashes + line counts + backup path in inventory).
2. Build inventory JSON at `briefs/tower/bus-data/INVENTORY.json` containing at minimum:
   - `backup`: path, source_sha256, backup_sha256, source_lines, backed_up_at
   - `bad_lines`: array of 26 objects, each with `line`, `damage_class` (one of: `non_json_text` | `truncated` | `unescaped_body` | `invalid_escape` | `concatenated_objects` | `other`), `raw_byte_len`, `extractable` fields actually readable without guessing (`id`/`from`/`topic`/`type`/`ts`/`cwd`/`body` fragments when present as clear substrings — mark each as `read` vs omit if not present), `recoverable` boolean, notes
   - `authorless_authored`: array of exactly 46 objects with `line`, `id`, `type`, `topic`, `ts`, `cwd`, `body_preview` (≤120 chars), `attribution_candidates` (list of evidence-based guesses from body/cwd/adjacent same-topic — empty array if none; never fabricate a chosen author here)
   - `parse_summary`: total_nonempty, ok, bad_count (must be 26)
   — done when: file parses as JSON; bad_lines length 26; authorless_authored length 46; hashes recorded.
3. Write `.done` marker at `briefs/tower/bus-data/agnt-t1-backup-inventory.done` with one-line summary (backup path + sha match yes/no + counts).

## Constraints

- Touch ONLY: `briefs/tower/bus-data/backups/**`, `briefs/tower/bus-data/INVENTORY.json`, `briefs/tower/bus-data/agnt-t1-backup-inventory.done`. Do not commit. Do not mutate live `board.jsonl`. Do not write quarantine (T2). Do not append recovery rows.
- Do not git-add the backup file.
- Testing: prove sha256 match with `shasum -a 256` (or equivalent) and show command output in report.

## Report back with

- backup path, both sha256s, line counts
- INVENTORY.json path + bad_lines/authorless counts
- damage_class histogram for the 26
- any line that could not yield even fragment fields, and why
- deviations with reasons
