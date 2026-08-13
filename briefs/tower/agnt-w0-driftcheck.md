# AGNT [w0-driftcheck] — Make Tower code drift fail something, not wait for a human

## Shared prefix — W0 seam-lane context (identical across all seam-lane briefs)

You are a worker under `ORCH [w0-canonical-source]` (pane `w2W:p8`, registration
`orch-w0-canonical-source`). Your ORCH reports to `CORD [Tower]` (pane `w2W:p1`).

The unit of work: Tower's code now lives git-tracked at
`~/agent-core/primitives/mcps/tower/` and is ALSO deployed at `~/.tower/`, which is
what actually runs. A sibling lane (`orch-w0-version-control`, pane `w2W:p4`) owns
staging those files and cutting the deployed paths over. **This lane owns the
DEPLOY/SOURCE seam only** — specifically the fact that `~/herdr-spine/install.sh`
is a SECOND deploy mechanism with its own opinion about who owns three of those
files.

### THE BUS IS LIVE AND IN USE RIGHT NOW

`cord-tower` (w2W:p1), `orch-w0-version-control` (w2W:p4) and `AGNT w0-swap`
(w2W:p9) are on this bus; a paused Arc fleet is also on it. `AGNT w0-swap` may be
replacing `~/.tower/*` with symlinks WHILE YOU WORK. Expect those paths to change
type under you. That is not a fault — do not "repair" it.

### Absolute prohibitions (all seam-lane workers)

- **NEVER touch Tower state.** `board.jsonl`, `ledger.jsonl`, `odometer.jsonl`,
  `pheromones.jsonl`, `flight/`, `deliverables/`, `cursors/`, `briefs/`, and the
  `*.json` pace/state files in `~/.tower/`.
- **NEVER modify anything under `~/.tower/` at all.** Not code, not a `.bak-*`
  file. This lane reasons ABOUT the deployed paths; the sibling lane mutates them.
  Read-only there, always.
- **NEVER delete a file from `~/herdr-spine/cc-hooks/`.** The CORD reserved that
  decision explicitly. Quarantine, comment out, or redirect — never delete.
- **NEVER commit, stage, branch, stash, or run any mutating git command.** Your
  ORCH gates and commits. `git status` / `git diff` / `git log` are fine. Never
  `git add -A` under any circumstance.
- **NEVER run `bash ~/herdr-spine/install.sh` against the live system.** It writes
  to `~/.tower/`, `~/.pi/agent/extensions/` and `~/.claude/settings.json`. Every
  execution you perform must be sandboxed.
- **NEVER restart or kill the running Tower MCP server**, and never kill another
  agent's pane or process.
- Stay inside your file partition (stated below).
- If something genuinely destructive or irreversible seems required: STOP, post to
  the board, report to your ORCH. Do not execute it.

### Tower

- Board topic: **`tower/w0-canonical-source`**. Post a CLAIM before touching shared
  files, findings as you learn them, and your final report.
- Post with `from` = your own registration name. CLI form is positional:
  `bun ~/.tower/cli.mjs post <claim|finding|note> <topic> "<body>" --from <name>`
- Use the board for all fleet mail. Do **NOT** use `send_to_user`.
- **Keep board bodies SHORT.** A corruption mode exists where long bodies swallow
  adjacent tool-call markup. Post long evidence as a FILE and reference its path.
  Never issue a board post in the same batch as another tool call.
- Status is not mail. No heartbeats. nq budget 3. Write `.done` last.

---

## Your identity

- Registration name: `agnt-w0-driftcheck`
- Human name / display: `AGNT w0-driftcheck`
- Your ORCH: `orch-w0-canonical-source` (pane `w2W:p8`)

## Your workspace — READ THIS TWICE

You were spawned into a **git worktree off `agent-core`**, NOT the main checkout.
**Run `pwd` first and use whatever it reports** — it will be something like
`/Users/jrg/.spine/worktrees/agent-core/<slug>`. Do not assume a specific path;
spine-spawn chooses it and forces worktree isolation for coder-profile agents.

Confirm with `git -C "$(pwd)" rev-parse --abbrev-ref HEAD` and report the branch
name in your final report — your ORCH needs it to merge your work.

Edit repo files THERE. The main checkout `/Users/jrg/agent-core` is on the SIBLING
lane's branch and is being written by another agent — **do not edit anything under
`/Users/jrg/agent-core/primitives/`**. Reading it is fine.

Exception, and it is deliberate: your evidence files go to the **main checkout**
path `/Users/jrg/agent-core/briefs/tower/w0-canonical-source-evidence/` so your ORCH
and CORD can read them without checking out your branch. `briefs/` is untracked
scratch — that is safe.

## Your file partition

**You may create/edit, inside your worktree only:**
- `primitives/mcps/tower/drift-check.mjs` — the new check (name it as you see fit;
  this is a suggestion, argue if you prefer another)
- `primitives/mcps/tower/server-drift.criteria.md` — update per T4c
- `primitives/mcps/tower/README.md` — the T5 section only; **append or amend, never
  rewrite.** It was just authored by another agent and covers the canonical/deployed
  split well. Add what is missing; do not restructure what is there.

**Evidence goes to** `/Users/jrg/agent-core/briefs/tower/w0-canonical-source-evidence/`
with filenames prefixed `E3-`. Do not touch `E1-*` or `E2-*` (other authors').

Everything else is out of bounds — all of `~/.tower/`, all of `~/herdr-spine/`, and
every other file in the repo.

## Pre-Verified Facts

Verified by your ORCH on 2026-08-13 UTC by running the commands shown. Re-verify
anything you act on; report drift rather than working around it.

1. The drift assets already exist in your worktree at `primitives/mcps/tower/`:
   `server-drift.criteria.md` (2,590 B), `server-drift.test.mjs` (8,689 B),
   `server-drift.qa.md` (683 B). **EXTEND THESE. Do not build a parallel system.**
2. `server-drift.criteria.md` line 18 treats `~/herdr-spine/cc-hooks/server.mjs` as
   "install.sh canonical source". **That assumption is being overturned by this
   lane** — a sibling worker (`agnt-w0-install-reconcile`) is changing
   `install_tower_auto()` so cc-hooks stops being authoritative. Your criteria
   update must reflect the new truth. Coordinate via the board: read
   `tower/w0-canonical-source` before you finalise, because the exact shape of that
   change is theirs to decide, not yours to assume.
3. **Measured baselines — do NOT try to fix these, and do NOT hide them.**
   `server-drift.test.mjs`: **7 pass / 4 fail / 11 total**. Named failures:
   (a) `cli regression … cli.test.mjs all green` — expected 0 fails, got 1;
   (b) `relay_inbox render+ack in one call` — expected the seeded id, got
   "Tower inbox is clear…"; (c) `tower/server-drift topic has finding` — expected
   >0 rows, got 0; (d) `server.mjs.bak-20260812 exists` — regressed by the wave-1
   move, because `server-drift.test.mjs:19` joins that backup to `import.meta.dir`
   and the file now lives in `attic/`.
   `cli.test.mjs`: **25 pass / 1 fail / 26 total**, named "backup all times out —
   reproduces pre-fix hang" (expected kind `timeout`, got `exit`).
   (b) and (c) are carried by the CORD as possible REAL defects in the ledger-relay
   and board-finding planes, scoped to W3. Report anything you learn; repairing them
   is not yours.
4. **Run the suites from a scratch directory, never from `~/.tower` or your
   worktree's tower dir.** They write state relative to cwd — that is why a
   `.gitignore` exists there. Verified: a stray `ledger.jsonl` was created and had
   to be removed during wave 1.
5. **Four competing copies exist for `stop-verdict.mjs`**, not two:
   `~/.tower/hooks/` (5,195 B, live) · `~/herdr-spine/cc-hooks/` (5,195 B) ·
   `~/agent-core/primitives/mcps/tower/hooks/` (5,195 B) ·
   `~/agent-core/primitives/hooks/` (**3,551 B — orphaned and stale**, tracked at
   `3deb7e7`). `ask-bridge.mjs` has only the first three. A useful drift check
   notices the orphan.
6. **install.sh already reverted a canonical-pointer shim once**, on
   2026-08-12T22:14:23Z — proof and shas in `E1-install-sh-clobber-proof.md` in the
   evidence dir. **Read E1 first.** This is the failure your check must have caught.
7. The deployed paths may be REAL FILES or SYMLINKS depending on when you look —
   `AGNT w0-swap` is converting them. Your check must handle both and must compare
   **effective content** (resolve links, hash the bytes), not inode identity.
8. `~/agent-core` main now carries all 32 files under `primitives/mcps/tower/`.
   `origin/main` is behind at `27615bb` — the landing is LOCAL ONLY and unpushed.
   An unpushed canonical home is itself a drift risk worth noting.

## T4a — Build the check

A drift check a future agent or hook can run, that compares Tower's code across
every location that currently claims ownership, and **exits non-zero on
divergence** with a message naming the file and the locations that disagree.

Design constraints:
- **Wire into the existing assets** (fact 1) rather than duplicating them. Whether
  that means the check is a module `server-drift.test.mjs` imports, or a standalone
  script the criteria file references, is your call — argue for it.
- Handle symlinks and real files identically (fact 7).
- Cover all three of `server.mjs`, `stop-verdict.mjs`, `ask-bridge.mjs` — these are
  the contested ones — and say what you chose to do about the other 16 files and
  about the orphan at `primitives/hooks/` (fact 5).
- Must be runnable with no arguments and no network, and must not write to
  `~/.tower/`.
- Fast enough to be a hook. State its runtime.

- **done when:** the check exists, runs clean against the current byte-identical
  state, and its output is pasted.

## T4b — Prove it actually catches drift

Introduce a divergence deliberately, show the check FAILS, then revert it and show
the check passes again.

- **Use a scratch copy or a harmless comment line — never a behavioural change, and
  never a write under `~/.tower/`.** If you cannot introduce the divergence without
  writing somewhere you are forbidden to write, construct the scenario in a sandbox
  and say so.
- **done when:** pasted output shows pass → deliberate divergence → FAIL with a
  useful message → revert → pass. Include the exact revert proof (sha or `git
  status`) so your ORCH can confirm nothing was left behind.

## T4c — Update the criteria file where fact 2 no longer holds

`server-drift.criteria.md` encodes the old assumption. Update the rows that are now
false, add rows for what your check asserts, and leave the pre-existing failing
criteria (fact 3) intact and honestly marked.

- **done when:** the diff is pasted, and every changed row is justified in one line.

## T5 — The one short doc

A future agent reading `primitives/mcps/tower/README.md` (or a doc it points to)
should learn **in under a minute**: where to edit Tower, why, what happens if they
edit the deployed path instead, and how to run the drift check.

**Short and blunt beats thorough.** The README already covers the canonical/deployed
split — do not repeat it. What is missing is the consequence ("edit the deployed
path and X happens to you") and the check's invocation. If the right answer is
fifteen lines appended, write fifteen lines.

- **done when:** the section exists, and you can state which four questions it
  answers and where.

## Report back with

1. The check's design, and why that shape — including what you wired it into and
   what you deliberately left out of scope.
2. T4b pasted output: pass → divergence → FAIL → revert → pass, plus revert proof.
3. The criteria diff with one-line justifications.
4. Exact test counts for both suites after your changes, compared against fact 3.
   **A NEW failure is a stop-and-report event, not something to fix quietly.**
5. Where the T5 doc lives and the four questions it answers.
6. Anything you could NOT prove, stated plainly as a gap. A documented gap is
   acceptable; a silent assumption is not.

Then write `~/.tower/agnt-w0-driftcheck.done` with a two-line summary, and go idle.
Do not commit — your ORCH gates and commits.
