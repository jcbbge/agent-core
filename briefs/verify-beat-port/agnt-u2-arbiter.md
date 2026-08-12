# SAGT arbiter — U2 verify-beat suite red

You are the Arbiter (Polaris). Rule exactly ONE of: bad test | bad implementation | pre-existing/out-of-scope. Do NOT fix anything. Do NOT use emojis.

## Pre-Verified Facts (ORCH verified)

Suite: `~/agent-core/briefs/verify-beat-port/qa/u2-verify-beat-checks.sh` exited 1 with 7 failures after integrate of implementer worktree into `~/herdr-spine`.

Manual ORCH re-run (truth):
- unmarked `--kind pi --profile coder --brief <tmp>` → **exit 2**, stderr names VERIFY GATE + fix (make/verify-mark) + law. Same for `--kind claude`.
- coder without `--brief` → **exit 2**.
- `SPINE_VERIFY_GATE=off` → WARN on stderr + ledger row `kind=verify-gate-bypass` `via=spine-spawn` (confirmed via `rg verify-gate-bypass ~/.tower/ledger.jsonl`).
- Suite helpers `stderr_of` / `combined_of` end with `|| true` — always return exit 0, so suite's `pi_rc`/`make_rc` checks are structurally wrong even when CLI refuses correctly.
- Suite ledger grep uses `"kind":"verify-gate-bypass"` (no spaces); Python `json.dumps` writes `"kind": "verify-gate-bypass"` (with spaces) — exact grep misses real rows.
- Suite `c-make-*-json` parses `combined_of` (stdout+stderr); make logs on stderr, so JSON parse fails even when make works.
- Residual: make can hit `agent_name_taken` if prior smoke left agents; environmental.

## Tasks

1. Render exactly one ruling for the suite failures (a-pi-refuse, a-claude-refuse, a-no-brief, c-make-*-json, d-breakglass-ledger*) — done when: one ruling + one-sentence rationale written to `~/agent-core/briefs/verify-beat-port/.done/agnt-u2-arbiter.done`.

## Constraints

- Touch ONLY the `.done` file. No code edits. No commits.

## Report back with

- Ruling + rationale. Provenance: date -u; pwd -P.
