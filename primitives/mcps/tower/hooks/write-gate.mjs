#!/usr/bin/env bun
// Tower write gate — Stop-event hook that refuses a stop while pheromone
// `work-claimed` rows remain outstanding for this identity/cwd, with an
// audited 3-refusal bypass so a stuck gate can never permanently trap a
// session.
//
// Loop protection: stop_hook_active=true means we already blocked once this
// stop cycle — allow the stop so a malfunction can never trap the agent.
// Kill switch: TOWER_WRITE_GATE=off always allows.
// Any internal error during evaluation allows too — a gate that bricks the
// machine is a failed gate.

import { existsSync, readFileSync, writeFileSync, statSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { homedir } from 'node:os'
import { join, dirname } from 'node:path'
import { PHEROMONES, BOARD, normCwd, append, parseJsonl, id } from '../lib.mjs'

if (process.env.TOWER_WRITE_GATE === 'off') process.exit(0)

let input = ''
for await (const chunk of process.stdin) input += chunk
let evt = {}
try {
  evt = JSON.parse(input)
} catch {
  process.exit(0)
}

if (evt.stop_hook_active) process.exit(0)

try {
  // Identity resolution (R3): $TOWER_FROM first, else herdr lookup. Any
  // failure leaves identity unbound.
  let identity = String(process.env.TOWER_FROM ?? '').trim()
  if (!identity && process.env.HERDR_PANE_ID) {
    try {
      const out = execFileSync('herdr', ['agent', 'get', process.env.HERDR_PANE_ID], {
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: 5000,
      })
      const parsed = JSON.parse(out)
      identity = String(parsed?.result?.agent?.name ?? '').trim()
    } catch {
      identity = ''
    }
  }
  if (!identity) process.exit(0)

  // Time floor (R3): numeric $TOWER_SESSION_START, else transcript birthtime
  // (mtime fallback), else indeterminable.
  let floor = null
  const rawStart = process.env.TOWER_SESSION_START
  if (rawStart != null && rawStart !== '' && Number.isFinite(Number(rawStart))) {
    floor = Number(rawStart)
  } else if (evt.transcript_path && existsSync(evt.transcript_path)) {
    const st = statSync(evt.transcript_path)
    floor = st.birthtimeMs > 0 ? st.birthtimeMs : st.mtimeMs
  }
  if (floor == null) process.exit(0)

  // Rows scoped to this cwd, parsed tolerantly (bad lines skipped).
  const cwd = evt.cwd ?? process.cwd()
  const scope = normCwd(cwd)
  const text = existsSync(PHEROMONES) ? readFileSync(PHEROMONES, 'utf-8') : ''
  const { rows } = parseJsonl(text)
  const scoped = rows.filter((r) => normCwd(r?.cwd ?? '') === scope)

  // Outstanding claims (R2): scent work-claimed, from === identity, ref
  // non-null, ts >= floor. TTL ignored. Dedupe by ref (last write wins —
  // rows are append-ordered).
  const claimsByRef = new Map()
  for (const r of scoped) {
    if (r?.scent !== 'work-claimed') continue
    if (r?.from !== identity) continue
    if (r?.ref == null) continue
    const ts = Date.parse(r?.ts)
    if (!Number.isFinite(ts) || ts < floor) continue
    claimsByRef.set(r.ref, r)
  }

  if (claimsByRef.size === 0) process.exit(0)

  // Release conditions (R1): matching work-done ref (TTL ignored), or a
  // live need-help from the same identity on the claim's topic.
  const doneRefs = new Set(
    scoped.filter((r) => r?.scent === 'work-done' && r?.ref != null).map((r) => r.ref)
  )
  const now = Date.now()
  const needHelpLive = (topic) =>
    scoped.some((r) => {
      if (r?.scent !== 'need-help') return false
      if (r?.from !== identity) return false
      if (r?.topic !== topic) return false
      const ts = Date.parse(r?.ts)
      if (!Number.isFinite(ts)) return false
      const ttl = (r?.ttl_s ?? 3600) * 1000
      return now < ts + ttl
    })

  const unreleased = []
  for (const claim of claimsByRef.values()) {
    if (doneRefs.has(claim.ref)) continue
    if (needHelpLive(claim.topic)) continue
    unreleased.push(claim)
  }

  if (unreleased.length === 0) process.exit(0)

  // Refusal counting + audited bypass (R4).
  const sessionId = evt.session_id ?? 'unknown'
  const statePath =
    process.env.TOWER_WRITE_GATE_STATE || join(homedir(), '.tower', 'write-gate-state.json')
  let state = {}
  if (existsSync(statePath)) {
    try {
      state = JSON.parse(readFileSync(statePath, 'utf-8'))
    } catch {
      state = {}
    }
  }

  const keyFor = (ref) => `${sessionId}:${ref}`
  const allAtLimit = unreleased.every((c) => (state[keyFor(c.ref)]?.count ?? 0) >= 3)

  if (allAtLimit) {
    const boardPath = process.env.TOWER_BOARD_PATH || BOARD
    for (const claim of unreleased) {
      const key = keyFor(claim.ref)
      const entry = state[key] ?? { count: 0, bypassed: false }
      if (entry.bypassed) continue
      append(boardPath, {
        id: id(),
        ts: new Date().toISOString(),
        cwd,
        type: 'note',
        from: 'write-gate',
        topic: 'tower/write-gate',
        body: `bypass: agent=${identity} ref=${claim.ref} session=${sessionId} after 3 refusals`,
      })
      entry.bypassed = true
      state[key] = entry
    }
    mkdirSync(dirname(statePath), { recursive: true })
    writeFileSync(statePath, JSON.stringify(state))
    process.exit(0)
  }

  const lines = []
  for (const claim of unreleased) {
    const key = keyFor(claim.ref)
    const entry = state[key] ?? { count: 0, bypassed: false }
    entry.count += 1
    state[key] = entry
    const payloadRef = claim.payload_ref ?? '<artifact-path>'
    lines.push(
      `outstanding claim ref=${claim.ref} topic=${claim.topic}: run ` +
        `\`bun ~/.tower/cli.mjs emit work-done ${claim.topic} ${payloadRef} --ref ${claim.ref} --evidence "released by write-gate"\` to release it.`
    )
  }
  mkdirSync(dirname(statePath), { recursive: true })
  writeFileSync(statePath, JSON.stringify(state))
  process.stderr.write(`[Tower write-gate] ${lines.join('\n')}\n`)
  process.exit(2)
} catch {
  process.exit(0)
}
