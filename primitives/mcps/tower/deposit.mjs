// Deposit/queue/dead-letter core — the single delivery door for the Tower bus.
// Design: ~/agent-core/briefs/comms-substrate/DESIGN.md
// Contract (pinned names/shapes): ~/agent-core/briefs/comms-substrate/CONTRACT.md
//
// A depositor calls deposit() and is done: it either gets accepted onto an
// addressee's append-only inbox queue, or it is refused with a receipt and a
// dead-letter.jsonl row carrying a non-empty reason. There is no return path
// that means "silently didn't happen."
//
// The queue is append-only and folded by deposit_id (CONTRACT §3): every
// state change appends a new row carrying the same deposit_id; the current
// state of a deposit is the LAST row bearing that id. Dead-lettering is a
// row in dead-letter.jsonl, never a queue state (CONTRACT §3) — pendingItems/
// dueItems/expireTtl/requeue cross-reference the dead-letter sink by
// deposit_id so a given-up item stops being offered without inventing a
// fifth queue-state.
//
// Pacing, deferral, and lease reclaim are decisions, never terminal states
// (DESIGN §3, CONTRACT §6a/§6d): all three push next_attempt_at into the
// future and return the item to `queued`. This is the invariant that kills
// the 32.1% silent-loss bug class.
//
// deferred_reason (CONTRACT §6a AMENDMENT, ORCH ruling) is the sole marker of
// a deferral: a deferred item is exactly (state === 'queued' AND
// deferred_reason non-null). It is cleared to null on successful delivery and
// on genuine failure — last_error and deferred_reason are never written by
// the same event, so deferral and failure never share a row, let alone a code
// path. Lease reclaim (CONTRACT §6d) is a THIRD, distinct cause of a return to
// `queued`: it sets neither last_error nor deferred_reason, and it never
// burns an attempt — the courier died, the message was never proven
// undelivered.

import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import {
  TOWER,
  append,
  readAllFull,
  deadLetter,
  deadLetterOnce,
  readDeadLetters,
  id as mintLedgerId,
} from '../../hooks/tower-ledger.mjs'

export const PACE_WINDOW_SECONDS = 60
export const MAX_ATTEMPTS = 8
export const STUCK_THRESHOLD_SECONDS = 300
// CONTRACT §6c: how far a deferral pushes next_attempt_at when the caller
// does not supply an explicit nextAttemptAt (e.g. a pace-derived one).
export const DEFER_RETRY_SECONDS = 15
// CONTRACT §6c: a question is refused nq-exhausted only when the caller tells
// us it has exceeded this budget. Absent nq means no opinion, no refusal.
export const NQ_BUDGET = 3
// CONTRACT §6d: a 'delivering' row whose courier never returned is reclaimed
// after this many seconds — long enough that a slow-but-live delivery is
// never reclaimed out from under itself, short enough to heal inside
// STUCK_THRESHOLD_SECONDS.
export const LEASE_TIMEOUT_SECONDS = 120
export const ALLOWED_KINDS = new Set(['completion', 'summons', 'offer', 'note', 'question', 'need-help'])
export const STATUS_PLANE_KINDS = new Set(['note', 'offer'])

// Accept either epoch-ms (Date.now()) or an ISO timestamp for any `now`
// argument — row timestamps are always ISO, so a caller comparing against a
// row-shaped value should not have to convert it first.
function toMs(now) {
  if (typeof now === 'number') return now
  if (now instanceof Date) return now.getTime()
  if (typeof now === 'string') return Date.parse(now)
  return Date.now()
}

// ─── addressing (CONTRACT §2) ───────────────────────────────────────────────

/** Pinned exactly, both directions — reversible so `stuck` can round-trip the real addressee. */
export function slugForAddressee(to) {
  return to.replace(
    /[^A-Za-z0-9._-]/g,
    (ch) => '_' + ch.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')
  )
}

export function unslugAddressee(slug) {
  return slug.replace(/_([0-9A-F]{2})/g, (_m, h) => String.fromCharCode(parseInt(h, 16)))
}

export function inboxPath(to) {
  return join(TOWER, 'objects', slugForAddressee(to), 'inbox.jsonl')
}

function addresseeRefusalReason(to) {
  if (typeof to !== 'string' || !to) return `bad-addressee: ${to}`
  if (to.startsWith('agent:')) return 'agent: scheme not yet implemented'
  if (to.startsWith('pane:') || to.startsWith('operator:') || to.startsWith('role:')) return null
  return `bad-addressee: ${to}`
}

// ─── completion evidence (CONTRACT §5, DESIGN §6a) ──────────────────────────

function hasCompletionEvidence(evidence) {
  if (!evidence || typeof evidence !== 'object') return false
  if (evidence.status === 'done') return true
  if (typeof evidence.done_marker === 'string' && evidence.done_marker && existsSync(evidence.done_marker)) return true
  if (typeof evidence.work_done_ref === 'string' && evidence.work_done_ref.trim()) return true
  if (typeof evidence.verdict_token === 'string' && evidence.verdict_token.trim()) return true
  return false
}

// ─── the deposit door (CONTRACT §4) ─────────────────────────────────────────

function generateDepositId() {
  const ms = Date.now().toString(36)
  const rand = Math.random().toString(36).slice(2, 6)
  return `dep-${ms}-${rand}`
}

function refuse(reason, ctx) {
  deadLetter({ id: mintLedgerId(), deposit_id: null, ...ctx }, reason)
  return { deposit_id: null, accepted: false, reason }
}

export function deposit({ to, kind, body, from, ref = null, ttl_s = null, evidence = {}, nq = null } = {}) {
  const ctx = { to, kind, body, from, ref }

  const addrReason = addresseeRefusalReason(to)
  if (addrReason) return refuse(addrReason, ctx)

  if (!ALLOWED_KINDS.has(kind)) return refuse(`unknown-kind: ${kind}`, ctx)

  if (from == null || String(from).trim() === '') return refuse('unauthored', ctx)

  if (body == null || String(body).trim() === '') return refuse('empty-body', ctx)

  if (STATUS_PLANE_KINDS.has(kind) && to.startsWith('operator:')) {
    return refuse('status-is-not-mail', ctx)
  }

  // CONTRACT §6c: refuse only when the caller told us nq exceeds the budget.
  // nq absent (null/undefined) means the door was not told a budget and must
  // not invent one — silently eating a legitimate question is the failure
  // mode this unit exists to remove.
  if (kind === 'question' && typeof nq === 'number' && nq > NQ_BUDGET) {
    return refuse('nq-exhausted', ctx)
  }

  if (kind === 'completion' && !hasCompletionEvidence(evidence)) {
    return refuse('no-completion-evidence: idle is not done', ctx)
  }

  const deposit_id = generateDepositId()
  const now = new Date().toISOString()
  const row = {
    deposit_id,
    ts: now,
    to,
    kind,
    body,
    from,
    ref: ref ?? null,
    ttl_s: ttl_s ?? null,
    evidence: evidence ?? {},
    nq: typeof nq === 'number' ? nq : null,
    state: 'queued',
    attempts: 0,
    next_attempt_at: now,
    last_error: null,
    deferred_reason: null,
  }
  append(inboxPath(to), row)
  return { deposit_id, accepted: true, reason: null }
}

// ─── reading and folding the queue (CONTRACT §3, §7) ────────────────────────

export function readInbox(to) {
  return readAllFull(inboxPath(to))
}

function foldedWithCreated(to) {
  const rows = readAllFull(inboxPath(to))
  const map = new Map()
  const created = new Map()
  for (const row of rows) {
    if (!row || typeof row !== 'object' || !row.deposit_id) continue
    if (!created.has(row.deposit_id)) created.set(row.deposit_id, row.ts)
    map.set(row.deposit_id, row)
  }
  return { map, created }
}

/**
 * Map<deposit_id, foldedRow>, last-write-wins. Pinned as `foldInbox` (ORCH
 * ruling, CONTRACT §6b) — the name `inboxState` collides with
 * tower-ledger.mjs's pre-existing `inboxState(cwd)` (ledger-plane, live-
 * consumed by cli.mjs/server.mjs).
 */
export function foldInbox(to) {
  return foldedWithCreated(to).map
}

export function listInboxes() {
  const objectsDir = join(TOWER, 'objects')
  if (!existsSync(objectsDir)) return []
  return readdirSync(objectsDir)
    .filter((slug) => existsSync(join(objectsDir, slug, 'inbox.jsonl')))
    .map((slug) => ({ to: unslugAddressee(slug), slug, path: join(objectsDir, slug, 'inbox.jsonl') }))
}

function deadLetteredIds() {
  const ids = new Set()
  for (const r of readDeadLetters()) {
    if (r?.deposit_id) ids.add(r.deposit_id)
  }
  return ids
}

/** Folded rows with state 'queued' and next_attempt_at due, excluding anything already dead-lettered. */
export function dueItems(to, now = Date.now()) {
  const nowMs = toMs(now)
  const { map } = foldedWithCreated(to)
  const dlIds = deadLetteredIds()
  const out = []
  for (const row of map.values()) {
    if (dlIds.has(row.deposit_id)) continue
    if (row.state !== 'queued') continue
    if (Date.parse(row.next_attempt_at) > nowMs) continue
    out.push(row)
  }
  return out
}

/** Folded rows not in a terminal state (acked, or already dead-lettered). */
export function pendingItems(to) {
  const { map } = foldedWithCreated(to)
  const dlIds = deadLetteredIds()
  const out = []
  for (const row of map.values()) {
    if (dlIds.has(row.deposit_id)) continue
    if (row.state === 'acked') continue
    out.push(row)
  }
  return out
}

// ─── state transitions (CONTRACT §7) ────────────────────────────────────────

function currentRow(to, depositId) {
  const { map } = foldedWithCreated(to)
  const row = map.get(depositId)
  if (!row) throw new Error(`no such deposit: ${depositId}`)
  return row
}

function appendTransition(to, depositId, patch) {
  const row = currentRow(to, depositId)
  const next = { ...row, ...patch, ts: new Date().toISOString() }
  append(inboxPath(to), next)
  return next
}

export function markDelivering(to, ids) {
  for (const depositId of ids) appendTransition(to, depositId, { state: 'delivering', deferred_reason: null })
}

export function markDelivered(to, ids) {
  for (const depositId of ids) appendTransition(to, depositId, { state: 'delivered', deferred_reason: null })
}

export function markAcked(to, ids) {
  for (const depositId of ids) appendTransition(to, depositId, { state: 'acked', deferred_reason: null })
}

/**
 * CONTRACT §6a AMENDMENT — deferral is not failure. A busy target (already
 * `working`, or paced) is a DEFER, never a requeue: attempts is left
 * untouched so a healthy-but-busy addressee can never march to MAX_ATTEMPTS
 * and be dead-lettered for being busy. Sets next_attempt_at into the future
 * (CONTRACT §6c: nextAttemptAt if the caller supplies one — e.g. paceGate's
 * decision — else now + DEFER_RETRY_SECONDS) and returns the item to
 * `queued` — a future time, never a terminal state. deferred_reason is the
 * sole marker of a deferral (ORCH ruling): a deferred item is exactly
 * (state === 'queued' AND deferred_reason non-null). last_error is cleared
 * here (CONTRACT §6c cause 4): last_error and deferred_reason are never
 * written by the same event.
 */
export function markDeferred(to, ids, reason, nextAttemptAt) {
  const nextAt = nextAttemptAt ?? new Date(Date.now() + DEFER_RETRY_SECONDS * 1000).toISOString()
  for (const depositId of ids) {
    appendTransition(to, depositId, {
      state: 'queued',
      next_attempt_at: nextAt,
      deferred_reason: reason,
      last_error: null,
    })
  }
}

/**
 * Genuine delivery failure only (CONTRACT §6a: requeue is now exclusively for
 * a reachable target where delivery was attempted and demonstrably did not
 * land). attempts += 1; on exhaustion, dead-letters instead of writing a
 * queue state (CONTRACT §3: terminal-by-policy is a dead-letter row, never a
 * queue state). deferred_reason is cleared to null here — last_error and
 * deferred_reason are never written by the same event, so a stale deferral
 * reason can never sit on a row that is actually failing.
 */
export function requeue(to, id, error) {
  const row = currentRow(to, id)
  const attempts = (row.attempts || 0) + 1
  if (attempts >= MAX_ATTEMPTS) {
    const reason = `undeliverable after ${attempts} attempts: ${error}`
    deadLetterOnce(
      { id: row.deposit_id, deposit_id: row.deposit_id, to: row.to, kind: row.kind, body: row.body, from: row.from, ref: row.ref },
      reason
    )
    return { deposit_id: row.deposit_id, dead_lettered: true, reason }
  }
  const backoffS = Math.min(2 ** attempts, 300)
  const nextAt = new Date(Date.now() + backoffS * 1000).toISOString()
  appendTransition(to, id, {
    state: 'queued',
    attempts,
    next_attempt_at: nextAt,
    last_error: String(error),
    deferred_reason: null,
  })
  return { deposit_id: row.deposit_id, dead_lettered: false }
}

/** Dead-letters items whose ttl_s has elapsed since their first (creation) row. */
export function expireTtl(to, now = Date.now()) {
  const nowMs = toMs(now)
  const { map, created } = foldedWithCreated(to)
  const dlIds = deadLetteredIds()
  const expired = []
  for (const [depositId, row] of map) {
    if (row.state === 'acked') continue
    if (dlIds.has(depositId)) continue
    if (row.ttl_s == null) continue
    const createdMs = Date.parse(created.get(depositId))
    if (nowMs - createdMs >= row.ttl_s * 1000) {
      deadLetterOnce(
        { id: depositId, deposit_id: depositId, to: row.to, kind: row.kind, body: row.body, from: row.from, ref: row.ref },
        'ttl-expired'
      )
      expired.push(depositId)
    }
  }
  return expired
}

/**
 * CONTRACT §6d — a third, distinct cause of a return to `queued`, alongside
 * deferral and pace. A 'delivering' row whose courier never came back (crash,
 * kill, restart) is neither delivered nor dead-lettered — the exact third
 * outcome the whole design forbids. Reclaim returns it to `queued` with
 * next_attempt_at = now so the next drain takes it. It burns NO attempt (the
 * message was never proven undelivered — the courier died, not the
 * delivery) and sets NEITHER last_error NOR deferred_reason (a third,
 * distinct cause must not borrow either field's meaning — same reasoning as
 * §6a rule 3).
 */
export function reclaimLeases(to, now = Date.now()) {
  const nowMs = toMs(now)
  const { map } = foldedWithCreated(to)
  const reclaimed = []
  for (const [depositId, row] of map) {
    if (row.state !== 'delivering') continue
    const leaseMs = Date.parse(row.ts)
    if (nowMs - leaseMs >= LEASE_TIMEOUT_SECONDS * 1000) {
      appendTransition(to, depositId, { state: 'queued', next_attempt_at: new Date(nowMs).toISOString() })
      reclaimed.push(depositId)
    }
  }
  return reclaimed
}

/**
 * Decision only — never mutates a message into a terminal state (CONTRACT
 * §7). Governs interruption frequency per addressee: allowed iff no delivery
 * attempt (delivering/delivered) landed within the last PACE_WINDOW_SECONDS.
 * Callers apply the decision by pushing next_attempt_at (e.g. via
 * markDeferred).
 */
export function paceGate(to, now = Date.now()) {
  const nowMs = toMs(now)
  const { map } = foldedWithCreated(to)
  let lastAttemptMs = -Infinity
  for (const row of map.values()) {
    if (row.state === 'delivering' || row.state === 'delivered') {
      const ts = Date.parse(row.ts)
      if (ts > lastAttemptMs) lastAttemptMs = ts
    }
  }
  if (lastAttemptMs === -Infinity || nowMs - lastAttemptMs >= PACE_WINDOW_SECONDS * 1000) {
    return { allowed: true, next_attempt_at: new Date(nowMs).toISOString() }
  }
  return { allowed: false, next_attempt_at: new Date(lastAttemptMs + PACE_WINDOW_SECONDS * 1000).toISOString() }
}
