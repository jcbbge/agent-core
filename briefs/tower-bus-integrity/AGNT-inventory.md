# AGNT — inventory the 26 damaged board rows

Parent: `ORCH board-repair` (pane `w3R:p13`). Project: `agent-core`.
Board topic: `agent-core/tower-bus-integrity`.

Do NOT use emojis anywhere. Do NOT implement anything outside your Touch ONLY
partition. A sibling worker is running in parallel on this same unit.

## Pre-Verified Facts (ORCH verified every one personally on the LIVE board, 2026-08-16T18:12Z)

- `~/.tower/board.jsonl` is **live and growing**: 12503 lines / 6905162 bytes at
  18:12Z (the brief handed to ORCH said 12496 — it grew during briefing). Never
  cache a line count; re-derive it every time you touch the file.
- Ownership `jrg:wheel`, mode `-rw-r--r--`. **Every other file in `~/.tower/` is
  `jrg:staff`.** That group difference is a lead, not a conclusion.
- Exactly **26** lines fail `JSON.parse`. Re-verified against the live file at
  18:12Z; the list is unchanged from the 6472-line era:

  ```
  1 2 3 553 2113 2502 2504 2507 2511 2513 2514 2515 2516 2521 2523 2525
  2527 2530 2542 2556 2559 2569 2571 2573 2574 2577
  ```

- **Nothing after line 2577 is damaged.** Damage timestamps run
  `2026-07-24T09:18:30Z` .. `2026-08-10T09:04:08Z`. ~9900 clean appends since.
- Bun parse errors across the 26: 22x `Unable to parse JSON string`,
  2x `Expected '}'`, 1x `Unexpected identifier "file"`,
  1x `Invalid escape character -`. No raw control chars (`\x00-\x1f`) in any row.

**Rows ORCH read directly (redacted) — these are ground truth, not hypothesis:**

- Line 1 (len 16) is the literal text `1 matches in 1F:`
- Line 2 (len 15) is the literal text `[file] 628 (1):`
- Line 3 (len 91) begins `     0: "spine-fddfcbe6-f459-4f73-bfad-6bc00df13b33", "ts": "2026-07-24T09:18:30Z", "cwd`
  and ends there, truncated mid-key.
  Lines 1-3 together are **captured stdout of a search/grep-style tool**, not
  board rows at all.
- Line 2502 (len 614) is a well-formed compact row
  (`{"id":"c003-test-runner-claim","ts":"2026-08-10T05:18:22Z",...}`) whose tail
  reads `...test-results/"}n{"id": ...`. Note the **literal `n` between `}` and
  `{`** — the row separator arrived as a bare `n`, i.e. a `\n` that lost its
  backslash. Its second half uses **spaced** JSON (`"topic": "herdr-spine"`,
  space after each colon) while its first half is **compact**
  (`"id":"...","ts":"..."`). Two different serializers on one physical line.
- Line 2577 (len 848) has the same shape: compact first half, `"}` then a
  spaced-JSON second half with `"topic": "herdr-spine"`.
- Line 553 (len 863) and line 2113 (len 1566) are single rows, not concatenations.

**The prior inventory (a starting point to re-verify, never to copy)**

- `~/agent-core/briefs/tower/bus-data/INVENTORY.json` classifies the **same 26
  line numbers** (ORCH compared programmatically: identical lists). Schema:
  `{backup, bad_lines[], authorless_authored, parse_summary}`; each `bad_lines`
  entry is
  `{line, damage_class, raw_byte_len, extractable{field:{read}}, recoverable, notes}`.
- Its class histogram: `concatenated_objects` 21, `non_json_text` 2,
  `truncated` 1, `unescaped_body` 1, `invalid_escape` 1; 23 of 26 recoverable.
- Its `parse_summary` = `{total_nonempty: 6472, ok: 6446, bad_count: 26}`.
  `backup.path` =
  `briefs/tower/bus-data/backups/board.jsonl.20260813T134935Z.bak`,
  `source_sha256 == backup_sha256 ==`
  `10cc463f2f0c4bba890783f2f28cdb460f9100e1253a5b11e54f0c7053e36baf`.

**The integrity warning**

- Emitted by `readJsonlStats`, `~/agent-core/primitives/hooks/tower-ledger.mjs:368`.
- Printed by `~/agent-core/primitives/mcps/tower/cli.mjs:125-128` (stdout) and
  `cli.mjs:146-151` (stderr).
- Reproduce: `bun ~/.tower/cli.mjs board agent-core/tower-bus-integrity`
  -> `integrity: 26 unparseable line(s) on board (max bad line 2577)`

**The one flocked append path ORCH located**

- `~/agent-core/primitives/hooks/tower-ledger.mjs:151` —
  `withAppendLockfile(file, () => appendFileSync(file, line))`. Whether `line`
  is guaranteed to carry a trailing newline at that call site is **for you to
  read, not to assume**.
- `~/.tower/cli.mjs` and `~/.tower/server.mjs` are **symlinks** into
  `~/agent-core/primitives/mcps/tower/`. Edit the canonical files, never the links.
- `~/agent-core/primitives/mcps/tower/server.mjs:31` imports `appendFileSync`;
  `server.mjs:202` uses it for deliverable markdown, not board rows.

**Credential law (hard)**

- Raw board rows carry the localhost proxy credential
  `srt:<32-hex, prefix af8c45e6 — full value deliberately not reproduced>`. Any file you produce that contains raw
  row bodies **must not enter git** — `credential-guard` will refuse it and that
  refusal is correct. Do not bypass it, do not `git add -f`. Redact with
  `s/srt:[0-9a-f]{32}/srt:REDACTED/g` in anything you intend to be committable.

**Concurrency (read before you act)**

- Pane `w3R:p11` = `ORCH credential-scrub`, live in agent-core, may run
  `git filter-repo`. **Do not commit anything to agent-core.** ORCH owns commits.
- Pane `w3R:p14` = `ORCH write-gate-proof`, live, and its probe **appends real
  rows to `~/.tower/board.jsonl`**.
- ~18 uncommitted changes exist in agent-core from another agent (super-search
  retirement, `utensil-guard` hooks). **Do not investigate, revert, or fix them.**
- **You are read-only on `~/.tower/board.jsonl`.** ORCH is its sole repair
  writer. Never write, truncate, rename, or `>>` that file. Posting via
  `bun ~/.tower/cli.mjs post ...` is fine and expected.

## Constraints

- NO MOCKS. Every claim is proven against the real live board.
- macOS ships bash 3.2 — no `mapfile`, no associative arrays.
- Do not bypass `credential-guard`, the grounding hook, the write-gate, or the
  spawn-door.
- One write per file per thought: compose consecutive edits into a single call;
  Read a file before any second write to it.
- Evidence before assertion. `UNKNOWN` with elimination evidence beats a
  confident guess. Never state a fact you did not acquire this session.

## Tower (mid-run communication)

- Post: `bun ~/.tower/cli.mjs post <claim|finding|note> agent-core/tower-bus-integrity "<body>" --from "<your name>"`
- CLAIM first, findings as you go, `.done` last.
- Self-report: `~/herdr-spine/bin/spine-report task "<what>"` and
  `~/herdr-spine/bin/spine-report verdict "<result>"`.

**MANDATORY — the stigmergic field. You are rank 3.** Ranks 1-4 coordinate
through the environment, never by talking to each other. Do not message ORCH or
your sibling directly. Claim with `work-claimed` `ref`-ing the exact pheromone
id ORCH emitted for your task; `work-done` `ref`-ing what you claimed;
`need-help` rather than going quiet. Heartbeat claims — an unheartbeated claim
evaporates by design. Read the field before ever going idle.
Verbs: `bun ~/.tower/cli.mjs emit <scent> <topic> <payload_ref> [--ref id] [--evidence path] [--ttl N]` and `bun ~/.tower/cli.mjs field`.

**Two legal stopping conditions only:** every done-when met, or a posted
`need-help` naming what is needed and who owns it, after doing everything that
does not depend on it. "Reported and awaited instruction" is not a stopping
state. Questions climb to `ORCH board-repair`, nq budget 3.

## Your pheromone

Claim `ph-msw4jd7j-nwo6` with `work-claimed` before you start; `work-done`
`ref`-ing that same id when your done-when is met.

## Touch ONLY

- `/Users/jrg/agent-core/briefs/tower-bus-integrity/INVENTORY.json`
- `/Users/jrg/agent-core/briefs/tower-bus-integrity/tools/` (any script you write)

Nothing else. Your sibling owns `WRITER-FORENSICS.md` — do not create or edit it.
`~/.tower/board.jsonl` is READ-ONLY to you.

## Task — inventory the 26 rows against the CURRENT file

Re-derive the inventory from the live board, reusing the
`briefs/tower/bus-data/INVENTORY.json` schema exactly — do not invent a new one.
Per row emit: `line`, `damage_class`, `raw_byte_len`, `extractable` (field ->
`{read}` for every field you can pull out: `id`, `ts`, `from`, `topic`, `cwd`,
`type`), `recoverable`, `notes`, and one field the prior inventory lacks:
**`writer`** — what produced the row, from id/from/topic/cwd where extractable.

The prior inventory is a starting point you must RE-VERIFY row by row, not copy.
Where you disagree with its `damage_class` or `recoverable`, say so explicitly
and show the bytes that justify your call.

Classification discipline:
- `concatenated_objects` means two or more complete JSON objects on one physical
  line. Prove it by splitting and parsing each part — a line you merely believe
  is concatenated is not classified, it is guessed.
- Record the exact separator bytes found between the objects (ORCH saw a literal
  `n` on line 2502; check every one, they may not all match).
- `truncated` means the row ends mid-token with no recoverable tail.
- Give `parse_summary` as `{total_nonempty, ok, bad_count}` re-derived at the
  moment you write the file, plus the line count and sha256 of the board at that
  moment so the numbers are reconcilable later.

Redact `srt:[0-9a-f]{32}` -> `srt:REDACTED` in every excerpt you place in
`INVENTORY.json`. Keep `extractable` reads to field values, not whole bodies:
this file is meant to be committable.

## Done when

- `/Users/jrg/agent-core/briefs/tower-bus-integrity/INVENTORY.json` exists, is
  valid JSON, and covers all 26 line numbers listed above — no more, no fewer.
- Every entry carries `line`, `damage_class`, `raw_byte_len`, `extractable`,
  `recoverable`, `notes`, `writer`.
- `parse_summary.bad_count` is 26 and reconciles exactly with the live
  `integrity:` warning from
  `bun ~/.tower/cli.mjs board agent-core/tower-bus-integrity`.
- The file states explicitly whether your classification agrees with
  `bus-data/INVENTORY.json`, and names every row where it differs and why.
- No unredacted credential anywhere in the file — prove it with
  `rg -c 'srt:[0-9a-f]{32}' INVENTORY.json` returning no match.

## Report back with

- The class histogram, and the row-by-row diff against `bus-data/INVENTORY.json`.
- The separator bytes you found between concatenated objects, per row.
- Which rows are recoverable and which are not, with the reason for each
  unrecoverable one.
- The board line count and sha256 you inventoried against.
- Any Pre-Verified Fact above that turned out wrong, and what you found instead.
- Every file you created or modified.
