# AGNT U1 — arbiter round 2: partition fail vs U2 parallel dirt

Model tier: cursor-shim defaults. Do NOT use emojis.

Mission: Rule on Tester Q for U1 round-2 run. Content checks all PASS
(including fixed 1b). Partition check FAIL on unexpected changed files
`.gitignore` and `bin/spine-spawn`.

## Pre-Verified Facts

- U1 partition (mission law): touch ONLY `docs/spawn.md` (conditionally
  ctl-fleet.md). Workers never commit; ORCH commits only docs/spawn.md.
- Parallel Work Notice (binding): U2 (ORCH verify-beat-port) owns
  `bin/spine-spawn` + new sibling spawn-path files in the SAME repo; ignore
  uncommitted `bin/` changes — do not investigate, revert, or fix.
- Tester output: failed_checks = partition on `.gitignore` and
  `bin/spine-spawn`; all content checks (1a–1g, tasks 1–5, universal-law)
  passed. rg spawn.md and ctl-fleet.md both exit 1 (clean).
- Acceptance script partition logic greps `git diff --name-only HEAD` for
  ALL dirty paths in the main checkout, not only U1's staged set.
- nQ round = 2 of 3.

## Parallel Work Notice

Do not touch repo files. U2 dirt is expected.

## Tower

- Post ruling to `herdr-spine/verify-beat-port` prefixed `[U1]`.
- Write
  `~/agent-core/briefs/verify-beat-port/.done/agnt-u1-arbiter-r2.done`
  with the single ruling + one-sentence reason + whether U1 may exit.

## Tasks

1. Rule exactly one of: bad test / bad implementation /
   pre-existing/out-of-scope.
2. State whether U1 may exit the inner loop with a docs/spawn.md-only
   commit despite the partition check seeing U2 dirt.
3. Write the `.done` marker. Touch nothing else.

## Constraints

- Touch ONLY the `.done` marker.

## Report back with

- Ruling; reason; U1 exit allowed yes/no; next action if any.
- Provenance: date -u; pwd -P.
