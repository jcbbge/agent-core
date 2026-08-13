#!/usr/bin/env bun
// Oracle tests for w3-plane-fixes F1 + F4 (COMMS-ARCH migration item 4 closeout).
// Authored from plan/brief only — never from implementation source.
import { describe, expect, test } from 'bun:test'
import {
  existsSync,
  readFileSync,
  appendFileSync,
  statSync,
  mkdtempSync,
  realpathSync,
  rmSync,
} from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { inboxState } from './lib.mjs'

const TOWER_DIR = import.meta.dir
const SERVER = join(TOWER_DIR, 'server.mjs')
const LEDGER_PATH = join(process.env.HOME, '.tower', 'ledger.jsonl')

function ledgerByteSize() {
  return existsSync(LEDGER_PATH) ? statSync(LEDGER_PATH).size : 0
}

function readLedgerTail(sinceBytes) {
  if (!existsSync(LEDGER_PATH)) return []
  const tail = readFileSync(LEDGER_PATH).subarray(sinceBytes).toString('utf8')
  return tail
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line))
}

function findRowByMessage(rows, needle) {
  return rows.find((r) => String(r.message ?? '').includes(needle))
}

/** Minimal newline-delimited JSON-RPC 2.0 client — pattern from write-path oracle. */
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
      clientInfo: { name: 'plane-fixes-test', version: '1.0' },
    })
    proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n')
    return await fn(rpc)
  } finally {
    proc.kill()
    await Promise.race([proc.exited, new Promise((resolve) => setTimeout(resolve, 2000))])
  }
}

async function callSendToUser(rpc, args) {
  const result = await rpc('tools/call', { name: 'send_to_user', arguments: args })
  const text = result?.content?.[0]?.text ?? JSON.stringify(result)
  return { result, text, isError: Boolean(result?.isError) }
}

async function tryMarkRelayed(rpc, ids) {
  const before = ledgerByteSize()
  let threw = false
  let text = ''
  let isError = false
  try {
    const result = await rpc('tools/call', { name: 'mark_relayed', arguments: { ids } })
    text = result?.content?.[0]?.text ?? JSON.stringify(result)
    isError = Boolean(result?.isError)
    if (isError) threw = true
  } catch (e) {
    threw = true
    text = String(e)
  }
  const newRows = readLedgerTail(before)
  const ackRows = newRows.filter((r) => r.kind === 'ack')
  return { threw, text, isError, ackRows, newRows }
}

describe('F1 — send_to_user default to:operator (AC: deliverable/alert operator-addressed)', () => {
  test('deliverable mints to:"operator" and enters inboxState unrelayed', async () => {
    const scratch = realpathSync(mkdtempSync(join(tmpdir(), 'tower-plane-f1-del-')))
    const oracleId = `plane-f1-del-${Date.now().toString(36)}`
    const before = ledgerByteSize()

    try {
      await withMcp(scratch, async (rpc) => {
        const { isError } = await callSendToUser(rpc, {
          kind: 'deliverable',
          title: 'plane-fixes oracle deliverable',
          message: `F1 deliverable oracle ${oracleId}`,
          from: 'AGNT plane-fixes-tests',
        })
        expect(isError).toBe(false)
      })

      const row = findRowByMessage(readLedgerTail(before), oracleId)
      expect(row).toBeDefined()
      expect(row.kind).toBe('deliverable')
      expect(row.to).toBe('operator')
      expect(normScratch(scratch, row.cwd)).toBe(true)

      const state = inboxState(scratch)
      expect(state.unrelayed.some((m) => m.id === row.id)).toBe(true)
    } finally {
      rmSync(scratch, { recursive: true, force: true })
    }
  }, 20_000)

  test('alert mints to:"operator" and enters inboxState unrelayed', async () => {
    const scratch = realpathSync(mkdtempSync(join(tmpdir(), 'tower-plane-f1-alert-')))
    const oracleId = `plane-f1-alert-${Date.now().toString(36)}`
    const before = ledgerByteSize()

    try {
      await withMcp(scratch, async (rpc) => {
        const { isError } = await callSendToUser(rpc, {
          kind: 'alert',
          title: 'plane-fixes oracle alert',
          message: `F1 alert oracle ${oracleId}`,
          from: 'AGNT plane-fixes-tests',
        })
        expect(isError).toBe(false)
      })

      const row = findRowByMessage(readLedgerTail(before), oracleId)
      expect(row).toBeDefined()
      expect(row.kind).toBe('alert')
      expect(row.to).toBe('operator')
      expect(normScratch(scratch, row.cwd)).toBe(true)

      const state = inboxState(scratch)
      expect(state.unrelayed.some((m) => m.id === row.id)).toBe(true)
    } finally {
      rmSync(scratch, { recursive: true, force: true })
    }
  }, 20_000)

  test('progress omits operator-blocking to and stays out of unrelayed', async () => {
    const scratch = realpathSync(mkdtempSync(join(tmpdir(), 'tower-plane-f1-prog-')))
    const oracleId = `plane-f1-prog-${Date.now().toString(36)}`
    const before = ledgerByteSize()

    try {
      await withMcp(scratch, async (rpc) => {
        const { isError } = await callSendToUser(rpc, {
          kind: 'progress',
          title: 'plane-fixes oracle progress',
          message: `F1 progress oracle ${oracleId}`,
          from: 'AGNT plane-fixes-tests',
        })
        expect(isError).toBe(false)
      })

      const row = findRowByMessage(readLedgerTail(before), oracleId)
      expect(row).toBeDefined()
      expect(row.kind).toBe('progress')
      expect(row.to).not.toBe('operator')
      expect(normScratch(scratch, row.cwd)).toBe(true)

      const state = inboxState(scratch)
      expect(state.unrelayed.some((m) => m.id === row.id)).toBe(false)
    } finally {
      rmSync(scratch, { recursive: true, force: true })
    }
  }, 20_000)
})

describe('F4 — mark_relayed refuses ids not in unrelayed (AC: no silent clear)', () => {
  test('refuses arbitrary id with clear error — no ack row appended', async () => {
    const scratch = realpathSync(mkdtempSync(join(tmpdir(), 'tower-plane-f4-refuse-')))
    const fakeId = `t-plane-f4-fake-${Date.now().toString(36)}`
    const before = ledgerByteSize()

    try {
      await withMcp(scratch, async (rpc) => {
        const { threw, text, ackRows } = await tryMarkRelayed(rpc, [fakeId])
        expect(threw).toBe(true)
        expect(text.toLowerCase()).toMatch(/unrelayed|not.*relay|refus|invalid|unknown/)
        expect(ackRows.length).toBe(0)
      })

      const ackTail = readLedgerTail(before).filter((r) => r.kind === 'ack')
      expect(ackTail.length).toBe(0)
    } finally {
      rmSync(scratch, { recursive: true, force: true })
    }
  }, 20_000)

  test('refuses mixed valid+invalid ids — no ack for any id', async () => {
    const scratch = realpathSync(mkdtempSync(join(tmpdir(), 'tower-plane-f4-mixed-')))
    const seedId = `t-plane-f4-seed-${Date.now().toString(36)}`
    const fakeId = `t-plane-f4-fake-${Date.now().toString(36)}`
    const beforeSeed = ledgerByteSize()

    appendFileSync(
      LEDGER_PATH,
      JSON.stringify({
        id: seedId,
        ts: new Date().toISOString(),
        cwd: scratch,
        kind: 'deliverable',
        to: 'operator',
        message: `F4 mixed-id seed ${seedId}`,
        from: 'plane-fixes-test',
      }) + '\n',
    )

    expect(inboxState(scratch).unrelayed.some((m) => m.id === seedId)).toBe(true)

    try {
      await withMcp(scratch, async (rpc) => {
        const { threw, text, ackRows } = await tryMarkRelayed(rpc, [seedId, fakeId])
        expect(threw).toBe(true)
        expect(text.toLowerCase()).toMatch(/unrelayed|not.*relay|refus|invalid|unknown/)
        expect(ackRows.length).toBe(0)
      })

      const ackAfter = readLedgerTail(beforeSeed).filter(
        (r) => r.kind === 'ack' && Array.isArray(r.ids) && r.ids.includes(seedId),
      )
      expect(ackAfter.length).toBe(0)
      expect(inboxState(scratch).unrelayed.some((m) => m.id === seedId)).toBe(true)
    } finally {
      rmSync(scratch, { recursive: true, force: true })
    }
  }, 20_000)

  test('accepts id in scoped unrelayed and appends ack', async () => {
    const scratch = realpathSync(mkdtempSync(join(tmpdir(), 'tower-plane-f4-valid-')))
    const seedId = `t-plane-f4-valid-${Date.now().toString(36)}`
    const beforeSeed = ledgerByteSize()

    appendFileSync(
      LEDGER_PATH,
      JSON.stringify({
        id: seedId,
        ts: new Date().toISOString(),
        cwd: scratch,
        kind: 'alert',
        to: 'operator',
        message: `F4 valid ack seed ${seedId}`,
        from: 'plane-fixes-test',
      }) + '\n',
    )

    try {
      await withMcp(scratch, async (rpc) => {
        const { threw, ackRows } = await tryMarkRelayed(rpc, [seedId])
        expect(threw).toBe(false)
        expect(ackRows.length).toBe(1)
        expect(ackRows[0].ids).toContain(seedId)
      })

      expect(inboxState(scratch).unrelayed.some((m) => m.id === seedId)).toBe(false)
    } finally {
      rmSync(scratch, { recursive: true, force: true })
    }
  }, 20_000)
})

/** cwd may differ by symlink resolution; accept row cwd equivalent to scratch. */
function normScratch(scratch, rowCwd) {
  if (!rowCwd) return false
  try {
    return realpathSync(rowCwd) === realpathSync(scratch)
  } catch {
    return rowCwd === scratch
  }
}
