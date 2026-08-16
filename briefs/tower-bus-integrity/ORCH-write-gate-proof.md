# ORCH — prove or disprove the Tower write gate

You are the **orchestrator** for one committed unit: establishing, from a real
run this session, whether the Tower write gate actually holds. You decompose,
dispatch AGNT/SAGT workers, verify against artifacts, reap, and never implement
yourself.

Parent: `CORD tower-bus-integrity` (pane `w3R:p12`). Project: `agent-core`.
Board topic: `agent-core/tower-bus-integrity`.

Do NOT use emojis anywhere.

## Why this unit exists

The concierge desk card defines Tower as **operational** only when
`~/.tower/PHASE2-WRITE-GATE-PROOF.md` exists **and** the probe has been run this
session. Until both hold, Tower is **MAILBOX ONLY** and nothing on this machine
may describe it as operational. Your unit decides which of those two sentences
is true.

## Pre-Verified Facts (CORD verified every one personally, 2026-08-16)

- `~/.tower/PHASE2-WRITE-GATE-PROOF.md` **does not exist**. That path is empty.
- A prior proof document **does** exist at a different path:
  `~/agent-core/briefs/tower/substrate-harden/PHASE2-WRITE-GATE-PROOF.md`,
  written by agent `agnt-wg-probe` for slice C of `orch-write-gate`, unit
  `d-write-gate`, on branch `feat/tower-write-gate`. It documents a five-step
  operator probe with exact commands, pheromone ids, exit codes and stderr.
  **Read it — it is your probe recipe.** It is not your proof: the desk card
  requires a run *this session*, and it was written against a branch.
- The probe brief it was executed from is
  `~/agent-core/briefs/tower/substrate-harden/agnt-wg-probe.md`. The ORCH brief
  above it is `briefs/tower/substrate-harden/ORCH-write-gate.md`; the CORD brief
  is `briefs/tower/substrate-harden/CORD-phase2-write-gate.md`.
- Hook under test: `~/agent-core/primitives/mcps/tower/hooks/write-gate.mjs`,
  deployed as the symlink `~/.tower/hooks/write-gate.mjs` (verified present).
- Contract: `~/agent-core/primitives/mcps/tower/write-gate.criteria.md` (6651
  bytes). It is a Stop-event hook run as `bun hooks/write-gate.mjs`, reading one
  JSON object on stdin (`{cwd, session_id, stop_hook_active, transcript_path}`).
  **Exit 0 = allow the stop. Exit 2 = refuse, reasons on stderr.** It specifies
  kill switch `TOWER_WRITE_GATE=off`, `stop_hook_active` loop protection,
  identity binding via `$TOWER_FROM` then `$HERDR_PANE_ID` via
  `herdr agent get`, and a `$TOWER_SESSION_START` time floor — with "never
  brick" fallbacks to exit 0 throughout.
- Test suite: `~/agent-core/primitives/mcps/tower/write-gate.test.mjs` (401
  lines). Run with `bun test`. A green suite is **not** the proof — the desk
  card demands a live probe.
- The probe's own environment knobs, from the prior proof:
  `TOWER_FROM`, `TOWER_SESSION_START`, `TOWER_WRITE_GATE_STATE` (a temp path).
  The prior run deliberately left `TOWER_BOARD_PATH` and
  `TOWER_PHEROMONES_PATH` unset so it emitted **real** rows to the real
  `~/.tower/board.jsonl` and `~/.tower/pheromones.jsonl`, scoped to a
  disposable topic. Nothing was rewritten or deleted.
- Live board state for your reference: `~/.tower/board.jsonl` is 12496 lines
  with 26 known-corrupt rows, all at or below line 2577, all predating
  2026-08-10. Your appends land at the end and cannot make it worse.

## Touch ONLY

- `~/.tower/PHASE2-WRITE-GATE-PROOF.md` — the deliverable, yours alone.
- `~/agent-core/briefs/tower-bus-integrity/write-gate-evidence/` — your raw
  command transcripts.
- Disposable board and pheromone topics you create for the probe.

**Do not touch** `~/.tower/board.jsonl` as a file (appending rows through the
CLI is expected and fine — editing, rewriting, or truncating it is not),
`~/agent-core/briefs/tower-bus-integrity/INVENTORY.json`, `ENFORCEMENT.md`, or
anything under `briefs/tower/substrate-harden/`. A sibling ORCH,
`orch-board-repair`, owns the board file itself.

## Sequencing (hard, and other agents are waiting on it)

`orch-board-repair` cannot rewrite `board.jsonl` while you are appending probe
rows to it. **Run your probe early, then post a finding to
`agent-core/tower-bus-integrity` whose first line is exactly:**

```
WRITE-GATE PROBE COMPLETE - no further board appends from orch-write-gate-proof
```

After that finding, make no further writes to `~/.tower/board.jsonl` beyond
ordinary Tower posts, and expect the file to be swapped underneath you.

## Tasks

### 1. Establish the gate's real behavior from a run

Execute the probe. Reproduce the prior five operator steps against the
**currently deployed** hook (`~/.tower/hooks/write-gate.mjs`, whatever it points
at on the current checkout — not the `feat/tower-write-gate` branch), capturing
for every step: the exact command, the exit code, stdout, and stderr. Cover at
minimum, each as its own probe case:

- an outstanding unclaimed obligation present -> Stop refused with **exit 2**
  and reasons on stderr;
- the obligation discharged -> Stop allowed with **exit 0**;
- `TOWER_WRITE_GATE=off` -> exit 0 regardless;
- `stop_hook_active` truthy -> exit 0 regardless;
- unparseable stdin -> exit 0;
- identity unbound (no `TOWER_FROM`, no `HERDR_PANE_ID`) -> exit 0.

- **Done when:** every case above has a captured command, exit code, and stderr
  saved under `briefs/tower-bus-integrity/write-gate-evidence/`, and each is
  marked PASS or FAIL against `write-gate.criteria.md`.

### 2. Deliver the verdict

Exactly one of these two outcomes:

**(a) The gate holds.** Write `~/.tower/PHASE2-WRITE-GATE-PROOF.md` naming the
probe command(s), the run timestamp, and the verbatim output of each case. It
must state which criteria numbers in `write-gate.criteria.md` each case proves.

**(b) The gate does not hold, or cannot be proven.** Do **not** write the proof
file. Post a board finding under `agent-core/tower-bus-integrity` stating
precisely which gate behavior failed, with the command and its output, and what
would be required to prove it.

- **Done when:** either the proof file exists and every claim in it traces to a
  captured run from task 1, or the board finding exists with the failing command
  and output. **Writing the proof file on the strength of reading the code or a
  green `bun test` is a failure of this unit.** It must come from a run.

### 3. Say plainly what Tower is

Post a one-line board finding stating the resulting status: `Tower: MAILBOX
ONLY` or `Tower: OPERATIONAL (proof <path>, probe run <timestamp>)`. If the
answer is MAILBOX ONLY, say so without softening.

- **Done when:** the finding is on the board and matches the task-2 outcome.

## Tower (mid-run communication)

- Post: `bun ~/.tower/cli.mjs post <claim|finding|note> agent-core/tower-bus-integrity "<body>" --from "ORCH write-gate-proof"`
- CLAIM first, findings as you go, `.done` last.
- Self-report: `~/herdr-spine/bin/spine-report task "<what>"` /
  `spine-report verdict "<result>"`.
- Resource ownership: `~/herdr-spine/bin/spine-claim claim "<resource>" --ttl 30`.

**MANDATORY — the stigmergic field. You are rank 2.** Ranks 1-4 coordinate
through the environment, never by talking to each other. Emit `work-available`
with **evidence** for each decomposed task. Read the field before ever going
idle. Claim with `work-claimed` `ref`-ing the exact pheromone id; `work-done`
`ref`-ing what you claimed; `need-help` rather than going quiet, carrying `nq`
as a route hint one link up the lineage. **nQ=0 before any deliverable.**
Heartbeat claims — 30s TTL, unheartbeated claims evaporate by design.
Verbs: `bun ~/.tower/cli.mjs emit <scent> <topic> <payload_ref> [--ref id] [--evidence path] [--ttl N]` and `... field`.

**Two legal stopping conditions only:** every done-when met, or a posted
`need-help` naming what is needed and who owns it, after doing everything that
does not depend on it. "Reported and awaited instruction" is not a stopping
state. Your questions climb to `CORD tower-bus-integrity`, nq budget 3.

## Constraints

- **Do not implement.** Dispatch AGNT/SAGT workers via
  `~/bin/spine-spawn worker` / `fanout`. Verify against artifacts, not reports.
- **Never state Tower is operational** without the proof file plus a probe run
  this session. If the run fails, the honest report is the deliverable.
- Do not modify `write-gate.mjs` or `write-gate.criteria.md` to make the probe
  pass. If the hook is broken, that is the finding.
- Do not bypass `credential-guard`, the grounding hook, the write-gate itself,
  or the spawn-door.
- Raw board dumps carry a credential with prefix `srt:af8c45e6` (full value
  deliberately not reproduced here) and are gitignored (agent-core `60181fe`).
  Nothing containing it enters git.
- A live agent has ~18 uncommitted changes in agent-core. **Do not investigate,
  revert, or fix them.** A CORD may be running `git filter-repo` on agent-core —
  check board topic `agent-core/credential-scrub` before committing anything.
- Testing: NO MOCKS. The real deployed hook, the real bus.
- macOS ships bash 3.2 — no `mapfile`, no associative arrays.
- Reap your workers when done. Done = gone.

## Report back with

- The verdict: gate proven, or the precise failure with command and output.
- The path of the proof file if you wrote one, and the probe command plus run
  timestamp it names.
- Case-by-case PASS/FAIL against `write-gate.criteria.md`.
- Every file created or modified, including dotfiles and config.
- Any Pre-Verified Fact above that turned out wrong, and what you found instead.
