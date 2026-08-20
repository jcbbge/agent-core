# ORCH [register muster — the live coordination runtime]

slug: `muster-rows` · branch: `wave/muster-rows` · depends on: `orch-registry-vcs` landing first

Read `CONTRACT.md` in this directory first.

## Mission

Muster is the durable coordination runtime for this machine's agent fleet: the
spawn door, the deposit door, the ledger every fleet message moves through. It is
covered by **exactly one registry row** — `skill/muster`, which is documentation.
There is no binary row and no wiring row. If `muster-spawn` were deleted
tomorrow, `agent-core status` would stay green while every spawn on the machine
failed. Register it.

## Pre-Verified Facts (verified 2026-08-20)

- `~/muster/bin/` contains: `muster-deposit`, `muster-spawn`, `build-deposit.lisp`,
  `build-deposit.sh`, `run-tests.sh`.
- `~/muster/bin/muster-spawn` — executable, 61488 bytes, python3, modes
  `orch|worker|fanout|prompt|desk|verify-mark|verify-status|verify-migrate|reap`.
- `~/muster/bin/muster-spawn` contains `def cmd_reap(` at **line 1326** and
  `p.set_defaults(fn=cmd_reap)` at line 1506.
- `command -v muster` → **not found**. `muster` is NOT on PATH; every caller
  hardcodes `~/muster/bin/...`. `muster-deposit` and `muster-spawn` are also not
  on PATH under those names.
- `~/.local/bin/` contains `tower`, `tup`, `slim`, `latch`, `vein`, `assay`,
  `component-verify`, `fleet-task`, `herdr` — but no muster binary.
- The only muster row in `~/.agent-core/registry` is `primitive skill/muster`.
- `rule/worktree-teardown-spine` was retargeted earlier today to
  `check machine ~/muster/bin/muster-spawn#def cmd_reap(` — that row exists and
  is ✓. **Do not duplicate or modify it.** It proves the teardown door only.
- The spawn door is **enforced by a hook**: attempting the raw low-level herdr
  agent-start command is refused, and the refusal message directs the caller to
  `~/muster/bin/muster-spawn`. Reproduce this yourself to confirm; it is the
  evidence that muster-spawn is load-bearing for every spawn on the machine.
  (Note: the refusal string is matched by the hook itself, so avoid pasting the
  raw command into a shell command line while testing — invoke it directly.)
- `~/muster/docs/agent-spawn-sop.md` exists and is cited by the herdr skill as
  the authority for spawn modes and the stamping mandate.
- Baseline: `agent-core status` → `359 ok  0 stale  0 missing`.

## Tasks

1. Worktree per CONTRACT.md, sparse-scoped to `primitives`.
2. Read `~/agent-core/cli/src/presence.zig` to confirm what `binary` and `check`
   actually assert before choosing verbs. Note that muster is **another
   program's estate** — agent-core does not author it — so per
   `HARNESS-SHAPE.md` you register **coverage, not ownership**: `check` and
   `binary`, never `deploy`.
3. Add rows covering, at minimum:
   - `muster-spawn` present and executable;
   - `muster-deposit` present and executable;
   - the spawn-door enforcement itself — the thing that makes muster-spawn
     mandatory. The door script and its per-harness shims are already rowed as
     `hook/spawn-door*`; check whether the door's dependency on
     `~/muster/bin/muster-spawn` is asserted anywhere. If it is not, assert it
     with a needle pointing at that path inside the door script.
   Use needles that name the binding's own defining substring, so deleting the
   thing drops the needle.
4. `muster` is not on PATH. Decide whether that is a defect or intentional, from
   evidence — search `~/agent-core` and `~/muster/docs` for whether anything
   expects a bare `muster` command. **Do not create a symlink or shim.** If the
   evidence says it should be on PATH, that is a finding for your report and a
   row you cannot yet add; say so plainly.
5. Add a `muster` row to the component table in `primitives/COMPONENTS.md`
   reflecting reality after your change, and update or delete gap 1 accordingly.
6. Commit. Deposit `done`.

## Done-when

- New muster rows exist and every one is ✓ under `agent-core status`.
- `agent-core status` reports 0 stale, 0 missing. Paste the summary line.
- Your report states, with evidence, whether bare `muster` on PATH is a defect or
  intentional.
- `rule/worktree-teardown-spine` is untouched and still ✓.
- `primitives/COMPONENTS.md` updated, committed on `wave/muster-rows`.

## Report-back

Deposit `done` to `concierge` with the summary line, your new rows verbatim, and
the PATH finding. Write `orch-muster-rows.md.done`.
