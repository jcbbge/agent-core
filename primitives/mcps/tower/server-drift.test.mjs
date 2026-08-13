#!/usr/bin/env bun
// Oracle tests for tower-server-drift — reconcile ~/.tower/server.mjs
// Authored from plan/brief only — never from implementation source.
import { describe, expect, test } from 'bun:test'
import {
  existsSync,
  readFileSync,
  appendFileSync,
  statSync,
} from 'node:fs'
import { join } from 'node:path'
import { mkdtempSync, realpathSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'

const TOWER_DIR = import.meta.dir
const LIVE_SERVER = join(TOWER_DIR, 'server.mjs')
const CANONICAL_SERVER = join(process.env.HOME, 'herdr-spine/cc-hooks/server.mjs')
const INSTALL_SH = join(process.env.HOME, 'herdr-spine/install.sh')
const BACKUP_PATH = join(TOWER_DIR, 'server.mjs.bak-20260812')
const BOARD_PATH = join(TOWER_DIR, 'board.jsonl')
const LEDGER_PATH = join(TOWER_DIR, 'ledger.jsonl')
const CLEAR_INBOX =
  'Tower inbox is clear — nothing unrelayed, no open questions.'

function readBoardRows() {
  if (!existsSync(BOARD_PATH)) return []
  return readFileSync(BOARD_PATH, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line)
      } catch {
        return null
      }
    })
    .filter(Boolean)
}

/** Minimal newline-delimited JSON-RPC 2.0 client — no warm-pipe wait (WS6 lesson). */
async function withMcp(cwd, fn) {
  const proc = Bun.spawn(['bun', LIVE_SERVER], {
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
      clientInfo: { name: 'server-drift-test', version: '1.0' },
    })
    proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n')
    return await fn(rpc)
  } finally {
    proc.kill()
    await Promise.race([
      proc.exited,
      new Promise((resolve) => setTimeout(resolve, 2000)),
    ])
  }
}

describe('install.sh drift guard (AC: drift resolved)', () => {
  test('install.sh emits no drift warning', async () => {
    const proc = Bun.spawn(['bash', INSTALL_SH], {
      stdout: 'pipe',
      stderr: 'pipe',
    })
    const [stdout, stderr, code] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
      proc.exited,
    ])
    const combined = `${stdout}\n${stderr}`
    expect(code).toBe(0)
    expect(combined).not.toContain('drift; NOT overwriting')
    expect(combined).not.toMatch(/matches neither canonical nor pre-fold base/)
  }, 120_000)

  test('install.sh reports relay_inbox reconciled', async () => {
    const proc = Bun.spawn(['bash', INSTALL_SH], {
      stdout: 'pipe',
      stderr: 'pipe',
    })
    const [stdout, stderr, code] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
      proc.exited,
    ])
    const combined = `${stdout}\n${stderr}`
    expect(code).toBe(0)
    // Three outcomes now count as reconciled. The third was added 2026-08-13 with
    // herdr-spine b42132e: once ~/.tower/server.mjs is a symlink into the canonical
    // home, install_tower_auto() must leave it ALONE — `cp` follows a symlink and
    // rewrites its target, so writing here would silently edit the git-tracked file.
    // Skipping is the correct reconciled state, not a failure to reconcile.
    const reconciled =
      combined.includes('tower server.mjs already carries relay_inbox (identical).') ||
      combined.includes('Installed tower server.mjs with relay_inbox') ||
      combined.includes('tower server.mjs is a symlink (externally managed')
    expect(reconciled).toBe(true)
  }, 120_000)
})

describe('SHA reconciliation (AC: merge keeps fixes, canonical gains relay_inbox)', () => {
  test('live server.mjs byte-identical to canonical', () => {
    expect(existsSync(LIVE_SERVER)).toBe(true)
    expect(existsSync(CANONICAL_SERVER)).toBe(true)
    const live = readFileSync(LIVE_SERVER)
    const canonical = readFileSync(CANONICAL_SERVER)
    expect(Buffer.compare(live, canonical)).toBe(0)
  })

  test('canonical server.mjs present for install.sh parity', () => {
    expect(existsSync(CANONICAL_SERVER)).toBe(true)
    expect(statSync(CANONICAL_SERVER).size).toBeGreaterThan(0)
  })
})

describe('backup on disk (AC: pre-edit backup)', () => {
  test('server.mjs.bak-20260812 exists', () => {
    expect(existsSync(BACKUP_PATH)).toBe(true)
    expect(statSync(BACKUP_PATH).isFile()).toBe(true)
  })
})

describe('cli regression (AC: tests green)', () => {
  test('cli.test.mjs all green', async () => {
    const proc = Bun.spawn(['bun', 'test', join(TOWER_DIR, 'cli.test.mjs')], {
      stdout: 'pipe',
      stderr: 'pipe',
    })
    const [stdout, stderr, code] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
      proc.exited,
    ])
    expect(code).toBe(0)
    expect(stderr).not.toContain('FAIL')
    expect(stdout + stderr).toMatch(/\d+ pass/)
    expect(stdout + stderr).not.toMatch(/[1-9]\d* fail/)
  }, 60_000)
})

describe('MCP stdio smoke (AC: server path starts)', () => {
  test('initialize succeeds', async () => {
    await withMcp(TOWER_DIR, async (rpc) => {
      const tools = await rpc('tools/list')
      expect(tools).toBeDefined()
    })
  }, 15_000)

  test('tools/list registers relay_inbox', async () => {
    await withMcp(TOWER_DIR, async (rpc) => {
      const { tools } = await rpc('tools/list')
      const names = tools.map((t) => t.name)
      expect(names).toContain('relay_inbox')
      expect(names).toContain('send_to_user')
      expect(names).toContain('board_read')
    })
  }, 15_000)
})

describe('relay_inbox behavior (AC: CC4 — fixes preserved)', () => {
  test('relay_inbox empty inbox message', async () => {
    // realpath: macOS tmpdir is /var/folders (symlink to /private/var) and the
    // server's cwd resolves through it — inboxState matches cwd by string.
    const scratch = realpathSync(mkdtempSync(join(tmpdir(), 'tower-sdrift-empty-')))
    try {
      await withMcp(scratch, async (rpc) => {
        const result = await rpc('tools/call', { name: 'relay_inbox', arguments: {} })
        const text = result?.content?.[0]?.text ?? result?.content ?? String(result)
        expect(String(text)).toContain(CLEAR_INBOX)
      })
    } finally {
      rmSync(scratch, { recursive: true, force: true })
    }
  }, 15_000)

  test('relay_inbox render+ack in one call', async () => {
    const scratch = realpathSync(mkdtempSync(join(tmpdir(), 'tower-sdrift-ack-')))
    const seedId = `t-sdrift-${Date.now().toString(36)}`
    const seedBody = `server-drift oracle seed ${seedId}`
    const beforeSize = existsSync(LEDGER_PATH) ? statSync(LEDGER_PATH).size : 0

    const seedRow = {
      id: seedId,
      ts: new Date().toISOString(),
      cwd: scratch,
      kind: 'deliverable',
      to: 'operator',
      message: seedBody,
      from: 'server-drift-test',
    }
    appendFileSync(LEDGER_PATH, JSON.stringify(seedRow) + '\n')

    try {
      await withMcp(scratch, async (rpc) => {
        const result = await rpc('tools/call', { name: 'relay_inbox', arguments: {} })
        const text = result?.content?.[0]?.text ?? ''
        expect(text).toContain(seedId)
        expect(text).toContain(seedBody)
      })

      // byte offset from statSync must slice a Buffer — string slice uses
      // UTF-16 units and drifts on any multi-byte content upstream
      const tail = readFileSync(LEDGER_PATH).subarray(beforeSize).toString('utf8')
      const newRows = tail
        .split('\n')
        .filter(Boolean)
        .map((l) => JSON.parse(l))
      const ackForSeed = newRows.filter(
        (r) => r.kind === 'ack' && Array.isArray(r.ids) && r.ids.includes(seedId)
      )
      expect(ackForSeed.length).toBe(1)
    } finally {
      rmSync(scratch, { recursive: true, force: true })
    }
  }, 20_000)
})

describe('board findings (AC: findings to tower/server-drift)', () => {
  test('tower/server-drift topic has finding', () => {
    const rows = readBoardRows().filter((r) => r.topic === 'tower/server-drift')
    expect(rows.length).toBeGreaterThan(0)
    const hasBody = rows.some((r) => {
      const body = r.body ?? r.message ?? r.title ?? ''
      return String(body).trim().length > 0
    })
    expect(hasBody).toBe(true)
  })
})
