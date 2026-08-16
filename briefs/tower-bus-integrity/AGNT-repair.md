# AGNT — repair and quarantine the 26 damaged rows

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

Emit `work-claimed` on the `work-available` pheromone whose payload names
`task-4-repair` before you start; `work-done` `ref`-ing it when done.
Find it with `bun ~/.tower/cli.mjs field`.

## Touch ONLY

- `/Users/jrg/agent-core/briefs/tower-bus-integrity/quarantine/`
- `/Users/jrg/agent-core/briefs/tower-bus-integrity/repair/` — your swap script,
  logs, and arithmetic.
- `/Users/jrg/.tower/board.jsonl` — **you are its sole repair writer, and only
  inside the swap procedure below.** This one line OVERRIDES the read-only
  clause in the shared prefix above: ORCH delegates sole repair-writer status
  to you, for the duration of your `spine-claim` on that path and no longer.
  Outside the swap procedure you are read-only on it like everyone else.

Nothing else. Do not edit `INVENTORY.json`, `WRITER-FORENSICS.md`, the door, or
`ENFORCEMENT.md`.

## Your input

`/Users/jrg/agent-core/briefs/tower-bus-integrity/INVENTORY.json` — the verified
classification of all 26 rows, including which are recoverable. Read it first.
Re-verify its line numbers against the live file before you cut anything: the
board grows continuously and a stale line number destroys a good row.

## THE SWAP IS THE DANGEROUS PART — read this twice

The board is append-only and **live**: other agents are appending to it while you
work. All damage is at or below line 2577; everything above it is clean and
growing.

1. **Claim the resource first:**
   `~/herdr-spine/bin/spine-claim claim "~/.tower/board.jsonl" --ttl 30`
   Heartbeat every 10-20s for the whole procedure
   (`~/herdr-spine/bin/spine-claim heartbeat "~/.tower/board.jsonl" --ttl 30`),
   and `release` when done — including on failure.
2. **Back up before anything else.** Copy to
   `briefs/tower-bus-integrity/backups/board.jsonl.<UTCSTAMP>.bak`, sha256 both
   source and backup, confirm they match, and record both hashes with the byte
   count and line count. A repair without a verified backup is not attempted.
3. **Repair the prefix only.** Build the corrected lines 1..2577 in a temp file
   in your scratch directory.
   - A `concatenated_objects` line splits into its constituent objects, each
     becoming its own line. A recovered row keeps its original `id`, `ts`,
     `from`, `topic`, `cwd` — you do not mint new ones and you do not rewrite
     bodies.
   - Unrecoverable rows are removed from the board and written to
     `briefs/tower-bus-integrity/quarantine/`, following the naming precedent in
     `~/agent-core/briefs/tower/w0-swap-evidence/`
     (`board.jsonl.pre-recovery-<UTCSTAMP>`,
     `LOST-MESSAGES-misdirected-board.jsonl`). Each quarantined row gets a
     stated reason.
4. **Concatenate the live tail at swap time.** Read the tail bytes (from the
   byte offset where line 2578 begins) at the moment of the swap, append them to
   your repaired prefix, write the temp file, then `rename` it into place — a
   rename is atomic; a truncate-and-rewrite is not. Never `>` the real board.
5. **Prove you lost nothing.** The tail bytes must be byte-identical before and
   after the swap. If the file grew mid-swap, discard and redo the swap. Do not
   lose a single row appended by a live agent.

## Done when

- `bun ~/.tower/cli.mjs board agent-core/tower-bus-integrity` emits
  **`integrity: 0 unparseable lines on board`** — paste it verbatim.
- Every one of the 26 rows is accounted for as repaired-in-place or
  quarantined-with-reason, in
  `briefs/tower-bus-integrity/quarantine/DISPOSITION.md`. 26 in, 26 accounted
  for, no row silently dropped.
- The arithmetic is shown and checks out:
  `post_swap_lines == pre_swap_lines - removed + recovered + appended_during_swap`,
  with each term's actual number.
- The backup exists, both sha256 values are recorded and equal, and the tail
  bytes are proven byte-identical across the swap.
- The board is still valid JSONL end to end: re-run the parse over the whole
  file and report `total_nonempty`, `ok`, `bad_count`.
- Backups and quarantined raw rows **stay out of git** — they carry the
  credential. Do not `git add` them; `credential-guard` refusing them is correct.
  Verify with `git status --short briefs/tower-bus-integrity/` that nothing
  containing a raw credential is staged.

## Report back with

- The verbatim post-repair `integrity:` line.
- Counts: repaired, quarantined, rows recovered from concatenations.
- The full arithmetic with real numbers.
- Backup path and both sha256 values.
- Proof the live tail survived (the before/after tail hash).
- Any row where `INVENTORY.json` was wrong about recoverability, and what you
  found instead.
- Every file you created or modified.
