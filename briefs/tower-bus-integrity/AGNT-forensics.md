# AGNT — name the writer that corrupted board.jsonl

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

Claim `ph-msw4jd95-v8ap` with `work-claimed` before you start; `work-done`
`ref`-ing that same id when your done-when is met.

## Touch ONLY

- `/Users/jrg/agent-core/briefs/tower-bus-integrity/WRITER-FORENSICS.md`
- `/Users/jrg/agent-core/briefs/tower-bus-integrity/forensics/` (repro scripts)

Nothing else. Your sibling owns `INVENTORY.json` and `tools/` — do not create or
edit them. `~/.tower/board.jsonl` is READ-ONLY to you. Do not install the fix;
a later worker owns the door. Your job is to name the mechanism.

## Task — name the writer

Determine what wrote non-JSON into an append-only log. Name the mechanism with
**file and line**, or with a reproduction another person can run.

Candidates to eliminate with evidence, not assertion — go one by one and record
the disproof for each:

1. An append that omits its trailing newline. Read
   `~/agent-core/primitives/hooks/tower-ledger.mjs:151` and its call sites; find
   where `line` is built and whether `\n` can ever be absent.
2. A non-atomic write interleaved between concurrent appenders — inspect
   `withAppendLockfile` and ask whether the lock covers every writer or only the
   ones that opt in.
3. A crashed partial write (line 3 is truncated mid-key — does that fit?).
4. A direct `>>` or `>` append bypassing the CLI. Lines 1-3 are captured stdout
   of a search-tool, which is the strongest evidence for this path — identify
   the tool from its output format (`1 matches in 1F:` / `[file] 628 (1):` /
   `     0: ...`) and, if you can, the command that would redirect it here.
5. A writer running as a different user or group — `board.jsonl` is `jrg:wheel`
   while every sibling file is `jrg:staff`. Explain that group, or say plainly
   that you cannot.

Two specific leads ORCH found and did not chase:

- **The `n` separator.** Line 2502 joins its two objects with a literal `n`
  where a newline belongs. A `\n` that lost its backslash is the signature of a
  string that passed through a layer which stripped escapes. Find that layer, or
  disprove it.
- **Two serializers on one line.** The first half of the concatenated rows is
  compact JSON; the second half is spaced (`"topic": "herdr-spine"`). Compact is
  what `JSON.stringify` emits. Something else emitted the spaced half — and the
  spaced halves ORCH sampled both carry `"topic": "herdr-spine"`. Find what
  writes spaced JSON to this board and you likely have your writer.

Useful corpus: the damage window is `2026-07-24` .. `2026-08-10`. `pickbrain`
searches past agent sessions and `vein` mines transcripts for what commands
actually ran — both are appropriate here. `~/.tower/attic/` and
`~/agent-core/briefs/tower/w0-swap-evidence/` hold prior board incidents.

## Done when

- `/Users/jrg/agent-core/briefs/tower-bus-integrity/WRITER-FORENSICS.md` names
  the mechanism with file and line, **or** carries a reproduction command that
  another person can run and watch corrupt a scratch JSONL file (never the real
  board — copy it to your scratch dir first).
- All five candidates above appear with an explicit VERDICT line each:
  `RULED OUT — <evidence>` or `CONFIRMED — <evidence>` or
  `UNKNOWN — <what would settle it>`.
- `UNKNOWN` overall is acceptable ONLY if all five carry elimination evidence.
- The finding is posted to board topic `agent-core/tower-bus-integrity` as a
  `finding` (a terse one, not the whole document).
- No unredacted `srt:[0-9a-f]{32}` credential in the file.

## Report back with

- The mechanism, with file and line, or the repro command and its observed output.
- The five VERDICT lines, verbatim.
- What the `n` separator turned out to be, and what writes spaced JSON.
- Whether the `jrg:wheel` ownership is explained or still open.
- Any Pre-Verified Fact above that turned out wrong, and what you found instead.
- Every file you created or modified.
