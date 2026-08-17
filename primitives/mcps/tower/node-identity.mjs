// Node identity — who is this engine, and is it in flight?
//
// THE PROBLEM THIS SOLVES
//
// Tower's ledger plane scopes mail by normalised cwd (tower-ledger.mjs
// `inboxStateFromFull`). A working directory is a LOCATION, not an IDENTITY:
// many engines share one, and one engine changes its own. The consequence,
// observed 2026-08-16: an operator's desk session sitting in ~/tup inherited
// a coordinator's 19-hour-old docket and was blocked at every Stop, because
// the coordinator had posted from the same directory. Mail addressed to a
// place is delivered to whoever stands there.
//
// The identity that should have answered already exists. Every fleet node is
// stamped at the spawn door and carried by herdr: pane label, display agent,
// registration name, and the `role` / `name` / `parent` / `project` tokens.
// A pane carrying none of those is, provably, not a fleet node.
//
// THE CHEAP CORRECT PREDICATE
//
// The absence of identity is itself a reliable signal. Full addressing
// (from_node / to_node on every ledger row) is a schema migration; this
// module is the part that needs no migration at all — an engine that cannot
// name itself is not a fleet member, and fleet machinery must leave it alone.
//
// RESOLUTION ORDER
//   1. TUP_NODE_ID     — the seat stamp, exported into the engine at birth.
//                        Zero cost, no lookup. Preferred once spawn doors
//                        export it; absent on every pane seated before that.
//   2. HERDR_PANE_ID   — ask the runtime that owns the seat (~33ms).
//   3. unstamped       — no identity, therefore not a node.

import { execFileSync } from 'node:child_process'

// Role prefixes are the pane-label vocabulary; tokens.role is the structured
// form ("2-ORCH", "3-AGNT"). Either proves membership — belt and braces,
// because panes stamped by different doors carry different subsets.
// CONCIERGE is rank 0 and carries no role token today — it is stamped by
// label only. It is nonetheless the node operator-addressed mail is FOR, so
// omitting it would silence the one relay path that must never go quiet.
const ROLE_PREFIXES = ['CONCIERGE', 'CORD', 'ORCH', 'AGNT', 'SAGT', 'CTRL', 'TOWR']

const looksLikeRole = (s) =>
  typeof s === 'string' && ROLE_PREFIXES.some((p) => s.toUpperCase().startsWith(p))

// Live pane fetch, injectable for tests. Returns the pane object or null.
// Never throws: an unreachable runtime is an answer ("cannot confirm"), not
// a crash inside a hook that must not break the session.
export function fetchPane(paneId, exec = execFileSync) {
  if (!paneId) return null
  try {
    const out = exec('herdr', ['pane', 'get', paneId], {
      encoding: 'utf8',
      timeout: 2000,
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    const parsed = JSON.parse(out)
    return parsed?.result?.pane ?? null
  } catch {
    return null
  }
}

/**
 * Resolve this engine's identity.
 *
 * @returns {{
 *   nodeId: string|null, paneId: string|null, role: string|null,
 *   name: string|null, project: string|null, parent: string|null,
 *   stamped: boolean, source: string
 * }}
 */
export function resolveIdentity(env = process.env, fetch = fetchPane) {
  const base = {
    nodeId: null,
    paneId: env.HERDR_PANE_ID ?? null,
    role: null,
    name: null,
    project: null,
    parent: null,
    stamped: false,
    source: 'unstamped',
  }

  // Escape hatch, named for what it enforces rather than for any vendor.
  // `off` restores pre-gate behaviour: every engine is treated as a node.
  if (env.TOWER_IDENTITY_GATE === 'off') {
    return { ...base, stamped: true, source: 'gate-off' }
  }

  // 1. The seat stamp — authoritative, free.
  if (env.TUP_NODE_ID) {
    return {
      ...base,
      nodeId: env.TUP_NODE_ID,
      role: env.TUP_NODE_ROLE ?? null,
      name: env.TUP_NODE_NAME ?? null,
      project: env.TUP_NODE_PROJECT ?? null,
      parent: env.TUP_NODE_PARENT ?? null,
      stamped: true,
      source: 'seat-stamp',
    }
  }

  // 2. Ask the runtime that owns the seat.
  if (!base.paneId) return { ...base, source: 'no-pane' }

  const pane = fetch(base.paneId)
  if (!pane) return { ...base, source: 'runtime-unreachable' }

  const tokens = pane.tokens ?? {}
  const role = tokens.role ?? null
  const name = tokens.name ?? pane.name ?? null
  const label = pane.label ?? pane.display_agent ?? null

  // Membership requires a ROLE, not merely a name. A pane may carry a task
  // token (every working pane does) without being anyone's agent.
  const stamped = Boolean(role) || looksLikeRole(label) || looksLikeRole(name)

  return {
    nodeId: stamped ? (tokens.name ?? pane.name ?? base.paneId) : null,
    paneId: base.paneId,
    role: role ?? (looksLikeRole(label) ? label : null),
    name,
    project: tokens.project ?? null,
    parent: tokens.parent ?? null,
    stamped,
    source: stamped ? 'herdr-tokens' : 'herdr-unstamped',
  }
}

/**
 * Is this engine a fleet node, and therefore an addressee of fleet mail?
 *
 * An unstamped engine is an observer: the operator's own desk, a one-off
 * session, anything not seated through a spawn door. Fleet machinery must
 * no-op for it. An unreachable runtime resolves the same way — no runtime
 * means no fleet, so there is no fleet mail to carry.
 */
export function isFleetMember(identity = resolveIdentity()) {
  return identity.stamped === true
}

export const _test = { looksLikeRole, ROLE_PREFIXES }
