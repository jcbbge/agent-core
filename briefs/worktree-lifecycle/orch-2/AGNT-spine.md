# AGNT — worktree lifecycle: sparse checkout at spawn, and the teardown door

This brief is binding and self-contained. Do NOT use emojis anywhere.

## Which role you are — read this first

This brief is delivered to two agents in separate worktrees with no cross-sight.
Your pane label tells you which one you are. Run `echo "$HERDR_PANE_ID"` and
check your label, or read the trailing component of your own working directory.

- **Working directory ends in `-test`** -> you are the **TEST-MAKER**. You write
  the acceptance suite for the done-whens below and **no production code at
  all**. Do not edit `bin/spine-spawn`, `cursor-spine`, or `cursor-finish`.
  Your deliverable is an executable test script that a third party can run, that
  builds its own throwaway fixtures under
  `/private/tmp/claude-501/wt-fixtures/`, exercises real git, asserts each
  done-when, prints a `N/N` pass line, and exits non-zero on any failure. Put it
  under your repo's existing test location if it has one, otherwise
  `test/worktree-lifecycle.sh`. Criteria come BEFORE code: write the suite to the
  done-whens as specified, not to whatever the implementer happens to build.
- **Anything else** -> you are the **IMPLEMENTER**. You do the production work
  described under YOUR ASSIGNMENT. You may write your own scratch checks, but the
  authoritative suite is the test-maker's and you will be judged against it.

Neither of you can see the other's worktree. That is deliberate. Do not go
looking for it, and do not wait on it.

## Why this unit exists

On 2026-08-16 a sweep found 85 orphaned git worktrees consuming 1.06 GB across
four repos, oldest four days old. They were reclaimed by hand. The mechanism
that produced them is untouched and will refill within a week. Two independent
spawners create worktrees; neither reliably reclaims them; and every worktree
costs roughly 20x more disk than the task it serves needs.

Two things must change:

- **Unit 2 — sparse checkout at spawn.** A worktree should contain only the
  files the agent is allowed to touch.
- **Unit 3 — the teardown doors.** Reclamation must be a door (the sanctioned
  tool's only open path), not prose an agent is asked to remember.

## Pre-Verified Facts

Every fact below was verified personally by the orchestrator on 2026-08-16 by
running the command named. If any of them turns out to be wrong, say so plainly
and cite what you found instead — that is the most valuable thing you can
report.

### Machine and toolchain

- `git --version` -> `git version 2.50.1 (Apple Git-155)`
- `bash --version` -> `GNU bash, version 3.2.57(1)-release (arm64-apple-darwin25)`.
  **No `mapfile`. No associative arrays. No `${var^^}`.** Write bash 3.2.
- `~/agent-core` is on `main`. `~/herdr-spine` is on `main`.
  `~/cursor-shim` is on branch **`feat/a5-batch-record`**, clean. Do not switch
  it and do not assume `main` is its HEAD.
- All four repos are at **0 linked worktrees** right now; `~/.spine/worktrees`
  and `~/.cursor/worktrees` are both empty (`ls` returns nothing).

### Git's actual worktree model — tested, not assumed

- There is no sub-worktree and no worktree "split". `man git-worktree`
  DESCRIPTION: *"A repository has one main worktree and zero or more linked
  worktrees."* Two levels, flat, always.
- `git worktree add <path>/nested` succeeds when `<path>` is itself a worktree,
  but git registers all of them as flat peers. `git worktree remove` on the
  outer one **deletes the inner one's files** and leaves a `prunable` ghost.
  Nesting is a fiction in the directory names and it is actively dangerous.
- **Sparse checkout is the real "split", and it is per-worktree.** Verified by
  experiment:

  ```
  git worktree add --no-checkout <p>
  git -C <p> sparse-checkout set apps/api
  git -C <p> checkout
  ```

  yields a worktree whose disk contents are **only** `apps/api/`, while the main
  worktree keeps everything. The config lands at
  `.git/worktrees/<name>/info/sparse-checkout`.
- `man git-worktree`: *"When you are done with a linked worktree, remove it with
  git worktree remove."* The teardown obligation is already in git's contract.

### Measured cost

- One `agent-core` worktree on disk is **21 MB**, of which `primitives/` is
  16 MB and `briefs/` is 4.2 MB. An agent tasked to edit `primitives/hooks/`
  needs neither. Sparse-checked-out to its declared partition the same worktree
  is roughly 1 MB — a 10-20x reduction.
- Briefs already declare a file partition
  (`## Constraints — Touch ONLY: <explicit file list>`). That partition is
  exactly the sparse-checkout set.
- The spawners apply no concurrency test: isolation is forced on every
  coder-profile spawn whether or not anything runs beside it.

### Spawner A — `~/herdr-spine/bin/spine-spawn` (Python 3)

Line numbers re-verified at dispatch:

- `:101` `PROFILES_DIR = os.path.expanduser("~/agent-core/primitives/profiles")`
- `:107` `WORKTREE_ROOT = os.path.expanduser("~/.spine/worktrees")`
- `:237` `def profile_base(args)`; `:246` `def verify_gate_enabled()`;
  `:276` `def enforce_verify_gate(args)`
- `:316` `def git_run(repo_cwd, *git_args, timeout=60)` — the only git shell-out
  helper; returns `(returncode, stdout, stderr)`
- `:324` `def ensure_git_worktree(base_cwd, wt_slug)` — creates
  `~/.spine/worktrees/<repo_slug>/<wt_slug>` on branch `spine/<wt_slug>`
- `:332` `log(f"worktree: reusing {wt_path}")` — on collision it silently adopts
  an orphan rather than failing, which **hides** the leak
- `:351` `def apply_coder_isolation(args, wt_slug)`, calling
  `ensure_git_worktree` at `:358` — forces a worktree for every coder-profile
  spawn
- `:365` `def prepare_spawn(args, wt_slug)` — gate + isolation
- `:872` second `ensure_git_worktree` call site
- `:1005` `def cmd_make(args)`; `:1037`
  `test_args.cwd = ensure_git_worktree(base_cwd, f"{args.slug}-test")` creates a
  **second** worktree for the test-maker in the bifurcated Verify beat, so one
  unit costs two
- `:1066` `def add_common(p, spawn=True)`; `:1084`
  `p.add_argument("--cwd", help="cwd for new panes (worktree isolation)")`
- Subcommand registration lives in `main()` from roughly `:1090` to `:1160`
  (`orch`, `worker`, `fanout`, `prompt`, `verify-mark`, `verify-status`,
  `verify-migrate`, `make`), each `p.set_defaults(fn=cmd_...)`.

`python3 ~/herdr-spine/bin/spine-spawn --help` prints exactly:

```
{orch,worker,fanout,prompt,verify-mark,verify-status,verify-migrate,make}
```

**There is no reap verb.** `grep -rn 'worktree remove\|worktree prune'
~/herdr-spine` returns **zero matches**. herdr-spine has no worktree teardown of
any kind.

### Spawner B — `~/cursor-shim` (bash 3.2)

- `cursor-spine:76` `worktree_name_for()` derives the legal name
  (`wt-<label>-<pane>`).
- `cursor-spine:430-437` forces `--worktree` for every coder spawn:
  `log "isolation: forcing --worktree for coder (implementer never shares a
  checkout with tests)"`, guarded by `is_git_repo_dir "$DIR"` with a
  profile-discipline fallback at `:433`/`:439` for non-repo dirs.
- `cursor-spine:141` `reap_pane()` closes a pane; `:149` `reap_job_dir()` removes
  a temp job dir. **Neither touches a worktree.**
- `cursor-finish:4` `set -euo pipefail`; `:15` `die()`; `:92` `worktree_path()`;
  `:99` `load_state()` (sets `IMPL_WT`, `TEST_WT`, `STATE_TS`, `DIR`, `SLUG`);
  `:116` `FINISH_WT="wt-finish-$SLUG"`; `:119` `resolve_git_root()` sets
  `GIT_ROOT`; `:139` `wait_workers()`; `:155` `commit_worktree()`;
  `:175` `integrate()`; `:315` `land_main()`; `:325-339` `cleanup()`;
  `:341` `post_land_deliverable()`.
- `cleanup()` verbatim as it stands today:

  ```bash
  cleanup() {
    local path p
    for wt in "$IMPL_WT" "$TEST_WT" "$FINISH_WT"; do
      [[ -n "$wt" ]] || continue
      path="$(worktree_path "$wt")"
      if [[ -d "$path" ]]; then
        git -C "$GIT_ROOT" worktree remove --force "$path" 2>/dev/null || true
      fi
      git -C "$GIT_ROOT" branch -D "$wt" 2>/dev/null || true
    done
    for p in "$IMPL_PANE" "$TEST_PANE" "${TESTER_PANE:-}"; do
      [[ -n "$p" ]] && "$SPINE" reap "$p" 2>/dev/null || true
    done
    log "worktrees removed, panes reaped"
  }
  ```

- **`cleanup` is invoked exactly once, at `cursor-finish:374`**, as a bare
  sequential call after `wait_workers` -> `integrate` -> `triage` ->
  `land_main`. `grep -n 'trap' ~/cursor-shim/cursor-finish` returns **nothing**.
  Any `die` in those four stages — qa-verify red, arbiter budget exhausted,
  merge conflict (`:196` `die "merge conflict in $FINISH_WT"`), nQ ceiling
  (`:304`), arbiter escalation (`:309`), merge failure (`:317`), qa-verify red
  on main (`:320`) — and every halt or crash leaks the worktrees permanently.
- The only worktree teardown anywhere in either spawner is that `cleanup()`,
  plus a single-path remove inside `integrate()` at `cursor-finish:181`.

### HAZARD — read before touching `cleanup()`

`cleanup()` as written is `git worktree remove --force` followed by
`git branch -D`, for all three worktrees. That is safe today **only because it
runs on the happy path, after `land_main` has already merged the work.**
Installing `trap cleanup EXIT` without changing that body would fire the same
force-remove on the failure path, where the work is *not* merged — converting
every failed run from a disk leak into **guaranteed data loss**. The disk leak is
the lesser bug. **The preservation guard is a hard prerequisite of the trap:
land the guard first, prove it, then arm the trap. Do not reorder this.**

### `cursor-agent` worktree surface (verified by `cursor-agent --help`)

```
  -w, --worktree [name]        Start in an isolated git worktree at
                               ~/.cursor/worktrees/<reponame>/<name>. If
                               omitted, a name is generated.
  --worktree-base <branch>     Branch or ref to base the new worktree on
                               (default: current HEAD)
  --skip-worktree-setup        Skip running worktree setup scripts from
                               .cursor/worktrees.json (default: false)
```

There is no sparse-checkout flag. `~/cursor-shim/.cursor/` does not exist
(`ls` -> `No such file or directory`), so no worktree setup script is configured
today.

### Reference sketch (not a dependency)

`~/agent-core/briefs/worktree-lifecycle/evidence/wt-reclaim-reference.sh` is a
working reference implementation of the preservation guard, written during the
manual sweep. **Read it as a sketch. Do not import it, do not source it, do not
copy it wholesale.** Its load-bearing idea is the SKIP branch: after attempting
the preserving commit it re-checks `git status --porcelain`, and if the tree is
still dirty (the pre-commit hook refused) it **keeps the directory** and reports,
rather than removing it.

### Enforcement vocabulary you must use when reporting

`~/agent-core/primitives/rules/ENFORCEMENT.md`: every law names its enforcer —
**DOOR** (the sanctioned tool's only open path complies by construction),
**HOOK** (mechanical refusal), or an explicit **DOCTRINE** label (unenforced; a
compilation bug in the queue, not a tier). Parity law
(`~/agent-core/primitives/HARNESS-PARITY.md`): enforcement lands in all harnesses
in the same unit or the ledger row says so; canonical gate logic lives in exactly
one file per law, adapters are thin. An unwired gate must report as **unwired**,
never as green. Reporting honestly beats reporting green.

## Parallel Work Notice

Three sibling orchestrators and one sibling agent are running right now.

- **Unit 1** owns exactly four files and no others:
  `primitives/rules/worktree-lifecycle.md`, `primitives/rules/ENFORCEMENT.md`,
  `primitives/rules/control-flow.md`, `primitives/AGENTS.md`. **Do not edit any
  of those four.**
- **Unit 4** is triaging preserved branches against a snapshot frozen at
  dispatch. **Do not delete any branch you did not create**, and delete every
  branch you *do* create for a test fixture.
- **Your sibling agent** owns the other spawner. Your partitions are disjoint by
  repository — see YOUR ASSIGNMENT below. Never edit a file outside your
  partition, not even a one-line fix. Post a board finding instead.
- `~/agent-core/briefs/house/sagt-harness-parity-live-2026-08-16.md` was written
  by a live agent during the sweep. Do not investigate, revert, or fix it.
  Outside the partition.

Explicitly outside every partition in this unit:
`~/agent-core/primitives/HARNESS-PARITY.md` and
`~/agent-core/briefs/worktree-lifecycle/BRANCH-TRIAGE.md`.

## Tower (mid-run communication)

**Tower is MAILBOX ONLY this session.** `~/.tower/PHASE2-WRITE-GATE-PROOF.md`
does not exist, so the write gate is unproven. Do not describe Tower as
operational and do not build any part of this work on the assumption that it is.

- Findings and claims: board topic `agent-core/worktree-lifecycle`.
  `bun ~/.tower/cli.mjs post <claim|finding|note> agent-core/worktree-lifecycle "<body>" --from "<your role>"`.
  Read before claiming files. Do not hand-append JSON to `board.jsonl`.
- Post a CLAIM first (naming the exact files you will touch), findings during,
  and write your `.done` last.
- Self-report: `~/herdr-spine/bin/spine-report task "<what I'm doing>"` at start,
  `spine-report verdict "<result>"` when done.

**MANDATORY — the stigmergic field.** Ranks 1-4 coordinate through the
environment, never by talking to each other directly (`~/.tower/COMMS-ARCH.md`
plane 5).

- **Emit** work others could take: `work-available` with topic, payload ref, and
  **mandatory evidence** — an emit without evidence is not an emit.
- **Read the field before ever going idle.** Open work you can take, you claim
  (`work-claimed`, `ref`-ing the exact pheromone id) and do.
- **`work-done`** `ref`-ing what you claimed. **`need-help`** instead of going
  quiet, carrying `nq` (default 3 minus escalations), expressed as a route
  derivation hint resolving one link up the lineage, never a hard address.
- **nQ=0 before deliverable.** Never emit `work-done` holding open questions.
- **Heartbeat your claims.** TTL 30s, heartbeat at roughly ttl/3, or the claim
  evaporates and the work returns to the field. That evaporation is what protects
  the fleet from a dead agent, and it only works if agents heartbeat.
- Verbs: `bun ~/.tower/cli.mjs emit <scent> <topic> <payload_ref> [--ref id]
  [--to-role r] [--evidence path] [--ttl N]` and `... field`.
- **Two acceptable stopping conditions, and only these:** every done-condition
  met, or a posted `need-help`/BLOCKED naming what is needed and who owns it,
  *after* proceeding with everything that does not depend on it. "Reported and
  awaited instruction" is not a stopping state.

## Constraints

- **Testing: NO MOCKS.** Prove worktree behaviour against real repos and real
  git. Build your fixtures as throwaway repos under
  `/private/tmp/claude-501/wt-fixtures/` (`git init`, a few real files, real
  commits) — never against `~/agent-core`, `~/herdr-spine`, `~/cursor-shim`, or
  `~/Infinity/arc`.
- **Clean up your own test fixtures.** Every worktree, branch, and temp repo your
  tests create is removed before you report done, and you prove it with
  `git worktree list` plus `ls ~/.spine/worktrees ~/.cursor/worktrees`. A unit
  about worktree leaks that leaks worktrees has failed.
- **Do not re-run the worktree sweep.** It is complete and verified. Reclaiming
  is not the task; preventing the next 85 is.
- **Do not bypass** `credential-guard`, the grounding hook, the write gate, or
  the spawn door. A refusal is information, not an obstacle. In particular
  `VERIFY_GATE=off` and `CURSOR_VERIFY_GATE=off` are audited break-glass, not
  tools — do not use them to make a test easier.
- **Do not run dependency install from a worktree.** `bun install` or a
  `prepare` script run from a worktree can corrupt the shared repo's
  `core.hooksPath`. Never do it.
- **Never silently narrow an agent's view of the repo.** An agent that cannot see
  a file it needs fails in a confusing way, and a confusing failure is worse than
  a large checkout. Absent an explicit declared partition, the behaviour is a
  full checkout plus a warning that names the cost.
- **Never report success while the directory still stands.** Teardown that fails
  must fail loudly, with a non-zero exit and the path named.
- **One write per file per thought.** Compose consecutive edits into a single
  call; read the file before any second write to the same file.
- Match surrounding code style. `spine-spawn` is Python; `cursor-spine`,
  `cursor-finish`, and the hooks are bash 3.2. Comments state constraints, not
  narration. No emojis.
- **Do not commit and do not push.** Leave your work in the working tree. The
  orchestrator verifies, integrates, and hands to the coordinator, who lands it.
- If a done-when cannot be satisfied, do everything that does not depend on it,
  then post a `need-help`/BLOCKED naming what is needed and who owns it.

## Report back with

- Each done-when quoted, with the evidence that satisfied it: the exact command
  run, the output tail, and the file path.
- Every file created or modified, including dotfiles and config.
- The enforcer status of each door you built, in the DOOR / HOOK / DOCTRINE
  vocabulary, and for which harnesses it is wired. Post this to the board so the
  Unit 1 orchestrator can record the ledger row. An unwired gate reports as
  unwired.
- Proof that you left zero worktrees and zero branches behind:
  `git worktree list` in each repo you touched, plus
  `ls ~/.spine/worktrees ~/.cursor/worktrees`.
- Any done-when you could not satisfy, what blocked it, and what you did with
  everything that did not depend on it.
- Deviations from this brief with the reason. If a Pre-Verified Fact turns out to
  be wrong, say so plainly and cite what you found instead.

## YOUR ASSIGNMENT

You own **`~/herdr-spine` entirely, and nothing else**. Your sibling owns
`~/cursor-shim`. You may read anything; you may write only under
`~/herdr-spine/`.

Your working directory is a git worktree of `~/herdr-spine` created for you. Edit
`bin/spine-spawn` relative to your own cwd, and exercise it as
`python3 "$PWD/bin/spine-spawn" ...` so you are testing your copy, never the
installed one at `~/herdr-spine/bin/spine-spawn`.

### Task 2.1 — sparse checkout at spawn

Extend `ensure_git_worktree()` at `bin/spine-spawn:324` to accept an optional set
of paths and, when given, create the worktree with `--no-checkout`, apply
`git sparse-checkout set <paths>`, then `git checkout`. Thread the path set
through `apply_coder_isolation()` (`:351`) and `prepare_spawn()` (`:365`) and
expose it on the CLI in `add_common()` (`:1066`) as a repeatable
`--sparse <path>` option, so every spawn subcommand accepts it.

Additionally, when no `--sparse` is passed and the spawn carries a `--brief`,
derive the path set from the brief's declared partition — the
`## Constraints` / `Touch ONLY:` file list — if and only if you can parse it
unambiguously. An unparseable or absent partition is not an error; it degrades to
task 2.2.

Also fix the leak-hiding reuse at `:332`: adopting an existing worktree silently
is what conceals an orphan. Log it at warning level and name the path, or fail —
your judgment, but state which you chose and why.

- **Done when:** a spawn with a declared partition produces a worktree whose
  `find <wt> -type f -not -path '*/.git/*'` output contains only the declared
  paths, proven by a **real spawn against a real repo**, not a mock. Quote the
  command and the full `find` output.

### Task 2.2 — degrade safely

No declared partition means a full checkout plus a logged warning naming the
cost (the measured 21 MB / 16 MB / 4.2 MB figures above are the kind of
concreteness the warning needs — measure the actual repo if you can do it
cheaply, otherwise state the general cost).

- **Done when:** a spawn with no partition still yields a working full checkout,
  and the warning appears in the log. Quote both.

### Task 3.2 — a real teardown verb

Add a teardown verb to `spine-spawn`. It must remove the worktree **and** delete
its branch, and it must **fail loudly** — non-zero exit, path named on stderr —
rather than report success while the directory still stands.

Before it removes anything it must apply the preservation property: **a blocked
commit must never become data loss.** If the worktree has uncommitted work, try
to preserve it on its branch; if preservation fails (for example
`credential-guard` correctly refuses the commit), **keep the directory and
report**, exit non-zero, and do not remove. Detached HEAD must be parked on a
branch before removal or the commits are lost. The reference sketch shows the
shape.

The verb must appear in `spine-spawn --help` alongside the existing eight.

- **Done when:** the verb exists, `python3 "$PWD/bin/spine-spawn" --help` lists
  it (quote the output), and a test against a real throwaway repo proves all
  three paths: (a) clean worktree removed, branch deleted, exit 0; (b) dirty
  worktree preserved to its branch then removed, exit 0, work recoverable via
  `git worktree add <path> <branch>`; (c) removal blocked by a refusing
  pre-commit hook -> directory still standing, clear report, **non-zero exit**.

### Ordering

2.1 -> 2.2 -> 3.2. Nothing here depends on your sibling's work; do not wait on
it.
