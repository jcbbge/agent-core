# AGNT [w0-install-reconcile] — Stop install.sh competing for ownership of Tower's code

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
  execution you perform must be sandboxed (see T2b).
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

- Registration name: `agnt-w0-install-reconcile`
- Human name / display: `AGNT w0-install-reconcile`
- Your ORCH: `orch-w0-canonical-source` (pane `w2W:p8`)

## Your file partition

**You may edit exactly these:**
- `/Users/jrg/herdr-spine/install.sh` — function `install_tower_auto()` ONLY
- `/Users/jrg/herdr-spine/cc-hooks/README.md` — may be CREATED by you if useful

**You may create anything under** `/private/tmp/w0-seam-sandbox/` (your sandbox).

**Evidence goes to** `/Users/jrg/agent-core/briefs/tower/w0-canonical-source-evidence/`
with filenames prefixed `E2-`. Do not touch `E1-*` (your ORCH's).

Everything else is out of bounds — in particular all of `~/.tower/`, all of
`~/agent-core/primitives/mcps/tower/`, and the rest of `install.sh`.

## Pre-Verified Facts

Verified by your ORCH on 2026-08-13 UTC by running the commands shown. Re-verify
anything you act on; report drift rather than working around it.

1. `~/herdr-spine` is on branch `main`, tip `1872986 fix(tower): sync canonical
   server.mjs to live — relay_inbox + stigmergy fold`. Working tree has untracked
   files only — no tracked modifications. `origin/main` exists.
2. `install_tower_auto()` begins at **install.sh:194** and installs four things:
   (1) `extensions/tower-auto.ts` → `~/.pi/agent/extensions/`;
   (2) `cc-hooks/server.mjs` → `$tower_dir/server.mjs`;
   (3) `cc-hooks/{stop-verdict,ask-bridge}.mjs` → `$tower_dir/hooks/`;
   (4) `~/.claude/settings.json` hook registrations via a python merge.
   **Only (2) and (3) are in scope for you.** Leave (1) and (4) alone.
3. Paths are overridable by env var — verified by reading install.sh:196-200:
   `TOWER_AUTO_PI_EXT_DIR`, `TOWER_AUTO_TOWER_DIR` (defaults `$HOME/.tower`),
   `TOWER_AUTO_CLAUDE_SETTINGS`. `hooks_dir="$tower_dir/hooks"`. This is what
   makes a sandboxed run possible.
4. **The server.mjs branch (install.sh:218-238) IS sha-guarded.** Logic:
   identical → skip; else if `prod_sha != base_sha` → print
   `WARNING: … drift; NOT overwriting.`; else → backup + `cp`.
   `base_sha="63ec724d"` is hardcoded. The live `~/.tower/server.mjs` sha256
   starts `5657cf0f`. **So the clobber branch for server.mjs is currently
   UNREACHABLE — divergence produces a warning, not an overwrite.**
5. **The hooks branch (install.sh:248-257) is NOT guarded at all.** Verified by
   reading it: `cmp -s` identical → skip; **else unconditional `cp`** after a
   timestamped backup. No sha check, no refuse branch.
6. **The unguarded clobber has ALREADY FIRED.**
   `~/.tower/hooks/stop-verdict.mjs.spine-backup-20260812T221423Z` is 158 bytes and
   contains a canonical-pointer shim:
   `import '/Users/jrg/agent-core/primitives/hooks/stop-verdict.mjs'`.
   install.sh backed it up and replaced it with cc-hooks' 5,195-byte copy on
   2026-08-12T22:14:23Z. Full proof, with the shas: `E1-install-sh-clobber-proof.md`
   in the evidence dir. **Read E1 before starting.**
7. `~/agent-core/primitives/hooks/stop-verdict.mjs` (3,551 B) exists and is tracked
   (`3deb7e7 chore(agent-core): wave2 ORCH-A one-source consolidation`). It is the
   shim's target and is now **orphaned and stale** — different content from the
   5,195 B file that is actually live. There is NO `ask-bridge.mjs` at that path.
8. All three files are currently byte-identical across `~/.tower/`,
   `~/agent-core/primitives/mcps/tower/` and `~/herdr-spine/cc-hooks/` (`cmp`,
   verified 05:0xZ). Nothing is broken right now. You are working at the safe moment.
9. `install.sh` is reachable without a human deciding to run it — referenced by
   `~/herdr-spine/bin/spine-choreo`, `bin/spine-agent`, `bin/handlers/30-choreo`
   and `~/dotfiles/dotter/install`. Treat the path as live.
10. `~/agent-core` main now carries all 32 files under `primitives/mcps/tower/`
    (main was reset to `tower/w0-version-control` at ~05:15Z). `origin/main` is
    still behind at `27615bb` — the landing is LOCAL ONLY and unpushed.

## T2a — Establish the cp-through-symlink behaviour as fact, not inference

Your ORCH asserts that `cp src dst` where `dst` is a symlink follows the link and
writes THROUGH to the target. Prove or refute it in your sandbox with a two-file
experiment. This single fact decides how bad the post-swap failure mode is:
either install.sh replaces a symlink (annoying) or it silently rewrites a
git-tracked file inside `~/agent-core` (serious).

- **done when:** a pasted transcript shows the result unambiguously, and you state
  which of the two failure modes is real. If your ORCH is wrong, say so plainly.

## T2b — Reproduce the clobber in a sandbox, against a symlinked hook

Build a faithful replica under `/private/tmp/w0-seam-sandbox/` and drive the REAL
`install_tower_auto()` at it via `TOWER_AUTO_TOWER_DIR` (plus the other two env
vars pointed at throwaway paths so steps 1 and 4 cannot touch the real system).

Set the sandbox's `hooks/stop-verdict.mjs` up as a **symlink into a scratch copy of
the canonical home**, with content deliberately differing from `cc-hooks/`. Then
run it and observe what happens to both the link and its target.

Source the function without executing the whole script if that is cleaner —
e.g. `source install.sh` then call `install_tower_auto`, or run the script with the
env vars set. Either is fine; say which you used and why it is faithful.

- **done when:** pasted output shows the reproduction, and you state exactly what
  was destroyed — the link, the target, or both.

## T2c — Make install.sh stop competing

Change `install_tower_auto()` so `~/herdr-spine/cc-hooks/` is no longer a competing
source of truth for `server.mjs`, `stop-verdict.mjs` and `ask-bridge.mjs`.

Constraints on your change:
- **Minimal and reversible.** This is another project's repo. Do not restructure
  install.sh, do not touch steps 1 or 4, do not reformat.
- **Do not break herdr-spine's own install flow.** A fresh machine with no
  `~/agent-core` must still end up with a working `~/.tower/` — or must fail
  LOUDLY with an actionable message. Decide which, and defend it.
- **Never delete from `cc-hooks/`** (see prohibitions). If your design makes those
  files vestigial, say so and leave them with a pointer — e.g. a `cc-hooks/README.md`
  recording that they are no longer authoritative and naming what is.
- Preserve the existing behaviour of backing up before any write.

You choose the shape. Options worth weighing, not a menu to pick from blindly:
deferring to the canonical home when it is present; deploying FROM the canonical
home instead of from `cc-hooks/`; detecting a symlinked deployed path and skipping;
extending the sha guard to the hooks; or removing steps 2-3 outright and pointing at
Tower's own deploy path. Argue for what you chose.

- **done when:** the change is in place, and you have re-run your T2b sandbox
  reproduction against the MODIFIED install.sh showing the clobber no longer
  occurs — with pasted before/after output.

## T2d — Prove the fresh-machine path still works

Run the modified `install_tower_auto()` in a sandbox where `$tower_dir` does not
exist yet, to exercise the "fresh" branch (install.sh:242-246 for server.mjs, and
the hooks equivalent).

- **done when:** pasted output shows either a correct fresh install or a loud,
  actionable failure — and you state which, and why that is the right behaviour.

## T2e — Confirm you changed nothing live

- **done when:** pasted output of `git -C /Users/jrg/herdr-spine status --porcelain`
  showing ONLY `install.sh` modified (plus `cc-hooks/README.md` if you created it),
  and `shasum -a 256` of the three live files under `~/.tower/` compared against the
  values you recorded at the start. If `AGNT w0-swap` has turned them into symlinks
  meanwhile, report that as an observation — it is expected, and it is not yours to
  fix or revert.

## Report back with

1. The T2a verdict — cp-through-symlink: which failure mode is real.
2. The T2b reproduction, with pasted output.
3. The change you made to `install_tower_auto()`, why that shape, and what you
   rejected. Include the diff.
4. T2c and T2d pasted before/after output.
5. T2e cleanliness proof.
6. Anything you could NOT prove, stated plainly as a gap. A documented gap is
   acceptable; a silent assumption is not. In particular say so if you could not
   exercise a real `spine-choreo`/`dotter` invocation path.

Then write `~/.tower/agnt-w0-install-reconcile.done` with a two-line summary, and go
idle. Do not commit — your ORCH gates and commits.
