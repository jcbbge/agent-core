#!/usr/bin/env bun
// Tower rotation — Phase-1 additive archive copy; Phase-2 truncate gated.
// Canonical source: ~/agent-core/primitives/mcps/tower/rotate.mjs
// Deploy: symlink ~/.tower/rotate.mjs -> this file (see DEPLOY-ROTATE.md)

import {
  appendFileSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
  unlinkSync,
} from 'node:fs'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { homedir } from 'node:os'

const STORE_CONFIG = {
  board: {
    kind: 'jsonl',
    active: 'board.jsonl',
    cursorStore: 'board',
    sizeTrigger: 5 * 1024 * 1024,
    lineTrigger: 8000,
    ageDays: 90,
  },
  ledger: {
    kind: 'jsonl',
    active: 'ledger.jsonl',
    cursorStore: 'ledger',
    sizeTrigger: 2 * 1024 * 1024,
    lineTrigger: 3000,
    ageDays: 180,
  },
  odometer: {
    kind: 'jsonl',
    active: 'odometer.jsonl',
    cursorStore: null,
    sizeTrigger: 1024 * 1024,
    lineTrigger: 2000,
    ageDays: 365,
  },
  flight: {
    kind: 'dir',
    active: 'flight',
    sizeTrigger: 5 * 1024 * 1024,
    ageDays: 30,
  },
  deliverables: {
    kind: 'dir',
    active: 'deliverables',
    sizeTrigger: 3 * 1024 * 1024,
    ageDays: 60,
  },
  pheromones: { kind: 'defer' },
}

const ALL_JSONL = ['board', 'ledger', 'odometer']
const ALL_DIR = ['flight', 'deliverables']

function parseArgs(argv) {
  const out = {
    store: null,
    dryRun: false,
    phase: 1,
    apply: false,
    evidenceDir: null,
    olderThanDays: null,
    towerHome: process.env.TOWER_HOME || join(homedir(), '.tower'),
  }
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--dry-run') {
      out.dryRun = true
      continue
    }
    if (a === '--apply') {
      out.apply = true
      continue
    }
    if (a === '--store') {
      out.store = argv[++i]
      continue
    }
    if (a === '--phase') {
      out.phase = Number(argv[++i])
      continue
    }
    if (a === '--evidence-dir') {
      out.evidenceDir = argv[++i]
      continue
    }
    if (a === '--tower-home') {
      out.towerHome = argv[++i]
      continue
    }
    if (a.startsWith('--older-than')) {
      const m = a.match(/^--older-than=(\d+)d$/) || (a === '--older-than' && argv[i + 1] ? null : null)
      if (m) out.olderThanDays = Number(m[1])
      else if (a === '--older-than') out.olderThanDays = Number(String(argv[++i]).replace(/d$/, ''))
      continue
    }
    throw new Error(`unknown flag: ${a}`)
  }
  if (!out.store) throw new Error('--store required (board|ledger|odometer|flight|deliverables|all|pheromones)')
  if (!out.apply && !out.dryRun) out.dryRun = true
  if (out.phase === 2 && process.env.TOWER_ROTATE_PHASE2_OK !== '1') {
    throw new Error('Phase-2 refused: set TOWER_ROTATE_PHASE2_OK=1 and obtain concierge/CORD yes')
  }
  return out
}

function isoStamp(d = new Date()) {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
}

function sha256File(path) {
  const h = createHash('sha256')
  h.update(readFileSync(path))
  return h.digest('hex')
}

function sha256Bytes(buf) {
  return createHash('sha256').update(buf).digest('hex')
}

function towerPaths(home) {
  return {
    home,
    archive: join(home, 'archive'),
    manifest: join(home, 'archive', 'manifest.jsonl'),
    cursors: join(home, 'cursors'),
    rotateLock: join(home, 'cursors', 'rotate.lock'),
  }
}

function withRotateLock(lockPath, fn) {
  mkdirSync(join(lockPath, '..'), { recursive: true })
  for (let i = 0; i < 100; i++) {
    try {
      writeFileSync(lockPath, String(process.pid), { flag: 'wx' })
      try {
        return fn()
      } finally {
        try {
          unlinkSync(lockPath)
        } catch {
          /* stale */
        }
      }
    } catch {
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 2)
    }
  }
  throw new Error(`rotate lock held: ${lockPath}`)
}

function parseJsonlLines(text) {
  const lines = []
  let byteOffset = 0
  for (const line of text.split('\n')) {
    if (!line) {
      byteOffset += 1
      continue
    }
    try {
      lines.push({ row: JSON.parse(line), byteStart: byteOffset, byteEnd: byteOffset + Buffer.byteLength(line, 'utf-8') + 1 })
    } catch {
      /* skip corrupt */
    }
    byteOffset += Buffer.byteLength(line, 'utf-8') + 1
  }
  return lines
}

function dirBytes(dir) {
  if (!existsSync(dir)) return 0
  let total = 0
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    const st = statSync(p)
    if (st.isFile()) total += st.size
    else if (st.isDirectory()) total += dirBytes(p)
  }
  return total
}

function eligibleJsonl(activePath, cfg) {
  if (!existsSync(activePath)) return { eligible: false, reason: 'missing' }
  const st = statSync(activePath)
  const text = readFileSync(activePath, 'utf-8')
  const parsed = parseJsonlLines(text)
  const lineCount = parsed.length
  const reasons = []
  if (st.size > cfg.sizeTrigger) reasons.push(`size ${st.size} > ${cfg.sizeTrigger}`)
  if (lineCount > cfg.lineTrigger) reasons.push(`lines ${lineCount} > ${cfg.lineTrigger}`)
  const cutoff = Date.now() - cfg.ageDays * 86400000
  const oldest = parsed[0]?.row?.ts
  if (oldest && new Date(oldest).getTime() < cutoff) reasons.push(`age prefix > ${cfg.ageDays}d`)
  return { eligible: reasons.length > 0, reasons, st, parsed, lineCount }
}

function computeJsonlPrefix(parsed, cfg, st) {
  let cutByte = 0
  let cutLine = 0
  const cutoff = Date.now() - cfg.ageDays * 86400000

  if (parsed.length > cfg.lineTrigger) {
    const keep = cfg.lineTrigger
    const drop = parsed.length - keep
    if (drop > cutLine) {
      cutLine = drop
      cutByte = parsed[drop]?.byteStart ?? 0
    }
  }

  if (st.size > cfg.sizeTrigger) {
    const target = cfg.sizeTrigger
    let bytes = 0
    let idx = 0
    while (idx < parsed.length && st.size - (parsed[idx]?.byteStart ?? 0) > target) {
      idx++
    }
    if (idx > 0 && (parsed[idx]?.byteStart ?? 0) > cutByte) {
      cutByte = parsed[idx].byteStart
      cutLine = idx
    }
  }

  for (let i = 0; i < parsed.length; i++) {
    const ts = parsed[i]?.row?.ts
    if (!ts) continue
    if (new Date(ts).getTime() >= cutoff) {
      if (i > cutLine) {
        cutLine = i
        cutByte = parsed[i].byteStart
      }
      break
    }
    if (i === parsed.length - 1) {
      cutLine = parsed.length
      cutByte = st.size
    }
  }

  if (cutByte <= 0) return null
  return { byteEnd: cutByte, lineCount: cutLine }
}

function appendManifest(manifestPath, row, dryRun) {
  if (dryRun) return row
  mkdirSync(join(manifestPath, '..'), { recursive: true })
  appendFileSync(manifestPath, JSON.stringify(row) + '\n')
  return row
}

async function importLedgerHelpers(towerHome) {
  process.env.TOWER_HOME = towerHome
  const mod = await import('../../hooks/tower-ledger.mjs')
  return mod
}

function planJsonl(store, cfg, paths, opts) {
  const activePath = join(paths.home, cfg.active)
  const check = eligibleJsonl(activePath, cfg)
  if (!check.eligible) {
    return { action: 'noop', store, reasons: check.reasons ?? ['no trigger'] }
  }
  const prefix = computeJsonlPrefix(check.parsed, cfg, check.st)
  if (!prefix || prefix.byteEnd <= 0) {
    return { action: 'noop', store, reasons: ['no prefix computed'] }
  }
  const stamp = isoStamp()
  const archiveRel = join('archive', store, `${store}-${stamp}.jsonl`)
  const archivePath = join(paths.home, archiveRel)
  const prefixBytes = readFileSync(activePath).subarray(0, prefix.byteEnd)
  return {
    action: 'archive-jsonl',
    store,
    phase: opts.phase,
    activePath,
    archivePath,
    archiveRel,
    archivedByteEnd: prefix.byteEnd,
    archivedLineCount: prefix.lineCount,
    activeSizeBefore: check.st.size,
    activeSizeAfter: opts.phase === 2 ? check.st.size - prefix.byteEnd : check.st.size,
    prefixSha256: sha256Bytes(prefixBytes),
    triggers: check.reasons,
  }
}

function applyJsonlPlan(plan, paths, opts, ledger) {
  if (plan.action !== 'archive-jsonl') return plan
  const { dryRun, phase } = opts
  if (dryRun) return { ...plan, dryRun: true }

  mkdirSync(join(plan.archivePath, '..'), { recursive: true })
  const prefixBytes = readFileSync(plan.activePath).subarray(0, plan.archivedByteEnd)
  writeFileSync(plan.archivePath, prefixBytes)

  const manifestRow = appendManifest(
    paths.manifest,
    {
      id: `rot-${Date.now().toString(36)}`,
      ts: new Date().toISOString(),
      store: plan.store,
      phase,
      archivePath: plan.archivePath,
      archivedByteEnd: plan.archivedByteEnd,
      archivedLineCount: plan.archivedLineCount,
      activePath: plan.activePath,
      activeSizeBefore: plan.activeSizeBefore,
      activeSizeAfter: plan.activeSizeAfter,
      sha256: sha256File(plan.archivePath),
      dryRun: false,
      operator: 'rotate.mjs',
    },
    false
  )

  writeStoreArchiveCursor(paths, cfgCursorStore(plan.store), {
    archivePath: plan.archivePath,
    archivedByteEnd: plan.archivedByteEnd,
    resetOffset: phase === 2,
  })

  if (phase === 2) {
    const tail = readFileSync(plan.activePath).subarray(plan.archivedByteEnd)
    writeFileSync(plan.activePath, tail)
  }

  return { ...plan, manifestRow, applied: true }
}

function cfgCursorStore(store) {
  return STORE_CONFIG[store]?.cursorStore ?? null
}

// Cursor sidecars, mirroring tower-ledger.mjs (CURSORS/<file>, lock <name>.lock).
// Written HERE, from paths.cursors, on purpose: tower-ledger anchors CURSORS at
// homedir()/.tower and honours no env override, so delegating this write would
// stamp the LIVE ~/.tower/cursors even when rotating a --tower-home fixture.
const CURSOR_SIDECAR = {
  board: {
    file: 'board.scope.cursor.json',
    lock: 'board.scope',
    empty: () => ({ offset: 0, size: 0, mtimeMs: 0, byCwd: {} }),
  },
  ledger: {
    file: 'ledger.inbox.cursor.json',
    lock: 'ledger.inbox',
    empty: () => ({
      offset: 0,
      size: 0,
      mtimeMs: 0,
      acked: [],
      answeredIds: [],
      byCwd: {},
      allRows: [],
    }),
  },
}

/** Best-effort cursor lock, same protocol as tower-ledger.mjs withCursorLock. */
function withCursorSidecarLock(cursorsDir, lockName, fn) {
  mkdirSync(cursorsDir, { recursive: true })
  const lockPath = join(cursorsDir, `${lockName}.lock`)
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
  return fn()
}

/**
 * Stamp archive provenance on the store's cursor sidecar so readers can read
 * across archive + active. Phase-1 is additive (offsets still describe the
 * untouched active file); Phase-2 truncated the head off it, so every offset
 * and every accumulated row in the sidecar now describes bytes that moved to
 * the archive — reset the accumulators to their empty shape and let the next
 * reader re-ingest the shortened file from zero.
 */
function writeStoreArchiveCursor(paths, cursorStore, { archivePath, archivedByteEnd, resetOffset }) {
  const spec = cursorStore ? CURSOR_SIDECAR[cursorStore] : null
  if (!spec) return null
  const cursorPath = join(paths.cursors, spec.file)
  return withCursorSidecarLock(paths.cursors, spec.lock, () => {
    let base = spec.empty()
    if (!resetOffset && existsSync(cursorPath)) {
      try {
        const existing = JSON.parse(readFileSync(cursorPath, 'utf-8'))
        if (existing && typeof existing === 'object' && !Array.isArray(existing)) {
          base = { ...base, ...existing }
        }
      } catch {
        /* unreadable sidecar → rebuild from empty, never throw mid-rotate */
      }
    }
    const cursor = {
      ...base,
      archivePath,
      archivedByteEnd,
      archivedAt: new Date().toISOString(),
    }
    writeFileSync(cursorPath, JSON.stringify(cursor))
    return cursorPath
  })
}

function utcMonthFromMtime(mtimeMs) {
  return new Date(mtimeMs).toISOString().slice(0, 7)
}

function planDir(store, cfg, paths, opts) {
  const activePath = join(paths.home, cfg.active)
  if (!existsSync(activePath)) return { action: 'noop', store, reasons: ['missing'] }
  const ageDays = opts.olderThanDays ?? cfg.ageDays
  const cutoff = Date.now() - ageDays * 86400000
  const total = dirBytes(activePath)
  const moves = []
  for (const name of readdirSync(activePath)) {
    const p = join(activePath, name)
    const st = statSync(p)
    if (!st.isFile()) continue
    if (st.mtimeMs < cutoff) {
      const month = utcMonthFromMtime(st.mtimeMs)
      moves.push({
        src: p,
        name,
        mtime: st.mtimeMs,
        size: st.size,
        month,
        archiveDir: join(paths.home, 'archive', store, month),
      })
    }
  }
  const reasons = []
  if (total > cfg.sizeTrigger) reasons.push(`dir size ${total} > ${cfg.sizeTrigger}`)
  if (moves.length > 0) reasons.push(`${moves.length} files older than ${ageDays}d`)
  if (reasons.length === 0) return { action: 'noop', store, reasons: ['no trigger'] }
  const archiveDirs = [...new Set(moves.map((m) => m.archiveDir))]
  return {
    action: 'archive-dir',
    store,
    phase: opts.phase,
    activePath,
    moves,
    archiveDirs,
    triggers: reasons,
  }
}

function applyDirPlan(plan, paths, opts) {
  if (plan.action !== 'archive-dir') return plan
  if (opts.dryRun) return { ...plan, dryRun: true }
  const activeSizeBefore = dirBytes(plan.activePath)
  const byBucket = new Map()
  for (const m of plan.moves) {
    if (!byBucket.has(m.archiveDir)) byBucket.set(m.archiveDir, [])
    byBucket.get(m.archiveDir).push(m)
  }
  for (const [archiveDir, bucketMoves] of byBucket) {
    mkdirSync(archiveDir, { recursive: true })
    for (const m of bucketMoves) {
      const dest = join(archiveDir, m.name)
      if (existsSync(dest)) throw new Error(`archive collision: ${dest}`)
      copyFileSync(m.src, dest)
      if (sha256File(m.src) !== sha256File(dest)) throw new Error(`copy verify failed: ${m.src}`)
      unlinkSync(m.src)
    }
    appendManifest(
      paths.manifest,
      {
        id: `rot-${Date.now().toString(36)}`,
        ts: new Date().toISOString(),
        store: plan.store,
        phase: opts.phase,
        archivePath: archiveDir,
        archivedByteEnd: bucketMoves.reduce((n, m) => n + m.size, 0),
        archivedLineCount: bucketMoves.length,
        activePath: plan.activePath,
        activeSizeBefore,
        activeSizeAfter: dirBytes(plan.activePath),
        sha256: bucketMoves.map((m) => sha256File(join(archiveDir, m.name))).join(','),
        dryRun: false,
        operator: 'rotate.mjs',
      },
      false
    )
  }
  return { ...plan, applied: true }
}

function storesFor(name) {
  if (name === 'all') return [...ALL_JSONL, ...ALL_DIR, 'pheromones']
  if (name === 'pheromones') return ['pheromones']
  return [name]
}

async function rotateStore(store, paths, opts, ledger) {
  const cfg = STORE_CONFIG[store]
  if (!cfg) throw new Error(`unknown store: ${store}`)
  if (cfg.kind === 'defer') {
    return { action: 'defer', store, message: 'pheromones rotation deferred per POLICY' }
  }
  if (cfg.kind === 'jsonl') {
    const plan = planJsonl(store, cfg, paths, opts)
    if (plan.action === 'noop') return plan
    return applyJsonlPlan(plan, paths, opts, ledger)
  }
  const plan = planDir(store, cfg, paths, opts)
  if (plan.action === 'noop') return plan
  return applyDirPlan(plan, paths, opts)
}

function writeEvidence(evidenceDir, results, opts) {
  if (!evidenceDir) return
  mkdirSync(evidenceDir, { recursive: true })
  writeFileSync(join(evidenceDir, 'rotate-result.json'), JSON.stringify({ opts, results }, null, 2))
}

async function main() {
  const opts = parseArgs(process.argv)
  process.env.TOWER_HOME = opts.towerHome
  const paths = towerPaths(opts.towerHome)
  const ledger = await importLedgerHelpers(opts.towerHome)

  const results = await withRotateLock(paths.rotateLock, async () => {
    const out = []
    for (const store of storesFor(opts.store)) {
      out.push(await rotateStore(store, paths, opts, ledger))
    }
    return out
  })

  writeEvidence(opts.evidenceDir, results, opts)

  for (const r of results) {
    if (r.action === 'defer') {
      console.log(`[${r.store}] ${r.message}`)
      continue
    }
    if (r.action === 'noop') {
      console.log(`[${r.store}] noop: ${(r.reasons ?? []).join('; ')}`)
      continue
    }
    const mode = opts.dryRun ? 'dry-run' : 'applied'
    const archiveLabel =
      r.archivePath ??
      (r.archiveDirs?.length ? r.archiveDirs.join(',') : r.archiveDir)
    console.log(
      `[${r.store}] ${mode} phase=${opts.phase} archive=${archiveLabel} bytes=${r.archivedByteEnd ?? r.moves?.length} sha256=${r.prefixSha256 ?? r.sha256 ?? 'dir'}`
    )
  }

  if (opts.evidenceDir) console.log(`evidence: ${opts.evidenceDir}`)
}

main().catch((err) => {
  console.error(err.message || err)
  process.exit(1)
})
