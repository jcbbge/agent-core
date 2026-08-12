# Brief: CORD fleet-smoke

Date: 2026-08-11
Status: ready
Coordinator contract: spawn ORCH, collect via board + `.done`, report once, reap. Never implement. Never re-prompt idle workers.

## Mission

One project-coordinator cycle for the contrived fleet-smoke test.

## Pre-Verified Facts

- Cwd: `/Users/jrg/infinity/arc`
- Spawn: `~/bin/spine-spawn` only (python3). Never bun on spine-spawn.
- ORCH brief: `/Users/jrg/agent-core/briefs/fleet-smoke/orch-fleet-smoke.md`
- Collect on: board topic `arc/fleet-smoke` + `orch-fleet-smoke.done`
- COMMS-ARCH: status ≠ mail; fleet mail stays on board; only escalate to operator if blocked with `to:"operator"`

## Steps

1. CLAIM: `CLAIM: CORD fleet-smoke online`
2. `~/herdr-spine/bin/spine-report task "fleet-smoke cord"`
3. Spawn ORCH:
   ```bash
   ~/bin/spine-spawn orch --task fleet-smoke --kind pi \
     --brief /Users/jrg/agent-core/briefs/fleet-smoke/orch-fleet-smoke.md \
     --workspace "$HERDR_WORKSPACE_ID" --cwd /Users/jrg/infinity/arc
   ```
   (registration will be `orch-fleet-smoke` from --task)
4. **Watch durable planes only** (board + `.done`). Do not `agent prompt` workers.
   - Bound 180s for `/Users/jrg/agent-core/briefs/fleet-smoke/orch-fleet-smoke.done`
   - Board must contain `DONE: ORCH fleet-smoke`
5. Finding: `DONE: CORD fleet-smoke — hierarchy green` or ALERT with missing evidence
6. `~/herdr-spine/bin/spine-report verdict "fleet-smoke cord green|red"`
7. `touch /Users/jrg/agent-core/briefs/fleet-smoke/cord-fleet-smoke.done`
8. Stop. Concierge reaps.

## Hard rules

- Idle agents with `.done` + board DONE = success, not a summons.
- Re-prompting for status is forbidden. Read the board / CTRL / TOWR.
