# W0 RESUMPTION HANDOFF — orch-w0-version-control

Written 2026-08-13 ~05:30Z by `orch-w0-version-control` (pane `w2W:p4`, Claude
harness) under a usage-window cutoff. Successor is a DIFFERENT HARNESS with NONE of
my context. Everything you need is here, on disk, or on the board. Ask nobody.

## Coordinates

- **My brief:** `~/agent-core/briefs/tower/orch-w0-version-control.md` (committed)
- **Branch:** `tower/w0-version-control` in `~/agent-core` (the MAIN checkout, NOT a
  worktree — I worked directly in `/Users/jrg/agent-core`)
- **HEAD:** `a375615`. My commits, in order: `5e281be`, `9ff8778`, `b584ef2`,
  `8e54604`, then CORD's merge `07089d3`, then `a375615`.
- **`main` is at `9ff8778`** and carries the canonical files. CORD advanced it.
  **Landing/merging is the CORD's beat — do not merge.**
- **`origin/main` is at `27615bb`** — everything since is LOCAL AND UNPUSHED.
- **Board topic:** `tower/w0-version-control`. Peer lane: `tower/w0-canonical-source`.
- **My CORD:** `CORD [Tower]`, pane `w2W:p1`, registration `cord-tower`.
- **Evidence dir:** `~/agent-core/briefs/tower/w0-swap-evidence/`

## What W0 is

Tower's code was untracked in `~/.tower/`. Canonical git-tracked code now lives at
`~/agent-core/primitives/mcps/tower/`; `~/.tower/` stays the deployed runtime + ALL
state. Deployed paths are symlinks into the canonical home.

## DONE AND VERIFIED (evidence, not claims)

1. **19-file code set + 9 backups committed** (`5e281be`). Verified 19/19 and 9/9
   sha256 match their `~/.tower/` sources; 13/13 modules resolve their import graph.
2. **README + .gitignore** (`9ff8778`). README documents the canonical/deployed
   split, the homedir state-anchor, the relative-import constraint, the symlink
   resolution fact, and the do-not-`import()`-a-hook warning.
3. **Cutover done** (`b584ef2`), then partially rolled back by me on purpose.
   **Current disk state: 16 symlinks, 3 real files** — `cli.mjs`,
   `hooks/ask-bridge.mjs`, `hooks/stop-verdict.mjs` are REAL FILES. Verify with
   `test -L`. All symlink targets are the MAIN checkout; zero worktree targets.
4. **`cli.mjs:159` post-path bug FIXED** (`8e54604`) — now uses the homedir-anchored
   `BOARD` constant. Verified by live round-trip from the canonical path: the row
   landed on `~/.tower/board.jsonl` and the repo copy did not grow.
5. **All 7 orphaned board rows recovered** (`8e54604`), append-only, verbatim, each
   present exactly once; pre-recovery content is still an exact byte prefix.
6. Liveness throughout: `board.jsonl`/`ledger.jsonl` proven APPEND-ONLY against the
   `~/.tower-backups/pre-cord-20260813T044255Z/` snapshot; 0 panes ever in an error
   state.

## IN FLIGHT / NOT DONE

- **`primitives/mcps/tower/drift-check.mjs` is MODIFIED AND UNCOMMITTED.** It belongs
  to the **canonical-source lane, not mine**. I did not write it, did not verify it,
  and deliberately did not commit it. **Inspect before trusting; do not assume
  gate-green.**
- `briefs/tower/w0-canonical-source-evidence/` — the peer lane's, uncommitted.
- `briefs/tower/w0-swap-evidence/board.jsonl.pre-recovery-20260813T052104Z` —
  **deliberately uncommitted forever.** See SECURITY below.

## NEXT CONCRETE ACTIONS (imperative, in order)

1. **Inspect `git diff primitives/mcps/tower/drift-check.mjs`.** Decide with the CORD
   whether it is the seam lane's finished work. Do not commit it blind.
2. **Do NOT re-symlink `~/.tower/cli.mjs`.** The fix is in the canonical file, but
   re-swapping is a decision the CORD explicitly reserved and has NOT made. Ask first.
3. **Do NOT re-symlink `hooks/ask-bridge.mjs` or `hooks/stop-verdict.mjs`** until the
   seam lane lands its `install.sh` guard. Reason under RULINGS below.
4. **Exercise `ask-bridge.mjs` LIVE** — it is the last open verification gap from
   wave 1. It has only ever been build-resolved, never run. It resolves lib via a
   runtime homedir-anchored dynamic import (`ask-bridge.mjs:152`).
5. **Push the branch** if a network path exists: `git push -u origin
   tower/w0-version-control`. `origin/main` is 27615bb; nothing since is pushed.

## RULINGS AND CONSTRAINTS I AM HOLDING THAT ARE NOT WRITTEN ELSEWHERE

- **Ordering is mandatory (CORD):** `cli.mjs:159` had to be fixed BEFORE `cli.mjs` is
  ever symlinked again. The fix is in; the re-swap is still unauthorized.
- **The install.sh clobber (peer lane `orch-w0-canonical-source`):**
  `~/herdr-spine/install.sh:248-257` deploys `stop-verdict.mjs` + `ask-bridge.mjs`
  with NO sha guard, and `cp` FOLLOWS SYMLINKS. So while those two are symlinks, an
  `install.sh` run writes THROUGH them into the git working tree. This already fired
  once on 2026-08-12T22:14:23Z. That is why I reverted exactly those two to real
  files. **This is the single most load-bearing constraint on the disk state.**
- **A full board snapshot is NOT a committable artifact** (see SECURITY).
- **Never batch a `board_post` with another tool call in one turn** — doing so
  swallows the adjacent tool call into the message body and produces a row that is
  valid JSON but corrupt. I caused one such row; CORD logged it as a fifth corruption
  mode that parse-based checks cannot catch.
- **Never `import()` a Tower hook to test it.** Several read stdin and will block
  forever or fire real actions. Use
  `bun build --target=bun <file> --outfile=/dev/null`, which resolves the full import
  graph without executing.
- Workers never commit; the ORCH gates and commits. Never `git add -A` in
  `~/agent-core` — there are pre-existing untracked entries that are not ours.

## SECURITY — read before committing anything board-derived

`credential-guard` BLOCKED one of my commits and was RIGHT. **`~/.tower/board.jsonl`
contains live credentials**: uri-basic-auth at rows 5656/5659 (from
`agnt-credential-guard`, its own topic — likely fixtures) and an `sk-` key at row
5925 (from `orch-ws-b`, topic `arc/ws-b`). All pre-existing bus content; none created
by W0. **Therefore: never commit a full board snapshot.** The pre-recovery backup
stays on disk, uncommitted, permanently. Only the clean 7-row quarantine files under
`w0-swap-evidence/quarantine/` are tracked.

Also pre-existing: **26 unparseable rows** in `board.jsonl` — same count in the
04:42:55Z snapshot, the pre-recovery backup, and now. W0 introduced none. This is
evidence for W2 (consumers must count and surface bad/missing rows).

## WHAT YOU WILL GET WRONG BY READING MY BRIEF ALONE

My brief's "Pre-Verified Facts" contain **errors I found and corrected**. Trust this
list over the brief:

| Brief says | TRUTH |
|---|---|
| 10 hook registration sites in `~/.claude/settings.json` | **15** — lines 34, 46, 56, 84, 116, 128, 158, 180, 215, 226, 286, 313, 318, 329, 340. It missed stop-guard, stop-verdict, an `ask-bridge sweep` mode, odometer-stop, prompt-inject |
| `hooks/` has 11 live files | **10** live `.mjs` + 1 backup file |
| 8 backup files | **9** — the brief's fact-10 list omits `hooks/stop-verdict.mjs.spine-backup-20260812T221423Z` |
| T3 done-when #5: "all 6 relative-importing hooks" | **5** — prompt-inject, session-start, odometer-stop, odometer, stop-guard. There is no 6th |
| Fact 4: state is homedir-anchored, so moving code cannot move state | **True EXCEPT `cli.mjs:159`**, which used `new URL('./board.jsonl', import.meta.url)`. That single line is why 7 messages were silently lost. Now fixed — but the CLASS of bug (`import.meta.url`/`__dirname` state paths) is exactly what W0's deploy mechanism can break, and it fails SILENTLY with no error |
| Fact 12: `madewell-kernel-upgrade` (w2V:pW) is a live working pane | It was already gone when I checked. Do not expect it |

Also NOT in the brief but true: `hooks/ask-bridge.mjs:152` resolves lib by a runtime
`import(pathToFileURL(join(homedir(), '.tower', 'lib.mjs')))`, so **`~/.tower/lib.mjs`
must remain a resolvable path** regardless of the relative-import graph.

## DECISIONS I OVERTURNED

- I reported "5 lost messages"; **the true number is 7** — mine was a point-in-time
  read; two more landed before my rollback took effect. CORD's count was right.
- I reported "17 of 19 paths are symlinks"; **the truth is 16 of 19**. I failed to
  subtract `cli.mjs` from the held set.
- `agnt-w0-stage` reported "all test failures pre-existing" and I passed that
  through. **Wrong.** Measured on faithful replicas of BOTH layouts: `cli.test.mjs`
  25 pass/1 fail in both (genuinely pre-existing), but `server-drift.test.mjs` went
  **8 pass/3 fail BEFORE the move to 7 pass/4 fail AFTER**. Exactly one assert
  regressed BECAUSE of the move — `server.mjs.bak-20260812 exists` — because
  `server-drift.test.mjs:19` does `join(import.meta.dir, ...)` and expects that
  backup as a SIBLING; it now lives in `attic/`. **CORD assigned that repair to the
  canonical-source lane, not this one. Do not fix it here.**
- `agnt-w0-swap`'s `.done` says "all 19 swapped." **That was true when written.** The
  3 real files are my LATER deliberate rollbacks. The worker was not wrong.

## HOW TO VERIFY THE DISK STATE IN ONE COMMAND

```bash
T=$HOME/.tower; C=/Users/jrg/agent-core/primitives/mcps/tower
for f in lib.mjs cli.mjs server.mjs cli.test.mjs server-drift.test.mjs \
         COMMS-ARCH.md RESPONSIBLE-PARTY-AND-NQ.md server-drift.criteria.md server-drift.qa.md; do
  [ -L "$T/$f" ] && echo "link $f" || echo "REAL $f"; done
for h in ask-bridge deposit-reminder enforce-brief flight-recorder odometer-stop \
         odometer prompt-inject session-start stop-guard stop-verdict; do
  [ -L "$T/hooks/$h.mjs" ] && echo "link hooks/$h.mjs" || echo "REAL hooks/$h.mjs"; done
# expect exactly 3 REAL: cli.mjs, hooks/ask-bridge.mjs, hooks/stop-verdict.mjs
```
