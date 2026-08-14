# AGNT [w0-stage] — Stage Tower's code set into its canonical git home

## Shared prefix — W0 context (identical across all W0 sibling briefs)

You are a worker under `ORCH [w0-version-control]` (pane `w2W:p4`,
registration `orch-w0-version-control`). Your ORCH reports to `CORD [Tower]`.

The unit of work: Tower's code currently lives untracked in `~/.tower/`. We are
making it reviewable and revertable by moving the canonical code to
`~/agent-core/primitives/mcps/tower/` (git-tracked) while `~/.tower/` remains the
deployed runtime + state home.

**THE BUS IS LIVE AND IN USE RIGHT NOW.** Verified 2026-08-13 via `herdr agent list`:
panes `orch-infra-upgrade` (w2V:pQ), `orch-docs-control-flow` (w2V:pX) and
`cord-tower` (w2W:p1) are `agent_status: working`, and `orch-docs-control-flow`'s
current task token is literally `run bun ~/.tower/cli.mjs post`. Other agents are
executing `bun ~/.tower/cli.mjs` while you work.

### Absolute prohibitions (all W0 workers)

- **NEVER touch Tower state.** `board.jsonl`, `ledger.jsonl`, `odometer.jsonl`,
  `pheromones.jsonl`, `flight/`, `deliverables/`, `cursors/`, `briefs/`,
  and the `*.json` pace/state files in `~/.tower/`. W0 is a CODE change.
- **NEVER delete anything.** Not a `.bak-*` file, not a live file. Deletion is W5
  and is the CORD's call. Additive and reversible only.
- **NEVER commit, stage, branch, stash, or run any mutating git command.** Your ORCH
  gates and commits. `git status` / `git diff` / `git log` for reading are fine.
  Never `git add -A` under any circumstance.
- **NEVER restart or kill the running Tower MCP server**, and never kill another
  agent's pane or process.
- **Stay inside your file partition** (stated in your task section). A sibling worker
  is operating in the same repo on a disjoint set of files at the same time.
- If something genuinely destructive or irreversible seems required: STOP, post to
  the board, and report to your ORCH. Do not execute it.

### Tower

- Board topic: **`tower/w0-version-control`**. Post a CLAIM before touching shared
  files, findings as you learn them, and your final report.
- Post with `from` = your own registration name (`agnt-w0-stage`).
- Use `board_post` for all fleet mail. Do **NOT** use `send_to_user` — you are fleet,
  not operator-facing. Your ORCH reads the board.
- Status is not mail. Do not send heartbeats. Post at real checkpoints with specifics.
- If you hit a decision only the ORCH can make, post it to the board as a question and
  continue with everything not blocked by it. Your nq budget is 3.
- Write `.done` last, after your report lands.

### Pre-Verified Facts (verified by the ORCH on 2026-08-13; re-verify anything you act on)

1. `~/.tower/` is NOT a git repository; no parent is either.
2. `~/agent-core` IS a git repo, on branch `main`, with 17 pre-existing untracked
   entries that are NOT ours. This is why `git add -A` is banned.
3. `~/agent-core/primitives/mcps/tower/` already exists, is git-tracked, and today
   contains exactly one file: `README.md` (3,378 bytes, dated 2026-06-28).
4. Tower's state paths are anchored to `homedir()`, not to code location
   (`~/agent-core/primitives/hooks/tower-ledger.mjs` lines 22-28:
   `export const TOWER = join(homedir(), '.tower')`). Moving code cannot move state.
   This is the property that makes W0 safe.
5. Live code line counts, verified: `cli.mjs` 296, `server.mjs` 350, `lib.mjs` 61,
   `cli.test.mjs` 180, `server-drift.test.mjs` 257.
6. `~/.tower/hooks/` contains **10 live `.mjs` files** (ask-bridge, deposit-reminder,
   enforce-brief, flight-recorder, odometer-stop, odometer, prompt-inject,
   session-start, stop-guard, stop-verdict) plus **one backup file**
   (`stop-verdict.mjs.spine-backup-20260812T221423Z`).
7. An existing CORD backup is at `~/.tower-backups/pre-cord-20260813T044255Z/`.
   The ORCH verified it holds the live code set byte-identically (sha256 match on
   cli/server/lib) **but it does NOT contain any of the `.bak-*` files.**

---

## Your identity

- Registration name: `agnt-w0-stage`
- Human name / display: `AGNT w0-stage`
- Your ORCH: `orch-w0-version-control` (pane `w2W:p4`)

## Your file partition (yours exclusively; a sibling owns the rest)

**You may create and write ONLY these paths, all under
`/Users/jrg/agent-core/primitives/mcps/tower/`:**

`lib.mjs`, `cli.mjs`, `server.mjs`, `cli.test.mjs`, `server-drift.test.mjs`,
`COMMS-ARCH.md`, `RESPONSIBLE-PARTY-AND-NQ.md`, `server-drift.criteria.md`,
`server-drift.qa.md`, and `hooks/` (the whole subdirectory).

You must NOT write `README.md` in that directory (a later task owns it), and you must
NOT write anything under `attic/` — a sibling worker (`agnt-w0-attic`) owns `attic/`
and is writing it concurrently.

**CRITICAL — this task is PURELY ADDITIVE. You do NOT touch `~/.tower/` at all.**
You copy FROM it, read-only. You do not move, rename, delete, or symlink anything
there. Replacing the deployed paths is a separate, later task under a different
worker, and doing it early would break the three live panes above. `cp`, never `mv`.

## T2 — Copy the code set into the canonical home, preserving relative layout

The import graph constrains the layout. Verified imports:

- `server.mjs:30` → `from './lib.mjs'`
- `cli.mjs:18` → `from './lib.mjs'`
- `cli.test.mjs:2,3` → `from './cli.mjs'`, `from './lib.mjs'`
- `cli.test.mjs:4` → absolute, `/Users/jrg/agent-core/primitives/hooks/tower-ledger.mjs`
- `hooks/prompt-inject.mjs:8`, `hooks/session-start.mjs:15`,
  `hooks/odometer-stop.mjs:11`, `hooks/odometer.mjs:15`, `hooks/stop-guard.mjs:13`
  → all `from '../lib.mjs'` (relative PARENT import). **Exactly these 5** — the
  original CORD brief said 6; there is no 6th.
- `hooks/flight-recorder.mjs:3` → absolute import into agent-core (already fine)
- `lib.mjs:6,7` → absolute re-export of
  `/Users/jrg/agent-core/primitives/hooks/tower-ledger.mjs`
- `hooks/ask-bridge.mjs:152` → **runtime dynamic import anchored to homedir**:
  `import(pathToFileURL(join(homedir(), '.tower', 'lib.mjs')))`. Note this one; it
  does not constrain your copy, but it is why `~/.tower/lib.mjs` must keep existing
  later.

Consequence: the set must land with the **same relative layout** —
`<root>/lib.mjs`, `<root>/cli.mjs`, `<root>/server.mjs`, `<root>/hooks/*.mjs`.

Copy with `cp -p` (preserve mtimes) from `~/.tower/`:
- the 5 top-level code files in fact 5
- the 4 docs: `COMMS-ARCH.md`, `RESPONSIBLE-PARTY-AND-NQ.md`,
  `server-drift.criteria.md`, `server-drift.qa.md`
- `hooks/` — **the 10 live `.mjs` files only**. Do NOT copy
  `hooks/stop-verdict.mjs.spine-backup-20260812T221423Z`; the sibling worker is
  placing that under `attic/hooks/` where it belongs.

**done when:** all 19 files (5 code + 4 docs + 10 hooks) exist at the canonical path
with sha256 identical to their `~/.tower/` sources, and `~/.tower/` is provably
unmodified (see T2-verify).

## T2-verify — Prove the canonical tree is sound, and prove you changed nothing live

Run these and capture exact output:

1. **Copy fidelity:** sha256 of all 19 canonical files vs their `~/.tower/` sources.
   All 19 must match.
2. **`~/.tower/` untouched:** `ls -la ~/.tower/ ~/.tower/hooks/` showing the same
   files with the same sizes and mtimes as before you started. Capture this listing
   BEFORE you begin as your baseline, and diff the two listings.
3. **Import resolution from the canonical location, without executing anything.**
   Use `bun build --target=bun <file> --outfile=/dev/null` — it resolves the full
   import graph and fails loudly on an unresolved specifier, but does NOT run the
   module. This matters: several of these hooks read stdin and act on it, so
   *importing* them could block forever or fire a real hook action. Do not import
   them to test them.
   The ORCH established the **pre-move baseline from `~/.tower/hooks/`: all 5 of
   stop-guard, prompt-inject, session-start, odometer, odometer-stop resolve OK.**
   Reproduce that for all 10 canonical hooks plus canonical `cli.mjs`, `server.mjs`,
   `lib.mjs`, and report a pass/fail line per file. Any regression vs the baseline is
   a finding to post immediately.
4. **CLI runs from canonical (read-only):**
   `bun /Users/jrg/agent-core/primitives/mcps/tower/cli.mjs status` — exits 0 and
   prints real data. This reads `~/.tower/board.jsonl` because state is homedir-
   anchored (fact 4); that is the expected, correct behaviour and is the proof of
   fact 4. **Do not run any `post`/write CLI verb.**
5. **Tests from the canonical location, with a state-safety check around them.**
   The two test files may or may not write to Tower state — nobody has verified this,
   so instrument it rather than assuming:
   - Record `sha256` and `wc -l` of `~/.tower/board.jsonl` and `~/.tower/ledger.jsonl`
     immediately before the test run.
   - Run `bun test cli.test.mjs` and `bun test server-drift.test.mjs` from the
     canonical directory.
   - Record `sha256` and `wc -l` of both state files immediately after.
   - Report **exact pass/fail/skip counts** for each file. A pre-existing failure is
     completely fine and MUST be reported honestly — do not fix it, do not hide it,
     do not "clean it up." Your job is to report the true number.
   - Report whether the state files changed. If they GREW, that is expected on a live
     bus (other agents are posting concurrently) — distinguish "grew by append" from
     "rewritten" by checking that the old sha256 still matches the corresponding
     line-count prefix of the new file. If either file was **rewritten** rather than
     appended to, STOP immediately, post to the board, and report to the ORCH.

**done when:** all 5 verification items above have captured output, the 19 sha256s
match, `~/.tower/` is provably unmodified, and the test counts are reported exactly.

## Report back with

1. The 19-file sha256 match table.
2. Evidence `~/.tower/` is byte-for-byte unmodified (baseline vs after listing diff).
3. The per-file `bun build` resolution results (13 files), against the 5-file baseline.
4. Pasted output of `cli.mjs status` from the canonical path.
5. **Exact pass/fail/skip counts for both test files**, with any pre-existing failure
   named and quoted. Honest numbers only.
6. The board/ledger state-safety comparison (grew-by-append vs rewritten).
7. Anything you could not prove, stated plainly as a gap. A documented gap is
   acceptable; a silent assumption is not.

Then write `~/.tower/agnt-w0-stage.done` with a two-line summary, and go idle.
