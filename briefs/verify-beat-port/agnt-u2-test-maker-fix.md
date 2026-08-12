# AGNT test-maker — fix U2 suite (arbiter nQ1: bad test)

Do NOT use emojis. Arbiter ruled BAD TEST on `qa/u2-verify-beat-checks.sh`. Implementation is correct. Fix ONLY the suite harness defects below. Do not read or edit `bin/spine-spawn`.

## Pre-Verified Facts

- Arbiter ruling: `~/agent-core/briefs/verify-beat-port/.done/agnt-u2-arbiter.done` — BAD TEST.
- Defects to fix in `~/agent-core/briefs/verify-beat-port/qa/u2-verify-beat-checks.sh`:
  1. `stderr_of` / `combined_of` must NOT end with `|| true` — preserve the child exit code (capture output AND return the real rc, e.g. via a temp file + `return $rc`, or separate capture helpers).
  2. Ledger greps must match `json.dumps` spacing (`"kind": "verify-gate-bypass"`) OR use a space-tolerant pattern / python JSON parse.
  3. `c-make-*-json` must parse **stdout only** (not merged stderr). Prefer: run make with stdout→file, stderr→file; assert JSON on stdout file; still allow make to fail for agent_name_taken by using unique slugs (`u2-smoke-${kind}-$$` or timestamp).
  4. For make two-cwd check: prefer parsing nested JSON (`impl`/`test` results) OR find both `~/.spine/worktrees/herdr-spine/<slug>` and `<slug>-test`.
- Do not weaken assertions to pass a broken impl — only fix harness lies.

## Parallel Work Notice

Ignore `bin/spine-spawn` and all other partitions. Board: `herdr-spine/verify-beat-port`, prefix `[U2]`.

## Tower

CLAIM then fix. `.done` last: `~/agent-core/briefs/verify-beat-port/.done/agnt-u2-test-maker-fix.done`. No commits.

## Tasks

1. Patch the suite per the four defects — done when: file updated; helpers preserve exit codes; ledger match works; make JSON reads stdout-only; unique make slugs.
2. Optionally smoke the refuse/mark/status/breakglass sections locally (SKIP_MAKE=1 is OK for your local smoke if make is too heavy) — done when: `.done` reports which sections you ran and exit codes.

## Constraints

- Touch ONLY `qa/u2-verify-beat-checks.sh` and your `.done` file.
- No mocks. No commits.

## Report back with

- Diff summary of harness fixes. Commands + exits from any local smoke. Provenance.
