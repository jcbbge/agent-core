#!/usr/bin/env bun
// Tower CLI — human- and command-facing view of the bus.
//
//   bun ~/.tower/cli.mjs status   — counts + pending items for this cwd
//   bun ~/.tower/cli.mjs inbox    — full pending messages/questions, verbatim
//   bun ~/.tower/cli.mjs board    — blackboard for this cwd
//   bun ~/.tower/cli.mjs post <claim|finding|note> <topic> "<body>" [--from <name>]
//                                 — append a board row (fleet agents on any
//                                   harness; the ONLY sanctioned non-MCP write)
//   bun ~/.tower/cli.mjs emit <scent> <topic> <payload_ref> [--ref id] [--evidence path] ...
//   bun ~/.tower/cli.mjs field [--topic t] [--json]
//   bun ~/.tower/cli.mjs scan [--topic t] [--json]
//   bun ~/.tower/cli.mjs burn     — fleet token burn (today, by session)
//   bun ~/.tower/cli.mjs all      — status + inbox + board combined
//   bun ~/.tower/cli.mjs projects — every project drawer with pending inbox
//
// Used by the /tower command (dynamic context injection) and directly by the
// developer from any terminal.

import { inboxState, renderMessage, readAll, boardFor, normCwd, BOARD, ODOMETER, emitPheromone, pheromoneField, pheromoneFieldFromRows, readAllFull, PHEROMONES, ledgerInboxCursor, deriveInboxStateFromCursor, assertAuthoredBoardFrom, append, readJsonlStats } from './lib.mjs'

// ─── defensive JSONL field access (rows are append-only, partial rows happen) ─
function preview(value, max = 100) {
  if (value == null || value === '') return '(no message)'
  const s = String(value)
  return s.length > max ? s.slice(0, max) : s
}

function rowPreview(row, max = 100) {
  return preview(row?.message ?? row?.title ?? row?.body, max)
}

function dayOf(ts) {
  return typeof ts === 'string' && ts.length >= 10 ? ts.slice(0, 10) : ''
}

function timeOf(ts) {
  return typeof ts === 'string' && ts.length >= 19 ? ts.slice(11, 19) : '??:??:??'
}

function main() {
const cmd = process.argv[2] ?? 'status'
const cwd = process.cwd()

// ─── project cabinet helpers (used by `projects` command) ──────────────────────
const basename = (p) => p.split('/').filter(Boolean).pop() || p

// Scan ~ for project drawers: dirs with .madewell/ or .rumen/ (the cabinet).
// Returns [{ slug, cwd, stage, rumen }]. Slug = dir basename.
// Sweeps one level deep under ~ and ~/infinity (the two known project roots).
function scanProjects() {
  const { readdirSync, existsSync, readFileSync } = require('node:fs')
  const { join } = require('node:path')
  const home = require('node:os').homedir()
  const roots = [home, join(home, 'infinity')]
  const out = []
  for (const root of roots) {
    let entries = []
    try { entries = readdirSync(root, { withFileTypes: true }) } catch { continue }
    for (const e of entries) {
      if (!e.isDirectory() || e.name.startsWith('.')) continue
      const c = join(root, e.name)
      const hasMw = existsSync(join(c, '.madewell', 'madewell.json'))
      const hasRumen = existsSync(join(c, '.rumen'))
      if (!hasMw && !hasRumen) continue
      let stage = null
      if (hasMw) {
        try { stage = JSON.parse(readFileSync(join(c, '.madewell', 'madewell.json'), 'utf-8')).stage ?? null } catch {}
      }
      out.push({ slug: e.name, cwd: c, stage, rumen: hasRumen })
    }
  }
  return out
}

const SCRATCH_CWD = /^\/(private\/)?(tmp|var\/folders)(\/|$)/.test(cwd) || cwd.includes('/scratchpad/')

function parseFlags(args) {
  const out = { _: [] }
  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (a === '--from') { out.from = args[++i]; continue }
    if (a === '--ref') { out.ref = args[++i]; continue }
    if (a === '--to-role') { out.to_role = args[++i]; continue }
    if (a === '--to-pane') { out.to_pane = args[++i]; continue }
    if (a === '--reply-to') { out.reply_to = args[++i]; continue }
    if (a === '--evidence') { out.evidence = args[++i]; continue }
    if (a === '--ttl') { out.ttl = Number(args[++i]); continue }
    if (a === '--topic') { out.topic = args[++i]; continue }
    if (a === '--json') { out.json = true; continue }
    out._.push(a)
  }
  return out
}

function ttlRemaining(row, nowMs = Date.now()) {
  const ttl = row.ttl_s ?? 0
  const start = new Date(row.ts ?? 0).getTime()
  if (!Number.isFinite(start)) return 0
  return Math.max(0, Math.round((start + ttl * 1000 - nowMs) / 1000))
}

function availabilityState(av, field) {
  if (field.done.some((r) => r.id === av.id)) return 'done'
  if (field.claimed.some((r) => r.id === av.id)) return 'claimed'
  if (field.evaporated.some((r) => r.id === av.id)) return 'evaporated'
  if (field.open.some((r) => r.id === av.id)) return 'open'
  return 'unknown'
}

if (cmd === 'status') {
  const { unrelayed, openQuestions, progress } = inboxState(cwd)
  const recent = progress.slice(-3)
  console.log(`Tower @ ${cwd}`)
  console.log(`  unrelayed: ${unrelayed.length} · open questions: ${openQuestions.length} · progress beacons (all time): ${progress.length}`)
  for (const m of unrelayed) console.log(`  ! ${m.id} ${m.kind}${m.title ? ` "${m.title}"` : ''} from ${m.from ?? '?'}`)
  for (const q of openQuestions) console.log(`  ? ${q.id ?? '?'} from ${q.from ?? '?'}: ${rowPreview(q)}`)
  for (const p of recent) console.log(`  · [${p.from ?? '?'}] ${rowPreview(p)}`)
  const today = new Date().toISOString().slice(0, 10)
  const spends = readAll(ODOMETER).filter((r) => dayOf(r.ts) === today)
  if (spends.length > 0) {
    const tok = spends.reduce((s, r) => s + (r.tokens ?? 0), 0)
    console.log(`  burn today: ${spends.length} spawn(s) · ${Math.round(tok / 1000)}k subagent tokens (cli.mjs burn for detail)`)
  }
  const integrity = readJsonlStats(BOARD)
  if (integrity.bad_line_count > 0) {
    const maxBad = integrity.bad_line_numbers.length ? Math.max(...integrity.bad_line_numbers) : '?'
    console.log(`integrity: ${integrity.bad_line_count} unparseable line(s) on board (max bad line ${maxBad})`)
  } else {
    console.log('integrity: 0 unparseable lines on board')
  }
} else if (cmd === 'inbox') {
  const { unrelayed, openQuestions } = inboxState(cwd)
  if (unrelayed.length === 0 && openQuestions.length === 0) console.log('Inbox clear.')
  for (const m of [...unrelayed, ...openQuestions]) console.log(renderMessage(m) + '\n')
} else if (cmd === 'board') {
  // Optional topic filter (F9). Empty/omitted argv → project-wide listing.
  const topicArg = process.argv[3]
  const topic = topicArg && String(topicArg).trim() ? String(topicArg).trim() : undefined
  const rows = boardFor(cwd, topic ? { topic } : undefined)
  if (rows.length === 0) console.log('Board empty for this project.')
  for (const r of rows) console.log(`[${r.ts ?? '?'}] (${r.type ?? r.kind ?? '?'}) ${r.from ?? '?'} @ ${r.topic ?? '?'}: ${rowPreview(r)}`)
  const integrity = readJsonlStats(BOARD)
  if (integrity.bad_line_count > 0) {
    const maxBad = integrity.bad_line_numbers.length ? Math.max(...integrity.bad_line_numbers) : '?'
    console.log(`integrity: ${integrity.bad_line_count} unparseable line(s) on board (max bad line ${maxBad})`)
  } else {
    console.log('integrity: 0 unparseable lines on board')
  }
} else if (cmd === 'post') {
  // Fleet write path for harnesses without the Tower MCP (pi panes, plain
  // shells). Same row schema the MCP writes; refuses scratch cwds like the
  // MCP does. Added 2026-08-11 after workers hand-rolled broken JSONL.
  const args = process.argv.slice(3)
  let from = process.env.TOWER_FROM ?? null
  const fi = args.indexOf('--from')
  if (fi !== -1) { from = args[fi + 1]; args.splice(fi, 2) }
  const [type, topic, ...bodyParts] = args
  const body = bodyParts.join(' ').trim()
  if (!['claim', 'finding', 'note'].includes(type) || !topic || !body) {
    console.error('usage: cli.mjs post <claim|finding|note> <topic> "<body>" [--from <name>]')
    process.exit(2)
  }
  if (/^\/(private\/)?(tmp|var\/folders)(\/|$)/.test(cwd)) {
    console.error('post refused: run from a real repo cwd, not scratch/temp')
    process.exit(2)
  }
  const fromResolved = from ?? `cli:${process.env.USER ?? 'unknown'}`
  assertAuthoredBoardFrom(type, fromResolved)
  const row = {
    id: `cli-${crypto.randomUUID()}`,
    ts: new Date().toISOString(),
    cwd,
    type,
    from: String(fromResolved).trim(),
    topic,
    body,
  }
  // BOARD is homedir-anchored (tower-ledger.mjs:24), exactly as every read path is.
  // Never resolve state relative to import.meta.url: this file is symlinked from
  // ~/.tower/ into the canonical repo, so a file-relative path writes posts into the
  // git working tree instead of the live bus — silently, with no error.
  append(BOARD, row)
  console.log(`posted ${row.id} (${type}) @ ${topic}`)
} else if (cmd === 'emit') {
  if (SCRATCH_CWD) {
    console.error('emit refused: run from a real repo cwd, not scratch/temp')
    process.exit(2)
  }
  const f = parseFlags(process.argv.slice(3))
  const [scent, topic, payload_ref] = f._
  if (!scent || !topic) {
    console.error('usage: cli.mjs emit <scent> <topic> <payload_ref> [--ref id] [--to-role r] [--to-pane p] [--reply-to id] [--evidence path] [--ttl N] [--from name]')
    process.exit(2)
  }
  try {
    const row = emitPheromone(cwd, {
      scent,
      topic,
      from: f.from ?? process.env.TOWER_FROM ?? `cli:${process.env.USER ?? 'unknown'}`,
      route: { to_role: f.to_role ?? null, to_pane: f.to_pane ?? null, reply_to: f.reply_to ?? null },
      ref: f.ref ?? null,
      payload_ref: payload_ref ?? null,
      evidence: f.evidence,
      ttl_s: f.ttl,
    })
    console.log(row.id)
  } catch (err) {
    console.error(String(err?.message ?? err))
    process.exit(2)
  }
} else if (cmd === 'field') {
  const f = parseFlags(process.argv.slice(3))
  const field = pheromoneField(cwd, { topic: f.topic })
  if (f.json) {
    console.log(JSON.stringify(field, null, 2))
  } else {
    console.log(`Pheromone field @ ${cwd}${f.topic ? ` topic=${f.topic}` : ''}`)
    console.log(`  open: ${field.open.length} · claimed: ${field.claimed.length} · done: ${field.done.length} · evaporated: ${field.evaporated.length} · help: ${field.help.length}`)
    const now = Date.now()
    for (const r of field.open) {
      console.log(`  [${r.ts ?? '?'}] ${r.scent ?? '?'} ${r.from ?? '?'} → ${r.payload_ref ?? r.ref ?? '?'} (${ttlRemaining(r, now)}s remaining)`)
    }
  }
} else if (cmd === 'scan') {
  const f = parseFlags(process.argv.slice(3))
  const rows = readAllFull(PHEROMONES).filter((r) => normCwd(r.cwd ?? '') === normCwd(cwd))
  const scoped = f.topic ? rows.filter((r) => r.topic === f.topic) : rows
  const field = pheromoneFieldFromRows(cwd, rows, { topic: f.topic })
  const annotated = scoped.map((r) => {
    let state
    if (r.scent === 'work-available') state = availabilityState(r, field)
    else if (r.scent === 'need-help') state = field.help.some((h) => h.id === r.id) ? 'live' : 'expired'
    else state = ttlRemaining(r) > 0 ? 'live' : 'expired'
    return { ...r, _state: state }
  })
  if (f.json) console.log(JSON.stringify(annotated, null, 2))
  else {
    for (const r of annotated) {
      console.log(`[${r.ts ?? '?'}] (${r.scent ?? '?'}/${r._state ?? '?'}) ${r.from ?? '?'} @ ${r.topic ?? '?'}: ${r.payload_ref ?? r.ref ?? r.evidence ?? '(no payload)'}`)
    }
    if (annotated.length === 0) console.log('No pheromone rows for this scope.')
  }
} else if (cmd === 'burn') {
  const rows = readAll(ODOMETER)
  if (rows.length === 0) {
    console.log('Odometer empty - no fleet spawns recorded yet.')
  } else {
    const byDay = new Map()
    for (const r of rows) {
      const day = dayOf(r.ts) || 'unknown'
      const d = byDay.get(day) ?? { spawns: 0, tokens: 0 }
      d.spawns += 1
      d.tokens += r.tokens ?? 0
      byDay.set(day, d)
    }
    for (const [day, d] of [...byDay].slice(-7))
      console.log(`${day}: ${d.spawns} spawn(s) · ${Math.round(d.tokens / 1000)}k subagent tokens`)
    const today = new Date().toISOString().slice(0, 10)
    console.log('\ntoday by spawn:')
    for (const r of rows.filter((x) => dayOf(x.ts) === today).slice(-20))
      console.log(`  ${timeOf(r.ts)} ${r.tool ?? '?'}${r.agentType ? `/${r.agentType}` : ''}${r.model ? ` [${r.model}]` : ''} "${r.label ?? '?'}" - ${Math.round((r.tokens ?? 0) / 1000)}k tok, ${r.toolUses ?? 0} tools, ${Math.round((r.durationMs ?? 0) / 1000)}s`)
  }
} else if (cmd === 'all') {
  const cursor = ledgerInboxCursor()
  const scopes = Object.keys(cursor.byCwd)
  let any = false
  for (const scope of scopes) {
    const { unrelayed, openQuestions } = deriveInboxStateFromCursor(cursor, scope)
    if (unrelayed.length || openQuestions.length) {
      console.log(`${scope}: ${unrelayed.length} unrelayed, ${openQuestions.length} open questions`)
      any = true
    }
  }
  if (scopes.length === 0) console.log('Ledger empty.')
  else if (!any) { /* ledger has rows but no live inbox traffic — silent, same as before */ }
} else if (cmd === 'projects') {
  // The file cabinet: roll up every project (git repo or .madewell instance)
  // seen on disk + in the Tower ledger, by slug (the repo basename).
  // Each row: slug · stage (from madewell.json if present) · rumen? · inbox counts.
  const slugs = new Map() // slug -> { cwd, stage, rumen, unrelayed, openQ }
  // Drawers = real projects on disk (.madewell/.rumen). Ledger cwds only
  // join if they carry LIVE inbox traffic — dead eval/tmp scratch stays out.
  const cursor = ledgerInboxCursor()
  for (const entry of scanProjects()) {
    slugs.set(entry.slug, { cwd: entry.cwd, stage: entry.stage, rumen: entry.rumen, unrelayed: 0, openQ: 0 })
  }
  for (const [, s] of slugs) {
    const { unrelayed, openQuestions } = deriveInboxStateFromCursor(cursor, s.cwd)
    s.unrelayed = unrelayed.length; s.openQ = openQuestions.length
  }
  const seen = new Set([...slugs.values()].map((s) => normCwd(s.cwd)))
  for (const scope of Object.keys(cursor.byCwd)) {
    if (seen.has(scope)) continue
    const { unrelayed, openQuestions } = deriveInboxStateFromCursor(cursor, scope)
    if (!unrelayed.length && !openQuestions.length) continue
    seen.add(scope)
    slugs.set(basename(scope), { cwd: scope, stage: null, rumen: false, unrelayed: unrelayed.length, openQ: openQuestions.length })
  }
  const rows = [...slugs.entries()].sort((a, b) => {
    const ab = a[1].stage === 'build' ? 0 : 1
    const bb = b[1].stage === 'build' ? 0 : 1
    return ab - bb || a[0].localeCompare(b[0])
  })
  console.log(`Tower projects — ${rows.length} drawer(s)`)
  for (const [slug, s] of rows) {
    const stage = (s.stage ?? '—').padEnd(9)
    const rum = s.rumen ? 'rumen' : '   '
    const inbox = s.unrelayed || s.openQ ? ` !${s.unrelayed}/?${s.openQ}` : ''
    console.log(`  ${slug.padEnd(16)} ${stage} ${rum}  ${inbox}`)
  }
} else {
  console.log('usage: cli.mjs [status|inbox|board|post|emit|field|scan|burn|all|projects]')
}

} // end main()

if (import.meta.main) main()

export { preview, rowPreview, dayOf, timeOf }
