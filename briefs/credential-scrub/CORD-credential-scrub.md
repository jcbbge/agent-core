# CORD — Scrub the localhost proxy credential from agent-core history

You are the **coordinator (CORD)** for this unit. You read, verify, brief, and
dispatch. You never implement. Project: `~/agent-core`.

A localhost proxy credential is published in `origin/main` of
`git@github.com:jcbbge/agent-core.git`. **The operator has already ruled: scrub
history now.** That ruling is your authorization; do not re-ask it. Your job is
to execute the rewrite safely and prove it landed.

Do NOT use emojis anywhere.

## Skills to load before dispatching

- **herdr** (`~/.claude/skills/herdr`) — pane operation, spawning, observation.
- **tup** (`~/.claude/skills/tup`) — findings, spawn-door law, supervisor.

## Pre-Verified Facts (concierge verified every one personally, 2026-08-16)

- The credential is `http://srt:<32-hex>@localhost:54989`, prefix `srt:af8c45e6`
  (full value deliberately not reproduced here; it lives in the filter-repo
  rules file at `/Users/jrg/backups/credential-scrub-replace-rules-20260816.txt`,
  which is outside the repo and is the one place it belongs)
  — basic auth, user `srt`, 32-hex password, against **localhost on ephemeral
  port 54989**. It grants nothing to anyone who clones the repo. Severity is
  low; exposure is real.
- It appears in `origin/main` in exactly three files, confirmed by
  `git grep -l '<token>' origin/main`:
  - `briefs/session-mining/fixtures-p3/commands.csv`
  - `primitives/tools/vein/test/acceptance/pass12-commands.csv`
  - `primitives/tools/vein/test/acceptance/pass3-commands.csv`
  In each it is the value of a `PX=` proxy env var captured in mined session
  transcripts.
- Repo scale: **342 commits** across all refs, **20 local branches**, remote
  refs `origin/main`, `origin/concierge/2026-08-12`,
  `origin/archive/pre-reboot-main-2026-04-07`.
- `git-filter-repo` is installed at `/opt/homebrew/bin/git-filter-repo`.
- **The blocker is cleared.** This rewrite was deferred on 2026-08-16 because
  agent-core had 47 open worktrees (85 machine-wide) whose commits the rewrite
  would orphan. All worktrees have since been reclaimed — `git worktree list`
  returns the main worktree only, in agent-core, cursor-shim, and herdr-spine.
  Verify this yourself before starting; if any worktree exists, stop and report.
- `git fsck` on agent-core was clean after the reclaim.
- HEAD == `origin/main` == `e6167d0` at the time of this brief. Confirm current
  HEAD yourself; other agents are landing work in this repo.

## Parallel Work Notice

**This repo has concurrent live work. This matters more than usual because you
are rewriting history.**

- A separate live agent has ~18 uncommitted changes in agent-core (the
  super-search retirement and `utensil-guard` hooks: `primitives/skills/colgrep/`,
  `composto/`, `coraline/`, `pickbrain/`, `primitives/hooks/utensil-guard*`,
  deletions under `primitives/skills/super-search/`). **Do not investigate,
  revert, commit, or fix them.**
- A rewrite with uncommitted work in the tree is how work gets destroyed.
  **Before rewriting: confirm the working tree is clean, or coordinate so that
  agent lands first.** If it is still dirty, post `need-help` naming the
  conflict and proceed with everything that does not depend on it. Do not
  stash, do not commit another agent's work.

Post claims and findings to board topic `agent-core/credential-scrub`.

## Tower (mid-run communication)

**Tower is MAILBOX ONLY.** `~/.tower/PHASE2-WRITE-GATE-PROOF.md` does not
exist, so the write gate is unproven. Do not call Tower operational.

- `bun ~/.tower/cli.mjs post <claim|finding|note> agent-core/credential-scrub "<body>" --from "<role>"`
- Self-report: `~/herdr-spine/bin/spine-report task "<what>"` /
  `spine-report verdict "<result>"`.
- Resource ownership: `~/herdr-spine/bin/spine-claim claim "<resource>" --ttl 30`,
  heartbeat every 10-20s, `release` when done.

**MANDATORY — the stigmergic field. You are rank 1.** Ranks 1-4 coordinate
through the environment, never by talking to each other. Emit `work-available`
with **evidence** (an emit without evidence is not an emit). Read the field
before ever going idle; claim with `work-claimed` `ref`-ing the pheromone id;
`work-done` `ref`-ing what you claimed; `need-help` rather than going quiet,
carrying `nq` (default 3 minus escalations) as a route hint one link up the
lineage, never a hard address. **nQ=0 before any deliverable.** Heartbeat
claims — TTL is 30s and an unheartbeated claim evaporates by design.
Verbs: `bun ~/.tower/cli.mjs emit <scent> <topic> <payload_ref> [--ref id] [--evidence path] [--ttl N]` and `... field`.
**Two legal stopping conditions only:** every done-when met, or a posted
`need-help` naming what is needed and who owns it, after doing everything that
does not depend on it. "Reported and awaited instruction" is not a stopping
state.

## Tasks

### 1. Full backup before touching anything

`git clone --mirror` agent-core to a timestamped path outside the repo, and
record the path in your findings.
- **Done when:** the mirror exists, `git -C <mirror> rev-list --all --count`
  returns 342 (or the current true count), and the path is posted to the board.

### 2. Confirm preconditions

Working tree clean; zero linked worktrees; HEAD known and recorded; all 20
local branches enumerated with their tips recorded to a file you keep.
- **Done when:** a preconditions record exists on disk listing every branch and
  its tip SHA, and any failed precondition is reported instead of worked around.

### 3. Rewrite

Use `git filter-repo` with a `--replace-text` rule mapping the token to a
placeholder such as `***REMOVED***`. Replace the **credential only** — do not
delete the three CSV files; they are legitimate mined-session fixtures and the
`vein` acceptance suite depends on them.
- **Done when:** `git grep -l '<token>' $(git rev-list --all)` returns nothing
  across every ref, and the three CSVs still exist at their paths with their
  other rows intact.
- Note `filter-repo` removes the `origin` remote by default. Re-add it:
  `git remote add origin git@github.com:jcbbge/agent-core.git`.

### 4. Verify the suite still passes

The `vein` acceptance tests consume those CSVs. A scrub that breaks them is not
done.
- **Done when:** the vein acceptance suite runs and passes, with the command and
  output tail recorded. If a test asserts on the literal token, fix the test to
  assert on the placeholder and say so explicitly in your report.

### 5. Force-push all three remote refs

`main`, `concierge/2026-08-12`, `archive/pre-reboot-main-2026-04-07`. All must
be rewritten or the token survives on the ones you skip.
- **Done when:** `git grep -l '<token>' origin/main origin/concierge/2026-08-12 origin/archive/pre-reboot-main-2026-04-07`
  returns nothing after a fresh `git fetch --all`.

### 6. Record the operator-facing consequence

A history rewrite invalidates every existing clone. Write
`~/agent-core/briefs/credential-scrub/REWRITE-NOTICE.md` stating what changed,
when, the old and new `main` SHAs, and the exact command a person needs to
recover a stale clone.
- **Done when:** the file exists and names both SHAs.

## Constraints

- **Do not bypass `credential-guard`, the grounding hook, the write-gate, or the
  spawn-door.** A refusal is information.
- Do not delete the CSV fixtures. Replace the credential inside them.
- Do not touch the other agent's uncommitted work.
- Do not rewrite any repo other than agent-core.
- If the working tree is dirty when you reach task 3, **stop and report** — do
  not rewrite over another agent's uncommitted work.
- Testing: NO MOCKS. Run the real acceptance suite.
- macOS ships bash 3.2 — no `mapfile`, no associative arrays.

## Report back with

- The mirror-backup path.
- Old and new `main` SHAs.
- Proof the token is gone from all refs: the exact command and its empty output.
- The vein acceptance result, with the command and output tail.
- Every file created or modified, including dotfiles and config.
- Any precondition that failed and what you did instead.
