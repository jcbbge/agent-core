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

## 7. Enforcer: DOOR, all three legs

**Status: DOOR.** Teardown on the cursor path, sparse-at-spawn via `spine-spawn`, and spine-side reap are each mechanically enforced. The DOCTRINE gap recorded here on 2026-08-16 is closed; see §7.1.

**Cursor path — DOOR.** `spine-spawn reap <path>` (`~/herdr-spine/bin/spine-spawn`, subcommand at :1450) is the sanctioned teardown door for cursor worktrees under `~/.cursor/worktrees`, invoked by `~/herdr-spine/bin/handlers/18-worktree-reconcile` when no live pane occupies the path. Preserve-or-keep — parks detached HEADs on a branch, commits dirty work, re-checks reachability from a ref, removes only if safe; when a pre-commit hook refuses it, reap keeps the directory, skips `branch -D`, names the path, and returns non-zero. (Historical: retired `cursor-finish` / `cursor-spine` carried equivalent EXIT traps.)

**Sparse-at-spawn — DOOR, via `spine-spawn`.** `spine-spawn` narrows every worktree — pi, claude, and cursor (`--kind cursor`) — via explicit `--sparse` or by parsing the brief's `Touch ONLY` partition. Absent a partition, it degrades to a full checkout plus a WARN naming the cost — never a silent narrowing.

**Sparse mode is non-cone.** Cone mode always materializes every top-level file, so a "narrowed" worktree still carries the repo root — not what "only the declared paths" means. Reproduced 2026-08-16: cone narrowed to `primitives/hooks` still checked out `README.md`; non-cone checked out exactly the partition. `spine-spawn` uses `sparse-checkout set --no-cone` (historical: retired `cursor-spine` used cone until 2026-08-16).

### 7.1 Spine-side reap — DOOR, via reconciliation (closed 2026-08-16)

`spine-spawn reap <path>` is the sanctioned teardown door: preserve-or-keep, non-zero while a directory still stands. Until 2026-08-16 **nothing invoked it**, which is how 85 orphans / 1.06 GB accumulated.

It is now invoked by `~/herdr-spine/bin/handlers/18-worktree-reconcile`, auto-discovered by the dispatcher (basename sort; no manifest edit needed).

**Why a reconciler and not an event handler — the load-bearing part.** herdr emits exactly one event, `pane.agent_status_changed`. There is no pane-closed event, so there is no moment to hang teardown on. And `done` is **not terminal** — panes go `done -> working` routinely — so reaping on `done` would delete a worktree out from under a live agent mid-unit. (Historical: retired `cursor-finish` owned a unit's whole lifetime via an EXIT trap; `spine-spawn` exits while the pane it spawned lives on, so live teardown uses reconciliation, not spawn-time traps.)

The resolution is tup's own rule (`~/tup/contracts/thesis.md`): *"Events are hints and drop silently; a snapshot is truth. The wiring reconciles rather than trusts."* The event is only a tick. Truth is the snapshot: worktrees on disk compared against panes that exist. A worktree no live pane sits in is garbage, whatever sequence of events did or did not fire.

Safety properties, each verified live 2026-08-16:
- Only paths under `~/.spine/worktrees` and `~/.cursor/worktrees` are considered; a main checkout is structurally out of scope, not merely filtered.
- Reaped only when no live pane reports it as `cwd` or `foreground_cwd`. Verified against the real snapshot: four worktrees belonging to live agents were all classified PROTECTED.
- `GRACE_SECONDS` (900) protects a just-created worktree whose pane has not yet registered a cwd — the spawn race.
- An empty pane list aborts the sweep. No snapshot means no truth, and reaping against an empty list would orphan every live worktree at once.
- Teardown goes through the door, which preserves first. Proven end to end: an aged orphan holding uncommitted work was reaped and the work survived as a commit on its own branch.
- A refused reap keeps the directory and posts to `herdr-spine/worktree-reconcile` rather than retrying silently.

**Where it resolves, and why not yet (re-stated 2026-08-16).** This residual is unchanged by the harness-homogeneity work of 2026-08-16, and it is deliberately NOT upgraded here. That unit taught `spine-spawn` to route cursor (`--kind cursor` is now a first-class, live-proven path) and it touched nothing in `~/cursor-shim/`, so the tier that owns the reap is exactly who it was this morning. Stated per path, as of today:

- **cursor path — DOOR since 2026-08-18**, via `18-worktree-reconcile` (§7.1). (Historical: retired `cursor-finish` EXIT trap.)
- **pi and claude paths — DOOR since 2026-08-16**, via `18-worktree-reconcile` (§7.1). Previously DOCTRINE.

**Correction, same day — the premise was wrong, not the caution.** An earlier revision said this resolved only at `PLAN.md` §3 Phase 5, once `cursor-finish` was repointed at the shared reap, and warned against upgrading the label on the strength of unrun work. The caution was right and is retained as law. Its premise was not: it assumed the reap needed an *owner* — a tier remembering to call it at the right moment — and therefore had to wait for one. Reconciliation needs neither owner nor moment; it compares two snapshots and acts on the difference. Phase 5 is still worth doing to collapse two teardown bodies into one, but it is no longer what closes this leak. The correction stands beside what it corrected.

**The reconciler is harness-agnostic by construction.** It watches worktree roots and pane occupancy, neither of which knows which engine is seated. pi, claude, and cursor are covered by the same sweep — DOOR on all three not because a tier is disciplined, but because nothing has to remember.

---

SOURCES: git 2.50.1 (Apple Git-155) `man git-worktree` DESCRIPTION; nesting test `git worktree add --detach outer/wt-inner` reproduced 2026-08-16; sparse checkout test and 24 MB / 288 KB measurements reproduced 2026-08-16 from agent-core commit 60181fe; `wt-reclaim-reference.sh` (teardown reference); `spine-spawn:351-360` function `apply_coder_isolation`; `brief/SKILL.md:192-196` hook-path hazard; `control-flow.md` §Reap-as-law for reaping obligation; `ENFORCEMENT.md` doctrine law structure; `~/cursor-shim/cursor-finish` retired 2026-08-18 (historical EXIT-trap door, stubbed); `~/herdr-spine/bin/spine-spawn` `def cmd_reap(` at line 1274, registered subcommand at line 1450, help line 62, verified by grep 2026-08-16; enforcer status posted to board topic `agent-core/worktree-lifecycle` at 2026-08-16T17:28Z by `ORCH worktree-doors`, re-verified independently by the coordinator and by AGNT ledger-refresh on 2026-08-16.
