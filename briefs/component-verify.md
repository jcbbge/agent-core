# BRIEF/SPEC — component-verify: the drop-in acceptance suite for agent-core

Operator mandate (2026-08-12, verbatim intent): *"pick a component, point the
test suite at it, verify — does it work as expected? If I add any new
components, I need to build the accompanying test suite: what it is, what
it's supposed to do, how do we verify, how do we test, how do we measure its
effectiveness. Drop in. Wire up test suite. Verify. If it's a binary, same
principle."*

This document is both the standing spec and a spawn-ready implementation
brief. Model tier: sonnet (spec-complete; judgment already made here).

## The one idea

Every component in agent-core carries a machine-readable **verify manifest**
answering five questions, and one runner —
`~/agent-core/primitives/tools/component-verify/verify.ts` (bun) — executes
any manifest and answers PASS/FAIL per contract line. Adding a component
without a manifest is drift, and the runner's `--coverage` mode makes that
drift visible the same way `agent-core status` makes deploy drift visible.

## The manifest — `VERIFY.toml`, colocated with the component

```toml
[component]
id = "tool/slim"                  # registry id, or tool/bin path for binaries
kind = "binary"                   # binary | skill | hook | extension | mcp | rule-doc
what = "6-verb shell-output compactor"
# WHAT IT'S SUPPOSED TO DO — one contract line per guarantee, plain language.
contract = [
  "child exit codes propagate unchanged",
  "unparseable output passes through raw",
  "truncation is always marked",
]

# HOW WE VERIFY — one oracle per contract line, index-matched.
# exit 0 = holds. Any other exit = violated. Oracles run from `cwd`.
[[oracle]]
run = "test/truth-law.sh exit-codes"
[[oracle]]
run = "test/truth-law.sh raw-passthrough"
[[oracle]]
run = "test/truth-law.sh truncation-marked"

# HOW WE TEST — the full suite (superset of oracles; may be slow).
[suite]
run = "zig build test && test/acceptance.sh"

# HOW WE MEASURE EFFECTIVENESS — is it WORTH having, not just working.
# Numbers with a collection command; instruments: vein (behavior corpus),
# odometer (token burn), assay (memory propagation), or component-specific.
[[metric]]
name = "context-reduction-pct"
run = "vein compact-savings --tool slim"     # prints a number
expect = ">= 40"
```

Field semantics:
- `contract` — testable sentences. If a guarantee can't be phrased as a
  sentence with an oracle, it isn't a guarantee; delete it or fix the design.
- `oracle` — cheap, deterministic, exit-code-truth (the slim law applies to
  the verifier too: no oracle may swallow its child's failure).
- `suite` — what CI/pre-commit runs; oracles must be a subset so "quick
  verify" and "full test" can never disagree on direction.
- `metric` — effectiveness, distinct from correctness. Optional for pure
  adapters; mandatory for anything justified by a benefit claim (compaction,
  memory, cost). `expect` uses `>= <= == !=` against the command's last line.

## Kind templates (what "does it work as expected" means per kind)

| kind | mandatory oracle shape |
|---|---|
| `binary` | invoke with fixture stdin/args; assert exit code + output shape; truth-law checks (exit propagation, no silent truncation) |
| `skill` | deployed-tree byte parity vs canonical on every registered harness (`agent-core status` row green); frontmatter parses; description states its trigger |
| `hook` (CC/cursor) | fire with synthetic event JSON on stdin; assert output contract (e.g. `additional_context` present; exit 0 on garbage input — a recorder never blocks) |
| `extension` (pi) | `bun -e "await import('<shim>')"` exits 0; handler invoked with fake `pi`/`ctx` produces the documented injection shape exactly once |
| `mcp` | server boots on stdio; `tools/list` returns the documented tool names |
| `rule-doc` | every path/command the doc cites exists/runs (the doc-rot oracle) |

Precedents to lift from (all in-repo, all green today): cli
`test/integration/skilldir_acceptance.sh` (11-case oracle, live-mode),
`primitives/tools/vein/test/acceptance/` (corpus CSVs), assay's golden set +
decoy-FP honesty metric, cursor-shim `docs/qa-verify.sh` (71/71), and this
session's marker control test (positive + negative control — the standard for
"proves injection" claims).

## The runner

```
component-verify <id>            # resolve VERIFY.toml, run oracles, report per contract line
component-verify <id> --suite    # full suite
component-verify <id> --metrics  # effectiveness numbers vs expectations
component-verify --all           # every manifest, summary table
component-verify --coverage      # registry ids without a manifest = the drift list
```

Output: one line per contract sentence — `PASS/FAIL <id> :: <sentence>` —
then a summary count. Exit 0 only if every oracle passed. No color required;
no prose required. A FAIL prints the oracle's tail (last 20 lines).

## Pre-Verified Facts (for the implementing agent)

- Registry: `~/.agent-core/registry`, grammar `primitive <id> / source / deploy / end`; parse precedent in `cli/src/registry.zig`.
- Runner home: `~/agent-core/primitives/tools/component-verify/` (new). bun + TypeScript; TOML via `Bun.TOML.parse` (verify availability; fallback: a 40-line parser is acceptable, manifests use a flat subset).
- `agent-core` binary: `~/agent-core/cli/zig-out/bin/agent-core` (status/sync green today: 214 ok / 0 stale / 0 missing).
- Existing suites to wrap as first manifests, in order: `tool/slim` (truth-law tests exist), `tool/cli` (skilldir_acceptance.sh), `hook/session-boundary-cursor` (stdin JSON → additional_context, evidence pattern in this session's transcript), `extension/session-boundary-pi` (import + fired-once check exists), `tool/vein` (acceptance CSVs).
- vein: `~/.local/bin/vein`; odometer: `bun ~/.claude/tower/cli.mjs burn`.

## Tasks (done-when)

1. Runner v1 (`verify.ts` + `component-verify` wrapper in `~/.local/bin`) —
   done when: `component-verify tool/slim` runs slim's oracles and exits 0,
   and a deliberately broken oracle exits non-zero with the tail shown.
2. Five founding manifests (list above) — done when: `component-verify --all`
   shows 5 components, all PASS.
3. `--coverage` — done when: it lists exactly the registered ids lacking
   manifests, and that list is committed as the burn-down file
   (`briefs/component-verify.coverage.txt`).
4. Doctrine hook — add one line to `primitives/HARNESS-PARITY.md` §Doctrine:
   new component = manifest + oracles BEFORE registration; and one line to
   the registry header. Done when: both lines present.
5. Acceptance for the runner itself (`test/acceptance.sh`, eating its own
   food: a VERIFY.toml for component-verify) — done when: green.

## Tower
Post CLAIM to board topic `agent-core/component-verify` before writing;
findings for anything the Pre-Verified Facts got wrong; `.done` marker last.

## Report back with
Per-task done-when evidence (commands + tails), files created, the coverage
burn-down count, deviations with reasons.
