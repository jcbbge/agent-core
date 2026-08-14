#!/usr/bin/env bun
// Oracle tests for flock-integrity (T2 flock append + T3 tolerate-and-count).
// Authored from plan/brief only — never from implementation source.
import { describe, expect, test } from 'bun:test'
import {
  existsSync,
  readFileSync,
  writeFileSync,
  mkdtempSync,
  rmSync,
} from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { append, readAllFull, readJsonlStats } from './lib.mjs'
import { renderMessage as renderMessageLedger } from '../../hooks/tower-ledger.mjs'
import { renderMessage as renderMessageLib } from './lib.mjs'

const TOWER_DIR = import.meta.dir
const LIB = join(TOWER_DIR, 'lib.mjs')
const AGENT_CORE = '/Users/jrg/.cursor/worktrees/agent-core/wt-agnt-test-maker-w2z-pg'
const ORACLE_TOPIC = 'tower/bus-data-flock-oracle'

const machineRowSample = {
  id: 't-flock-lineage-oracle',
  ts: new Date().toISOString(),
  cwd: AGENT_CORE,
  kind: 'lineage',
  via: 'flock-integrity-oracle',
  topic: ORACLE_TOPIC,
  body: 'oracle-parent -> oracle-child',
}

function writeFixture(file, lines) {
  const body = lines.length ? lines.join('\n') + '\n' : ''
  writeFileSync(file, body)
}

function goodRow(suffix) {
  return JSON.stringify({
    id: `t-flock-good-${suffix}`,
    ts: new Date().toISOString(),
    cwd: AGENT_CORE,
    type: 'note',
    from: 'flock-integrity-oracle',
    topic: ORACLE_TOPIC,
    body: `good row ${suffix}`,
  })
}

/** Count lines that are unparseable or contain smashed JSON objects (}{). */
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
      JSON.parse(line)
      valid++
    } catch {
      unparseable++
    }
  }
  return { concat, unparseable, valid, total: concat + unparseable + valid }
}

async function runConcurrentAppendStress(file, { workers, writesPerWorker }) {
  const scratch = join(file, '..')
  const jobs = []
  for (let w = 0; w < workers; w++) {
    const script = join(scratch, `stress-worker-${w}.mjs`)
    writeFileSync(
      script,
      `import { append } from ${JSON.stringify(LIB)}
const file = process.argv[2]
const tag = process.argv[3]
const n = Number(process.argv[4])
for (let j = 0; j < n; j++) {
  append(file, {
    id: \`\${tag}-\${j}\`,
    ts: new Date().toISOString(),
    cwd: ${JSON.stringify(AGENT_CORE)},
    type: 'note',
    from: 'flock-stress',
    topic: ${JSON.stringify(ORACLE_TOPIC)},
    body: 'stress',
  })
}
`,
    )
    jobs.push(
      Bun.spawn(['bun', script, file, `w${w}`, String(writesPerWorker)], {
        stdout: 'pipe',
        stderr: 'pipe',
      }),
    )
  }
  const results = await Promise.all(
    jobs.map(async (proc) => {
      const [code, stderr] = await Promise.all([
        proc.exited,
        new Response(proc.stderr).text(),
      ])
      return { code, stderr }
    }),
  )
  for (const r of results) {
    expect(r.code).toBe(0)
    expect(r.stderr).not.toContain('TypeError')
  }
}

describe('readJsonlStats tolerate-and-count — clean file (AC: a)', () => {
  test('empty file → bad_line_count=0, rows=[]', () => {
    const scratch = mkdtempSync(join(tmpdir(), 'tower-flock-clean-'))
    const file = join(scratch, 'board.jsonl')
    try {
      writeFixture(file, [])
      const stats = readJsonlStats(file)
      expect(stats.bad_line_count).toBe(0)
      expect(Array.isArray(stats.rows)).toBe(true)
      expect(stats.rows.length).toBe(0)
      expect(readAllFull(file).length).toBe(0)
    } finally {
      rmSync(scratch, { recursive: true, force: true })
    }
  })

  test('valid lines only → bad_line_count=0, rows length matches', () => {
    const scratch = mkdtempSync(join(tmpdir(), 'tower-flock-valid-'))
    const file = join(scratch, 'board.jsonl')
    try {
      writeFixture(file, [goodRow('a'), goodRow('b'), goodRow('c')])
      const stats = readJsonlStats(file)
      expect(stats.bad_line_count).toBe(0)
      expect(stats.rows.length).toBe(3)
      const rows = readAllFull(file)
      expect(rows.length).toBe(3)
      for (const row of rows) {
        expect(row.from).toBe('flock-integrity-oracle')
      }
    } finally {
      rmSync(scratch, { recursive: true, force: true })
    }
  })
})

describe('readJsonlStats tolerate-and-count — damaged lines (AC: b)', () => {
  test('N bad lines → bad_line_count=N, rows exclude them', () => {
    const scratch = mkdtempSync(join(tmpdir(), 'tower-flock-bad-'))
    const file = join(scratch, 'board.jsonl')
    const badLines = ['{truncated-json', 'not json at all', '{"missing":']
    try {
      writeFixture(file, [
        goodRow('1'),
        badLines[0],
        goodRow('2'),
        badLines[1],
        badLines[2],
        goodRow('3'),
      ])
      const stats = readJsonlStats(file)
      expect(stats.bad_line_count).toBe(badLines.length)
      expect(stats.rows.length).toBe(3)
      const ids = stats.rows.map((r) => r.id)
      expect(ids.every((id) => String(id).includes('flock-good'))).toBe(true)
      expect(readAllFull(file).length).toBe(3)
      if (stats.bad_line_numbers != null) {
        expect(stats.bad_line_numbers.length).toBe(badLines.length)
        expect(stats.bad_line_numbers).toContain(2)
        expect(stats.bad_line_numbers).toContain(4)
        expect(stats.bad_line_numbers).toContain(5)
      }
    } finally {
      rmSync(scratch, { recursive: true, force: true })
    }
  })

  test('all-bad file → bad_line_count=line count, rows=[]', () => {
    const scratch = mkdtempSync(join(tmpdir(), 'tower-flock-allbad-'))
    const file = join(scratch, 'board.jsonl')
    const bad = ['{', '}', '<<<']
    try {
      writeFixture(file, bad)
      const stats = readJsonlStats(file)
      expect(stats.bad_line_count).toBe(bad.length)
      expect(stats.rows.length).toBe(0)
      expect(readAllFull(file).length).toBe(0)
    } finally {
      rmSync(scratch, { recursive: true, force: true })
    }
  })
})

describe('reader tolerance — machine rows without from (AC: c)', () => {
  test('renderMessage tolerates kind+via row without from (lib)', () => {
    expect(() => renderMessageLib(machineRowSample)).not.toThrow()
    const out = renderMessageLib(machineRowSample)
    expect(out).toMatch(/from (unknown|\?)/)
  })

  test('renderMessage tolerates kind+via row without from (tower-ledger)', () => {
    expect(() => renderMessageLedger(machineRowSample)).not.toThrow()
    const out = renderMessageLedger(machineRowSample)
    expect(out).toMatch(/from (unknown|\?)/)
  })

  test('readAllFull rows missing from still render via renderMessage', () => {
    const scratch = mkdtempSync(join(tmpdir(), 'tower-flock-render-'))
    const file = join(scratch, 'board.jsonl')
    try {
      writeFixture(file, [JSON.stringify(machineRowSample)])
      const stats = readJsonlStats(file)
      expect(stats.bad_line_count).toBe(0)
      const rows = readAllFull(file)
      expect(rows.length).toBe(1)
      expect(rows[0].from).toBeUndefined()
      expect(() => renderMessageLib(rows[0])).not.toThrow()
      expect(renderMessageLib(rows[0])).toMatch(/from (unknown|\?)/)
    } finally {
      rmSync(scratch, { recursive: true, force: true })
    }
  })
})

describe('flock append — concurrent stress (AC: d)', () => {
  test('parallel processes via append() → zero concatenated-object lines', async () => {
    const scratch = mkdtempSync(join(tmpdir(), 'tower-flock-stress-'))
    const file = join(scratch, 'board.jsonl')
    const workers = 16
    const writesPerWorker = 20
    const expectedLines = workers * writesPerWorker

    try {
      await runConcurrentAppendStress(file, { workers, writesPerWorker })
      expect(existsSync(file)).toBe(true)
      const raw = readFileSync(file, 'utf8')
      const audit = auditJsonl(raw)
      expect(audit.concat).toBe(0)
      expect(audit.unparseable).toBe(0)
      expect(audit.valid).toBe(expectedLines)
    } finally {
      rmSync(scratch, { recursive: true, force: true })
    }
  }, 60_000)

  test('single-process rapid append() → each line is one parseable object', () => {
    const scratch = mkdtempSync(join(tmpdir(), 'tower-flock-rapid-'))
    const file = join(scratch, 'board.jsonl')
    const n = 50
    try {
      for (let i = 0; i < n; i++) {
        append(file, {
          id: `t-flock-rapid-${i}`,
          ts: new Date().toISOString(),
          cwd: AGENT_CORE,
          type: 'note',
          from: 'flock-rapid',
          topic: ORACLE_TOPIC,
          body: `rapid ${i}`,
        })
      }
      const raw = readFileSync(file, 'utf8')
      const audit = auditJsonl(raw)
      expect(audit.concat).toBe(0)
      expect(audit.unparseable).toBe(0)
      expect(audit.valid).toBe(n)
      expect(raw.endsWith('\n')).toBe(true)
    } finally {
      rmSync(scratch, { recursive: true, force: true })
    }
  })
})

describe('append serializer — newline-terminated JSON (AC: T2 shape)', () => {
  test('append writes newline-terminated parseable JSON under lock', () => {
    const scratch = mkdtempSync(join(tmpdir(), 'tower-flock-append-shape-'))
    const file = join(scratch, 'board.jsonl')
    const obj = {
      id: 't-flock-append-oracle',
      ts: new Date().toISOString(),
      cwd: AGENT_CORE,
      type: 'note',
      from: 'flock-integrity-oracle',
      topic: ORACLE_TOPIC,
      body: 'append shape check',
    }

    try {
      append(file, obj)
      const raw = readFileSync(file, 'utf8')
      expect(raw.endsWith('\n')).toBe(true)
      const lines = raw.split('\n').filter(Boolean)
      expect(lines.length).toBe(1)
      expect(JSON.parse(lines[0])).toEqual(obj)
      const stats = readJsonlStats(file)
      expect(stats.bad_line_count).toBe(0)
      expect(stats.rows.length).toBe(1)
      expect(readAllFull(file).length).toBe(1)
    } finally {
      rmSync(scratch, { recursive: true, force: true })
    }
  })
})
