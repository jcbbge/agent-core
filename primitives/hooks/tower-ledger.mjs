// Tower ledger grammar — canonical source (agent-core store).
// Consumed by ~/.tower/lib.mjs (re-export), CC hooks, and pi extensions.
// Pure functions over append-only JSONL; no listeners, no mkdir side effects.

import {
  appendFileSync,
  readFileSync,
  writeFileSync,
  writeSync,
  unlinkSync,
  existsSync,
  realpathSync,
  statSync,
  openSync,
  readSync,
  closeSync,
  mkdirSync,
} from 'node:fs'
import { dlopen, FFIType } from 'bun:ffi'
import { join, dirname } from 'node:path'
import { homedir } from 'node:os'
import { execFileSync } from 'node:child_process'

// TOWER_HOME is honored so test fixtures never touch live state (2026-08-14:
// a rotate parity test was silently reading LIVE ~/.tower/cursors — masked
// for a day by stale lock files whose spin-fallback disabled the cursor path).
// Production leaves the env unset; homedir()/.tower is unchanged.
export const TOWER = process.env.TOWER_HOME || join(homedir(), '.tower')
export const LEDGER = join(TOWER, 'ledger.jsonl')
export const BOARD = join(TOWER, 'board.jsonl')
export const PHEROMONES = process.env.TOWER_PHEROMONES_PATH || join(TOWER, 'pheromones.jsonl')
export const DELIVERABLES = join(TOWER, 'deliverables')
export const ODOMETER = join(TOWER, 'odometer.jsonl')
export const FLIGHT = join(TOWER, 'flight')
// COMMS-ARCH.md §Alarm rationalization: malformed questions (rejected at write
// or discovered on read) land here, never in openQuestions.
export const DEAD_LETTER = join(TOWER, 'dead-letter.jsonl')

export const SCENT_TTL_DEFAULTS = {
  'work-available': 1800,
  'work-claimed': 30,
  'work-done': 86400,
  'need-help': 3600,
}

const SCENTS = new Set(Object.keys(SCENT_TTL_DEFAULTS))
const CURSORS = join(TOWER, 'cursors')
const LEDGER_INBOX_CURSOR = join(CURSORS, 'ledger.inbox.cursor.json')
const BOARD_SCOPE_CURSOR = join(CURSORS, 'board.scope.cursor.json')

// Normalize a path for scope comparison — macOS /tmp vs /private/tmp etc.,
// and collapse git worktrees to their main repo's working tree.
const normCwdCache = new Map()
export const normCwd = (p) => {
  const hit = normCwdCache.get(p)
  if (hit !== undefined) return hit
  const r = normCwdUncached(p)
  normCwdCache.set(p, r)
  return r
}

const normCwdUncached = (p) => {
  if (!p) return ''
  let real
  try {
    real = realpathSync(p)
  } catch {
    return p
  }
  try {
    const commonDir = execFileSync(
      'git',
      ['-C', real, 'rev-parse', '--path-format=absolute', '--git-common-dir'],
      { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 2000 }
    ).trim()
    if (commonDir) return realpathSync(dirname(commonDir))
  } catch {
    // not inside a git working tree, or git unavailable — plain realpath stands
  }
  return real
}

export const id = () => `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
const pheromoneId = () => `ph-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`

// Exclusive lock around stringify+append. Prefer flock(2) on the append fd; fall back to
// per-file lockfile if FFI unavailable (same contract, slightly coarser granularity).
const LOCK_EX = 2
const LOCK_UN = 8
let _flock = null
try {
  const libname = process.platform === 'darwin' ? 'libc.dylib' : 'libc.so.6'
  _flock = dlopen(libname, {
    flock: { args: [FFIType.i32, FFIType.i32], returns: FFIType.i32 },
  }).symbols.flock
} catch {
  _flock = null
}

function withAppendLockfile(file, fn) {
  mkdirSync(dirname(file), { recursive: true })
  const lockPath = `${file}.append.lock`
  for (let i = 0; i < 200; i++) {
    try {
      writeFileSync(lockPath, String(process.pid), { flag: 'wx' })
      try {
        return fn()
      } finally {
        try {
          unlinkSync(lockPath)
        } catch {
          /* stale lock */
        }
      }
    } catch {
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 2)
    }
  }
  throw new Error(`append lock timeout: ${file}`)
}

export function append(file, obj) {
  const line = JSON.stringify(obj) + '\n'
  mkdirSync(dirname(file), { recursive: true })
  if (_flock) {
    const fd = openSync(file, 'a')
    try {
      const rc = _flock(fd, LOCK_EX)
      if (rc !== 0) throw new Error(`flock LOCK_EX failed rc=${rc} file=${file}`)
      writeSync(fd, line)
      _flock(fd, LOCK_UN)
    } finally {
      closeSync(fd)
    }
  } else {
    withAppendLockfile(file, () => appendFileSync(file, line))
  }
}

// ─── dead-letter sink (COMMS-ARCH §Alarm rationalization) ───────────────────
// Malformed questions are rejected at emit and skipped on read; either way the
// row is preserved here with a reason, so nothing vanishes silently. A row with
// only id/ts/cwd/kind is malformed, NOT legacy — it never inherits the operator
// fallback and never enters openQuestions.

/** Resolve the sink path. The env override exists for tests; law names ~/.tower/dead-letter.jsonl. */
export function deadLetterPath() {
  return process.env.TOWER_DEAD_LETTER_PATH || DEAD_LETTER
}

/**
 * Validate a question row at emit or read. Returns a reason string when the row
 * is malformed, or null when it is well-formed (or is not a question at all).
 */
export function questionRejectReason(row) {
  if (!row || typeof row !== 'object') return 'question row is not an object'
  if (row.kind !== 'question') return null
  const m = row.message
  if (m == null) return 'question has no message field'
  if (typeof m !== 'string') return `question message is not a string (got ${typeof m})`
  if (!m.trim()) return 'question message is empty or whitespace-only'
  return null
}

// path -> { ids: Set<string>, size, mtimeMs } — keeps read-side dead-lettering
// idempotent without rewriting the append-only sink.
const _dlSeen = new Map()

function dlSeenIds(path) {
  let state = _dlSeen.get(path)
  if (!state) {
    state = { ids: new Set(), size: -1, mtimeMs: -1 }
    _dlSeen.set(path, state)
  }
  if (!existsSync(path)) return state.ids
  let st
  try {
    st = statSync(path)
  } catch {
    return state.ids
  }
  if (st.size !== state.size || st.mtimeMs !== state.mtimeMs) {
    for (const r of readAllFull(path)) if (r?.id) state.ids.add(r.id)
    state.size = st.size
    state.mtimeMs = st.mtimeMs
  }
  return state.ids
}

/** Append a rejected row to the dead-letter sink (flocked). Always writes. */
export function deadLetter(row, reason) {
  const base = row && typeof row === 'object' ? row : { row }
  const entry = { ...base, reason: String(reason), dead_lettered_at: new Date().toISOString() }
  const path = deadLetterPath()
  append(path, entry)
  if (entry.id) dlSeenIds(path).add(entry.id)
  return entry
}

/**
 * Dead-letter a row at most once per id. Returns the appended entry, or null
 * when this id is already in the sink (read side re-walks the same rows forever).
 */
export function deadLetterOnce(row, reason) {
  const path = deadLetterPath()
  const rid = row && typeof row === 'object' ? row.id : undefined
  if (rid && dlSeenIds(path).has(rid)) return null
  return deadLetter(row, reason)
}

/** Rows currently in the dead-letter sink. */
export function readDeadLetters() {
  return readAllFull(deadLetterPath())
}

/**
 * Read-side question gate: malformed question rows are dead-lettered (once) and
 * excluded; well-formed unanswered questions are returned. A sink write must
 * never break an inbox read, so failures here are swallowed.
 */
export function openQuestionRows(rows, answeredIds) {
  const open = []
  for (const r of rows ?? []) {
    if (r?.kind !== 'question') continue
    const reason = questionRejectReason(r)
    if (reason) {
      try {
        deadLetterOnce(r, `read-side: ${reason}`)
      } catch {
        /* sink unavailable — the row still never reaches openQuestions */
      }
      continue
    }
    if (!answeredIds.has(r.id)) open.push(r)
  }
  return open
}

/** Authored fleet-mail rows on board.jsonl — require non-empty from at write time. */
export const AUTHORED_BOARD_TYPES = new Set(['claim', 'finding', 'note'])

/** Machine-plane rows use kind+via (lineage, bypass audit, etc.) — no from, no throw on read. */
export function assertAuthoredBoardFrom(type, from) {
  const t = type ?? 'note'
  if (!AUTHORED_BOARD_TYPES.has(t)) return
  const f = typeof from === 'string' ? from.trim() : ''
  if (!f) throw new Error(`board post refused: authored type "${t}" requires non-empty from`)
}

function pheromoneLive(row, nowMs) {
  const ttl = row.ttl_s ?? SCENT_TTL_DEFAULTS[row.scent] ?? 0
  return nowMs < new Date(row.ts).getTime() + ttl * 1000
}

function normRoute(route) {
  if (!route || typeof route !== 'object') return { to_role: null, to_pane: null, reply_to: null }
  return {
    to_role: route.to_role ?? null,
    to_pane: route.to_pane ?? null,
    reply_to: route.reply_to ?? null,
  }
}

/** Append one pheromone row (§4.2). Validates evidence, scent enum, ref/payload_ref rules. */
export function emitPheromone(cwd, { scent, topic, from, route, ref, payload_ref, evidence, ttl_s }) {
  if (!SCENTS.has(scent)) throw new Error(`invalid scent: ${scent}`)
  if (!evidence || !String(evidence).trim()) throw new Error('evidence required')
  if ((scent === 'work-available' || scent === 'work-done') && !payload_ref) {
    throw new Error(`payload_ref required for ${scent}`)
  }
  if ((scent === 'work-claimed' || scent === 'work-done') && !ref) {
    throw new Error(`ref required for ${scent}`)
  }
  const row = {
    id: pheromoneId(),
    ts: new Date().toISOString(),
    cwd,
    topic,
    from: from ?? null,
    scent,
    route: normRoute(route),
    ref: ref ?? null,
    payload_ref: payload_ref ?? null,
    evidence: String(evidence),
    ttl_s: ttl_s ?? SCENT_TTL_DEFAULTS[scent],
  }
  append(PHEROMONES, row)
  return row
}

/** Pure §4.4 field derivation over synthetic rows (tests + scan annotations). */
export function pheromoneFieldFromRows(cwd, rows, { topic, now } = {}) {
  const scope = normCwd(cwd)
  const nowMs = now == null ? Date.now() : typeof now === 'number' ? now : new Date(now).getTime()
  let scoped = rows.filter((r) => normCwd(r.cwd ?? '') === scope)
  if (topic) scoped = scoped.filter((r) => r.topic === topic)

  const doneRefs = new Set(
    scoped.filter((r) => r.scent === 'work-done' && r.ref).map((r) => r.ref)
  )

  const liveClaims = new Map()
  for (const r of scoped) {
    if (r.scent !== 'work-claimed' || !r.ref || !pheromoneLive(r, nowMs)) continue
    const prev = liveClaims.get(r.ref)
    if (!prev || new Date(r.ts).getTime() > new Date(prev.ts).getTime()) liveClaims.set(r.ref, r)
  }

  const open = []
  const claimed = []
  const done = []
  const evaporated = []
  const help = scoped.filter((r) => r.scent === 'need-help' && pheromoneLive(r, nowMs))

  for (const av of scoped.filter((r) => r.scent === 'work-available')) {
    if (doneRefs.has(av.id)) {
      done.push(av)
    } else if (liveClaims.has(av.id)) {
      claimed.push(av)
    } else {
      const ttlMs = (av.ttl_s ?? SCENT_TTL_DEFAULTS['work-available']) * 1000
      if (nowMs >= new Date(av.ts).getTime() + ttlMs) evaporated.push(av)
      else open.push(av)
    }
  }

  return { open, claimed, done, evaporated, help }
}

// Full-file read is fine; cursor machinery can be added later mirroring boardFor if volume demands.
export function pheromoneField(cwd, { topic, now } = {}) {
  return pheromoneFieldFromRows(cwd, readAllFull(PHEROMONES), { topic, now })
}

/** Parse JSONL text — tolerate bad lines and surface counts (T3). */
export function parseJsonl(text) {
  const lines = text.split('\n').filter(Boolean)
  const rows = []
  const bad_line_numbers = []
  for (let i = 0; i < lines.length; i++) {
    try {
      rows.push(JSON.parse(lines[i]))
    } catch {
      bad_line_numbers.push(i + 1)
    }
  }
  return { rows, bad_line_count: bad_line_numbers.length, bad_line_numbers }
}

const parseLines = (text) => parseJsonl(text).rows

/** Full-file parse with integrity stats — rows exclude unparseable lines. */
export function readJsonlStats(file) {
  if (!existsSync(file)) return { rows: [], bad_line_count: 0, bad_line_numbers: [] }
  return parseJsonl(readFileSync(file, 'utf-8'))
}

/** Full-file parse — reference path for differential tests and cursor bypass. */
export function readAllFull(file) {
  return readJsonlStats(file).rows
}

function readTailBytes(file, offset) {
  const st = statSync(file)
  if (st.size <= offset) return ''
  const len = st.size - offset
  const fd = openSync(file, 'r')
  try {
    const buf = Buffer.alloc(len)
    readSync(fd, buf, 0, len, offset)
    return buf.toString('utf-8')
  } finally {
    closeSync(fd)
  }
}

function cursorValid(cursor, st) {
  if (st.size < cursor.offset) return false
  if (cursor.size > 0 && st.size < cursor.size) return false
  if (cursor.mtimeMs > 0 && st.mtimeMs < cursor.mtimeMs) return false
  return true
}

function withCursorLock(lockName, fn, fallback) {
  mkdirSync(CURSORS, { recursive: true })
  const lockPath = join(CURSORS, `${lockName}.lock`)
  for (let i = 0; i < 100; i++) {
    try {
      writeFileSync(lockPath, String(process.pid), { flag: 'wx' })
      try {
        return fn()
      } finally {
        try {
          unlinkSync(lockPath)
        } catch {
          /* stale lock */
        }
      }
    } catch {
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 2)
    }
  }
  return fallback()
}

function loadJsonCursor(path, empty) {
  if (!existsSync(path)) return empty()
  try {
    return JSON.parse(readFileSync(path, 'utf-8'))
  } catch {
    return empty()
  }
}

function saveJsonCursor(path, cursor) {
  mkdirSync(CURSORS, { recursive: true })
  writeFileSync(path, JSON.stringify(cursor))
}

function emptyLedgerInboxCursor() {
  return { offset: 0, size: 0, mtimeMs: 0, acked: [], answeredIds: [], byCwd: {}, allRows: [] }
}

function ingestLedgerRow(cursor, row) {
  if (row.kind === 'ack') {
    for (const id of row.ids ?? []) {
      if (!cursor.acked.includes(id)) cursor.acked.push(id)
    }
  } else if (row.kind === 'answer') {
    if (row.ref && !cursor.answeredIds.includes(row.ref)) cursor.answeredIds.push(row.ref)
  }
  cursor.allRows.push(row)
  const key = normCwd(row.cwd ?? '')
  if (!cursor.byCwd[key]) cursor.byCwd[key] = []
  cursor.byCwd[key].push(row)
}

function syncLedgerInboxCursor() {
  if (!existsSync(LEDGER)) return emptyLedgerInboxCursor()
  return withCursorLock(
    'ledger.inbox',
    () => {
      const st = statSync(LEDGER)
      let cursor = loadJsonCursor(LEDGER_INBOX_CURSOR, emptyLedgerInboxCursor)
      if (!cursorValid(cursor, st)) cursor = emptyLedgerInboxCursor()
      if (st.size > cursor.offset) {
        const tail = readTailBytes(LEDGER, cursor.offset)
        for (const row of parseLines(tail)) ingestLedgerRow(cursor, row)
        cursor.offset = st.size
      }
      cursor.size = st.size
      cursor.mtimeMs = st.mtimeMs
      saveJsonCursor(LEDGER_INBOX_CURSOR, cursor)
      return cursor
    },
    () => {
      const all = readAllFull(LEDGER)
      const cursor = emptyLedgerInboxCursor()
      cursor.offset = existsSync(LEDGER) ? statSync(LEDGER).size : 0
      cursor.size = cursor.offset
      cursor.mtimeMs = existsSync(LEDGER) ? statSync(LEDGER).mtimeMs : 0
      for (const row of all) ingestLedgerRow(cursor, row)
      return cursor
    }
  )
}

function emptyBoardScopeCursor() {
  return { offset: 0, size: 0, mtimeMs: 0, byCwd: {} }
}

function ingestBoardRow(cursor, row) {
  const key = normCwd(row.cwd ?? '')
  if (!cursor.byCwd[key]) cursor.byCwd[key] = []
  cursor.byCwd[key].push(row)
}

function syncBoardScopeCursor() {
  if (!existsSync(BOARD)) return emptyBoardScopeCursor()
  return withCursorLock(
    'board.scope',
    () => {
      const st = statSync(BOARD)
      let cursor = loadJsonCursor(BOARD_SCOPE_CURSOR, emptyBoardScopeCursor)
      if (!cursorValid(cursor, st)) cursor = emptyBoardScopeCursor()
      if (st.size > cursor.offset) {
        const tail = readTailBytes(BOARD, cursor.offset)
        for (const row of parseLines(tail)) ingestBoardRow(cursor, row)
        cursor.offset = st.size
      }
      cursor.size = st.size
      cursor.mtimeMs = st.mtimeMs
      saveJsonCursor(BOARD_SCOPE_CURSOR, cursor)
      return cursor
    },
    () => {
      const all = readAllFull(BOARD)
      const cursor = emptyBoardScopeCursor()
      cursor.offset = existsSync(BOARD) ? statSync(BOARD).size : 0
      cursor.size = cursor.offset
      cursor.mtimeMs = existsSync(BOARD) ? statSync(BOARD).mtimeMs : 0
      for (const row of all) ingestBoardRow(cursor, row)
      return cursor
    }
  )
}

export function readAll(file) {
  return readAllFull(file)
}

function inboxStateFromFull(cwd) {
  const scope = cwd ? normCwd(cwd) : null
  const all = readAllFull(LEDGER)
  const rows = all.filter((r) => !scope || normCwd(r.cwd ?? '') === scope)
  const acked = new Set(all.filter((r) => r.kind === 'ack').flatMap((r) => r.ids ?? []))
  const answeredIds = new Set(all.filter((r) => r.kind === 'answer').map((r) => r.ref))
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

function deriveInboxState(cursor, cwd) {
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

// Derived inbox state for a cwd (or all cwds when falsy). Acks and answers are
// themselves ledger rows — the ledger is never rewritten.
export function inboxState(cwd) {
  if (process.env.TOWER_LEDGER_NO_CURSOR === '1') return inboxStateFromFull(cwd)
  const cursor = syncLedgerInboxCursor()
  return deriveInboxState(cursor, cwd)
}

function boardForFromFull(cwd, { topic, limit } = {}) {
  const scope = normCwd(cwd)
  let rows = readAllFull(BOARD).filter((r) => normCwd(r.cwd ?? '') === scope)
  if (topic) rows = rows.filter((r) => r.topic === topic)
  return rows.slice(-(limit ?? 50))
}

export function boardFor(cwd, { topic, limit } = {}) {
  if (process.env.TOWER_LEDGER_NO_CURSOR === '1') return boardForFromFull(cwd, { topic, limit })
  const scope = normCwd(cwd)
  const cursor = syncBoardScopeCursor()
  let rows = cursor.byCwd[scope] ?? []
  if (topic) rows = rows.filter((r) => r.topic === topic)
  return rows.slice(-(limit ?? 50))
}

export function renderMessage(m) {
  const head = `Tower ${m.id} · ${m.kind}${m.title ? ` · ${m.title}` : ''} · from ${m.from ?? 'unknown'} · ${m.ts}`
  const opts = m.options?.length ? `\noptions: ${m.options.join(' | ')}` : ''
  return `${head}\n${m.message}${opts}`
}

// Reference exports for differential tests
export const _test = {
  inboxStateFromFull,
  boardForFromFull,
  syncLedgerInboxCursor,
  syncBoardScopeCursor,
  pheromoneFieldFromRows,
}
