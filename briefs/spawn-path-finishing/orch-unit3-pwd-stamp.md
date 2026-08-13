# ORCH brief — Unit 3: shim-pwd-stamp

Mission: `cursor-fleet up` creates a project workspace but never stamps its `$pwd`
metadata, so the herdr sidebar L2 row can't show where the workspace lives. Add the
stamp at workspace creation, matching spine-spawn semantics. Repo: `~/cursor-shim`
(git, bash 3.2 compat, `set -euo pipefail`). Do NOT use emojis anywhere.

Board topic: `cursor-shim/spawn-finishing`. You are ORCH; I am CORD (w2Q:p1). Workers
never commit; I gate and land. Run the Verify beat: `cursor-fleet make <slug> --brief
<impl-brief>` from your own tab.

## Pre-Verified Facts (CORD verified each personally this session)

- Insertion point: `~/cursor-shim/cursor-fleet`, `up` verb — workspace create at
  :117-121. `WS_ID` is bound at :118, `DIR` at :107 (`--dir` arg or `$PWD` default).
  Stamp AFTER the `die` guard at :120 (both ids known-valid there).
- Carrier syntax (verified via `herdr workspace report-metadata --help` this session —
  positional workspace id FIRST, then flags):
  `herdr workspace report-metadata <WS_ID> --source cursor-fleet --token "pwd=<abs>" --ttl-ms 86400000`
- spine-spawn prior art (read this session, `~/herdr-spine/bin/spine-spawn` :482-504,
  `stamp_workspace_pwd`): `os.path.abspath(cwd)`, `--ttl-ms 86400000`, NON-FATAL —
  failure logs a warning, never kills the spawn. Match that exactly: on failure
  `log "WARN: ..."` and continue (existing warn pattern: cursor-fleet :200).
- `DIR` may be relative when passed as `--dir`; absolutize before stamping
  (e.g. `cd "$DIR" && pwd` subshell or python3 realpath — python3 one-liners are the
  established pattern in this repo, see cursor-fleet :243).
- qa-verify suite: `docs/qa-verify.sh`, `ck()` at :12. Static greps only for this unit —
  `up` has no dry-run and a live `up` creates a real workspace (FORBIDDEN in tests,
  cf. 78fa55c/6c85350). Cases: report-metadata call present in the up block
  (`sed -n '/^up)/,/^orch)/p' cursor-fleet`), `--source cursor-fleet`, `pwd=` token,
  `--ttl-ms 86400000`, non-fatal guard. Baseline: 100/100 this session; C8 gate
  `PASS >= 99` at :166 grows automatically.
- Evidence requirement (done-when #3 of the mission): a FRESH `cursor-fleet up`
  workspace must carry `$pwd` — that live check is MINE (CORD) at land time, not yours,
  not the suite's.

## Acceptance criteria

- AC1: `cursor-fleet up` stamps `pwd=<abs DIR>` on the new workspace via
  `herdr workspace report-metadata "$WS_ID" --source cursor-fleet --token "pwd=..."
  --ttl-ms 86400000`.
- AC2: stamp failure is non-fatal (warn + continue; workspace create still succeeds).
- AC3: `bash docs/qa-verify.sh` green with the new static cases.

## Tasks

1. Plan, then `cursor-fleet make unit3-pwd-stamp --brief <impl-brief>` from your tab.
2. Partition (disjoint, state in both worker briefs):
   - coder → `cursor-fleet` ONLY (the up block + header usage line if it lists up's flags).
   - test-maker → `docs/qa-verify.sh` ONLY (new `### shim-pwd-stamp` section).
3. Collect both workers (board DONE + reports); do NOT merge — report to me.

## Constraints

- Workers touch ONLY their partitioned files. No commits by anyone but CORD.
- No mocks; static/dry-run tests only.
- Match existing style (hj helper, die/log). Comments state constraints, not narration.
- bash 3.2 compatible; `set -euo pipefail` safe.

## Report back with

Per-file diff summary, new qa-verify case list, both workers' board DONE ids,
deviations + reasons. Post findings to `cursor-shim/spawn-finishing`.
