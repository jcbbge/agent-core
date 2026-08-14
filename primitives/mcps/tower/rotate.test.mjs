#!/usr/bin/env bun
// Oracle tests for w4-rotate — Tower Phase-1 rotation (archive, never destroy).
// Authored from POLICY + agnt-w4-rotate brief only — never from implementation source.
import { describe, expect, test, afterEach } from 'bun:test'
import {
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  statSync,
  utimesSync,
  readdirSync,
} from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { createHash } from 'node:crypto'

const TOWER_DIR = import.meta.dir
const ROTATE = join(TOWER_DIR, 'rotate.mjs')
const AGENT_CORE = '/Users/jrg/agent-core'
const LIVE_BOARD = join(process.env.HOME ?? '', '.tower', 'board.jsonl')

/** Minimal valid board row — real JSONL, no mocks. */
function boardRow(i, ts = '2025-01-01T00:00:00.000Z') {
  return {
    id: `rot-oracle-${i}`,
    ts,
    cwd: AGENT_CORE,
    type: 'note',
    from: 'AGNT w4-rotate-tests',
    topic: 'tower/w4-retention-oracle',
    body: `oracle line ${i}`,
  }
}

/** Minimal valid ledger row. */
function ledgerRow(i, ts = '2025-01-01T00:00:00.000Z') {
  return {
    id: `rot-ledger-${i}`,
    ts,
    cwd: AGENT_CORE,
    kind: 'progress',
    from: 'AGNT w4-rotate-tests',
    title: `oracle ledger ${i}`,
  }
}

function sha256File(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}

/** Disposable Tower state root — real dirs/files under TOWER_HOME. */
function makeTowerHome() {
  const root = mkdtempSync(join(tmpdir(), 'tower-rotate-oracle-'))
  mkdirSync(join(root, 'cursors'), { recursive: true })
  mkdirSync(join(root, 'archive'), { recursive: true })
  mkdirSync(join(root, 'flight'), { recursive: true })
  mkdirSync(join(root, 'deliverables'), { recursive: true })
  return root
}

function writeJsonl(path, rows) {
  const body = rows.map((r) => JSON.stringify(r)).join('\n') + '\n'
  writeFileSync(path, body)
  return body
}

/** Board fixture exceeding POLICY line trigger (>8000 lines). */
function seedEligibleBoard(towerHome, lineCount = 8100) {
  const path = join(towerHome, 'board.jsonl')
  const rows = Array.from({ length: lineCount }, (_, i) =>
    boardRow(i, i < 4000 ? '2025-01-01T00:00:00.000Z' : '2026-08-13T12:00:00.000Z'),
  )
  const body = writeJsonl(path, rows)
  return { path, body, lineCount, size: Buffer.byteLength(body) }
}

/** Ledger fixture exceeding POLICY line trigger (>3000 lines). */
function seedEligibleLedger(towerHome, lineCount = 3100) {
  const path = join(towerHome, 'ledger.jsonl')
  const rows = Array.from({ length: lineCount }, (_, i) =>
    ledgerRow(i, i < 1500 ? '2025-01-01T00:00:00.000Z' : '2026-08-13T12:00:00.000Z'),
  )
  const body = writeJsonl(path, rows)
  return { path, body, lineCount, size: Buffer.byteLength(body) }
}

function parseManifestLines(manifestPath) {
  if (!existsSync(manifestPath)) return []
  return readFileSync(manifestPath, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line))
}

function listJsonlArchives(archiveBoardDir) {
  if (!existsSync(archiveBoardDir)) return []
  return readdirSync(archiveBoardDir).filter((f) => f.endsWith('.jsonl'))
}

async function runRotate(args, env = {}) {
  const proc = Bun.spawn(['bun', ROTATE, ...args], {
    cwd: TOWER_DIR,
    env: { ...process.env, ...env },
    stdout: 'pipe',
    stderr: 'pipe',
  })
  const [stdout, stderr, code] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ])
  return { stdout, stderr, code, combined: `${stdout}\n${stderr}` }
}

/** Import lib with TOWER_HOME + optional no-cursor full-read. */
async function withTowerEnv(towerHome, opts, fn) {
  const prevHome = process.env.TOWER_HOME
  const prevNoCursor = process.env.TOWER_LEDGER_NO_CURSOR
  process.env.TOWER_HOME = towerHome
  if (opts?.noCursor) process.env.TOWER_LEDGER_NO_CURSOR = '1'
  else delete process.env.TOWER_LEDGER_NO_CURSOR
  try {
    const lib = await import('./lib.mjs')
    return await fn(lib)
  } finally {
    if (prevHome === undefined) delete process.env.TOWER_HOME
    else process.env.TOWER_HOME = prevHome
    if (prevNoCursor === undefined) delete process.env.TOWER_LEDGER_NO_CURSOR
    else process.env.TOWER_LEDGER_NO_CURSOR = prevNoCursor
  }
}

function snapshotFile(path) {
  if (!existsSync(path)) return { exists: false, size: 0, mtimeMs: 0, bytes: Buffer.alloc(0) }
  const st = statSync(path)
  return { exists: true, size: st.size, mtimeMs: st.mtimeMs, bytes: readFileSync(path) }
}

describe('rotate.mjs entrypoint (AC: task 1 — script exists)', () => {
  test('rotate.mjs is present beside oracle tests', () => {
    expect(existsSync(ROTATE)).toBe(true)
  })
})

describe('dry-run makes no writes (AC: task 4 — dry-run no-write)', () => {
  let towerHome

  afterEach(() => {
    if (towerHome) rmSync(towerHome, { recursive: true, force: true })
    towerHome = undefined
  })

  test('board --dry-run --phase 1 leaves board bytes and archive tree unchanged', async () => {
    towerHome = makeTowerHome()
    seedEligibleBoard(towerHome)
    const boardPath = join(towerHome, 'board.jsonl')
    const manifestPath = join(towerHome, 'archive', 'manifest.jsonl')
    const beforeBoard = snapshotFile(boardPath)
    const archiveBoardDir = join(towerHome, 'archive', 'board')
    const liveBoardBefore = snapshotFile(LIVE_BOARD)

    const { code, combined } = await runRotate(
      ['--store', 'board', '--phase', '1', '--dry-run'],
      { TOWER_HOME: towerHome },
    )

    expect(code).toBe(0)
    const afterBoard = snapshotFile(boardPath)
    expect(afterBoard.bytes.equals(beforeBoard.bytes)).toBe(true)
    expect(afterBoard.size).toBe(beforeBoard.size)
    if (existsSync(archiveBoardDir)) {
      expect(listJsonlArchives(archiveBoardDir).length).toBe(0)
    }
    expect(existsSync(manifestPath)).toBe(false)
    // TOWER_HOME isolation — live ~/.tower untouched
    const liveBoardAfter = snapshotFile(LIVE_BOARD)
    expect(liveBoardAfter.size).toBe(liveBoardBefore.size)
    expect(combined.toLowerCase()).toMatch(/dry|plan|would/)
  }, 60_000)
})

describe('Phase-1 archive completeness (AC: task 4 — prefix bytes match; task 1 manifest)', () => {
  let towerHome

  afterEach(() => {
    if (towerHome) rmSync(towerHome, { recursive: true, force: true })
    towerHome = undefined
  })

  test('Phase-1 apply copies prefix to archive/board; active file bytes unchanged; manifest row valid', async () => {
    towerHome = makeTowerHome()
    const { path: boardPath } = seedEligibleBoard(towerHome)
    const activeBefore = readFileSync(boardPath)
    const manifestPath = join(towerHome, 'archive', 'manifest.jsonl')
    const archiveBoardDir = join(towerHome, 'archive', 'board')

    const { code, combined } = await runRotate(
      ['--store', 'board', '--phase', '1', '--apply'],
      { TOWER_HOME: towerHome },
    )

    expect(code).toBe(0)
    expect(combined.toLowerCase()).not.toMatch(/\berror\b.*\bfatal\b/)

    const activeAfter = readFileSync(boardPath)
    expect(Buffer.compare(activeBefore, activeAfter)).toBe(0)

    const archives = listJsonlArchives(archiveBoardDir)
    expect(archives.length).toBeGreaterThanOrEqual(1)

    const manifest = parseManifestLines(manifestPath)
    expect(manifest.length).toBeGreaterThanOrEqual(1)
    const row = manifest[manifest.length - 1]
    expect(row.store).toBe('board')
    expect(row.phase).toBe(1)
    expect(typeof row.archivedByteEnd).toBe('number')
    expect(row.archivedByteEnd).toBeGreaterThan(0)
    expect(row.activeSizeBefore).toBe(row.activeSizeAfter)
    expect(row.dryRun).toBe(false)
    expect(row.operator).toBe('rotate.mjs')
    expect(typeof row.sha256).toBe('string')
    expect(row.sha256.length).toBe(64)

    const archivePath = join(archiveBoardDir, archives[archives.length - 1])
    const archiveBytes = readFileSync(archivePath)
    expect(archiveBytes.length).toBe(row.archivedByteEnd)
    expect(activeBefore.subarray(0, row.archivedByteEnd).equals(archiveBytes)).toBe(true)
    expect(sha256File(archivePath)).toBe(row.sha256)
    expect(typeof row.archivedLineCount).toBe('number')
    expect(row.archivedLineCount).toBeGreaterThan(0)
  }, 120_000)
})

describe('Phase-2 gated (AC: task 4 — Phase-2 refusal without env; brief task 1)', () => {
  let towerHome

  afterEach(() => {
    if (towerHome) rmSync(towerHome, { recursive: true, force: true })
    towerHome = undefined
  })

  test('Phase-2 --apply refuses without TOWER_ROTATE_PHASE2_OK=1', async () => {
    towerHome = makeTowerHome()
    seedEligibleBoard(towerHome)
    const boardPath = join(towerHome, 'board.jsonl')
    const before = readFileSync(boardPath)

    const { code, combined } = await runRotate(
      ['--store', 'board', '--phase', '2', '--apply'],
      { TOWER_HOME: towerHome },
    )

    expect(code).not.toBe(0)
    expect(combined).toMatch(/TOWER_ROTATE_PHASE2_OK|phase.?2|blocked|refus/i)
    expect(readFileSync(boardPath).equals(before)).toBe(true)
  }, 60_000)

  test('Phase-2 --dry-run refuses without TOWER_ROTATE_PHASE2_OK=1', async () => {
    towerHome = makeTowerHome()
    seedEligibleBoard(towerHome)
    const boardPath = join(towerHome, 'board.jsonl')
    const before = readFileSync(boardPath)

    const { code, combined } = await runRotate(
      ['--store', 'board', '--phase', '2', '--dry-run'],
      { TOWER_HOME: towerHome },
    )

    // POLICY §4: Phase-2 refuses without env — no dry-run exception.
    expect(code).not.toBe(0)
    expect(combined).toMatch(/TOWER_ROTATE_PHASE2_OK|phase.?2|blocked|refus/i)
    expect(readFileSync(boardPath).equals(before)).toBe(true)
  }, 60_000)
})

describe('lock contention (AC: task 4 — lock refuse; POLICY §4 rotate.lock)', () => {
  let towerHome

  afterEach(() => {
    if (towerHome) rmSync(towerHome, { recursive: true, force: true })
    towerHome = undefined
  })

  test('refuses when cursors/rotate.lock is held', async () => {
    towerHome = makeTowerHome()
    seedEligibleBoard(towerHome)
    const lockPath = join(towerHome, 'cursors', 'rotate.lock')
    writeFileSync(lockPath, JSON.stringify({ pid: 999999, ts: new Date().toISOString() }) + '\n')

    const { code, combined } = await runRotate(
      ['--store', 'board', '--phase', '1', '--dry-run'],
      { TOWER_HOME: towerHome },
    )

    expect(code).not.toBe(0)
    expect(combined.toLowerCase()).toMatch(/lock|held|busy|refus/)
  }, 30_000)
})

describe('never-destroy (AC: task 4 — archive persists; POLICY invariant)', () => {
  let towerHome

  afterEach(() => {
    if (towerHome) rmSync(towerHome, { recursive: true, force: true })
    towerHome = undefined
  })

  test('archive files survive second dry-run; manifest only appends', async () => {
    towerHome = makeTowerHome()
    seedEligibleBoard(towerHome)
    const archiveBoardDir = join(towerHome, 'archive', 'board')
    const manifestPath = join(towerHome, 'archive', 'manifest.jsonl')

    const first = await runRotate(
      ['--store', 'board', '--phase', '1', '--apply'],
      { TOWER_HOME: towerHome },
    )
    expect(first.code).toBe(0)

    const archivesAfterFirst = listJsonlArchives(archiveBoardDir)
    expect(archivesAfterFirst.length).toBeGreaterThanOrEqual(1)
    const hashesFirst = Object.fromEntries(
      archivesAfterFirst.map((f) => [f, sha256File(join(archiveBoardDir, f))]),
    )
    const manifestCountFirst = parseManifestLines(manifestPath).length

    const second = await runRotate(
      ['--store', 'board', '--phase', '1', '--dry-run'],
      { TOWER_HOME: towerHome },
    )
    expect(second.code).toBe(0)

    for (const f of archivesAfterFirst) {
      expect(existsSync(join(archiveBoardDir, f))).toBe(true)
      expect(sha256File(join(archiveBoardDir, f))).toBe(hashesFirst[f])
    }
    const manifestCountSecond = parseManifestLines(manifestPath).length
    expect(manifestCountSecond).toBeGreaterThanOrEqual(manifestCountFirst)
  }, 120_000)
})

describe('ledger read-across + active unchanged (AC: task 2 — archivePath/archivedByteEnd; full-read parity)', () => {
  let towerHome

  afterEach(() => {
    if (towerHome) rmSync(towerHome, { recursive: true, force: true })
    towerHome = undefined
  })

  test('after Phase-1 board rotate, boardFor matches TOWER_LEDGER_NO_CURSOR=1 baseline', async () => {
    towerHome = makeTowerHome()
    seedEligibleBoard(towerHome)

    const baseline = await withTowerEnv(towerHome, { noCursor: true }, async (lib) =>
      lib.boardFor(AGENT_CORE, { limit: 100_000 }),
    )

    const { code } = await runRotate(
      ['--store', 'board', '--phase', '1', '--apply'],
      { TOWER_HOME: towerHome },
    )
    expect(code).toBe(0)

    const afterCursor = await withTowerEnv(towerHome, {}, async (lib) =>
      lib.boardFor(AGENT_CORE, { limit: 100_000 }),
    )
    const afterFull = await withTowerEnv(towerHome, { noCursor: true }, async (lib) =>
      lib.boardFor(AGENT_CORE, { limit: 100_000 }),
    )

    expect(afterCursor.length).toBe(baseline.length)
    expect(afterFull.length).toBe(baseline.length)
    const idsBaseline = baseline.map((r) => r.id).sort()
    const idsCursor = afterCursor.map((r) => r.id).sort()
    const idsFull = afterFull.map((r) => r.id).sort()
    expect(idsCursor).toEqual(idsBaseline)
    expect(idsFull).toEqual(idsBaseline)
  }, 120_000)

  test('cursor sidecar gains archivePath + archivedByteEnd after board Phase-1', async () => {
    towerHome = makeTowerHome()
    seedEligibleBoard(towerHome)
    const cursorPath = join(towerHome, 'cursors', 'board.scope.cursor.json')

    const { code } = await runRotate(
      ['--store', 'board', '--phase', '1', '--apply'],
      { TOWER_HOME: towerHome },
    )
    expect(code).toBe(0)
    expect(existsSync(cursorPath)).toBe(true)

    const cursor = JSON.parse(readFileSync(cursorPath, 'utf8'))
    expect(typeof cursor.archivePath).toBe('string')
    expect(cursor.archivePath.length).toBeGreaterThan(0)
    expect(typeof cursor.archivedByteEnd).toBe('number')
    expect(cursor.archivedByteEnd).toBeGreaterThan(0)
    expect(existsSync(cursor.archivePath.replace(/^~/, process.env.HOME ?? ''))).toBe(true)
  }, 120_000)

  // inboxState is read via a FRESH SUBPROCESS per read, not withTowerEnv:
  // ES module caching bakes tower-ledger's path constants at the suite's
  // first import, so per-test TOWER_HOME changes were silently ignored and
  // this test read LIVE ~/.tower state (masked for a day by stale cursor
  // lock files whose spin-fallback disabled the cursor path). A subprocess
  // evaluates the module with the right env at process start.
  const inboxStateSubprocess = async (towerHome, { noCursor = false } = {}) => {
    const proc = Bun.spawn(
      [
        'bun',
        '-e',
        `const lib = await import(${JSON.stringify(join(import.meta.dir, 'lib.mjs'))});` +
          `console.log(JSON.stringify(lib.inboxState(${JSON.stringify(AGENT_CORE)})))`,
      ],
      {
        env: {
          ...process.env,
          TOWER_HOME: towerHome,
          ...(noCursor ? { TOWER_LEDGER_NO_CURSOR: '1' } : {}),
        },
        stdout: 'pipe',
        stderr: 'pipe',
      },
    )
    const out = await new Response(proc.stdout).text()
    const code = await proc.exited
    expect(code).toBe(0)
    return out.trim()
  }

  test('ledger Phase-1 leaves ledger.jsonl bytes unchanged; inboxState parity', async () => {
    towerHome = makeTowerHome()
    seedEligibleLedger(towerHome)
    const ledgerPath = join(towerHome, 'ledger.jsonl')
    const before = readFileSync(ledgerPath)

    const baseline = await inboxStateSubprocess(towerHome, { noCursor: true })

    const { code } = await runRotate(
      ['--store', 'ledger', '--phase', '1', '--apply'],
      { TOWER_HOME: towerHome },
    )
    expect(code).toBe(0)
    expect(readFileSync(ledgerPath).equals(before)).toBe(true)

    const after = await inboxStateSubprocess(towerHome, {})
    expect(after).toBe(baseline)
  }, 120_000)
})

describe('store flags + deferrals (AC: task 1 — --store; constraints pheromones defer)', () => {
  let towerHome

  afterEach(() => {
    if (towerHome) rmSync(towerHome, { recursive: true, force: true })
    towerHome = undefined
  })

  test('--store all skips pheromones with defer/no-op message', async () => {
    towerHome = makeTowerHome()
    writeJsonl(join(towerHome, 'pheromones.jsonl'), [
      { id: 'p1', ts: '2026-08-13T12:00:00.000Z', scent: 'oracle', ttl: 3600 },
    ])
    seedEligibleBoard(towerHome, 8100)

    const { code, combined } = await runRotate(
      ['--store', 'all', '--phase', '1', '--dry-run'],
      { TOWER_HOME: towerHome },
    )

    expect(code).toBe(0)
    expect(combined.toLowerCase()).toMatch(/pheromone|defer|skip|no-op/)
    expect(existsSync(join(towerHome, 'archive', 'pheromones'))).toBe(false)
  }, 60_000)

  test('invalid --store exits non-zero', async () => {
    towerHome = makeTowerHome()
    const { code, combined } = await runRotate(
      ['--store', 'not-a-store', '--dry-run'],
      { TOWER_HOME: towerHome },
    )
    expect(code).not.toBe(0)
    expect(combined.toLowerCase()).toMatch(/store|unknown|invalid/)
  }, 15_000)
})

describe('directory stores — flight archive layout (AC: POLICY §3 flight YYYY-MM/)', () => {
  let towerHome

  afterEach(() => {
    if (towerHome) rmSync(towerHome, { recursive: true, force: true })
    towerHome = undefined
  })

  test('flight --older-than moves aged .md into archive/flight/YYYY-MM/ by file mtime', async () => {
    towerHome = makeTowerHome()
    const flightDir = join(towerHome, 'flight')
    const oldName = 'oracle-old-flight.md'
    const oldPath = join(flightDir, oldName)
    writeFileSync(oldPath, '# oracle flight snapshot\n')
    const oldDate = new Date('2025-06-15T12:00:00.000Z')
    utimesSync(oldPath, oldDate, oldDate)

    const { code } = await runRotate(
      ['--store', 'flight', '--older-than', '30d', '--phase', '1', '--apply'],
      { TOWER_HOME: towerHome },
    )
    expect(code).toBe(0)

    const archiveFlightRoot = join(towerHome, 'archive', 'flight')
    expect(existsSync(archiveFlightRoot)).toBe(true)
    expect(existsSync(join(archiveFlightRoot, '2025-06', oldName))).toBe(true)
    expect(readFileSync(join(archiveFlightRoot, '2025-06', oldName), 'utf8')).toContain('oracle flight')
    expect(existsSync(oldPath)).toBe(false)
  }, 30_000)

  test('flight dry-run lists distinct YYYY-MM buckets when files span months', async () => {
    towerHome = makeTowerHome()
    const flightDir = join(towerHome, 'flight')
    const junePath = join(flightDir, 'june-flight.md')
    const julyPath = join(flightDir, 'july-flight.md')
    writeFileSync(junePath, '# june\n')
    writeFileSync(julyPath, '# july\n')
    utimesSync(junePath, new Date('2025-06-10T00:00:00.000Z'), new Date('2025-06-10T00:00:00.000Z'))
    utimesSync(julyPath, new Date('2025-07-10T00:00:00.000Z'), new Date('2025-07-10T00:00:00.000Z'))

    const { code, combined } = await runRotate(
      ['--store', 'flight', '--older-than', '30d', '--phase', '1', '--dry-run'],
      { TOWER_HOME: towerHome },
    )
    expect(code).toBe(0)
    expect(combined).toContain('2025-06')
    expect(combined).toContain('2025-07')
    expect(existsSync(junePath)).toBe(true)
    expect(existsSync(julyPath)).toBe(true)
  }, 30_000)

  test('flight Phase-1 second apply does not destroy archive bytes', async () => {
    towerHome = makeTowerHome()
    const flightDir = join(towerHome, 'flight')
    const oldName = 'oracle-persist-flight.md'
    const oldPath = join(flightDir, oldName)
    writeFileSync(oldPath, '# persist\n')
    utimesSync(oldPath, new Date('2025-05-01T00:00:00.000Z'), new Date('2025-05-01T00:00:00.000Z'))

    const archivePath = join(towerHome, 'archive', 'flight', '2025-05', oldName)

    const first = await runRotate(
      ['--store', 'flight', '--older-than', '30d', '--phase', '1', '--apply'],
      { TOWER_HOME: towerHome },
    )
    expect(first.code).toBe(0)
    expect(existsSync(archivePath)).toBe(true)
    const hashBefore = sha256File(archivePath)

    const second = await runRotate(
      ['--store', 'flight', '--older-than', '30d', '--phase', '1', '--apply'],
      { TOWER_HOME: towerHome },
    )
    expect(second.code).toBe(0)
    expect(existsSync(archivePath)).toBe(true)
    expect(sha256File(archivePath)).toBe(hashBefore)
  }, 30_000)
})

describe('--evidence-dir (AC: task 1 — flag; task 3 proof artifacts)', () => {
  let towerHome
  let evidenceDir

  afterEach(() => {
    if (towerHome) rmSync(towerHome, { recursive: true, force: true })
    if (evidenceDir) rmSync(evidenceDir, { recursive: true, force: true })
    towerHome = undefined
    evidenceDir = undefined
  })

  test('--evidence-dir receives dry-run plan output without touching live tower', async () => {
    towerHome = makeTowerHome()
    evidenceDir = mkdtempSync(join(tmpdir(), 'tower-rotate-evidence-'))
    seedEligibleBoard(towerHome)
    const liveBefore = snapshotFile(LIVE_BOARD)

    const { code, combined } = await runRotate(
      ['--store', 'board', '--phase', '1', '--dry-run', '--evidence-dir', evidenceDir],
      { TOWER_HOME: towerHome },
    )

    expect(code).toBe(0)
    expect(combined.length).toBeGreaterThan(0)
    const liveAfter = snapshotFile(LIVE_BOARD)
    expect(liveAfter.size).toBe(liveBefore.size)
    // Implementer may write PROOF.md/plan files on apply; dry-run at minimum uses flag without error.
  }, 60_000)
})
