// Tower ledger grammar — canonical source (agent-core store).
// Consumed by ~/.tower/lib.mjs (re-export), CC hooks, and pi extensions.
// Pure functions over append-only JSONL; no listeners, no mkdir side effects.

import { appendFileSync, readFileSync, existsSync, realpathSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { homedir } from 'node:os'
import { execFileSync } from 'node:child_process'

export const TOWER = join(homedir(), '.tower')
export const LEDGER = join(TOWER, 'ledger.jsonl')
export const BOARD = join(TOWER, 'board.jsonl')
export const DELIVERABLES = join(TOWER, 'deliverables')
export const ODOMETER = join(TOWER, 'odometer.jsonl')
export const FLIGHT = join(TOWER, 'flight')

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
export const append = (file, obj) => appendFileSync(file, JSON.stringify(obj) + '\n')

export function readAll(file) {
  if (!existsSync(file)) return []
  return readFileSync(file, 'utf-8')
    .split('\n')
    .filter(Boolean)
    .map((l) => {
      try {
        return JSON.parse(l)
      } catch {
        return null
      }
    })
    .filter(Boolean)
}

// Derived inbox state for a cwd (or all cwds when falsy). Acks and answers are
// themselves ledger rows — the ledger is never rewritten.
export function inboxState(cwd) {
  const scope = cwd ? normCwd(cwd) : null
  const all = readAll(LEDGER)
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
  const openQuestions = rows.filter((r) => r.kind === 'question' && !answeredIds.has(r.id))
  const progress = rows.filter((r) => r.kind === 'progress')
  return { unrelayed, openQuestions, answers, progress, all: rows }
}

export function boardFor(cwd, { topic, limit } = {}) {
  const scope = normCwd(cwd)
  let rows = readAll(BOARD).filter((r) => normCwd(r.cwd ?? '') === scope)
  if (topic) rows = rows.filter((r) => r.topic === topic)
  return rows.slice(-(limit ?? 50))
}

export function renderMessage(m) {
  const head = `Tower ${m.id} · ${m.kind}${m.title ? ` · ${m.title}` : ''} · from ${m.from ?? 'unknown'} · ${m.ts}`
  const opts = m.options?.length ? `\noptions: ${m.options.join(' | ')}` : ''
  return `${head}\n${m.message}${opts}`
}
