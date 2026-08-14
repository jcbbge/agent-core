#!/usr/bin/env bun
// Tower SessionStart hook — boot oriented, not cold.
//
// Injects (exit 0 stdout becomes session context):
//   1. Tower state carried over from previous sessions in this project —
//      unrelayed messages and unanswered fleet questions never silently die
//      with the session that produced them.
//   2. The last handoff: the most recent commit carrying a TODO: line
//      (the repo's commit convention makes git log the handoff ledger).
// Silent when there is nothing to say.

import { execSync } from 'node:child_process'
import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { inboxState, FLIGHT } from '../lib.mjs'

let input = ''
for await (const chunk of process.stdin) input += chunk
let evt = {}
try {
  evt = JSON.parse(input)
} catch {
  process.exit(0)
}

const cwd = evt.cwd ?? process.cwd()
const lines = []

let towerLoaded = false
const { unrelayed, openQuestions } = inboxState(cwd)
if (unrelayed.length > 0 || openQuestions.length > 0) {
  towerLoaded = true
  lines.push(
    `[Tower] Carried over from earlier sessions: ${unrelayed.length} unrelayed message(s), ${openQuestions.length} open question(s). Run /tower to see them; relay/surface before new work.`
  )
}

let handoffLoaded = false
try {
  const log = execSync('git log --format="%h %s%n%b" -5', { cwd, stdio: ['ignore', 'pipe', 'ignore'] })
    .toString()
  const todoMatch = log.match(/^([0-9a-f]+ .+)$[\s\S]*?^TODO: (.+)$/m)
  if (todoMatch && todoMatch[2].trim() !== '—') {
    handoffLoaded = true
    lines.push(`[Tower] Last handoff (${todoMatch[1].split(' ')[0]}): TODO: ${todoMatch[2]}`)
  }
} catch {
  // not a git repo — nothing to say
}

// Latest flight snapshot (<24h): the working set as it was at last
// compaction or session end - recovers what summaries lose.
let flightLoaded = false
try {
  const snaps = readdirSync(FLIGHT)
    .map((f) => ({ f, m: statSync(join(FLIGHT, f)).mtimeMs }))
    .sort((a, b) => b.m - a.m)
  if (snaps.length > 0 && Date.now() - snaps[0].m < 24 * 60 * 60 * 1000) {
    flightLoaded = true
    lines.push(`[Tower] Flight snapshot from the previous context: ${join(FLIGHT, snaps[0].f)} - read it if the handoff above seems incomplete.`)
  }
} catch {
  // no flight dir - nothing to say
}

// Boot card stamp (primitives/tools/boot-card/): one line reporting which
// Session Boundary Contract legs this adapter actually loaded this run.
// This adapter owns legs 1-3; leg 4 (memory) belongs to circadian's own
// wake.ts hook — reported by name, never computed here (a stamp reports
// only what its own adapter did; it never re-derives another leg's data).
try {
  const stamp = `[boot] tower ${towerLoaded ? '✓' : '✗(clear)'} · handoff ${handoffLoaded ? '✓' : '✗(none declared)'} · flight ${flightLoaded ? '✓' : '✗(none<24h)'} · memory: circadian hook`
  lines.push(stamp)
} catch {
  // a recorder never blocks: stamp failure must never break the adapter
}

if (lines.length > 0) process.stdout.write(lines.join('\n') + '\n')
process.exit(0)
