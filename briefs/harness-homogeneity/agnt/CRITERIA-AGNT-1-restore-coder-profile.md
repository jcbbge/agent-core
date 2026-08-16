# Test criteria — AGNT-1 restore-coder-profile

Authored by `ORCH [doctrine-parity]` BEFORE implementation, 2026-08-16.
The unit is a doctrine file, so the oracle is mechanical text comparison, not
a runtime suite. Every criterion below is a command with a stated expected
result, runnable by anyone against the artifact.

Let `C` = the produced `profiles/coder.md`.
Let `A` = `~/agent-core/primitives/profiles/coder.md`.

## C1 — the stigmergy section is byte-identical to agent-core's

```
sed -n '/^## Stigmergic coordination/,/^and `… field`\.$/p' A | wc -l   # expect 22
sed -n '/^## Stigmergic coordination/,/^and `… field`\.$/p' C | wc -l   # expect 22
diff <(sed -n '/^## Stigmergic coordination/,/^and `… field`\.$/p' A) \
     <(sed -n '/^## Stigmergic coordination/,/^and `… field`\.$/p' C)   # expect EMPTY
```

Both extractions must be non-empty and 22 lines. A diff of two empty
extractions is a FAIL, not a pass — the extraction proof is part of the
criterion.

## C2 — the spine bullet is present

```
grep -c 'spine-claim'  C   # expect >= 1
grep -c 'spine-report' C   # expect >= 1
```

## C3 — the isolation wall survives in full

Each of these five propositions must be findable in `C`, in substance:

1. the Plan->Implementation path bifurcates on purpose, into independent
   divergent paths, as a check-and-balance;
2. an implementer who can read the tests will game them;
3. does NOT write its own tests (test-maker does, in parallel, from the plan);
4. does NOT run them (tester) and does NOT judge its own failures (arbiter);
5. builds from the PLAN, never the suite — under `cursor-fleet make` the tests
   are physically absent from the checkout, and must not be sought,
   reconstructed, or requested from a peer.

Evidence required: each proposition quoted from `C` with its line number.
A count of bullets is NOT evidence.

## C4 — the shim's own law survives

`C` still contains the arbiter-routing rule (fix the code, not the test, and
hand back to the tester) and the nQ escalation rule, and a
`## Done looks like` section.

## C5 — the header explains inheritance and the sync hazard

`C`'s header note (a) says why a shim override exists, (b) names
`~/agent-core/primitives/profiles/coder.md` as the source it inherits from
verbatim, and (c) warns that the stigmergy section is a COPY that must be kept
in sync until file-precedence is replaced by composition (PLAN Phase 5).

## C6 — no provider, model, or `--kind` leakage

```
grep -niE 'claude|cursor-agent|gpt|opus|sonnet|--kind' C
```

Any hit must be justified in the report. The word "cursor" naming the shim or
`cursor-fleet` is legitimate; a provider or model name is not.

## C7 — nothing else in the repo moved

```
git -C <worktree> status --porcelain   # expect only profiles/coder.md and the .done marker
```

## C8 — no commit

`git -C <worktree> log --oneline -1` is unchanged from the branch point. The
AGNT does not commit; the ORCH integrates.
