# ORCH — build the deposit/courier substrate and prove it on the case that failed

You own one committed unit: **Units 2 and 3** of the comms-substrate project.
Build the delivery primitive, migrate every handler that delivers, install the
enforcer, and prove it live against real panes. You decompose, dispatch,
verify, and reap. You do not implement.

`~/agent-core/briefs/comms-substrate/DESIGN.md` is **binding**. Read it first,
in full, along with `DELIVERY-CENSUS.md` beside it. If you believe the design
is wrong, post a finding and ask — do not redesign silently. Partitioning the
work across your workers is yours to decide; the design is not.

Do NOT use emojis anywhere.

## Pre-Verified Facts (CORD verified every one personally, 2026-08-16/17)

**Repo topology — this is not what it looks like:**

- `~/.tower/` is **NOT a git repository**. Its `.mjs` files are **symlinks**
  into `~/agent-core/primitives/mcps/tower/`, which IS git-tracked.
  Verified: `ls -la ~/.tower/` shows `lib.mjs`, `cli.mjs`, `server.mjs`,
  `rotate.mjs`, `COMMS-ARCH.md`, and the test files all symlinked there.
- **Therefore: edit `~/agent-core/primitives/mcps/tower/lib.mjs` and
  `cli.mjs`.** The change is live in `~/.tower/` immediately via the symlink,
  and it is version-controlled. Never edit through the symlink path in a way
  that replaces it with a regular file.
- The `~/.tower/*.jsonl` state files (`board.jsonl`, `ledger.jsonl`,
  `pheromones.jsonl`, `dead-letter.jsonl`, `odometer.jsonl`) are **not**
  tracked and must never enter git.
- `~/herdr-spine` is a git repo, remote `git@github.com:jcbbge/herdr-spine.git`.
- `~/agent-core` is a git repo, remote `git@github.com:jcbbge/agent-core.git`.
  The credential rewrite is complete; `origin/main` was `4d3058a` at brief
  time. The freeze is lifted.
- `~/dotfiles` is a git repo, remote `git@github.com:jcbbge/dotfiles.git`.
  Launch agents live in `~/dotfiles/launchagents/`.

**Existing test suites (use them; do not invent a new runner):**

- Tower: `~/agent-core/primitives/mcps/tower/` contains `dead-letter.test.mjs`,
  `write-path.test.mjs`, `write-gate.test.mjs`, `flock-integrity.test.mjs`,
  `jsonl-integrity.test.mjs`, `plane-fixes.test.mjs`, `ref-align.test.mjs`,
  `rotate.test.mjs`, `cli.test.mjs`, `server-drift.test.mjs`, plus
  `drift-check.mjs`.
- herdr-spine: `~/herdr-spine/test/` (`ctl-fleet-tasks.sh`,
  `spine-cursor-route.sh`, `worktree-lifecycle.sh`, `qa/`, `fixtures/`) and
  `~/herdr-spine/bin/handlers/tests/test_board_append_flock.py`.

**The code you are changing:**

- `~/herdr-spine/bin/handlers/_spine_common.py` exports exactly two delivery
  verbs: `notify(title, body, sound)` at line **291** and
  `verified_prompt(pane_id, text, timeout_ms=4000)` at line **363**. These two
  are the DOOR in DESIGN.md §7.
- `10-notify`: `toast_allowed()` at **334**; `PACE_WINDOW_SECONDS = 60` at
  **307**; pace path `~/.tower/notify-pace.json` at **304-305**; gate sites at
  **422** (blocked) and **494** (done).
- `17-field-pull`: `pace_allows()` at **179**, `pace_record()` at **191**,
  `PACE_WINDOW_SECONDS = 120` at **53**, drop log at **267**; other declines at
  **252**, **257**, **262**.
- `16-parent-wake`: already an outbox as of `herdr-spine 6c07649`.
  `PACE_WINDOW_SECONDS = 60` at **47**. **Subsume it; do not regress it.**
- `20-reflex` (limits at **477**, **482**) and `30-choreo`, `15-restore-view`,
  `40-tower-bridge` are **explicit non-targets**. DESIGN.md §6 says why.
  Migrating them is a defect, not thoroughness.
- Board append is already flocked (`LOCK_EX`) — `herdr-spine 25c1ef0`. Follow
  that precedent for every new append path.

**Dispatcher contract (`~/herdr-spine/docs/dispatcher.md`):** handlers are
one-shot subprocesses, python3 **stdlib only**, no timers, no threads; all
failures log to stderr and **exit 0**. Numeric prefix controls run order and
handlers run sequentially as separate subprocesses (lines 23-24, 81). This is
why `90-courier` runs last on every event.

**Platform:** macOS ships bash 3.2 — no `mapfile`, no associative arrays.

**Fleet state at brief time:** the `agent-core/harness-homogeneity` unit is
**DONE** — `ORCH harness-homogeneity` (`w3R:p1B`) is in `done` state with no
live children. The contention on `~/herdr-spine` that earlier briefs warned
about is **cleared**. Re-check `herdr pane list` before you hold `spine-spawn`,
and coordinate through board topic `agent-core/harness-homogeneity` if a new
contender appears.

**A brief fact that was wrong, and what is true instead:** the parent brief
claimed six of seven handlers invented a drop policy. That was an artifact of
`pace` being a substring of `work**space**`; `coalesc` appears nowhere in
`~/herdr-spine`. The true count is **three**, one already fixed, so your
migration surface is **two handlers** plus the subsumption of a third. Full
proof in `DELIVERY-CENSUS.md` §0. Do not size the work for six.

## Tower

Board topic: `agent-core/comms-substrate`.

- `bun ~/.tower/cli.mjs post <claim|finding|note> agent-core/comms-substrate "<body>" --from "<role>"`
- `bun ~/.tower/cli.mjs emit <scent> agent-core/comms-substrate <payload_ref> [--ref id] [--evidence path] [--ttl N]`
- `bun ~/.tower/cli.mjs field`
- Self-report: `~/herdr-spine/bin/spine-report task "<what>"` / `verdict "<result>"`
- Resource ownership: `~/herdr-spine/bin/spine-claim claim "<resource>" --ttl 30`,
  heartbeat every 10-20s, `release` when done.

You are rank 2. Stigmergic coordination is mandatory: emit `work-available`
with evidence, read the field before going idle, `work-claimed` with `ref`,
`work-done` with `ref`, `need-help` instead of silence. Heartbeat claims.

**nQ budget = 3.** Questions climb to CORD (`cord-comms-substrate`) first, on
the board topic. Rule locally by the rubric — craft, DX, UX, agentic
efficiency — before spending budget.

**You are rebuilding the bus you report on.** Back up `~/.tower` before any
mutation of its state files. CORD's backup at brief time:
`~/.tower-backup-20260816-193949`. Take your own before you start.

## Tasks

### Task 1 — the primitive

Implement `deposit()` and the queue per DESIGN.md §3, canonical in
`~/agent-core/primitives/mcps/tower/lib.mjs`, exposed on `cli.mjs`, with the
python binding in `_spine_common.py`.

- **done when:** tests prove, against the real bus and real files, that (a) a
  burst of deposits to one addressee loses nothing, (b) a deposit to an
  addressee with no live engine queues rather than drops, (c) a delivery
  failure requeues with backoff, (d) undeliverable-after-policy lands in
  `dead-letter.jsonl` with a non-empty `reason`, (e) pacing bounds interruption
  frequency and **never** produces a terminal state, and (f) every refusal
  category in §3's table returns a receipt and writes a dead-letter row. Tests
  live beside the existing tower tests and pass.

### Task 2 — the courier and the pulse

Implement `90-courier` and the launchd pulse per DESIGN.md §5, both running one
body of code under one lock file.

- **done when:** `90-courier` drains on every event; the launchd agent is
  installed from `~/dotfiles/launchagents/` and firing on its interval; two
  concurrent invocations provably cannot both drain (lock proven, not
  asserted); the courier verifies each submit before writing `delivered`.

### Task 3 — observability

Implement `bun ~/.tower/cli.mjs stuck` per DESIGN.md §4.

- **done when:** it prints one line per non-empty inbox with addressee, engine
  liveness, queued count, oldest age, attempts, next attempt, and last error;
  prints `nothing owed` on an empty queue; exits 0 when nothing is stuck and 1
  when something is; and reports orphaned inboxes as `stranded`.

### Task 4 — migrate the handlers and install the enforcer

Migrate `10-notify` and `17-field-pull`; subsume `16-parent-wake`. Install the
DOOR and the HOOK per DESIGN.md §7.

- **done when:** no handler outside `90-courier` contains pace, coalesce, or
  drop logic; `notify()` and `verified_prompt()` raise when called without the
  courier's env stamp, proven by a negative test; `tests/no-private-delivery.py`
  exists, is wired into the spine test suite, and **fails on a deliberately
  planted violation** (prove the hook by breaking it, then revert);
  `~/.tower/notify-pace.json`, `~/.tower/field-pull-pace.json`, and
  `~/.tower/parent-wake-pace.json` are deleted and nothing recreates them.

### Task 5 — prove it on the case that failed (Unit 3)

**NO MOCKS.** A mocked bus proves nothing about a bus whose defect was that it
lied about delivery.

1. Spawn three workers from one spawner, finish them inside the pace window,
   and prove all three completions reach the spawner — named, in one or more
   wakes, none lost.
2. Prove the operator-focused case delivers rather than deferring forever.
   This is the path that requires the pulse; if it passes without the launchd
   agent running, the test is wrong.

- **done when:** both proven by a real run against real panes, with the exact
  command and the observed output recorded in
  `~/agent-core/briefs/comms-substrate/PROOF.md`, including the pane ids and
  timestamps so CORD can re-derive the result from `board.jsonl` independently.

### Task 6 — kill the fabricated completion (ADDED mid-flight; read DESIGN.md §6a)

**CORD found this live, in this unit's own traffic, minutes after spawning
you.** CORD was told *"your worker ORCH deposit-courier is done"* 10 seconds
after you were created, while you were `working` with nothing produced. The
board row shows the trigger was status **`idle`**, not `done`.
`16-parent-wake:165` treats them identically (`if status not in ("done",
"idle")`) and then sends a prompt hardcoded to say *"is done"*. Every spawn
fabricates a completion for its spawner. It happened to CORD's own spawn too.

**Why this is yours and cannot be deferred:** after Task 1 lands, delivery is
guaranteed — so the false completion becomes *reliably* delivered rather than
intermittently. Improving delivery without fixing fabrication converts an
intermittent lie into a dependable one. Do not ship the primitive without this.

Implement the evidence rule in DESIGN.md §6a: a completion deposit is refused
at the door unless it carries `status == "done"`, a `.done` marker, a
`work-done` pheromone `ref`, or a `$verdict` token. Fix the prompt text so an
idle pane holding a live claim is reported as what it is, not as a completion.

- **done when:** a freshly spawned worker provably does **not** generate a
  completion message for its spawner (demonstrate with a real spawn, showing
  the refusal receipt in `dead-letter.jsonl` with a non-empty reason); a
  genuinely finished worker still does; and the `-> idle` and `-> done` cases
  are distinguishable in both the board row and the delivered prompt text.

### Task 6b — fix the verifier before you build on it (read DESIGN.md §3a)

**Also found live, sending you the Task 6 amendment.** The message reached you
— your own transcript shows you read it and replied. The substrate reported
`FAIL: prompt NOT verified as submitted (status working)`.

`_spine_common.py:363-398`: `verified_prompt()` waits `--until working`. When
the target is **already** `working` there is no transition to observe, so the
wait times out and it raises — reporting non-delivery for a delivered message.
The only fallback (`:380`) covers a buffered paste, not an already-working
target.

**This is load-bearing for Task 1.** Your courier writes `delivered` only on a
verified submit and requeues on failure. With this verifier, every delivery
into a busy pane "fails" and requeues, so at-least-once becomes **unbounded
duplicate delivery, concentrated on the busiest panes** — message amplification
in place of message loss, and every duplicate costs the receiver a turn. Build
Task 1 on the current verifier and you ship a worse bug than the one you were
sent to fix.

Implement DESIGN.md §3a: capability-gated delivery as the default (deliver on
the flip to `idle`/`blocked`, never type into a `working` pane); evidence =
status flip **or** transcript echo matched on `deposit_id`; "already working"
as a distinct deferred outcome that never shares a code path with a genuine
delivery failure.

- **done when:** a deposit to a `working` pane defers and is delivered exactly
  **once** on its next flip — proven by a real run with the delivered count
  asserted, not inspected by eye; transcript-echo verification is exercised by
  a test; and a genuine delivery failure still requeues, proven separately so
  the two paths are demonstrably distinct.

### Task 7 — land

- **done when:** commits in `~/agent-core`, `~/herdr-spine`, and `~/dotfiles`
  carry the standard handoff format, are pushed to `origin` on green, and the
  commit SHAs are posted to the board topic. Workers never commit — you do.

## Constraints

- **Do not bypass** `credential-guard`, the grounding hook, the write-gate, or
  the spawn-door. A refusal is information; work with it, never around it.
- **Never put a credential literal in a brief or artifact.** Board dumps carry
  a localhost proxy credential and are gitignored — they never enter git.
- Back up `~/.tower` state before any mutation.
- Do not regress `16-parent-wake`'s outbox behavior. Subsume it.
- Handlers: python3 stdlib only, one-shot, no timers or threads, all failures
  log and exit 0.
- Disjoint file partitions across your workers — no two workers share a file.
- Criteria before code: the party writing acceptance criteria is not the party
  writing the implementation.

## Report back with

- Confirmation that all three private pace files are gone, and that
  `grep -l 'pace\|coalesc' bin/handlers/[0-9]*` returns only the courier's own
  callers (report the literal output).
- The three-worker burst proof: command, pane ids, timestamps, observed result.
- The operator-focused deferral proof, and confirmation it required the pulse.
- The negative test showing `notify()` / `verified_prompt()` refuse outside the
  courier, and the planted-violation run showing the hook fails closed.
- The enforcer's honest DOOR/HOOK/DOCTRINE label as shipped — if the DOOR could
  not be fully closed, say so plainly rather than claiming it.
- Every file created or modified, including dotfiles, launch agents, and config.
- Commit SHAs pushed, per repo.
- Any Pre-Verified Fact above that turned out wrong, and what you found instead.
