#!/usr/bin/env bun
// Oracle tests for statem-twr-residuals (T1 flocked statem + T2 twr integrity surface).
// Authored from plan/brief only — never from implementation source.
import { describe, expect, test } from 'bun:test'
import {
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
} from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { readJsonlStats } from '../../mcps/tower/lib.mjs'

const STATEM_DIR = import.meta.dir
const STATEM = join(STATEM_DIR, 'statem.ts')
const TWR = join(STATEM_DIR, 'twr.ts')
const WORKTREE =
  process.env.AGENT_CORE ??
  '/Users/jrg/.cursor/worktrees/agent-core/wt-agnt-test-maker-w2z-pr'
const ORACLE_TOPIC = 'tower/bus-data-statem-twr-oracle'

function writeFixtureJsonl(path, parts) {
  const text = parts.join('\n') + (parts.length ? '\n' : '')
  writeFileSync(path, text)
  return text
}

/** Count concat smash, unparseable lines, and valid object rows. */
function auditJsonl(content) {
  let concat = 0
  let unparseable = 0
  let valid = 0
  for (const line of content.split('\n').filter(Boolean)) {
    if (/\}\s*\{/.test(line)) {
      concat++
      continue
    }
    try {
      const parsed = JSON.parse(line)
      if (parsed == null || typeof parsed !== 'object' || Array.isArray(parsed)) {
        unparseable++
      } else {
        valid++
      }
    } catch {
      unparseable++
    }
  }
  return { concat, unparseable, valid }
}

function writeMinimalProject(scratch, { outerStage = 'commit', cyclePhase = 'imagine' } = {}) {
  const mwDir = join(scratch, '.madewell')
  const cyclesDir = join(mwDir, 'cycles')
  mkdirSync(cyclesDir, { recursive: true })

  writeFileSync(
    join(mwDir, 'madewell.json'),
    JSON.stringify(
      {
        project: 'statem-oracle-fixture',
        profile: null,
        stage: outerStage,
        updated: new Date().toISOString(),
        context: { summary: 'oracle fixture', openThread: 'oracle' },
        discovery: [],
        active: [{ id: 'd001', cycle: '.madewell/cycles/c001.json' }],
        blocked: [],
      },
      null,
      2,
    ),
  )

  writeFileSync(
    join(mwDir, 'cycles', 'c001.json'),
    JSON.stringify({
      id: 'c001',
      parent: 'd001',
      created: new Date().toISOString(),
      phase: cyclePhase,
      imagine: [{ id: 'i001', item: 'oracle item', status: 'pending', dependsOn: [] }],
    }),
  )

  return scratch
}

function writeBaseline(path, outer, cycles = {}) {
  writeFileSync(path, JSON.stringify({ outer, cycles }))
}

async function runStatemOnce(projectRoot, { board, baseline }) {
  const args = [
    'bun',
    STATEM,
    projectRoot,
    '--once',
    '--no-tabs',
    '--board',
    board,
    '--baseline',
    baseline,
  ]
  const proc = Bun.spawn(args, {
    cwd: STATEM_DIR,
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

async function runTwrOnce(projectRoot, boardPath) {
  const proc = Bun.spawn(['bun', TWR, projectRoot, '--board', boardPath, '--once'], {
    cwd: STATEM_DIR,
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

function stripAnsi(text) {
  return text.replace(/\x1b\[[0-9;]*m/g, '')
}

/** Parse twr footer `integrity: N unparseable line(s)...` — strip ANSI first (SGR digits like [2m/[32m false-match). */
function extractIntegrityCount(text) {
  const plain = stripAnsi(text)
  const patterns = [
    /integrity:\s*(\d+)\s*unparseable/i,
    /(\d+)\s*unparseable/i,
    /bad[_\s-]?line[_\s-]?count[^\d]*(\d+)/i,
  ]
  for (const re of patterns) {
    const m = plain.match(re)
    if (m) return Number(m[1])
  }
  return null
}

function statemTransitionRow(suffix, projectRoot) {
  return {
    id: `t-statem-oracle-${suffix}`,
    ts: '2026-08-13T12:00:00.000Z',
    cwd: projectRoot,
    type: 'finding',
    from: `statem@${projectRoot}`,
    topic: 'statem',
    body: `${projectRoot} OUTER discovery→commit`,
  }
}

function nonStatemFindingRow(suffix, projectRoot) {
  return {
    id: `t-finding-oracle-${suffix}`,
    ts: '2026-08-13T12:00:00.000Z',
    cwd: projectRoot,
    type: 'finding',
    from: 'AGNT statem-twr-residuals-tests',
    topic: ORACLE_TOPIC,
    body: 'oracle non-statem finding for twr render',
  }
}

describe('statem board write — flocked append path (AC: a / T1)', () => {
  test('transition append via --board temp → parseable finding row, zero bad lines', async () => {
    const scratch = mkdtempSync(join(tmpdir(), 'statem-oracle-project-'))
    const board = join(scratch, 'board.jsonl')
    const baseline = join(scratch, 'baseline.json')

    try {
      const projectRoot = writeMinimalProject(scratch, { outerStage: 'commit' })
      writeBaseline(baseline, 'discovery', {
        c001: { phase: 'imagine', items: { i001: 'pending' } },
      })

      const beforeBytes = existsSync(board) ? readFileSync(board).length : 0
      const { code, stderr } = await runStatemOnce(projectRoot, { board, baseline })

      expect(code).toBe(0)
      expect(stderr).not.toContain('TypeError')
      expect(existsSync(board)).toBe(true)

      const raw = readFileSync(board).subarray(beforeBytes).toString('utf8')
      expect(raw.length).toBeGreaterThan(0)

      const audit = auditJsonl(raw)
      expect(audit.concat).toBe(0)
      expect(audit.unparseable).toBe(0)
      expect(audit.valid).toBeGreaterThan(0)

      const stats = readJsonlStats(board)
      expect(stats.bad_line_count).toBe(0)

      const newRows = stats.rows.slice(-audit.valid)
      const statemRows = newRows.filter(
        (r) => r.type === 'finding' && String(r.from ?? '').startsWith('statem@') && r.topic === 'statem',
      )
      expect(statemRows.length).toBeGreaterThan(0)

      for (const row of newRows) {
        expect(typeof row).toBe('object')
        expect(row).not.toBeNull()
        expect(raw).toMatch(/\n$/)
      }
    } finally {
      rmSync(scratch, { recursive: true, force: true })
    }
  }, 20_000)

  test('statem board lines are objects not double-stringified append payloads', async () => {
    const scratch = mkdtempSync(join(tmpdir(), 'statem-oracle-shape-'))
    const board = join(scratch, 'board.jsonl')
    const baseline = join(scratch, 'baseline.json')

    try {
      const projectRoot = writeMinimalProject(scratch, { outerStage: 'build' })
      writeBaseline(baseline, 'commit', {
        c001: { phase: 'plan', items: { i001: 'pending' } },
      })

      const { code } = await runStatemOnce(projectRoot, { board, baseline })
      expect(code).toBe(0)
      expect(existsSync(board)).toBe(true)

      for (const line of readFileSync(board, 'utf8').split('\n').filter(Boolean)) {
        const parsed = JSON.parse(line)
        expect(typeof parsed).toBe('object')
        expect(parsed).not.toBeNull()
        expect(typeof parsed.type).toBe('string')
        expect(String(parsed.from ?? '')).toMatch(/^statem@/)
        expect(parsed.topic).toBe('statem')
      }
    } finally {
      rmSync(scratch, { recursive: true, force: true })
    }
  }, 20_000)

  test('--board override honored — writes land on temp path not live board', async () => {
    const scratch = mkdtempSync(join(tmpdir(), 'statem-oracle-board-override-'))
    const board = join(scratch, 'isolated-board.jsonl')
    const baseline = join(scratch, 'baseline.json')
    const liveBoard = join(process.env.HOME ?? '', '.tower', 'board.jsonl')
    const liveBefore = existsSync(liveBoard) ? readFileSync(liveBoard).length : 0

    try {
      const projectRoot = writeMinimalProject(scratch, { outerStage: 'land' })
      writeBaseline(baseline, 'build', {
        c001: { phase: 'verify', items: { i001: 'done' } },
      })

      const { code } = await runStatemOnce(projectRoot, { board, baseline })
      expect(code).toBe(0)
      expect(existsSync(board)).toBe(true)
      expect(readFileSync(board, 'utf8').trim().length).toBeGreaterThan(0)

      if (existsSync(liveBoard)) {
        expect(readFileSync(liveBoard).length).toBe(liveBefore)
      }
    } finally {
      rmSync(scratch, { recursive: true, force: true })
    }
  }, 20_000)
})

describe('twr integrity surface — bad_line_count (AC: b / T2)', () => {
  test('fixture with N bad lines → twr --once reports exact bad_line_count', async () => {
    const scratch = mkdtempSync(join(tmpdir(), 'twr-oracle-integrity-'))
    const fixture = join(scratch, 'board.jsonl')
    const projectRoot = join(scratch, 'project')
    mkdirSync(projectRoot, { recursive: true })

    const goodA = JSON.stringify(statemTransitionRow('a', projectRoot))
    const goodB = JSON.stringify(nonStatemFindingRow('b', projectRoot))
    const badLines = ['{truncated-json', 'not json at all', '{"missing":']
    writeFixtureJsonl(fixture, [goodA, badLines[0], goodB, badLines[1], badLines[2], goodA])

    const expected = readJsonlStats(fixture).bad_line_count
    expect(expected).toBe(badLines.length)

    try {
      const { code, stderr, combined } = await runTwrOnce(projectRoot, fixture)
      expect(code).toBe(0)
      expect(stderr).not.toContain('TypeError')

      const surfaced = extractIntegrityCount(combined)
      expect(surfaced).not.toBeNull()
      expect(surfaced).toBe(expected)
    } finally {
      rmSync(scratch, { recursive: true, force: true })
    }
  }, 20_000)

  test('all-good fixture → twr --once reports bad_line_count=0', async () => {
    const scratch = mkdtempSync(join(tmpdir(), 'twr-oracle-clean-'))
    const fixture = join(scratch, 'board.jsonl')
    const projectRoot = join(scratch, 'project')
    mkdirSync(projectRoot, { recursive: true })

    writeFixtureJsonl(fixture, [
      JSON.stringify(statemTransitionRow('clean-a', projectRoot)),
      JSON.stringify(nonStatemFindingRow('clean-b', projectRoot)),
    ])

    try {
      const { code, combined } = await runTwrOnce(projectRoot, fixture)
      expect(code).toBe(0)
      const expected = readJsonlStats(fixture).bad_line_count
      expect(expected).toBe(0)

      const surfaced = extractIntegrityCount(combined)
      expect(surfaced).not.toBeNull()
      expect(surfaced).toBe(0)
    } finally {
      rmSync(scratch, { recursive: true, force: true })
    }
  }, 20_000)

  test('twr --once on damaged fixture does not throw', async () => {
    const scratch = mkdtempSync(join(tmpdir(), 'twr-oracle-tolerance-'))
    const fixture = join(scratch, 'board.jsonl')
    const projectRoot = join(scratch, 'project')
    mkdirSync(projectRoot, { recursive: true })

    writeFixtureJsonl(fixture, [
      JSON.stringify(statemTransitionRow('tol', projectRoot)),
      '<<<bad>>>',
      JSON.stringify(nonStatemFindingRow('tol2', projectRoot)),
    ])

    try {
      expect(() => readJsonlStats(fixture)).not.toThrow()
      const { code, stderr } = await runTwrOnce(projectRoot, fixture)
      expect(code).toBe(0)
      expect(stderr).not.toContain('TypeError')
    } finally {
      rmSync(scratch, { recursive: true, force: true })
    }
  }, 20_000)
})

describe('twr render — good lines still parse and display (AC: c)', () => {
  test('twr --once renders TRANSITIONS and FINDINGS for good rows amid bad lines', async () => {
    const scratch = mkdtempSync(join(tmpdir(), 'twr-oracle-render-'))
    const fixture = join(scratch, 'board.jsonl')
    const projectRoot = join(scratch, 'project')
    mkdirSync(projectRoot, { recursive: true })

    const transition = statemTransitionRow('render', projectRoot)
    const finding = nonStatemFindingRow('render', projectRoot)
    writeFixtureJsonl(fixture, [
      JSON.stringify(transition),
      '{bad line}',
      JSON.stringify(finding),
    ])

    try {
      const { stdout, combined, code, stderr } = await runTwrOnce(projectRoot, fixture)
      expect(code).toBe(0)
      expect(stderr).not.toContain('TypeError')

      const hay = `${stdout}\n${combined}`
      expect(hay).toMatch(/TRANSITIONS/i)
      expect(hay).toMatch(/FINDINGS/i)
      // twr clips long lines to terminal width — anchor on prefixes that survive clip
      expect(hay).toMatch(/OUTER disc/)
      expect(hay).toMatch(/oracle non-statem/)
      expect(hay).toMatch(new RegExp(ORACLE_TOPIC.replace(/\//g, '\\/')))
    } finally {
      rmSync(scratch, { recursive: true, force: true })
    }
  }, 20_000)

  test('readJsonlStats rows from fixture match twr-scoped good line count', async () => {
    const scratch = mkdtempSync(join(tmpdir(), 'twr-oracle-rows-'))
    const fixture = join(scratch, 'board.jsonl')
    const projectRoot = join(scratch, 'project')
    mkdirSync(projectRoot, { recursive: true })

    writeFixtureJsonl(fixture, [
      JSON.stringify(statemTransitionRow('rows-a', projectRoot)),
      'garbage',
      JSON.stringify(nonStatemFindingRow('rows-b', projectRoot)),
    ])

    try {
      const stats = readJsonlStats(fixture)
      expect(stats.rows.length).toBe(2)
      expect(stats.bad_line_count).toBe(1)

      const { code, combined } = await runTwrOnce(projectRoot, fixture)
      expect(code).toBe(0)
      expect(extractIntegrityCount(combined)).toBe(1)
    } finally {
      rmSync(scratch, { recursive: true, force: true })
    }
  }, 20_000)
})
