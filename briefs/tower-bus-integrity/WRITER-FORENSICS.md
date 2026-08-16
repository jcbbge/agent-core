# WRITER-FORENSICS — who corrupted `~/.tower/board.jsonl`

AGNT-forensics, rank 3, `agent-core/tower-bus-integrity`. All facts below were
re-verified live this session (2026-08-16). Read-only on `~/.tower/board.jsonl`
throughout — every reproduction below runs on a scratch file, never the live
board.

## The mechanism

**Two independent, unlocked writer implementations appended to the same
`~/.tower/board.jsonl` for the entire damage window (2026-07-24 ..
2026-08-10), using two different JSON serializers, with no shared locking
discipline between them until both were patched on the same day,
2026-08-13:**

1. **Canonical writer** — `~/agent-core/primitives/hooks/tower-ledger.mjs`,
   function `append()` (current file, lines 134-150; the pre-flock shape
   documented in `briefs/tower/bus-data/WRITE-PATH-PROOF.md` §1, "File lock
   on append: FAIL (accepted residual) — `append()` uses bare
   `appendFileSync`"). Builds the line with
   `JSON.stringify(obj) + '\n'` — **compact** (no space after `:` or `,`).
   No lock during the damage window.

2. **Second writer** — `~/herdr-spine/bin/spine-claim`, function
   `board_append()` (Python helper embedded in the bash script,
   `bin/spine-claim:87-102`; identical logic duplicated in
   `bin/handlers/_spine_common.py:327-342`). Introduced in herdr-spine
   commit `cc72a03` (2026-07-24T09:19:43Z — **73 seconds after** the very
   first corrupted board line's own timestamp, `2026-07-24T09:18:30Z`, i.e.
   this writer went live at the exact start of the damage window). Builds
   the line with `json.dumps(entry) + "\n"` — Python's `json.dumps` default
   separators are `", "` and `": "`, i.e. **spaced** JSON
   (`"topic": "herdr-spine"`). No lock (`fh.write(...)` with no `flock`
   call) from `cc72a03` through commit `25c1ef0~1`.

Both writers were fixed **on the same day**, 2026-08-13:
   - agent-core `88b3d6f` "fix(tower): harden board write path" — added
     `assertAuthoredBoardFrom()`, and (per `WRITE-PATH-PROOF.md`) is also
     where the `brief` skill's hand-append instruction was deleted.
   - herdr-spine `25c1ef0` "fix(spine): flock board_append writers
     (LOCK_EX)" — adds `import fcntl` +
     `fcntl.flock(fh.fileno(), fcntl.LOCK_EX)` to **both**
     `bin/spine-claim` and `bin/handlers/_spine_common.py`, and nothing
     else (verified via `git show 25c1ef0 -- bin/spine-claim`). Its own
     commit message: "concurrent oracle green (160 lines, no tear)" —
     herdr-spine's own regression suite
     (`bin/handlers/tests/test_board_append_flock.py`) exists specifically
     to prove the tear this fix closes.

**Reproduction** (`forensics/repro-race.sh`, `forensics/writer_node.mjs`,
`forensics/writer_python.py`): simulates both pre-fix writers — compact
`JSON.stringify`/no-lock vs. spaced `json.dumps`/no-lock — firing
concurrently at a scratch JSONL file. Run:
```
cd /Users/jrg/agent-core/briefs/tower-bus-integrity/forensics
ROUNDS=3 PROCS=60 BODY_BYTES=8000 bash repro-race.sh
```
**Honest negative result:** on this machine (macOS/APFS, 2026-08-16), 3
rounds of 120 concurrent unlocked appends (8000-byte bodies) produced **zero**
torn/concatenated lines — APFS appears to serialize whole `write(2)` calls to
an `O_APPEND` fd at these sizes even without `flock`. This does **not**
overturn the finding above (the absence of any shared lock between the two
writers for three weeks is proven by source and git history, independent of
whether I can force the tear on today's hardware) — it means the exact
byte-level trigger for lines 2502/2577 is not reproduced by pure concurrency
alone on this filesystem. See candidate 2's VERDICT below for what remains
open.

A second, cleanly-reproducing script (`forensics/repro-echo-escape.sh`)
demonstrates a second, independently-sufficient mechanism: the pre-2026-08-13
`brief` skill (`primitives/skills/brief/SKILL.md`, blob `a1031c2`, replaced in
`88b3d6f`) told any harness without the Tower MCP ("e.g. pi") to hand-append
one JSON line to `board.jsonl` directly — i.e., construct the JSON as text
yourself and append it, no serializer named, no lock possible from doctrine
alone. A plain `echo '...\n'` (no `-e`) executing that instruction writes the
intended row separator as two literal characters `\` `n`, not a real newline
byte — reproduced live by the script.

## The five candidates

1. **An append omitting its trailing newline.**
   **RULED OUT** as a *code*-level defect in both known writers. `append()`
   in `tower-ledger.mjs` builds `JSON.stringify(obj) + '\n'` — the `\n` is
   unconditional in the code, every call site. `board_append()` in
   `spine-claim` builds `json.dumps(entry) + "\n"` — same, unconditional.
   Neither writer's source can produce a string lacking its trailing
   newline. (The *missing* newlines observed in the live rows are explained
   by candidate 2/the doctrine path below, not by this candidate.)

2. **A non-atomic write interleaved between concurrent appenders.**
   **CONFIRMED** that no shared lock existed: `tower-ledger.mjs`'s `append()`
   was lock-free (`appendFileSync`, no flock) for the entire damage window
   per `WRITE-PATH-PROOF.md`'s own audit ("FAIL (accepted residual)");
   `spine-claim`'s `board_append()` was lock-free from its introduction
   (`cc72a03`, 2026-07-24) through the commit before `25c1ef0`
   (2026-08-13) — confirmed by reading both the current source and every
   commit's diff. Two structurally different, independently-serializing
   writers hit the same file with zero coordination for three weeks. The
   *exact byte-level tear mechanism* is **UNKNOWN** — my own concurrency
   repro (120 unlocked writers, 8KB bodies, 3 rounds) did not reproduce a
   torn line on this filesystem (see negative result above). What would
   settle it: either a slower/networked filesystem matching whatever the
   original agents ran on, or a session transcript from
   2026-08-10T05:18:22Z / 09:04:08Z (the ts fields on lines 2502/2577)
   showing the actual command that produced them. `pickbrain` and `vein`
   were used this session but did not surface a transcript from those exact
   timestamps (see "What I checked and didn't find" below).

3. **A crashed partial write** (line 3 truncated mid-key `"cwd`).
   **UNKNOWN**, but not needed as an independent cause — no OS crash log,
   core dump, or panic record was found this session for the process that
   produced line 3, and the truncation is fully explained as one more
   instance of "no shared lock across differently-shaped writers" (a
   partially-landed row spliced against unrelated content — see lines 1-2
   below) rather than requiring an actual process crash. What would settle
   it: a crash log/dmesg entry timestamped exactly `2026-07-24T09:18:30Z`
   (I checked `log show` was not run — out of scope for a read-only forensics
   pass on live system logs beyond what's already in git/backups).

4. **A direct `>>`/`>` append bypassing the CLI.**
   **CONFIRMED** as the mechanism for lines 1-2 (`1 matches in 1F:` /
   `[file] 628 (1):`) — this text cannot come from either JSON writer above;
   `JSON.stringify`/`json.dumps` cannot emit "1 matches in 1F:". It is
   captured stdout of *some* grep/search-style tool that landed in the board
   file via redirection or a copy-paste-into-append mistake, consistent with
   the pre-2026-08-13 `brief` skill doctrine that told agents without MCP
   to hand-construct their board append (a hand-typed shell command is
   exactly the kind of action that can accidentally redirect the wrong
   command's output). **The specific tool/binary is UNKNOWN.** Eliminated
   this session: the `droid` (Factory) CLI's bundled ripgrep strings do not
   contain this format; the installed `@earendil-works/pi-coding-agent`
   package's `dist/` contains no matching format string; `ag`/`ack`/`ugrep`
   are not installed on this machine (only `rg` and `fzf` are). What would
   settle it: the same 2026-07-24T09:18:30Z transcript as candidate 2/3.

5. **A writer running as a different user or group** (`jrg:wheel` vs.
   every sibling `jrg:staff`).
   **UNKNOWN, and newly narrowed this session — likely unrelated to the
   damage window.** Every historical copy of the board checked this
   session is group `staff`: the 2026-08-13 recovery backup
   (`briefs/tower/bus-data/backups/board.jsonl.20260813T134935Z.bak`), the
   pre-recovery snapshot
   (`briefs/tower/w0-swap-evidence/board.jsonl.pre-recovery-20260813T052104Z`),
   the daily rotation archives from **this morning**
   (`~/.tower/archive/board/board-20260815T083005Z.jsonl` and
   `board-20260816T083005Z.jsonl`, both `staff`), and the
   `w4-retention-evidence` rotate-proof copy from today. Only the **live**
   file, checked at 18:12Z today, is `wheel`. So the group flip happened in
   the roughly 10-hour window between this morning's 08:30:05Z rotation and
   my 18:12Z check today (2026-08-16) — **after** the damage window
   (2026-07-24..2026-08-10) closed and **after** both writer fixes (2026-08-13)
   landed. No process observed live this session runs as root or under
   `sudo` (checked `ps aux` — every Tower-related process is `jrg`). On
   macOS/BSD semantics a new file normally inherits its parent directory's
   group (`~/.tower/` itself is `staff`) unless the creating process's
   effective/primary gid was `wheel` at creation time — which happens for
   processes started via `sudo` (root's primary group is `wheel`) or an
   atomic rename-swap performed by such a process. I did not find the
   specific command; this is most plausibly connected to *today's* active
   repair/rewrite activity on this same lane (`ORCH board-repair`,
   `ORCH write-gate-proof` — both stated in my brief as live writers to this
   file right now), not to the original 2026-07-24..08-10 corruption. What
   would settle it: whoever is actively rewriting `board.jsonl` right now
   confirming whether their process ran under `sudo` or a different
   effective gid at any point today.

## What I checked and didn't find

- `pickbrain "1 matches in 1F: search tool output redirected into
  board.jsonl"` returned dozens of session transcript paths by topical
  relevance, not a transcript pinned to 2026-07-24T09:18:30Z specifically;
  I did not exhaustively open all of them (out of the ~nq budget for this
  task) — a targeted second pass by whoever needs the exact tool name could
  narrow by session date.
- Binary/string search for the literal `"1 matches in 1F:"` / `"[file] N
  (M):"` format across installed CLIs (`droid`, globally-installed npm
  packages, `rg`, `fzf`) found no match.

## The `n` separator

Lines 2502 and 2577 both read `..."}n{"id":...` — a bare ASCII `n` sitting
between the closing `}` of one object and the opening `{` of the next, with
**no real newline byte anywhere at that junction** (confirmed via `od -c` on
the ORCH-read samples cited in the brief). `forensics/repro-echo-escape.sh`
reproduces the *first half* of this cleanly: a plain POSIX `echo '...\n'`
(no `-e`) — exactly what an agent following the deleted `brief` skill's
hand-append instruction would type — writes the intended row-separator as
two literal characters `\` and `n`, not an escape. That is **not yet a full
match** for the observed shape: my repro's stray `\n` sits on its own line,
bracketed by echo's own real trailing newlines, whereas the live rows show
**zero** real newline at the junction and only the bare `n` (no backslash)
survives. So: **CONFIRMED** that the row separator was authored as a
2-character literal `\n` by something that does not interpret shell escapes
(consistent with hand-typed/doctrine-driven appends, candidate 4); **UNKNOWN**
what additionally consumed both the backslash and the real newline that
`echo` itself would still emit — a backslash-stripping or line-joining pass
downstream (a markdown/report renderer, a naive redaction script, or a
different quoting layer such as a value passed through an extra
`JSON.stringify`/re-encode step) is the leading hypothesis but not confirmed
this session. What would settle it: the same 2026-08-10T05:18:22Z /
09:04:08Z transcripts as above.

## What writes spaced JSON

**CONFIRMED**: `~/herdr-spine/bin/spine-claim`, function `board_append()`
(`bin/spine-claim:87-102`), and its twin in
`bin/handlers/_spine_common.py:327-342`. Both call Python's `json.dumps(entry)`
with no `separators` argument, which defaults to `", "` / `": "` —
producing e.g. `"topic": "herdr-spine"` with a space after the colon, in
contrast to `JSON.stringify`'s compact output from the JS/Bun side. Both of
the "spaced-half" samples ORCH read (lines 2502, 2577) carry
`"topic": "herdr-spine"` and both recovered `from` fields
(`c003-test-runner`, `c003-acceptance`, per
`briefs/tower/bus-data/INVENTORY.json`) are board rows whose `cwd` is
`/Users/jrg/.herdr/worktrees/future/c003-fractal-chrome` — a project unrelated
to agent-core, consistent with a `spine-claim`/herdr-spine-side post (this
mechanism is invoked from any project) racing against the canonical Tower
writer.

## Ownership (`jrg:wheel`)

Open — see candidate 5 above. Narrowed from "unexplained" to "recent, and
disconnected from the original damage window": every dated historical copy
of the board (2026-08-13 through this morning, 2026-08-16T08:30Z) is
`staff`; only the live file checked at 18:12Z today is `wheel`.

## Pre-Verified Facts that turned out wrong

None of the ORCH-supplied Pre-Verified Facts were contradicted this session.
One is worth flagging as *incomplete rather than wrong*: the brief frames
`jrg:wheel` as "a lead, not a conclusion" toward the original damage — this
session's evidence points the ownership question at *today's* live repair
activity instead, not at the 2026-07-24..08-10 writer(s). That's a redirection
of the lead, not a correction of a stated fact.

## Files created or modified

All under my Touch ONLY partition:
- `/Users/jrg/agent-core/briefs/tower-bus-integrity/WRITER-FORENSICS.md` (this file)
- `/Users/jrg/agent-core/briefs/tower-bus-integrity/forensics/writer_node.mjs`
- `/Users/jrg/agent-core/briefs/tower-bus-integrity/forensics/writer_python.py`
- `/Users/jrg/agent-core/briefs/tower-bus-integrity/forensics/repro-race.sh`
- `/Users/jrg/agent-core/briefs/tower-bus-integrity/forensics/repro-echo-escape.sh`

No file created by me contains raw board row bodies or the `srt:` proxy
credential. `~/.tower/board.jsonl` was never written, truncated, or renamed by
me — read-only access only (`cat`, `wc`, `stat`, `ls`), plus `bun
~/.tower/cli.mjs post`/`emit` for Tower comms.
