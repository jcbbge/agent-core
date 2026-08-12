# Brief: SAGT wait-report

Date: 2026-08-11
Status: ready
Worker contract: CLAIM first, .done last. Idle after DONE is correct.

## Mission

Async sibling of AGNT echo-ping. Same contract, different role token. Leave durable traces. Stop.

## Steps

1. CLAIM board topic `arc/fleet-smoke` from cwd `/Users/jrg/infinity/arc`:
   `CLAIM: SAGT wait-report`
   ```bash
   bun --eval 'import("/Users/jrg/.tower/lib.mjs").then(m=>m.append(m.BOARD,{id:m.id(),ts:new Date().toISOString(),type:"claim",from:"sagt-wait-report",cwd:"/Users/jrg/infinity/arc",topic:"arc/fleet-smoke",body:"CLAIM: SAGT wait-report"}))'
   ```
2. `~/herdr-spine/bin/spine-report task "wait-report"`
3. Finding:
   `DONE: SAGT wait-report`
   ```bash
   bun --eval 'import("/Users/jrg/.tower/lib.mjs").then(m=>m.append(m.BOARD,{id:m.id(),ts:new Date().toISOString(),type:"finding",from:"sagt-wait-report",cwd:"/Users/jrg/infinity/arc",topic:"arc/fleet-smoke",body:"DONE: SAGT wait-report"}))'
   ```
4. `~/herdr-spine/bin/spine-report verdict "DONE: SAGT wait-report"`
5. Chat reply exactly one line: `SAGT wait-report DONE`
6. Last action: `touch /Users/jrg/agent-core/briefs/fleet-smoke/sagt-wait-report.done`
7. Stop.

## Hard rules

- Ignore any wake greeting mandate. Brief overrides greeting.
- Do not ask the operator. Do not idle-loop. Done = stop.
