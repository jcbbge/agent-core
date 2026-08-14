# W3 plane fixes (F1 / F9 / F4) — FINAL

**ORCH:** w3-plane-fixes (w2Y:p8)  
**Date:** 2026-08-13  
**Base / main HEAD:** `1c8353dbc99925e2152f7664b7a16ab029814440`  
**Integration worktree:** `/Users/jrg/.spine/worktrees/agent-core/w3-plane-fixes` (`orch/w3-plane-fixes`)  
**Land state:** patched on main working tree (uncommitted). Do not push. CORD lands.

## Verdict

| Defect | Verdict | Evidence |
|--------|---------|----------|
| F1 `to:operator` on deliverable/alert | **CLOSED** | live probe + tests |
| F9 CLI `board <topic>` filter | **CLOSED** | live 53 vs 12 + tests |
| F4 `mark_relayed` refuse non-unrelayed | **CLOSED** | live refuse + tests |

**Unit (F1/F9/F4):** **GO**  
**Exercise-axis fully-operational:** **NO-GO** until W4 (and W5) close per `CORD-SCOPE-2026-08-13.md`. These three plane defects are no longer the blocker.

## Before → after

| Check | Before | After |
|-------|--------|-------|
| F9 `board` vs `board tower/w3-plane-fixes` | 53 / 53 byte-identical | 53 / 12 differ |
| F1 deliverable in unrelayed | no (`to` missing) | yes (`to:"operator"`) |
| F4 `mark_relayed` arbitrary id | silent ack | refuse, no ack |

## Live probe ids

- F1 deliverable: `t-msroj4at-0ona` (`to:operator`, entered unrelayed, then acked)
- F1 progress: message `LIVE-PROBE F1 progress…` — not in unrelayed
- F4 refuse: `t-not-a-real-unrelayed-id` → tool error Refused mark_relayed
- Prior test probes (also `to:operator`): `t-msro2cs7-rqxl`, `t-msro2dn3-dmlu`, `t-msro2f1l-7i5e` (cleaned)

Raw: `after/live-f1-f4.json`, `raw/live-f1-f4-probe.mjs`

## Tests (ORCH-run on main after integrate)

```
cd primitives/mcps/tower
bun test plane-fixes.test.mjs  → 6 pass / 0 fail
bun test cli.test.mjs -t 'board topic filter' → 3 pass / 0 fail
bun ~/.tower/cli.mjs status → EXIT 0
```

## Files changed (main working tree)

- `primitives/mcps/tower/server.mjs` — F1 + F4
- `primitives/mcps/tower/cli.mjs` — F9
- `primitives/mcps/tower/plane-fixes.test.mjs` — new (test-maker oracle)
- `primitives/mcps/tower/cli.test.mjs` — F9 oracle (loosened after Q1)
- `primitives/mcps/tower/COMMS-ARCH.md` — migration item 4 IMPLEMENTED note

## Make topology

- `cursor-fleet make w3-f1-f4` / `w3-f9` (`--no-finish`)
- Q1: F9 oracle over-asserted `boardFor.length === CLI lines` (50 vs 53) → re-brief test-maker → fixed
- Impl arms: coder pb (F1/F4), coder pf (F9)

## Note

In-process Cursor MCP may hold a pre-patch `server.mjs` until that MCP process restarts. Live proof used fresh `Bun.spawn` of the symlink target; CLI reads file each invocation (F9 live immediately).
