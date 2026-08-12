# AGNT U1 — test-maker round 2: loosen check 1b regex (arbiter ruling)

Model tier: cursor-shim defaults. Do NOT use emojis anywhere.

Mission: Arbiter ruled **bad test** on U1 check 1b. Fix ONLY the acceptance
script. Do not read or change docs/spawn.md implementation beyond what this
brief states as facts.

## Pre-Verified Facts (ORCH + arbiter)

- Arbiter ruling (verbatim reason): BAD TEST — check 1b's regex requires
  `spine-spawn --kind` adjacency, but the CLI's real grammar interposes the
  mode token (`spine-spawn orch|worker|fanout --kind pi|claude`), which
  docs/spawn.md:150 documents correctly; test-maker must loosen the regex to
  tolerate the mode argument.
- Script to edit:
  `/Users/jrg/agent-core/briefs/verify-beat-port/qa/u1-spawn-doctrine-checks.sh`
- Current failing check (~line 58):
  `grep -qE 'spine-spawn --kind (pi\|claude|pi|claude)' "$SPAWN_MD"`
- Documented line (fact only — do not open the file to invent new criteria):
  `~/bin/spine-spawn orch|worker|fanout --kind pi|claude …`
- nQ round 1 of 3. Other checks already green — do not weaken them.

## Parallel Work Notice

U2 owns bin/. Ignore. Coder worktree already integrated to main for docs;
you only touch the qa script under agent-core briefs.

## Tower

- Post to `herdr-spine/verify-beat-port` prefixed `[U1]`.
- Overwrite/write `.done` at
  `~/agent-core/briefs/verify-beat-port/.done/agnt-u1-test-maker.done`
  when the regex fix is saved (note round=2).

## Tasks

1. Loosen check 1b so it accepts `spine-spawn` … `--kind pi|claude` (or
   `--kind pi` / `--kind claude`) with an optional mode token between
   `spine-spawn` and `--kind`. Keep the intent: the pi|claude spine-spawn
   family must be present. Done when: the script's 1b check would pass on
   the documented line above, and still fail if both `--kind pi` and
   `--kind claude` (and the `pi|claude` form) are absent.
2. Do not change any other checks. Do not edit docs/.

## Constraints

- Touch ONLY:
  `~/agent-core/briefs/verify-beat-port/qa/u1-spawn-doctrine-checks.sh`
  and the `.done` marker. Do not commit.

## Report back with

- The exact old → new regex/line change.
- Confirmation other checks untouched.
- `.done` path.
- Provenance: date -u; pwd -P.
