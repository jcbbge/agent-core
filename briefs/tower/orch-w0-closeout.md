# ORCH [w0-closeout] — Kill the last W0 FAIL and close the gate

You own ONE unit: bring Tower W0 to its acceptance signal (drift-check exit 0,
zero FAIL), close the remaining W0 verification gaps that bind the gate, and
report so CORD can mark W0 closed and brief W1.

Your CORD is `CORD [Tower]` (pane `w2Y:p1`, workspace `w2Y`, registration stamped
`CORD tower`). You report to it. You do not implement production code yourself —
decompose, dispatch AGNT workers into your own tab, verify against artifacts,
report. Workers never commit; you stage and commit only when the CORD's gate
criteria are met for a coherent unit. Do NOT use emojis anywhere.

---

## Pre-Verified Facts (CORD verified 2026-08-13 ~12:35Z this session)

1. **Architecture in force** (do not overturn): canonical code =
   `~/agent-core/primitives/mcps/tower/`; state home = `~/.tower/` (unchanged);
   deployed paths are symlinks into the canonical home. Ruling file:
   `~/agent-core/primitives/mcps/tower/DEPLOYMENT.md`.
2. **Cutover is COMPLETE — 19/19.** Verified live: `cli.mjs`, `lib.mjs`,
   `server.mjs`, `hooks/ask-bridge.mjs`, `hooks/stop-verdict.mjs` are all
   symlinks (`test -L` true) into
   `/Users/jrg/agent-core/primitives/mcps/tower/...`. Do NOT re-swap them.
3. **Deployed `cli.mjs` matches canonical** — sha256 prefix `86aeddfa` on both
   paths. The post-path bug fix (`8e54604`, homedir-anchored `BOARD`) is live.
4. **Integrity invariant holds:**
   `~/.tower-backups/pre-cord-20260813T044255Z/board.jsonl` is still an exact
   byte prefix of live `~/.tower/board.jsonl` (backup 3817580 bytes; prefix sha
   `3efb61db723d1e3c`). After any state mutation, re-check. If it fails: STOP
   and escalate to CORD — history was rewritten.
5. **Acceptance instrument:**
   `bun ~/agent-core/primitives/mcps/tower/drift-check.mjs`
   — redirect output to a file, then read `$?`. Piping to `tail` lies about exit.
   Live run this session: **EXIT 1**, summary
   `22 manifest file(s), 22 ok, 1 FAIL, 4 warn`.
   Sole FAIL: `FAIL drift-check.mjs: missing at /Users/jrg/.tower/drift-check.mjs (ENOENT)`.
   WARN (correct): `DEPLOYMENT.md` and `README.md` missing at deployed (repo-only docs).
6. **Root cause of the false positive** (read the code, do not re-derive):
   `drift-check.mjs:93-95` — `severityFor(relPath)` returns `FAIL` for every
   `.mjs` and `WARN` for everything else. `drift-check.mjs` is itself a `.mjs`
   in the canonical manifest but is a **repo-only tool with no deployed twin**
   (same category as DEPLOYMENT.md / README.md). It must never be a FAIL when
   absent from `~/.tower/`.
7. **`ask-bridge.mjs:152`** does
   `await import(pathToFileURL(join(homedir(), '.tower', 'lib.mjs')).href)`
   and sets `lib = null` on failure. This has only ever been build-resolved, never
   exercised live under the symlink deploy. Gap is open since wave 1.
8. **Repos / branches:**
   - `~/agent-core` on `tower/w0-version-control`, HEAD `34011ee` (advancing —
     re-read `git rev-parse HEAD` before acting). Work in a **git worktree**,
     never `git checkout` another branch in the main checkout — symlinks point
     at the working tree and a checkout can take the bus down fleet-wide.
   - `~/herdr-spine` on `tower/w0-install-reconcile`, HEAD `b42132e`
     (install.sh symlink-safe). Spine `main` is still at `1872986` — the
     clobbering installer returns if anyone checks out main. Landing `b42132e`
     onto spine `main` is in scope for this unit; **do not push** either repo
     (agent-core is unpushable — GH013 on pre-existing fixtures; push is
     operator-only).
9. **Full predecessor context:**
   `~/agent-core/briefs/tower/CORD-HANDOFF.md` (esp. §5, §8, §9, §11).
10. **Board topics:** claim/findings on `tower/w0-closeout`; escalate / gate
    signals also mirrored to `tower/fully-operational`. Post STANDALONE
    board_post calls with short bodies; put long evidence in files under
    `briefs/tower/w0-closeout-evidence/` and reference the path. Never batch
    board_post with another tool call (fifth corruption mode — handoff §5).
11. **Stale worktrees** under `~/.spine/worktrees/agent-core/`
    (`w0-canonical-source`, `w0-driftcheck`, `w0-preserve-and-stage-w*`,
    `w0-readme`, `w0-swap`) are leftovers. Do not reuse them blindly; create a
    fresh worktree from current `tower/w0-version-control` tip for your edits.
12. **Bus must stay up.** Do not stop MCP server. Do not rewrite board/ledger
    history. Prefer additive reversible changes. Pre-existing test failures
    (`cli.test.mjs` 25p/1f hang; `server-drift.test.mjs` known fails) stay
    NAMED, not "fixed" as drive-bys.

## Parallel Work Notice

- CORD [Tower] on w2Y:p1 — reads/verifies/gates; will not edit production files.
- CORD [arc] on w2X — different project; ignore.
- No other Tower ORCH is live. Claim `primitives/mcps/tower/drift-check.mjs`
  and (for the spine land) `herdr-spine` merge path on the board before editing.
- Ignore uncommitted noise elsewhere in agent-core (`.coraline/`, `.cursor/`,
  unrelated briefs). Touch ONLY the files listed in Constraints.

## Tower (mid-run communication)

- Board: `mcp__tower__board_post` / `board_read`, topic `tower/w0-closeout`
  (and gate posts to `tower/fully-operational`).
- Harness: cursor — use Tower MCP tools; CLI fallback
  `bun ~/.tower/cli.mjs post …` is safe (BOARD-anchored).
- Herdr: `spine-report task|verdict` for sidebar; claim resources with
  `spine-claim` when ownership matters.
- Do NOT teach or use raw `echo >> ~/.tower/board.jsonl` — that hole is a
  W1 item, out of scope here.

## Tasks

1. **Fix the drift-check false positive** — done when:
   - `drift-check.mjs` explicitly classifies repo-only files
     (`drift-check.mjs`, and keep/align `DEPLOYMENT.md` / `README.md` as
     non-FAIL) so a missing deployed twin is WARN (or excluded), never FAIL.
   - Real drift (byte mismatch on a deployed load-bearing `.mjs`) still FAILs —
     prove with a temporary fixture or a documented dry argument; do not leave
     the check toothless.
   - `bun ~/agent-core/primitives/mcps/tower/drift-check.mjs` against the LIVE
     machine exits **0** with **0 FAIL** (capture full output to
     `briefs/tower/w0-closeout-evidence/drift-check-after.txt` including the
     exit code line you recorded yourself).
   - Change committed on a branch off `tower/w0-version-control` (worktree),
     then integrated into `tower/w0-version-control` without checking out a
     different branch in the main tree (merge/ff via worktree or
     `git fetch`/`merge` patterns that do not retarget the main checkout's
     HEAD away from content the symlinks need). Prefer: edit in a worktree
     branched from current tip, commit there, merge into main checkout's
     current branch with `git merge` while main checkout stays on
     `tower/w0-version-control`. Advance `main` with `git branch -f main <tip>`
     ONLY if CORD asks — default leave main alone this unit unless you must
     keep the "main ≥ deployed" invariant and can prove deployed content is
     unchanged.

2. **Exercise `hooks/ask-bridge.mjs` live under the symlink deploy** — done when:
   - You have run the deployed path
     (`~/.tower/hooks/ask-bridge.mjs` → canonical) in a way that forces the
     dynamic import at line 152 to execute and you have evidence `lib` is
     non-null (log line, probe script, or harness hook invocation with
     captured stdout/stderr).
   - If a truly safe live exercise is impossible without risking the bus,
     write a **named gap** file at
     `briefs/tower/w0-closeout-evidence/ASK-BRIDGE-GAP.md` stating exactly
     what was attempted, what blocked it, and what would close it — do not
     quietly re-do build-time resolution and call it done.

3. **Land herdr-spine `b42132e` onto spine `main`** — done when:
   - `~/herdr-spine` `main` contains the install.sh symlink-safe fix
     (commit `b42132e` or a merge commit that includes it).
   - Verified: `git -C ~/herdr-spine log main -1 --oneline` shows the land;
     `git merge-base --is-ancestor b42132e main` exits 0.
   - Do NOT push. Do NOT delete `cc-hooks/` content (operator-reserved).
   - If merge is not clean fast-forward, stop and ask CORD (nq) before
     resolving anything destructive.

4. **Report W0-closeout final** — done when:
   - Board finding on `tower/fully-operational` summarizing: drift exit code,
     ask-bridge result or named gap, spine main tip, commit SHAs, any nq used.
   - Evidence dir populated; `.done` marker at
     `briefs/tower/w0-closeout-evidence/.done` with one-line status.

## Constraints

- Touch ONLY:
  - `~/agent-core/primitives/mcps/tower/drift-check.mjs`
  - `~/agent-core/briefs/tower/w0-closeout-evidence/**` (you create)
  - `~/agent-core/briefs/tower/orch-w0-closeout.md` (read-only after spawn;
    do not rewrite the brief)
  - `~/herdr-spine` merge to land `b42132e` onto `main` (no other spine edits)
- Do NOT: re-symlink anything under `~/.tower/`; mutate board/ledger except
  append via CLI/MCP; push remotes; delete attic/ or cc-hooks/; "fix"
  pre-existing cli.test / server-drift failures; use harness-internal
  background subagents — if it is work, it is a visible pane
  (`cursor-fleet worker` / `cursor-fleet make`).
- Testing: no mocks. Prove drift-check against the live machine.
- Bus live: after any change that could affect deploy, re-run
  `bun ~/.tower/cli.mjs status` (expect exit 0) and the board prefix check.

## Report back with

Per task: what changed (paths + SHAs), exact commands run with exit codes,
paths to evidence files, deviations with reasons, and a single GO/NO-GO
recommendation for CORD to close W0.
