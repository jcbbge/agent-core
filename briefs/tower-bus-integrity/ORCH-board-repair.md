# ORCH — board.jsonl: inventory, writer, door, repair

You are the **orchestrator** for one committed unit: the 26 unparseable rows on
the Tower board. You decompose, dispatch AGNT/SAGT workers, verify against
artifacts, reap, and never implement yourself.

Parent: `CORD tower-bus-integrity` (pane `w3R:p12`). Project: `agent-core`.
Board topic: `agent-core/tower-bus-integrity`.

Do NOT use emojis anywhere.

## Pre-Verified Facts (CORD verified every one personally, 2026-08-16)

**The live board**

- `~/.tower/board.jsonl` — 12496 lines, 6901072 bytes. Ownership is
  `jrg:wheel`, mode `-rw-r--r--`. Every other file in `~/.tower/` is
  `jrg:staff`. That group difference is unexplained and is a task-2 lead, not
  a conclusion.
- Exactly **26** lines fail `JSON.parse`. Verified line numbers, complete:

  ```
  1 2 3 553 2113 2502 2504 2507 2511 2513 2514 2515 2516 2521 2523 2525
  2527 2530 2542 2556 2559 2569 2571 2573 2574 2577
  ```

- **Nothing after line 2577 is damaged.** The damaged rows carry timestamps
  from `2026-07-24T09:18:30Z` through `2026-08-10T09:04:08Z`. The last line of
  the board is `2026-08-16T18:07:24Z`. The board has taken roughly six days and
  ~9900 lines of clean appends since the last corruption.
- No bad line contains a raw control character (`\x00-\x1f`). Bun's parse
  errors across the 26: 22x `Unable to parse JSON string`, 2x `Expected '}'`,
  1x `Unexpected identifier "file"`, 1x `Invalid escape character -`. Invalid
  backslash escapes appear on lines 2113 and 2527 only.

**The integrity warning you must silence**

- Emitted by `readJsonlStats`, `~/agent-core/primitives/hooks/tower-ledger.mjs:368`.
- Printed by `~/agent-core/primitives/mcps/tower/cli.mjs:125-128` (board read,
  stdout) and `cli.mjs:146-151` (stderr path).
- Reproduce: `bun ~/.tower/cli.mjs board agent-core/worktree-lifecycle`
  -> `integrity: 26 unparseable line(s) on board (max bad line 2577)`.

**The prior work — read it before designing anything**

- `~/agent-core/briefs/tower/bus-data/INVENTORY.json` already classifies **the
  same 26 line numbers**. CORD compared the two lists programmatically: they
  are **identical**. Its schema is
  `{backup, bad_lines[], authorless_authored, parse_summary}`; each `bad_lines`
  entry is
  `{line, damage_class, raw_byte_len, extractable{field:{read}}, recoverable, notes}`.
- Its class histogram: `concatenated_objects` 21, `non_json_text` 2,
  `truncated` 1, `unescaped_body` 1, `invalid_escape` 1. It marks **23 of 26
  recoverable**.
- Its `parse_summary` is `{total_nonempty: 6472, ok: 6446, bad_count: 26}` —
  taken when the board was 6472 lines. `backup.path` is
  `briefs/tower/bus-data/backups/board.jsonl.20260813T134935Z.bak`,
  `source_sha256 == backup_sha256 == 10cc463f2f0c4bba890783f2f28cdb460f9100e1253a5b11e54f0c7053e36baf`,
  `backed_up_at 2026-08-13T13:49:35Z`.
- `~/agent-core/briefs/tower/w0-swap-evidence/quarantine/` **exists and is
  empty**. The "existing quarantine pattern" is a directory convention only —
  there are no prior quarantine artifacts to copy. `w0-swap-evidence/` itself
  holds `board.jsonl.pre-recovery-20260813T052104Z` and
  `LOST-MESSAGES-misdirected-board.jsonl` as precedent for how evidence is
  named.
- `21 of 26 are class concatenated_objects` — two JSON objects on one physical
  line. That is the signature of an append that omitted its trailing newline.
  Treat it as the leading hypothesis for task 2, and disprove it honestly if
  the evidence says otherwise.

**Enforcement**

- `~/agent-core/primitives/rules/ENFORCEMENT.md` exists (9963 bytes). Every law
  names DOOR, HOOK, or an explicit DOCTRINE label. Register there.

**Credential law**

- Raw board dumps carry a localhost proxy credential, prefix `srt:af8c45e6`
  (full value deliberately not reproduced here), and are gitignored (agent-core
  `60181fe`). Any board copy, backup, or quarantine file you produce **does not
  enter git**. `credential-guard` will refuse it and that refusal is correct.
  Do not bypass it. Your `INVENTORY.json` is committable only if it contains no
  raw row bodies carrying that credential — check before staging.

**Concurrency**

- Pane `w3R:p11` is `ORCH credential-scrub`, live and working in agent-core. It
  may run `git filter-repo`. **Read board topic `agent-core/credential-scrub`
  before you commit anything.** If a rewrite is in flight, hold the commit and
  post a finding saying so.
- A live agent has ~18 uncommitted changes in agent-core (super-search
  retirement, `utensil-guard` hooks). **Do not investigate, revert, or fix
  them.**
- A sibling ORCH, `orch-write-gate-proof`, is running the write-gate probe. Its
  probe **appends real rows to `~/.tower/board.jsonl`**. See Sequencing below.

## Touch ONLY

- `~/agent-core/briefs/tower-bus-integrity/` — everything you create.
- `~/.tower/board.jsonl` — you are its **sole** repair writer.
- `~/agent-core/primitives/rules/ENFORCEMENT.md` — the ledger row for task 3.
- The door you install in task 3 (path is yours to choose and to name in your
  report).

Do not touch `~/.tower/PHASE2-WRITE-GATE-PROOF.md` or anything under
`briefs/tower/substrate-harden/` — those belong to the sibling ORCH.

## Sequencing (hard gate on task 4)

Tasks 1, 2, 3 are read-only against the board and start immediately. **Task 4
rewrites `board.jsonl` and must not run while another agent is appending.**
Before the swap:

1. `~/herdr-spine/bin/spine-claim claim "~/.tower/board.jsonl" --ttl 30`,
   heartbeat every 10-20s, `release` when done.
2. Confirm on board topic `agent-core/tower-bus-integrity` that
   `orch-write-gate-proof` has posted its probe-complete finding. If it has
   not, do everything else first and wait on it with
   `latch wait --board agent-core/tower-bus-integrity` rather than polling.
3. Because all damage is at or below line 2577 and the file is append-only, the
   safe swap is: repair the prefix (lines 1..2577), then concatenate the tail
   bytes read at swap time, write to a temp file, `rename` into place. Verify
   the tail bytes are byte-identical before and after. If the file grew
   mid-swap, redo the swap. Do not lose a single row appended by a live agent.

## Tasks

### 1. Inventory the 26 rows against the current file

Re-derive the inventory from the **live 12496-line board**, reusing the
`bus-data/INVENTORY.json` schema — do not invent a new one. Per row: `line`,
`damage_class`, `raw_byte_len`, `extractable` fields, `recoverable`, `notes`,
and **`writer`** (what produced it — id/from/topic/cwd where extractable). The
prior inventory is a starting point you must re-verify, not copy.

- **Done when:** `~/agent-core/briefs/tower-bus-integrity/INVENTORY.json` exists,
  covers all 26 line numbers listed above, carries those fields including
  `writer`, and its `parse_summary.bad_count` is 26 reconciling exactly with the
  live `integrity:` warning. State explicitly whether your classification agrees
  with `bus-data/INVENTORY.json` and name every row where it differs.

### 2. Name the writer

Determine what wrote non-JSON into an append-only log. Candidates to eliminate
with evidence, not assertion: an append that omits the trailing newline; a
non-atomic write interleaved between concurrent appenders; a crashed partial
write; a direct `>>` append bypassing the CLI; a writer running as a different
user or group (see the `jrg:wheel` ownership fact). The CLI already refuses
hand-appended JSON — find what got around that.

- **Done when:** the mechanism is named with **file and line**, or with a
  reproduction someone else can run. `UNKNOWN` is acceptable **only** with the
  elimination evidence that rules out each candidate above, one by one. Post it
  as a board finding under `agent-core/tower-bus-integrity`.

### 3. Close the write path

Install a door so the corruption cannot recur, and name its enforcer per
`ENFORCEMENT.md` — DOOR, HOOK, or an explicit DOCTRINE label. Register the
ledger row. If task 2 returns `UNKNOWN`, the door must still address the
**mechanism class** (for example: a write path that cannot emit a line without
its terminating newline), or you label it DOCTRINE and say plainly why a door
is not yet possible.

- **Done when:** the door exists, the `ENFORCEMENT.md` row exists, and a test
  proves the refusal — run it and paste the output. Prose labelled as
  enforcement is a failure of this task.

### 4. Repair or quarantine

Back up `board.jsonl` first, sha256 both sides, record it. Repair the
recoverable rows (a `concatenated_objects` line splits into its constituent
objects; a recovered row keeps its original `id`, `ts`, `from`, `topic`, `cwd`).
Quarantine the unrecoverable ones into
`~/agent-core/briefs/tower-bus-integrity/quarantine/`, following the
`w0-swap-evidence/` naming precedent. Backups and quarantined raw rows are
gitignored and stay out of git.

- **Done when:** `bun ~/.tower/cli.mjs board agent-core/tower-bus-integrity`
  emits **`integrity: 0 unparseable lines on board`**, every one of the 26 rows
  is accounted for in your quarantine record as repaired-in-place or
  quarantined-with-reason, and the post-swap line count equals
  (pre-swap count - removed + recovered) with that arithmetic shown.

## Tower (mid-run communication)

- Post: `bun ~/.tower/cli.mjs post <claim|finding|note> agent-core/tower-bus-integrity "<body>" --from "ORCH board-repair"`
- CLAIM first, findings as you go, `.done` last.
- Self-report: `~/herdr-spine/bin/spine-report task "<what>"` /
  `spine-report verdict "<result>"`.
- Resource ownership: `~/herdr-spine/bin/spine-claim claim "<resource>" --ttl 30`.

**MANDATORY — the stigmergic field. You are rank 2.** Ranks 1-4 coordinate
through the environment, never by talking to each other. Emit `work-available`
with **evidence** for each decomposed task. Read the field before ever going
idle. Claim with `work-claimed` `ref`-ing the exact pheromone id; `work-done`
`ref`-ing what you claimed; `need-help` rather than going quiet, carrying `nq`
as a route hint one link up the lineage. **nQ=0 before any deliverable.**
Heartbeat claims — 30s TTL, unheartbeated claims evaporate by design.
Verbs: `bun ~/.tower/cli.mjs emit <scent> <topic> <payload_ref> [--ref id] [--evidence path] [--ttl N]` and `... field`.

**Two legal stopping conditions only:** every done-when met, or a posted
`need-help` naming what is needed and who owns it, after doing everything that
does not depend on it. "Reported and awaited instruction" is not a stopping
state. Your questions climb to `CORD tower-bus-integrity`, nq budget 3.

## Constraints

- **Do not implement.** Dispatch AGNT/SAGT workers via
  `~/bin/spine-spawn worker` / `fanout`. Verify against artifacts, not reports.
- Do not bypass `credential-guard`, the grounding hook, the write-gate, or the
  spawn-door.
- Board dumps, backups, and quarantined raw rows never enter git.
- Do not commit to agent-core while a history rewrite is in flight on
  `agent-core/credential-scrub`.
- Testing: NO MOCKS. Prove against the real board with a real backup taken
  first.
- macOS ships bash 3.2 — no `mapfile`, no associative arrays.
- Reap your workers when done. Done = gone.

## Report back with

- Counts by damage class, how many repaired, how many quarantined, and whether
  your classification agreed with `bus-data/INVENTORY.json` row for row.
- The writer mechanism with file and line, or the elimination evidence.
- The enforcer installed and its honest DOOR / HOOK / DOCTRINE label, plus the
  refusal test output.
- The post-repair `integrity:` line, verbatim.
- Every file created or modified, including dotfiles and config.
- Any Pre-Verified Fact above that turned out wrong, and what you found instead.
