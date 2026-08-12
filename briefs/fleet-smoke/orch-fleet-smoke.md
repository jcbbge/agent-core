# Brief: ORCH fleet-smoke

Date: 2026-08-11
Status: ready
Worker contract: CLAIM first, .done last (Protocol). Idle after DONE is correct — do NOT wait for re-prompts. Fleet mail = Tower board.

## Mission

Prove the control-flow hierarchy once: spawn AGNT echo-ping + SAGT wait-report via `spine-spawn`, collect their board DONE + `.done` markers, post ORCH deliverable, stop. No operator interrogation. No idle re-prompt loops.

## Pre-Verified Facts

- Cwd: `/Users/jrg/infinity/arc`
- Topic: `arc/fleet-smoke`
- Spawn tool: `~/bin/spine-spawn` (= `python3 ~/herdr-spine/bin/spine-spawn`). NEVER `bun …/spine-spawn`.
- AGNT brief: `/Users/jrg/agent-core/briefs/fleet-smoke/agnt-echo-ping.md`
- SAGT brief: `/Users/jrg/agent-core/briefs/fleet-smoke/sagt-wait-report.md`
- Done markers: same dir — `agnt-echo-ping.done`, `sagt-wait-report.done`, then `orch-fleet-smoke.done`
- Board append (sanctioned):
  `bun --eval 'import("/Users/jrg/.tower/lib.mjs").then(m=>m.append(m.BOARD,{id:m.id(),ts:new Date().toISOString(),type:"finding",from:"orch-fleet-smoke",cwd:"/Users/jrg/infinity/arc",topic:"arc/fleet-smoke",body:"TEXT"}))'`
- Tokens: `~/herdr-spine/bin/spine-report task|verdict "<text>"`

## Steps

1. CLAIM on board topic `arc/fleet-smoke` body exactly: `CLAIM: ORCH fleet-smoke online`
2. `~/herdr-spine/bin/spine-report task "spawn AGNT+SAGT"`
3. From THIS pane (`$HERDR_PANE_ID`), spawn both (verified submit is baked in):
   ```bash
   ~/bin/spine-spawn worker --label agnt-echo-ping --kind pi \
     --brief /Users/jrg/agent-core/briefs/fleet-smoke/agnt-echo-ping.md \
     --pane "$HERDR_PANE_ID" --direction right --cwd /Users/jrg/infinity/arc
   ~/bin/spine-spawn worker --label sagt-wait-report --kind pi \
     --brief /Users/jrg/agent-core/briefs/fleet-smoke/sagt-wait-report.md \
     --pane "$HERDR_PANE_ID" --direction down --cwd /Users/jrg/infinity/arc
   ```
4. Stamp display (if spine-spawn already stamped, skip):
   - AGNT → role `3-AGNT`; SAGT → role `4-SAGT` (registration names carry prefixes)
5. **Collect via STATUS + board — never re-prompt for chatter.** Poll only the durable planes:
   - Wait until both files exist: `agnt-echo-ping.done` and `sagt-wait-report.done`
   - Confirm board findings from `agnt-echo-ping` and `sagt-wait-report` contain `DONE:`
   - Bound wait: 120s. If missing, post `finding` ALERT with evidence and stop (do not re-prompt).
6. Post deliverable finding body:
   `DONE: ORCH fleet-smoke — AGNT+SAGT .done present; board DONE lines present`
7. `~/herdr-spine/bin/spine-report verdict "fleet-smoke green"`
8. Last action: `touch /Users/jrg/agent-core/briefs/fleet-smoke/orch-fleet-smoke.done`
9. Stop. Spawner (CORD) reaps you. Do not sit waiting for more prompts.

## Done when

- [ ] Both worker `.done` files exist
- [ ] Board has DONE findings from both workers
- [ ] Board has ORCH DONE deliverable line
- [ ] `orch-fleet-smoke.done` exists
- [ ] No `herdr agent prompt` after the initial spine-spawn deliveries

## Out of scope

- Re-prompting idle panes
- Operator mail (`to:"operator"`)
- Touching product code
