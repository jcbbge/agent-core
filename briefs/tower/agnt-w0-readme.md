# AGNT [w0-readme] — Record the canonical/deployed pattern, and stop state leaking into the code home

## Shared prefix — W0 wave 2 context (identical across all W0 wave-2 briefs)

You are a worker under `ORCH [w0-version-control]` (pane `w2W:p4`,
registration `orch-w0-version-control`). Your ORCH reports to `CORD [Tower]`.

The unit of work: Tower's code was untracked in `~/.tower/`. Wave 1 copied the
canonical code to `~/agent-core/primitives/mcps/tower/` (git-tracked) and committed
it. `~/.tower/` remains the deployed runtime + state home. A later step replaces the
deployed code paths with symlinks into the canonical home.

**THE BUS IS LIVE AND IN USE RIGHT NOW.** Panes `orch-infra-upgrade` (w2V:pQ),
`orch-docs-control-flow` (w2V:pX) and `cord-tower` (w2W:p1) are on this bus;
`orch-docs-control-flow` has been observed running `bun ~/.tower/cli.mjs post`.

### Absolute prohibitions (all W0 workers)

- **NEVER touch Tower state.** `board.jsonl`, `ledger.jsonl`, `odometer.jsonl`,
  `pheromones.jsonl`, `flight/`, `deliverables/`, `cursors/`, `briefs/`,
  and the `*.json` pace/state files in `~/.tower/`. W0 is a CODE change.
- **NEVER delete anything in `~/.tower/`.** Not a `.bak-*` file, not a live file.
  Deletion there is W5 and is the CORD's call.
- **NEVER commit, stage, branch, stash, or run any mutating git command.** Your ORCH
  gates and commits. `git status` / `git diff` / `git log` for reading are fine.
  Never `git add -A` under any circumstance.
- **NEVER restart or kill the running Tower MCP server**, and never kill another
  agent's pane or process.
- **Stay inside your file partition** (stated in your task section).
- If something genuinely destructive or irreversible seems required: STOP, post to
  the board, and report to your ORCH. Do not execute it.

### Tower

- Board topic: **`tower/w0-version-control`**. Post a CLAIM before touching shared
  files, findings as you learn them, and your final report.
- Post with `from` = your own registration name.
- Use `board_post` for all fleet mail. Do **NOT** use `send_to_user` — you are fleet,
  not operator-facing. Your ORCH reads the board.
- Status is not mail. No heartbeats. Post at real checkpoints with specifics.
- nq budget 3. Write `.done` last, after your report lands.

### Pre-Verified Facts (verified by the ORCH on 2026-08-13; re-verify anything you act on)

1. Wave 1 is committed as **`5e281be`** on branch **`tower/w0-version-control`** in
   `~/agent-core` (30 files). `949238d` is its parent.
2. The canonical home `~/agent-core/primitives/mcps/tower/` now contains: `lib.mjs`
   (61 L), `cli.mjs` (296 L), `server.mjs` (350 L), `cli.test.mjs` (180 L),
   `server-drift.test.mjs` (257 L), `COMMS-ARCH.md`, `RESPONSIBLE-PARTY-AND-NQ.md`,
   `server-drift.criteria.md`, `server-drift.qa.md`, `hooks/` (10 live `.mjs`),
   `attic/` (9 preserved backups + README + DIFF-SUMMARY), and `README.md`.
3. **State is anchored to `homedir()`, not to code location.**
   `~/agent-core/primitives/hooks/tower-ledger.mjs` lines 22-28:
   `export const TOWER = join(homedir(), '.tower')`, and LEDGER/BOARD/PHEROMONES/
   DELIVERABLES/ODOMETER/FLIGHT are all `join(TOWER, …)`. `PHEROMONES` additionally
   honours `process.env.TOWER_PHEROMONES_PATH`. **Moving code cannot move state** —
   this is the property that makes the whole W0 design safe.
4. **The relative-import constraint.** `server.mjs:30` and `cli.mjs:18` import
   `./lib.mjs`; `cli.test.mjs:2,3` import `./cli.mjs` + `./lib.mjs`; and **exactly 5**
   hooks import the PARENT `../lib.mjs` — `prompt-inject.mjs:8`,
   `session-start.mjs:15`, `odometer-stop.mjs:11`, `odometer.mjs:15`,
   `stop-guard.mjs:13`. So the set must keep the layout `<root>/lib.mjs` +
   `<root>/hooks/*.mjs`.
5. **Bun resolves symlinks to their real path before resolving relative specifiers.**
   The ORCH proved this experimentally: a hook reached through a symlink reported
   `import.meta.url` at the CANONICAL path, and still resolved `../lib.mjs` correctly
   even after the deployed-side `lib.mjs` symlink was deleted. Relative imports
   therefore resolve from the canonical root.
6. **But `~/.tower/lib.mjs` must still exist regardless**, because
   `hooks/ask-bridge.mjs:152` resolves lib through a runtime homedir-anchored dynamic
   import: `import(pathToFileURL(join(homedir(), '.tower', 'lib.mjs')))`.
7. `~/.claude/tower` is a symlink → `/Users/jrg/.tower`, and
   `~/.claude/settings.json` registers hooks at `/Users/jrg/.tower/hooks/*.mjs` in
   **15 sites** (lines 34, 46, 56, 84, 116, 128, 158, 180, 215, 226, 286, 313, 318,
   329, 340).
8. **Running the test suite from the canonical directory writes a stray
   `ledger.jsonl` into the current working directory** — verified: a
   `server-drift oracle seed` row (`t-sdrift-msr1mp82`, 04:54:01Z) appeared in
   `~/agent-core/primitives/mcps/tower/ledger.jsonl`. It did NOT reach the real
   `~/.tower/ledger.jsonl`. That stray file is currently untracked and was
   deliberately excluded from `5e281be`.
9. Import resolution can be checked WITHOUT executing a module:
   `bun build --target=bun <file> --outfile=/dev/null`. Use this, never `import()` —
   these hooks read stdin and would block or fire real actions.

---

## Your identity

- Registration name: `agnt-w0-readme`
- Human name / display: `AGNT w0-readme`
- Your ORCH: `orch-w0-version-control` (pane `w2W:p4`)

## Your file partition (yours exclusively)

**You may write ONLY:**
- `/Users/jrg/agent-core/primitives/mcps/tower/README.md`
- `/Users/jrg/agent-core/primitives/mcps/tower/.gitignore`

**You may delete exactly one file**, and only this one:
- `/Users/jrg/agent-core/primitives/mcps/tower/ledger.jsonl` — the stray test
  artifact from fact 8. This is explicitly authorised because it was created by our
  own test run at 04:54:01Z today, it is untracked, it is not Tower state (the real
  ledger is `~/.tower/ledger.jsonl` and is untouched), and leaving it invites someone
  to commit state into the code home. **Confirm it is the 267-byte single-row
  oracle-seed file before removing it.** If its content differs from fact 8's
  description in any way, do NOT remove it — post to the board and stop.

Everything else in the canonical directory is out of bounds — do not edit the code,
the hooks, `attic/`, or anything under `~/.tower/`.

**IMPORTANT — worktree trap.** `spine-spawn` may place your cwd in a git worktree
(e.g. `/Users/jrg/.spine/worktrees/agent-core/…`) on its own branch. Your writes must
land in the **MAIN checkout at the absolute path `/Users/jrg/agent-core/…`**, not in
a worktree copy. Use absolute paths for every write, and verify with
`git -C /Users/jrg/agent-core status --porcelain primitives/mcps/tower/` that your
changes appear there.

## T5 — Write the README that stops the next agent rediscovering all this

Rewrite `/Users/jrg/agent-core/primitives/mcps/tower/README.md`. Read the existing
3,378-byte README first and preserve anything still true; you are extending the
record, not erasing it.

It must state, plainly enough that someone touching Tower in three months gets it
right first time:

1. **The canonical/deployed split.** Canonical, git-tracked code lives here; the
   deployed runtime and ALL state live at `~/.tower/`. Which paths are load-bearing
   and must never stop resolving (fact 7 — the MCP registration, the 15 hook
   registration sites, `bun ~/.tower/cli.mjs` documented machine-wide, and the
   `~/.claude/tower` → `~/.tower` double hop).
2. **The state-anchor property** (fact 3) — with the actual file and line numbers —
   and the consequence: moving code cannot move state, which is *why* this split is
   safe at all.
3. **The relative-import constraint** (fact 4) — the layout `<root>/lib.mjs` +
   `<root>/hooks/*.mjs` is load-bearing. Name the exact 5 hooks that use
   `../lib.mjs`. Say that the set must move together, and that piecemeal moves break
   the graph.
4. **The symlink-resolution fact** (fact 5) and **the ask-bridge exception**
   (fact 6) — `~/.tower/lib.mjs` must exist as a resolvable path independent of the
   relative graph, because ask-bridge resolves it from `homedir()` at runtime.
5. **How to verify a change safely** (fact 9): `bun build --target=bun` for import
   resolution, and an explicit warning NOT to `import()` a hook to test it, with the
   reason (they read stdin; they can block or fire real actions).
6. **The test side effect** (fact 8): running the suite here drops a `ledger.jsonl`
   in cwd; it is gitignored; it is not real state.
7. **`attic/`** — what it is and that deleting the `~/.tower/` originals is a
   separate, still-open decision (W5), not something to tidy up casually.

Write it as reference documentation: short sections, concrete paths, real line
numbers. No narrative about this session, no changelog, no worker names.

## T5b — Add the `.gitignore`

Create `/Users/jrg/agent-core/primitives/mcps/tower/.gitignore` that keeps Tower
state out of the code home. At minimum ignore `ledger.jsonl`, `board.jsonl`,
`odometer.jsonl`, `pheromones.jsonl`. Add a one-line comment saying why (test runs
write state relative to cwd; real state belongs in `~/.tower/`).

**done when:**
1. `README.md` covers all 7 points above, with correct paths and line numbers that
   you re-verified rather than copied on faith.
2. `.gitignore` exists and `git -C /Users/jrg/agent-core status --porcelain
   primitives/mcps/tower/` no longer lists `ledger.jsonl` as untracked.
3. The stray `ledger.jsonl` is removed (after the content check), and
   `~/.tower/ledger.jsonl` is confirmed still present and unmodified.
4. Both files are in the MAIN checkout, not a worktree.
5. You ran no mutating git command.

## Report back with

1. The README section list and which facts you independently re-verified (say which
   you checked and how — a fact you took from the brief without checking, say so).
2. Confirmation the stray `ledger.jsonl` matched fact 8 before removal, and that the
   real `~/.tower/ledger.jsonl` is untouched (size/sha before and after).
3. `git status --porcelain` output for the canonical dir proving the .gitignore works
   and your files are in the main checkout.
4. Anything you could not prove, stated plainly as a gap. A documented gap is
   acceptable; a silent assumption is not.

Then write `~/.tower/agnt-w0-readme.done` with a two-line summary, and go idle.
