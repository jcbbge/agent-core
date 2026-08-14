#!/usr/bin/env bun
// Oracle tests for the dead-letter path (COMMS-ARCH §Alarm rationalization).
//
// Law under test:
//   "Malformed questions (discovered on read or rejected at write) go to
//    ~/.tower/dead-letter.jsonl, never into openQuestions."
//   "Validate at emit — ask_user requires a non-empty trimmed message;
//    malformed emits are rejected loudly, never persisted to the ledger."
//
// The sink path is env-overridable (TOWER_DEAD_LETTER_PATH) so these tests
// never write to the operator's live ~/.tower/dead-letter.jsonl.
import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { existsSync, readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import {
  deadLetter,
  deadLetterOnce,
  deadLetterPath,
  openQuestionRows,
  questionRejectReason,
  readDeadLetters,
  deriveInboxStateFromCursor,
  DEAD_LETTER,
} from './lib.mjs'

const TOWER_DIR = import.meta.dir
const SERVER = join(TOWER_DIR, 'server.mjs')
const AGENT_CORE = '/Users/jrg/agent-core'
const LIVE_LEDGER = join(process.env.HOME ?? '', '.tower', 'ledger.jsonl')

let sinkRoot = null
let sinkPath = null
let prevSink

beforeEach(() => {
  sinkRoot = mkdtempSync(join(tmpdir(), 'tower-dead-letter-'))
  sinkPath = join(sinkRoot, 'dead-letter.jsonl')
  prevSink = process.env.TOWER_DEAD_LETTER_PATH
  process.env.TOWER_DEAD_LETTER_PATH = sinkPath
})

afterEach(() => {
  if (prevSink === undefined) delete process.env.TOWER_DEAD_LETTER_PATH
  else process.env.TOWER_DEAD_LETTER_PATH = prevSink
  if (sinkRoot) rmSync(sinkRoot, { recursive: true, force: true })
})

function sinkRows(path = sinkPath) {
  if (!existsSync(path)) return []
  return readFileSync(path, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((l) => JSON.parse(l))
}

function question(id, message, extra = {}) {
  return { id, ts: '2026-08-14T12:00:00.000Z', cwd: AGENT_CORE, kind: 'question', ...extra, message }
}

/** Minimal newline-delimited JSON-RPC 2.0 client — pattern from write-path oracle. */
async function withMcp(cwd, env, fn) {
  const proc = Bun.spawn(['bun', SERVER], {
    cwd,
    env: { ...process.env, ...env },
    stdin: 'pipe',
    stdout: 'pipe',
    stderr: 'pipe',
  })

  let buf = ''
  const decoder = new TextDecoder()
  let nextId = 1
  const reader = proc.stdout.getReader()

  const readResponse = async () => {
    while (!buf.includes('\n')) {
      const { done, value } = await reader.read()
      if (done) {
        const err = await new Response(proc.stderr).text()
        throw new Error(`MCP server closed before response${err ? `: ${err}` : ''}`)
      }
      buf += decoder.decode(value)
    }
    const nl = buf.indexOf('\n')
    const line = buf.slice(0, nl)
    buf = buf.slice(nl + 1)
    return JSON.parse(line)
  }

  const rpc = async (method, params = {}) => {
    const id = nextId++
    proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n')
    const msg = await readResponse()
    if (msg.error) throw new Error(`${method}: ${msg.error.message ?? JSON.stringify(msg.error)}`)
    return msg.result
  }

  try {
    await rpc('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'dead-letter-test', version: '1.0' },
    })
    proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n')
    return await fn(rpc)
  } finally {
    proc.kill()
    await Promise.race([proc.exited, new Promise((resolve) => setTimeout(resolve, 2000))])
  }
}

/**
 * Count question rows this oracle authored on the live ledger. Concurrency-safe:
 * a parallel agent appending its own rows cannot perturb this number.
 */
function oracleQuestionCount() {
  if (!existsSync(LIVE_LEDGER)) return 0
  let n = 0
  for (const line of readFileSync(LIVE_LEDGER, 'utf8').split('\n')) {
    if (!line) continue
    let row
    try {
      row = JSON.parse(line)
    } catch {
      continue
    }
    if (row?.kind === 'question' && row?.from === 'dead-letter-oracle') n++
  }
  return n
}

describe('sink path (AC: law names ~/.tower/dead-letter.jsonl)', () => {
  test('default constant is ~/.tower/dead-letter.jsonl', () => {
    expect(DEAD_LETTER).toBe(join(process.env.HOME ?? '', '.tower', 'dead-letter.jsonl'))
  })

  test('env override redirects the sink (tests only)', () => {
    expect(deadLetterPath()).toBe(sinkPath)
  })
})

describe('question validation (AC: non-empty trimmed message)', () => {
  const bad = [
    ['undefined message', question('q-undef', undefined)],
    ['null message', question('q-null', null)],
    ['empty string', question('q-empty', '')],
    ['whitespace only', question('q-ws', '   \n\t ')],
    ['non-string message', question('q-num', 42)],
    ['id/ts/cwd/kind only', { id: 'q-bare', ts: '2026-08-14T12:00:00.000Z', cwd: AGENT_CORE, kind: 'question' }],
  ]

  for (const [label, row] of bad) {
    test(`rejects ${label}`, () => {
      expect(questionRejectReason(row)).toBeTruthy()
    })
  }

  test('accepts a real question', () => {
    expect(questionRejectReason(question('q-ok', 'Which branch should I cut from?'))).toBeNull()
  })

  test('non-question rows are never judged', () => {
    expect(questionRejectReason({ id: 'x', kind: 'progress' })).toBeNull()
    expect(questionRejectReason({ id: 'x', kind: 'ack', ids: [] })).toBeNull()
  })
})

describe('read side (AC: malformed never enters openQuestions; sink gets the row)', () => {
  test('malformed question is excluded and dead-lettered with a reason', () => {
    const rows = [
      question('q-good-1', 'Do we ship Friday?'),
      { id: 'q-bare-1', ts: '2026-08-14T12:00:00.000Z', cwd: AGENT_CORE, kind: 'question' },
      { id: 'p-1', kind: 'progress', message: 'still working' },
    ]
    const open = openQuestionRows(rows, new Set())
    expect(open.map((r) => r.id)).toEqual(['q-good-1'])

    const sink = sinkRows()
    expect(sink.length).toBe(1)
    expect(sink[0].id).toBe('q-bare-1')
    expect(sink[0].kind).toBe('question')
    expect(sink[0].reason).toMatch(/read-side/)
    expect(sink[0].reason).toMatch(/message/)
    expect(typeof sink[0].dead_lettered_at).toBe('string')
    expect(Number.isNaN(Date.parse(sink[0].dead_lettered_at))).toBe(false)
  })

  test('answered well-formed questions stay out of open, and out of the sink', () => {
    const rows = [question('q-answered', 'Ship it?'), question('q-open', 'Which host?')]
    const open = openQuestionRows(rows, new Set(['q-answered']))
    expect(open.map((r) => r.id)).toEqual(['q-open'])
    expect(sinkRows().length).toBe(0)
  })

  test('repeated reads do not re-append the same id (idempotence)', () => {
    const rows = [{ id: 'q-bare-2', ts: '2026-08-14T12:00:00.000Z', cwd: AGENT_CORE, kind: 'question' }]
    for (let i = 0; i < 5; i++) expect(openQuestionRows(rows, new Set())).toEqual([])
    const sink = sinkRows()
    expect(sink.length).toBe(1)
    expect(sink[0].id).toBe('q-bare-2')
  })

  test('an id another process already dead-lettered is not re-appended', () => {
    writeFileSync(
      sinkPath,
      JSON.stringify({
        id: 'q-foreign',
        kind: 'question',
        reason: 'read-side: written by another process',
        dead_lettered_at: '2026-08-14T11:00:00.000Z',
      }) + '\n'
    )
    const rows = [{ id: 'q-foreign', ts: '2026-08-14T12:00:00.000Z', cwd: AGENT_CORE, kind: 'question' }]
    expect(openQuestionRows(rows, new Set())).toEqual([])
    expect(sinkRows().length).toBe(1)
  })

  test('deadLetterOnce returns the entry first, null after', () => {
    const row = question('q-once', '')
    expect(deadLetterOnce(row, 'first')).toBeTruthy()
    expect(deadLetterOnce(row, 'second')).toBeNull()
    expect(sinkRows().length).toBe(1)
    expect(readDeadLetters().length).toBe(1)
  })

  test('deadLetter always appends (no id-dedup contract)', () => {
    deadLetter(question('q-force', ''), 'one')
    deadLetter(question('q-force', ''), 'two')
    expect(sinkRows().map((r) => r.reason)).toEqual(['one', 'two'])
  })

  test('cursor-derived inbox state excludes malformed questions (lib.mjs path)', () => {
    const cursor = {
      acked: [],
      answeredIds: [],
      byCwd: {
        [AGENT_CORE]: [
          question('q-cursor-good', 'Real question?'),
          { id: 'q-cursor-bare', ts: '2026-08-14T12:00:00.000Z', cwd: AGENT_CORE, kind: 'question' },
        ],
      },
      allRows: [],
    }
    const state = deriveInboxStateFromCursor(cursor, AGENT_CORE)
    expect(state.openQuestions.map((r) => r.id)).toEqual(['q-cursor-good'])
    expect(sinkRows().map((r) => r.id)).toEqual(['q-cursor-bare'])
  })
})

describe('emit side (AC: ask_user rejects loudly, ledger untouched, sink written)', () => {
  const cases = [
    ['empty string', ''],
    ['whitespace only', '   \n  '],
    ['missing question', undefined],
  ]

  for (const [label, q] of cases) {
    test(`ask_user with ${label} is refused and dead-lettered`, async () => {
      const before = oracleQuestionCount()
      const args = q === undefined ? { from: 'dead-letter-oracle' } : { question: q, from: 'dead-letter-oracle' }

      const { threw, text } = await withMcp(AGENT_CORE, { TOWER_DEAD_LETTER_PATH: sinkPath }, async (rpc) => {
        try {
          const result = await rpc('tools/call', { name: 'ask_user', arguments: args })
          return { threw: false, text: result?.content?.[0]?.text ?? JSON.stringify(result) }
        } catch (e) {
          return { threw: true, text: String(e) }
        }
      })

      expect(threw).toBe(true)
      expect(text.toLowerCase()).toMatch(/refused/)
      expect(text).toMatch(/dead-letter/)

      const sink = sinkRows()
      expect(sink.length).toBe(1)
      expect(sink[0].kind).toBe('question')
      expect(sink[0].reason).toMatch(/emit-side/)
      expect(typeof sink[0].dead_lettered_at).toBe('string')

      // The rejected row never reached the ledger.
      expect(oracleQuestionCount()).toBe(before)
      if (existsSync(LIVE_LEDGER)) {
        expect(readFileSync(LIVE_LEDGER, 'utf8').includes(sink[0].id)).toBe(false)
      }
    }, 20_000)
  }

  test('a well-formed ask_user still succeeds (no false rejection)', async () => {
    const probe = `dead-letter oracle probe ${Date.now().toString(36)} — answered immediately, ignore`
    const { text, qid, answered } = await withMcp(
      AGENT_CORE,
      { TOWER_DEAD_LETTER_PATH: sinkPath },
      async (rpc) => {
        const result = await rpc('tools/call', {
          name: 'ask_user',
          arguments: { question: probe, from: 'dead-letter-oracle' },
        })
        const text = result?.content?.[0]?.text ?? ''
        const qid = text.match(/Question (t-[a-z0-9-]+) is open/)?.[1] ?? null
        // Close it right away — an oracle must not leave an open question on the live bus.
        const ack = await rpc('tools/call', {
          name: 'reply',
          arguments: { question_id: qid, answer: 'oracle self-answer — test fixture, no action needed' },
        })
        return { text, qid, answered: ack?.content?.[0]?.text ?? '' }
      }
    )

    expect(text).toMatch(/is open/)
    expect(qid).toBeTruthy()
    expect(answered).toMatch(/Answer recorded/)
    expect(sinkRows().length).toBe(0)
  }, 20_000)
})
