#!/usr/bin/env bun
// Oracle tests for tower write-path hardening (T5+T6).
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
import { append, boardFor } from './lib.mjs'
import { renderMessage as renderMessageLedger } from '/Users/jrg/agent-core/primitives/hooks/tower-ledger.mjs'
import { renderMessage as renderMessageLib } from './lib.mjs'

const TOWER_DIR = import.meta.dir
const CLI = join(TOWER_DIR, 'cli.mjs')
const SERVER = join(TOWER_DIR, 'server.mjs')
const BOARD_PATH = join(process.env.HOME, '.tower', 'board.jsonl')
const SKILL_PATH = join(TOWER_DIR, '../../skills/brief/SKILL.md')
const TWR = join(TOWER_DIR, '../../tools/statem/twr.ts')
const AGENT_CORE = '/Users/jrg/agent-core'
const ORACLE_TOPIC = 'tower/bus-data-write-path-oracle'

const lineageSample = {
  id: 't-write-path-lineage-oracle',
  ts: new Date().toISOString(),
  cwd: AGENT_CORE,
  kind: 'lineage',
  via: 'write-path-oracle',
  topic: ORACLE_TOPIC,
  body: 'oracle-parent -> oracle-child',
}

function boardLineCount() {
  if (!existsSync(BOARD_PATH)) return 0
  return readFileSync(BOARD_PATH, 'utf8').split('\n').filter(Boolean).length
}

function readBoardTail(n = 1) {
  if (!existsSync(BOARD_PATH)) return []
  const lines = readFileSync(BOARD_PATH, 'utf8').split('\n').filter(Boolean)
  return lines.slice(-n).map((line) => JSON.parse(line))
}

/** Minimal newline-delimited JSON-RPC 2.0 client — pattern from server-drift oracle. */
async function withMcp(cwd, fn) {
  const proc = Bun.spawn(['bun', SERVER], {
    cwd,
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
    if (msg.error) throw new Error(`${method}: ${JSON.stringify(msg.error)}`)
    return msg.result
  }

  try {
    await rpc('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'write-path-test', version: '1.0' },
    })
    proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n')
    return await fn(rpc)
  } finally {
    proc.kill()
    await Promise.race([proc.exited, new Promise((resolve) => setTimeout(resolve, 2000))])
  }
}

/** Call board_post; return { ok, text, threw, boardDelta }. */
async function tryBoardPost(rpc, args) {
  const before = boardLineCount()
  let threw = false
  let text = ''
  try {
    const result = await rpc('tools/call', { name: 'board_post', arguments: args })
    text = result?.content?.[0]?.text ?? JSON.stringify(result)
    if (result?.isError) threw = true
  } catch (e) {
    threw = true
    text = String(e)
  }
  const after = boardLineCount()
  return { ok: !threw, text, threw, boardDelta: after - before }
}

describe('board_post from-required rejection (AC: patch gap a)', () => {
  const authoredTypes = ['note', 'claim', 'finding']

  for (const type of authoredTypes) {
    test(`board_post rejects ${type} without from — no append`, async () => {
      const oracleId = `reject-no-from-${type}-${Date.now().toString(36)}`
      const before = boardLineCount()

      await withMcp(AGENT_CORE, async (rpc) => {
        const { threw, text, boardDelta } = await tryBoardPost(rpc, {
          type,
          topic: ORACLE_TOPIC,
          body: `write-path oracle ${oracleId}`,
        })
        expect(threw).toBe(true)
        expect(text.toLowerCase()).toMatch(/from/)
        expect(boardDelta).toBe(0)
      })

      expect(boardLineCount()).toBe(before)
    }, 20_000)
  }

  test('board_post rejects empty from string — no append', async () => {
    const oracleId = `reject-empty-from-${Date.now().toString(36)}`
    const before = boardLineCount()

    await withMcp(AGENT_CORE, async (rpc) => {
      const { threw, text, boardDelta } = await tryBoardPost(rpc, {
        type: 'note',
        topic: ORACLE_TOPIC,
        body: `write-path oracle ${oracleId}`,
        from: '   ',
      })
      expect(threw).toBe(true)
      expect(text.toLowerCase()).toMatch(/from/)
      expect(boardDelta).toBe(0)
    })

    expect(boardLineCount()).toBe(before)
  }, 20_000)
})

describe('cli default-from (AC: cli post still works)', () => {
  test('cli post without --from defaults from to cli:$USER', async () => {
    const oracleId = `cli-default-from-${Date.now().toString(36)}`
    const before = boardLineCount()
    const expectedFrom = `cli:${process.env.USER ?? 'unknown'}`

    const proc = Bun.spawn(
      ['bun', CLI, 'post', 'note', ORACLE_TOPIC, `write-path oracle ${oracleId}`],
      { cwd: AGENT_CORE, stdout: 'pipe', stderr: 'pipe' },
    )
    const [stdout, stderr, code] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
      proc.exited,
    ])

    expect(code).toBe(0)
    expect(stderr).not.toContain('TypeError')
    expect(boardLineCount()).toBe(before + 1)

    const row = readBoardTail(1)[0]
    expect(row).toBeDefined()
    expect(row.from).toBe(expectedFrom)
    expect(row.topic).toBe(ORACLE_TOPIC)
    expect(String(row.body ?? row.message ?? '')).toContain(oracleId)
    expect(stdout + stderr).not.toMatch(/reject|required.*from/i)
  }, 15_000)
})

describe('brief skill — no hand-append (AC: patch gap b)', () => {
  test('brief SKILL.md does not teach hand-append to board.jsonl', () => {
    expect(existsSync(SKILL_PATH)).toBe(true)
    const skill = readFileSync(SKILL_PATH, 'utf8')
    expect(skill).not.toMatch(/append one JSON line to\s+\S*board\.jsonl/i)
    expect(skill).not.toMatch(/append.*JSON line.*board\.jsonl/i)
  })

  test('brief SKILL.md teaches bun cli.mjs post', () => {
    const skill = readFileSync(SKILL_PATH, 'utf8')
    expect(skill).toMatch(/bun\s+\S*cli\.mjs\s+post/)
  })
})

describe('reader tolerance — machine rows without from (AC: T6)', () => {
  test('renderMessage tolerates kind=lineage row without from (lib)', () => {
    expect(() => renderMessageLib(lineageSample)).not.toThrow()
    const out = renderMessageLib(lineageSample)
    expect(out).toMatch(/from (unknown|\?)/)
  })

  test('renderMessage tolerates kind=lineage row without from (tower-ledger)', () => {
    expect(() => renderMessageLedger(lineageSample)).not.toThrow()
    const out = renderMessageLedger(lineageSample)
    expect(out).toMatch(/from (unknown|\?)/)
  })

  test('boardFor live rows missing from do not break renderMessage', () => {
    const rows = boardFor(AGENT_CORE, { limit: 5000 })
    for (const row of rows) {
      expect(() => renderMessageLib(row)).not.toThrow()
      const from = row?.from
      if (from == null || (typeof from === 'string' && from.trim() === '')) {
        expect(renderMessageLib(row)).toMatch(/from (unknown|\?)/)
      }
    }
  })

  test('twr renders fixture board with lineage row lacking from', async () => {
    const scratch = mkdtempSync(join(tmpdir(), 'tower-write-path-twr-'))
    const fixture = join(scratch, 'board.jsonl')
    writeFileSync(fixture, JSON.stringify(lineageSample) + '\n')

    try {
      const proc = Bun.spawn(
        ['bun', TWR, AGENT_CORE, '--board', fixture, '--interval', '60000'],
        { stdout: 'pipe', stderr: 'pipe' },
      )
      await new Promise((resolve) => setTimeout(resolve, 800))
      proc.kill()
      const [stderr, code] = await Promise.all([
        new Response(proc.stderr).text(),
        Promise.race([proc.exited, new Promise((resolve) => setTimeout(() => resolve(0), 2000))]),
      ])
      expect(String(stderr)).not.toContain('TypeError')
      expect(code === 0 || code === null || code === 143 || code === 9).toBe(true)
    } finally {
      rmSync(scratch, { recursive: true, force: true })
    }
  }, 10_000)
})

describe('append serializer — newline-terminated JSON (AC: write path shape)', () => {
  test('append writes newline-terminated parseable JSON', () => {
    const scratch = mkdtempSync(join(tmpdir(), 'tower-write-path-append-'))
    const file = join(scratch, 'board.jsonl')
    const obj = {
      id: 't-append-oracle',
      ts: new Date().toISOString(),
      cwd: AGENT_CORE,
      type: 'note',
      from: 'write-path-oracle',
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
    } finally {
      rmSync(scratch, { recursive: true, force: true })
    }
  })

  test('cli post appends newline-terminated JSON line', async () => {
    const oracleId = `append-shape-${Date.now().toString(36)}`
    const beforeBytes = existsSync(BOARD_PATH) ? readFileSync(BOARD_PATH).length : 0

    const proc = Bun.spawn(
      ['bun', CLI, 'post', 'note', ORACLE_TOPIC, `write-path oracle ${oracleId}`, '--from', 'AGNT write-path-tests'],
      { cwd: AGENT_CORE, stdout: 'pipe', stderr: 'pipe' },
    )
    const code = await proc.exited
    expect(code).toBe(0)

    const tail = readFileSync(BOARD_PATH).subarray(beforeBytes).toString('utf8')
    expect(tail.endsWith('\n')).toBe(true)
    const line = tail.trimEnd()
    const parsed = JSON.parse(line)
    expect(parsed.from).toBe('AGNT write-path-tests')
    expect(String(parsed.body ?? parsed.message ?? '')).toContain(oracleId)
  }, 15_000)
})
