#!/usr/bin/env bun
// Oracle tests for statem + twr on the NEW tower store (the `msg` table).
//
// Authored from the brief and the agreed contract only — never from the
// implementation source. statem.ts and twr.ts are written by the sibling impl
// seat (agnt-statem) in a separate worktree; this file is the test seat's half
// of the bifurcated pair, so it must describe the contract rather than the
// code that happens to exist.
//
// The contract under test (posted as tower msg 44, topic tower/cutover):
//   1. Isolation is TOWER_HOME / TOWER_DB, exactly as primitives/tower/tower.mjs
//      does it. The old `--board <path>` flag is retired.
//   2. PROJECT = basename(realpathSync(<project-root>)).
//      statem writes one msg row per transition:
//        sender = "statem@" + PROJECT
//        topic  = PROJECT + "/statem"
//        kind   = "finding"
//        body   = the transition string, unchanged.
//      twr scopes by TOPIC PREFIX `PROJECT + "/"`.
//   3. twr writes nothing, ever.
//   4. The integrity footer reports PRAGMA integrity_check, not a JSONL
//      bad-line count — a SQLite table has no unparseable lines.
//
// The oracle reads the store DIRECTLY with bun:sqlite. It never asks a tool
// under test what the tool under test wrote.
import { describe, expect, test, beforeEach, afterEach } from 'bun:test'
import { Database } from 'bun:sqlite'
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import { realpathSync } from 'node:fs'
import { tmpdir, homedir } from 'node:os'

const STATEM_DIR = import.meta.dir
const STATEM = join(STATEM_DIR, 'statem.ts')
const TWR = join(STATEM_DIR, 'twr.ts')

// ── scratch: one temp TOWER_HOME per test, never the live bus ───────────────
// The live ~/.tower/tower.db is read by the coordinator and four other panes
// while this suite runs. Nothing here may touch it.
const LIVE_DB = join(homedir(), '.tower', 'tower.db')

let scratch
let towerHome
let projectRoot
let baseline
let PROJECT

beforeEach(() => {
  scratch = mkdtempSync(join(tmpdir(), 'statem-oracle-'))
  towerHome = join(scratch, 'tower-home')
  mkdirSync(towerHome, { recursive: true })
  baseline = join(scratch, 'baseline.json')
})

afterEach(() => {
  if (scratch) rmSync(scratch, { recursive: true, force: true })
})

const dbPath = () => join(towerHome, 'tower.db')

/** Every row in the scratch store, oldest first. Direct read — the oracle does
 *  not route its observations through twr. */
function rows() {
  if (!existsSync(dbPath())) return []
  const db = new Database(dbPath(), { readonly: true })
  try {
    return db.query('SELECT * FROM msg ORDER BY id').all()
  } finally {
    db.close()
  }
}

/** Seed the scratch store so a fresh DB + schema exist without running statem
 *  — twr must be observable on a store it did not create. */
function seed(msgs) {
  const proc = Bun.spawnSync(['true'])
  void proc
  for (const m of msgs) {
    const r = Bun.spawnSync(
      [
        'tower', 'send',
        '--from', m.sender,
        ...(m.topic ? ['--topic', m.topic] : []),
        '--kind', m.kind ?? 'finding',
        m.body,
      ],
      { env: { ...process.env, TOWER_HOME: towerHome }, stdout: 'pipe', stderr: 'pipe' },
    )
    if (r.exitCode !== 0) {
      throw new Error(`seed failed: ${r.stderr.toString()}`)
    }
  }
}

/** A .madewell/ project whose basename is unique per test, so an assertion
 *  about the live bus can name this project and never collide with real fleet
 *  traffic. */
function writeMinimalProject({ outerStage = 'commit', cyclePhase = 'imagine' } = {}) {
  const root = join(scratch, `oraclefix${Math.random().toString(36).slice(2, 8)}`)
  const mwDir = join(root, '.madewell')
  mkdirSync(join(mwDir, 'cycles'), { recursive: true })

  writeFileSync(
    join(mwDir, 'madewell.json'),
    JSON.stringify({
      project: 'statem-oracle-fixture',
      profile: null,
      stage: outerStage,
      updated: new Date().toISOString(),
      context: { summary: 'oracle fixture', openThread: 'oracle' },
      discovery: [],
      active: [{ id: 'd001', cycle: '.madewell/cycles/c001.json' }],
      blocked: [],
    }, null, 2),
  )

  writeFileSync(
    join(mwDir, 'cycles', 'c001.json'),
    JSON.stringify({
      id: 'c001',
      parent: 'd001',
      created: new Date().toISOString(),
      phase: cyclePhase,
      imagine: [{ id: 'i001', item: 'oracle item', status: 'pending', dependsOn: [] }],
    }),
  )

  projectRoot = root
  PROJECT = basename(realpathSync(root))
  return root
}

function writeBaseline(outer, cycles = {}) {
  writeFileSync(baseline, JSON.stringify({ outer, cycles }))
}

function run(args) {
  const proc = Bun.spawnSync(args, {
    cwd: STATEM_DIR,
    env: { ...process.env, TOWER_HOME: towerHome },
    stdout: 'pipe',
    stderr: 'pipe',
  })
  const stdout = proc.stdout.toString()
  const stderr = proc.stderr.toString()
  return { stdout, stderr, code: proc.exitCode, combined: `${stdout}\n${stderr}` }
}

const runStatemOnce = () =>
  run(['bun', STATEM, projectRoot, '--once', '--no-tabs', '--baseline', baseline])

const runTwrOnce = () => run(['bun', TWR, projectRoot, '--once'])

const stripAnsi = (t) => t.replace(/\x1b\[[0-9;]*[A-Za-z]/g, '')

/** The transition rows statem is contracted to write for this project. */
const statemRows = () =>
  rows().filter((r) => r.sender === `statem@${PROJECT}` && r.topic === `${PROJECT}/statem`)

// ───────────────────────────────────────────────────────────────────────────
describe('statem → msg table (T1)', () => {
  test('a transition writes one finding row with the contracted sender/topic/kind', () => {
    writeMinimalProject({ outerStage: 'commit' })
    writeBaseline('discovery', { c001: { phase: 'imagine', items: { i001: 'pending' } } })

    const { code, stderr } = runStatemOnce()
    expect(code).toBe(0)
    expect(stderr).not.toContain('TypeError')
    expect(stderr).not.toContain('Cannot find module')

    // The schema is created on demand — statem must not require a pre-made DB.
    expect(existsSync(dbPath())).toBe(true)

    const written = statemRows()
    expect(written.length).toBeGreaterThan(0)
    for (const r of written) {
      expect(r.kind).toBe('finding')
      expect(r.sender).toBe(`statem@${PROJECT}`)
      expect(r.topic).toBe(`${PROJECT}/statem`)
      expect(typeof r.ts).toBe('number')
    }
  })

  test('the OUTER transition body survives the store swap verbatim', () => {
    writeMinimalProject({ outerStage: 'commit' })
    writeBaseline('discovery', { c001: { phase: 'imagine', items: { i001: 'pending' } } })

    expect(runStatemOnce().code).toBe(0)

    // statem.ts's transition table is not being redesigned, so the exact string
    // it produced against board.jsonl must still be the row body.
    const bodies = statemRows().map((r) => r.body)
    expect(bodies).toContain(`${PROJECT} OUTER discovery→commit`)
  })

  test('body is a plain string, not a JSON-stringified board row', () => {
    writeMinimalProject({ outerStage: 'build' })
    writeBaseline('commit', { c001: { phase: 'plan', items: { i001: 'pending' } } })

    expect(runStatemOnce().code).toBe(0)

    const written = statemRows()
    expect(written.length).toBeGreaterThan(0)
    for (const r of written) {
      expect(typeof r.body).toBe('string')
      // The old bus wrapped the transition in an envelope {id,ts,cwd,type,...}.
      // The envelope is now the table's columns; re-encoding it in `body` would
      // be the double-stringify regression this suite has always guarded.
      expect(r.body.trim().startsWith('{')).toBe(false)
      expect(r.body).not.toContain('"topic"')
    }
  })

  test('cold start seeds the baseline and writes no transitions', () => {
    writeMinimalProject({ outerStage: 'commit' })
    // No baseline file on disk => cold start.
    expect(existsSync(baseline)).toBe(false)

    const { code, stdout } = runStatemOnce()
    expect(code).toBe(0)
    expect(stripAnsi(stdout)).toContain('cold start')

    // Cold start must not spam the bus with a full-state diff.
    expect(statemRows().length).toBe(0)
    expect(existsSync(baseline)).toBe(true)
  })

  test('TOWER_HOME isolates the write — nothing lands on the live bus', () => {
    writeMinimalProject({ outerStage: 'land' })
    writeBaseline('build', { c001: { phase: 'verify', items: { i001: 'done' } } })

    expect(runStatemOnce().code).toBe(0)
    expect(statemRows().length).toBeGreaterThan(0)

    // The project basename is randomised per test, so this names rows only this
    // run could have written. A count-before/count-after check would be flaky:
    // five other panes are writing to the live bus while this suite runs.
    if (existsSync(LIVE_DB)) {
      const live = new Database(LIVE_DB, { readonly: true })
      try {
        const hit = live
          .query('SELECT COUNT(*) AS n FROM msg WHERE sender = ? OR topic = ?')
          .get(`statem@${PROJECT}`, `${PROJECT}/statem`)
        expect(hit.n).toBe(0)
      } finally {
        live.close()
      }
    }
  })
})

// ───────────────────────────────────────────────────────────────────────────
describe('twr → msg table (T2)', () => {
  test('renders statem rows under TRANSITIONS and other rows under FINDINGS', () => {
    writeMinimalProject()
    seed([
      { sender: `statem@${PROJECT}`, topic: `${PROJECT}/statem`, body: `${PROJECT} OUTER discovery→commit` },
      { sender: 'orch-oracle', topic: `${PROJECT}/cutover`, body: 'oracle non-statem finding for twr render' },
    ])

    const { code, stderr, combined } = runTwrOnce()
    expect(code).toBe(0)
    expect(stderr).not.toContain('TypeError')

    const hay = stripAnsi(combined)
    expect(hay).toMatch(/TRANSITIONS/i)
    expect(hay).toMatch(/FINDINGS/i)
    expect(hay).toContain('OUTER discovery→commit')
    // The findings line carries its sender and topic, as the old renderer did.
    expect(hay).toContain('orch-oracle')
    expect(hay).toContain(`${PROJECT}/cutover`)
  })

  test('scoping is the topic prefix — another project is not rendered', () => {
    writeMinimalProject()
    seed([
      { sender: `statem@${PROJECT}`, topic: `${PROJECT}/statem`, body: `${PROJECT} OUTER discovery→commit` },
      { sender: 'statem@elsewhere', topic: 'elsewhere/statem', body: 'elsewhere OUTER commit→build' },
      { sender: 'someone', topic: 'unrelated/topic', body: 'ORACLE-LEAK-MARKER unrelated project row' },
    ])

    const { code, combined } = runTwrOnce()
    expect(code).toBe(0)

    const hay = stripAnsi(combined)
    expect(hay).toContain('OUTER discovery→commit')
    expect(hay).not.toContain('ORACLE-LEAK-MARKER')
    expect(hay).not.toContain('elsewhere OUTER commit→build')
  })

  test('twr writes nothing — the row count is identical across a run', () => {
    writeMinimalProject()
    seed([
      { sender: `statem@${PROJECT}`, topic: `${PROJECT}/statem`, body: `${PROJECT} OUTER discovery→commit` },
    ])

    const before = rows()
    expect(before.length).toBe(1)

    expect(runTwrOnce().code).toBe(0)

    const after = rows()
    expect(after.length).toBe(before.length)
    expect(after.map((r) => r.id)).toEqual(before.map((r) => r.id))
  })

  test('the integrity footer reports SQLite integrity, not a JSONL bad-line count', () => {
    writeMinimalProject()
    seed([
      { sender: `statem@${PROJECT}`, topic: `${PROJECT}/statem`, body: `${PROJECT} OUTER discovery→commit` },
    ])

    // The oracle's own answer, straight from the engine.
    const db = new Database(dbPath(), { readonly: true })
    let verdict
    try {
      verdict = db.query('PRAGMA integrity_check').get()
    } finally {
      db.close()
    }
    expect(Object.values(verdict)[0]).toBe('ok')

    const { code, combined } = runTwrOnce()
    expect(code).toBe(0)

    const hay = stripAnsi(combined)
    // The literal prefix survives the store swap; the JSONL vocabulary does not.
    expect(hay).toMatch(/integrity:\s*ok/i)
    expect(hay).not.toMatch(/unparseable/i)
  })

  test('an empty store renders without throwing', () => {
    writeMinimalProject()
    seed([{ sender: 'bootstrap', topic: 'someoneelse/topic', body: 'not this project' }])

    const { code, stderr, combined } = runTwrOnce()
    expect(code).toBe(0)
    expect(stderr).not.toContain('TypeError')
    expect(stripAnsi(combined)).toMatch(/TRANSITIONS/i)
    expect(stripAnsi(combined)).toMatch(/\(none\)/)
  })
})

// ───────────────────────────────────────────────────────────────────────────
// The residual the bifurcated pair exists to protect: statem's writes and twr's
// reads must agree on the convention. Either tool can be internally consistent
// and still fail this.
describe('statem ⇄ twr residual — the two agree on the convention', () => {
  test('a transition statem wrote is a transition twr renders', () => {
    writeMinimalProject({ outerStage: 'commit' })
    writeBaseline('discovery', { c001: { phase: 'imagine', items: { i001: 'pending' } } })

    expect(runStatemOnce().code).toBe(0)
    const written = statemRows()
    expect(written.length).toBeGreaterThan(0)

    const { code, combined } = runTwrOnce()
    expect(code).toBe(0)

    const hay = stripAnsi(combined)
    const transitionsBlock = hay.slice(
      hay.search(/TRANSITIONS/i),
      hay.search(/FINDINGS/i) === -1 ? undefined : hay.search(/FINDINGS/i),
    )
    for (const r of written) {
      expect(transitionsBlock).toContain(r.body)
    }
  })

  test('an inner-phase transition round-trips end to end', () => {
    writeMinimalProject({ outerStage: 'commit', cyclePhase: 'make' })
    writeBaseline('commit', { c001: { phase: 'imagine', items: { i001: 'pending' } } })

    expect(runStatemOnce().code).toBe(0)

    const bodies = statemRows().map((r) => r.body)
    expect(bodies).toContain(`${PROJECT} INNER c001 imagine→make`)

    const { code, combined } = runTwrOnce()
    expect(code).toBe(0)
    expect(stripAnsi(combined)).toContain('INNER c001 imagine→make')
  })
})
