#!/usr/bin/env bun
// Oracle tests for tower work-done ref alignment (R1: work-done.ref binds to
// the work-available id, never to the work-claimed id).
// Authored from plan/brief only — never from implementation source.
import { describe, expect, test } from 'bun:test'
import { pheromoneFieldFromRows } from './lib.mjs'

const CWD = '/tmp'
const TOPIC = 'tower/ref-align-oracle'

describe('pheromoneFieldFromRows — work-done ref binds to the work-available id', () => {
  test('a work-done row ref-ing the work-available id lands the item in done', () => {
    const available = {
      id: 'wa-A',
      ts: '2026-01-01T00:00:00.000Z',
      cwd: CWD,
      topic: TOPIC,
      from: 'agent-a',
      scent: 'work-available',
      ref: null,
      payload_ref: 'brief/a.md',
      ttl_s: 1800,
    }
    const done = {
      id: 'wd-A',
      ts: '2026-01-01T00:00:01.000Z',
      cwd: CWD,
      topic: TOPIC,
      from: 'agent-a',
      scent: 'work-done',
      ref: 'wa-A', // the work-available id
      payload_ref: 'brief/a.md',
      ttl_s: 86400,
    }

    const field = pheromoneFieldFromRows(CWD, [available, done], {
      topic: TOPIC,
      now: Date.parse('2026-01-01T00:00:02.000Z'),
    })

    expect(field.done.map((r) => r.id)).toEqual(['wa-A'])
    expect(field.claimed).toEqual([])
    expect(field.open).toEqual([])
  })

  test('a work-done row ref-ing the work-claimed id does NOT land the item in done', () => {
    const available = {
      id: 'wa-B',
      ts: '2026-01-01T00:00:00.000Z',
      cwd: CWD,
      topic: TOPIC,
      from: 'agent-b',
      scent: 'work-available',
      ref: null,
      payload_ref: 'brief/b.md',
      ttl_s: 1800,
    }
    const claimed = {
      id: 'wc-B',
      ts: '2026-01-01T00:00:05.000Z',
      cwd: CWD,
      topic: TOPIC,
      from: 'agent-b',
      scent: 'work-claimed',
      ref: 'wa-B', // correctly refs the work-available id
      payload_ref: null,
      ttl_s: 30,
    }
    const done = {
      id: 'wd-B',
      ts: '2026-01-01T00:00:06.000Z',
      cwd: CWD,
      topic: TOPIC,
      from: 'agent-b',
      scent: 'work-done',
      ref: 'wc-B', // WRONG direction: refs the claim's own id, not the available id
      payload_ref: 'brief/b.md',
      ttl_s: 86400,
    }

    // now falls inside the claim's 30s TTL so the claim is live and the
    // work-available row lands in `claimed`, not `open` or `done`.
    const field = pheromoneFieldFromRows(CWD, [available, claimed, done], {
      topic: TOPIC,
      now: Date.parse('2026-01-01T00:00:10.000Z'),
    })

    expect(field.claimed.map((r) => r.id)).toEqual(['wa-B'])
    expect(field.done).toEqual([])
    expect(field.open).toEqual([])
  })
})
