#!/usr/bin/env bun
// Oracle tests for the Tower write gate (d-write-gate).
// Authored from plan/brief only — never from implementation source.
import { describe, expect, test } from 'bun:test'
import { mkdtempSync, rmSync, writeFileSync, existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { SCENT_TTL_DEFAULTS } from '/Users/jrg/agent-core/primitives/hooks/tower-ledger.mjs'

const TOWER_DIR = import.meta.dir
const HOOK = join('hooks', 'write-gate.mjs')
const TOPIC = 'tower/write-gate-oracle'
const IDENTITY = 'probe-agent'

let seq = 0
const nextId = (label) => `t-oracle-${label}-${++seq}`

function makeTempDir() {
  return mkdtempSync(join(tmpdir(), 'wg-oracle-'))
}

function baseEnv(dir) {
  const env = { ...process.env }
  delete env.HERDR_PANE_ID
  delete env.TOWER_FROM
  delete env.TOWER_SESSION_START
  delete env.TOWER_WRITE_GATE
  env.TOWER_PHEROMONES_PATH = join(dir, 'pheromones.jsonl')
  env.TOWER_WRITE_GATE_STATE = join(dir, 'write-gate-state.json')
  env.TOWER_BOARD_PATH = join(dir, 'board.jsonl')
  return env
}

function writeRows(file, rows) {
  writeFileSync(file, rows.map((r) => JSON.stringify(r)).join('\n') + '\n')
}

/** Build one pheromone row in the row shape from the brief facts table. */
function pheromoneRow(scent, dir, fields = {}) {
  return {
    id: fields.id ?? nextId(scent),
    ts: fields.ts,
    cwd: dir,
    topic: fields.topic ?? TOPIC,
    from: fields.from ?? null,
    scent,
    route: { to_role: null, to_pane: null, reply_to: null },
    ref: fields.ref ?? null,
    payload_ref: fields.payload_ref ?? null,
    evidence: fields.evidence ?? 'oracle seed',
    ttl_s: fields.ttl_s ?? SCENT_TTL_DEFAULTS[scent],
  }
}

function makeEvt(dir, overrides = {}) {
  return {
    cwd: dir,
    session_id: overrides.session_id ?? 'sess-default',
    stop_hook_active: overrides.stop_hook_active ?? false,
    transcript_path: overrides.transcript_path ?? join(dir, 'transcript.jsonl'),
  }
}

function runGate(evt, env) {
  const res = Bun.spawnSync(['bun', HOOK], {
    stdin: Buffer.from(JSON.stringify(evt)),
    env,
    cwd: TOWER_DIR,
  })
  return {
    exitCode: res.exitCode,
    stdout: res.stdout ? res.stdout.toString() : '',
    stderr: res.stderr ? res.stderr.toString() : '',
  }
}

function withTempDir(fn) {
  const dir = makeTempDir()
  try {
    fn(dir)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

describe('Tower write gate', () => {
  test('1. outstanding bound claim, no done, no help -> exit 2', () => {
    withTempDir((dir) => {
      const now = Date.now()
      const floor = now - 3600_000
      const claimTs = new Date(now - 1000).toISOString()
      const rows = [
        pheromoneRow('work-claimed', dir, {
          id: nextId('claim'),
          ref: 't-avail-1',
          from: IDENTITY,
          ts: claimTs,
        }),
      ]
      writeRows(join(dir, 'pheromones.jsonl'), rows)
      const env = baseEnv(dir)
      env.TOWER_FROM = IDENTITY
      env.TOWER_SESSION_START = String(floor)
      const result = runGate(makeEvt(dir, { session_id: 'sess-1' }), env)
      expect(result.exitCode).toBe(2)
    })
  })

  test('2. claim released by matching work-done ref -> exit 0', () => {
    withTempDir((dir) => {
      const now = Date.now()
      const floor = now - 3600_000
      const claimTs = new Date(now - 1000).toISOString()
      const doneTs = new Date(now - 500).toISOString()
      const availId = 't-avail-2'
      const rows = [
        pheromoneRow('work-claimed', dir, {
          id: nextId('claim'),
          ref: availId,
          from: IDENTITY,
          ts: claimTs,
        }),
        pheromoneRow('work-done', dir, {
          id: nextId('done'),
          ref: availId,
          ts: doneTs,
          payload_ref: 'artifact.md',
        }),
      ]
      writeRows(join(dir, 'pheromones.jsonl'), rows)
      const env = baseEnv(dir)
      env.TOWER_FROM = IDENTITY
      env.TOWER_SESSION_START = String(floor)
      const result = runGate(makeEvt(dir, { session_id: 'sess-2' }), env)
      expect(result.exitCode).toBe(0)
    })
  })

  test('3. claim released by live need-help from same identity/topic -> exit 0', () => {
    withTempDir((dir) => {
      const now = Date.now()
      const floor = now - 3600_000
      const claimTs = new Date(now - 1000).toISOString()
      const helpTs = new Date(now - 500).toISOString()
      const rows = [
        pheromoneRow('work-claimed', dir, {
          id: nextId('claim'),
          ref: 't-avail-3',
          from: IDENTITY,
          ts: claimTs,
        }),
        pheromoneRow('need-help', dir, {
          id: nextId('help'),
          from: IDENTITY,
          ts: helpTs,
        }),
      ]
      writeRows(join(dir, 'pheromones.jsonl'), rows)
      const env = baseEnv(dir)
      env.TOWER_FROM = IDENTITY
      env.TOWER_SESSION_START = String(floor)
      const result = runGate(makeEvt(dir, { session_id: 'sess-3' }), env)
      expect(result.exitCode).toBe(0)
    })
  })

  test('4. identity unbound (no TOWER_FROM, no HERDR_PANE_ID) -> exit 0 despite outstanding claim', () => {
    withTempDir((dir) => {
      const now = Date.now()
      const claimTs = new Date(now - 1000).toISOString()
      const rows = [
        pheromoneRow('work-claimed', dir, {
          id: nextId('claim'),
          ref: 't-avail-4',
          from: IDENTITY,
          ts: claimTs,
        }),
      ]
      writeRows(join(dir, 'pheromones.jsonl'), rows)
      const env = baseEnv(dir)
      const result = runGate(makeEvt(dir, { session_id: 'sess-4' }), env)
      expect(result.exitCode).toBe(0)
    })
  })

  test('5. stop_hook_active true -> exit 0 despite outstanding claim', () => {
    withTempDir((dir) => {
      const now = Date.now()
      const floor = now - 3600_000
      const claimTs = new Date(now - 1000).toISOString()
      const rows = [
        pheromoneRow('work-claimed', dir, {
          id: nextId('claim'),
          ref: 't-avail-5',
          from: IDENTITY,
          ts: claimTs,
        }),
      ]
      writeRows(join(dir, 'pheromones.jsonl'), rows)
      const env = baseEnv(dir)
      env.TOWER_FROM = IDENTITY
      env.TOWER_SESSION_START = String(floor)
      const result = runGate(
        makeEvt(dir, { session_id: 'sess-5', stop_hook_active: true }),
        env
      )
      expect(result.exitCode).toBe(0)
    })
  })

  test('6. TOWER_WRITE_GATE=off -> exit 0 despite outstanding claim', () => {
    withTempDir((dir) => {
      const now = Date.now()
      const floor = now - 3600_000
      const claimTs = new Date(now - 1000).toISOString()
      const rows = [
        pheromoneRow('work-claimed', dir, {
          id: nextId('claim'),
          ref: 't-avail-6',
          from: IDENTITY,
          ts: claimTs,
        }),
      ]
      writeRows(join(dir, 'pheromones.jsonl'), rows)
      const env = baseEnv(dir)
      env.TOWER_FROM = IDENTITY
      env.TOWER_SESSION_START = String(floor)
      env.TOWER_WRITE_GATE = 'off'
      const result = runGate(makeEvt(dir, { session_id: 'sess-6' }), env)
      expect(result.exitCode).toBe(0)
    })
  })

  test('7. claim ts older than TOWER_SESSION_START -> exit 0 (time floor)', () => {
    withTempDir((dir) => {
      const now = Date.now()
      const floor = now
      const claimTs = new Date(now - 120_000).toISOString()
      const rows = [
        pheromoneRow('work-claimed', dir, {
          id: nextId('claim'),
          ref: 't-avail-7',
          from: IDENTITY,
          ts: claimTs,
        }),
      ]
      writeRows(join(dir, 'pheromones.jsonl'), rows)
      const env = baseEnv(dir)
      env.TOWER_FROM = IDENTITY
      env.TOWER_SESSION_START = String(floor)
      const result = runGate(makeEvt(dir, { session_id: 'sess-7' }), env)
      expect(result.exitCode).toBe(0)
    })
  })

  test('8. claim from a different identity -> exit 0', () => {
    withTempDir((dir) => {
      const now = Date.now()
      const floor = now - 3600_000
      const claimTs = new Date(now - 1000).toISOString()
      const rows = [
        pheromoneRow('work-claimed', dir, {
          id: nextId('claim'),
          ref: 't-avail-8',
          from: 'other-agent',
          ts: claimTs,
        }),
      ]
      writeRows(join(dir, 'pheromones.jsonl'), rows)
      const env = baseEnv(dir)
      env.TOWER_FROM = IDENTITY
      env.TOWER_SESSION_START = String(floor)
      const result = runGate(makeEvt(dir, { session_id: 'sess-8' }), env)
      expect(result.exitCode).toBe(0)
    })
  })

  test('9. refusal loop: 1-3 exit 2, 4th bypasses with one board note, 5th no duplicate', () => {
    withTempDir((dir) => {
      const now = Date.now()
      const floor = now - 3600_000
      const claimTs = new Date(now - 1000).toISOString()
      const ref = 't-avail-9'
      const rows = [
        pheromoneRow('work-claimed', dir, {
          id: nextId('claim'),
          ref,
          from: IDENTITY,
          ts: claimTs,
        }),
      ]
      writeRows(join(dir, 'pheromones.jsonl'), rows)
      const env = baseEnv(dir)
      env.TOWER_FROM = IDENTITY
      env.TOWER_SESSION_START = String(floor)
      const evt = makeEvt(dir, { session_id: 'sess-9' })

      const results = [1, 2, 3, 4, 5].map(() => runGate(evt, env))

      expect(results[0].exitCode).toBe(2)
      expect(results[1].exitCode).toBe(2)
      expect(results[2].exitCode).toBe(2)
      expect(results[3].exitCode).toBe(0)
      expect(results[4].exitCode).toBe(0)

      const boardPath = env.TOWER_BOARD_PATH
      expect(existsSync(boardPath)).toBe(true)
      const boardLines = readFileSync(boardPath, 'utf8').split('\n').filter(Boolean)
      const bypassLines = boardLines
        .map((line) => JSON.parse(line))
        .filter((row) => typeof row.body === 'string' && row.body.includes('bypass:'))
      expect(bypassLines.length).toBe(1)
      expect(bypassLines[0].body).toContain(IDENTITY)
      expect(bypassLines[0].body).toContain(ref)
      expect(bypassLines[0].body).toContain('sess-9')
    })
  })

  test('10. refusal stderr names topic, ref id, and the emit work-done command', () => {
    withTempDir((dir) => {
      const now = Date.now()
      const floor = now - 3600_000
      const claimTs = new Date(now - 1000).toISOString()
      const ref = 't-avail-10'
      const rows = [
        pheromoneRow('work-claimed', dir, {
          id: nextId('claim'),
          ref,
          from: IDENTITY,
          ts: claimTs,
          topic: TOPIC,
        }),
      ]
      writeRows(join(dir, 'pheromones.jsonl'), rows)
      const env = baseEnv(dir)
      env.TOWER_FROM = IDENTITY
      env.TOWER_SESSION_START = String(floor)
      const result = runGate(makeEvt(dir, { session_id: 'sess-10' }), env)
      expect(result.exitCode).toBe(2)
      expect(result.stderr).toContain(TOPIC)
      expect(result.stderr).toContain(ref)
      expect(result.stderr).toContain('cli.mjs emit work-done')
    })
  })

  test('11. claim TTL-expired but inside time floor -> still exit 2 (TTL ignored)', () => {
    withTempDir((dir) => {
      const now = Date.now()
      const floor = now - 3600_000
      const claimTs = new Date(now - 60_000).toISOString()
      const rows = [
        pheromoneRow('work-claimed', dir, {
          id: nextId('claim'),
          ref: 't-avail-11',
          from: IDENTITY,
          ts: claimTs,
          ttl_s: 30,
        }),
      ]
      writeRows(join(dir, 'pheromones.jsonl'), rows)
      const env = baseEnv(dir)
      env.TOWER_FROM = IDENTITY
      env.TOWER_SESSION_START = String(floor)
      const result = runGate(makeEvt(dir, { session_id: 'sess-11' }), env)
      expect(result.exitCode).toBe(2)
    })
  })

  test('12. work-done refing the claim row id (not the available id) does not release -> exit 2', () => {
    withTempDir((dir) => {
      const now = Date.now()
      const floor = now - 3600_000
      const claimTs = new Date(now - 1000).toISOString()
      const doneTs = new Date(now - 500).toISOString()
      const claimRowId = nextId('claim')
      const availId = 't-avail-12'
      const rows = [
        pheromoneRow('work-claimed', dir, {
          id: claimRowId,
          ref: availId,
          from: IDENTITY,
          ts: claimTs,
        }),
        pheromoneRow('work-done', dir, {
          id: nextId('done'),
          ref: claimRowId,
          ts: doneTs,
        }),
      ]
      writeRows(join(dir, 'pheromones.jsonl'), rows)
      const env = baseEnv(dir)
      env.TOWER_FROM = IDENTITY
      env.TOWER_SESSION_START = String(floor)
      const result = runGate(makeEvt(dir, { session_id: 'sess-12' }), env)
      expect(result.exitCode).toBe(2)
    })
  })
})
