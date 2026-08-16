# ORCH — close the two residuals: parity registration and the honest ledger row

You are the **orchestrator** for one small, exact unit of work. You decompose,
dispatch, verify, and reap. You never implement. This brief is binding and
self-contained.

Do NOT use emojis anywhere.

## Why this unit exists

Three sibling units have landed and been verified by the coordinator against the
repos, not against testimony:

- The worktree-lifecycle law exists at
  `~/agent-core/primitives/rules/worktree-lifecycle.md`, registered in
  `ENFORCEMENT.md:47`, `control-flow.md:141`, `AGENTS.md:98`.
- Sparse checkout at spawn and the teardown doors landed in `~/herdr-spine`
  (`spine-spawn reap`, sparse via `--sparse` and brief-derived `Touch ONLY`
  partitions) and `~/cursor-shim` (`trap cleanup_and_preserve_rc EXIT` at
  `cursor-finish:460`, preserve-or-keep teardown, `cursor-spine sparse-apply`).
  Coordinator re-ran both suites personally: `herdr-spine test/worktree-lifecycle.sh`
  14/14 exit 0; `cursor-shim docs/worktree-lifecycle-verify.sh` 51/51 exit 0;
  `cursor-shim docs/qa-verify.sh` 149 passed, 0 failed.
- 114 superseded branches deleted, 41 kept, all 158 covered in
  `briefs/worktree-lifecycle/BRANCH-TRIAGE.md`.

Two things are left, both small, both consequences of a coordinator brief defect
rather than of any worker's failure.

## Pre-Verified Facts (coordinator verified each one personally, 2026-08-16)

**Residual 1 — the parity registration, and the misdiagnosis that blocked it.**

The sibling orchestrator reported: *"Registering them means editing
`cli/src/registry.zig`, which is outside my partition."* **That is a misread and
you should not repeat it.** `cli/src/registry.zig` is the *parser*. Verified by
reading its header:

- The registry is a **data file**, default path `~/.agent-core/registry`
  (`cli/src/main.zig:50-56`). It is 33,739 bytes, hand-authored, and **not
  tracked in the agent-core repo** (`git ls-files | grep -i registry` returns
  only `briefs/refiners-fire/w4-registry.md`). Editing it changes machine state,
  not repo content, and will not appear in any commit.
- `registry.zig:38-50` documents four verbs. `deploy` is the managed strategy
  where agent-core owns the destination bytes. The other three — `link`,
  `check`, `binary` — **"register estate agent-core does NOT own ... so that
  `status` can tell the truth about it. They are read-only: `sync` reports their
  state and writes nothing."**
- Same header, lines 47-50: *"A harness name in a check-only line need not be a
  declared profile: `machine` is used for machine-wide, harness-independent
  estate (tool binaries, git hooks)."*
- Live precedent in the file: `~/.agent-core/registry:669`
  `check machine ~/agent-core/.git/hooks/pre-commit#agent-core/primitives/hooks/credential-guard.sh`,
  and `:810`/`:815`/`:820`/`:825` `binary machine ~/.local/bin/{slim,latch,vein,assay}`.

So the two doors are exactly the case the `machine` scope exists for. No Zig
source change is needed or wanted.

**Residual 2 — the ledger row is now stale.** `ENFORCEMENT.md:47` currently
reads status **DOCTRINE**, with a compilation note in
`worktree-lifecycle.md` (section 7, around line 90) saying the doors are "in
flight ... unwired at time of writing". Both were true when written and are
false now. The sibling orchestrator posted the corrected status to the board
topic; read it there in full. In summary, and each part independently
re-verified by the coordinator:

- **DOOR** — cursor-path teardown. `grep -n 'trap ' ~/cursor-shim/cursor-finish`
  now returns `460: trap cleanup_and_preserve_rc EXIT`. The handler saves the
  incoming status before cleanup and re-exits with it, so cleanup cannot mask a
  failing run. Cleanup is preserve-or-keep and returns non-zero when a directory
  still stands.
- **DOOR** — sparse at spawn, both spawners. `spine-spawn --help` now lists
  `reap`; sparse narrows via `--sparse` or a brief's `Touch ONLY` partition;
  absent a partition both spawners degrade to a full checkout plus a WARN naming
  the cost, never a silent narrowing.
- **DOCTRINE** — and this is the honest gap you must preserve, not paper over:
  `spine-spawn reap <path>` is correct and registered, but **nothing invokes it
  automatically.** That is structural, not laziness: `cursor-finish` owns a
  unit's whole lifetime so an EXIT trap is right there, whereas `spine-spawn`
  exits immediately while the pane it spawned lives on, so an EXIT trap would
  delete the worktree out from under a running agent. Some other tier must own
  the reap. Until a rule or supervisor forces it, spine-side teardown is
  DOCTRINE and an orchestrator that forgets still leaks. **Say this plainly in
  the ledger row.** A row that claims DOOR everywhere would be a lie that costs
  the next sweep.

**Out of scope, do not fix, but do not lose either:** `agent-core status`
currently summarises `265 ok · 4 stale · 57 missing`, while
`primitives/HARNESS-PARITY.md` records `250 ok · 3 stale · 0 missing`. The 57
missing predate this unit entirely. Do not chase them. Your registration must
not make that number worse, and if adding your entries changes it, say by how
much and why.

## Parallel Work Notice

No sibling fleet work is in flight. All three prior orchestrators have reported,
been verified, and been reaped. The three repos are yours to read; only the
files below are yours to write.

**Your partition — you may write exactly these three files:**

```
~/.agent-core/registry                                   (machine state, untracked)
~/agent-core/primitives/rules/ENFORCEMENT.md
~/agent-core/primitives/rules/worktree-lifecycle.md
```

Not `HARNESS-PARITY.md`. Not `cli/src/**`. Not either spawner — their work is
verified green and uncommitted in their working trees, awaiting the coordinator;
**do not touch `~/herdr-spine` or `~/cursor-shim` working trees at all**, not
even to tidy. A stray edit there corrupts a verified, unlanded diff.

## Tower (mid-run communication)

**Tower is MAILBOX ONLY this session.** `~/.tower/PHASE2-WRITE-GATE-PROOF.md`
does not exist, so the write gate is unproven. Do not describe Tower as
operational and do not build any part of this work on the assumption that it is.

- Findings and claims: board topic `agent-core/worktree-lifecycle`.
  `bun ~/.tower/cli.mjs post <claim|finding|note> agent-core/worktree-lifecycle "<body>" --from "<your role>"`.
  Read the topic before you write anything — the sibling's enforcer-status
  finding is the input to task 2.
- Self-report: `~/herdr-spine/bin/spine-report task "<what I'm doing>"` at start,
  `spine-report verdict "<result>"` when done.

**MANDATORY — the stigmergic field.** Ranks 1-4 coordinate through the
environment, never by talking to each other directly
(`~/.tower/COMMS-ARCH.md` plane 5).

- **Emit** work others could take: `work-available` with topic, payload ref, and
  **mandatory evidence** — an emit without evidence is not an emit.
- **Read the field before ever going idle.** Open work you can take, you claim
  (`work-claimed`, `ref`-ing the exact pheromone id) and do. If your unit came
  from a brief rather than a field emission there is no claim id to reference —
  do not manufacture one.
- **`work-done`** `ref`-ing what you claimed. **`need-help`** instead of going
  quiet, carrying `nq` (default 3 minus escalations), as a route derivation hint
  resolving one link up the lineage, never a hard address.
- **nQ=0 before deliverable.** Never emit `work-done` holding open questions.
- **Heartbeat your claims.** TTL 30s, heartbeat at roughly ttl/3, or the claim
  evaporates and the work returns to the field.
- Verbs: `bun ~/.tower/cli.mjs emit <scent> <topic> <payload_ref> [--ref id]
  [--to-role r] [--evidence path] [--ttl N]` and `... field`.
- **Two acceptable stopping conditions, and only these:** every done-condition
  met, or a posted `need-help`/BLOCKED naming what is needed and who owns it,
  *after* proceeding with everything that does not depend on it. "Reported and
  awaited instruction" is not a stopping state.

## Tasks

**1. Register both doors in `~/.agent-core/registry`** as check-only entries
under the `machine` scope, matching the shape and placement of the existing
`binary machine` / `check machine` precedents cited above. Register what
actually exists and is executable: the herdr-spine teardown verb and the
cursor-finish EXIT trap. Choose the verb (`binary` vs `check` with a `#needle`)
that will **fail when the door is removed or reverted** — a registry entry that
passes after someone deletes the trap is worse than no entry, because it
launders absence as coverage. Back up the file before you write it; it is
untracked machine state with no git safety net.
- **Done when:** `agent-core status` shows both entries; **and** you have proven
  the entries actually detect absence, by temporarily perturbing the target
  (rename the binary, or point the check at a needle you then remove), observing
  the status flip to missing/stale, and restoring — with both outputs quoted.
  A registration you have only seen pass is not verified.

**2. Refresh the enforcer status to what is now true**, in
`ENFORCEMENT.md:47` and in the compilation note in `worktree-lifecycle.md`
section 7. Record DOOR where a door exists, and keep the spine-side
auto-invocation gap explicitly labelled DOCTRINE with its structural reason. Do
not upgrade the row beyond the evidence.
- **Done when:** the ledger row and the compilation note both name what is DOOR
  and what remains DOCTRINE; `grep -n 'in flight\|unwired at time of writing'
  ~/agent-core/primitives/rules/worktree-lifecycle.md` returns nothing; and the
  row cites the specific evidence (`cursor-finish:460`, `spine-spawn --help`).

## Constraints

- **Never implement production code yourself.** Dispatch. Research assists are
  fine.
- Do not bypass `credential-guard`, the grounding hook, the write gate, or the
  spawn door. A refusal is information, not an obstacle.
- **One write per file per thought.** Compose consecutive edits into a single
  call; read before any second write to the same file.
- Testing: NO MOCKS. The perturbation test in task 1 is against the real
  registry and the real `agent-core status`.
- Do not run dependency install from a worktree.
- **Workers never commit.** You verify and report; the coordinator lands.
- This unit is small. If you find yourself spawning more than two workers, stop
  and reconsider the partition — a spawn that costs more than the work is a
  partitioning mistake.

## Report back with

- Each done-when quoted, with the evidence that satisfied it: command run,
  output tail, file path. For task 1, both halves of the perturbation test.
- Every file created or modified, including dotfiles and machine state.
- The `agent-core status` summary line before and after your change, and an
  explanation of any movement in the `missing` count.
- Any done-when you could not satisfy, what blocked it, and what you did with
  everything that did not depend on it.
- Deviations from this brief with the reason. If a Pre-Verified Fact turns out to
  be wrong, say so plainly and cite what you found instead — that is the most
  valuable thing you can report.
