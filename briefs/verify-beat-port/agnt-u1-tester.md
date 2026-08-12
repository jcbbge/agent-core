# AGNT U1 — tester: run spawn-doctrine acceptance checks

Model tier: cursor-shim defaults. Do NOT use emojis anywhere.

Mission: You are the Tester for unit U1 (spawn-path doctrine correction) in
`~/herdr-spine`. Run the acceptance oracle against the integrated main
checkout. You never edit code or tests. Report pass/fail with reproduced
evidence. On fail, hand a Q to the arbiter (do not diagnose or fix).

## Pre-Verified Facts (ORCH verified personally, 2026-08-12)

- Main checkout: `/Users/jrg/herdr-spine` — `docs/spawn.md` has been
  integrated from the coder worktree (wt-agnt-coder-w2k-p4). HEAD base was
  `4838882f7ff8881fd8476e5af39e2ec7302e46c3`; working tree should show
  `docs/spawn.md` modified only (plus pre-existing untracked paths to ignore).
- Acceptance script (authored by test-maker from the plan only):
  `/Users/jrg/agent-core/briefs/verify-beat-port/qa/u1-spawn-doctrine-checks.sh`
  (executable). Run it as:
  `bash /Users/jrg/agent-core/briefs/verify-beat-port/qa/u1-spawn-doctrine-checks.sh /Users/jrg/herdr-spine`
- Gate environment: main checkout `/Users/jrg/herdr-spine`. Do not use the
  worktrees. Ignore uncommitted `bin/` (U2) and pre-existing untracked paths.

## Parallel Work Notice

U2 owns `bin/`. Ignore `bin/` changes. Concern yourself only with running
the acceptance script and reporting.

## Tower (mid-run communication)

- Post findings to `herdr-spine/verify-beat-port` prefixed `[U1]`.
- `.done` marker: write
  `~/agent-core/briefs/verify-beat-port/.done/agnt-u1-tester.done`
  containing pass/fail and the script exit code + key output path/summary.
- Do NOT edit any repo files. Do NOT commit.

## Tasks

1. Run the acceptance script exactly:
   `bash /Users/jrg/agent-core/briefs/verify-beat-port/qa/u1-spawn-doctrine-checks.sh /Users/jrg/herdr-spine`
   — done when: full stdout/stderr captured; exit code recorded.
2. Also run and capture:
   `rg -n -i 'superseded|THE (fleet )?spawn path|cursor-shim is' /Users/jrg/herdr-spine/docs/spawn.md`
   and
   `rg -n -i 'cursor|spawn-path|superseded' /Users/jrg/herdr-spine/docs/ctl-fleet.md`
   — done when: full outputs + exit codes in the report.
3. Verdict — done when: report `pass` if script exit 0, else `fail` with
   failing check ids and hand Q to arbiter (do not fix).

## Constraints

- Touch ONLY: the `.done` marker file under
  `~/agent-core/briefs/verify-beat-port/.done/`. Never edit `docs/` or `bin/`.
- No mocks. Reproduce the run.

## Report back with

- Full acceptance-script output and exit code.
- Both rg outputs + exit codes.
- Verdict: pass or fail.
- Path of `.done` marker.
- Provenance: `date -u`; `pwd -P`; `git -C /Users/jrg/herdr-spine rev-parse HEAD`.
