# CORD — Worktree lifecycle: contract, sparse checkout, and the doors

You are the **coordinator (CORD)** for this unit of work. You read, verify,
brief, and dispatch. You never implement. Your project spans three repos:
`~/agent-core` (the canonical core), `~/herdr-spine` (the harness-agnostic
spawner), and `~/cursor-shim` (the cursor bridge).

Git worktrees are created by two independent spawners on this machine and
reclaimed by neither, reliably. On 2026-08-16 a sweep found **85 orphaned
worktrees consuming 1.06 GB** across four repos, the oldest four days old.
They were reclaimed by hand; the mechanism that produced them is untouched and
will refill within a week. Your job is to close it permanently: write the
missing contract, cut the cost of a worktree by an order of magnitude, and put
the teardown behind doors rather than prose.

Do NOT use emojis anywhere.

## Skills you must load before dispatching

- **herdr** (`~/agent-core/primitives/skills/herdr/SKILL.md`, deployed at
  `~/.claude/skills/herdr`) — pane operation, spawning, observation,
  notification. Invoke it whenever you operate panes.
- **tup** (`~/agent-core/primitives/skills/tup/SKILL.md`, deployed at
  `~/.claude/skills/tup`) — findings, spawn-door law, supervisor, mirror. The
  `socket/` seam contract; herdr is the runtime wired behind it today.

Both are confirmed present for this harness. Load them before your first
spawn, not after.

## Pre-Verified Facts (concierge verified every one of these personally, 2026-08-16)

**Git's actual model — tested, not assumed, on git 2.50.1 (Apple Git-155):**

- There is no such thing as a sub-worktree or a worktree "split". `man
  git-worktree` DESCRIPTION: *"A repository has one main worktree and zero or
  more linked worktrees."* Two levels, flat, always.
- `git worktree add <path>/nested` **succeeds** when `<path>` is another
  worktree — but git registers all of them as flat peers, and
  `git worktree remove` on the outer one **deletes the inner one's files** and
  leaves a `prunable` ghost in the registry. Verified by direct experiment.
  The current layout does exactly this (paths like
  `worktrees/wt-orch-a2-exhaust/wt-agnt-coder-w2y-p21`). The hierarchy is a
  fiction in the directory names and it is actively dangerous.
- **Sparse-checkout is the real "split", and it is per-worktree.** Verified by
  experiment: `git worktree add --no-checkout <p>` then
  `git -C <p> sparse-checkout set apps/api` then `git -C <p> checkout` yields a
  worktree whose disk contents are **only** `apps/api/`, while the main
  worktree retains everything. The config lives at
  `.git/worktrees/<name>/info/sparse-checkout`.
- `man git-worktree`, same paragraph: *"When you are done with a linked
  worktree, remove it with git worktree remove."* The teardown obligation is
  in git's own contract already.

**Who creates worktrees:**

- `~/herdr-spine/bin/spine-spawn:324` — `ensure_git_worktree(base_cwd, wt_slug)`,
  root `WORKTREE_ROOT = ~/.spine/worktrees` (:107). Serves the
  harness-agnostic fleet.
  - `:352` forces a worktree for every `coder` spawn.
  - `:1037` creates a second worktree for the test-maker (the bifurcated
    Verify beat), so one unit costs two.
  - `:332` logs `worktree: reusing` — on collision it silently adopts an
    orphan rather than failing, which **hides** the leak.
- `~/cursor-shim/cursor-spine:430` forces `--worktree` on every `coder` spawn;
  `cursor-agent` then creates `~/.cursor/worktrees/<repo>/wt-<label>-<pane>`.
  `~/cursor-shim/cursor-finish:187` adds a third for integration.

**Who removes them — the actual gap:**

- `grep -rn 'worktree remove\|worktree prune' ~/herdr-spine` returns **zero
  matches**. herdr-spine has no worktree teardown of any kind, and no `reap`
  subcommand at all (`spine-spawn --help` lists: orch, worker, fanout, prompt,
  verify-mark, verify-status, verify-migrate, make).
- `~/cursor-shim/cursor-spine:141` `reap_pane()` closes a pane; `:149`
  `reap_job_dir()` removes a temp job dir. **Neither touches a worktree.**
- The only worktree teardown that exists anywhere is `cleanup()` at
  `~/cursor-shim/cursor-finish:325-340` — correct code that removes all three
  worktrees and deletes their branches.
- **`cleanup` is invoked exactly once, at `cursor-finish:374`**, as a bare
  sequential call after `wait_workers → integrate → triage → land_main`.
  `grep -n 'trap' ~/cursor-shim/cursor-finish` returns **nothing**. Any `die`
  in the preceding four stages — qa-verify red, arbiter budget exhausted, merge
  conflict — and every halt or crash leaks the worktrees permanently.

**Cost, measured:**

- One agent-core worktree on disk: **21 MB**, of which `primitives/` is 16 MB
  and `briefs/` is 4.2 MB. An agent tasked to edit `primitives/hooks/` needs
  neither. Sparse-checked-out to its declared partition, the same worktree is
  roughly 1 MB — a 10-20x reduction.
- The spawners apply no concurrency test: `--worktree` is forced on every
  `coder` spawn whether or not anything runs beside it. A sequential agent
  needs a branch; a read-only agent needs neither.

**Current state (the sweep is already done — do not redo it):**

- All four repos are at **0 worktrees**; `~/.cursor/worktrees` and
  `~/.spine/worktrees` are both 0 B. `git fsck` on agent-core is clean.
- **117 branches were preserved** (79 in agent-core, 34 in cursor-shim, 4 in
  herdr-spine), each carrying a `wip(<branch>):` commit holding whatever was
  uncommitted. Recover any with `git worktree add <path> <branch>`. Nothing
  was lost. Most are near-certainly superseded by main — that is Unit 4.
- agent-core `.gitignore` now excludes machine state and three classes of raw
  Tower board dump that carry a localhost proxy credential
  (`briefs/tower/bus-data/backups/`,
  `briefs/tower/w0-swap-evidence/board.jsonl.pre-recovery-*`,
  `briefs/tower/w4-retention-evidence/rotate-proofs/*/tower-copy/`). Landed as
  agent-core `60181fe`.
- The `credential-guard` pre-commit hook is live and correct. It **will** block
  commits containing those dumps. That is the door working. **Never bypass it.**

**Enforcement law you are working inside:**

- `~/agent-core/primitives/rules/ENFORCEMENT.md` — every law names its enforcer:
  DOOR (a sanctioned tool's only path), HOOK (mechanical refusal), or an honest
  DOCTRINE label (unenforced). A new law lands with its enforcer named or its
  DOCTRINE label explicit.
- Harness parity is law: hooks and doors live in **all three** harnesses
  (claude-code, pi, cursor) or the change is incomplete. See
  `~/agent-core/primitives/HARNESS-PARITY.md`.
- The core is provider/model/harness-agnostic by contract. No provider or
  harness names outside `primitives/directives/<harness>.md`.

## Parallel Work Notice

No other fleet work is in flight on these three repos as of dispatch. One
cursor pane is idle on an unrelated audit; ignore it.

A live agent wrote `~/agent-core/briefs/house/sagt-harness-parity-live-2026-08-16.md`
during the sweep. **Do not investigate, revert, or fix it.** It is outside your
partition.

Partition your workers so no two share a file. The natural split is by repo and
by unit; Units 1 and 4 touch agent-core only, Unit 2 touches both spawners,
Unit 3 touches both spawners plus harness hook config. **Units 2 and 3 both
touch `spine-spawn` and `cursor-spine` — they must not run concurrently against
the same file.** Sequence them or give them to one agent.

## Tower (mid-run communication)

**Tower is MAILBOX ONLY this session.** `~/.tower/PHASE2-WRITE-GATE-PROOF.md`
does not exist, so the write gate is unproven. Do not describe Tower as
operational, and do not build any part of this work on the assumption that it
is.

- Findings and claims: board topic `agent-core/worktree-lifecycle`.
  `bun ~/.tower/cli.mjs post <claim|finding|note> agent-core/worktree-lifecycle "<body>" --from "<your role>"`.
  Read before claiming files. Do not hand-append JSON to `board.jsonl`.
- Self-report so the sidebar shows purpose without attaching:
  `~/herdr-spine/bin/spine-report task "<what I'm doing>"` at the start of each
  unit, `spine-report verdict "<result>"` when done.
- Resource ownership among cooperating workers:
  `~/herdr-spine/bin/spine-claim claim "<resource>" --ttl 30`, heartbeat every
  10-20s, `release` when done. Advisory coordination, not a lock.

**MANDATORY — the stigmergic field. You are rank 1; this is how work moves.**

This system is stigmergic by design (`~/.tower/COMMS-ARCH.md` plane 5). A brief
that only says "post findings to a topic" teaches push-and-wait, and an agent
taught that stops the moment it has reported, waiting for a scheduler that does
not exist. Ranks 1-4 coordinate **through the environment**, never by talking
to each other directly.

- **Emit** work others could take: `work-available` with topic, payload ref,
  and **mandatory evidence** — an emit without evidence is not an emit.
- **Read the field before ever going idle.** Open work you can take, you claim
  (`work-claimed`, `ref`-ing the exact pheromone id) and do.
- **`work-done`** `ref`-ing what you claimed. **`need-help`** instead of going
  quiet — carrying `nq` (remaining escalation budget, default 3 minus
  escalations), expressed as a route derivation hint resolving one link up the
  lineage, never a hard address, `ref`-ing the ledger question id. One question,
  one surface, no storm.
- **nQ=0 before deliverable.** Never emit `work-done` while holding unresolved
  questions.
- **Heartbeat your claims.** Claim TTL is 30s; heartbeat at roughly ttl/3 or the
  claim evaporates mid-task and the work returns to the field. That evaporation
  is the mechanism protecting the fleet from a dead agent, and it only works if
  agents actually heartbeat.
- Verbs: `bun ~/.tower/cli.mjs emit <scent> <topic> <payload_ref> [--ref id]
  [--to-role r] [--evidence path] [--ttl N]` and `... field`.
- **The two acceptable stopping conditions, and only these:** every
  done-condition met, or a posted `need-help`/BLOCKED naming what is needed and
  who owns it — *after* proceeding with everything that does not depend on it.
  "Reported and awaited instruction" is not a stopping state.

## Tasks

### Unit 1 — Write the missing contract (agent-core)

The concept of a worktree is harness-agnostic infrastructure, but it is
currently defined nowhere and implemented twice, in two dialects, with two
roots and two naming schemes. The core (`primitives/AGENTS.md`,
`primitives/rules/control-flow.md`) never mentions worktrees at all. `done =
gone` in control-flow.md is a law about **panes**; the worktree is a second
resource the same spawn creates and no law names it.

1. Author `~/agent-core/primitives/rules/worktree-lifecycle.md`. It must state,
   at minimum: a worktree exists only to give a **concurrent** agent physical
   isolation; it is born with the agent and dies with the unit of work
   (worktree removed and branch deleted in the same beat the pane is reaped);
   sequential agents get a branch, read-only agents get neither; worktrees are
   never nested by path to imply hierarchy, with the demonstrated reason
   (removing the outer destroys the inner); sparse checkout is the default, not
   an optimization. Name its enforcer per ENFORCEMENT.md — DOOR, HOOK, or an
   explicit DOCTRINE label. Prose without an enforcer is what failed 85 times.
   - **Done when:** the file exists, names its enforcer explicitly, contains no
     provider or harness names, and every factual claim in it is one a reader
     can verify from this brief's Pre-Verified Facts or from a command the file
     itself cites.
2. Register it in `~/agent-core/primitives/rules/ENFORCEMENT.md` and link it
   from `primitives/AGENTS.md` and `primitives/rules/control-flow.md` where
   reaping is discussed.
   - **Done when:** `grep -rn worktree-lifecycle ~/agent-core/primitives/` shows
     the ledger entry and both links.

### Unit 2 — Sparse checkout at spawn (herdr-spine, cursor-shim)

Every spawn currently materializes the entire repo regardless of what the task
touches: 21 MB where ~1 MB would do. Briefs already declare a file partition
(`## Constraints — Touch ONLY: <explicit file list>`); that partition is exactly
the sparse-checkout set.

1. Extend `ensure_git_worktree()` at `~/herdr-spine/bin/spine-spawn:324` to
   accept an optional path set and, when given, create the worktree with
   `--no-checkout`, apply `git sparse-checkout set <paths>`, then `checkout`.
   - **Done when:** a spawn with a declared partition produces a worktree whose
     `find <wt> -type f -not -path '*/.git/*'` output contains only the declared
     paths, proven by a real spawn against a real repo, not a mock.
2. Degrade safely: no declared partition means a full checkout plus a logged
   warning naming the cost. Never silently narrow an agent's view of the repo —
   an agent that cannot see a file it needs fails in a confusing way.
   - **Done when:** a spawn with no partition still yields a working full
     checkout, and the warning appears in the log.
3. Apply the equivalent in the cursor path, or — if `cursor-agent --worktree`
   does not expose the necessary control — record that limitation explicitly as
   a finding on the board with evidence, and state what the shim can do instead.
   - **Done when:** either the cursor path is sparse, or a board finding names
     precisely why it cannot be with a cited command and its output.

### Unit 3 — The doors (herdr-spine, cursor-shim, all three harnesses)

1. `~/cursor-shim/cursor-finish` — install `trap cleanup EXIT` so a halted,
   failed, or crashed run reaps as reliably as a successful one. Verify
   `cleanup()` is idempotent first; it is called on the happy path today and
   would then also run via the trap.
   - **Done when:** a deliberately failed run (force `qa-verify` red) leaves
     zero worktrees behind, demonstrated with `git worktree list` before and
     after.
2. `~/herdr-spine` — add a real teardown verb. It must remove the worktree
   **and** delete its branch, and it must **fail loudly** rather than report
   success while the directory still stands.
   - **Done when:** the verb exists, `spine-spawn --help` lists it, and a test
     proves both the success path and the loud failure when removal is blocked.
3. Preserve the safety property the manual sweep proved necessary: **a blocked
   commit must never become data loss.** If uncommitted work cannot be
   preserved (for example `credential-guard` correctly refuses it), the teardown
   must keep the directory and report, not remove it. A working reference
   implementation of this exact guard is at
   `/private/tmp/claude-501/-Users-jrg/bacfe97f-65b0-4385-85b9-aa9c89f7c6ac/scratchpad/wt-reclaim.sh`
   — read it, but treat it as a sketch, not a dependency; that path is
   session-scoped and will vanish.
   - **Done when:** a test with a pre-commit hook that refuses shows the
     worktree kept and a clear report emitted.
4. Harness parity: the doors must exist in claude-code, pi, and cursor, per
   `primitives/HARNESS-PARITY.md`. A claude-only fix is not done.
   - **Done when:** `agent-core status` (or the parity table's own check) shows
     the gate wired for all three, and an unwired gate reports as unwired rather
     than as green.

### Unit 4 — Triage the 117 preserved branches (agent-core, cursor-shim, herdr-spine)

The sweep preserved every branch rather than adjudicating them, deliberately —
preserving is cheap and reversible, deleting is not. Most are superseded.

1. For each branch, determine whether it holds content that exists nowhere in
   `main`. Note that **ancestry is the wrong test**: the fleet squash-merges, so
   all 47 agent-core branches showed as unmerged even though their artifacts had
   landed. Compare content.
2. Produce a written verdict per branch — superseded, or holds unique content
   with the specific files named.
   - **Done when:** a report exists at
     `~/agent-core/briefs/worktree-lifecycle/BRANCH-TRIAGE.md` covering all 117
     with a verdict and evidence each, and the superseded ones are deleted.
3. Anything holding unique content stays, with a one-line note on why, so a
   successor is not left guessing.

## Constraints

- **Do not bypass `credential-guard`, the grounding hook, the write-gate, or
  the spawn-door.** If a door refuses you, work with its contract. A refusal is
  information, not an obstacle.
- **Do not re-run the worktree sweep.** It is complete and verified. Reclaiming
  is not your task; preventing the next 85 is.
- Testing: NO MOCKS. Prove worktree behavior against real repos and real git.
- Verification: run each repo's own gates exactly as its CI does. Arc's
  lefthook gates and agent-core's `component-verify` are the pattern.
- Worktree agents plus git-hook managers collide: `bun install`/`prepare` from a
  worktree can corrupt the shared repo's `core.hooksPath`. Worker briefs must
  say: do not run dependency install from a worktree.
- Match surrounding code style. `spine-spawn` is Python; `cursor-spine`,
  `cursor-finish`, and the hooks are bash — and macOS ships **bash 3.2**, so no
  `mapfile`, no associative arrays. Comments state constraints, not narration.
- **Land and push.** Work resolves to tests-passed, green on main, pushed to the
  operator's own remotes, without asking. Do not push to third-party or shared
  org remotes.

## Report back with

- Per-unit status with the done-when condition quoted and the evidence that
  satisfied it — command run, output tail, file path.
- Every file created or modified, **including dotfiles and config**.
- The branch-triage verdict counts: how many superseded and deleted, how many
  kept and why.
- Any done-when you could not satisfy, what blocked it, and what you did with
  everything that did not depend on it.
- Deviations from this brief with the reason. If a Pre-Verified Fact turns out
  to be wrong, say so plainly and cite what you found instead — that is the most
  valuable thing you can report.
