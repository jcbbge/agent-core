# ORCH — execute the agent-core credential history rewrite

You own one unit of work: remove a localhost proxy credential from the git
history of `~/agent-core` without breaking the `vein` acceptance suite and
without destroying a live sibling agent's uncommitted work.

Your coordinator is `cord-credential-scrub` (pane `w3R:p11`). The operator has
already ruled that the scrub happens. Do not re-ask that question.

**You do not force-push.** Your coordinator owns integration and performs the
push after verifying your work. You rewrite locally, prove it, and report.

Do NOT use emojis anywhere.

## Pre-Verified Facts

Every fact below was verified by the coordinator by running the command in
`~/agent-core` on 2026-08-16. The long form, with the raw command output, is
`briefs/credential-scrub/PRECONDITIONS-2026-08-16.md` — read it first.

- **The token** is the 32-hex password in
  `http://srt:<32-hex, prefix af8c45e6 — full value deliberately not reproduced>@localhost:54989`. Basic auth
  against localhost on an ephemeral port. Low severity, real exposure.
- **HEAD == `origin/main` == `8e470a7d88a291395316415ba8eae94dcbe77ec1`.**
  (The parent brief said `e6167d0`; that is stale.) Re-confirm before starting.
- **342 commits** across all refs, **20 local branches** (tips listed in the
  preconditions record), **zero linked worktrees**.
- **The token lives in exactly three files**, 2 occurrences each:
  `briefs/session-mining/fixtures-p3/commands.csv`,
  `primitives/tools/vein/test/acceptance/pass12-commands.csv`,
  `primitives/tools/vein/test/acceptance/pass3-commands.csv`.
- **Among remote refs the token is in `origin/main` ONLY.**
  `origin/concierge/2026-08-12` and `origin/archive/pre-reboot-main-2026-04-07`
  are already clean. They will still change SHA because `filter-repo` rewrites
  every ref, but they are not a leak vector.
- `git-filter-repo` **2.47.0** at `/opt/homebrew/bin/git-filter-repo`.
- `vein` binary at `/Users/jrg/.local/bin/vein`.
- **Backup root `~/backups` already exists.** `~/.backups` and `~/.local/backups`
  do not.
- **`latch`** at `/Users/jrg/.local/bin/latch`. `latch wait --pane <id> --until
  idle --until done --timeout 1h`; exit 0 matched, 3 timeout, 4 target vanished.

### The two blockers, already diagnosed — do not re-diagnose them

**Blocker 1 — the working tree is dirty and a live agent owns it.**
`git status --porcelain` shows four modified files
(`primitives/skills/{dev-browser/SKILL.md,micro-animation-director/SKILL.md,
step-workflow.md,tldraw-canvas.md}`, a YAML `description: >` folding change)
plus two untracked brief directories. The four belong to pane `w3R:p12`, label
`ORCH tower-bus-integrity`, status `working`, cwd `/Users/jrg/agent-core` — a
live sibling in this same working tree. `git filter-repo --force` finishes with
a hard reset and would destroy that work.

Do not stash, commit, revert, or investigate those files. The untracked
`briefs/` directories are harmless and never block you.

**Blocker 2 — scrubbing the CSVs breaks the vein oracle, and would only show up
after history was already rewritten.**
`primitives/tools/vein/VERIFY.toml` defines the acceptance oracle as
regenerating the CSV from 21 live transcripts and requiring a **byte-identical**
`diff -q` against the checked-in `pass3-commands.csv`. It is not an assertion on
a literal. Exactly one of those 21 source transcripts still contains the token:

```
/Users/jrg/.claude/projects/-Users-jrg--bb-personal-workspaces-env-2nmkxay7tz/58a01afd-a784-478c-b159-9a5fcd9db99a.jsonl
```

Scrub the CSV in git and the next oracle run regenerates the token from that
transcript and the diff fails.

**Coordinator ruling (binding, do not relitigate):** scrub the token in that one
source transcript using the **identical placeholder** used in the history
rewrite, so both sides carry the same text and the diff passes for the right
reason. The rejected alternative was a `sed` filter inside `VERIFY.toml`, which
would write the credential literal back into the repository.

### Baseline — the floor you must not lower

Both oracles pass today at `8e470a7`, verified by the coordinator:

```
cd ~/agent-core/primitives/tools/vein/test/acceptance
out=$(mktemp) && vein scan --sessions pass3-paths.txt --out "$out" >/dev/null && diff -q "$out" pass3-commands.csv   # exit 0
out2=$(mktemp); vein scan --sessions drift-sessions.txt --out "$out2" >/dev/null 2>&1                                 # exit 4, expected
```

## Tower

Tower is MAILBOX ONLY; `~/.tower/PHASE2-WRITE-GATE-PROOF.md` does not exist, so
the write gate is unproven. Do not call Tower operational.

- Board: `bun ~/.tower/cli.mjs post <claim|finding|note> agent-core/credential-scrub "<body>" --from "orch-rewrite-executor"`
- Field: `bun ~/.tower/cli.mjs emit <scent> <topic> <payload_ref> [--ref id] [--evidence path] [--ttl N] [--from name]`
  and `bun ~/.tower/cli.mjs field`.
- Self-report: `~/herdr-spine/bin/spine-report task "<what>"` / `spine-report verdict "<result>"`.

You are rank 2. You coordinate through the environment, never by talking to a
peer. Emit `work-available` with evidence, `work-claimed` `ref`-ing the id you
claim, `work-done` `ref`-ing the claim, `need-help` rather than silence.
Heartbeat claims; TTL 30s and an unheartbeated claim evaporates by design.
Read the field before ever going idle. nQ budget 3; nQ=0 before any deliverable.

**Two legal stopping states:** every done-when met, or a posted `need-help`
naming what is needed and who owns it, after finishing everything that does not
depend on it. "Reported and awaited instruction" is not a stopping state.

## Tasks

Phase A runs immediately — none of it depends on the dirty tree. Phase B is
gated. Do all of Phase A before you wait on anything.

### A1. Full mirror backup

`git clone --mirror ~/agent-core ~/backups/agent-core-mirror-<UTC timestamp>`.

- **Done when:** the mirror exists, `git -C <mirror> rev-list --all --count`
  prints `342`, and the absolute path is posted to the board.

### A2. Back up the source transcript

Copy the `58a01afd-...jsonl` transcript named above into the same backup
directory, unmodified, before anything touches it.

- **Done when:** the copy exists and `shasum -a 256` of copy and original match,
  with both hashes recorded.

### A3. Write the replace-text rules file OUTSIDE the repo

One line: `<32-hex, prefix af8c45e6 — full value deliberately not reproduced>==>***REMOVED***`.
Put it in your backup directory or `/tmp` — **never inside `~/agent-core`**,
because it contains the credential literal and must never be committed.

- **Done when:** the file exists outside the repo, its path is recorded, and
  `git -C ~/agent-core status --porcelain` shows no new entry for it.

### A4. Rehearse the rewrite on a throwaway clone

This is the step that removes guesswork, and it is mandatory. `filter-repo`'s
handling of remote-tracking refs on a non-fresh repo is not something to
discover on the live repository.

Clone `~/agent-core` to a scratch path (not a mirror — an ordinary clone, so
`filter-repo` behaves as it will on the real tree), run
`git filter-repo --replace-text <rules> --force` there, and record:

1. Does `git grep -l '<token>' $(git rev-list --all)` return nothing.
2. Do the three CSVs still exist, and does each differ from its pre-rewrite
   version **only** at the token (`diff` the old and new file; expect exactly
   the token lines to change, other rows byte-identical).
3. Which refs exist afterward, and specifically what happened to
   `refs/remotes/origin/concierge/2026-08-12` and
   `refs/remotes/origin/archive/pre-reboot-main-2026-04-07` — were they
   rewritten, converted to local branches, or dropped. **If `filter-repo` drops
   them, say so loudly**, because the coordinator cannot force-push a ref that
   no longer exists and the plan changes.
4. The predicted new `main` SHA.
5. The line count of each CSV before and after.

- **Done when:** all five recorded in a findings file on disk and posted to the
  board. If item 3 shows the two non-main refs are not preserved, post
  `need-help` and stop Phase B until the coordinator rules.

### B0. Gate — wait for the tree to be clean

`latch wait --pane w3R:p12 --until idle --until done --timeout 1h`, then
re-check `git status --porcelain`. Clean means: no ` M ` / ` D ` / staged
entries. Untracked `briefs/` directories do not count.

If `latch` returns 3 (timeout) or the tree is still dirty after the pane goes
idle, post `need-help` naming pane `w3R:p12` as the owner and stop. Do not
stash. Do not commit another agent's work.

- **Done when:** `git status --porcelain` shows only untracked `briefs/` entries,
  and that output is recorded with a timestamp.

### B1. Re-verify preconditions immediately before rewriting

HEAD recorded, `git worktree list` shows the main worktree only, tree clean,
all 20 branch tips re-enumerated to a file. Other agents land work here; the
tip may have moved past `8e470a7`, which is fine — record the true value.

- **Done when:** a fresh preconditions record exists on disk and any failed
  precondition is reported instead of worked around.

### B2. Rewrite

`git filter-repo --replace-text <rules> --force` in `~/agent-core`. Replace the
credential only. **Do not delete the three CSVs** — they are legitimate mined
fixtures and the `vein` suite depends on them. Then re-add the remote
`filter-repo` strips: `git remote add origin git@github.com:jcbbge/agent-core.git`.

- **Done when:** `git grep -l '<32-hex, prefix af8c45e6 — full value deliberately not reproduced>' $(git rev-list --all)`
  returns nothing, the three CSVs exist at their paths, each one's non-token rows
  are byte-identical to the pre-rewrite version, and `origin` is back.

### B3. Scrub the source transcript

Replace the token with the identical `***REMOVED***` placeholder in the one
`58a01afd-...jsonl` file. Use `perl -pi -e` — macOS `sed -i` needs an argument
and is a trap here. Verify the file is still valid JSONL afterward (every line
parses).

- **Done when:** the token is absent from that file, every line still parses as
  JSON, and the A2 backup is untouched.

### B4. Run the acceptance suite for real. NO MOCKS.

Both oracles from `VERIFY.toml`, plus `zig build test` in
`primitives/tools/vein`.

- **Done when:** the pass3 oracle exits 0, the drift oracle exits 4,
  `zig build test` passes, and the exact commands with their output tails are
  recorded. A scrub that breaks the suite is not done. If you must change a
  test, say so explicitly and quote the diff — but per the ruling above you
  should not need to.

### B5. Draft the rewrite notice

Write `~/agent-core/briefs/credential-scrub/REWRITE-NOTICE.md`: what changed,
when, the old and new `main` SHAs, and the exact command a person runs to
recover a stale clone. Leave the "pushed at" line blank — the coordinator fills
it after the push.

- **Done when:** the file exists and names both SHAs.

### B6. Hand off for integration

Post a board finding with everything in "Report back with", then emit
`work-done`. **Do not push.** The coordinator verifies independently and
performs the force-push.

- **Done when:** the board finding is posted and the coordinator can reproduce
  every claim from it.

## Constraints

- Do not force-push. Do not push at all. The coordinator lands this.
- Do not bypass `credential-guard`, the grounding hook, the write-gate, or the
  spawn-door. A refusal is information — report it, do not route around it.
- The `utensil-guard` hook denies recursive grep over `~/.claude/projects/`.
  Grepping a single named transcript file is allowed and is how the hit above
  was found. Do not disable the guard.
- Do not delete the CSV fixtures.
- Do not touch, stash, commit, or revert the sibling agent's uncommitted work.
- Do not rewrite any repo other than `~/agent-core`.
- Never write the credential literal into a file inside `~/agent-core`.
- Testing: NO MOCKS. Run the real suite.
- macOS ships bash 3.2 — no `mapfile`, no associative arrays.
- One write per file per thought; read before any second write to the same file.

## Report back with

- The mirror-backup path and the transcript-backup path with both SHA-256s.
- The rehearsal findings, all five items from A4.
- Old and new `main` SHAs.
- Proof the token is gone from every local ref: the exact command and its empty
  output.
- Proof the three CSVs survived intact: the diff showing only token lines changed.
- The full acceptance result: both oracles and `zig build test`, commands and
  output tails.
- Every file created or modified, including files outside the repo and any
  dotfiles.
- Any precondition that failed and what you did instead.
