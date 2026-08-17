#!/usr/bin/env bun
// Acceptance oracle for the deposit primitive (comms-substrate Unit 1).
//
// Written from DESIGN.md and CONTRACT.md ONLY. The implementation is being
// built in a worktree this seat cannot see and did not look at. These tests
// failing before the implementation lands is the expected and correct result.
//
// The guarantee under test (DESIGN preamble):
//   "A message that enters this system is delivered to its addressee, or lands
//    in dead-letter.jsonl with a reason. There is no third outcome. Pacing,
//    focus, and liveness may change WHEN a message arrives. Nothing may change
//    WHETHER."
//
// THE INVARIANT (DESIGN §3, CONTRACT §6):
//   "Pacing writes a future time. It never writes a terminal state."
// and its amendment (CONTRACT §6a):
//   "deferred MUST NOT increment attempts" — a busy addressee must never be
//   dead-lettered for being busy. A deferred item is exactly
//   `state === 'queued' && deferred_reason !== null`; `last_error` and
//   `deferred_reason` are never written by the same event, which is what makes
//   "deferral and failure do not share a code path" checkable by reading a row.
//
// CONTRACT §6b renamed the deposit-side fold to `foldInbox(to)` — the ledger
// already exports `inboxState(cwd)`, and `lib.mjs` re-exports with `export *`,
// so the old pin would have collided silently at the shared surface.
//
// ── Isolation, and why every case runs in a subprocess ──────────────────────
// tower-ledger.mjs:41 resolves `TOWER` from TOWER_HOME at MODULE INIT. Under
// `bun test` all test files share one module registry, and a cache-busting
// query on the parent module does NOT re-evaluate the transitive leaf (both
// verified empirically, 2026-08-17). So an in-process import cannot be given a
// per-test TOWER_HOME: whichever test file imports tower-ledger.mjs first bakes
// the path, and every later deposit would scribble on the operator's LIVE
// ~/.tower. Each case therefore runs in a fresh `bun -e` process with its own
// TOWER_HOME temp dir — the precedent at jsonl-integrity.test.mjs:92, "Fresh
// Bun process so TOWER_HOME is honored before module init".
//
// NO MOCKS. Real files, real flocked appends, a real inbox.jsonl and a real
// dead-letter.jsonl on disk, asserted by reading those files from the parent.
//
// No test here asserts merely "it did not throw" or "output is non-empty" —
// CONTRACT §6b records that such a test passes vacuously against a surface that
// does not exist yet. Every case asserts a specific value.
import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir, homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))

// Defaults to the module beside this test, which is where CONTRACT §1 pins it.
// The override exists so an arbiter can run this unmodified oracle against an
// implementation that has not been merged into this tree yet. It changes WHAT
// is tested, never WHAT IS ASSERTED.
const MODULE = process.env.DEPOSIT_MODULE || join(HERE, 'deposit.mjs')

const LIVE_TOWER = join(homedir(), '.tower')
const SENTINEL = '<<<DEPOSIT-ORACLE-JSON>>>' // envelope delimiter for the subprocess payload

// Addressees used by this oracle. `zzO` is not a real herdr pane prefix, so a
// stray write to live state is detectable (see the isolation guard at the end).
const TO = 'pane:zzO:p1A'
const TO_DEAD = 'pane:zzO:p404' // no live engine, ever
const OPERATOR = 'operator:'

const homes = []

function newTowerHome(tag) {
  const root = mkdtempSync(join(tmpdir(), `tower-deposit-oracle-${tag}-`))
  homes.push(root)
  return root
}

/** Independent copy of the slug pinned in CONTRACT §2 — an oracle computes its own expectations. */
function slugOracle(to) {
  return to.replace(/[^A-Za-z0-9._-]/g, (ch) =>
    '_' + ch.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0'))
}

function inboxFile(home, to) {
  return join(home, 'objects', slugOracle(to), 'inbox.jsonl')
}

function deadLetterFile(home) {
  return join(home, 'dead-letter.jsonl')
}

/** Parent-side JSONL read. Returns [] when the file does not exist. */
function readJsonl(path) {
  if (!existsSync(path)) return []
  return readFileSync(path, 'utf8')
    .split('\n')
    .filter((l) => l.length > 0)
    .map((l) => JSON.parse(l))
}

/** Raw lines, so row-per-line integrity can be judged without a parser hiding it. */
function rawLines(path) {
  if (!existsSync(path)) return []
  const body = readFileSync(path, 'utf8')
  if (body.length === 0) return []
  expect(body.endsWith('\n')).toBe(true)
  return body.slice(0, -1).split('\n')
}

/**
 * Run `body` (JS source) in a fresh Bun process with TOWER_HOME=home.
 * In scope: `d` (the deposit module), `fs`, `iso(offsetSeconds)`,
 * `rows(x)`, `ids(x)`. Return a JSON-serialisable value.
 */
async function run(home, body) {
  const src = [
    `const d = await import(${JSON.stringify(MODULE)})`,
    'const fs = await import("node:fs")',
    'const iso = (offsetS = 0) => new Date(Date.now() + offsetS * 1000).toISOString()',
    'const rows = (x) => (Array.isArray(x) ? x : x instanceof Map ? [...x.values()] : x ? [...x] : [])',
    'const ids = (x) => rows(x).map((r) => r && r.deposit_id)',
    'const out = await (async () => {',
    body,
    '})()',
    `process.stdout.write(${JSON.stringify(SENTINEL)} + JSON.stringify(out === undefined ? null : out) + ${JSON.stringify(SENTINEL)})`,
  ].join('\n')

  const proc = Bun.spawn(['bun', '-e', src], {
    cwd: HERE,
    env: { ...process.env, TOWER_HOME: home },
    stdout: 'pipe',
    stderr: 'pipe',
  })
  const [stdout, stderr, code] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ])
  const parts = stdout.split(SENTINEL)
  if (code !== 0 || parts.length < 3) {
    const detail = (stderr || stdout).trim().split('\n').slice(0, 14).join('\n')
    throw new Error(
      `deposit oracle subprocess failed (exit ${code})\nmodule: ${MODULE}\n${detail}`,
    )
  }
  return JSON.parse(parts[1])
}

const ok = (o) => ({ to: TO, kind: 'note', body: 'oracle body', from: 'deposit-oracle', ...o })

beforeAll(() => {
  // Fail loudly rather than testing nothing: a missing module must read as a
  // missing implementation, not as a green suite.
  if (!existsSync(MODULE) && !process.env.DEPOSIT_MODULE) {
    console.error(`[deposit oracle] module under test does not exist yet: ${MODULE}`)
  }
})

afterAll(() => {
  for (const h of homes) {
    try {
      rmSync(h, { recursive: true, force: true })
    } catch {
      /* a temp dir that outlives the run is noise, not a failure */
    }
  }
})

// ───────────────────────────────────────────────────────────────────────────
// Pinned surface — CONTRACT §7, as amended by §6a (markDeferred) and §6b
// (inboxState -> foldInbox)
// ───────────────────────────────────────────────────────────────────────────
describe('pinned surface (CONTRACT §7, §6a, §6b)', () => {
  test('exports every pinned name', async () => {
    const home = newTowerHome('surface')
    const got = await run(home, 'return Object.keys(d).sort()')
    const pinned = [
      'ALLOWED_KINDS', 'MAX_ATTEMPTS', 'PACE_WINDOW_SECONDS', 'STATUS_PLANE_KINDS',
      'deposit', 'dueItems', 'expireTtl', 'foldInbox', 'inboxPath', 'listInboxes',
      'markAcked', 'markDeferred', 'markDelivered', 'markDelivering', 'paceGate',
      'pendingItems', 'readInbox', 'requeue', 'slugForAddressee', 'unslugAddressee',
    ]
    for (const name of pinned) expect(got).toContain(name)
  })

  test('deposit.mjs does not export inboxState — that name belongs to the ledger', async () => {
    // CONTRACT §6b: lib.mjs re-exports both with `export *`, so a deposit-side
    // `inboxState(to)` would silently shadow the ledger's `inboxState(cwd)`
    // at the exact surface every consumer imports from.
    const home = newTowerHome('collision')
    const got = await run(home, 'return Object.keys(d).sort()')
    expect(got).not.toContain('inboxState')
  })

  test('PACE_WINDOW_SECONDS is 60 and MAX_ATTEMPTS is 8', async () => {
    const home = newTowerHome('consts')
    const got = await run(home, 'return { pace: d.PACE_WINDOW_SECONDS, max: d.MAX_ATTEMPTS }')
    expect(got.pace).toBe(60)
    expect(got.max).toBe(8)
  })

  test('ALLOWED_KINDS and STATUS_PLANE_KINDS are Sets with the pinned members', async () => {
    const home = newTowerHome('kinds')
    const got = await run(home, `return {
      allowedIsSet: d.ALLOWED_KINDS instanceof Set,
      statusIsSet: d.STATUS_PLANE_KINDS instanceof Set,
      allowed: [...d.ALLOWED_KINDS].sort(),
      status: [...d.STATUS_PLANE_KINDS].sort(),
    }`)
    expect(got.allowedIsSet).toBe(true)
    expect(got.statusIsSet).toBe(true)
    expect(got.allowed).toEqual(['completion', 'need-help', 'note', 'offer', 'question', 'summons'])
    expect(got.status).toEqual(['note', 'offer'])
  })

  test('slug is the pinned reversible encoding, both directions', async () => {
    const home = newTowerHome('slug')
    const cases = ['pane:w3R:p1P', 'operator:', 'role:ORCH@agent-core', 'agent:a-mswi9zhh-1cfj']
    const got = await run(home, `
      const cases = ${JSON.stringify(cases)}
      return cases.map((c) => ({ c, slug: d.slugForAddressee(c), back: d.unslugAddressee(d.slugForAddressee(c)) }))`)
    expect(got[0].slug).toBe('pane_3Aw3R_3Ap1P')
    for (const row of got) {
      expect(row.slug).toBe(slugOracle(row.c))
      expect(row.back).toBe(row.c) // reversible: `stuck` must print the real addressee
    }
  })

  test('inboxPath is ${TOWER}/objects/<slug>/inbox.jsonl and honors TOWER_HOME', async () => {
    const home = newTowerHome('path')
    const got = await run(home, `return d.inboxPath(${JSON.stringify(TO)})`)
    expect(got).toBe(inboxFile(home, TO))
  })

  test('foldInbox returns a Map; dueItems and pendingItems return arrays', async () => {
    const home = newTowerHome('shapes')
    const got = await run(home, `
      d.deposit({ to: ${JSON.stringify(TO)}, kind: 'note', body: 'shape', from: 'oracle' })
      return {
        foldIsMap: d.foldInbox(${JSON.stringify(TO)}) instanceof Map,
        dueIsArray: Array.isArray(d.dueItems(${JSON.stringify(TO)}, iso(0))),
        pendingIsArray: Array.isArray(d.pendingItems(${JSON.stringify(TO)})),
        inboxIsArray: Array.isArray(d.readInbox(${JSON.stringify(TO)})),
        listIsArray: Array.isArray(d.listInboxes()),
      }`)
    expect(got).toEqual({
      foldIsMap: true, dueIsArray: true, pendingIsArray: true, inboxIsArray: true, listIsArray: true,
    })
  })

  test('listInboxes reports the addressee, its slug and its path', async () => {
    const home = newTowerHome('list')
    const got = await run(home, `
      d.deposit({ to: ${JSON.stringify(TO)}, kind: 'note', body: 'x', from: 'oracle' })
      return d.listInboxes()`)
    const mine = got.find((r) => r.to === TO)
    expect(mine).toBeDefined()
    expect(mine.slug).toBe(slugOracle(TO))
    expect(mine.path).toBe(inboxFile(home, TO))
  })
})

// ───────────────────────────────────────────────────────────────────────────
// (a) A burst of deposits to one addressee loses nothing
// Detects: a deposit_id minted from ms alone (collides inside one millisecond),
//          a last-write-wins rewrite of the file, any dropped append.
// ───────────────────────────────────────────────────────────────────────────
describe('(a) a burst to one addressee loses nothing', () => {
  const N = 50

  test('(a) 50 rapid deposits fold to 50 distinct deposit_ids with every body intact', async () => {
    const home = newTowerHome('burst')
    const got = await run(home, `
      const N = ${N}
      const receipts = []
      for (let i = 0; i < N; i++) {
        receipts.push(d.deposit({ to: ${JSON.stringify(TO)}, kind: 'note', body: 'burst-' + i, from: 'oracle' }))
      }
      const state = d.foldInbox(${JSON.stringify(TO)})
      return {
        receipts,
        foldedCount: state.size,
        foldedIds: [...state.keys()],
        bodies: [...state.values()].map((r) => r.body).sort(),
        rawCount: d.readInbox(${JSON.stringify(TO)}).length,
      }`)

    expect(got.receipts).toHaveLength(N)
    for (const r of got.receipts) {
      expect(r.accepted).toBe(true)
      expect(r.reason).toBeNull()
      expect(typeof r.deposit_id).toBe('string')
      expect(r.deposit_id).toMatch(/^dep-[0-9a-z]+-[0-9a-z]{4}$/) // CONTRACT §3 row shape
    }

    const receiptIds = new Set(got.receipts.map((r) => r.deposit_id))
    expect(receiptIds.size).toBe(N) // no id collision inside one millisecond
    expect(got.foldedCount).toBe(N)
    expect(new Set(got.foldedIds).size).toBe(N)
    expect(got.rawCount).toBeGreaterThanOrEqual(N)

    const expectedBodies = Array.from({ length: N }, (_, i) => `burst-${i}`).sort()
    expect(got.bodies).toEqual(expectedBodies) // nothing summarised, nothing truncated

    // And on disk, independently of the module's own reader.
    const lines = rawLines(inboxFile(home, TO))
    expect(lines).toHaveLength(N)
    const onDisk = lines.map((l) => JSON.parse(l))
    expect(new Set(onDisk.map((r) => r.deposit_id)).size).toBe(N)
  })

  test('(a) every appended row is exactly one parseable JSON object on its own line', async () => {
    const home = newTowerHome('rowint')
    await run(home, `
      const bodies = ['plain', 'with\\nnewline', 'unicode — em dash, ünïcødé', JSON.stringify({ nested: 'json' }), '  padded  ']
      for (const b of bodies) d.deposit({ to: ${JSON.stringify(TO)}, kind: 'note', body: b, from: 'oracle' })
      return null`)
    const lines = rawLines(inboxFile(home, TO))
    expect(lines).toHaveLength(5)
    for (const line of lines) {
      expect(line.includes('\n')).toBe(false)
      const parsed = JSON.parse(line)
      expect(typeof parsed).toBe('object')
      expect(Array.isArray(parsed)).toBe(false)
    }
    const bodies = lines.map((l) => JSON.parse(l).body)
    expect(bodies).toContain('with\nnewline') // embedded newline survives as data, not as a row break
    expect(bodies).toContain('unicode — em dash, ünïcødé')
  })
})

// ───────────────────────────────────────────────────────────────────────────
// (b) A deposit to an addressee with no live engine queues rather than drops
// Detects: any liveness check at deposit time (the whole class of "nobody is
//          listening, so skip it" that the census found).
// ───────────────────────────────────────────────────────────────────────────
describe('(b) no live engine queues rather than drops', () => {
  test('(b) a deposit to a pane with no live engine is accepted, queued and still owed', async () => {
    const home = newTowerHome('noengine')
    const got = await run(home, `
      const r = d.deposit({ to: ${JSON.stringify(TO_DEAD)}, kind: 'summons', body: 'nobody is home', from: 'oracle' })
      const folded = [...d.foldInbox(${JSON.stringify(TO_DEAD)}).values()]
      return {
        r,
        folded,
        dueIds: ids(d.dueItems(${JSON.stringify(TO_DEAD)}, iso(0))),
        pendingIds: ids(d.pendingItems(${JSON.stringify(TO_DEAD)})),
      }`)

    expect(got.r.accepted).toBe(true)
    expect(got.r.reason).toBeNull()
    expect(got.folded).toHaveLength(1)
    expect(got.folded[0].state).toBe('queued')
    expect(got.folded[0].attempts).toBe(0)
    expect(got.folded[0].body).toBe('nobody is home')
    expect(got.dueIds).toEqual([got.r.deposit_id]) // due immediately: next_attempt_at <= now
    expect(got.pendingIds).toEqual([got.r.deposit_id])
    expect(readJsonl(deadLetterFile(home))).toHaveLength(0) // an unreachable addressee is not a refusal
  })
})

// ───────────────────────────────────────────────────────────────────────────
// (c) A delivery failure requeues with backoff
// Detects: a failure path that drops, one that marks delivered anyway, and any
//          backoff that is not min(2**attempts, 300)s.
// ───────────────────────────────────────────────────────────────────────────
describe('(c) a delivery failure requeues with backoff', () => {
  test('(c) requeue increments attempts and advances next_attempt_at by min(2**attempts,300)s', async () => {
    const home = newTowerHome('backoff')
    const got = await run(home, `
      const to = ${JSON.stringify(TO)}
      const r = d.deposit({ to, kind: 'summons', body: 'retry me', from: 'oracle' })
      const trace = []
      for (let i = 1; i <= 4; i++) {
        d.markDelivering(to, [r.deposit_id])
        d.requeue(to, r.deposit_id, 'boom-' + i)
        const row = d.foldInbox(to).get(r.deposit_id)
        trace.push({ i, state: row.state, attempts: row.attempts, ts: row.ts, next: row.next_attempt_at, last_error: row.last_error })
      }
      return { id: r.deposit_id, trace }`)

    for (const step of got.trace) {
      expect(step.attempts).toBe(step.i)
      expect(step.state).toBe('queued') // a failure returns it to the queue, it does not end it
      expect(step.last_error).toBe(`boom-${step.i}`)
      const delayMs = Date.parse(step.next) - Date.parse(step.ts)
      const expectedMs = Math.min(2 ** step.i, 300) * 1000
      expect(delayMs).toBeGreaterThanOrEqual(expectedMs - 1500)
      expect(delayMs).toBeLessThanOrEqual(expectedMs + 1500)
    }
    expect(readJsonl(deadLetterFile(home))).toHaveLength(0) // four failures is not exhaustion
  })

  test('(c) a requeued item is not due before next_attempt_at and is due again after it', async () => {
    const home = newTowerHome('backoff-due')
    const got = await run(home, `
      const to = ${JSON.stringify(TO)}
      const r = d.deposit({ to, kind: 'summons', body: 'retry me', from: 'oracle' })
      d.markDelivering(to, [r.deposit_id])
      d.requeue(to, r.deposit_id, 'boom')
      const row = d.foldInbox(to).get(r.deposit_id)
      const before = new Date(Date.parse(row.next_attempt_at) - 1000).toISOString()
      const after = new Date(Date.parse(row.next_attempt_at) + 1000).toISOString()
      return {
        id: r.deposit_id,
        dueBefore: ids(d.dueItems(to, before)),
        dueAfter: ids(d.dueItems(to, after)),
        pending: ids(d.pendingItems(to)),
      }`)
    expect(got.dueBefore).toEqual([])
    expect(got.dueAfter).toEqual([got.id])
    expect(got.pending).toEqual([got.id]) // owed the whole time
  })
})

// ───────────────────────────────────────────────────────────────────────────
// (d) Undeliverable-after-policy lands in dead-letter.jsonl with a reason
// Detects: exhaustion that silently stops retrying, exhaustion with an empty
//          reason, ttl expiry that just forgets the row.
// ───────────────────────────────────────────────────────────────────────────
describe('(d) undeliverable-after-policy dead-letters with a non-empty reason', () => {
  test('(d) MAX_ATTEMPTS exhaustion dead-letters with the pinned reason and stops being due', async () => {
    const home = newTowerHome('exhaust')
    const got = await run(home, `
      const to = ${JSON.stringify(TO)}
      const r = d.deposit({ to, kind: 'summons', body: 'doomed', from: 'oracle' })
      const trace = []
      for (let i = 1; i <= 12; i++) {
        d.markDelivering(to, [r.deposit_id])
        try { d.requeue(to, r.deposit_id, 'boom-' + i) } catch (e) { trace.push({ i, threw: String(e && e.message) }); break }
        const row = d.foldInbox(to).get(r.deposit_id)
        trace.push({ i, attempts: row && row.attempts, state: row && row.state })
      }
      const far = iso(10 * 365 * 24 * 3600)
      return { id: r.deposit_id, trace, dueFar: ids(d.dueItems(to, far)), pending: ids(d.pendingItems(to)) }`)

    const dl = readJsonl(deadLetterFile(home))
    expect(dl.length).toBeGreaterThanOrEqual(1) // exhaustion must be recorded, not silent

    const row = dl[0]
    expect(typeof row.reason).toBe('string')
    expect(row.reason.length).toBeGreaterThan(0)
    // CONTRACT §6: `undeliverable after <N> attempts: <last_error>`. "past
    // MAX_ATTEMPTS" admits N=8 and N=9; both candidates are fully spelled out,
    // so a wrong format or a lost last_error still fails.
    const candidates = [
      'undeliverable after 8 attempts: boom-8',
      'undeliverable after 9 attempts: boom-9',
    ]
    expect(candidates).toContain(row.reason)

    // Exhausted means exhausted: it must not still be handed to the courier.
    expect(got.dueFar).not.toContain(got.id)
    expect(got.pending).not.toContain(got.id)
  })

  test('(d) ttl expiry dead-letters with exactly "ttl-expired" and stops being due', async () => {
    const home = newTowerHome('ttl')
    const got = await run(home, `
      const to = ${JSON.stringify(TO)}
      const r = d.deposit({ to, kind: 'summons', body: 'perishable', from: 'oracle', ttl_s: 30 })
      d.expireTtl(to, iso(3600))
      const far = iso(10 * 365 * 24 * 3600)
      return { id: r.deposit_id, dueFar: ids(d.dueItems(to, far)), pending: ids(d.pendingItems(to)) }`)

    const dl = readJsonl(deadLetterFile(home))
    expect(dl).toHaveLength(1)
    expect(dl[0].reason).toBe('ttl-expired')
    expect(dl[0].deposit_id).toBe(got.id)
    expect(got.dueFar).not.toContain(got.id)
    expect(got.pending).not.toContain(got.id)
  })

  test('(d) an item inside its ttl is untouched by expireTtl and stays owed', async () => {
    const home = newTowerHome('ttl-live')
    const got = await run(home, `
      const to = ${JSON.stringify(TO)}
      const r = d.deposit({ to, kind: 'summons', body: 'still fresh', from: 'oracle', ttl_s: 3600 })
      d.expireTtl(to, iso(10))
      return { id: r.deposit_id, due: ids(d.dueItems(to, iso(20))), pending: ids(d.pendingItems(to)) }`)
    expect(readJsonl(deadLetterFile(home))).toHaveLength(0)
    expect(got.due).toEqual([got.id])
    expect(got.pending).toEqual([got.id])
  })

  test('(d) an item with no ttl is never expired', async () => {
    const home = newTowerHome('ttl-null')
    const got = await run(home, `
      const to = ${JSON.stringify(TO)}
      const r = d.deposit({ to, kind: 'summons', body: 'immortal', from: 'oracle' })
      d.expireTtl(to, iso(10 * 365 * 24 * 3600))
      return { id: r.deposit_id, pending: ids(d.pendingItems(to)) }`)
    expect(readJsonl(deadLetterFile(home))).toHaveLength(0)
    expect(got.pending).toEqual([got.id])
  })
})

// ───────────────────────────────────────────────────────────────────────────
// (e) THE INVARIANT — pacing bounds interruption and never produces a terminal
// state. This is the test that kills the 32.1%-loss bug class.
//
// Detects, precisely:
//   - paceGate mutating the queue instead of returning a decision
//   - a pace refusal that marks delivered/acked/dead (the historical
//     drop-on-pace rule: `if not pace_allows(): return`)
//   - a pace refusal that leaves next_attempt_at in the past (a busy-loop) or
//     that removes the item from pendingItems
//   - pacing that never refuses at all (no interruption bound)
// ───────────────────────────────────────────────────────────────────────────
describe('(e) pacing bounds interruption frequency and never produces a terminal state', () => {
  test('(e) a REFUSING paceGate appends nothing to the inbox', async () => {
    // The refusing branch is the one that matters: a gate that only ever
    // allows never touches the drop path. So an interruption is staged first,
    // and every gate call in this test is a refusal.
    const home = newTowerHome('pace-pure')
    const got = await run(home, `
      const to = ${JSON.stringify(TO)}
      const a = d.deposit({ to, kind: 'summons', body: 'first', from: 'oracle' })
      const r = d.deposit({ to, kind: 'summons', body: 'pace me', from: 'oracle' })
      d.markDelivering(to, [a.deposit_id])
      d.markDelivered(to, [a.deposit_id])
      const before = fs.readFileSync(d.inboxPath(to), 'utf8')
      const decisions = []
      for (let i = 0; i < 25; i++) decisions.push(d.paceGate(to, iso(i)))
      const after = fs.readFileSync(d.inboxPath(to), 'utf8')
      return { id: r.deposit_id, identical: before === after, decisions,
               row: d.foldInbox(to).get(r.deposit_id),
               pending: ids(d.pendingItems(to)) }`)

    for (const g of got.decisions) {
      expect(g.allowed).toBe(false) // the refusing branch really was exercised
      expect(typeof g.next_attempt_at).toBe('string')
      expect(Number.isNaN(Date.parse(g.next_attempt_at))).toBe(false)
    }
    expect(got.identical).toBe(true) // "paceGate returns a decision; it never mutates"
    expect(got.row.state).toBe('queued')
    expect(got.pending).toContain(got.id)
    expect(readJsonl(deadLetterFile(home))).toHaveLength(0)
  })

  test('(e) a pace refusal is not the last thing that happens to a message', async () => {
    // Read the row BETWEEN the gate and the caller applying it. Checking only
    // after markDeferred would let a paceGate that terminates the message pass,
    // because the caller's own append resurrects the row.
    const home = newTowerHome('pace-defer')
    const got = await run(home, `
      const to = ${JSON.stringify(TO)}
      const a = d.deposit({ to, kind: 'summons', body: 'first', from: 'oracle' })
      const b = d.deposit({ to, kind: 'summons', body: 'second', from: 'oracle' })
      // An interruption just happened: 'a' was delivered.
      d.markDelivering(to, [a.deposit_id])
      d.markDelivered(to, [a.deposit_id])
      const at = iso(1)
      const gate = d.paceGate(to, at)
      const afterGate = d.foldInbox(to).get(b.deposit_id)
      const owedAfterGate = ids(d.pendingItems(to)).includes(b.deposit_id)
      // Only now does the caller apply the decision.
      if (!gate.allowed) d.markDeferred(to, [b.deposit_id], 'paced')
      const row = d.foldInbox(to).get(b.deposit_id)
      return {
        id: b.deposit_id, at, gate, row, afterGate, owedAfterGate,
        pending: ids(d.pendingItems(to)),
        dueNow: ids(d.dueItems(to, at)),
        dueLater: ids(d.dueItems(to, iso(24 * 3600))),
      }`)

    expect(got.gate.allowed).toBe(false) // an interruption inside the window is refused

    // THE INVARIANT, checked where it can actually fail: a pace decision has
    // been made and nothing has been applied yet. The message is still owed.
    expect(got.afterGate.state).toBe('queued')
    expect(got.afterGate.attempts).toBe(0)
    expect(got.owedAfterGate).toBe(true)

    expect(got.row.state).toBe('queued') // CONTRACT §6a: a deferral is never its own state
    expect(got.row.deferred_reason).toBe('paced')
    expect(got.row.attempts).toBe(0) // pacing is not a delivery attempt
    expect(got.row.last_error).toBeNull() // pacing is not a failure
    expect(Date.parse(got.row.next_attempt_at)).toBeGreaterThan(Date.parse(got.at))
    expect(got.pending).toContain(got.id) // still owed
    expect(got.dueNow).not.toContain(got.id) // the interruption is bounded ...
    expect(got.dueLater).toContain(got.id) // ... and the message still arrives
    expect(readJsonl(deadLetterFile(home))).toHaveLength(0)
  })

  test('(e) pacing bounds interruption frequency to one per PACE_WINDOW_SECONDS per addressee', async () => {
    const home = newTowerHome('pace-window')
    const got = await run(home, `
      const to = ${JSON.stringify(TO)}
      const a = d.deposit({ to, kind: 'summons', body: 'first', from: 'oracle' })
      const virgin = d.paceGate(to, iso(0))
      d.markDelivering(to, [a.deposit_id])
      d.markDelivered(to, [a.deposit_id])
      return {
        virgin,
        insideWindow: d.paceGate(to, iso(1)),
        atHalfWindow: d.paceGate(to, iso(d.PACE_WINDOW_SECONDS / 2)),
        pastWindow: d.paceGate(to, iso(d.PACE_WINDOW_SECONDS + 5)),
        windowEnd: iso(d.PACE_WINDOW_SECONDS + 2),
      }`)

    expect(got.virgin.allowed).toBe(true) // nothing delivered yet: the first message is not delayed
    expect(got.insideWindow.allowed).toBe(false)
    expect(got.atHalfWindow.allowed).toBe(false)
    expect(got.pastWindow.allowed).toBe(true) // the bound is a window, not a mute
    // A refusal always names a time inside the window, never an unbounded punt.
    expect(Date.parse(got.insideWindow.next_attempt_at)).toBeLessThanOrEqual(Date.parse(got.windowEnd))
  })

  test('(e) no sequence of 200 pace/defer decisions can make a message cease to be owed', async () => {
    const home = newTowerHome('pace-forever')
    const got = await run(home, `
      const to = ${JSON.stringify(TO)}
      const r = d.deposit({ to, kind: 'summons', body: 'never lose me', from: 'oracle' })
      const id = r.deposit_id
      let lostAt = null
      let terminalAt = null
      let attemptsSeen = 0
      const states = new Set()
      const terminal = (s) => s === 'delivered' || s === 'acked' || s === 'dead' || s === 'dead-lettered'
      for (let i = 0; i < 200; i++) {
        const gate = d.paceGate(to, iso(i))
        // Checked BEFORE the caller applies anything: the pace decision itself
        // must not have ended the message. Checking only after markDeferred
        // would be resurrected by the caller's own append.
        const mid = d.foldInbox(to).get(id)
        if (!mid) { lostAt = i; break }
        states.add(mid.state)
        if (terminal(mid.state)) { terminalAt = i; break }
        if (!ids(d.pendingItems(to)).includes(id)) { lostAt = i; break }
        d.markDeferred(to, [id], gate.allowed ? 'target busy' : 'paced')
        const row = d.foldInbox(to).get(id)
        if (!row) { lostAt = i; break }
        states.add(row.state)
        if (terminal(row.state)) { terminalAt = i; break }
        if (!ids(d.pendingItems(to)).includes(id)) { lostAt = i; break }
        attemptsSeen = Math.max(attemptsSeen, row.attempts)
      }
      const row = d.foldInbox(to).get(id)
      return {
        id, lostAt, terminalAt, attemptsSeen, row, states: [...states],
        pending: ids(d.pendingItems(to)),
        dueFar: ids(d.dueItems(to, iso(10 * 365 * 24 * 3600))),
        body: row && row.body,
      }`)

    expect(got.lostAt).toBeNull() // never ceased to be owed
    expect(got.terminalAt).toBeNull() // never reached a terminal state
    expect(got.states).toEqual(['queued']) // and never left the queue at all
    expect(got.attemptsSeen).toBe(0) // 200 pace/defer passes burned zero attempts
    expect(got.pending).toContain(got.id)
    expect(got.dueFar).toContain(got.id) // still delivered eventually
    expect(got.body).toBe('never lose me') // and still whole
    expect(readJsonl(deadLetterFile(home))).toHaveLength(0) // never dead-lettered for being paced
  })
})

// ───────────────────────────────────────────────────────────────────────────
// (f) Every refusal category in CONTRACT §4 — receipt AND dead-letter row,
// with the exact pinned reason string. A missing row is a hole in the
// guarantee, so this is table-driven and each case has exactly one defect.
// ───────────────────────────────────────────────────────────────────────────
describe('(f) every CONTRACT §4 refusal returns a receipt and writes a dead-letter row', () => {
  const table = [
    ['unknown to: scheme', ok({ to: 'wat:xyz' }), 'bad-addressee: wat:xyz', false],
    ['malformed to: with no scheme', ok({ to: 'pane' }), 'bad-addressee: pane', false],
    ['agent: scheme', ok({ to: 'agent:a-mswi9zhh-1cfj' }), 'agent: scheme not yet implemented', false],
    ['empty body', ok({ body: '' }), 'empty-body', true],
    ['whitespace-only body', ok({ body: '   \n\t ' }), 'empty-body', true],
    ['kind outside the allowed set', ok({ kind: 'blorp' }), 'unknown-kind: blorp', true],
    ['status-plane note to operator:', ok({ to: OPERATOR, kind: 'note' }), 'status-is-not-mail', true],
    ['status-plane offer to operator:', ok({ to: OPERATOR, kind: 'offer' }), 'status-is-not-mail', true],
    ['empty from', ok({ from: '' }), 'unauthored', true],
    ['whitespace-only from', ok({ from: '   ' }), 'unauthored', true],
    ['missing from', { to: TO, kind: 'note', body: 'x' }, 'unauthored', true],
    ['completion with only an idle status', ok({ kind: 'completion', evidence: { status: 'idle' } }),
      'no-completion-evidence: idle is not done', true],
  ]

  for (const [label, args, reason, addressable] of table) {
    test(`(f) ${label} is refused with exactly "${reason}"`, async () => {
      const home = newTowerHome('refuse')
      const got = await run(home, `
        const r = d.deposit(${JSON.stringify(args)})
        let pending = null
        ${addressable ? `pending = ids(d.pendingItems(${JSON.stringify(args.to)}))` : ''}
        return { r, pending }`)

      expect(got.r.accepted).toBe(false)
      expect(got.r.reason).toBe(reason) // exact string, not a substring
      expect(got.r.reason.length).toBeGreaterThan(0)
      expect(got.r).toHaveProperty('deposit_id') // the third shape does not exist

      const dl = readJsonl(deadLetterFile(home))
      expect(dl).toHaveLength(1) // a refusal is never silent
      expect(dl[0].reason).toBe(reason)

      if (addressable) expect(got.pending).toEqual([]) // refused is not owed
    })
  }

  test('(f) an accepted deposit returns reason null and writes no dead-letter row', async () => {
    const home = newTowerHome('accept')
    const got = await run(home, `return d.deposit(${JSON.stringify(ok({}))})`)
    expect(got.accepted).toBe(true)
    expect(got.reason).toBeNull() // "accepted: true => reason === null"
    expect(typeof got.deposit_id).toBe('string')
    expect(readJsonl(deadLetterFile(home))).toHaveLength(0)
  })

  test('(f) status-plane kinds are mail when they are NOT addressed to operator:', async () => {
    const home = newTowerHome('plane-ok')
    const got = await run(home, `
      return [d.deposit({ to: ${JSON.stringify(TO)}, kind: 'note', body: 'fleet note', from: 'oracle' }),
              d.deposit({ to: ${JSON.stringify(TO)}, kind: 'offer', body: 'fleet offer', from: 'oracle' })]`)
    for (const r of got) {
      expect(r.accepted).toBe(true)
      expect(r.reason).toBeNull()
    }
    expect(readJsonl(deadLetterFile(home))).toHaveLength(0)
  })

  // CONTRACT §4 pins the reason `nq-exhausted` but pins no budget value and no
  // parameter carrying one, so this asserts the guarantee's shape: a question
  // stream is bounded, and the refusal string is exact. See board finding.
  test('(f) a question past the nQ budget is refused with exactly "nq-exhausted"', async () => {
    const home = newTowerHome('nq')
    const got = await run(home, `
      const to = ${JSON.stringify(TO)}
      const receipts = []
      for (let i = 0; i < 12; i++) {
        receipts.push(d.deposit({ to, kind: 'question', body: 'question ' + i, from: 'oracle' }))
      }
      return receipts`)

    const accepted = got.filter((r) => r.accepted)
    const refused = got.filter((r) => !r.accepted)
    expect(accepted.length).toBeGreaterThan(0) // the budget is not zero
    expect(refused.length).toBeGreaterThan(0) // the budget is not unbounded
    for (const r of refused) expect(r.reason).toBe('nq-exhausted')

    const dl = readJsonl(deadLetterFile(home))
    expect(dl).toHaveLength(refused.length)
    for (const row of dl) expect(row.reason).toBe('nq-exhausted')
  })
})

// ───────────────────────────────────────────────────────────────────────────
// §6a — completion evidence. "idle is not done."
// Detects: `if status not in ("done","idle")` (the live 16-parent-wake:165
//          fabrication), a truthiness-only `if (evidence)` check, and a
//          done_marker accepted without checking the disk.
// ───────────────────────────────────────────────────────────────────────────
describe('§6a completion evidence — idle is not done', () => {
  const REASON = 'no-completion-evidence: idle is not done'

  const refusals = [
    ['a bare idle flip', { status: 'idle' }],
    ['no evidence key at all', undefined],
    ['an empty evidence object', {}],
    ['a working status', { status: 'working' }],
    ['a blocked status', { status: 'blocked' }],
    ['a done_marker that does not exist on disk', { done_marker: '/nonexistent/oracle/never.done' }],
    ['an empty work_done_ref', { work_done_ref: '' }],
    ['an empty verdict_token', { verdict_token: '' }],
    ['idle plus a missing done_marker', { status: 'idle', done_marker: '/nonexistent/oracle/never.done' }],
  ]

  for (const [label, evidence] of refusals) {
    test(`§6a completion with ${label} is refused with exactly "${REASON}"`, async () => {
      const home = newTowerHome('evid-no')
      const args = { to: TO, kind: 'completion', body: 'worker zzO is done', from: '16-parent-wake' }
      if (evidence !== undefined) args.evidence = evidence
      const got = await run(home, `
        const r = d.deposit(${JSON.stringify(args)})
        return { r, pending: ids(d.pendingItems(${JSON.stringify(TO)})) }`)

      expect(got.r.accepted).toBe(false)
      expect(got.r.reason).toBe(REASON)
      expect(got.pending).toEqual([]) // a fabricated completion is never owed to anyone

      const dl = readJsonl(deadLetterFile(home))
      expect(dl).toHaveLength(1) // refused LOUDLY — countable, not invisible
      expect(dl[0].reason).toBe(REASON)
    })
  }

  test('§6a evidence.status "done" accepts', async () => {
    const home = newTowerHome('evid-done')
    const got = await run(home, `return d.deposit({ to: ${JSON.stringify(TO)}, kind: 'completion',
      body: 'done', from: 'oracle', evidence: { status: 'done' } })`)
    expect(got.accepted).toBe(true)
    expect(got.reason).toBeNull()
    expect(readJsonl(deadLetterFile(home))).toHaveLength(0)
  })

  test('§6a a done_marker that exists on disk accepts', async () => {
    const home = newTowerHome('evid-marker')
    const got = await run(home, `
      const marker = ${JSON.stringify(join(home, 'agnt-oracle.done'))}
      fs.writeFileSync(marker, 'done\\n')
      return d.deposit({ to: ${JSON.stringify(TO)}, kind: 'completion', body: 'done',
        from: 'oracle', evidence: { done_marker: marker } })`)
    expect(got.accepted).toBe(true)
    expect(got.reason).toBeNull()
    expect(readJsonl(deadLetterFile(home))).toHaveLength(0)
  })

  test('§6a a non-empty work_done_ref accepts', async () => {
    const home = newTowerHome('evid-phe')
    const got = await run(home, `return d.deposit({ to: ${JSON.stringify(TO)}, kind: 'completion',
      body: 'done', from: 'oracle', evidence: { work_done_ref: 'phe-0193abc-work-done' } })`)
    expect(got.accepted).toBe(true)
    expect(got.reason).toBeNull()
    expect(readJsonl(deadLetterFile(home))).toHaveLength(0)
  })

  test('§6a a non-empty verdict_token accepts', async () => {
    const home = newTowerHome('evid-verdict')
    const got = await run(home, `return d.deposit({ to: ${JSON.stringify(TO)}, kind: 'completion',
      body: 'done', from: 'oracle', evidence: { verdict_token: 'ok' } })`)
    expect(got.accepted).toBe(true)
    expect(got.reason).toBeNull()
    expect(readJsonl(deadLetterFile(home))).toHaveLength(0)
  })

  test('§6a the live fabrication is refused while the same worker with a real marker is accepted', async () => {
    // The exact board row from DESIGN §6a: a pane goes idle 10s after spawn and
    // a completion is fabricated for its spawner.
    const home = newTowerHome('evid-live')
    const got = await run(home, `
      const to = ${JSON.stringify(TO)}
      const fabricated = d.deposit({ to, kind: 'completion',
        body: 'your worker ORCH deposit-courier is done', from: '16-parent-wake',
        evidence: { status: 'idle' } })
      const marker = ${JSON.stringify(join(home, 'orch-deposit-courier.done'))}
      fs.writeFileSync(marker, '')
      const real = d.deposit({ to, kind: 'completion',
        body: 'your worker ORCH deposit-courier is done', from: '16-parent-wake',
        evidence: { done_marker: marker } })
      return { fabricated, real, pending: ids(d.pendingItems(to)) }`)

    expect(got.fabricated.accepted).toBe(false)
    expect(got.fabricated.reason).toBe(REASON)
    expect(got.real.accepted).toBe(true)
    expect(got.pending).toEqual([got.real.deposit_id]) // only the evidenced one is owed
  })
})

// ───────────────────────────────────────────────────────────────────────────
// §6a AMENDMENT — deferral is not failure.
// The regression this exists to prevent: a healthy but busy addressee marching
// to MAX_ATTEMPTS and having its mail dead-lettered FOR BEING BUSY — a new
// silent-loss bug shipped inside the fix for silent loss.
//
// The pinned row-level test (CONTRACT §6a "The deferral field"):
//   deferred  ==  state === 'queued' && deferred_reason !== null
//   attempts unchanged, next_attempt_at pushed forward
//   deferred_reason cleared to null on delivery and on genuine failure
//   last_error and deferred_reason are NEVER written by the same event
// ───────────────────────────────────────────────────────────────────────────
describe('§6a deferral is not failure (markDeferred)', () => {
  test('§6a markDeferred sets deferred_reason, keeps state queued, and burns no attempt', async () => {
    const home = newTowerHome('defer-one')
    const got = await run(home, `
      const to = ${JSON.stringify(TO)}
      const r = d.deposit({ to, kind: 'summons', body: 'busy target', from: 'oracle' })
      const at = iso(0)
      d.markDeferred(to, [r.deposit_id], 'target busy')
      const row = d.foldInbox(to).get(r.deposit_id)
      return { id: r.deposit_id, at, row, pending: ids(d.pendingItems(to)),
               dueNow: ids(d.dueItems(to, at)), dueLater: ids(d.dueItems(to, iso(24 * 3600))) }`)

    expect(got.row.attempts).toBe(0) // THE point of the amendment
    expect(got.row.state).toBe('queued') // a deferral is never its own terminal state
    expect(got.row.deferred_reason).toBe('target busy') // the pinned field, exact string
    expect(got.row.last_error).toBeNull() // never written by the same event
    expect(Date.parse(got.row.next_attempt_at)).toBeGreaterThan(Date.parse(got.at))
    expect(got.pending).toContain(got.id)
    expect(got.dueNow).not.toContain(got.id)
    expect(got.dueLater).toContain(got.id)
    expect(readJsonl(deadLetterFile(home))).toHaveLength(0)
  })

  test('§6a a fresh deposit has deferred_reason null — deferred is a state a pane earns', async () => {
    const home = newTowerHome('defer-fresh')
    const got = await run(home, `
      const to = ${JSON.stringify(TO)}
      const r = d.deposit({ to, kind: 'summons', body: 'fresh', from: 'oracle' })
      return d.foldInbox(to).get(r.deposit_id)`)
    expect(got).toHaveProperty('deferred_reason')
    expect(got.deferred_reason).toBeNull() // `stuck` must not read a plain queued item as deferred
    expect(got.last_error).toBeNull()
  })

  test('§6a a genuine failure clears deferred_reason and sets last_error instead', async () => {
    const home = newTowerHome('defer-clear-fail')
    const got = await run(home, `
      const to = ${JSON.stringify(TO)}
      const r = d.deposit({ to, kind: 'summons', body: 'busy then broken', from: 'oracle' })
      const id = r.deposit_id
      d.markDeferred(to, [id], 'target busy')
      const deferred = d.foldInbox(to).get(id)
      d.markDelivering(to, [id])
      d.requeue(to, id, 'submit not observed')
      const failed = d.foldInbox(to).get(id)
      return { deferred, failed }`)

    expect(got.deferred.deferred_reason).toBe('target busy')
    expect(got.deferred.last_error).toBeNull()
    // A stale deferral reason on a failing row tells the operator the exact
    // opposite of what is happening.
    expect(got.failed.last_error).toBe('submit not observed')
    expect(got.failed.deferred_reason).toBeNull()
    expect(got.failed.attempts).toBe(1)
  })

  test('§6a a successful delivery clears deferred_reason', async () => {
    const home = newTowerHome('defer-clear-ok')
    const got = await run(home, `
      const to = ${JSON.stringify(TO)}
      const r = d.deposit({ to, kind: 'summons', body: 'busy then delivered', from: 'oracle' })
      const id = r.deposit_id
      d.markDeferred(to, [id], 'target busy')
      d.markDelivering(to, [id])
      d.markDelivered(to, [id])
      const delivered = d.foldInbox(to).get(id)
      d.markAcked(to, [id])
      const acked = d.foldInbox(to).get(id)
      return { delivered, acked }`)

    expect(got.delivered.state).toBe('delivered')
    expect(got.delivered.deferred_reason).toBeNull()
    expect(got.acked.state).toBe('acked')
    expect(got.acked.deferred_reason).toBeNull()
  })

  test('§6a no row ever carries last_error and deferred_reason at the same time', async () => {
    // Rule 3 of §6a made checkable by reading rows instead of trusting code:
    // walk the entire append log through every transition and assert the two
    // fields are never both set on any row, ever.
    const home = newTowerHome('defer-exclusive')
    await run(home, `
      const to = ${JSON.stringify(TO)}
      const r = d.deposit({ to, kind: 'summons', body: 'the full life of a message', from: 'oracle' })
      const id = r.deposit_id
      d.markDeferred(to, [id], 'target busy')
      d.markDelivering(to, [id])
      d.requeue(to, id, 'submit not observed')
      d.markDeferred(to, [id], 'paced')
      d.markDelivering(to, [id])
      d.requeue(to, id, 'pane gone')
      d.markDeferred(to, [id], 'target busy')
      d.markDelivering(to, [id])
      d.markDelivered(to, [id])
      d.markAcked(to, [id])
      return null`)

    const rows = readJsonl(inboxFile(home, TO))
    expect(rows.length).toBeGreaterThanOrEqual(10)
    for (const row of rows) {
      const both = row.last_error != null && row.deferred_reason != null
      expect(both).toBe(false)
    }
    // ... and both outcomes really did occur in that log, so this is not vacuous.
    expect(rows.some((r) => r.deferred_reason != null)).toBe(true)
    expect(rows.some((r) => r.last_error != null)).toBe(true)
  })

  test('§6a 24 consecutive defers never dead-letter a busy addressee', async () => {
    const home = newTowerHome('defer-many')
    const got = await run(home, `
      const to = ${JSON.stringify(TO)}
      const r = d.deposit({ to, kind: 'summons', body: 'a healthy pane that is simply busy', from: 'oracle' })
      const id = r.deposit_id
      const attemptsTrace = []
      const stateTrace = new Set()
      for (let i = 0; i < 3 * d.MAX_ATTEMPTS; i++) {
        d.markDeferred(to, [id], 'target busy')
        const row = d.foldInbox(to).get(id)
        attemptsTrace.push(row ? row.attempts : null)
        stateTrace.add(row ? row.state : null)
      }
      const row = d.foldInbox(to).get(id)
      return { id, attemptsTrace, states: [...stateTrace], row, pending: ids(d.pendingItems(to)),
               dueFar: ids(d.dueItems(to, iso(10 * 365 * 24 * 3600))) }`)

    expect(new Set(got.attemptsTrace)).toEqual(new Set([0])) // never burned an attempt
    expect(got.states).toEqual(['queued'])
    expect(got.row.deferred_reason).toBe('target busy')
    expect(got.pending).toContain(got.id)
    expect(got.dueFar).toContain(got.id)
    expect(got.row.body).toBe('a healthy pane that is simply busy') // never truncated
    expect(readJsonl(deadLetterFile(home))).toHaveLength(0) // never dead-lettered for being busy
  })

  test('§6a defers interleaved with real failures: only the failures burn attempts', async () => {
    const home = newTowerHome('defer-mixed')
    const got = await run(home, `
      const to = ${JSON.stringify(TO)}
      const r = d.deposit({ to, kind: 'summons', body: 'mixed', from: 'oracle' })
      const id = r.deposit_id
      const trace = []
      const snap = (after) => {
        const row = d.foldInbox(to).get(id)
        trace.push({ after, attempts: row.attempts, deferred_reason: row.deferred_reason, last_error: row.last_error })
      }
      for (let i = 0; i < 3; i++) {
        d.markDeferred(to, [id], 'target busy')
        snap('defer')
        d.markDelivering(to, [id])
        d.requeue(to, id, 'boom')
        snap('requeue')
      }
      return { id, trace, pending: ids(d.pendingItems(to)) }`)

    const expected = []
    for (let i = 1; i <= 3; i++) {
      expected.push({ after: 'defer', attempts: i - 1, deferred_reason: 'target busy', last_error: null })
      expected.push({ after: 'requeue', attempts: i, deferred_reason: null, last_error: 'boom' })
    }
    expect(got.trace).toEqual(expected)
    expect(got.pending).toContain(got.id)
    expect(readJsonl(deadLetterFile(home))).toHaveLength(0)
  })

  test('§6a markDeferred accepts a batch of ids, as the courier drains them', async () => {
    const home = newTowerHome('defer-batch')
    const got = await run(home, `
      const to = ${JSON.stringify(TO)}
      const rs = [1, 2, 3].map((i) => d.deposit({ to, kind: 'summons', body: 'batch-' + i, from: 'oracle' }))
      const at = iso(0)
      d.markDeferred(to, rs.map((r) => r.deposit_id), 'target busy')
      const state = d.foldInbox(to)
      return { ids: rs.map((r) => r.deposit_id),
               rows: rs.map((r) => state.get(r.deposit_id)),
               dueNow: ids(d.dueItems(to, at)),
               pending: ids(d.pendingItems(to)) }`)

    for (const row of got.rows) {
      expect(row.attempts).toBe(0)
      expect(row.state).toBe('queued')
      expect(row.deferred_reason).toBe('target busy')
      expect(row.last_error).toBeNull()
    }
    expect(got.dueNow).toEqual([])
    expect(got.pending.sort()).toEqual([...got.ids].sort())
  })
})

// ───────────────────────────────────────────────────────────────────────────
// Coalescing of interruptions, never of content (CONTRACT §6, §6a).
// The courier can only name every item in one prompt if the queue hands it
// every item in one call, whole.
// ───────────────────────────────────────────────────────────────────────────
describe('coalescing — one call returns every due item, whole', () => {
  test('dueItems returns all due items for an addressee with full bodies and deposit_ids', async () => {
    const home = newTowerHome('coalesce')
    const long = 'x'.repeat(4096)
    const got = await run(home, `
      const to = ${JSON.stringify(TO)}
      const bodies = ['first message', 'second message with — unicode', ${JSON.stringify(long)}, 'line one\\nline two']
      const rs = bodies.map((b) => d.deposit({ to, kind: 'summons', body: b, from: 'oracle' }))
      const due = rows(d.dueItems(to, iso(1)))
      return { ids: rs.map((r) => r.deposit_id), due }`)

    expect(got.due).toHaveLength(4) // one call, every owed item
    expect(got.due.map((r) => r.deposit_id).sort()).toEqual([...got.ids].sort())
    const bodies = got.due.map((r) => r.body)
    expect(bodies).toContain('first message')
    expect(bodies).toContain('second message with — unicode')
    expect(bodies).toContain('line one\nline two')
    expect(bodies).toContain(long) // no truncation, no summary, no ellipsis
    for (const row of got.due) expect(typeof row.deposit_id).toBe('string') // matchable transcript echo
  })

  test('dueItems for one addressee never returns another addressee mail', async () => {
    const home = newTowerHome('coalesce-iso')
    const got = await run(home, `
      const a = ${JSON.stringify(TO)}
      const b = ${JSON.stringify(TO_DEAD)}
      const ra = d.deposit({ to: a, kind: 'summons', body: 'for a', from: 'oracle' })
      const rb = d.deposit({ to: b, kind: 'summons', body: 'for b', from: 'oracle' })
      return { a: ids(d.dueItems(a, iso(1))), b: ids(d.dueItems(b, iso(1))), ra: ra.deposit_id, rb: rb.deposit_id }`)
    expect(got.a).toEqual([got.ra])
    expect(got.b).toEqual([got.rb])
  })
})

// ───────────────────────────────────────────────────────────────────────────
// Append-only discipline (CONTRACT §3) and isolation from live state.
// ───────────────────────────────────────────────────────────────────────────
describe('append-only queue folded by deposit_id (CONTRACT §3)', () => {
  test('every state change appends a row; the file only ever grows', async () => {
    const home = newTowerHome('appendonly')
    const got = await run(home, `
      const to = ${JSON.stringify(TO)}
      const r = d.deposit({ to, kind: 'summons', body: 'trace me', from: 'oracle' })
      const id = r.deposit_id
      const sizes = []
      const p = d.inboxPath(to)
      const size = () => fs.statSync(p).size
      sizes.push(size())
      d.markDelivering(to, [id]); sizes.push(size())
      d.markDeferred(to, [id], 'target busy'); sizes.push(size())
      d.markDelivering(to, [id]); sizes.push(size())
      d.markDelivered(to, [id]); sizes.push(size())
      d.markAcked(to, [id]); sizes.push(size())
      const raw = d.readInbox(to)
      const state = d.foldInbox(to)
      return { id, sizes, rawStates: raw.map((x) => x.state), folded: state.get(id), foldedCount: state.size }`)

    for (let i = 1; i < got.sizes.length; i++) {
      expect(got.sizes[i]).toBeGreaterThan(got.sizes[i - 1]) // never rewritten in place
    }
    expect(got.rawStates.length).toBeGreaterThanOrEqual(6) // the whole history is auditable
    expect(got.foldedCount).toBe(1) // ... and folds to one current row
    expect(got.folded.state).toBe('acked') // last row bearing the id wins
    expect(got.folded.deposit_id).toBe(got.id)

    const onDisk = readJsonl(inboxFile(home, TO))
    expect(onDisk.length).toBeGreaterThanOrEqual(6)
    for (const row of onDisk) expect(row.deposit_id).toBe(got.id)
  })

  test('an acked message is no longer pending or due', async () => {
    const home = newTowerHome('acked')
    const got = await run(home, `
      const to = ${JSON.stringify(TO)}
      const r = d.deposit({ to, kind: 'summons', body: 'delivered and acked', from: 'oracle' })
      d.markDelivering(to, [r.deposit_id])
      d.markDelivered(to, [r.deposit_id])
      d.markAcked(to, [r.deposit_id])
      return { id: r.deposit_id, pending: ids(d.pendingItems(to)),
               dueFar: ids(d.dueItems(to, iso(10 * 365 * 24 * 3600))) }`)
    expect(got.pending).toEqual([])
    expect(got.dueFar).toEqual([])
    expect(readJsonl(deadLetterFile(home))).toHaveLength(0)
  })

  test('the deposit row carries every pinned field', async () => {
    const home = newTowerHome('rowshape')
    const got = await run(home, `
      const to = ${JSON.stringify(TO)}
      const r = d.deposit({ to, kind: 'summons', body: 'shape', from: 'oracle', ref: 'claim-1', ttl_s: 600 })
      return d.foldInbox(to).get(r.deposit_id)`)
    for (const field of ['deposit_id', 'ts', 'to', 'kind', 'body', 'from', 'ref', 'ttl_s',
      'evidence', 'state', 'attempts', 'next_attempt_at', 'last_error', 'deferred_reason']) {
      expect(got).toHaveProperty(field)
    }
    expect(got.to).toBe(TO)
    expect(got.from).toBe('oracle')
    expect(got.ref).toBe('claim-1')
    expect(got.ttl_s).toBe(600)
    expect(got.state).toBe('queued')
    expect(got.attempts).toBe(0)
    expect(got.last_error).toBeNull()
    expect(got.deferred_reason).toBeNull()
    expect(Number.isNaN(Date.parse(got.ts))).toBe(false)
    expect(Number.isNaN(Date.parse(got.next_attempt_at))).toBe(false)
  })
})

describe('isolation — this oracle never touches live ~/.tower state', () => {
  test('no oracle inbox exists under the live tower home', () => {
    const objects = join(LIVE_TOWER, 'objects')
    if (!existsSync(objects)) return
    const stray = readdirSync(objects).filter((n) => n.startsWith(slugOracle('pane:zzO')))
    expect(stray).toEqual([])
  })
})
