#!/usr/bin/env bun
// Tower Stop guard — the verbatim-delivery guarantee.
//
// Fires when the main agent tries to end its turn. If the fleet has surfaced
// deliverables/alerts that were never relayed to the user, or questions the
// user never saw, this hook BLOCKS the stop (exit 2) and hands the agent the
// full message content on stderr so it can relay verbatim immediately —
// no extra tool calls needed to learn what's pending.
//
// Loop protection: stop_hook_active=true means we already blocked once this
// stop cycle — allow the stop so a malfunction can never trap the agent.

import { inboxState, renderMessage } from '../lib.mjs'
import { resolveIdentity, isFleetMember } from '../node-identity.mjs'

let input = ''
for await (const chunk of process.stdin) input += chunk
let evt = {}
try {
  evt = JSON.parse(input)
} catch {
  process.exit(0)
}

if (evt.stop_hook_active) process.exit(0)

// Fleet mail is for fleet members. An engine with no identity stamp is an
// observer — the operator's desk, a one-off session — and inherits nobody's
// obligations. Without this, cwd alone decides, and whoever stands in a
// directory is handed that directory's mail. See ../node-identity.mjs.
if (!isFleetMember(resolveIdentity())) process.exit(0)

const cwd = evt.cwd ?? process.cwd()
const { unrelayed, openQuestions } = inboxState(cwd)
if (unrelayed.length === 0 && openQuestions.length === 0) process.exit(0)

const parts = []
if (unrelayed.length > 0) {
  parts.push(
    `${unrelayed.length} fleet message(s) were never relayed to the user. Relay each VERBATIM (full content, attributed), then call mcp__tower__mark_relayed with their ids:\n\n` +
      unrelayed.map(renderMessage).join('\n\n')
  )
}
if (openQuestions.length > 0) {
  parts.push(
    `${openQuestions.length} fleet question(s) await the user. Surface each verbatim and ask the user to answer; when they do, call mcp__tower__reply with the question id:\n\n` +
      openQuestions.map(renderMessage).join('\n\n')
  )
}

process.stderr.write(`[Tower] ${parts.join('\n\n')}\n`)
process.exit(2)
