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
//   bun ~/.tower/cli.mjs deposit <to> <kind> "<body>" --from <name> [--ref <id>] [--ttl <seconds>]
//           [--evidence-status <s>] [--evidence-done-marker <path>]
//           [--evidence-work-done-ref <id>] [--evidence-verdict <token>]
//                                 — queue a message on the deposit/courier bus;
//                                   prints the receipt as one JSON line;
//                                   exit 0 accepted, exit 1 refused
//   bun ~/.tower/cli.mjs stuck    — is anything owed and undelivered, and why;
//                                   exit 0 nothing stuck, exit 1 something stuck
//   bun ~/.tower/cli.mjs field [--topic t] [--json]
//   bun ~/.tower/cli.mjs scan [--topic t] [--json]
//   bun ~/.tower/cli.mjs burn     — fleet token burn (today, by session)
//   bun ~/.tower/cli.mjs all      — status + inbox + board combined
//   bun ~/.tower/cli.mjs projects — every project drawer with pending inbox
//
// Used by the /tower command (dynamic context injection) and directly by the
// developer from any terminal.

import { existsSync, statSync } from 'node:fs'
import { inboxState, renderMessage, readAll, boardFor, normCwd, BOARD, ODOMETER, TOWER, emitPheromone, pheromoneField, pheromoneFieldFromRows, readAllFull, PHEROMONES, ledgerInboxCursor, deriveInboxStateFromCursor, assertAuthoredBoardFrom, append, readJsonlStats, readDeadLetters, deposit, listInboxes, pendingItems, dueItems, readInbox, unslugAddressee, MAX_ATTEMPTS, STUCK_THRESHOLD_SECONDS } from './lib.mjs'

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
    if (a === '--evidence-status') { out.evidence_status = args[++i]; continue }
    if (a === '--evidence-done-marker') { out.evidence_done_marker = args[++i]; continue }
    if (a === '--evidence-work-done-ref') { out.evidence_work_done_ref = args[++i]; continue }
    if (a === '--evidence-verdict') { out.evidence_verdict = args[++i]; continue }
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

// `stuck`'s only source of engine liveness. null = pane list unavailable —
// callers must not treat that as "every pane is dead".
function livePaneIds() {
  try {
    const r = Bun.spawnSync(['herdr', 'pane', 'list'], { stdout: 'pipe', stderr: 'ignore' })
    const obj = JSON.parse(r.stdout?.toString?.() ?? '')
    const panes = obj?.result?.panes
    if (!Array.isArray(panes)) return null
    return new Set(panes.map((p) => p.pane_id).filter(Boolean))
  } catch {
    return null
  }
}

// CONTRACT §6b condition 1-3: is this one folded row itself the reason `stuck`
// should exit non-zero? A deferred item is NOT stuck for being deferred — it
// only trips condition 1, on the same overdue clock as everything else.
function itemIsStuck(row, now) {
  if (row.state === 'queued') {
    const nextMs = new Date(row.next_attempt_at).getTime()
    if (Number.isFinite(nextMs) && now - nextMs > STUCK_THRESHOLD_SECONDS * 1000) return true
  }
  if ((row.attempts ?? 0) >= MAX_ATTEMPTS) return true
  if (row.state === 'delivering') {
    const tsMs = new Date(row.ts ?? 0).getTime()
    if (Number.isFinite(tsMs) && now - tsMs > STUCK_THRESHOLD_SECONDS * 1000) return true
  }
  return false
}

// CONTRACT §6b condition 5 / DESIGN §6 condition 1: "a dead courier must be
// loud." No heartbeat file path is pinned yet (board finding posted); this
// reads the mtime of a placeholder path and returns null — not stale — when
// the file does not exist, so a courier that this unit has not built yet
// cannot force a permanent false-positive `stuck` exit 1.
function courierHeartbeatAgeS(now) {
  const path = process.env.TOWER_COURIER_HEARTBEAT_PATH || `${TOWER}/courier-heartbeat.json`
  try {
    if (!existsSync(path)) return null
    return Math.round((now - statSync(path).mtimeMs) / 1000)
  } catch {
    return null
  }
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
  // Diagnostic, not a board row — stderr keeps `board [topic]` stdout a pure
  // listing (every stdout line is a row), so `board <topic> | ...` stays clean.
  // `status` (a human report, not a data channel) still prints it on stdout.
  const integrity = readJsonlStats(BOARD)
  if (integrity.bad_line_count > 0) {
    const maxBad = integrity.bad_line_numbers.length ? Math.max(...integrity.bad_line_numbers) : '?'
    console.error(`integrity: ${integrity.bad_line_count} unparseable line(s) on board (max bad line ${maxBad})`)
  } else {
    console.error('integrity: 0 unparseable lines on board')
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
} else if (cmd === 'deposit') {
  // The seam a python handler binding shells to (CONTRACT §8) — parsing and
  // exit codes are load-bearing. No queue logic here: deposit() from
  // deposit.mjs (via lib.mjs) owns refusal, folding, and dead-lettering.
  const f = parseFlags(process.argv.slice(3))
  const [to, kind, body] = f._
  if (!to || !kind) {
    console.error('usage: cli.mjs deposit <to> <kind> "<body>" --from <name> [--ref <id>] [--ttl <seconds>] [--evidence-status <s>] [--evidence-done-marker <path>] [--evidence-work-done-ref <id>] [--evidence-verdict <token>]')
    process.exit(2)
  }
  const evidence = {}
  if (f.evidence_status !== undefined) evidence.status = f.evidence_status
  if (f.evidence_done_marker !== undefined) evidence.done_marker = f.evidence_done_marker
  if (f.evidence_work_done_ref !== undefined) evidence.work_done_ref = f.evidence_work_done_ref
  if (f.evidence_verdict !== undefined) evidence.verdict_token = f.evidence_verdict
  const receipt = deposit({
    to,
    kind,
    body: body ?? '',
    from: f.from ?? null,
    ref: f.ref ?? null,
    ttl_s: f.ttl,
    evidence,
  })
  console.log(JSON.stringify(receipt))
  process.exit(receipt.accepted ? 0 : 1)
} else if (cmd === 'stuck') {
  // Observability only — reads the pinned deposit.mjs surface (CONTRACT §7),
  // never re-derives queue state. "Incapable of silence": an empty queue
  // still prints a line, and dead-letters always get their own section.
  // Exit code per CONTRACT §6b: non-zero iff a specific stuck condition
  // holds (overdue queued item, exhausted attempts, expired delivering
  // lease, stranded addressee, or a stale courier heartbeat) — never merely
  // because something is queued or paced or deferred.
  const now = Date.now()
  const livePanes = livePaneIds()
  const rows = []
  for (const entry of listInboxes()) {
    const to = unslugAddressee(entry.slug)
    const pending = pendingItems(to)
    if (pending.length === 0) continue
    const raw = readInbox(to)
    const pendingIds = new Set(pending.map((r) => r.deposit_id))
    // The folded row's `ts` is its last write; the deposit's age is the ts of
    // its FIRST row (CONTRACT §3), so oldest-age walks the raw log, not the fold.
    const firstSeen = new Map()
    for (const r of raw) {
      if (pendingIds.has(r.deposit_id) && !firstSeen.has(r.deposit_id)) firstSeen.set(r.deposit_id, r.ts)
    }
    let oldestId = null
    let oldestTs = null
    for (const [id, ts] of firstSeen) {
      const t = new Date(ts).getTime()
      if (Number.isFinite(t) && (oldestTs === null || t < oldestTs)) { oldestTs = t; oldestId = id }
    }
    const oldest = pending.find((r) => r.deposit_id === oldestId) ?? pending[0]
    const liveness = to.startsWith('pane:')
      ? (livePanes && livePanes.has(to.slice('pane:'.length)) ? 'live' : 'stranded')
      : 'live'
    // CONTRACT §6a (ORCH ruling): deferred_reason is a distinct column from
    // last_error — the two are never written by the same event, so a busy
    // addressee never reads as a failing one.
    const deferredReason = oldest?.deferred_reason ?? '-'
    const stuck = liveness === 'stranded' || pending.some((r) => itemIsStuck(r, now))
    rows.push({
      to,
      liveness,
      queued: pending.filter((r) => r.state === 'queued').length,
      oldestAgeS: oldestTs !== null ? Math.max(0, Math.round((now - oldestTs) / 1000)) : 0,
      attempts: oldest?.attempts ?? 0,
      nextAttempt: oldest?.next_attempt_at ?? '?',
      lastError: oldest?.last_error ?? '-',
      deferredReason,
      stuck,
    })
  }
  let anyStuck = false
  if (rows.length === 0) {
    console.log('nothing owed')
  } else {
    for (const r of rows) {
      if (r.stuck) anyStuck = true
      console.log(`${r.to}  ${r.liveness}  queued=${r.queued}  oldest=${r.oldestAgeS}s  attempts=${r.attempts}  next=${r.nextAttempt}  last_error=${r.lastError}  deferred=${r.deferredReason}`)
    }
  }
  const heartbeatAgeS = courierHeartbeatAgeS(now)
  if (heartbeatAgeS !== null && heartbeatAgeS > STUCK_THRESHOLD_SECONDS) {
    anyStuck = true
    console.log(`courier not ticking since ${new Date(now - heartbeatAgeS * 1000).toISOString()}`)
  }
  const deadLetters = readDeadLetters()
  console.log(`dead-letter: ${deadLetters.length} row(s)`)
  for (const r of deadLetters.slice(-20)) {
    console.log(`  [${r.dead_lettered_at ?? r.ts ?? '?'}] ${r.to ?? '?'} ${r.kind ?? '?'} - ${r.reason ?? '?'}`)
  }
  process.exit(anyStuck ? 1 : 0)
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
  console.log('usage: cli.mjs [status|inbox|board|post|emit|deposit|stuck|field|scan|burn|all|projects]')
}

} // end main()

if (import.meta.main) main()
