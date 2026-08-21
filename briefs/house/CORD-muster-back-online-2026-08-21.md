# CORD [muster] — get Muster back online

You are the COORDINATOR for Muster. You read, verify, brief, and gate. You do
not implement with your own hands — you already have one ORCH in flight (see
"Your inherited child" below) and you dispatch more as needed.

You spawn with ZERO context. Everything below is verified or is the operator's
own stated intent, labeled as such.

## What Muster IS (operator's framing, his words, 2026-08-21)

> "Muster is an abstraction that lives on top of herdr. We are using it as our
> coordination plane to spawn workspaces, tabs, and then split tabs into panes,
> so that we can have visual confirmation of our active fleet in progress. And
> muster is the control bus / messaging bus to facilitate the downward flow of
> directives and coordination versus the upward flow of reporting and status
> updates. It's meant to be a global module, but it also has to leave its trace
> elements inside individual projects. It's more like a global CSS or a global
> CLI utility that can be accessed for communication."

Two responsibilities, then:
1. **Fleet topology on top of Herdr** — spawn workspace → tab → split panes, so
   the operator can SEE the live fleet. Herdr owns the terminals; Muster owns
   the plan.
2. **The bus** — directives flow DOWN, reports flow UP, durably.

And one architectural property that is currently unresolved and is, in the
concierge's read, the root of the bug below: **global module, per-project
trace.** One installed utility, reachable from anywhere, that still leaves its
evidence inside the individual project it acted on.

His ask: *"let's figure out what the issue is… a quick debug and figure out
exactly what is going on. What is the issue? Where did this go off track?"*

## Pre-Verified Facts — the defects (verified by the concierge this session, 2026-08-21)

Logic source: `~/muster/field/field.lisp`. Repo: `~/muster`.

**DEFECT 1 — deposits land in `/private/tmp`, not a ledger.**
- `field.lisp:22-24`: `field-dir` falls back to
  `(namestring (make-pathname :directory (pathname-directory *source-pathname*)))`.
  In the SAVED SBCL image, `*source-pathname*` resolves to the BUILD-TIME
  directory, which was `/private/tmp/`. So with no env override the ledger path
  is `/private/tmp/deposits.jsonl`.
- Verified live: a probe deposit exited 0, printed an id, and appended to
  `/private/tmp/deposits.jsonl`. Nothing reached `~/muster/field/` or `~/tup/field/`.
- `MUSTER_FIELD_DIR` and `TUP_FIELD_DIR` are UNSET in the operator's environment.
- The only populated ledger on disk, `~/tup/field/deposits.jsonl` (121 rows), has
  been FROZEN since `2026-08-19T01:04:11Z`.
- **This is where the global-vs-per-project question stopped being theoretical.**
  "Where does the ledger live" was never decided, so the code fell back to an
  accident of the build environment. Rule the design question and the bug closes
  with it.

**DEFECT 2 — every deposit id is the same string.**
- `field.lisp:12`: `(defparameter *rng* (make-random-state t))` — evaluated at
  LOAD/BUILD time, so the random state is baked into the saved image and every
  process launch replays the identical sequence. `random-hex` (36-38) and
  `gen-id` (40-45) draw from it.
- Verified: `/private/tmp/deposits.jsonl` holds **36 rows all with
  `"id": "dep-9671f726d5d6"`** plus 2 `col-9671f726d5d6`. Distinct agents,
  distinct days, one id.
- Consequence: `--ref` and the collect path are ambiguous by construction.
  `muster-deposit collect --to operator` returns
  `REFUSED at the door: no deposit NIL to collect`.

**DEFECT 3 — the spawn door cannot deliver a large brief (concierge hit this three times today).**
- `~/bin/spine-spawn orch … --brief <path>` starts the agent fine, then fails:
  `native submit did not verify ({"error":{"code":"timeout","message":"timed out waiting for agent status"}})`
  followed by `prompt NOT verified as submitted`. The pane is left alive with an
  agent and an EMPTY prompt.
- Reproduced with briefs of roughly 5 KB and 6 KB. A short prompt through
  `~/bin/spine-spawn prompt <pane> "<text>"` submits and verifies immediately.
- Present workaround: pass a one-paragraph pointer telling the agent to read the
  brief off disk. That works, but it means the spawn door's headline feature —
  hand an agent its brief at birth — silently fails at real brief sizes, and the
  door's own verification is what catches it. This is squarely your thread:
  it is the downward-directive half of the bus.

**Preserved evidence (do not lose):**
`~/muster/field/RECOVERED-2026-08-21-tmp-deposits.jsonl` — byte copy of
`/private/tmp/deposits.jsonl` (38 rows) taken before any tmp purge. It contains
the whole 2026-08-19 muster-cutover trail (`cord-muster-full-cutover`,
`orch-spawn-door`, `orch-doctrine-cutover`, `orch-plugin-registry`,
`orch-desk-status-dictum`, ~10 `agnt-*`), two 2026-08-20 `concierge` rows
including a `need-help` reading "agentcore-wave BLOCKED" that nothing ever
collected, and today's concierge rows.

## Your inherited child (already running — do NOT re-spawn or reap it)

An ORCH is live in pane `w64:p4`, task `muster-door-fix`, working in `~/muster`.
Its brief: `~/agent-core/briefs/house/ORCH-muster-deposit-door-defects-2026-08-21.md`
(defects 1 and 2, plus ledger recovery and regression tests). As of the last
observation it was writing `tests/test-deposit-door.sh` and had already run into
the `MUSTER_FIELD_DIR` vs `TUP_FIELD_DIR` precedence question. It has been told
you are now its parent.

Read its brief so you are not duplicating it. Fold its work under your plan,
observe it via `herdr pane read w64:p4`, and let it finish the mechanical fix
while you own the architecture. **Defect 3 is NOT in its brief** — that is yours
to dispatch or to own.

## Your job

1. **Answer the operator's question first: where did this go off track?** A short,
   evidenced account — not a repair log. He asked for a debug, and the honest
   answer spans the three defects plus the undecided global/per-project seam.
2. **Rule the global-module / per-project-trace design.** Where does the ledger
   live when Muster is installed once and used from every project? What is the
   per-project trace, and how does a project-scoped deposit stay findable from
   the global door? This ruling is what makes defect 1's fix principled instead
   of a hardcoded path.
3. **Gate the fix to Land.** Tests green, committed, pushed to the operator's own
   remote. Do NOT publish to any third-party surface.
4. **Verify the bus end to end before you claim it is back online.** A deposit
   written from one project, readable from the global door, with a unique id, and
   a large brief delivered at spawn. Proof on disk, not a report.

## Constraints

- Read `~/muster/AGENTS.md` FIRST. If it disagrees with this brief, AGENTS.md
  wins — and report the disagreement.
- `events.jsonl` is append-only and hash-chained; hand-editing any line breaks
  every hash after it. If recovery cannot be done without violating that law,
  stop at a written proposal and say so plainly.
- Isolation seams that MUST keep working: `MUSTER_FIELD_DIR`, `MUSTER_STORE_DIR`,
  `MUSTER_EVENTS_PATH`, and the determinism seams `MUSTER_FIXED_TS`,
  `MUSTER_FIXED_DEP_ID`, `MUSTER_FIXED_COL_ID` (with `TUP_*` compat fallbacks).
  Tests must never touch the live ledger.
- House law: no mocks. Tests exercise the real door and real files in a scratch
  `MUSTER_FIELD_DIR`.
- Stage explicitly. Never `git add -A`.
- There is a documented tension you will hit: house docs say tup is retired, yet
  the only populated ledger is `~/tup/field/deposits.jsonl`. Name it, rule it,
  do not paper over it.

## Report-back

Parent is `claude-concierge`. The door you report through is the thing you are
fixing, so until defect 1 lands, ALSO write status to
`~/muster/field/CORD-muster-status.md` on disk.
`~/muster/bin/muster-deposit deposit --from cord-muster --to claude-concierge --kind report|done|need-help|question --body "<...>"`
