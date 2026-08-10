#!/usr/bin/env bun
// twr.ts — read-only viewer for one project's Tower board (styled tail -f).
// Usage: bun twr.ts <project-root> [--board <path>] [--interval <ms>] [--limit <n>]
// Writes NOTHING. Scoping comes from ~/.tower/lib.mjs (boardFor / normCwd) —
// the one canonical implementation, including git-worktree collapse.
import { readFileSync } from 'node:fs'
import { boardFor, readAll, normCwd, BOARD } from '/Users/jrg/.tower/lib.mjs'

const argv = process.argv.slice(2)
const root = argv[0]
if (!root || root.startsWith('--')) {
  console.error('usage: bun twr.ts <project-root> [--board <path>] [--interval <ms>] [--limit <n>]')
  process.exit(1)
}
const opt = (name: string, dflt: string) => {
  const i = argv.indexOf(name)
  return i > 0 && argv[i + 1] ? argv[i + 1] : dflt
}
const boardPath = opt('--board', BOARD)
const interval = Number(opt('--interval', '2000'))
const limit = Number(opt('--limit', '0')) // 0 = per-section defaults
const LIM = { transitions: limit || 10, findings: limit || 5, questions: limit || 5 }

const BOLD = '\x1b[1m', DIM = '\x1b[2m', RESET = '\x1b[0m'
const width = () => process.stdout.columns || 100
const hhmm = (ts: string) => {
  const d = new Date(ts)
  return isNaN(d.getTime()) ? '??:??'
    : `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
const oneline = (s: unknown) => String(s ?? '').replace(/\r?\n/g, ' · ')
const clip = (s: string) => (s.length > width() ? s.slice(0, width() - 1) + '…' : s)
const rule = (label: string) =>
  DIM + `─ ${label} ` + '─'.repeat(Math.max(0, width() - label.length - 3)) + RESET

// boardFor reads the fixed BOARD path; for a --board override (self-test
// fixtures) filter with the same exported normCwd — no scoping drift.
const scoped = () =>
  boardPath === BOARD
    ? boardFor(root, { limit: 1e9 })
    : readAll(boardPath).filter((r: any) => normCwd(r.cwd ?? '') === normCwd(root))

// Open = body mentions QUESTION with no later same-topic row saying RULING/ANSWER.
const openQuestions = (rows: any[]) =>
  rows.filter((r, i) =>
    /question/i.test(r.body ?? '') &&
    !rows.slice(i + 1).some((l) => l.topic === r.topic && /ruling|answer/i.test(l.body ?? '')))

function render(rows: any[]) {
  const name = root.replace(/\/+$/, '').split('/').pop()
  const head = `TOWR ${name}`
  const clock = new Date().toTimeString().slice(0, 8)
  const lines = [BOLD + head + RESET + ' '.repeat(Math.max(1, width() - head.length - clock.length)) + clock]
  const section = (label: string, items: any[], fmt: (r: any) => string) => {
    lines.push(rule(label))
    if (!items.length) lines.push(DIM + '  (none)' + RESET)
    for (const r of items) lines.push(clip(fmt(r)))
  }
  // Transitions are rows written BY statem (from statem@*), not rows merely on
  // its topic — orchestrator prose shares the topic and belongs in FINDINGS.
  const bySt = (r: any) => String(r.from ?? '').startsWith('statem@')
  section('TRANSITIONS', rows.filter(bySt).slice(-LIM.transitions),
    (r) => `${hhmm(r.ts)}  ${oneline(r.body)}`)
  section('FINDINGS', rows.filter((r) => !bySt(r)).slice(-LIM.findings),
    (r) => `${hhmm(r.ts)}  ${r.from ?? '?'} · ${r.topic ?? '?'} · ${oneline(r.body)}`)
  section('OPEN QUESTIONS', openQuestions(rows).slice(-LIM.questions),
    (r) => `${hhmm(r.ts)}  ${r.from ?? '?'} · ${oneline(r.body)}`)
  process.stdout.write('\x1b[2J\x1b[H' + lines.join('\n') + '\n')
}

// Redraw only on change: cheap raw read → (line count, newest row id) signature.
let sig = ''
const tick = () => {
  let raw: string
  try {
    raw = readFileSync(boardPath, 'utf-8')
  } catch {
    if (sig !== 'ERR') process.stdout.write(`twr: cannot read ${boardPath} — waiting…\n`)
    sig = 'ERR'
    return
  }
  const rows = raw.split('\n').filter(Boolean)
  let lastId = ''
  try { lastId = JSON.parse(rows[rows.length - 1] ?? '{}').id ?? '' } catch {}
  const next = `${rows.length}:${lastId}`
  if (next === sig) return
  sig = next
  render(scoped())
}
tick()
setInterval(tick, interval)
