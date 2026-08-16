# WORKTREE LIFECYCLE — birth, scope, death, and safety

A git worktree exists to give a concurrent agent physical isolation from peers working the same checkout. Sequential agents get a branch. Read-only agents get neither.

## 1. Birth condition: concurrency test

A worktree is born because two or more agents are running simultaneously against the same repo. The spawner applies no concurrency test today (`~/herdr-spine/bin/spine-spawn:351-360`, function `apply_coder_isolation`: *"Force coder spawns into an isolated git worktree (filesystem wall)."*) — it fires for every spawn whose profile base is `coder` whenever the verify gate is on. The gate should test for actual sibling activity before allocating the resource; today that gate always fires.

Worktrees live at `~/.spine/worktrees/<name>` by convention (`~/herdr-spine/bin/spine-spawn:107`).

## 2. Death condition: teardown in the reap beat

A worktree is born with the agent and dies with its unit of work. The teardown obligation is coupled to the pane reap: when the pane is reaped (pane closed, process ended), the worktree is **removed and its branch deleted in the same beat**. This is the second half of the "done = gone" reaping law stated in `control-flow.md` §Reaping — that law names panes; a worktree is the second resource the spawn door creates.

The reaping obligation is already stated in `control-flow.md` §Reap-as-law in the row *"git worktrees / spine branches | removed when merged or named in pickup brief"* — that table row defines what this law implements. Removed, not archived.

## 3. Never nested by path: flat registration law

All worktrees in a repo are flat peers, always. Do not place a worktree inside another worktree's directory.

**Why: git registers them flat, so path nesting destroys data.** Reproduced 2026-08-16:

```bash
git worktree add --detach outer HEAD
git worktree add --detach outer/wt-inner HEAD
git worktree list
# Shows outer and inner as flat peers, not parent/child
git worktree remove --force outer
# Deletes inner's files. inner remains registered as `prunable`.
ls outer/wt-inner
# "No such file or directory" — the work is gone.
git worktree list
# inner shown as prunable; it persists as `prunable` until cleared with `git worktree remove` or `git worktree prune`.
```

Remove worktrees deepest-path-first (§5 below). A nested worktree is destroyed when the directory containing it is removed, leaving a ghost registration.

## 4. Sparse checkout is the default, not an optimization

When a worktree is created, scope it to the agent's declared file partition via sparse checkout from the start. The goal is not optimization — it is to give the agent only the files it needs and nothing else.

**Setup (one-time, at worktree birth):**

```bash
git worktree add --no-checkout --detach <path> HEAD
git -C <path> sparse-checkout set <scope>
git -C <path> checkout
```

For example, to scope a worktree to `primitives/hooks/`:

```bash
git worktree add --no-checkout --detach ~/.spine/worktrees/wt-agent-coder-a1 HEAD
git -C ~/.spine/worktrees/wt-agent-coder-a1 sparse-checkout set primitives/hooks
git -C ~/.spine/worktrees/wt-agent-coder-a1 checkout
```

The sparse checkout config lives at `.git/worktrees/<name>/info/sparse-checkout` (cone mode).

**Measured cost (agent-core, commit 60181fe, 2026-08-16):**
- Full worktree: 24 MB (primitives/ 17 MB, briefs/ 6.0 MB)
- Sparse to `primitives/hooks`: 288 KB — roughly **85x smaller**

An agent tasked to edit `primitives/hooks/` needs nothing else on disk. Every worktree spawned for a coder brief bearing a file partition should be sparse-checked-out to that partition's scope. See the brief's file list as the authoritative partition.

## 5. Teardown order and the safety property

Remove a worktree safely, in order:

1. **Deepest path first.** Sort worktrees by path depth, highest first. Remove nested ones before outer ones. A nested worktree's files are destroyed when its parent directory is removed; removing the outer one first leaves the inner registration as a `prunable` ghost.
2. **If HEAD is detached, park it on a branch.** Before removing, check `git -C <path> branch --show-current`. If it returns empty (detached HEAD), create a rescue branch: `git -C <path> checkout -b rescue/<random-id>`. Removing a detached HEAD loses commits.
3. **If dirty, WIP-commit everything.** Check `git -C <path> status --porcelain`. If it is not empty, commit to a WIP branch: `git -C <path> commit -q -m "wip(…): worktree state preserved"`. The branch name should be descriptive (e.g., `wip/orch-a2-coder-w5-unsaved`).
4. **The safety property: a blocked commit must never become data loss.** A pre-commit hook (the credential guard) can legitimately refuse the WIP commit if the work contains credential-bearing data or violates policy. If the commit fails, **do not remove the directory**. Re-check `git status --porcelain` after the commit attempt. If work remains (commit was refused), **keep the directory and report it as skipped** — the entry goes to a KEPT-ON-DISK list with the branch name so recovery is possible later. A refusal is information, not an obstacle to route around.
5. **Branches are always kept.** Never delete branches during reclaim. Recover any branch's worktree with `git worktree add <path> <branch>`.

Reference implementation: `~/agent-core/briefs/worktree-lifecycle/evidence/wt-reclaim-reference.sh` — the exact script used in the 2026-08-16 manual sweep that reclaimed 85 leaked worktrees.

## 6. The hook-path hazard: do not install dependencies

Do not run `bun install`, `npm install`, `yarn install`, or similar dependency installers from inside a worktree. Running `bun install` or `prepare` scripts from a worktree can corrupt the shared repo's `core.hooksPath` setting.

Workaround: if a worktree agent must verify a gate command that depends on installed tools, run that gate command manually from the main checkout.

Reference: `~/agent-core/primitives/skills/brief/SKILL.md:192-196`.

## 7. Enforcer: DOOR (cursor path, sparse-at-spawn) + DOCTRINE (spine auto-invocation gap)

**Status: mixed, not uniform DOCTRINE.** Teardown on the cursor path and sparse-at-spawn on both spawners are DOOR; automatic invocation of the spine-side reap remains DOCTRINE.

**Cursor path — DOOR.** `~/cursor-shim/cursor-finish:460` traps `cleanup_and_preserve_rc EXIT` on every halt, die, or crash: it saves the incoming exit status before cleanup and re-exits with it, so cleanup can never mask a failing run. Cleanup is preserve-or-keep — parks detached HEADs on a branch, commits dirty work, re-checks reachability from a ref, removes only if safe; when a pre-commit hook refuses it, cleanup keeps the directory, skips `branch -D`, names the path, and returns non-zero. `cursor-spine` carries the same EXIT traps at :721 and :766.

**Sparse-at-spawn — DOOR, both spawners.** `spine-spawn` narrows a coder worktree via explicit `--sparse` or by parsing the brief's `Touch ONLY` partition; `cursor-spine sparse-apply` narrows a cursor-agent worktree post-creation. Absent a partition, both degrade to a full checkout plus a WARN naming the cost — never a silent narrowing.

**Spine-side auto-invocation — DOCTRINE, the honest gap.** `spine-spawn reap <path>` is correct and registered (visible in `spine-spawn --help`, preserve-or-keep, fails loudly and non-zero while a directory still stands), but nothing invokes it automatically. This is structural, not laziness: `cursor-finish` owns a unit's whole lifetime so an EXIT trap belongs there, whereas `spine-spawn` exits immediately while the pane it spawned lives on — an EXIT trap there would delete the worktree out from under a running agent. Some other tier must own the reap. Until a rule or supervisor forces it, spine-side teardown is DOCTRINE, and an orchestrator that forgets to reap still leaks.

**Where it resolves, and why not yet (re-stated 2026-08-16).** This residual is unchanged by the harness-homogeneity work of 2026-08-16, and it is deliberately NOT upgraded here. That unit taught `spine-spawn` to route cursor (`--kind cursor` is now a first-class, live-proven path) and it touched nothing in `~/cursor-shim/`, so the tier that owns the reap is exactly who it was this morning. Stated per path, as of today:

- **cursor path — DOOR.** `cursor-finish`'s EXIT trap, unchanged.
- **pi and claude paths — DOCTRINE.** An orchestrator reaps by discipline; nothing forces it. This is the leak.

It resolves at **`PLAN.md` §3 Phase 5** (`~/agent-core/briefs/harness-homogeneity/PLAN.md:213,216-224`), where `cursor-finish`'s teardown is repointed at `spine-spawn reap` instead of its own copy. At that moment `cursor-finish` becomes the tier that owns the reap — the "some other tier" this gap has always been waiting on — and the row can be re-read per path with the cursor side genuinely DOOR through the shared body. Phase 5 has not run; Phases 4-6 are a later unit. **Do not upgrade this row to DOOR on the strength of work that has not happened** — an enforcer label is a claim about what mechanically refuses, and today nothing refuses on the pi/claude path.

---

SOURCES: git 2.50.1 (Apple Git-155) `man git-worktree` DESCRIPTION; nesting test `git worktree add --detach outer/wt-inner` reproduced 2026-08-16; sparse checkout test and 24 MB / 288 KB measurements reproduced 2026-08-16 from agent-core commit 60181fe; `wt-reclaim-reference.sh` (teardown reference); `spine-spawn:351-360` function `apply_coder_isolation`; `brief/SKILL.md:192-196` hook-path hazard; `control-flow.md` §Reap-as-law for reaping obligation; `ENFORCEMENT.md` doctrine law structure; `~/cursor-shim/cursor-finish:460` `trap cleanup_and_preserve_rc EXIT` verified by `grep -n 'trap '` 2026-08-16; `~/herdr-spine/bin/spine-spawn` `def cmd_reap(` at line 1274, registered subcommand at line 1450, help line 62, verified by grep 2026-08-16; enforcer status posted to board topic `agent-core/worktree-lifecycle` at 2026-08-16T17:28Z by `ORCH worktree-doors`, re-verified independently by the coordinator and by AGNT ledger-refresh on 2026-08-16.
