#!/usr/bin/env bun
// Oracle tests for tower-server-drift — reconcile ~/.tower/server.mjs
// Authored from plan/brief only — never from implementation source.
import { describe, expect, test } from 'bun:test'
import {
  existsSync,
  readFileSync,
  appendFileSync,
  mkdirSync,
  statSync,
} from 'node:fs'
import { join } from 'node:path'
import { mkdtempSync, realpathSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'

const TOWER_DIR = import.meta.dir
const LIVE_SERVER = join(TOWER_DIR, 'server.mjs')
const CANONICAL_SERVER = join(process.env.HOME, 'agent-core/primitives/mcps/tower/server.mjs')
const INSTALL_SH = join(process.env.HOME, 'herdr-spine/install.sh')
const HERDR_SPINE_RETIRED = !existsSync(INSTALL_SH)
// Pre-edit backup, atticized 2026-08-12 by agnt-w0-attic — the artifact still
// exists, it just no longer sits beside the file it backs up.
const BACKUP_PATH = join(TOWER_DIR, 'attic', 'server.mjs.bak-20260812')
const CLEAR_INBOX =
  'Tower inbox is clear — nothing unrelayed, no open questions.'

/**
 * Disposable HOME. Tower state paths are homedir-anchored in tower-ledger.mjs
 * (TOWER = homedir()/.tower, no env override), so a scratch $HOME is the only
 * way to exercise the real server against real JSONL without writing a byte of
 * live ~/.tower state.
 */
function makeScratchHome(tag) {
  const home = realpathSync(mkdtempSync(join(tmpdir(), `tower-sdrift-${tag}-`)))
  mkdirSync(join(home, '.tower'), { recursive: true })
  return home
}

/** Minimal newline-delimited JSON-RPC 2.0 client — no warm-pipe wait (WS6 lesson). */
async function withMcp(cwd, fn, env = {}) {
  const proc = Bun.spawn(['bun', LIVE_SERVER], {
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

const callText = (result) => String(result?.content?.[0]?.text ?? result?.content ?? '')

describe('install.sh drift guard (AC: drift resolved)', () => {
  test.skipIf(HERDR_SPINE_RETIRED)('install.sh emits no drift warning', async () => {
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

  test.skipIf(HERDR_SPINE_RETIRED)('install.sh reports relay_inbox reconciled', async () => {
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
    // Historical: herdr-spine b42132e install_tower_auto() skipped symlinked deploy
    // targets. herdr-spine is retired 2026-08-19 — drift-check.mjs is the live guard.
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
  test('server.mjs.bak-20260812 exists in attic', () => {
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
    const home = makeScratchHome('empty')
    try {
      await withMcp(
        home,
        async (rpc) => {
          const result = await rpc('tools/call', { name: 'relay_inbox', arguments: {} })
          expect(callText(result)).toContain(CLEAR_INBOX)
        },
        { HOME: home }
      )
    } finally {
      rmSync(home, { recursive: true, force: true })
    }
  }, 15_000)

  test('relay_inbox render+ack in one call', async () => {
    const home = makeScratchHome('ack')
    const ledgerPath = join(home, '.tower', 'ledger.jsonl')
    const seedId = `t-sdrift-${Date.now().toString(36)}`
    const seedBody = `server-drift oracle seed ${seedId}`
    const beforeSize = existsSync(ledgerPath) ? statSync(ledgerPath).size : 0

    const seedRow = {
      id: seedId,
      ts: new Date().toISOString(),
      cwd: home,
      kind: 'deliverable',
      to: 'operator',
      message: seedBody,
      from: 'server-drift-test',
    }
    appendFileSync(ledgerPath, JSON.stringify(seedRow) + '\n')

    try {
      await withMcp(
        home,
        async (rpc) => {
          const result = await rpc('tools/call', { name: 'relay_inbox', arguments: {} })
          const text = callText(result)
          expect(text).toContain(seedId)
          expect(text).toContain(seedBody)
        },
        { HOME: home }
      )

      // byte offset from statSync must slice a Buffer — string slice uses
      // UTF-16 units and drifts on any multi-byte content upstream
      const tail = readFileSync(ledgerPath).subarray(beforeSize).toString('utf8')
      const newRows = tail
        .split('\n')
        .filter(Boolean)
        .map((l) => JSON.parse(l))
      const ackForSeed = newRows.filter(
        (r) => r.kind === 'ack' && Array.isArray(r.ids) && r.ids.includes(seedId)
      )
      expect(ackForSeed.length).toBe(1)
    } finally {
      rmSync(home, { recursive: true, force: true })
    }
  }, 20_000)
})

// Rewritten 2026-08-14. The former test read the live board and asserted that
// rows tagged topic "tower/server-drift" existed — a one-time process artifact
// of the w0 workstream, not a behavior of the code, and doomed by rotation
// (archived rows leave the active board). It also pointed at
// <tower dir>/board.jsonl, a gitignored test artifact that no longer exists, so
// it could never pass. What it MEANT to guarantee — a finding posted to a topic
// is retrievable on that topic — is asserted here against the real server in an
// isolated $HOME, with no dependence on live state.
describe('board findings (AC: a finding reaches the topic it was posted to)', () => {
  test('board_post finding → board_read <topic> returns it', async () => {
    const home = makeScratchHome('board')
    const boardPath = join(home, '.tower', 'board.jsonl')
    const body = `server-drift oracle finding ${Date.now().toString(36)}`
    try {
      await withMcp(
        home,
        async (rpc) => {
          const posted = await rpc('tools/call', {
            name: 'board_post',
            arguments: {
              topic: 'tower/server-drift',
              type: 'finding',
              from: 'AGNT server-drift-test',
              body,
            },
          })
          expect(callText(posted)).toContain('Posted to board topic')

          const read = await rpc('tools/call', {
            name: 'board_read',
            arguments: { topic: 'tower/server-drift' },
          })
          const text = callText(read)
          expect(text).toContain('tower/server-drift')
          expect(text).toContain(body)
        },
        { HOME: home }
      )

      const rows = readFileSync(boardPath, 'utf8')
        .split('\n')
        .filter(Boolean)
        .map((l) => JSON.parse(l))
      const findings = rows.filter((r) => r.topic === 'tower/server-drift')
      expect(findings.length).toBeGreaterThan(0)
      expect(findings.some((r) => String(r.body ?? '').includes(body))).toBe(true)
    } finally {
      rmSync(home, { recursive: true, force: true })
    }
  }, 20_000)
})
