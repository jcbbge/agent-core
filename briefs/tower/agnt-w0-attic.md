# AGNT [w0-attic] — Preserve Tower's backup files into git history

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
- Post with `from` = your own registration name (`agnt-w0-attic`).
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

- Registration name: `agnt-w0-attic`
- Human name / display: `AGNT w0-attic`
- Your ORCH: `orch-w0-version-control` (pane `w2W:p4`)

## Your file partition (yours exclusively; a sibling owns the rest)

**You may create and write ONLY under:**
`/Users/jrg/agent-core/primitives/mcps/tower/attic/`

**You may READ** anything in `~/.tower/`.

You must NOT write to `~/agent-core/primitives/mcps/tower/README.md`, nor to any of
`lib.mjs`, `cli.mjs`, `server.mjs`, `cli.test.mjs`, `server-drift.test.mjs`,
`hooks/`, `COMMS-ARCH.md`, `RESPONSIBLE-PARTY-AND-NQ.md`, `server-drift.criteria.md`,
`server-drift.qa.md` in that directory — a sibling worker (`agnt-w0-stage`) owns
those and is writing them concurrently.

You must NOT modify or delete the originals in `~/.tower/`. Copy only.

## T1 — Preserve every backup file into the canonical repo

There are **9** backup files, not the 8 the original CORD brief listed. Eight in
`~/.tower/` and one inside `~/.tower/hooks/`:

| # | File |
|---|---|
| 1 | `~/.tower/cli.mjs.bak-20260812T165125Z` |
| 2 | `~/.tower/lib.mjs.bak-20260812T194500Z` |
| 3 | `~/.tower/COMMS-ARCH.md.bak-20260810T221108Z` |
| 4 | `~/.tower/COMMS-ARCH.md.bak-20260812T165025Z` |
| 5 | `~/.tower/server.mjs.bak-20260810T221108Z` |
| 6 | `~/.tower/server.mjs.bak-20260812` |
| 7 | `~/.tower/server.mjs.bak-20260812T165125Z` |
| 8 | `~/.tower/server.mjs.spine-backup-20260730T211657Z` |
| 9 | `~/.tower/hooks/stop-verdict.mjs.spine-backup-20260812T221423Z` |

Copy all 9, preserving mtimes (`cp -p`), into
`/Users/jrg/agent-core/primitives/mcps/tower/attic/`, keeping their exact filenames.
Put #9 at `attic/hooks/stop-verdict.mjs.spine-backup-20260812T221423Z` so its origin
directory stays legible.

Then write `attic/README.md` explaining what the attic is: point-in-time backups that
predate version control, preserved so the content exists in history; they are NOT
live code and nothing imports them; the originals still sit in `~/.tower/` and their
removal is a separate, later decision (W5).

### Also produce the diff summary

For each of the 9, determine how it differs from the live file it backs up
(`cli.mjs.bak-*` → `cli.mjs`, etc.; #9 → `hooks/stop-verdict.mjs`). For each, report:
- sha256 of backup and of the live counterpart, and whether they are identical
- line counts of both, and `diff` stat (lines added/removed)
- one sentence on what actually changed, from reading the diff — not a guess

Two specific things the ORCH wants resolved, because they are traps:
- `server.mjs.bak-20260812` is **the same byte size (16,798) as the live
  `server.mjs`**. Determine by sha256 whether it is genuinely byte-identical or a
  same-size-different-content coincidence. State which.
- `stop-verdict.mjs.spine-backup-20260812T221423Z` is a **3-line shim**, while the
  live `hooks/stop-verdict.mjs` is a **137-line full implementation**. So this
  "backup" is OLDER and structurally different in kind — the shim form was replaced
  by an inlined implementation. Confirm this and say so explicitly; it is a finding
  about how Tower's hooks evolved, not a trivial diff.

Write this diff summary to `attic/DIFF-SUMMARY.md` **and** post its condensed form to
the board.

**done when:**
1. All 9 files exist under `attic/` (8 at top level, 1 under `attic/hooks/`) with
   content byte-identical to their originals — prove with a sha256 comparison of each
   copy against its source, all 9 matching.
2. All 9 originals still exist untouched in `~/.tower/` (prove with `ls`).
3. `attic/README.md` and `attic/DIFF-SUMMARY.md` are written.
4. The condensed diff summary is posted to board topic `tower/w0-version-control`.
5. You have NOT run any mutating git command.

## Report back with

1. The 9-row sha256 verification table (copy vs original).
2. The diff summary — especially your verdicts on `server.mjs.bak-20260812`
   (identical or not) and the `stop-verdict` shim-vs-implementation inversion.
3. Confirmation that all 9 originals are untouched.
4. Anything you could not prove, stated plainly as a gap. A documented gap is
   acceptable; a silent assumption is not.

Then write `~/.tower/agnt-w0-attic.done` with a two-line summary, and go idle.
