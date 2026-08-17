#!/usr/bin/env bun
// twr.ts — read-only viewer for one project's Tower messages (styled tail -f).
// Usage: bun twr.ts <project-root> [--interval <ms>] [--limit <n>] [--once]
// Writes NOTHING. Scoping is a topic-prefix convention ("<project>/") shared
// with statem.ts — see statem.ts's "plumbing" comment for why.
import { realpathSync } from 'node:fs'
import { basename } from 'node:path'
import { open } from '../../tower/tower.mjs'

const argv = process.argv.slice(2)
const rootArg = argv[0]
if (!rootArg || rootArg.startsWith('--')) {
  console.error('usage: bun twr.ts <project-root> [--interval <ms>] [--limit <n>] [--once]')
  process.exit(1)
}
const opt = (name: string, dflt: string) => {
  const i = argv.indexOf(name)
  return i > 0 && argv[i + 1] ? argv[i + 1] : dflt
}
const ROOT = realpathSync(rootArg)
const PROJECT = basename(ROOT)
const ONCE = argv.includes('--once')
const interval = Number(opt('--interval', '2000'))
const limit = Number(opt('--limit', '0')) // 0 = per-section defaults
const LIM = { transitions: limit || 10, findings: limit || 5, questions: limit || 5 }

const BOLD = '\x1b[1m', DIM = '\x1b[2m', RESET = '\x1b[0m'
const width = () => process.stdout.columns || 100
const hhmm = (ts: number) => {
  const d = new Date(ts)
  return isNaN(d.getTime()) ? '??:??'
    : `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
const oneline = (s: unknown) => String(s ?? '').replace(/\r?\n/g, ' · ')
const clip = (s: string) => (s.length > width() ? s.slice(0, width() - 1) + '…' : s)
const rule = (label: string) =>
  DIM + `─ ${label} ` + '─'.repeat(Math.max(0, width() - label.length - 3)) + RESET

const db = await open()
const PREFIX = `${PROJECT}/%`

async function scoped(): Promise<any[]> {
  return db.all(`SELECT * FROM msg WHERE topic LIKE ? ORDER BY id`, PREFIX)
}

// Open = body mentions QUESTION with no later same-topic row saying RULING/ANSWER.
const openQuestions = (rows: any[]) =>
  rows.filter((r, i) =>
    /question/i.test(r.body ?? '') &&
    !rows.slice(i + 1).some((l) => l.topic === r.topic && /ruling|answer/i.test(l.body ?? '')))

function render(rows: any[]) {
  const head = `TOWR ${PROJECT}`
  const clock = new Date().toTimeString().slice(0, 8)
  const lines = [BOLD + head + RESET + ' '.repeat(Math.max(1, width() - head.length - clock.length)) + clock]
  const section = (label: string, items: any[], fmt: (r: any) => string) => {
    lines.push(rule(label))
    if (!items.length) lines.push(DIM + '  (none)' + RESET)
    for (const r of items) lines.push(clip(fmt(r)))
  }
  // Transitions are rows written BY statem (sender starts with statem@), not
  // rows merely on its topic — orchestrator prose shares the topic prefix and
  // belongs in FINDINGS.
  const bySt = (r: any) => String(r.sender ?? '').startsWith('statem@')
  section('TRANSITIONS', rows.filter(bySt).slice(-LIM.transitions),
    (r) => `${hhmm(r.ts)}  ${oneline(r.body)}`)
  section('FINDINGS', rows.filter((r) => !bySt(r)).slice(-LIM.findings),
    (r) => `${hhmm(r.ts)}  ${r.sender ?? '?'} · ${r.topic ?? '?'} · ${oneline(r.body)}`)
  section('OPEN QUESTIONS', openQuestions(rows).slice(-LIM.questions),
    (r) => `${hhmm(r.ts)}  ${r.sender ?? '?'} · ${oneline(r.body)}`)
  const check = db.get(`PRAGMA integrity_check`)?.integrity_check ?? 'unknown'
  lines.push(DIM + `integrity: ${check}` + RESET)
  process.stdout.write('\x1b[2J\x1b[H' + lines.join('\n') + '\n')
}

// Redraw only on change: cheap (row count, newest row id) signature — no full
// query when nothing under this project's prefix has moved.
let sig = ''
async function tick() {
  const stat = db.get(
    `SELECT COUNT(*) c, COALESCE(MAX(id), 0) hi FROM msg WHERE topic LIKE ?`, PREFIX,
  )
  const next = `${stat.c}:${stat.hi}`
  if (next === sig) return
  sig = next
  render(await scoped())
}
await tick()
if (ONCE) process.exit(0)
setInterval(() => {
  tick().catch((e) => console.error(`twr: tick error: ${e.message}`))
}, interval)
