# Test criteria — AGNT-3 cursor-directive-truth

Authored by `ORCH [doctrine-parity]` BEFORE implementation, 2026-08-16.
The unit is one canonical directive file that is composed into a deployed
entrypoint, so the oracle is truth-checking against a named proof artifact.

Let `D` = the produced `primitives/directives/cursor.md`.
Let `P` = `~/agent-core/briefs/harness-homogeneity/PROOF-cursor-spawn.md`.

## C1 — the edit rests on a real proof

The report quotes a literal line from `P` showing an observed `agent_status`
transition to `working`, with its line number in `P`. A third party can open
`P` at that line and see the same string.

**If `P` contains no such line, the PASS condition is that `D` is
UNMODIFIED** and a finding says why. An edit made on an unproven proof is a
FAIL even if the resulting text happens to be true.

## C2 — the false parenthetical is gone

```
sed -n '10,11p' D
```
does not assert that `spine-spawn --kind cursor` is not the spawn path.

## C3 — the replacement is not a new ambiguity

The new `:10-11` text must satisfy all three simultaneously, checkable by
reading it alone:

1. it names the spine path the proof establishes;
2. it does not read as though `cursor-fleet` / `cursor-spine` were retired —
   they are not, and `rules/cursor-fleet.md:162-178` plus the `cursor-fleet
   make` Verify beat are current law;
3. a reader can tell **which path to use when** without opening another file.

Deleting the parenthetical and stopping is a FAIL against (3).

## C4 — collateral falsehood was actually checked

The report carries a clause-by-clause table for the whole 16-line file:
composed-entrypoint/sync, hooks, MCP, tool skills, fleet spawn,
briefs-name-profiles-only, `cursor-fleet make` Verify beat, daily entry, repo
rule. Each row: still-true, or corrected with the correction quoted.
A blanket "nothing else changed" is a FAIL.

## C5 — no model or provider leakage

```
grep -niE 'gpt|opus|sonnet|claude|cursor-agent' D
```
Every hit justified in the report. The harness name is legitimate in this
file; a model or provider name is not.

## C6 — partition and no-commit

```
git -C <worktree> status --porcelain     # only primitives/directives/cursor.md + .done marker
git -C <worktree> log --oneline -1       # unchanged from branch point
git -C ~/cursor-shim status --porcelain  # nothing caused by this agent
```

## C7 — the sync is named, not run

`agent-core sync --harness cursor` appears in the report as the deployment
step. No `agent-core sync` invocation appears in the transcript. Deployment is
the ORCH's decision.
