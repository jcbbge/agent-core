# ORCH — muster deposit door: two confirmed defects

Spawned by the concierge, 2026-08-21. ASYNC thread. It must NOT starve the
load-bearing Arc thread (`arc-freeze-stale`).

You have ZERO context beyond this brief. Everything you need is below.

## Why this exists

`~/muster/bin/muster-deposit` is the ONE write door for durable fleet mail
(house law: "One write door per concern. Messages go through the deposit door
only."). It is currently writing to a purgeable temp file with non-unique ids.
Every fleet report since at least 2026-08-19 is affected.

## Pre-Verified Facts (verified by the concierge this session, 2026-08-21)

Source of truth for the logic: `~/muster/field/field.lisp`.

**DEFECT 1 — deposits land in /private/tmp, not the ledger.**
- `field.lisp:22-24`: `(defun field-dir () (env-muster-tup "MUSTER_FIELD_DIR" "TUP_FIELD_DIR" (namestring (make-pathname :directory (pathname-directory *source-pathname*)))))`
- In the SAVED SBCL image, `*source-pathname*` resolves to the BUILD-TIME
  directory, which was `/private/tmp/`. So with no env override, `field-dir` =
  `/private/tmp/` and `deposits-path` = `/private/tmp/deposits.jsonl`.
- Verified live: `~/muster/bin/muster-deposit deposit --from probe --to probe --kind report --body "door-write-probe 2026-08-21"`
  exited 0, printed an id, and appended to `/private/tmp/deposits.jsonl`.
  Nothing was written to `~/muster/field/` or `~/tup/field/`.
- `find / -maxdepth 4 -name deposits.jsonl -newermt '2026-08-21 00:00'` -> only `/private/tmp/deposits.jsonl`.
- The canonical ledger `~/tup/field/deposits.jsonl` (121 rows) has been FROZEN
  since its last row, `2026-08-19T01:04:11Z`.
- `MUSTER_FIELD_DIR` and `TUP_FIELD_DIR` are UNSET in the operator's environment
  (verified: `env | grep -i 'MUSTER_\|TUP_'` -> empty).

**DEFECT 2 — every deposit id is the same string.**
- `field.lisp:12`: `(defparameter *rng* (make-random-state t))`
- `defparameter` is evaluated at LOAD/BUILD time, so the random-state is baked
  into the saved image. Every process launch restarts the identical sequence.
- `field.lisp:36-38` `random-hex` draws from `*rng*`; `gen-id` (40-45) builds
  `dep-<12 hex>` from it.
- Verified: `/private/tmp/deposits.jsonl` contains **36 rows all with
  `"id": "dep-9671f726d5d6"`** and 2 rows with `"id": "col-9671f726d5d6"`.
  Distinct agents, distinct days, one id.
- Consequence: `--ref` addressing and the collect path are ambiguous by
  construction. `muster-deposit collect --to operator` returned
  `REFUSED at the door: no deposit NIL to collect`.

**Blast radius (evidence, do not re-derive):** the whole 2026-08-19 muster
full-cutover fleet deposited into `/private/tmp` — `cord-muster-full-cutover`,
`orch-spawn-door`, `orch-doctrine-cutover`, `orch-plugin-registry`,
`orch-desk-status-dictum`, and ~10 `agnt-*` workers. Plus two 2026-08-20
`concierge` rows (one `need-help`, "agentcore-wave BLOCKED"), and today's
concierge claim + finding.

**Already preserved for you (do not lose it):**
`~/muster/field/RECOVERED-2026-08-21-tmp-deposits.jsonl` — a byte copy of
`/private/tmp/deposits.jsonl` taken 2026-08-21 before any tmp purge.

## Tasks

1. **Fix defect 1.** Make the default field dir a stable, real location — do not
   rely on `*source-pathname*` in a saved image. Decide and record where the
   canonical ledger lives (note the tension: house docs say tup is retired, yet
   the only populated ledger is `~/tup/field/deposits.jsonl`). `MUSTER_FIELD_DIR`
   / `TUP_FIELD_DIR` overrides must keep working — the isolation law depends on
   them (`MUSTER_FIELD_DIR` is how tests avoid the live ledger).
   Done-when: a fresh `muster-deposit deposit` with NO env vars set appends to the
   canonical ledger, proven by reading the file before and after.
2. **Fix defect 2.** Seed the RNG at RUNTIME, not load time (e.g. re-seed on
   first use inside the process, or derive the id from runtime entropy). Preserve
   `MUSTER_FIXED_DEP_ID` / `TUP_FIXED_DEP_ID` and `MUSTER_FIXED_TS` — the
   byte-reproducibility tests depend on those seams.
   Done-when: three consecutive deposits in three separate process launches
   produce three DIFFERENT ids, shown in the file.
3. **Recover the stranded history.** Reconcile the recovered rows into the
   canonical ledger. Read `~/muster/AGENTS.md` FIRST — `events.jsonl` is
   append-only and hash-chained, and hand-editing is forbidden. If the ids
   collide (they do), rule on how to make recovered rows individually
   addressable and record the reasoning. If this cannot be done without
   violating the chain law, say so plainly and stop at a written proposal —
   do NOT improvise around the law.
4. **Regression test** for each defect, exercising the real door and real files
   in a `MUSTER_FIELD_DIR` scratch dir. House law: no mocks.

## Constraints

- Repo: `~/muster`. Read `~/muster/AGENTS.md` before touching anything; if it
  disagrees with this brief, AGENTS.md wins — report the disagreement.
- Stage explicitly. Never `git add -A`.
- Land it: tests green, commit with the house handoff trailer, push to the
  operator's own remote. Do NOT publish anywhere third-party.

## Report-back

Deposit up to `claude-concierge`. NOTE THE IRONY: the door you are reporting
through is the thing that is broken. Until task 1 lands, ALSO write your status
to `~/muster/field/ORCH-deposit-door-status.md` on disk so it cannot be lost.

`~/muster/bin/muster-deposit deposit --from orch-deposit-door --to claude-concierge --kind report|done|need-help|question --body "<...>"`
