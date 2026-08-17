#!/usr/bin/env bun
// Oracle tests for node identity — the in-flight predicate.
//
// The defect these pin: fleet mail was scoped by normalised cwd alone, so an
// unstamped engine standing in a directory inherited that directory's mail.
// The predicate under test answers "is this engine a fleet node?" from the
// identity carriers that already exist, and defaults to NO.
import { describe, expect, test } from 'bun:test'
import { resolveIdentity, isFleetMember, _test } from './node-identity.mjs'

// A pane fetcher stub: returns whatever pane shape the test declares.
const paneFetcher = (pane) => () => pane

// Shapes captured live from `herdr pane get` on 2026-08-16.
const OBSERVER_PANE = {
  pane_id: 'w3X:p1',
  label: null,
  display_agent: null,
  name: null,
  cwd: '/Users/jrg/tup',
  tokens: { task: 'run echo', verdict: 'some text' },
}

const FLEET_PANE = {
  pane_id: 'w3R:p1W',
  label: 'AGNT courier',
  display_agent: 'AGNT courier',
  name: 'agnt-courier',
  cwd: '/Users/jrg/.spine/worktrees/agent-core/courier',
  tokens: { name: 'courier', parent: 'w3R:p1Q', project: 'agent-core', role: '3-AGNT' },
}

describe('resolveIdentity', () => {
  test('an unstamped pane is not a node, even while it is working', () => {
    const id = resolveIdentity({ HERDR_PANE_ID: 'w3X:p1' }, paneFetcher(OBSERVER_PANE))
    expect(id.stamped).toBe(false)
    expect(id.role).toBeNull()
    expect(id.nodeId).toBeNull()
    expect(id.source).toBe('herdr-unstamped')
    expect(isFleetMember(id)).toBe(false)
  })

  test('a task token alone never confers membership', () => {
    // Every working pane carries a task token. Membership requires a ROLE.
    const pane = { ...OBSERVER_PANE, tokens: { task: 'run something long' } }
    expect(resolveIdentity({ HERDR_PANE_ID: 'w3X:p1' }, paneFetcher(pane)).stamped).toBe(false)
  })

  test('a stamped pane is a node and carries its role, project and parent', () => {
    const id = resolveIdentity({ HERDR_PANE_ID: 'w3R:p1W' }, paneFetcher(FLEET_PANE))
    expect(id.stamped).toBe(true)
    expect(id.role).toBe('3-AGNT')
    expect(id.project).toBe('agent-core')
    expect(id.parent).toBe('w3R:p1Q')
    expect(id.nodeId).toBe('courier')
    expect(id.source).toBe('herdr-tokens')
    expect(isFleetMember(id)).toBe(true)
  })

  test('a label-stamped pane counts even without structured tokens', () => {
    // Panes stamped by different doors carry different subsets.
    const pane = { pane_id: 'w1:p2', label: 'CORD tup', tokens: {} }
    const id = resolveIdentity({ HERDR_PANE_ID: 'w1:p2' }, paneFetcher(pane))
    expect(id.stamped).toBe(true)
    expect(id.role).toBe('CORD tup')
  })

  test('the concierge is a node — rank 0 is stamped by label only', () => {
    // Regression: the concierge carries no role token, but it is the node
    // operator-addressed mail is FOR. Excluding it silences the relay path.
    const pane = { pane_id: 'w3R:p1', label: 'CONCIERGE', tokens: { task: 'run something' } }
    const id = resolveIdentity({ HERDR_PANE_ID: 'w3R:p1' }, paneFetcher(pane))
    expect(id.stamped).toBe(true)
    expect(isFleetMember(id)).toBe(true)
  })

  test('no pane id at all is not a node', () => {
    const id = resolveIdentity({}, paneFetcher(FLEET_PANE))
    expect(id.stamped).toBe(false)
    expect(id.source).toBe('no-pane')
  })

  test('an unreachable runtime resolves to not-a-node, and never throws', () => {
    // No runtime means no fleet, so there is no fleet mail to carry.
    const id = resolveIdentity({ HERDR_PANE_ID: 'w9:p9' }, () => null)
    expect(id.stamped).toBe(false)
    expect(id.source).toBe('runtime-unreachable')
    expect(isFleetMember(id)).toBe(false)
  })

  test('the seat stamp wins without any lookup', () => {
    const threw = () => {
      throw new Error('fetcher must not be called when the seat stamp is present')
    }
    const id = resolveIdentity(
      {
        TUP_NODE_ID: 'n-abc123',
        TUP_NODE_ROLE: '2-ORCH',
        TUP_NODE_PROJECT: 'tup',
        HERDR_PANE_ID: 'w3X:p1',
      },
      threw
    )
    expect(id.stamped).toBe(true)
    expect(id.nodeId).toBe('n-abc123')
    expect(id.role).toBe('2-ORCH')
    expect(id.project).toBe('tup')
    expect(id.source).toBe('seat-stamp')
  })

  test('the gate can be turned off, and says so', () => {
    const id = resolveIdentity({ TOWER_IDENTITY_GATE: 'off' }, paneFetcher(OBSERVER_PANE))
    expect(id.stamped).toBe(true)
    expect(id.source).toBe('gate-off')
    expect(isFleetMember(id)).toBe(true)
  })

  test('fetch failure is contained — a hook must never crash a session', () => {
    const boom = () => {
      throw new Error('herdr socket closed')
    }
    // fetchPane swallows; resolveIdentity is handed the already-safe result.
    expect(() => resolveIdentity({ HERDR_PANE_ID: 'w1:p1' }, () => boom())).toThrow()
    // ...which is why the real default fetcher is the one that catches:
    const id = resolveIdentity({ HERDR_PANE_ID: 'w1:p1' }, () => {
      try {
        return boom()
      } catch {
        return null
      }
    })
    expect(id.stamped).toBe(false)
  })
})

describe('role prefix vocabulary', () => {
  test('every control-flow prefix is recognised', () => {
    for (const p of _test.ROLE_PREFIXES) {
      expect(_test.looksLikeRole(`${p} something`)).toBe(true)
    }
  })

  test('an ordinary terminal title is not a role', () => {
    expect(_test.looksLikeRole('Dangerously skip permissions')).toBe(false)
    expect(_test.looksLikeRole(null)).toBe(false)
    expect(_test.looksLikeRole('')).toBe(false)
  })
})
