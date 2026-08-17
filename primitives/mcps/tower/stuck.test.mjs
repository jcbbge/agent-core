// stuck.test.mjs — acceptance tests for the two new CLI verbs, `stuck` and
// `deposit`.
//
// Authored by agnt-stuck-cli-test from DESIGN.md §4 and CONTRACT.md §2/§3/§4/§5/§8
// ONLY. The implementation lives in a worktree this seat cannot see, and nothing
// here was shaped to match it. Failing today is expected and correct.
//
// NO MOCKS. Every assertion drives the real cli.mjs as a subprocess against a
// real TOWER_HOME temp dir holding real JSONL files, and checks the real exit
// code and the real stdout. A mocked bus proves nothing about a bus whose defect
// was that it lied about delivery (CONTRACT §9). Live ~/.tower is never touched.
//
// Runner and subprocess idiom follow cli.test.mjs (bun:test + Bun.spawn) and the
// TOWER_HOME temp-dir idiom of jsonl-integrity.test.mjs.

import { afterAll, describe, expect, test } from 'bun:test'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const CLI = `${import.meta.dir}/cli.mjs`
const SUBPROCESS_TIMEOUT_MS = 15_000

const homes = []
afterAll(() => {
  for (const home of homes) rmSync(home, { recursive: true, force: true })
})

/** A fresh, empty TOWER_HOME. Never ~/.tower. */
function newTowerHome(tag) {
  const home = mkdtempSync(join(tmpdir(), `tower-stuck-${tag}-`))
  mkdirSync(join(home, 'objects'), { recursive: true })
  homes.push(home)
  return home
}

// Pinned by CONTRACT §2, transcribed here deliberately rather than imported.
// An acceptance test that imported the slug from the code under audit would
// accept a lossy or hashed slug as long as both sides agreed — which is the
// exact failure the round-trip requirement exists to catch.
function slugForAddressee(to) {
  return to.replace(/[^A-Za-z0-9._-]/g, ch =>
    '_' + ch.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0'))
}

const iso = ms => new Date(ms).toISOString().replace(/\.\d{3}Z$/, 'Z')

/** CONTRACT §3 row shape. */
function row(overrides = {}) {
  const now = Date.now()
  return {
    deposit_id: `dep-${now.toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    ts: iso(now),
    to: 'pane:w3R:p1P',
    kind: 'note',
    body: 'body text',
    from: 'agnt-stuck-cli-test',
    ref: null,
    ttl_s: null,
    evidence: {},
    state: 'queued',
    attempts: 0,
    next_attempt_at: iso(now),
    last_error: null,
    ...overrides,
  }
}

/** Real inbox file at the CONTRACT §2 path: ${TOWER}/objects/<slug>/inbox.jsonl */
function writeInbox(home, to, rows) {
  const dir = join(home, 'objects', slugForAddressee(to))
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'inbox.jsonl'), rows.map(r => JSON.stringify(r)).join('\n') + '\n')
  return join(dir, 'inbox.jsonl')
}

async function runCli(home, args) {
  const proc = Bun.spawn(['bun', CLI, ...args], {
    cwd: import.meta.dir,
    env: { ...process.env, TOWER_HOME: home },
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

const lines = stdout => stdout.split('\n').map(l => l.trim()).filter(Boolean)

/** The one line mentioning this addressee, or undefined. */
function lineFor(stdout, addressee) {
  return lines(stdout).find(l => l.includes(addressee))
}

// Time-shaped tokens: a duration (3d, 72h, 5m, 20s), a clock (14:32), or an ISO
// stamp. `stuck` carries TWO independent time fields per line — oldest age and
// next attempt — so a line rendering only one of them is missing a field. This
// tolerates any reasonable rendering while still failing if either is dropped.
function timeTokens(line) {
  const found = new Set()
  for (const m of line.matchAll(/\d{4}-\d{2}-\d{2}T[\d:]+Z?/g)) found.add(m[0])
  for (const m of line.matchAll(/\b\d{1,2}:\d{2}(:\d{2})?\b/g)) found.add(m[0])
  for (const m of line.matchAll(/\b\d+\s?(d|h|m|s|ms|days?|hours?|min(ute)?s?|sec(ond)?s?)\b/gi)) found.add(m[0])
  return [...found]
}

const DEAD_PANE = 'pane:zz9:pZZZ' // never minted; pane ids are never reused (DESIGN §2)

describe('stuck — incapable of silence (DESIGN §4)', () => {
  test('empty queue prints "nothing owed" and exits 0', async () => {
    const home = newTowerHome('empty')
    const { stdout, code } = await runCli(home, ['stuck'])

    // Mutation this detects: an implementation that returns early on an empty
    // queue and prints nothing. That mutation passes any test asserting only on
    // the exit code, and it is the exact failure mode this unit exists to remove
    // — a command that prints nothing is indistinguishable from a broken one.
    expect(stdout.trim()).not.toBe('')
    expect(stdout).toContain('nothing owed')
    expect(code).toBe(0)
  }, SUBPROCESS_TIMEOUT_MS)

  test('stdout is non-empty and names the addressee when something IS stuck', async () => {
    const home = newTowerHome('never-silent')
    const past = Date.now() - 3 * 24 * 3600 * 1000
    writeInbox(home, DEAD_PANE, [row({ to: DEAD_PANE, ts: iso(past), next_attempt_at: iso(past) })])
    const { stdout } = await runCli(home, ['stuck'])
    expect(stdout.trim()).not.toBe('')
    // Naming the addressee is what keeps this from passing vacuously on any
    // command that happens to print something (an unknown-verb usage banner).
    expect(stdout).toContain(DEAD_PANE)
  }, SUBPROCESS_TIMEOUT_MS)
})

describe('stuck — exit codes (DESIGN §4, CONTRACT §8)', () => {
  test('exit 1 when a deposit is owed and overdue', async () => {
    const home = newTowerHome('exit1')
    const past = Date.now() - 3 * 24 * 3600 * 1000
    writeInbox(home, DEAD_PANE, [
      row({ to: DEAD_PANE, ts: iso(past), next_attempt_at: iso(past), attempts: 4, last_error: 'sentinel-last-error-9x7' }),
    ])
    const { code } = await runCli(home, ['stuck'])

    // Mutation this detects: `process.exit(0)` unconditionally — the shape that
    // makes the verb unusable as a latch gate or a hook condition.
    expect(code).toBe(1)
  }, SUBPROCESS_TIMEOUT_MS)

  test('exit 0 when a non-empty inbox holds nothing owed (fold by deposit_id, CONTRACT §3)', async () => {
    const home = newTowerHome('exit0-folded')
    const past = Date.now() - 3 * 24 * 3600 * 1000
    const id = 'dep-fold-0001'
    // Same deposit_id twice: an old overdue `queued` row, then `acked`.
    // The LAST row bearing the id is the current state, so nothing is owed.
    writeInbox(home, DEAD_PANE, [
      row({ deposit_id: id, to: DEAD_PANE, ts: iso(past), next_attempt_at: iso(past), state: 'queued' }),
      row({ deposit_id: id, to: DEAD_PANE, ts: iso(past + 1000), state: 'acked' }),
    ])
    const { stdout, code } = await runCli(home, ['stuck'])

    // Mutations this detects: (a) `process.exit(1)` unconditionally; (b) reading
    // the append log without folding by deposit_id, which counts the superseded
    // `queued` row and reports a delivered message as stuck forever.
    expect(code).toBe(0)
    // Not vacuous: the verb must still have spoken about this queue — either it
    // lists the inbox or it says nothing is owed. An unknown-verb usage banner
    // satisfies neither.
    expect(stdout.includes(DEAD_PANE) || stdout.includes('nothing owed')).toBe(true)
  }, SUBPROCESS_TIMEOUT_MS)
})

describe('stuck — one line per non-empty inbox, seven fields (DESIGN §4)', () => {
  test('addressee, liveness, queued count, oldest age, attempts, next attempt, last error', async () => {
    const home = newTowerHome('sevenfields')
    const now = Date.now()
    const oldest = now - 3 * 24 * 3600 * 1000
    const rows = []
    for (let i = 0; i < 7; i++) {
      rows.push(row({
        deposit_id: `dep-seven-000${i}`,
        to: DEAD_PANE,
        ts: iso(oldest + i * 1000),
        next_attempt_at: iso(now + 120 * 1000),
        attempts: 4,
        last_error: 'sentinel-last-error-9x7',
      }))
    }
    writeInbox(home, DEAD_PANE, rows)
    const { stdout } = await runCli(home, ['stuck'])
    const line = lineFor(stdout, DEAD_PANE)
    expect(line).toBeDefined()

    // 1. addressee (round-tripped, see the round-trip suite below)
    expect(line).toContain(DEAD_PANE)
    // 2. engine liveness
    expect(line).toMatch(/\b(live|dead|stranded)\b/)
    // 3. queued count — 7 rows, all queued
    expect(line).toMatch(/\b7\b/)
    // 4 + 5. oldest age and next attempt: two distinct time-shaped tokens
    expect(timeTokens(line).length).toBeGreaterThanOrEqual(2)
    // 6. attempts
    expect(line).toMatch(/\b4\b/)
    // 7. last error, verbatim
    expect(line).toContain('sentinel-last-error-9x7')
  }, SUBPROCESS_TIMEOUT_MS)

  test('one line per inbox — two non-empty inboxes produce two distinct lines', async () => {
    const home = newTowerHome('perinbox')
    const past = Date.now() - 3 * 24 * 3600 * 1000
    writeInbox(home, DEAD_PANE, [row({ to: DEAD_PANE, ts: iso(past), next_attempt_at: iso(past) })])
    writeInbox(home, 'pane:zz8:pYYY', [row({ to: 'pane:zz8:pYYY', ts: iso(past), next_attempt_at: iso(past) })])
    const { stdout } = await runCli(home, ['stuck'])

    // Mutation this detects: reporting only the first inbox found, which hides
    // every other stuck addressee behind one line.
    const a = lineFor(stdout, DEAD_PANE)
    const b = lineFor(stdout, 'pane:zz8:pYYY')
    expect(a).toBeDefined()
    expect(b).toBeDefined()
    expect(a).not.toBe(b)
  }, SUBPROCESS_TIMEOUT_MS)
})

describe('stuck — addressee round-trips through the slug (CONTRACT §2)', () => {
  test('prints the real URI, never the on-disk slug', async () => {
    const home = newTowerHome('roundtrip')
    const to = 'pane:w3R:p1P'
    const slug = slugForAddressee(to)
    expect(slug).toBe('pane_3Aw3R_3Ap1P') // the pinned example, both directions
    const past = Date.now() - 3 * 24 * 3600 * 1000
    writeInbox(home, to, [row({ to, ts: iso(past), next_attempt_at: iso(past) })])
    const { stdout } = await runCli(home, ['stuck'])

    // Mutations this detects: printing the raw directory name; substituting a
    // hash, base64, or a lossy `-` replacement for the slug. Any of those leaves
    // the operator holding a string they cannot address a message to.
    expect(stdout).toContain(to)
    expect(stdout).not.toContain(slug)
  }, SUBPROCESS_TIMEOUT_MS)

  test('round-trip survives an addressee with a colon and an @ (role: scheme)', async () => {
    const home = newTowerHome('roundtrip-role')
    const to = 'role:ORCH@agent-core'
    const past = Date.now() - 3 * 24 * 3600 * 1000
    writeInbox(home, to, [row({ to, kind: 'summons', ts: iso(past), next_attempt_at: iso(past) })])
    const { stdout } = await runCli(home, ['stuck'])
    expect(stdout).toContain(to)
    expect(stdout).not.toContain(slugForAddressee(to))
  }, SUBPROCESS_TIMEOUT_MS)
})

describe('stuck — liveness (DESIGN §2, CONTRACT §8)', () => {
  test('orphaned inbox with no live engine and no successor reports stranded', async () => {
    const home = newTowerHome('stranded')
    const past = Date.now() - 3 * 24 * 3600 * 1000
    writeInbox(home, DEAD_PANE, [row({ to: DEAD_PANE, ts: iso(past), next_attempt_at: iso(past) })])
    const { stdout } = await runCli(home, ['stuck'])
    const line = lineFor(stdout, DEAD_PANE)
    expect(line).toBeDefined()

    // Mutation this detects: treating a pane id that is gone as merely quiet.
    // A dead pane's queue is the deferred-consequence case DESIGN §2 accepted
    // deliberately, on the condition that it is never silent.
    expect(line).toMatch(/\bstranded\b/)
  }, SUBPROCESS_TIMEOUT_MS)

  test('operator: plane is live, never stranded (CONTRACT §2)', async () => {
    const home = newTowerHome('operator-live')
    const past = Date.now() - 3 * 24 * 3600 * 1000
    writeInbox(home, 'operator:', [row({ to: 'operator:', kind: 'summons', ts: iso(past), next_attempt_at: iso(past) })])
    const { stdout } = await runCli(home, ['stuck'])
    const line = lineFor(stdout, 'operator:')
    expect(line).toBeDefined()

    // Mutation this detects: a liveness check that resolves every addressee
    // through the pane list, which would strand the human plane — the one
    // addressee that is live by definition.
    expect(line).toMatch(/\blive\b/)
    expect(line).not.toMatch(/\bstranded\b/)
  }, SUBPROCESS_TIMEOUT_MS)
})

describe('stuck — dead-letter tail with reasons (DESIGN §4)', () => {
  test('prints the reason of a dead-lettered row', async () => {
    const home = newTowerHome('dltail')
    const reason = 'no-completion-evidence: idle is not done'
    writeFileSync(join(home, 'dead-letter.jsonl'),
      JSON.stringify({ id: 'dl-0001', ts: iso(Date.now()), reason, row: row({ kind: 'completion' }) }) + '\n')
    const { stdout } = await runCli(home, ['stuck'])

    // Mutation this detects: a dead-letter tail printed without its reasons,
    // which returns the operator to guessing why a message never arrived.
    expect(stdout).toContain(reason)
  }, SUBPROCESS_TIMEOUT_MS)
})

// --- deposit -----------------------------------------------------------------

/** Last stdout line that parses as JSON — the receipt (CONTRACT §4/§8). */
function receiptOf(stdout) {
  for (const line of lines(stdout).reverse()) {
    try {
      const parsed = JSON.parse(line)
      if (parsed && typeof parsed === 'object') return parsed
    } catch { /* not the receipt line */ }
  }
  return undefined
}

describe('deposit — receipt and exit codes (CONTRACT §4/§8)', () => {
  test('accepted deposit exits 0 with a parseable receipt', async () => {
    const home = newTowerHome('dep-accept')
    const { stdout, code } = await runCli(home, [
      'deposit', 'pane:w3R:p1P', 'note', 'hello from the acceptance suite',
      '--from', 'agnt-stuck-cli-test',
    ])
    const receipt = receiptOf(stdout)
    expect(receipt).toBeDefined()
    expect(typeof receipt.deposit_id).toBe('string')
    expect(receipt.deposit_id.length).toBeGreaterThan(0)
    expect(receipt.accepted).toBe(true)
    expect(receipt.reason).toBe(null) // accepted:true implies reason null
    expect(code).toBe(0)
  }, SUBPROCESS_TIMEOUT_MS)

  test('an accepted deposit is actually owed afterwards — stuck sees it', async () => {
    const home = newTowerHome('dep-lands')
    const dep = await runCli(home, [
      'deposit', DEAD_PANE, 'summons', 'you are needed',
      '--from', 'agnt-stuck-cli-test',
    ])
    expect(dep.code).toBe(0)

    // Mutation this detects: a `deposit` verb that prints an accepting receipt
    // without writing the queue row — a receipt that lies about delivery is the
    // original defect wearing a new coat.
    const { stdout } = await runCli(home, ['stuck'])
    expect(stdout).toContain(DEAD_PANE)
    expect(existsSync(join(home, 'objects', slugForAddressee(DEAD_PANE), 'inbox.jsonl'))).toBe(true)
  }, SUBPROCESS_TIMEOUT_MS)

  test('completion whose only evidence is status=idle is refused, exit 1, exact reason', async () => {
    const home = newTowerHome('dep-idle')
    const { stdout, code } = await runCli(home, [
      'deposit', 'pane:w3R:p1P', 'completion', 'unit finished',
      '--from', 'agnt-stuck-cli-test', '--evidence-status', 'idle',
    ])
    const receipt = receiptOf(stdout)
    expect(receipt).toBeDefined()
    expect(receipt.accepted).toBe(false)
    expect(receipt.reason).toBe('no-completion-evidence: idle is not done')

    // Mutation this detects: exiting 0 on a refusal. The python handler binding
    // shells to this verb and reads the exit code; a refusal reported as success
    // is a silently discarded completion, which is 32.1% of the census.
    expect(code).toBe(1)

    // CONTRACT §4: a refusal writes a dead-letter row. There is no silent path.
    const dl = join(home, 'dead-letter.jsonl')
    expect(existsSync(dl)).toBe(true)
    expect(readFileSync(dl, 'utf8')).toContain('no-completion-evidence: idle is not done')
  }, SUBPROCESS_TIMEOUT_MS)

  test('completion with status=done is accepted, exit 0 (the refusal is not blanket)', async () => {
    const home = newTowerHome('dep-done')
    const { stdout, code } = await runCli(home, [
      'deposit', 'pane:w3R:p1P', 'completion', 'unit finished',
      '--from', 'agnt-stuck-cli-test', '--evidence-status', 'done',
    ])
    const receipt = receiptOf(stdout)
    expect(receipt).toBeDefined()

    // Mutation this detects: refusing every `completion` outright, which would
    // pass the idle test above while making the guarantee vacuous.
    expect(receipt.accepted).toBe(true)
    expect(receipt.reason).toBe(null)
    expect(code).toBe(0)
  }, SUBPROCESS_TIMEOUT_MS)

  test('agent: scheme is refused today with its pinned reason, exit 1', async () => {
    const home = newTowerHome('dep-agent')
    const { stdout, code } = await runCli(home, [
      'deposit', 'agent:a-mswi9zhh-1cfj', 'note', 'reserved scheme',
      '--from', 'agnt-stuck-cli-test',
    ])
    const receipt = receiptOf(stdout)
    expect(receipt).toBeDefined()
    expect(receipt.accepted).toBe(false)
    expect(receipt.reason).toBe('agent: scheme not yet implemented')
    expect(code).toBe(1)
  }, SUBPROCESS_TIMEOUT_MS)

  test('receipt is exactly one JSON line carrying deposit_id, accepted, reason', async () => {
    const home = newTowerHome('dep-shape')
    const { stdout } = await runCli(home, [
      'deposit', 'pane:w3R:p1P', 'note', 'shape check',
      '--from', 'agnt-stuck-cli-test',
    ])
    const jsonLines = lines(stdout).filter(l => {
      try { return typeof JSON.parse(l) === 'object' } catch { return false }
    })
    expect(jsonLines.length).toBe(1)
    const receipt = JSON.parse(jsonLines[0])
    expect(Object.keys(receipt).sort()).toEqual(['accepted', 'deposit_id', 'reason'])
  }, SUBPROCESS_TIMEOUT_MS)
})

// --- deferral is not failure (CONTRACT §6a, DESIGN §3a) ----------------------

/** Fresh Bun process so TOWER_HOME is honored before module init. */
async function runScript(home, script) {
  const proc = Bun.spawn(['bun', '-e', script], {
    cwd: import.meta.dir,
    env: { ...process.env, TOWER_HOME: home },
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

/** Fold an inbox the way CONTRACT §3 pins it: last row bearing a deposit_id wins. */
function foldInboxFile(home, to) {
  const path = join(home, 'objects', slugForAddressee(to), 'inbox.jsonl')
  const folded = new Map()
  for (const line of readFileSync(path, 'utf8').split('\n').filter(Boolean)) {
    const r = JSON.parse(line)
    folded.set(r.deposit_id, r)
  }
  return folded
}

const DEPOSIT_MJS = JSON.stringify(`${import.meta.dir}/deposit.mjs`)

describe('stuck — deferral is not failure (CONTRACT §6a)', () => {
  // §6a pins the folded-row shape: a deferred item is exactly
  // `state === 'queued'` AND `deferred_reason` non-null; `attempts` unchanged;
  // `next_attempt_at` pushed forward; `last_error` and `deferred_reason` are
  // never written by the same event. The rendering tests below use fixture rows
  // so they fail on cli.mjs alone; the row-level tests drive `markDeferred`.

  test('renders the deferral reason, distinct from a failing item and from a plain queued one', async () => {
    const home = newTowerHome('deferred')
    const past = Date.now() - 3 * 24 * 3600 * 1000
    const busy = 'pane:zz7:pBUSY'
    const broken = 'pane:zz6:pFAIL'
    const plain = 'pane:zz4:pPLAIN'
    writeInbox(home, busy, [row({
      to: busy, ts: iso(past), next_attempt_at: iso(past),
      state: 'queued', deferred_reason: 'target busy', last_error: null,
    })])
    writeInbox(home, broken, [row({
      to: broken, ts: iso(past), next_attempt_at: iso(past),
      state: 'queued', deferred_reason: null, last_error: 'genuine-failure-sentinel-4k2', attempts: 3,
    })])
    writeInbox(home, plain, [row({
      to: plain, ts: iso(past), next_attempt_at: iso(past),
      state: 'queued', deferred_reason: null, last_error: null,
    })])

    const { stdout } = await runCli(home, ['stuck'])
    const deferredLine = lineFor(stdout, busy)
    const failingLine = lineFor(stdout, broken)
    const plainLine = lineFor(stdout, plain)
    expect(deferredLine).toBeDefined()
    expect(failingLine).toBeDefined()
    expect(plainLine).toBeDefined()

    // Assert on VALUES, never on column labels. A renderer that prints
    // `deferred=-` on a failing row is correct — the label with an empty value is
    // what keeps the columns aligned, and ragged output is worse for the operator,
    // not better (ORCH arbitration, 2026-08-17). What §6a actually requires is
    // that the three states be distinguishable in one glance.
    const fieldValue = (line, key) => {
      const m = line.match(new RegExp(`\\b${key}\\s*[=:]\\s*(\\S+)`))
      return m ? m[1] : undefined
    }
    const PLACEHOLDERS = new Set(['-', '--', 'none', 'null', 'n/a', '(none)'])
    const hasValue = (line, key) => {
      const v = fieldValue(line, key)
      return v !== undefined && !PLACEHOLDERS.has(v.toLowerCase())
    }

    // Mutation this detects: rendering a deferral through the failure column (or
    // dropping the deferral value), so a busy addressee reads as a broken one.
    expect(deferredLine).toContain('target busy')
    expect(hasValue(deferredLine, 'deferred')).toBe(true)
    expect(hasValue(deferredLine, 'last_error')).toBe(false)

    expect(failingLine).toContain('genuine-failure-sentinel-4k2')
    expect(hasValue(failingLine, 'last_error')).toBe(true)
    expect(hasValue(failingLine, 'deferred')).toBe(false)

    expect(hasValue(plainLine, 'deferred')).toBe(false)
    expect(hasValue(plainLine, 'last_error')).toBe(false)

    // The property worth defending: the three states never render the same. This
    // fails the moment any two of them collapse into one appearance.
    const signature = l => `${hasValue(l, 'deferred')}/${hasValue(l, 'last_error')}`
    expect(new Set([signature(deferredLine), signature(failingLine), signature(plainLine)]).size).toBe(3)
  }, SUBPROCESS_TIMEOUT_MS)

  test('markDeferred writes the pinned row: queued, deferred_reason set, attempts unchanged, time pushed', async () => {
    const home = newTowerHome('defer-row')
    const busy = 'pane:zz3:pROW'
    const id = 'dep-defer-0001'
    const past = Date.now() - 3 * 24 * 3600 * 1000
    writeInbox(home, busy, [row({
      deposit_id: id, to: busy, ts: iso(past), next_attempt_at: iso(past),
      state: 'queued', attempts: 2, deferred_reason: null, last_error: null,
    })])

    const setup = await runScript(home, `
      const d = await import(${DEPOSIT_MJS})
      d.markDeferred(${JSON.stringify(busy)}, [${JSON.stringify(id)}], 'target busy')
    `)
    expect(setup.code).toBe(0)

    const r = foldInboxFile(home, busy).get(id)
    expect(r).toBeDefined()
    // Mutations this detects: writing a `deferred` state (a deferral is never its
    // own terminal state); incrementing attempts, which marches a busy-but-healthy
    // addressee to MAX_ATTEMPTS and dead-letters its mail FOR BEING BUSY; leaving
    // next_attempt_at in the past, which busy-spins the courier on a working pane.
    expect(r.state).toBe('queued')
    expect(r.deferred_reason).toBe('target busy')
    expect(r.attempts).toBe(2)
    expect(r.last_error).toBe(null)
    expect(Date.parse(r.next_attempt_at)).toBeGreaterThan(past)
  }, SUBPROCESS_TIMEOUT_MS)

  test('deferred_reason is cleared by delivery and by genuine failure — never both fields on one row', async () => {
    const home = newTowerHome('defer-clear')
    const past = Date.now() - 3 * 24 * 3600 * 1000
    const a = 'pane:zz2:pCLEARA'
    const b = 'pane:zz1:pCLEARB'
    const idA = 'dep-clear-000A'
    const idB = 'dep-clear-000B'
    for (const [to, id] of [[a, idA], [b, idB]]) {
      writeInbox(home, to, [row({
        deposit_id: id, to, ts: iso(past), next_attempt_at: iso(past),
        state: 'queued', deferred_reason: null, last_error: null,
      })])
    }

    const setup = await runScript(home, `
      const d = await import(${DEPOSIT_MJS})
      d.markDeferred(${JSON.stringify(a)}, [${JSON.stringify(idA)}], 'target busy')
      d.markDelivered(${JSON.stringify(a)}, [${JSON.stringify(idA)}])
      d.markDeferred(${JSON.stringify(b)}, [${JSON.stringify(idB)}], 'target busy')
      d.requeue(${JSON.stringify(b)}, ${JSON.stringify(idB)}, 'genuine-failure-sentinel-4k2')
    `)
    expect(setup.code).toBe(0)

    // Mutation this detects: leaving a stale deferral reason on a row that has
    // since been delivered or has genuinely failed. That row tells the operator
    // the exact opposite of what is happening, and it destroys the row-level
    // separation that makes rule 3 checkable by reading a row.
    const delivered = foldInboxFile(home, a).get(idA)
    expect(delivered.deferred_reason).toBe(null)

    const failed = foldInboxFile(home, b).get(idB)
    expect(failed.deferred_reason).toBe(null)
    expect(failed.last_error).toBe('genuine-failure-sentinel-4k2')

    for (const [to, id] of [[a, idA], [b, idB]]) {
      for (const r of foldInboxFile(home, to).values()) {
        if (r.deposit_id !== id) continue
        const both = r.last_error != null && r.deferred_reason != null
        expect(both).toBe(false)
      }
    }
  }, SUBPROCESS_TIMEOUT_MS)

  test('repeated deferral never dead-letters and never stops being owed (attempts not burned)', async () => {
    const home = newTowerHome('defer-burn')
    const busy = 'pane:zz5:pLOAD'
    const id = 'dep-burn-0001'
    const past = Date.now() - 3 * 24 * 3600 * 1000
    writeInbox(home, busy, [row({
      deposit_id: id, to: busy, ts: iso(past), next_attempt_at: iso(past),
      state: 'queued', attempts: 0, deferred_reason: null, last_error: null,
    })])

    // MAX_ATTEMPTS is 8. Defer well past it: a healthy-but-busy addressee must
    // survive an unbounded number of passes.
    const setup = await runScript(home, `
      const d = await import(${DEPOSIT_MJS})
      for (let i = 0; i < 12; i++) d.markDeferred(${JSON.stringify(busy)}, [${JSON.stringify(id)}], 'target busy')
    `)
    expect(setup.code).toBe(0)

    // Mutation this detects: `markDeferred` implemented as a call to `requeue`.
    // Twelve defers would then exhaust MAX_ATTEMPTS and dead-letter the message
    // — a new silent-loss bug shipped inside the fix for silent loss.
    const dl = join(home, 'dead-letter.jsonl')
    if (existsSync(dl)) expect(readFileSync(dl, 'utf8')).not.toContain(id)
    expect(foldInboxFile(home, busy).get(id).attempts).toBe(0)

    const { stdout } = await runCli(home, ['stuck'])
    expect(stdout).toContain(busy) // still owed, still visible, never terminal
  }, SUBPROCESS_TIMEOUT_MS)
})

// --- the stuck threshold (CONTRACT §6b) --------------------------------------

const STUCK_THRESHOLD_SECONDS = 300 // pinned by CONTRACT §6b
const MAX_ATTEMPTS = 8              // pinned by CONTRACT §6
const LIVE = 'operator:'            // live by definition (CONTRACT §2), so never stranded

describe(`stuck — threshold, STUCK_THRESHOLD_SECONDS = ${STUCK_THRESHOLD_SECONDS} (CONTRACT §6b)`, () => {
  // Times are set well clear of the 300s line (120s under, 600s over) rather
  // than at it: an assertion on the exact boundary would race the runtime of the
  // subprocess itself. Every exit-0 test also asserts specific output, per the
  // §6b finding — an unknown verb prints usage and exits 0, so a bare exit-0
  // assertion is vacuous against a CLI that never implemented the verb.

  test('exit 0 — queued and overdue, but inside the threshold', async () => {
    const home = newTowerHome('thr-under')
    const now = Date.now()
    // Addressed to the operator plane so strandedness (rule 4) cannot confound
    // the clock being tested here.
    writeInbox(home, LIVE, [row({
      to: LIVE, kind: 'summons', ts: iso(now - 600_000),
      next_attempt_at: iso(now - 120_000), state: 'queued', attempts: 0,
    })])
    const { stdout, code } = await runCli(home, ['stuck'])

    // Mutation this detects: alarming on any overdue item at all, which fires on
    // every normally-paced message and makes the exit code useless as a gate.
    expect(code).toBe(0)
    expect(stdout).toContain(LIVE)
  }, SUBPROCESS_TIMEOUT_MS)

  test('exit 1 — queued more than 300s past next_attempt_at (rule 1)', async () => {
    const home = newTowerHome('thr-over')
    const now = Date.now()
    writeInbox(home, LIVE, [row({
      to: LIVE, kind: 'summons', ts: iso(now - 3_600_000),
      next_attempt_at: iso(now - 600_000), state: 'queued', attempts: 0,
    })])
    const { code } = await runCli(home, ['stuck'])

    // Mutation this detects: a threshold set so wide that nothing ever alarms —
    // the silent-loss failure wearing an exit code.
    expect(code).toBe(1)
  }, SUBPROCESS_TIMEOUT_MS)

  test('exit 1 — attempts >= MAX_ATTEMPTS and not terminal, despite a future next_attempt_at (rule 2)', async () => {
    const home = newTowerHome('thr-attempts')
    const now = Date.now()
    writeInbox(home, LIVE, [row({
      to: LIVE, kind: 'summons', ts: iso(now - 3_600_000),
      next_attempt_at: iso(now + 3_600_000), state: 'queued',
      attempts: MAX_ATTEMPTS, last_error: 'sentinel-last-error-9x7',
    })])
    const { code } = await runCli(home, ['stuck'])

    // Mutation this detects: implementing `stuck` as the overdue clock alone. An
    // item that has burned every attempt is stuck whatever its next attempt time
    // claims.
    expect(code).toBe(1)
  }, SUBPROCESS_TIMEOUT_MS)

  test('exit 1 — a stranded inbox with nothing overdue (rule 4)', async () => {
    const home = newTowerHome('thr-stranded')
    const now = Date.now()
    writeInbox(home, DEAD_PANE, [row({
      to: DEAD_PANE, ts: iso(now), next_attempt_at: iso(now + 3_600_000),
      state: 'queued', attempts: 0,
    })])
    const { code } = await runCli(home, ['stuck'])

    // Mutation this detects: the overdue clock alone, again. A queue owed to a
    // pane that will never come back is stuck the moment the pane dies, not five
    // minutes after its next attempt time.
    expect(code).toBe(1)
  }, SUBPROCESS_TIMEOUT_MS)

  test('exit 0 — a deferred item inside the clock does NOT alarm (a busy pane is not an alarm)', async () => {
    const home = newTowerHome('thr-deferred-ok')
    const now = Date.now()
    writeInbox(home, LIVE, [row({
      to: LIVE, kind: 'summons', ts: iso(now - 60_000),
      next_attempt_at: iso(now + 30_000), state: 'queued',
      deferred_reason: 'target busy', attempts: 0,
    })])
    const { stdout, code } = await runCli(home, ['stuck'])

    // Mutation this detects: treating `deferred_reason` as an alarm condition. A
    // healthy pane under load would then page the operator continuously, and an
    // alarm that always fires is an alarm nobody reads.
    expect(code).toBe(0)
    expect(stdout).toContain('target busy')
  }, SUBPROCESS_TIMEOUT_MS)

  test('exit 1 — a deferred item is still stuck on the same overdue clock (rule 1)', async () => {
    const home = newTowerHome('thr-deferred-stuck')
    const now = Date.now()
    writeInbox(home, LIVE, [row({
      to: LIVE, kind: 'summons', ts: iso(now - 3_600_000),
      next_attempt_at: iso(now - 600_000), state: 'queued',
      deferred_reason: 'target busy', attempts: 0,
    })])
    const { code } = await runCli(home, ['stuck'])

    // Mutation this detects: exempting deferred items from the overdue clock. A
    // message deferred forever behind a permanently-busy pane would then never
    // alarm — silent loss re-entering through the door built to stop it.
    expect(code).toBe(1)
  }, SUBPROCESS_TIMEOUT_MS)
})

describe('usage (CONTRACT §8)', () => {
  test('both new verbs appear in the usage string', async () => {
    const home = newTowerHome('usage')
    const { combined } = await runCli(home, ['--help'])
    expect(combined).toContain('deposit')
    expect(combined).toContain('stuck')
  }, SUBPROCESS_TIMEOUT_MS)
})

describe('live state is never touched', () => {
  test('every TOWER_HOME used by this file is a temp dir', () => {
    // Runs last, after every home above has been created. Guards against a later
    // edit that reaches for the live ~/.tower to make a test pass.
    expect(homes.length).toBeGreaterThan(0)
    for (const home of homes) {
      expect(home.startsWith(tmpdir())).toBe(true)
      expect(home).not.toContain('/.tower')
    }
  })
})
