# ORCH [registry under version control]

slug: `registry-vcs` · branch: `wave/registry-vcs` · **RUN THIS FIRST — other briefs in this wave depend on it**

Read `CONTRACT.md` in this directory first.

## Mission

`~/.agent-core/registry` is the machine-readable source of truth for the entire
agent-core stack: six harness profiles and ~100 primitive blocks that decide what
gets deployed where and which capabilities are verified live. It is **not under
version control.** Its only history is a scattering of `.bak-*` siblings created
by hand. Put it under version control, without changing the path the CLI reads.

## Pre-Verified Facts (verified 2026-08-20)

- `~/.agent-core/registry` exists, 1027 lines, 39693 bytes.
- `git -C ~/.agent-core rev-parse --git-dir` → `fatal: not a git repository`. It
  is not tracked by any repo, including `~/agent-core`.
- Sibling files present in `~/.agent-core/`: `registry.example`,
  `registry.bak-2026-08-11`, `registry.bak-preslate`, plus several
  `registry.bak-<epoch>` created during this session's repairs.
- The CLI resolves the registry path by default to `~/.agent-core/registry`, with
  a `--registry <path>` override. Confirmed in
  `~/agent-core/cli/zig-out/bin/agent-core --help` under OPTIONS.
- `~/agent-core/cli/zig-out/bin/agent-core status` → `359 ok  0 stale  0 missing`.
  This is your floor. It may GROW as sibling orchestrators add rows.
- `~/agent-core` is a git repo on branch `main`, HEAD `cdf2631`.

## The ruling (do not redesign this)

**`git init` in `~/.agent-core`.** Do not move the file into `~/agent-core`, do
not symlink it, do not add a CLI flag. The path stays exactly where it is so no
consumer changes and nothing can break while sibling orchestrators are writing
to it concurrently.

## Tasks

1. Create the worktree per CONTRACT.md, sparse-scoped to `primitives/` (you need
   it only for the doc edit in task 5).
2. `git init` in `~/.agent-core`. Set `user.name` / `user.email` to match
   `~/agent-core`'s config if they are not inherited.
3. Add a `.gitignore` covering `registry.bak-*` — backups are a working
   convention, not history, and committing them defeats the point. Do NOT ignore
   `registry.example`; it is a real artifact.
4. Make one founding commit containing `registry`, `registry.example`, and
   `.gitignore`. Message body must state that this file had no history before
   this commit and why that was dangerous. **No remote. Ever.** This file
   describes the operator's private machine layout.
5. In your worktree, add a short paragraph to `primitives/HARNESS-SHAPE.md`
   under the existing law section recording that the registry is now versioned,
   naming the repo location, and stating the discipline: back up before edit,
   append-only for other components' blocks, verify with `agent-core status`
   after every edit.
6. Commit task 5 on your branch. Deposit `done`.

## Done-when

- `git -C ~/.agent-core log --oneline` shows exactly one commit, and
  `git -C ~/.agent-core status --short` is clean except for ignored backups.
- `git -C ~/.agent-core remote -v` prints nothing.
- `git -C ~/.agent-core show --stat HEAD` lists `registry`, `registry.example`,
  `.gitignore` and no `.bak-*` file.
- `~/agent-core/cli/zig-out/bin/agent-core status` still reports 0 stale, 0
  missing and at least 359 ok. Paste the summary line.
- `primitives/HARNESS-SHAPE.md` carries the new paragraph, committed on
  `wave/registry-vcs`.

## Report-back

Deposit a `done` to `concierge` naming: the commit SHA in `~/.agent-core`, your
branch SHA in `~/agent-core`, and the live status summary line. Then write
`orch-registry-vcs.md.done`.
