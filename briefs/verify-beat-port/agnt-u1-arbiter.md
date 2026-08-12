# AGNT U1 — arbiter: rule on Q from tester (check 1b)

Model tier: cursor-shim defaults (arbiter → kimi-k3:high). Do NOT use emojis.

Mission: You are the Arbiter (Polaris). A Tester Q landed for unit U1. Rule
exactly ONE of: **bad test** | **bad implementation** | **pre-existing /
out-of-scope**. Do not fix anything. Record the ruling.

## Pre-Verified Facts (ORCH verified)

- Failed check id: `1b` — "missing spine-spawn --kind pi|claude spawn-path family"
- Acceptance script path:
  `/Users/jrg/agent-core/briefs/verify-beat-port/qa/u1-spawn-doctrine-checks.sh`
- The failing regex (script ~line 58):
  `grep -qE 'spine-spawn --kind (pi\|claude|pi|claude)' "$SPAWN_MD"`
- Integrated docs line in `/Users/jrg/herdr-spine/docs/spawn.md` (coder wrote):
  `~/bin/spine-spawn orch|worker|fanout --kind pi|claude …   # pi / claude-code`
- Brief criterion (b) required documenting per-harness paths as
  `spine-spawn --kind pi|claude` and `cursor-fleet`/`cursor-spine` for cursor.
- All other acceptance checks passed. nQ round = 1 of 3.

## Parallel Work Notice

U2 owns bin/. Ignore. Touch nothing in the repo.

## Tower

- Post ruling to `herdr-spine/verify-beat-port` prefixed `[U1]`.
- Write `.done` at
  `~/agent-core/briefs/verify-beat-port/.done/agnt-u1-arbiter.done`
  with the single ruling word and one-sentence reason.

## Tasks

1. Read the failing check, the brief criterion (b), and the integrated line
   (you may read both the script and docs/spawn.md for this triage — arbiter
   sees both sides). Rule exactly one of: bad test / bad implementation /
   pre-existing/out-of-scope.
2. If bad test: say what the test-maker must loosen (exact regex change
   intent). If bad implementation: say what the coder must change (exact
   phrase form). Do not edit files yourself.
3. Write the `.done` marker with the ruling.

## Constraints

- Touch ONLY the `.done` marker. Never edit docs or qa.
- One ruling. No hedging.

## Report back with

- Ruling (one of the three).
- One-sentence reason.
- Next owner (test-maker or coder) and the precise fix instruction.
- Provenance: date -u; pwd -P.
