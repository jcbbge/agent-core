import { describe, expect, test } from 'bun:test'
import { preview, rowPreview, dayOf, timeOf } from './cli.mjs'
import { renderMessage as renderMessageNew, ledgerInboxCursor, deriveInboxStateFromCursor } from './lib.mjs'
import { renderMessage as renderMessageOld } from '/Users/jrg/agent-core/primitives/hooks/tower-ledger.mjs'

// Fixture rows reproducing live crash shapes (ledger.jsonl 2026-08-12)
const progressNoMessage = {
  id: 't-msqf17ie-wrhx',
  ts: '2026-08-12T18:21:26.726Z',
  cwd: '/Users/jrg/agent-core',
  kind: 'progress',
  title: 'rolefix DONE',
  from: 'ORCH fleet-task-rolefix',
}

const questionNoMessage = {
  id: 't-mr32yq0p-nj75',
  ts: '2026-07-02T05:45:10.969Z',
  cwd: '/Users/jrg/infinity/arc',
  kind: 'question',
}

const odometerNoTs = { tokens: 1200, tool: 'Task', label: 'spawn' }

describe('preview', () => {
  test('undefined/null/empty → fallback', () => {
    expect(preview(undefined)).toBe('(no message)')
    expect(preview(null)).toBe('(no message)')
    expect(preview('')).toBe('(no message)')
  })

  test('truncates long strings', () => {
    expect(preview('x'.repeat(150), 100)).toHaveLength(100)
  })
})

describe('rowPreview', () => {
  test('progress with title but no message (crash shape)', () => {
    expect(() => rowPreview(progressNoMessage)).not.toThrow()
    expect(rowPreview(progressNoMessage)).toBe('rolefix DONE')
  })

  test('question with no message or title', () => {
    expect(() => rowPreview(questionNoMessage)).not.toThrow()
    expect(rowPreview(questionNoMessage)).toBe('(no message)')
  })

  test('prefers message over title', () => {
    expect(rowPreview({ message: 'body', title: 'head' })).toBe('body')
  })
})

describe('dayOf / timeOf', () => {
  test('missing ts is safe', () => {
    expect(dayOf(undefined)).toBe('')
    expect(dayOf(null)).toBe('')
    expect(timeOf(undefined)).toBe('??:??:??')
  })

  test('valid ISO ts', () => {
    expect(dayOf('2026-08-12T18:21:26.726Z')).toBe('2026-08-12')
    expect(timeOf('2026-08-12T18:21:26.726Z')).toBe('18:21:26')
  })

  test('odometer row without ts does not throw via dayOf', () => {
    expect(() => dayOf(odometerNoTs.ts)).not.toThrow()
    expect(dayOf(odometerNoTs.ts)).toBe('')
  })
})

describe('status subprocess (live state)', () => {
  test('agent-core cwd — reproduces historical crash site', async () => {
    const proc = Bun.spawn(['bun', `${import.meta.dir}/cli.mjs`, 'status'], {
      cwd: '/Users/jrg/agent-core',
      stdout: 'pipe',
      stderr: 'pipe',
    })
    const [stdout, stderr, code] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
      proc.exited,
    ])
    expect(code).toBe(0)
    expect(stderr).not.toContain('TypeError')
    // live-state content assertions (e.g. a specific unit's status) rot the
    // moment fleet state changes — structure only:
    expect(stdout.length).toBeGreaterThan(0)
  })
})

describe('renderMessage (inbox path)', () => {
  test('question with no message/title — red-on-old prints undefined, green-on-new fallback', () => {
    expect(() => renderMessageOld(questionNoMessage)).not.toThrow()
    expect(renderMessageOld(questionNoMessage)).toContain('undefined')
    expect(() => renderMessageNew(questionNoMessage)).not.toThrow()
    expect(renderMessageNew(questionNoMessage)).toContain('(no message)')
    expect(renderMessageNew(questionNoMessage)).not.toContain('undefined')
  })

  test('progress with title but no message — uses title fallback', () => {
    const out = renderMessageNew(progressNoMessage)
    expect(out).toContain('rolefix DONE')
    expect(out).not.toContain('undefined')
  })

  test('missing ts — safe placeholder', () => {
    const row = { id: 'x', kind: 'alert', message: 'hi' }
    expect(renderMessageNew(row)).toContain(' · ?')
    expect(renderMessageNew(row)).toContain('hi')
  })

  test('malformed options — red-on-old throws, green-on-new survives', () => {
    const row = { id: 'x', kind: 'question', message: 'pick', options: 'not-array' }
    expect(() => renderMessageOld(row)).toThrow()
    expect(() => renderMessageNew(row)).not.toThrow()
    expect(renderMessageNew(row)).toContain('pick')
  })

  test('null row — red-on-old throws, green-on-new fallback', () => {
    expect(() => renderMessageOld(null)).toThrow()
    expect(renderMessageNew(null)).toBe('(malformed row)')
  })

  test('options array rendered when present', () => {
    const row = { id: 'x', kind: 'question', message: 'choose', ts: '2026-01-01T00:00:00.000Z', options: ['a', 'b'] }
    expect(renderMessageNew(row)).toContain('options: a | b')
  })
})

describe('inbox subprocess (live state)', () => {
  const readOnlyCmds = ['status', 'inbox', 'board', 'burn', 'all', 'projects', 'field', 'scan']

  for (const sub of readOnlyCmds) {
    test(`${sub} exits 0 from agent-core cwd`, async () => {
      const proc = Bun.spawn(['bun', `${import.meta.dir}/cli.mjs`, sub], {
        cwd: '/Users/jrg/agent-core',
        stdout: 'pipe',
        stderr: 'pipe',
      })
      const [stderr, code] = await Promise.all([new Response(proc.stderr).text(), proc.exited])
      expect(code).toBe(0)
      expect(stderr).not.toContain('TypeError')
    }, 5000)
  }
})

describe('ledger inbox cursor batch (live state)', () => {
  test('single sync serves many cwds — bounded on live ledger', () => {
    const t0 = Date.now()
    const cursor = ledgerInboxCursor()
    const scopes = Object.keys(cursor.byCwd)
    for (const scope of scopes) deriveInboxStateFromCursor(cursor, scope)
    expect(Date.now() - t0).toBeLessThan(5000)
  })

  test('deriveInboxStateFromCursor matches inboxState for agent-core cwd', async () => {
    const { inboxState } = await import('./lib.mjs')
    const cursor = ledgerInboxCursor()
    const fromCursor = deriveInboxStateFromCursor(cursor, '/Users/jrg/agent-core')
    const direct = inboxState('/Users/jrg/agent-core')
    expect(fromCursor.unrelayed.length).toBe(direct.unrelayed.length)
    expect(fromCursor.openQuestions.length).toBe(direct.openQuestions.length)
  })
})

describe('all/projects red-on-old (backup cli)', () => {
  test('backup all times out — reproduces pre-fix hang', async () => {
    const proc = Bun.spawn(['bun', `${import.meta.dir}/cli.mjs.bak-20260812T165125Z`, 'all'], {
      cwd: '/Users/jrg/agent-core',
      stdout: 'pipe',
      stderr: 'pipe',
    })
    const raced = await Promise.race([
      proc.exited.then((code) => ({ kind: 'exit', code })),
      new Promise((resolve) => setTimeout(() => resolve({ kind: 'timeout' }), 2000)),
    ])
    if (raced.kind === 'timeout') proc.kill()
    expect(raced.kind).toBe('timeout')
  }, 5000)
})
