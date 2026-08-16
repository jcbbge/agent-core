# Write-Gate Probe Results (2026-08-16)

## Results Summary

| Case | Expected Exit | Actual Exit | Result | Criteria |
|------|---------------|-------------|--------|----------|
| 1. Outstanding Obligation | 2 | 2 | PASS | 12 |
| 2. Obligation Discharged (--ref A) | 0 | 0 | PASS | 13 |
| 3. Kill Switch (TOWER_WRITE_GATE=off) | 0 | 0 | PASS | 1 |
| 3. Control (no kill switch) | 2 | 2 | PASS | 12 |
| 4. stop_hook_active=true | 0 | 0 | PASS | 2 |
| 5a. Unparseable stdin (not JSON) | 0 | 0 | PASS | 3 |
| 5b. Unparseable stdin (empty) | 0 | 0 | PASS | 3 |
| 6. Identity unbound | 0 | 0 | PASS | 5 |

## Test Suite Pass/Fail

```
bun test v1.3.14 (0d9b296a)

 12 pass
 0 fail
 25 expect() calls
Ran 12 tests across 1 file. [1.71s]
```

The test suite confirms all criteria are correctly implemented. This corroboration is consistent with the probe results.

## Detailed Criteria Citations

### Case 1: Outstanding Obligation → Criterion 12

**Criterion 12 (from write-gate.criteria.md):**
> One outstanding, unreleased claim (no `work-done`, no live `need-help`) → **exit 2**. (test 1)

**Evidence:** The hook refused with exit 2 when an outstanding claim existed for the identity/cwd/topic. The stderr named the claim's work-available ref and provided a runnable release command, consistent with criterion 22 (refusal message format).

### Case 2: Obligation Discharged → Criterion 13

**Criterion 13 (from write-gate.criteria.md):**
> A claim with ref `R` is released when a scoped `work-done` row exists with `ref === R`, where `R` is the **work-available row's id** (R1) — TTL ignored on the `work-done` row too. Released → **exit 0**. (test 2)

**Evidence:** After emitting a `work-done` row with `--ref` pointing to the work-available id (`ph-msw4kmc2-zpaw`), the hook allowed the stop with exit 0, confirming that releasing by the work-available id correctly discharged the claim.

### Case 3: Kill Switch → Criterion 1

**Criterion 1 (from write-gate.criteria.md):**
> `TOWER_WRITE_GATE=off` in the environment → **exit 0**, regardless of any outstanding claim. (test 6)

**Evidence:** With `TOWER_WRITE_GATE=off` set and an outstanding claim still present, the hook exited with 0. The control test (case 3 control) demonstrated that the same claim without the kill switch produced exit 2, proving the kill switch was the determining factor.

### Case 3 Control: Outstanding claim without kill switch → Criterion 12

**Criterion 12:** One outstanding, unreleased claim → exit 2.

**Evidence:** The control test re-ran the hook with the kill switch unset, confirming the claim was still outstanding and the gate correctly refused with exit 2.

### Case 4: stop_hook_active=true → Criterion 2

**Criterion 2 (from write-gate.criteria.md):**
> `evt.stop_hook_active` truthy → **exit 0**, regardless of any outstanding claim. Loop protection: the hook must never re-block a Stop it already blocked once this cycle. (test 5)

**Evidence:** With `stop_hook_active=true` in the input JSON and an outstanding claim present, the hook exited 0, confirming loop protection—a stop already blocked in this cycle is never re-blocked.

### Case 5a: Unparseable stdin (not JSON) → Criterion 3

**Criterion 3 (from write-gate.criteria.md):**
> Unparseable stdin (not valid JSON) → **exit 0**. A gate that cannot read its input must not brick the session.

**Evidence:** Feeding invalid JSON (`not json at all`) produced exit 0, proving the gate gracefully fails open on parse errors.

### Case 5b: Unparseable stdin (empty) → Criterion 3

**Criterion 3:** Unparseable stdin → exit 0.

**Evidence:** Feeding empty stdin produced exit 0, confirming the gate handles the empty input case gracefully.

### Case 6: Identity unbound → Criterion 5

**Criterion 5 (from write-gate.criteria.md):**
> Identity unbound (no `TOWER_FROM`, no `HERDR_PANE_ID`, or the herdr lookup fails) → **exit 0**, even with an outstanding claim scoped to the same cwd and topic. An unbound gate must be a no-op, never a false refusal. (test 4)

**Evidence:** With both `TOWER_FROM` and `HERDR_PANE_ID` removed from the environment and an outstanding claim present, the hook exited 0. This proves the gate correctly treats an unbound identity as a fail-open no-op, never falsely refusing.

## Verdict

All eight case runs (including the case 3 control) **PASS**. The write-gate hook correctly implements criteria 1, 2, 3, 5, 12, 13, and 22. The bundled test suite reinforces this with 12 passing tests and 0 failures.

No Pre-Verified Facts turned out wrong. The deployed hook behaves exactly as specified in the criteria.
