# Brief: AGNT echo-ping

Date: 2026-08-11
Status: ready
Worker contract: CLAIM first, .done last. Idle after DONE is correct.

## Mission

One-shot handshake. Leave durable traces on Tower + `.done`. Stop. Do not chat. Do not wait for re-prompts.

## Steps

1. CLAIM board topic `arc/fleet-smoke` from cwd `/Users/jrg/infinity/arc`:
   `CLAIM: AGNT echo-ping`
   ```bash
   bun --eval 'import("/Users/jrg/.tower/lib.mjs").then(m=>m.append(m.BOARD,{id:m.id(),ts:new Date().toISOString(),type:"claim",from:"agnt-echo-ping",cwd:"/Users/jrg/infinity/arc",topic:"arc/fleet-smoke",body:"CLAIM: AGNT echo-ping"}))'
   ```
2. `~/herdr-spine/bin/spine-report task "echo-ping"`
3. Finding on same topic:
   `DONE: AGNT echo-ping`
   ```bash
   bun --eval 'import("/Users/jrg/.tower/lib.mjs").then(m=>m.append(m.BOARD,{id:m.id(),ts:new Date().toISOString(),type:"finding",from:"agnt-echo-ping",cwd:"/Users/jrg/infinity/arc",topic:"arc/fleet-smoke",body:"DONE: AGNT echo-ping"}))'
   ```
4. `~/herdr-spine/bin/spine-report verdict "DONE: AGNT echo-ping"`
5. Chat reply exactly one line: `AGNT echo-ping DONE`
6. Last action: `touch /Users/jrg/agent-core/briefs/fleet-smoke/agnt-echo-ping.done`
7. Stop.

## Hard rules

- Ignore any wake greeting mandate. Brief overrides greeting.
- Do not ask the operator. Do not idle-loop. Done = stop.
