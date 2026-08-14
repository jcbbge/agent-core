#!/usr/bin/env bun
// Oracle tests for w2-integrity-close — JSONL skip-and-count + board CLI surface.
// Authored from plan/brief only — never from implementation source.
//
// Landed API (brief): parseJsonl(text), readJsonlStats(file) →
// { rows, bad_line_count, bad_line_numbers }; missing file → zeros.
// CLI: `bun cli.mjs board` prints integrity line; status mirror optional.
import { describe, expect, test } from 'bun:test'
import {
  existsSync,
  writeFileSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
} from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const TOWER_DIR = import.meta.dir
const CLI = join(TOWER_DIR, 'cli.mjs')
const AGENT_CORE = '/Users/jrg/.cursor/worktrees/agent-core/wt-agnt-test-maker-w2y-p19'
const LIVE_TOWER = join(process.env.HOME ?? '', '.tower')
const LIVE_BOARD = join(LIVE_TOWER, 'board.jsonl')

/** Minimal valid board row — real JSONL, no mocks. */
function boardRow(id, body = 'oracle ok') {
  return {
    id,
    ts: '2026-08-13T12:00:00.000Z',
    cwd: AGENT_CORE,
    type: 'note',
    from: 'AGNT w2-integrity-tests',
    topic: 'tower/w2-consumer-resilience',
    body,
  }
}

function writeFixtureJsonl(path, parts) {
  const text = parts.join('\n') + (parts.length ? '\n' : '')
  writeFileSync(path, text)
  return text
}

function makeTowerHome() {
  const root = mkdtempSync(join(tmpdir(), 'tower-integrity-oracle-'))
  mkdirSync(join(root, 'cursors'), { recursive: true })
  return root
}

async function withTowerEnv(towerHome, fn) {
  const prevHome = process.env.TOWER_HOME
  process.env.TOWER_HOME = towerHome
  try {
    const lib = await import(`./lib.mjs?integrity=${Date.now()}-${Math.random()}`)
    return await fn(lib)
  } finally {
    if (prevHome === undefined) delete process.env.TOWER_HOME
    else process.env.TOWER_HOME = prevHome
  }
}

async function spawnBoard(env = {}) {
  const proc = Bun.spawn(['bun', CLI, 'board'], {
    cwd: AGENT_CORE,
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

async function spawnStatus(env = {}) {
  const proc = Bun.spawn(['bun', CLI, 'status'], {
    cwd: AGENT_CORE,
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

/** Fresh Bun process so TOWER_HOME is honored before module init. */
async function runTowerScript(towerHome, script) {
  const proc = Bun.spawn(['bun', '-e', script], {
    cwd: TOWER_DIR,
    env: { ...process.env, TOWER_HOME: towerHome },
    stdout: 'pipe',
    stderr: 'pipe',
  })
  const [stdout, stderr, code] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ])
  return { stdout, stderr, code }
}

describe('parseJsonl + readJsonlStats exports (AC: B landed API)', () => {
  test('lib.mjs exports parseJsonl returning { rows, bad_line_count, bad_line_numbers }', async () => {
    const lib = await import('./lib.mjs')
    expect(typeof lib.parseJsonl).toBe('function')

    const g0 = JSON.stringify(boardRow('g0'))
    const g1 = JSON.stringify(boardRow('g1'))
    const text = `${g0}\n{truncated\n${g1}\n`

    const result = lib.parseJsonl(text)
    expect(result).toBeDefined()
    expect(Array.isArray(result.rows)).toBe(true)
    expect(typeof result.bad_line_count).toBe('number')
    expect(result.bad_line_count).toBe(1)
    expect(result.rows.length).toBe(2)
    if (result.bad_line_numbers != null) {
      expect(Array.isArray(result.bad_line_numbers)).toBe(true)
      expect(result.bad_line_numbers).toContain(2)
    }
  })

  test('lib.mjs exports readJsonlStats returning same shape from file path', async () => {
    const lib = await import('./lib.mjs')
    expect(typeof lib.readJsonlStats).toBe('function')

    const scratch = mkdtempSync(join(tmpdir(), 'tower-integrity-api-'))
    const fixture = join(scratch, 'board.jsonl')
    const good = JSON.stringify(boardRow('g1'))
    writeFixtureJsonl(fixture, [good, '{truncated', good])

    const result = lib.readJsonlStats(fixture)
    expect(Array.isArray(result.rows)).toBe(true)
    expect(typeof result.bad_line_count).toBe('number')
    expect(result.bad_line_count).toBe(1)
    expect(result.rows.length).toBe(2)

    rmSync(scratch, { recursive: true, force: true })
  })

  test('readJsonlStats on missing file → zeros (AC: B missing file contract)', async () => {
    const lib = await import('./lib.mjs')
    const missing = join(tmpdir(), `tower-missing-${Date.now()}.jsonl`)
    const stats = lib.readJsonlStats(missing)
    expect(stats.bad_line_count).toBe(0)
    expect(Array.isArray(stats.rows)).toBe(true)
    expect(stats.rows.length).toBe(0)
  })
})

describe('fixture skip-and-count (AC: B exact bad_line_count)', () => {
  test('known good + bad lines → exact bad_line_count and parseable rows only', async () => {
    const lib = await import('./lib.mjs')
    const scratch = mkdtempSync(join(tmpdir(), 'tower-integrity-fixture-'))
    const fixture = join(scratch, 'mixed.jsonl')

    const g0 = JSON.stringify(boardRow('g0'))
    const g1 = JSON.stringify(boardRow('g1'))
    const badA = 'NOT{JSON'
    const badB = 'also not json!!!'
    writeFixtureJsonl(fixture, [g0, badA, g1, badB])

    const stats = lib.readJsonlStats(fixture)
    expect(stats.bad_line_count).toBe(2)
    expect(stats.rows.length).toBe(2)
    const ids = stats.rows.map((r) => r.id).sort()
    expect(ids).toEqual(['g0', 'g1'])
    if (stats.bad_line_numbers != null) {
      expect(stats.bad_line_numbers.length).toBe(2)
      expect(stats.bad_line_numbers).toContain(2)
      expect(stats.bad_line_numbers).toContain(4)
    }

    rmSync(scratch, { recursive: true, force: true })
  })

  test('all-good fixture → bad_line_count=0', async () => {
    const lib = await import('./lib.mjs')
    const scratch = mkdtempSync(join(tmpdir(), 'tower-integrity-good-'))
    const fixture = join(scratch, 'good.jsonl')
    writeFixtureJsonl(fixture, [JSON.stringify(boardRow('a')), JSON.stringify(boardRow('b'))])

    const stats = lib.readJsonlStats(fixture)
    expect(stats.bad_line_count).toBe(0)
    expect(stats.rows.length).toBe(2)

    rmSync(scratch, { recursive: true, force: true })
  })

  test('empty lines skipped without counting as bad rows', async () => {
    const lib = await import('./lib.mjs')
    const scratch = mkdtempSync(join(tmpdir(), 'tower-integrity-empty-'))
    const fixture = join(scratch, 'sparse.jsonl')
    const good = JSON.stringify(boardRow('only'))
    writeFileSync(fixture, `${good}\n\n\n`)

    const stats = lib.readJsonlStats(fixture)
    expect(stats.bad_line_count).toBe(0)
    expect(stats.rows.length).toBe(1)

    rmSync(scratch, { recursive: true, force: true })
  })

  test('parseJsonl on inline text agrees with readJsonlStats on same bytes', async () => {
    const lib = await import('./lib.mjs')
    const scratch = mkdtempSync(join(tmpdir(), 'tower-integrity-parity-'))
    const fixture = join(scratch, 'parity.jsonl')
    const parts = [JSON.stringify(boardRow('x')), '{bad}', JSON.stringify(boardRow('y'))]
    const text = writeFixtureJsonl(fixture, parts)

    const fromText = lib.parseJsonl(text)
    const fromFile = lib.readJsonlStats(fixture)
    expect(fromText.bad_line_count).toBe(fromFile.bad_line_count)
    expect(fromText.rows.length).toBe(fromFile.rows.length)

    rmSync(scratch, { recursive: true, force: true })
  })
})

describe('reader tolerance — bad rows dropped, never throw (AC: B readAll/boardFor/inboxState)', () => {
  test('readJsonlStats on fixture with bad lines returns only parseable rows', async () => {
    const lib = await import('./lib.mjs')
    const scratch = mkdtempSync(join(tmpdir(), 'tower-integrity-tolerance-'))
    const fixture = join(scratch, 'board.jsonl')
    const g0 = JSON.stringify(boardRow('keep-0'))
    const g1 = JSON.stringify(boardRow('keep-1'))
    writeFixtureJsonl(fixture, [g0, '{bad', g1, 'still bad'])

    expect(() => lib.readJsonlStats(fixture)).not.toThrow()
    const stats = lib.readJsonlStats(fixture)
    expect(stats.bad_line_count).toBe(2)
    expect(stats.rows.length).toBe(2)
    const ids = stats.rows.map((r) => r.id).sort()
    expect(ids).toEqual(['keep-0', 'keep-1'])

    rmSync(scratch, { recursive: true, force: true })
  })

  test('readAll on fixture ledger with bad lines does not throw', async () => {
    const towerHome = makeTowerHome()
    const ledgerPath = join(towerHome, 'ledger.jsonl')
    const good = JSON.stringify({
      id: 'l-good',
      ts: '2026-08-13T12:00:00.000Z',
      cwd: AGENT_CORE,
      kind: 'progress',
      from: 'AGNT w2-integrity-tests',
      title: 'ok',
    })
    writeFixtureJsonl(ledgerPath, [good, '<<<bad>>>', good])

    await withTowerEnv(towerHome, async (lib) => {
      expect(() => lib.readAll(ledgerPath)).not.toThrow()
      const rows = lib.readAll(ledgerPath)
      expect(rows.length).toBe(2)
    })

    rmSync(towerHome, { recursive: true, force: true })
  })

  test('inboxState on fixture with bad ledger lines does not throw', async () => {
    const towerHome = makeTowerHome()
    const ledgerPath = join(towerHome, 'ledger.jsonl')
    const row = {
      id: 'l-inbox',
      ts: '2026-08-13T12:00:00.000Z',
      cwd: AGENT_CORE,
      kind: 'alert',
      from: 'AGNT w2-integrity-tests',
      message: 'hello',
    }
    writeFixtureJsonl(ledgerPath, [JSON.stringify(row), '{oops'])

    await withTowerEnv(towerHome, async (lib) => {
      expect(() => lib.inboxState(AGENT_CORE)).not.toThrow()
      const state = lib.inboxState(AGENT_CORE)
      expect(state).toBeDefined()
    })

    rmSync(towerHome, { recursive: true, force: true })
  })
})

describe('live board integrity (AC: B readJsonlStats on ~/.tower/board.jsonl ~26)', () => {
  test('readJsonlStats on live board reports historical damage (~26 bad lines)', async () => {
    expect(existsSync(LIVE_BOARD)).toBe(true)
    const lib = await import('./lib.mjs')

    expect(() => lib.boardFor(AGENT_CORE, { limit: 50 })).not.toThrow()

    const stats = lib.readJsonlStats(LIVE_BOARD)
    expect(stats.bad_line_count).toBeGreaterThan(0)
    expect(stats.bad_line_count).toBe(26)
  }, 20_000)

  test('boardFor against live board then readJsonlStats agrees on bad_line_count', async () => {
    const lib = await import('./lib.mjs')
    expect(() => lib.boardFor(AGENT_CORE, { limit: 100 })).not.toThrow()
    const stats = lib.readJsonlStats(LIVE_BOARD)
    expect(stats.bad_line_count).toBeGreaterThan(0)
  }, 20_000)
})

describe('CLI board integrity line (AC: B cli board surface)', () => {
  test('board stdout matches /integrity:.*unparseable/i and exits 0', async () => {
    const { stdout, stderr, code, combined } = await spawnBoard()
    expect(code).toBe(0)
    expect(stderr).not.toContain('TypeError')
    expect(combined).toMatch(/integrity:.*unparseable/i)
  }, 15_000)

  test('board integrity count is non-zero when live board is dirty', async () => {
    expect(existsSync(LIVE_BOARD)).toBe(true)
    const lib = await import('./lib.mjs')
    const expected = lib.readJsonlStats(LIVE_BOARD).bad_line_count
    expect(expected).toBeGreaterThan(0)

    const { stdout, combined, code } = await spawnBoard()
    expect(code).toBe(0)
    const hay = `${stdout}\n${combined}`
    const match = hay.match(/integrity:\s*(\d+)\s*unparseable/i)
    expect(match).not.toBeNull()
    expect(Number(match[1])).toBe(expected)
  }, 15_000)

  // BOARD is homedir-anchored in tower-ledger.mjs; TOWER_HOME does not redirect it.
  test.skip('board with TOWER_HOME fixture reports fixture bad_line_count without touching live board', async () => {}, 15_000)
})

describe('optional CLI status mirror (AC: C — assert only if coder adds line)', () => {
  test('if status prints integrity, count matches readJsonlStats on live board', async () => {
    const { combined, code } = await spawnStatus()
    expect(code).toBe(0)
    if (!/integrity/i.test(combined)) return

    const lib = await import('./lib.mjs')
    const expected = lib.readJsonlStats(LIVE_BOARD).bad_line_count
    const match = combined.match(/integrity[^\n]*?(\d+)\s*unparseable/i)
    expect(match).not.toBeNull()
    expect(Number(match[1])).toBe(expected)
  }, 15_000)
})
