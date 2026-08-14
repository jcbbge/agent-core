# Test criteria — Tower write gate (d-write-gate, slice B1)

Authored by test-maker (`agnt-wg-criteria`) from the ORCH-pinned brief
(`briefs/tower/substrate-harden/agnt-wg-criteria.md`) — Gate contract section
— only. Never from an implementation, because
`hooks/write-gate.mjs` does not exist yet. Tests live in
`write-gate.test.mjs`; the tester runs them, test-maker does not.

Hook under test: `primitives/mcps/tower/hooks/write-gate.mjs`, a Stop-event
hook invoked as a subprocess (`bun hooks/write-gate.mjs`) reading one JSON
object on stdin (`{cwd, session_id, stop_hook_active, transcript_path}`).
Exit 0 = allow the stop. Exit 2 = refuse (reasons on stderr).

## Kill switch and loop protection

1. `TOWER_WRITE_GATE=off` in the environment → **exit 0**, regardless of any
   outstanding claim. (test 6)
2. `evt.stop_hook_active` truthy → **exit 0**, regardless of any outstanding
   claim. Loop protection: the hook must never re-block a Stop it already
   blocked once this cycle. (test 5)
3. Unparseable stdin (not valid JSON) → **exit 0**. A gate that cannot read
   its input must not brick the session.

## Identity binding (R3)

4. Identity resolves from `$TOWER_FROM` (trimmed, non-empty) first. If unset,
   and `$HERDR_PANE_ID` is set, identity resolves from
   `herdr agent get "$HERDR_PANE_ID"` → `.result.agent.name`; any error in
   that lookup leaves identity unbound.
5. Identity unbound (no `TOWER_FROM`, no `HERDR_PANE_ID`, or the herdr lookup
   fails) → **exit 0**, even with an outstanding claim scoped to the same cwd
   and topic. An unbound gate must be a no-op, never a false refusal.
   (test 4)

## Time floor (R3)

6. The time floor (epoch ms) is `$TOWER_SESSION_START` if numeric, else the
   birthtime (falling back to mtime) of `evt.transcript_path` if that file
   exists, else indeterminable.
7. Indeterminable time floor → **exit 0** (never brick).
8. A claim row with `ts` strictly before the time floor is NOT outstanding
   for gate purposes → **exit 0**, even though the claim is otherwise
   unreleased. (test 7)

## Claim scoping and the TTL-ignored rule (R2)

9. Pheromone rows are scoped to `normCwd(row.cwd) === normCwd(evt.cwd ??
   process.cwd())` before any claim/release logic runs.
10. Outstanding claims are scoped rows with `scent === "work-claimed"`,
    `from === identity`, non-null `ref`, and `ts >= floor` — deduped by
    `ref`. The claim's own `ttl_s` (default 30s) is IGNORED for this
    determination: a claim that is TTL-expired by field-derivation rules is
    still outstanding for the gate. (test 11 — ts 60s old, ttl_s 30, still
    inside the time floor → exit 2)
11. A claim row whose `from` does not equal identity is not this identity's
    outstanding claim → **exit 0** even if otherwise unreleased. (test 8)
12. One outstanding, unreleased claim (no `work-done`, no live `need-help`)
    → **exit 2**. (test 1)

## Release conditions (R1)

13. A claim with ref `R` is released when a scoped `work-done` row exists
    with `ref === R`, where `R` is the **work-available row's id** (R1) —
    TTL ignored on the `work-done` row too. Released → **exit 0**.
    (test 2)
14. A `work-done` row whose `ref` equals the **claim row's own id** (not the
    work-available id it claims) does NOT release the claim → **exit 2**.
    (test 12 — this is the R1 misconception the gate must not have)
15. A claim with ref `R` on topic `T` is also released when a live (per
    `ttl_s`, default 3600s) `need-help` row exists, scoped, with
    `from === identity` and `topic === T` → **exit 0**. (test 3)
16. No outstanding claims, or every outstanding claim released → **exit 0**.
    (covered by tests 2, 3)

## Refusal counting and audited bypass (R4)

17. State is tracked in `$TOWER_WRITE_GATE_STATE` (else
    `~/.tower/write-gate-state.json`), a JSON object keyed
    `"<session_id>:<ref>"` (session_id := `evt.session_id ?? "unknown"`),
    value `{count, bypassed}`.
18. First refusal for a given `(session_id, ref)`: `count` goes 0→1, exit 2.
19. Second and third refusal: `count` goes 1→2 and 2→3, exit 2 each time.
20. Fourth refusal (once every unreleased ref for this call already has
    `count >= 3`): for each such ref not yet `bypassed`, append exactly ONE
    board note to `$TOWER_BOARD_PATH` (else lib `BOARD`) shaped
    `{id, ts, cwd, type:"note", from:"write-gate", topic:"tower/write-gate",
    body:"bypass: agent=<identity> ref=<R> session=<session_id> after 3
    refusals"}`, mark that ref `bypassed: true`, and **exit 0**.
21. A fifth call against the same already-bypassed `(session_id, ref)` →
    **exit 0**, and does NOT append a second bypass note (idempotent past
    bypass). (tests 9 combines 18-21: runs 1-3 exit 2, run 4 exits 0 with
    exactly one bypass-body board line, run 5 exits 0 with no new line)
22. On every refusal (exit 2), stderr contains, per unreleased ref: the
    claim's topic, the ref id, and a runnable line containing
    `cli.mjs emit work-done <topic> <payload_ref> --ref <R>` (payload_ref
    from the claim row if present, else the literal placeholder
    `<artifact-path>`). (test 10)

## Fail-open guarantee

23. Any internal error during evaluation (steps 4-22) → **exit 0**. A gate
    that bricks the machine is a failed gate. (not independently asserted as
    a dedicated test in this slice — steps 3, 5, 7 are the concrete
    fail-open cases exercised; general internal-error fail-open is
    implementation-proof territory, noted here so the coder proof addresses
    it explicitly)

## Test-to-criterion map

| Test # | Exercises criteria |
|---|---|
| 1 | 12 |
| 2 | 13 |
| 3 | 15 |
| 4 | 5 |
| 5 | 2 |
| 6 | 1 |
| 7 | 6-8 |
| 8 | 11 |
| 9 | 17-21 |
| 10 | 22 |
| 11 | 10 |
| 12 | 14 |

## Out of scope for test-maker oracle (coder / human proof)

| Item | Owner |
|---|---|
| General internal-error fail-open (criterion 23, beyond the concrete cases in tests 4/5/6/7) | Coder documents in proof |
| Live `herdr agent get` identity resolution against a real pane | Coder/integration proof — this oracle only exercises the unbound path (no `HERDR_PANE_ID` set) |
| Lock/concurrency behavior of the refusal-count state file under simultaneous Stop hooks | DEFERRED — not tested here |

## Run command (tester, not test-maker)

```bash
cd /Users/jrg/agent-core/primitives/mcps/tower && bun test write-gate.test.mjs
```

Expected result while `hooks/write-gate.mjs` does not exist: the run
**fails** (spawn/exit-code mismatches) — that failure is the point of this
slice. Once B2 lands the implementation, the same suite is expected to pass
unmodified.
