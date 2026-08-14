#!/usr/bin/env bun
// stop-verdict.mjs — Claude Code Stop hook (WS-5, TOWER-AUTO-CC §4).
// Sets the pane's $verdict token from the last assistant text so
// 40-tower-bridge's done→deliverable path fires for claude panes
// fleet-wide. Repo file is canonical; live installs are copies.
//
// Hook discipline (mirrors ~/.claude/hooks/herdr-task-report.sh):
// consume stdin fully; ALWAYS exit 0; HERDR_ENV/HERDR_PANE_ID/
// HERDR_SOCKET_PATH gated; agent_id in payload = subagent traffic → exit 0
// (the root session owns the pane row); stop_hook_active → exit 0
// (recursion guard). Never throws into the harness.
//
// $verdict semantics (docs/spine-tokens.md): ≤200 chars, word-boundary
// truncation, TTL 24h (86400000 = report-metadata max — the durable
// stand-in), source custom:spine, clears $task in the same call.
//
// Text source (empirical, 2026-07-28 live fire): the Stop payload's
// `last_assistant_message` is PRIMARY — at Stop-fire time the transcript
// JSONL has NOT yet been flushed with the final assistant text block (the
// walk finds nothing; minutes later the file is complete). The transcript
// walk remains as the fallback for payloads lacking the field.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'
import { spawnSync } from 'node:child_process'

const MAX = 200
const TTL_MS = '86400000'

// The hook env may carry a PATH that does not resolve a bare `herdr`;
// resolve absolute candidates first, bare name last.
function resolveHerdr() {
  const candidates = [
    process.env.HERDR_BIN,
    join(homedir(), '.local', 'bin', 'herdr'),
    '/opt/homebrew/bin/herdr',
    '/usr/local/bin/herdr',
  ]
  for (const c of candidates) {
    try { if (c && existsSync(c)) return c } catch { /* next */ }
  }
  return 'herdr'
}

function exit0() { process.exit(0) }

// 1. stdin — consume fully, tolerate garbage.
let raw = ''
try { for await (const chunk of process.stdin) raw += chunk } catch { exit0() }
let evt
try { evt = JSON.parse(raw) } catch { exit0() }
if (!evt || typeof evt !== 'object') exit0()

// 2. Guards.
if (evt.agent_id) exit0()                  // subagent traffic: root owns the row
if (evt.stop_hook_active === true) exit0() // stop-guard recursion guard
if (process.env.HERDR_ENV !== '1') exit0()
const pane = process.env.HERDR_PANE_ID
if (!pane) exit0()
const sock = process.env.HERDR_SOCKET_PATH
if (!sock || !existsSync(sock)) exit0()

// 3. Transcript fallback resolution: evt.transcript_path, else the newest
//    JSONL under ~/.claude/projects/<slugified-cwd>/ (slug: non-alnum → '-').
function slugify(cwd) { return String(cwd).replace(/[^a-zA-Z0-9]/g, '-') }

function resolveTranscript() {
  const tp = evt.transcript_path
  if (typeof tp === 'string' && tp && existsSync(tp)) return { path: tp, via: 'transcript_path' }
  const cwd = evt.cwd
  if (typeof cwd !== 'string' || !cwd) return null
  try {
    const dir = join(homedir(), '.claude', 'projects', slugify(cwd))
    let best = null
    let bestM = -1
    for (const f of readdirSync(dir)) {
      if (!f.endsWith('.jsonl')) continue
      const m = statSync(join(dir, f)).mtimeMs
      if (m > bestM) { bestM = m; best = join(dir, f) }
    }
    return best ? { path: best, via: 'projects-fallback' } : null
  } catch { return null }
}

// 4. Transcript walk (fallback): last assistant content[].type=="text"
//    block, backwards; tool-only assistant tails are skipped.
function lastAssistantText(path) {
  const lines = readFileSync(path, 'utf8').split('\n')
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim()
    if (!line) continue
    let rec
    try { rec = JSON.parse(line) } catch { continue }
    if (rec?.type !== 'assistant') continue
    const content = rec?.message?.content
    if (!Array.isArray(content)) continue
    for (let j = content.length - 1; j >= 0; j--) {
      const b = content[j]
      if (b?.type === 'text' && typeof b.text === 'string' && b.text.trim()) return b.text
    }
  }
  return null
}

// 5. Collapse whitespace; truncate ≤200 on a word boundary with '…'.
function shorten(s) {
  s = String(s).replace(/[\x00-\x1f\x7f]/g, ' ').replace(/\s+/g, ' ').trim()
  if (!s) return null
  if (s.length <= MAX) return s
  const cut = s.slice(0, MAX)
  const sp = cut.lastIndexOf(' ')
  return (sp > MAX * 0.6 ? cut.slice(0, sp) : cut) + '…'
}

try {
  let text = shorten(typeof evt.last_assistant_message === 'string' ? evt.last_assistant_message : '')
  let via = 'last_assistant_message'
  if (!text) {
    const t = resolveTranscript()
    if (!t) exit0()
    text = shorten(lastAssistantText(t.path) ?? '')
    via = t.via
  }
  if (!text) exit0()
  const r = spawnSync(resolveHerdr(), [
    'pane', 'report-metadata', pane,
    '--source', 'custom:spine',
    '--token', `verdict=${text}`,
    '--ttl-ms', TTL_MS,
    '--clear-token', 'task',
  ], { stdio: 'ignore', timeout: 5000, env: process.env })
  if (!r.error && r.status === 0) {
    process.stderr.write(`[stop-verdict] set on ${pane} (${via}): ${text.slice(0, 60)}\n`)
  }
} catch { /* never throw into the harness */ }
exit0()
