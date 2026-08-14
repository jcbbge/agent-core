#!/usr/bin/env bun
// Tower Fleet Odometer — PostToolUse hook on Agent/Task/Workflow.
//
// The orchestrator is blind to fleet cost: subagent usage flashes by once in
// a tool result and is never accumulated. This hook captures every spawn's
// usage into an append-only ledger so /tower and `cli.mjs burn` can show the
// session and daily burn — making cost visible at the moment model-tier
// decisions are made.
//
// Tolerant by design: usage fields are regex-mined from the serialized tool
// response; if a harness version changes the shape, this degrades to a no-op
// spawn count rather than breaking anything. Always exit 0 — an odometer must
// never block the drivetrain.

import { append, ODOMETER } from '../lib.mjs'

let input = ''
for await (const chunk of process.stdin) input += chunk
let evt = {}
try {
  evt = JSON.parse(input)
} catch {
  process.exit(0)
}

try {
  const blob = JSON.stringify(evt.tool_response ?? '')
  const sum = (re) => {
    let total = 0
    let m
    while ((m = re.exec(blob)) !== null) total += parseInt(m[1], 10)
    return total
  }
  const tokens = sum(/subagent_tokens[\\":\s]+(\d+)/g)
  const toolUses = sum(/tool_uses[\\":\s]+(\d+)/g)
  const durationMs = sum(/duration_ms[\\":\s]+(\d+)/g)

  append(ODOMETER, {
    ts: new Date().toISOString(),
    session: evt.session_id,
    cwd: evt.cwd,
    tool: evt.tool_name,
    label: evt.tool_input?.description ?? evt.tool_input?.name ?? null,
    model: evt.tool_input?.model ?? null,
    agentType: evt.tool_input?.subagent_type ?? null,
    tokens,
    toolUses,
    durationMs,
  })
} catch (e) {
  console.error(e)
}
process.exit(0)
