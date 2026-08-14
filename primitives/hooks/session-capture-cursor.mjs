#!/usr/bin/env bun
// session-capture-cursor.mjs — Cursor sessionEnd / preCompact hook.
//
// Implements Session Boundary Contract legs 5-6
// (primitives/rules/session-lifecycle.md, "The Session Boundary Contract"):
//   5. Flight snapshot written (deterministic, no model)
//   6. Lifecycle verdicts to the status plane (never fabricated into mail)
//
// Ported from the claude-code reference adapter
// (~/agent-core/primitives/hooks/flight-recorder.mjs, shimmed at
// ~/.tower/hooks/flight-recorder.mjs, wired to PreCompact + SessionEnd in
// ~/.claude/settings.json). Same body — git status/diff/log + Tower pending
// -> a timestamped .md in ~/.tower/flight/ — adapted to cursor's hook input
// schema, which differs from CC's:
//   - cursor's sessionEnd payload is documented as {session_id, reason,
//     duration_ms, is_background_agent, final_status, error_message}
//     (no cwd/workspace_roots called out in the per-event table), but the
//     docs also state ALL hooks receive a base-field set that includes
//     workspace_roots/conversation_id/hook_event_name — so this script reads
//     both, defensively, and falls back to $PWD (cwd is never sent as
//     "cwd" by cursor the way CC sends it).
//   - cursor's preCompact payload is {trigger, context_usage_percent,
//     context_tokens, context_window_size, message_count,
//     messages_to_compact, is_first_compaction} + the same base fields.
//
// Filename carries a "cursor" marker so cursor and claude-code snapshots in
// the shared ~/.tower/flight/ directory are distinguishable at a glance:
//   <date>-cursor-<event>-<session8>.md
//
// Boundary adapter per the layer doctrine: deterministic, no model in the
// loop, data only. sessionEnd is documented as fire-and-forget ("the
// response is logged but not used" — sessions cannot be blocked by this
// hook) and preCompact is documented as purely observational ("cannot
// block or modify the compaction behavior"), so this script never needs to
// produce output for either — it only needs to exit 0 and never throw. A
// recorder never blocks the flight.

import { execSync } from 'node:child_process'
import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const { inboxState, FLIGHT } = await import(join(__dirname, 'tower-ledger.mjs'))

let input = ''
try {
  for await (const chunk of process.stdin) input += chunk
} catch {
  // no stdin (standalone manual run) — proceed with an empty event
}

let evt = {}
try {
  evt = input ? JSON.parse(input) : {}
} catch {
  evt = {}
}

try {
  const roots = Array.isArray(evt.workspace_roots) ? evt.workspace_roots : []
  const cwd = (roots[0] && existsSync(roots[0]) ? roots[0] : null) ?? evt.cwd ?? process.cwd()

  const ts = new Date().toISOString()
  const event = evt.hook_event_name ?? 'sessionEnd'
  const sessionRaw = evt.session_id ?? evt.conversation_id ?? 'unknown'
  const session8 = String(sessionRaw).slice(0, 8)

  const git = (cmd) => {
    try {
      return execSync(`git ${cmd}`, { cwd, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
    } catch {
      return '(not a git repo)'
    }
  }

  const { unrelayed, openQuestions } = inboxState(cwd)

  const body = `# Flight snapshot — cursor ${event}

ts: ${ts}
session: ${sessionRaw}
cwd: ${cwd}
branch: ${git('branch --show-current')}
reason: ${evt.reason ?? evt.trigger ?? '(n/a)'}

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

  mkdirSync(FLIGHT, { recursive: true })
  writeFileSync(join(FLIGHT, `${ts.slice(0, 10)}-cursor-${event}-${session8}.md`), body)
} catch {
  // never block the flight
}

process.exit(0)
