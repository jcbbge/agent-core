#!/usr/bin/env bun
// Tower UserPromptSubmit hook — ambient awareness at the moment it matters.
//
// When the user sends a prompt, inject the Tower state (exit 0 stdout becomes
// context): unrelayed messages, open fleet questions, and the last few
// progress beacons. Silent when there is nothing — zero noise on quiet days.

import { inboxState } from '../lib.mjs'

let input = ''
for await (const chunk of process.stdin) input += chunk
let evt = {}
try {
  evt = JSON.parse(input)
} catch {
  process.exit(0)
}

const cwd = evt.cwd ?? process.cwd()
const { unrelayed, openQuestions, progress } = inboxState(cwd)

const ONE_HOUR = 60 * 60 * 1000
const recentProgress = progress.filter((p) => Date.now() - new Date(p.ts).getTime() < ONE_HOUR).slice(-3)

if (unrelayed.length === 0 && openQuestions.length === 0 && recentProgress.length === 0) process.exit(0)

const lines = ['[Tower]']
if (unrelayed.length > 0)
  lines.push(
    `Unrelayed fleet messages (relay verbatim, then mcp__tower__mark_relayed): ${unrelayed.map((m) => `${m.id} (${m.kind}${m.title ? `: ${m.title}` : ''} from ${m.from ?? '?'})`).join(', ')}`
  )
if (openQuestions.length > 0)
  lines.push(
    `Open fleet questions (surface to the user; record answers via mcp__tower__reply): ${openQuestions.map((q) => `${q.id} from ${q.from ?? '?'}: "${q.message.slice(0, 120)}"`).join(' · ')}`
  )
if (recentProgress.length > 0)
  lines.push(`Recent fleet progress: ${recentProgress.map((p) => `[${p.from ?? '?'}] ${p.message.slice(0, 100)}`).join(' · ')}`)

process.stdout.write(lines.join('\n') + '\n')
process.exit(0)
