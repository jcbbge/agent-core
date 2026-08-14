# AGNT [w0-swap] — Cut the deployed paths over to the canonical home, and prove the live bus survived

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
- Use `board_post` for all fleet mail. Do **NOT** use `send_to_user`.
- **Keep board bodies SHORT.** CORD has recorded a corruption mode where long bodies
  swallow adjacent tool-call markup into the message. Post long evidence as a FILE
  and reference its path. Never issue a `board_post` in the same batch as another
  tool call.
- Status is not mail. No heartbeats. nq budget 3. Write `.done` last.

### Pre-Verified Facts (verified by the ORCH on 2026-08-13; re-verify anything you act on)

1. Wave 1+2 are committed as **`5e281be`** and **`9ff8778`** on branch
   **`tower/w0-version-control`** in `~/agent-core`.
2. The canonical home `~/agent-core/primitives/mcps/tower/` contains all 19 code+doc
   files (`lib.mjs`, `cli.mjs`, `server.mjs`, `cli.test.mjs`, `server-drift.test.mjs`,
   `COMMS-ARCH.md`, `RESPONSIBLE-PARTY-AND-NQ.md`, `server-drift.criteria.md`,
   `server-drift.qa.md`, `hooks/` with 10 live `.mjs`), plus `attic/`, `README.md`,
   `.gitignore`. All 19 are sha256-identical to their `~/.tower/` counterparts.
3. **State is anchored to `homedir()`, not code location** —
   `primitives/hooks/tower-ledger.mjs:22-28`, `join(homedir(), '.tower')`.
   Moving code cannot move state. This is what makes the swap safe.
4. **Bun resolves symlinks to realpath before resolving relative specifiers.** Proven
   experimentally: a hook reached via symlink reported `import.meta.url` at the
   CANONICAL path and still resolved `../lib.mjs` correctly even with the
   deployed-side `lib.mjs` symlink deleted.
5. **Exactly 5 hooks** use the relative parent import `../lib.mjs`:
   `prompt-inject.mjs:8`, `session-start.mjs:15`, `odometer-stop.mjs:11`,
   `odometer.mjs:15`, `stop-guard.mjs:13`. (The original CORD brief said 6; there is
   no 6th.)
6. **`hooks/ask-bridge.mjs:152` resolves lib by runtime homedir-anchored dynamic
   import** — `import(pathToFileURL(join(homedir(), '.tower', 'lib.mjs')))`. So
   `~/.tower/lib.mjs` MUST remain resolvable as a path in its own right, independent
   of the relative graph. A symlink satisfies this; deleting it does not.
7. `~/.claude/settings.json` registers hooks at `/Users/jrg/.tower/hooks/*.mjs` in
   **15 sites** (lines 34, 46, 56, 84, 116, 128, 158, 180, 215, 226, 286, 313, 318,
   329, 340). `~/.claude/tower` is a symlink → `/Users/jrg/.tower`. MCP registration
   is `bun run /Users/jrg/.tower/server.mjs`.
8. Import resolution can be verified WITHOUT executing a module:
   `bun build --target=bun <file> --outfile=/dev/null`. **Never `import()` a hook to
   test it** — several read stdin and would block or fire real actions.
9. A full backup exists at `~/.tower-backups/pre-cord-20260813T044255Z/` holding the
   live code set byte-identically, and every file is also in git at `5e281be`.

---

## Your identity

- Registration name: `agnt-w0-swap`
- Human name / display: `AGNT w0-swap`
- Your ORCH: `orch-w0-version-control` (pane `w2W:p4`)

## Your file partition

**You may replace these 19 paths in `~/.tower/` with symlinks** (and nothing else):
`lib.mjs`, `cli.mjs`, `server.mjs`, `cli.test.mjs`, `server-drift.test.mjs`,
`COMMS-ARCH.md`, `RESPONSIBLE-PARTY-AND-NQ.md`, `server-drift.criteria.md`,
`server-drift.qa.md`, and `hooks/{ask-bridge,deposit-reminder,enforce-brief,
flight-recorder,odometer-stop,odometer,prompt-inject,session-start,stop-guard,
stop-verdict}.mjs`.

**You may also edit exactly one repo file:**
`/Users/jrg/agent-core/primitives/mcps/tower/.gitignore` (task T3c).

Everything else is out of bounds — especially the 9 `.bak-*`/`.spine-backup-*` files,
all Tower state, and all other repo files.

**WORKTREE TRAP.** `spine-spawn` may put your cwd in a git worktree
(`/Users/jrg/.spine/worktrees/agent-core/…`). Every symlink target MUST be the
**MAIN checkout absolute path** `/Users/jrg/agent-core/primitives/mcps/tower/…`.
A symlink into a worktree would break when that worktree is removed. Verify each
target with `readlink` afterwards.

## T3a — Snapshot first

Before touching anything, record to a file under
`/Users/jrg/agent-core/briefs/tower/w0-swap-evidence/` (create it):
`ls -la ~/.tower/ ~/.tower/hooks/`, and sha256 of all 19 deployed files, plus
sha256 + `wc -l` of `board.jsonl` and `ledger.jsonl`.

## T3b — Cut over atomically, one path at a time

**Use an atomic replace. Never `rm` then `ln -s`** — that leaves a window where the
path does not exist, and live agents are calling `bun ~/.tower/cli.mjs` right now.
For each file:

```bash
ln -s "/Users/jrg/agent-core/primitives/mcps/tower/<rel>" "$HOME/.tower/<rel>.swaptmp"
mv -f "$HOME/.tower/<rel>.swaptmp" "$HOME/.tower/<rel>"   # rename(2) = atomic replace
```

Order: `lib.mjs` first (fact 6 depends on it), then `cli.mjs`, `server.mjs`, the 4
docs, then the 10 hooks. Content is byte-identical on both sides (fact 2), so at
every instant the path resolves to the same bytes.

The running MCP server holds its inode and is unaffected by replacing `server.mjs`.
**Do not restart it.**

After each swap, verify with `readlink` that the target is the main checkout.

## T3c — Widen the `.gitignore` to the CORD's specification

CORD requires `primitives/mcps/tower/.gitignore` to cover `*.jsonl`, `flight/`,
`deliverables/`, and `cursors/`. It currently names only four `.jsonl` files. Widen
it, keeping the existing explanatory comment. Do not remove anything from it.

## T3d — Prove it, with pasted output for ALL of these

1. `bun ~/.tower/cli.mjs status` — exits 0 and prints real data.
2. `bun ~/.tower/cli.mjs board --limit 3` — exits 0.
3. `claude mcp list` — still shows `tower: … ✔ Connected`.
4. A **fresh** MCP server process starts clean: spawn `bun run ~/.tower/server.mjs`,
   send an `initialize` JSON-RPC request over stdio, get a valid result, then kill
   **that process only**.
5. All **5** relative-importing hooks (fact 5) resolve through their new symlinks —
   `bun build --target=bun /Users/jrg/.tower/hooks/<h>.mjs --outfile=/dev/null`.
   Do all 10 hooks while you are there. Per fact 8, do NOT `import()` them.
   (The original brief said 6 hooks; report the true number, which is 5.)
6. `bun test` for `cli.test.mjs` and `server-drift.test.mjs`. Report **exact
   pass/fail counts**. The ORCH has already measured the true baselines on faithful
   replicas: cli.test.mjs **25 pass / 1 fail** in BOTH layouts (pre-existing), and
   server-drift **8 pass / 3 fail** before the move vs **7 pass / 4 fail** after —
   one regressed assert, `server.mjs.bak-20260812 exists`, because
   `server-drift.test.mjs:19` joins that backup to `import.meta.dir` and it now lives
   in `attic/`. **Confirm or refute those numbers. Do NOT fix the test** — CORD has
   scoped it into W3. Run these from a scratch directory, not from `~/.tower`, so the
   suite's cwd-relative state writes cannot land in the real state home.
7. `ls -l ~/.claude/tower/cli.mjs` resolves (the `~/.claude/tower` → `~/.tower` →
   canonical double hop).

## T3e — Liveness

Confirm `board.jsonl` and `ledger.jsonl` are unchanged or only GREW (old sha256 still
matches the new file's line-count prefix — append, never rewrite). Post one short
board line from the CLI path and read it back. Then run `herdr agent list` and
confirm no pane entered an error state.

**If any live pane breaks, STOP and report immediately. Do not attempt a repair that
widens the blast radius.** Rollback is: replace the symlink with the real file from
`~/.tower-backups/pre-cord-20260813T044255Z/` using the same atomic `mv -f`.

## done when

All 19 paths are symlinks to the main checkout (proved with `readlink`), all 7 proofs
in T3d have pasted output, T3e shows append-only state and no broken pane, and
`.gitignore` covers CORD's four patterns.

## Report back with

1. The mechanism you used and confirmation every target is the main checkout.
2. Pasted output for all 7 T3d items.
3. Exact test counts, and whether they confirm or refute the ORCH's baselines.
4. T3e liveness evidence.
5. Anything you could not prove, stated plainly as a gap — in particular, say so if
   you did not exercise `ask-bridge.mjs` live (that gap is already acknowledged).

Then write `~/.tower/agnt-w0-swap.done` with a two-line summary, and go idle.
