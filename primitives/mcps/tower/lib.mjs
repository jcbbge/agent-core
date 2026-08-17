// Tower shared storage layer — imported by server.mjs, hook scripts, and cli.mjs.
// Ledger grammar canonical home: ~/agent-core/primitives/hooks/tower-ledger.mjs
// This file re-exports for back-compat and runs mkdir side effects.

import { mkdirSync } from 'node:fs'
export * from '../../hooks/tower-ledger.mjs'
import {
  TOWER,
  DELIVERABLES,
  FLIGHT,
  normCwd,
  openQuestionRows,
  _test,
} from '../../hooks/tower-ledger.mjs'

// Deposit/queue/dead-letter core (CONTRACT: primitives/mcps/tower/deposit.mjs
// is the pinned home; this is its re-export surface). Named explicitly rather
// than `export *` so a future name collision with tower-ledger.mjs fails at
// review time, not silently at link time. The queue-plane fold is named
// `foldInbox` (ORCH ruling, CONTRACT §6b) precisely to avoid colliding with
// tower-ledger.mjs's pre-existing `inboxState(cwd)` (ledger-plane, consumed
// live by cli.mjs and server.mjs), which remains untouched below.
export {
  PACE_WINDOW_SECONDS,
  MAX_ATTEMPTS,
  STUCK_THRESHOLD_SECONDS,
  DEFER_RETRY_SECONDS,
  NQ_BUDGET,
  LEASE_TIMEOUT_SECONDS,
  ALLOWED_KINDS,
  STATUS_PLANE_KINDS,
  slugForAddressee,
  unslugAddressee,
  inboxPath,
  deposit,
  readInbox,
  foldInbox,
  listInboxes,
  dueItems,
  pendingItems,
  markDelivering,
  markDelivered,
  markAcked,
  markDeferred,
  requeue,
  expireTtl,
  reclaimLeases,
  paceGate,
} from './deposit.mjs'

mkdirSync(DELIVERABLES, { recursive: true })
mkdirSync(FLIGHT, { recursive: true })

// ─── defensive JSONL field access (rows are append-only, partial rows happen) ─
// Mirrors cli.mjs helpers; canonical render path for inbox / server / stop-guard.

export function preview(value, max = 100) {
  if (value == null || value === '') return '(no message)'
  const s = String(value)
  return s.length > max ? s.slice(0, max) : s
}

export function rowPreview(row, max = 100) {
  return preview(row?.message ?? row?.title ?? row?.body, max)
}

function messageBody(m) {
  const v = m?.message ?? m?.title ?? m?.body
  if (v == null || v === '') return '(no message)'
  return String(v)
}

/** Sync ledger inbox cursor once; reuse for many cwds (avoids N lock+write cycles). */
export function ledgerInboxCursor() {
  return _test.syncLedgerInboxCursor()
}

/** Derive inbox slices from an already-synced cursor — no lock re-entry. */
export function deriveInboxStateFromCursor(cursor, cwd) {
  const scope = cwd ? normCwd(cwd) : null
  const acked = new Set(cursor.acked)
  const answeredIds = new Set(cursor.answeredIds)
  const rows = scope ? (cursor.byCwd[scope] ?? []) : cursor.allRows
  const answers = rows.filter((r) => r.kind === 'answer')
  const unrelayed = rows.filter(
    (r) =>
      !acked.has(r.id) &&
      ((r.kind === 'alert' && (r.to === undefined || r.to === 'operator')) ||
        (r.kind === 'deliverable' && r.to === 'operator'))
  )
  const openQuestions = openQuestionRows(rows, answeredIds)
  const progress = rows.filter((r) => r.kind === 'progress')
  return { unrelayed, openQuestions, answers, progress, all: rows }
}

/** Defensive inbox renderer — overrides tower-ledger export for ~/.tower consumers. */
export function renderMessage(m) {
  if (!m || typeof m !== 'object') return '(malformed row)'
  const ts = typeof m.ts === 'string' ? m.ts : '?'
  const head = `Tower ${m.id ?? '?'} · ${m.kind ?? '?'}${m.title ? ` · ${m.title}` : ''} · from ${m.from ?? 'unknown'} · ${ts}`
  const opts = Array.isArray(m.options) && m.options.length ? `\noptions: ${m.options.join(' | ')}` : ''
  return `${head}\n${messageBody(m)}${opts}`
}
