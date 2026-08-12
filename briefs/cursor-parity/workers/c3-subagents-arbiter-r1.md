# C3-subagents Arbiter — nQ round 1/3 on T-C3-AG-NO-PI

> From: orch-c3-parity, 2026-08-12. You are the ARBITER (Polaris). Rule ONLY: bad-test vs bad-implementation. Do NOT fix anything. Prescribe the next step for coder or test-maker.

## The Q

Criterion **T-C3-AG-NO-PI** failed in authoritative run (7 passed, 1 failed).

Evidence file: `briefs/cursor-parity/c3-subagents-tester-results.md`

Raw failure:
```
PASS: T-C3-AG-NO-PI: pi without agents field does not map agents/foo
  - pi           (no mapping for this type)
FAIL: T-C3-AG-NO-PI: status should omit pi deploy line when agents field absent
```

So: sync correctly reports no mapping. Status still prints a pi line with `(no mapping for this type)`.

## Design / brief (binding)

From `briefs/cursor-parity/workers/c3-subagents.md` acceptance table:

| T-C3-AG-NO-PI | agents/foo with only pi deploy and no agents field → skip/no mapping (or omit pi). |

Note the parenthetical **or omit pi** — both outcomes were authorized.

Reconciliation: pi = N/A for subagents (herdr/profiles). Live registry does not deploy agents/* to pi.

## What to read (this session)

1. The failing assertion in `/Users/jrg/agent-core/cli/test/integration/c3_subagents_acceptance.sh` (search T-C3-AG-NO-PI).
2. How `cli/src/status.zig` renders no-mapping / unsupported deploys (existing pattern).
3. Brief criterion wording above.

## Ruling format

Post ONE finding to `agent-core/cursor-parity` from `agnt-c3-subagents-arbiter` → orch-c3-parity:

- RULING: BAD TEST | BAD IMPLEMENTATION
- Evidence (file:line citations)
- Prescribed next step (exact: who does what)
- Touch `.done/c3-subagents-arbiter-r1.done`

Do not edit code or tests.
