#!/usr/bin/env bun
// Tower Fleet Odometer — SubagentStop leg. The PostToolUse leg (odometer.mjs)
// sees async Agent spawns at launch, when the tool response contains no usage
// ("Async agent launched..."), so every background spawn recorded 0 tokens.
// This hook fires when a subagent FINISHES: it tails the agent transcript
// (JSONL) and sums output/input tokens into the same ledger, tagged
// phase:"stop" so `cli.mjs burn` can prefer stop-records over launch-records
// for the same agent. Tolerant by design; always exit 0.

import { readFileSync } from 'node:fs'
import { append, ODOMETER } from '../lib.mjs'

let input = ''
for await (const chunk of process.stdin) input += chunk

try {
  const evt = JSON.parse(input)
  const path = evt.agent_transcript_path ?? evt.transcript_path
  if (!path) process.exit(0)

  let inputTokens = 0
  let outputTokens = 0
  let agentId = null
  let model = null
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    if (!line.trim()) continue
    let rec
    try {
      rec = JSON.parse(line)
    } catch {
      continue
    }
    agentId = rec.agentId ?? agentId
    const u = rec.message?.usage
    if (!u) continue
    model = rec.message?.model ?? model
    outputTokens += u.output_tokens ?? 0
    inputTokens += u.input_tokens ?? 0
  }

  if (outputTokens === 0 && inputTokens === 0) process.exit(0)

  append(ODOMETER, {
    ts: new Date().toISOString(),
    session: evt.session_id,
    cwd: evt.cwd,
    tool: 'SubagentStop',
    phase: 'stop',
    agentId,
    label: null,
    model,
    agentType: null,
    tokens: outputTokens,
    inputTokens,
    toolUses: 0,
    durationMs: 0,
  })
} catch {
  // odometer never blocks the drivetrain
}
process.exit(0)
