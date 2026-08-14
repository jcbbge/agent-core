#!/usr/bin/env bun
// Tower Flight Recorder — PreCompact + SessionEnd hook.
//
// Compaction and session-end are where in-flight nuance dies: the diff in
// progress, what just failed, open Tower items. This hook snapshots the
// working state to disk BEFORE the context is folded, deterministically —
// no model in the loop. SessionStart points at the latest snapshot so the
// next context (compacted or brand new) can recover the working set.
//
// Snapshots: ~/.tower/flight/<date>-<event>-<session8>.md
// Always exit 0; a recorder must never block the flight.

import { execSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { FLIGHT, inboxState } from '../lib.mjs'

let input = ''
for await (const chunk of process.stdin) input += chunk
let evt = {}
try {
  evt = JSON.parse(input)
} catch {
  process.exit(0)
}

try {
  const cwd = evt.cwd ?? process.cwd()
  const ts = new Date().toISOString()
  const event = evt.hook_event_name ?? 'snapshot'
  const session8 = (evt.session_id ?? 'unknown').slice(0, 8)

  const git = (cmd) => {
    try {
      return execSync(`git ${cmd}`, { cwd, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
    } catch {
      return '(not a git repo)'
    }
  }

  const { unrelayed, openQuestions } = inboxState(cwd)

  const body = `# Flight snapshot — ${event}

ts: ${ts}
session: ${evt.session_id ?? 'unknown'}
cwd: ${cwd}
branch: ${git('branch --show-current')}

## Working tree (uncommitted = open work)
${git('status --short') || '(clean)'}

## Diff shape
${git('diff --stat | tail -15') || '(no diff)'}

## Last 3 commits
${git('log --oneline -3')}

## Tower pending
unrelayed: ${unrelayed.length} · open questions: ${openQuestions.length}
${unrelayed.map((m) => `! ${m.id} ${m.kind} from ${m.from ?? '?'}: ${m.message.slice(0, 80)}`).join('\n')}
${openQuestions.map((q) => `? ${q.id} from ${q.from ?? '?'}: ${q.message.slice(0, 80)}`).join('\n')}
`

  writeFileSync(join(FLIGHT, `${ts.slice(0, 10)}-${event}-${session8}.md`), body)
} catch {
  // never block
}
process.exit(0)
