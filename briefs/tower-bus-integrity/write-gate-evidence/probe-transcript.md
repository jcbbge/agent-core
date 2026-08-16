# Write-Gate Probe Transcript (2026-08-16)

## Environment Setup

```
TOWER_SESSION_START=1786904048000 (ms epoch)
TOWER_WRITE_GATE_STATE=/var/folders/fc/v5cb_rpj1vdg60sx65sdrrjr0000gn/T/tmp.rqyTI9pTqY/write-gate-state.json
PROBE_TOPIC=tower/write-gate-probe-20260816
TOWER_FROM=agnt-wg-probe-20260816
```

Work-available id (A): `ph-msw4kmc2-zpaw`
Work-claimed id (C): `ph-msw4kmgs-lx3g`

## Case 1: Outstanding Obligation (expect exit 2)

**Command:**
```bash
echo '{"cwd":"/Users/jrg/agent-core","session_id":"probe-c1","stop_hook_active":false}' \
  | bun ~/.tower/hooks/write-gate.mjs
```

**Environment:**
- All probe environment variables set as above
- No kill switch (TOWER_WRITE_GATE not set)

**Exit code:** 2

**Stdout:**
(empty)

**Stderr:**
```
[Tower write-gate] outstanding claim ref=ph-msw4kmc2-zpaw topic=tower/write-gate-probe-20260816: run `bun ~/.tower/cli.mjs emit work-done tower/write-gate-probe-20260816 briefs/tower-bus-integrity/AGNT-write-gate-probe.md --ref ph-msw4kmc2-zpaw --evidence "released by write-gate"` to release it.
```

**Note:** The ref in stderr is the work-available id (A), not the work-claimed id (C).

## Case 2: Obligation Discharged with --ref A (expect exit 0)

**Release command:**
```bash
bun ~/.tower/cli.mjs emit work-done tower/write-gate-probe-20260816 briefs/tower-bus-integrity/AGNT-write-gate-probe.md --ref ph-msw4kmc2-zpaw --evidence "write-gate probe release"
```

Released with: `--ref ph-msw4kmc2-zpaw` (the work-available id, A)

**Hook command (after release):**
```bash
echo '{"cwd":"/Users/jrg/agent-core","session_id":"probe-c2","stop_hook_active":false}' \
  | bun ~/.tower/hooks/write-gate.mjs
```

**Exit code:** 0

**Stdout:**
(empty)

**Stderr:**
(empty)

## Case 3: Kill Switch (expect exit 0 with TOWER_WRITE_GATE=off)

**Setup - Fresh claim:**
```bash
A2=$(bun ~/.tower/cli.mjs emit work-available tower/write-gate-probe-20260816 briefs/tower-bus-integrity/AGNT-write-gate-probe.md --evidence "write-gate probe c3")
C2=$(bun ~/.tower/cli.mjs emit work-claimed tower/write-gate-probe-20260816 briefs/tower-bus-integrity/AGNT-write-gate-probe.md --ref $A2 --evidence "write-gate probe claim c3")
```

New work-available: `ph-msw4kzz7-zpje`
New work-claimed: `ph-msw4l00w-jtfs`

**Kill switch test command:**
```bash
export TOWER_WRITE_GATE=off
echo '{"cwd":"/Users/jrg/agent-core","session_id":"probe-c3","stop_hook_active":false}' \
  | bun ~/.tower/hooks/write-gate.mjs
```

**Exit code:** 0

**Stdout:**
(empty)

**Stderr:**
(empty)

### Case 3 Control: Same claim, WITHOUT kill switch (expect exit 2)

**Command:**
```bash
echo '{"cwd":"/Users/jrg/agent-core","session_id":"probe-c3-control","stop_hook_active":false}' \
  | bun ~/.tower/hooks/write-gate.mjs
```

(Kill switch not set; same outstanding claim from case 3 setup)

**Exit code:** 2

**Stdout:**
(empty)

**Stderr:**
```
[Tower write-gate] outstanding claim ref=ph-msw4kzz7-zpje topic=tower/write-gate-probe-20260816: run `bun ~/.tower/cli.mjs emit work-done tower/write-gate-probe-20260816 briefs/tower-bus-integrity/AGNT-write-gate-probe.md --ref ph-msw4kzz7-zpje --evidence "released by write-gate"` to release it.
```

## Case 4: stop_hook_active=true (expect exit 0)

**Command:**
```bash
echo '{"cwd":"/Users/jrg/agent-core","session_id":"probe-c4","stop_hook_active":true}' \
  | bun ~/.tower/hooks/write-gate.mjs
```

(Same outstanding claim from case 3 still active)

**Exit code:** 0

**Stdout:**
(empty)

**Stderr:**
(empty)

## Case 5a: Unparseable stdin - not JSON (expect exit 0)

**Command:**
```bash
echo 'not json at all' \
  | bun ~/.tower/hooks/write-gate.mjs
```

**Exit code:** 0

**Stdout:**
(empty)

**Stderr:**
(empty)

## Case 5b: Unparseable stdin - empty (expect exit 0)

**Command:**
```bash
echo -n '' \
  | bun ~/.tower/hooks/write-gate.mjs
```

**Exit code:** 0

**Stdout:**
(empty)

**Stderr:**
(empty)

## Case 6: Identity unbound (expect exit 0)

**Command:**
```bash
echo '{"cwd":"/Users/jrg/agent-core","session_id":"probe-c6","stop_hook_active":false}' \
  | env -u TOWER_FROM -u HERDR_PANE_ID \
    bun ~/.tower/hooks/write-gate.mjs
```

(Same outstanding claim from case 3 still active; TOWER_FROM and HERDR_PANE_ID removed from environment)

**Exit code:** 0

**Stdout:**
(empty)

**Stderr:**
(empty)

## Cleanup

Released case 3's outstanding claim with:
```bash
bun ~/.tower/cli.mjs emit work-done tower/write-gate-probe-20260816 briefs/tower-bus-integrity/AGNT-write-gate-probe.md --ref ph-msw4kzz7-zpje --evidence "write-gate probe cleanup"
```

All outstanding claims have been released. No live obligations remain on the bus.
