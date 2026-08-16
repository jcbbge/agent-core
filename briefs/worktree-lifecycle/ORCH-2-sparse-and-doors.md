# ORCH — Units 2 and 3: sparse checkout at spawn, and the teardown doors

You are the **orchestrator** for one unit of work spanning two spawners. You
decompose, dispatch, verify, and reap. You never implement. This brief is
binding and self-contained.

Do NOT use emojis anywhere.

## Why this unit exists

On 2026-08-16 a sweep found 85 orphaned git worktrees consuming 1.06 GB across
four repos, oldest four days old. They were reclaimed by hand. **The mechanism
that produced them is untouched and will refill within a week.** Two independent
spawners create worktrees; neither reliably reclaims them; and every worktree
costs 20x more disk than the task it serves needs. Your unit cuts the cost and
puts the teardown behind doors rather than prose.

## Pre-Verified Facts (coordinator verified each one personally, 2026-08-16)

**Git's actual model — tested on git 2.50.1 (Apple Git-155), not assumed:**

- There is no sub-worktree and no worktree "split". `man git-worktree`
  DESCRIPTION: *"A repository has one main worktree and zero or more linked
  worktrees."* Two levels, flat, always.
- `git worktree add <path>/nested` succeeds when `<path>` is itself a worktree,
  but git registers all of them as flat peers. `git worktree remove` on the
  outer one **deletes the inner one's files** and leaves a `prunable` ghost.
  Verified by direct experiment. Current paths do exactly this
  (`worktrees/wt-orch-a2-exhaust/wt-agnt-coder-w2y-p21`). The hierarchy is a
  fiction in the directory names and it is actively dangerous.
- **Sparse checkout is the real "split", and it is per-worktree.** Verified by
  experiment: `git worktree add --no-checkout <p>` then
  `git -C <p> sparse-checkout set apps/api` then `git -C <p> checkout` yields a
  worktree whose disk contents are **only** `apps/api/`, while the main worktree
  retains everything. Config at `.git/worktrees/<name>/info/sparse-checkout`.
- `man git-worktree`: *"When you are done with a linked worktree, remove it with
  git worktree remove."* The teardown obligation is already in git's contract.

**Creation sites — every line number re-verified at dispatch:**

- `~/herdr-spine/bin/spine-spawn` (Python):
  - `:107` `WORKTREE_ROOT = os.path.expanduser("~/.spine/worktrees")`
  - `:324` `def ensure_git_worktree(base_cwd, wt_slug)` — creates
    `~/.spine/worktrees/<repo_slug>/<wt_slug>` on branch `spine/<wt_slug>`
  - `:332` `log(f"worktree: reusing {wt_path}")` — on collision it silently
    adopts an orphan rather than failing, which **hides** the leak
  - `:351` `def apply_coder_isolation(args, wt_slug)`, calling
    `ensure_git_worktree` at `:358` — forces a worktree for every coder-profile
    spawn
  - `:872` and `:1037` are the two other call sites; `:1037`
    (`f"{args.slug}-test"`) creates a **second** worktree for the test-maker in
    the bifurcated Verify beat, so one unit costs two
- `~/cursor-shim/cursor-spine` (bash): `:433` forces `--worktree` for every
  coder spawn (`log "isolation: forcing --worktree for coder ..."`), with an
  existing non-git-repo fallback at `:435`/`:441`. `:76`
  `worktree_name_for()` derives the legal name. `cursor-agent` then creates
  `~/.cursor/worktrees/<repo>/wt-<label>-<pane>`. `~/cursor-shim/cursor-finish`
  adds a third for integration.

**Teardown — the actual gap:**

- `grep -rn 'worktree remove\|worktree prune' ~/herdr-spine` returns **zero
  matches**. herdr-spine has no worktree teardown of any kind. `spine-spawn
  --help` lists exactly: `orch, worker, fanout, prompt, verify-mark,
  verify-status, verify-migrate, make`. There is no reap verb.
- `~/cursor-shim/cursor-spine:141` `reap_pane()` closes a pane; `:149`
  `reap_job_dir()` removes a temp job dir. **Neither touches a worktree.**
- The only worktree teardown anywhere is `cleanup()` at
  `~/cursor-shim/cursor-finish:325-340` (plus a single-path remove at `:184`).
- **`cleanup` is invoked exactly once, at `cursor-finish:374`**, as a bare
  sequential call after `wait_workers → integrate → triage → land_main`.
  `grep -n 'trap' ~/cursor-shim/cursor-finish` returns **nothing**. Any `die` in
  those four stages — qa-verify red, arbiter budget exhausted, merge conflict —
  and every halt or crash leaks the worktrees permanently.

**HAZARD the coordinator found while verifying this brief — read before task 3.1.**
`cleanup()` as written is `git worktree remove --force` followed by
`git branch -D`, for all three worktrees. That is safe today **only because it
runs on the happy path, after `land_main` has already merged the work.**
Installing `trap cleanup EXIT` without changing that body would fire the same
force-remove on the failure path, where the work is *not* merged — converting
every failed run from a disk leak into **guaranteed data loss**. The disk leak
is the lesser bug. Therefore task 3.3 (the preservation guard) is a hard
prerequisite of task 3.1 (the trap): land the guard first, prove it, then arm
the trap. Do not reorder this.

**Measured cost:**

- One agent-core worktree on disk is **21 MB**, of which `primitives/` is 16 MB
  and `briefs/` is 4.2 MB. An agent tasked to edit `primitives/hooks/` needs
  neither. Sparse-checked-out to its declared partition the same worktree is
  roughly 1 MB — a 10-20x reduction.
- Briefs already declare a file partition
  (`## Constraints — Touch ONLY: <explicit file list>`). That partition is
  exactly the sparse-checkout set.
- The spawners apply no concurrency test: isolation is forced on every
  coder-profile spawn whether or not anything runs beside it.

**Current state:**

- All four repos are at **0 worktrees**; `~/.cursor/worktrees` and
  `~/.spine/worktrees` are both empty. `git fsck` on agent-core is clean.
- `~/cursor-shim` main worktree is checked out on branch
  **`feat/a5-batch-record`**, not `main`, and is clean. Do not switch it. Do not
  assume `main` is HEAD there.
- `~/agent-core` is on `main`, `~/herdr-spine` is on `main`.
- agent-core's `credential-guard` pre-commit hook is live and correct. It
  **will** block commits containing raw Tower board dumps. That is the door
  working. **Never bypass it.**
- A working reference implementation of the preservation guard (task 3.3) has
  been copied to a durable path for you:
  `~/agent-core/briefs/worktree-lifecycle/evidence/wt-reclaim-reference.sh`.
  Read it as a sketch. It is not a dependency and you must not import it.

**Enforcement law you are working inside** — `~/agent-core/primitives/rules/ENFORCEMENT.md`:
every law names its enforcer, **DOOR** (the sanctioned tool's only open path
complies by construction), **HOOK** (mechanical refusal), or an explicit
**DOCTRINE** label (unenforced; a compilation bug in the queue, not a tier).
Parity law (`~/agent-core/primitives/HARNESS-PARITY.md`): enforcement lands in
all harnesses in the same unit or the ledger row says so; canonical gate logic
lives in exactly one file per law, adapters are thin.

## Parallel Work Notice

Two sibling orchestrators are running right now.

- **Unit 1 orchestrator** owns exactly four files and no others:
  `primitives/rules/worktree-lifecycle.md`, `primitives/rules/ENFORCEMENT.md`,
  `primitives/rules/control-flow.md`, `primitives/AGENTS.md`. **You must not
  edit any of those four.** Post your enforcer status (which doors landed, which
  harnesses are wired, what remains DOCTRINE) as a board finding; that
  orchestrator reads the board and records the ledger row.
- **Unit 4 orchestrator** is triaging preserved branches against a frozen
  snapshot taken at dispatch. It will not touch any branch you create after
  dispatch, and you must not delete branches outside your own test fixtures.

**Your partition:**

```
~/herdr-spine/**                                  (yours entirely)
~/cursor-shim/**                                  (yours entirely)
~/agent-core/primitives/hooks/**                  (yours, if a door needs a hook)
harness hook config (settings/hooks files)        (yours, for parity wiring)
```

Explicitly NOT yours: the four Unit-1 files above,
`~/agent-core/primitives/HARNESS-PARITY.md`, and
`~/agent-core/briefs/worktree-lifecycle/BRANCH-TRIAGE.md`.

Partition your own workers so no two share a file. The natural cut is by
spawner: one worker on `spine-spawn` (Python), one on
`cursor-spine`/`cursor-finish` (bash). **Units 2 and 3 both touch both
spawners** — give each spawner to one worker who does that spawner's Unit 2 work
and Unit 3 work in sequence, rather than two workers per file.

A live agent wrote `~/agent-core/briefs/house/sagt-harness-parity-live-2026-08-16.md`
during the sweep. Do not investigate, revert, or fix it. Outside your partition.

## Tower (mid-run communication)

**Tower is MAILBOX ONLY this session.** `~/.tower/PHASE2-WRITE-GATE-PROOF.md`
does not exist, so the write gate is unproven. Do not describe Tower as
operational and do not build any part of this work on the assumption that it is.

- Findings and claims: board topic `agent-core/worktree-lifecycle`.
  `bun ~/.tower/cli.mjs post <claim|finding|note> agent-core/worktree-lifecycle "<body>" --from "<your role>"`.
  Read before claiming files. Do not hand-append JSON to `board.jsonl`.
- Self-report: `~/herdr-spine/bin/spine-report task "<what I'm doing>"` at unit
  start, `spine-report verdict "<result>"` when done.
- Resource ownership among cooperating workers:
  `~/herdr-spine/bin/spine-claim claim "<resource>" --ttl 30`, heartbeat every
  10-20s, `release` when done. Advisory coordination, not a lock.

**MANDATORY — the stigmergic field.** Ranks 1-4 coordinate through the
environment, never by talking to each other directly
(`~/.tower/COMMS-ARCH.md` plane 5).

- **Emit** work others could take: `work-available` with topic, payload ref, and
  **mandatory evidence** — an emit without evidence is not an emit.
- **Read the field before ever going idle.** Open work you can take, you claim
  (`work-claimed`, `ref`-ing the exact pheromone id) and do.
- **`work-done`** `ref`-ing what you claimed. **`need-help`** instead of going
  quiet, carrying `nq` (default 3 minus escalations), expressed as a route
  derivation hint resolving one link up the lineage, never a hard address.
- **nQ=0 before deliverable.** Never emit `work-done` holding open questions.
- **Heartbeat your claims.** TTL 30s, heartbeat at roughly ttl/3, or the claim
  evaporates and the work returns to the field. That evaporation is what
  protects the fleet from a dead agent, and it only works if agents heartbeat.
- Verbs: `bun ~/.tower/cli.mjs emit <scent> <topic> <payload_ref> [--ref id]
  [--to-role r] [--evidence path] [--ttl N]` and `... field`.
- **Two acceptable stopping conditions, and only these:** every done-condition
  met, or a posted `need-help`/BLOCKED naming what is needed and who owns it,
  *after* proceeding with everything that does not depend on it. "Reported and
  awaited instruction" is not a stopping state.

## Tasks

Ordering is binding: **2.1 → 2.2 → 3.3 → 3.1** on the cursor side, because 3.3
is a safety prerequisite of 3.1. The spine side (2.1, 2.2, 3.2) and the cursor
side (2.3, 3.1, 3.3) may run concurrently as separate workers. 3.4 is last.

### Unit 2 — sparse checkout at spawn

**2.1** Extend `ensure_git_worktree()` at `~/herdr-spine/bin/spine-spawn:324` to
accept an optional path set and, when given, create the worktree with
`--no-checkout`, apply `git sparse-checkout set <paths>`, then `checkout`.
- **Done when:** a spawn with a declared partition produces a worktree whose
  `find <wt> -type f -not -path '*/.git/*'` output contains only the declared
  paths, proven by a **real spawn against a real repo**, not a mock.

**2.2** Degrade safely: no declared partition means a full checkout plus a
logged warning naming the cost. **Never silently narrow an agent's view of the
repo** — an agent that cannot see a file it needs fails in a confusing way.
- **Done when:** a spawn with no partition still yields a working full checkout,
  and the warning appears in the log.

**2.3** Apply the equivalent in the cursor path, or — if `cursor-agent
--worktree` does not expose the necessary control — record that limitation
explicitly as a board finding with evidence, and state what the shim can do
instead.
- **Done when:** either the cursor path is sparse, or a board finding names
  precisely why it cannot be, with a cited command and its output.

### Unit 3 — the doors

**3.3 (do this first on the cursor side)** Preserve the safety property the
manual sweep proved necessary: **a blocked commit must never become data loss.**
If uncommitted work cannot be preserved (for example `credential-guard`
correctly refuses it), teardown must **keep the directory and report**, not
remove it. This changes `cleanup()`'s force-remove semantics — see the HAZARD
note above.
- **Done when:** a test with a pre-commit hook that refuses shows the worktree
  kept and a clear report emitted.

**3.1** `~/cursor-shim/cursor-finish` — install `trap cleanup EXIT` so a halted,
failed, or crashed run reaps as reliably as a successful one. Verify `cleanup()`
is idempotent first; it is called on the happy path at `:374` today and would
then also run via the trap. Do not arm this before 3.3 is proven.
- **Done when:** a deliberately failed run (force `qa-verify` red) leaves zero
  worktrees behind, demonstrated with `git worktree list` before and after, and
  a failed run with unpreservable work leaves the directory standing with a
  report.

**3.2** `~/herdr-spine` — add a real teardown verb. It must remove the worktree
**and** delete its branch, and it must **fail loudly** rather than report
success while the directory still stands.
- **Done when:** the verb exists, `spine-spawn --help` lists it, and a test
  proves both the success path and the loud failure when removal is blocked.

**3.4** Harness parity: the doors must exist in all harnesses per
`primitives/HARNESS-PARITY.md`. A single-harness fix is not done.
- **Done when:** `agent-core status` (or the parity table's own check) shows the
  gate wired everywhere, and **an unwired gate reports as unwired rather than as
  green.** Reporting honestly beats reporting green.

## Constraints

- **Never implement production code yourself.** Dispatch. Research assists are
  fine.
- **Testing: NO MOCKS.** Prove worktree behavior against real repos and real git.
- Verification: run each repo's own gates exactly as its CI does. `~/cursor-shim`
  has `docs/qa-verify.sh` (71/71 at last record); agent-core has
  `component-verify`.
- **Do not bypass** `credential-guard`, the grounding hook, the write gate, or
  the spawn door. A refusal is information, not an obstacle.
- **Do not re-run the worktree sweep.** It is complete and verified. Reclaiming
  is not your task; preventing the next 85 is.
- Do not run dependency install from a worktree: `bun install`/`prepare` from a
  worktree can corrupt the shared repo's `core.hooksPath`. Say this in every
  worker brief you write.
- **One write per file per thought.** Compose consecutive edits into a single
  call; read before any second write to the same file.
- Match surrounding code style. `spine-spawn` is Python. `cursor-spine`,
  `cursor-finish`, and the hooks are bash — and this machine runs **bash 3.2.57**
  (verified at dispatch), so no `mapfile`, no associative arrays. Comments state
  constraints, not narration.
- **Workers never commit.** You verify and report. The coordinator lands and
  pushes.
- Clean up your own test fixtures: every worktree and branch your tests create
  is removed before you report done. A unit about worktree leaks that leaks
  worktrees has failed.

## Report back with

- Each done-when quoted, with the evidence that satisfied it: command run,
  output tail, file path.
- Every file created or modified, including dotfiles and config.
- The enforcer status per door and per harness, in the DOOR/HOOK/DOCTRINE
  vocabulary, posted to the board so the Unit 1 orchestrator can record it.
- Any done-when you could not satisfy, what blocked it, and what you did with
  everything that did not depend on it.
- Deviations from this brief with the reason. If a Pre-Verified Fact turns out
  to be wrong, say so plainly and cite what you found instead — that is the most
  valuable thing you can report.
