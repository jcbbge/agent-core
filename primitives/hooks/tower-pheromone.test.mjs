#!/usr/bin/env bun
// Oracle tests for Tower pheromone stream (design §4.2 / §4.4).
// Authored from plan only — never from implementation.
import {
  mkdtempSync,
  rmSync,
  readFileSync,
  existsSync,
  unlinkSync,
} from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const tmpBase = mkdtempSync(join(tmpdir(), 'tower-pheromone-'))
const pheromonesPath = join(tmpBase, 'pheromones.jsonl')
process.env.TOWER_PHEROMONES_PATH = pheromonesPath

const {
  emitPheromone,
  pheromoneField,
  SCENT_TTL_DEFAULTS,
  PHEROMONES,
  _test,
} = await import('./tower-ledger.mjs')

const derive = _test.pheromoneFieldFromRows
if (typeof derive !== 'function') {
  console.error('FAIL setup — _test.pheromoneFieldFromRows must be exported')
  process.exit(1)
}

let failed = 0

const assertEq = (label, a, b) => {
  const aj = JSON.stringify(a)
  const bj = JSON.stringify(b)
  if (aj !== bj) {
    console.error(`FAIL ${label}`)
    console.error(`  got:  ${aj}`)
    console.error(`  want: ${bj}`)
    failed++
    return false
  }
  console.log(`ok ${label}`)
  return true
}

const assertTrue = (label, cond) => {
  if (!cond) {
    console.error(`FAIL ${label}`)
    failed++
    return false
  }
  console.log(`ok ${label}`)
  return true
}

const assertThrows = (label, fn) => {
  try {
    fn()
    console.error(`FAIL ${label} — expected throw`)
    failed++
    return false
  } catch {
    console.log(`ok ${label}`)
    return true
  }
}

const CWD_A = '/Users/jrg/agent-core'
const CWD_B = '/Users/jrg/herdr-spine'
const TOPIC = 'constellation-zg/tower-stigmergy'
const FROM = 'test-maker'
const EVIDENCE = '/tmp/tower-pheromone-evidence.txt'
const PAYLOAD = '/tmp/tower-pheromone-brief.md'
const ROUTE = { to_role: 'researcher', to_pane: null, reply_to: null }

const isoAt = (ms) => new Date(ms).toISOString()

const row = (overrides) => ({
  id: overrides.id ?? 'ph-test-aaaa',
  ts: overrides.ts ?? isoAt(1_000_000),
  cwd: overrides.cwd ?? CWD_A,
  topic: overrides.topic ?? TOPIC,
  from: overrides.from ?? FROM,
  scent: overrides.scent ?? 'work-available',
  route: overrides.route ?? ROUTE,
  ref: overrides.ref ?? null,
  payload_ref: overrides.payload_ref ?? PAYLOAD,
  evidence: overrides.evidence ?? EVIDENCE,
  ttl_s: overrides.ttl_s ?? 1800,
  ...overrides,
})

// --- emit validation (AC: P3 evidence, scent enum, ref/payload_ref rules) ---

assertThrows('emit rejects missing evidence', () =>
  emitPheromone(CWD_A, {
    scent: 'work-available',
    topic: TOPIC,
    from: FROM,
    payload_ref: PAYLOAD,
    evidence: '',
  }),
)

assertThrows('emit rejects invalid scent', () =>
  emitPheromone(CWD_A, {
    scent: 'work-pending',
    topic: TOPIC,
    from: FROM,
    payload_ref: PAYLOAD,
    evidence: EVIDENCE,
  }),
)

assertThrows('emit work-claimed requires ref', () =>
  emitPheromone(CWD_A, {
    scent: 'work-claimed',
    topic: TOPIC,
    from: FROM,
    payload_ref: PAYLOAD,
    evidence: EVIDENCE,
  }),
)

assertThrows('emit work-done requires ref', () =>
  emitPheromone(CWD_A, {
    scent: 'work-done',
    topic: TOPIC,
    from: FROM,
    payload_ref: PAYLOAD,
    evidence: EVIDENCE,
  }),
)

assertThrows('emit work-available requires payload_ref', () =>
  emitPheromone(CWD_A, {
    scent: 'work-available',
    topic: TOPIC,
    from: FROM,
    evidence: EVIDENCE,
    payload_ref: '',
  }),
)

assertThrows('emit work-done requires payload_ref', () =>
  emitPheromone(CWD_A, {
    scent: 'work-done',
    topic: TOPIC,
    from: FROM,
    ref: 'ph-avail-1',
    evidence: EVIDENCE,
    payload_ref: '',
  }),
)

// --- TOWER_PHEROMONES_PATH override (AC: never touch live stream) ---

assertEq('PHEROMONES honors env override', PHEROMONES, pheromonesPath)

const avail = emitPheromone(CWD_A, {
  scent: 'work-available',
  topic: TOPIC,
  from: FROM,
  payload_ref: PAYLOAD,
  evidence: EVIDENCE,
})

assertTrue('emit writes to tmp path', existsSync(pheromonesPath))
assertTrue(
  'emit appends row to tmp file',
  readFileSync(pheromonesPath, 'utf8').includes(avail.id),
)
assertTrue(
  'ph id format',
  /^ph-[0-9a-z]+-[0-9a-z]{4}$/.test(avail.id),
)

// --- TTL defaults (AC: SCENT_TTL_DEFAULTS) ---

assertEq('SCENT_TTL_DEFAULTS work-available', SCENT_TTL_DEFAULTS['work-available'], 1800)
assertEq('SCENT_TTL_DEFAULTS work-claimed', SCENT_TTL_DEFAULTS['work-claimed'], 30)
assertEq('SCENT_TTL_DEFAULTS work-done', SCENT_TTL_DEFAULTS['work-done'], 86400)
assertEq('SCENT_TTL_DEFAULTS need-help', SCENT_TTL_DEFAULTS['need-help'], 3600)

const t0 = Date.parse('2026-08-12T12:00:00.000Z')
const defaultAvail = emitPheromone(CWD_A, {
  scent: 'work-available',
  topic: TOPIC,
  from: FROM,
  payload_ref: PAYLOAD,
  evidence: EVIDENCE,
})
assertEq('emit applies work-available ttl default', defaultAvail.ttl_s, 1800)

const defaultClaim = emitPheromone(CWD_A, {
  scent: 'work-claimed',
  topic: TOPIC,
  from: FROM,
  ref: defaultAvail.id,
  payload_ref: PAYLOAD,
  evidence: EVIDENCE,
})
assertEq('emit applies work-claimed ttl default', defaultClaim.ttl_s, 30)

// --- field derivation via pure helper (AC: §4.4 open/claimed/done/evaporated/help) ---

const availId = 'ph-avail-derive'
const baseTs = t0
const availRow = row({
  id: availId,
  ts: isoAt(baseTs),
  scent: 'work-available',
  ttl_s: 600,
})

let field = derive(CWD_A, [availRow], { topic: TOPIC, now: baseTs + 1000 })
assertEq('derive open work-available', field.open.map((r) => r.id), [availId])
assertEq('derive empty claimed', field.claimed.length, 0)
assertEq('derive empty done', field.done.length, 0)
assertEq('derive empty evaporated', field.evaporated.length, 0)

const claimRow = row({
  id: 'ph-claim-1',
  ts: isoAt(baseTs + 5000),
  scent: 'work-claimed',
  ref: availId,
  ttl_s: 30,
})
field = derive(CWD_A, [availRow, claimRow], { topic: TOPIC, now: baseTs + 10_000 })
assertEq('derive claimed after live claim', field.claimed.map((r) => r.id), [availId])
assertEq('derive open empty when claimed', field.open.length, 0)

const doneRow = row({
  id: 'ph-done-1',
  ts: isoAt(baseTs + 20_000),
  scent: 'work-done',
  ref: availId,
  payload_ref: '/tmp/done-marker.done',
  ttl_s: 86400,
})
field = derive(
  CWD_A,
  [availRow, claimRow, doneRow],
  { topic: TOPIC, now: baseTs + 25_000 },
)
assertEq('derive done after work-done', field.done.map((r) => r.id), [availId])
assertEq('derive not open when done', field.open.length, 0)
assertEq('derive not claimed when done', field.claimed.length, 0)

field = derive(CWD_A, [availRow], { topic: TOPIC, now: baseTs + 700_000 })
assertEq('derive evaporated at ttl boundary', field.evaporated.map((r) => r.id), [availId])
assertEq('derive not open when evaporated', field.open.length, 0)

field = derive(
  CWD_A,
  [availRow, claimRow],
  { topic: TOPIC, now: baseTs + 100_000 },
)
assertEq('derive re-open after expired claim', field.open.map((r) => r.id), [availId])
assertEq('derive claimed empty after claim expiry', field.claimed.length, 0)

const helpRow = row({
  id: 'ph-help-1',
  ts: isoAt(baseTs),
  scent: 'need-help',
  ref: 'ph-context',
  payload_ref: null,
  ttl_s: 3600,
})
field = derive(CWD_A, [helpRow], { topic: TOPIC, now: baseTs + 1000 })
assertEq('derive help live within ttl', field.help.map((r) => r.id), ['ph-help-1'])

field = derive(CWD_A, [helpRow], { topic: TOPIC, now: baseTs + 4_000_000 })
assertEq('derive help empty after ttl', field.help.length, 0)

// --- cwd scoping (AC: normCwd isolation) ---

const scopedAvail = row({
  id: 'ph-scoped-a',
  cwd: CWD_A,
  ts: isoAt(baseTs),
  scent: 'work-available',
})
const scopedB = derive(CWD_B, [scopedAvail], { topic: TOPIC, now: baseTs + 1000 })
assertEq('derive cwd B does not see cwd A row', scopedB.open.length, 0)
const scopedA = derive(CWD_A, [scopedAvail], { topic: TOPIC, now: baseTs + 1000 })
assertEq('derive cwd A sees own row', scopedA.open.map((r) => r.id), ['ph-scoped-a'])

// --- integration: emit + pheromoneField (AC: real append/read, synthetic now) ---

const liveAvail = emitPheromone(CWD_A, {
  scent: 'work-available',
  topic: TOPIC,
  from: FROM,
  payload_ref: PAYLOAD,
  evidence: EVIDENCE,
  route: ROUTE,
})

let liveField = pheromoneField(CWD_A, { topic: TOPIC, now: Date.parse(liveAvail.ts) + 1000 })
assertTrue(
  'pheromoneField open after emit',
  liveField.open.some((r) => r.id === liveAvail.id),
)

emitPheromone(CWD_A, {
  scent: 'work-claimed',
  topic: TOPIC,
  from: FROM,
  ref: liveAvail.id,
  payload_ref: PAYLOAD,
  evidence: EVIDENCE,
})

liveField = pheromoneField(CWD_A, { topic: TOPIC, now: Date.parse(liveAvail.ts) + 5000 })
assertTrue(
  'pheromoneField claimed after claim emit',
  liveField.claimed.some((r) => r.id === liveAvail.id),
)
assertEq(
  'pheromoneField open empty when claimed',
  liveField.open.filter((r) => r.id === liveAvail.id).length,
  0,
)

emitPheromone(CWD_A, {
  scent: 'work-done',
  topic: TOPIC,
  from: FROM,
  ref: liveAvail.id,
  payload_ref: '/tmp/u1.done',
  evidence: EVIDENCE,
})

liveField = pheromoneField(CWD_A, { topic: TOPIC, now: Date.parse(liveAvail.ts) + 10_000 })
assertTrue(
  'pheromoneField done after done emit',
  liveField.done.some((r) => r.id === liveAvail.id),
)

const otherCwdField = pheromoneField(CWD_B, { topic: TOPIC })
assertEq(
  'pheromoneField cwd isolation on live file',
  otherCwdField.open.filter((r) => r.id === liveAvail.id).length,
  0,
)

// cleanup tmp
try {
  unlinkSync(pheromonesPath)
  rmSync(tmpBase, { recursive: true })
} catch {
  /* ok */
}

if (failed > 0) {
  console.error(`\n${failed} pheromone test(s) failed`)
  process.exit(1)
}
console.log('\nall pheromone tests passed')
process.exit(0)
