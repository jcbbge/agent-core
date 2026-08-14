# PHASE2-WRITE-GATE-PROOF — live probe of the write-gate Stop hook

Slice C of ORCH `orch-write-gate`, unit `d-write-gate`. Agent: `agnt-wg-probe`.
All commands run from `/Users/jrg/agent-core` (branch `feat/tower-write-gate`)
so pheromone row `cwd` matches the `evt.cwd` fed to the hook.

## 1. Hook path and deploy symlink

Hook implementation: `primitives/mcps/tower/hooks/write-gate.mjs`
Deployed as: `~/.tower/hooks/write-gate.mjs`

```
$ ls -l ~/.tower/hooks/write-gate.mjs
lrwxr-xr-x@ 1 jrg  staff  64 Aug 14 13:36 /Users/jrg/.tower/hooks/write-gate.mjs -> /Users/jrg/agent-core/primitives/mcps/tower/hooks/write-gate.mjs
```

Symlink is live, pointing at the canonical hook file in this branch.

## 2. Environment used (reproducible)

```
export TOWER_FROM=agnt-wg-probe
export TOWER_SESSION_START=$(( $(date +%s) * 1000 - 60000 ))   # resolved to 1786732635000 for this run
export TOWER_WRITE_GATE_STATE=$(mktemp -d)/write-gate-state.json  # resolved to /var/folders/fc/v5cb_rpj1vdg60sx65sdrrjr0000gn/T/tmp.EDfrmYSMx3/write-gate-state.json
```

`TOWER_PHEROMONES_PATH` and `TOWER_BOARD_PATH` were deliberately left unset —
the probe emits real pheromone/board rows to the real `~/.tower/pheromones.jsonl`
and `~/.tower/board.jsonl`, scoped to the disposable topic
`tower/write-gate-probe`. No existing history in any `~/.tower/*.jsonl` was
rewritten or deleted.

## 3. The five operator steps — exact commands, ids, exit codes, stderr

### Step 1 — emit work-available

```
$ bun ~/.tower/cli.mjs emit work-available tower/write-gate-probe briefs/tower/substrate-harden/agnt-wg-probe.md --evidence "write-gate probe"
ph-mstaiiy8-mknh
```

id `A = ph-mstaiiy8-mknh`

### Step 2 — emit work-claimed, ref=A

```
$ bun ~/.tower/cli.mjs emit work-claimed tower/write-gate-probe x --ref ph-mstaiiy8-mknh --evidence "write-gate probe claim"
ph-mstaiozb-jqsx
```

id `C = ph-mstaiozb-jqsx`

### Step 3 — run the hook (session_id=probe-1) — expected exit 2

```
$ echo '{"cwd":"/Users/jrg/agent-core","session_id":"probe-1","stop_hook_active":false}' | bun ~/.tower/hooks/write-gate.mjs; echo "exit=$?"
[Tower write-gate] outstanding claim ref=ph-mstaiiy8-mknh topic=tower/write-gate-probe: run `bun ~/.tower/cli.mjs emit work-done tower/write-gate-probe x --ref ph-mstaiiy8-mknh` to release it.
exit=2
```

**Result: exit=2, as expected.** Stderr names the topic
(`tower/write-gate-probe`), the ref (`ph-mstaiiy8-mknh`, i.e. `A`), and a
runnable `cli.mjs emit work-done` line. The `payload_ref` used in the
suggested command is `x` — the claim row's own payload_ref (per the
contract's "claim row's payload_ref if present" clause), not the
work-available row's payload_ref or the `<artifact-path>` placeholder.

### Step 4 — emit work-done, ref=A, then re-run the hook — expected exit 0

```
$ bun ~/.tower/cli.mjs emit work-done tower/write-gate-probe briefs/tower/substrate-harden/agnt-wg-probe.md --ref ph-mstaiiy8-mknh --evidence "write-gate probe done"
ph-mstaizfy-3ubx

$ echo '{"cwd":"/Users/jrg/agent-core","session_id":"probe-1","stop_hook_active":false}' | bun ~/.tower/hooks/write-gate.mjs; echo "exit=$?"
exit=0
```

**Result: exit=0, as expected.** work-done id `ph-mstaizfy-3ubx` released
claim `A`; no stderr, no outstanding claims remain for session `probe-1`.

### Step 5 — fresh cycle (session_id=probe-2): claim, refuse, need-help, release

```
$ A2=$(bun ~/.tower/cli.mjs emit work-available tower/write-gate-probe briefs/tower/substrate-harden/agnt-wg-probe.md --evidence "write-gate probe cycle 2")
A2=ph-mstaj4u8-qnq8

$ C2=$(bun ~/.tower/cli.mjs emit work-claimed tower/write-gate-probe y --ref "$A2" --evidence "write-gate probe claim cycle 2")
C2=ph-mstaj4vx-v8wc

$ echo '{"cwd":"/Users/jrg/agent-core","session_id":"probe-2","stop_hook_active":false}' | bun ~/.tower/hooks/write-gate.mjs; echo "exit=$?"
[Tower write-gate] outstanding claim ref=ph-mstaj4u8-qnq8 topic=tower/write-gate-probe: run `bun ~/.tower/cli.mjs emit work-done tower/write-gate-probe y --ref ph-mstaj4u8-qnq8` to release it.
exit=2
```

**Result: exit=2, as expected.** New claim on `A2` correctly refused under
the fresh `session_id`.

```
$ bun ~/.tower/cli.mjs emit need-help tower/write-gate-probe --evidence "write-gate probe help"
ph-mstaj8he-sofx

$ echo '{"cwd":"/Users/jrg/agent-core","session_id":"probe-2","stop_hook_active":false}' | bun ~/.tower/hooks/write-gate.mjs; echo "exit=$?"
exit=0
```

**Result: exit=0, as expected.** A live `need-help` row (scoped, `from ===
identity`, same topic, unexpired TTL) released the claim on `A2` without a
`work-done` row.

### Verdict pattern

All five steps matched the expected 2/0/2/0 refusal pattern with no
deviations: step 3 → 2, step 4 → 0, step 5 (post-claim) → 2, step 5
(post-need-help) → 0. No mismatch was observed; the 30s claim TTL was never
implicated because the gate reads raw rows per R2 (TTL ignored for the
outstanding-claims scan), consistent with the pinned contract.

## 3.5. Oracle test suite

```
$ cd primitives/mcps/tower && bun test write-gate.test.mjs
bun test v1.3.14 (0d9b296a)

 12 pass
 0 fail
 24 expect() calls
Ran 12 tests across 1 file. [1.51s]
```

Green: 12 pass, 0 fail.

## 4. Honesty section (verbatim requirement)

The write-gate hook is **NOT registered** in `~/.claude/settings.json`. This
proof demonstrates the hook's contract when fed a hand-constructed Stop-event
JSON payload on stdin — it is not a live pane refusal captured from an actual
Claude Code session's Stop event. Nothing here should be read as evidence
that any running pane is currently gated by this hook; wiring it into
`~/.claude/settings.json` (or any harness's hook config) is a separate,
unperformed step.

## 5. Reproducibility

Any operator can re-run this probe from `/Users/jrg/agent-core` with:

```
export TOWER_FROM=agnt-wg-probe
export TOWER_SESSION_START=$(( $(date +%s) * 1000 - 60000 ))
export TOWER_WRITE_GATE_STATE=$(mktemp -d)/write-gate-state.json
```

then repeat the five commands in Section 3 above, substituting fresh `A`/`C`
ids as printed. `TOWER_PHEROMONES_PATH` and `TOWER_BOARD_PATH` are left at
their defaults; the probe topic `tower/write-gate-probe` is disposable and
safe to re-run against the real pheromone/board files.

## 6. Amendment (2026-08-14, CORD reopen) — suggested command made runnable

CORD verified that the refusal stderr's suggested `emit work-done` command
failed on paste: `emitPheromone` (`primitives/hooks/tower-ledger.mjs:161`)
requires non-empty `evidence`, and the suggestion omitted `--evidence`.
Fixed in `hooks/write-gate.mjs` (the suggestion now carries
`--evidence "released by write-gate"`); oracle test 10 extended to assert
`--evidence "<non-empty>"` in the stderr (no existing assertion weakened).
`bun test write-gate.test.mjs` → **12 pass / 0 fail, 25 expect() calls**.

Live re-probe under a fresh identity (`TOWER_FROM=orch-amend-probe`; a fresh
identity is required because the Section 3 identity's `need-help` row was
still live on this topic and correctly releases its claims):

```
$ A4=$(bun ~/.tower/cli.mjs emit work-available tower/write-gate-probe briefs/tower/substrate-harden/agnt-wg-probe.md --evidence "write-gate amend probe")
A4=ph-mstapg3r-rfxw
$ C4=$(bun ~/.tower/cli.mjs emit work-claimed tower/write-gate-probe amend --ref "$A4" --evidence "write-gate amend claim")
C4=ph-mstapg5b-4ue6

$ echo '{"cwd":"/Users/jrg/agent-core","session_id":"probe-amend","stop_hook_active":false}' | bun ~/.tower/hooks/write-gate.mjs; echo "exit=$?"
[Tower write-gate] outstanding claim ref=ph-mstapg3r-rfxw topic=tower/write-gate-probe: run `bun ~/.tower/cli.mjs emit work-done tower/write-gate-probe amend --ref ph-mstapg3r-rfxw --evidence "released by write-gate"` to release it.
exit=2
```

The suggested command, pasted verbatim, now succeeds and releases the claim:

```
$ bun ~/.tower/cli.mjs emit work-done tower/write-gate-probe amend --ref ph-mstapg3r-rfxw --evidence "released by write-gate"
ph-mstapltk-unww
exit=0

$ echo '{"cwd":"/Users/jrg/agent-core","session_id":"probe-amend","stop_hook_active":false}' | bun ~/.tower/hooks/write-gate.mjs; echo "exit=$?"
exit=0
```
