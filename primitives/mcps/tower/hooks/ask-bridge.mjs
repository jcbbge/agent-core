#!/usr/bin/env bun
// ask-bridge — Claude Code hook that puts REAL question text into the pane's
// $q token for claude's native blocking paths (AskUserQuestion /
// PermissionRequest) and for mcp__tower__ask_user, then sweeps $q away once
// the answer lands in the ledger.
//
// WHY THIS EXISTS
// The tower bridge (bin/handlers/40-tower-bridge) converts any blocked pane
// into a ledger question, reading $q first and falling back to $task. Today
// nothing sets $q for claude's native blocking moments, so those questions
// carry the request text, not the question. For MCP ask_user it is worse:
// no $q at all, and nothing clears it when the user answers. This hook
// closes both gaps. The bridge stays harness-agnostic; this file is the
// claude-side writer of the token the bridge reads.
//
// MODES (one file, argv[2]; registered in settings.json by the coordinator):
//   pre    PreToolUse, matcher AskUserQuestion|PermissionRequest.
//          AskUserQuestion: $q = first question's text.
//          PermissionRequest: $q = "permission: <tool> <brief target>".
//   post   PostToolUse, matcher mcp__tower__ask_user.
//          $q = tool_input.question; parse the question id out of the tool
//          response ("Question <id> is open"); record
//          pane -> {question_id, q_text, ts, cwd} in
//          ~/.tower/ask-bridge-state.json (tmp+rename writes).
//   sweep  Stop. For every mapped id now ANSWERED in the ledger (scoped by
//          the question's cwd, lib.mjs derivations), clear $q on the mapped
//          pane and drop the mapping. Mappings whose pane no longer exists
//          are dropped too (pane-closed cleanup).
//   clear  SessionEnd. Clear this pane's $q; drop its mapping if present.
//
// DISCIPLINE (mirrors ~/.claude/hooks/herdr-task-report.sh):
// stdin is consumed fully BEFORE any guard exit so we never block the
// writer; ALWAYS exit 0; herdr calls are HERDR_*-gated; payloads carrying
// agent_id are subagent traffic and never write tokens; nothing writes to
// stdout (stderr only — stdout is the protocol channel in some hook
// events); never throw into the harness.
// $q is <=200 chars, TTL 1h (docs/spine-tokens.md). Tokens read back via
// `herdr pane list` — `pane get` does not return tokens.

import { readFileSync, writeFileSync, renameSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'
import { pathToFileURL } from 'node:url'

const MODE = process.argv[2] ?? ''
const STATE_FILE = join(homedir(), '.tower', 'ask-bridge-state.json')
const Q_TTL_MS = 3600000
const Q_MAX = 200
const AGE_OUT_MS = 24 * 3600 * 1000
const SOURCE = 'custom:spine'

const log = (msg) => {
  try {
    process.stderr.write(`ask-bridge[${MODE}]: ${msg}\n`)
  } catch {
    /* never throw */
  }
}

// ── stdin: consume fully before any guard exit ──────────────────────────────
async function readStdin() {
  try {
    if (process.stdin.isTTY) return ''
    let buf = ''
    for await (const chunk of process.stdin) buf += chunk
    return buf
  } catch {
    return ''
  }
}

// ── guards: only act inside a live herdr pane ───────────────────────────────
function herdrOk() {
  if (process.env.HERDR_ENV !== '1') return false
  if (!process.env.HERDR_PANE_ID || !process.env.HERDR_SOCKET_PATH) return false
  try {
    return !!Bun.which('herdr')
  } catch {
    return false
  }
}

// ── $q token writes (socket-level; any pane targetable, no focus needed) ────
function setQ(pane, text) {
  try {
    Bun.spawnSync(
      ['herdr', 'pane', 'report-metadata', pane, '--source', SOURCE, '--token', `q=${text}`, '--ttl-ms', String(Q_TTL_MS)],
      { stdout: 'ignore', stderr: 'ignore' }
    )
  } catch (e) {
    log(`setQ failed: ${e?.message ?? e}`)
  }
}
function clearQ(pane) {
  try {
    Bun.spawnSync(['herdr', 'pane', 'report-metadata', pane, '--source', SOURCE, '--clear-token', 'q'], {
      stdout: 'ignore',
      stderr: 'ignore',
    })
  } catch (e) {
    log(`clearQ failed: ${e?.message ?? e}`)
  }
}

// ── text hygiene: control chars out, whitespace collapsed, <=200 at a word edge ──
function shorten(s, max = Q_MAX) {
  const t = String(s ?? '')
    .replace(/[\x00-\x1f\x7f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (t.length <= max) return t
  const cut = t.slice(0, max - 4)
  const sp = cut.lastIndexOf(' ')
  return (sp > cut.length * 0.6 ? cut.slice(0, sp) : cut) + ' ...'
}

// ── state file: pane_id -> {question_id, q_text, ts, cwd} ───────────────────
// tmp+rename writes; missing/corrupt tolerated as {}; >24h entries age out
// on read (the $q token itself has a 1h TTL, so aged entries need no clear).
function loadState() {
  try {
    const obj = JSON.parse(readFileSync(STATE_FILE, 'utf8'))
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return {}
    const now = Date.now()
    const out = {}
    for (const [k, v] of Object.entries(obj)) {
      if (!v || typeof v !== 'object' || typeof v.question_id !== 'string') continue
      const ts = Date.parse(v.ts ?? '')
      if (Number.isNaN(ts) || now - ts > AGE_OUT_MS) continue
      out[k] = v
    }
    return out
  } catch {
    return {}
  }
}
function saveState(state) {
  try {
    const tmp = `${STATE_FILE}.tmp-${process.pid}`
    writeFileSync(tmp, JSON.stringify(state, null, 1) + '\n')
    renameSync(tmp, STATE_FILE)
  } catch (e) {
    log(`saveState failed: ${e?.message ?? e}`)
  }
}

// lib.mjs is a system file (~/.tower/lib.mjs) — the same derivations the
// stop-guard and cli.mjs read. Imported by absolute path so this hook runs
// identically from the repo (cc-hooks/) and installed (~/.tower/hooks/).
let lib = null
try {
  lib = await import(pathToFileURL(join(homedir(), '.tower', 'lib.mjs')).href)
} catch (e) {
  log(`lib.mjs import failed: ${e?.message ?? e}`)
}

// answered question ids per cwd scope (cached — one ledger read per scope)
const answeredRefs = (() => {
  const cache = new Map()
  return (cwd) => {
    const key = lib ? lib.normCwd(cwd || '.') : cwd || '.'
    if (!cache.has(key)) {
      let refs = new Set()
      if (lib) {
        try {
          refs = new Set(lib.inboxState(key).answers.map((a) => a.ref))
        } catch (e) {
          log(`inboxState failed: ${e?.message ?? e}`)
        }
      }
      cache.set(key, refs)
    }
    return cache.get(key)
  }
})()

// null = pane list unavailable — callers must NOT pane-prune on null
function livePaneIds() {
  try {
    const r = Bun.spawnSync(['herdr', 'pane', 'list'], { stdout: 'pipe', stderr: 'ignore' })
    const obj = JSON.parse(r.stdout?.toString?.() ?? '')
    const panes = obj?.result?.panes
    if (!Array.isArray(panes)) return null
    return new Set(panes.map((p) => p.pane_id).filter(Boolean))
  } catch {
    return null
  }
}

// PermissionRequest: "permission: <tool> <brief target>" — capture-first:
// built from what the payload ACTUALLY carries (see evidence-WS6.md).
function permissionText(data) {
  const ti = data.tool_input && typeof data.tool_input === 'object' ? data.tool_input : {}
  let tool = String(data.tool_name ?? '')
  if (tool === 'PermissionRequest' || !tool) tool = String(ti.tool_name ?? ti.tool ?? 'tool')
  const TARGET_KEYS = ['file_path', 'command', 'pattern', 'url', 'query', 'description', 'notebook_path', 'path']
  let target = ''
  for (const k of TARGET_KEYS) {
    if (typeof ti[k] === 'string' && ti[k].trim()) {
      target = ti[k]
      break
    }
  }
  return target ? `permission: ${tool} ${target}` : `permission: ${tool}`
}

async function main() {
  const raw = await readStdin()
  let data = null
  try {
    data = raw.trim() ? JSON.parse(raw) : null
  } catch {
    data = null
  }

  switch (MODE) {
    case 'pre': {
      if (!data || !herdrOk()) return
      if (data.agent_id != null) return // subagent traffic never writes tokens
      const tool = String(data.tool_name ?? '')
      let q = ''
      if (tool === 'AskUserQuestion') {
        const qs = data.tool_input?.questions
        if (Array.isArray(qs) && qs[0]?.question) q = String(qs[0].question)
      } else if (tool === 'PermissionRequest' || data.hook_event_name === 'PermissionRequest') {
        q = permissionText(data)
      }
      if (!q) return
      setQ(process.env.HERDR_PANE_ID, shorten(q))
      return
    }

    case 'post': {
      if (!data || !herdrOk()) return
      if (data.agent_id != null) return
      if (String(data.tool_name ?? '') !== 'mcp__tower__ask_user') return
      const question = typeof data.tool_input?.question === 'string' ? data.tool_input.question : ''
      if (question) setQ(process.env.HERDR_PANE_ID, shorten(question))
      // The server's return text is the parsing contract:
      // "Question <id> is open. The orchestrator will surface it; ..."
      const respText =
        typeof data.tool_response === 'string'
          ? data.tool_response
          : data.tool_response == null
            ? ''
            : JSON.stringify(data.tool_response)
      const m = respText.match(/Question\s+(\S+?)\s+is\s+open/)
      if (!m) {
        log('no question id in tool_response; $q set, no mapping recorded')
        return
      }
      const state = loadState()
      state[process.env.HERDR_PANE_ID] = {
        question_id: m[1],
        q_text: shorten(question),
        ts: new Date().toISOString(),
        cwd: typeof data.cwd === 'string' && data.cwd ? data.cwd : process.cwd(),
      }
      saveState(state)
      return
    }

    case 'sweep': {
      if (!herdrOk()) return
      if (data?.agent_id != null) return
      const state = loadState()
      const entries = Object.entries(state)
      if (entries.length === 0) return
      const live = livePaneIds()
      let changed = false
      for (const [pane, m] of entries) {
        if (live && !live.has(pane)) {
          delete state[pane]
          changed = true
          log(`dropped mapping for ${pane}: pane gone`)
          continue
        }
        if (answeredRefs(m.cwd ?? '').has(m.question_id)) {
          clearQ(pane)
          delete state[pane]
          changed = true
          log(`cleared $q on ${pane}: ${m.question_id} answered`)
        }
      }
      if (changed) saveState(state)
      return
    }

    case 'clear': {
      if (!herdrOk()) return
      if (data?.agent_id != null) return
      clearQ(process.env.HERDR_PANE_ID)
      const state = loadState()
      if (state[process.env.HERDR_PANE_ID]) {
        delete state[process.env.HERDR_PANE_ID]
        saveState(state)
      }
      return
    }

    default:
      return
  }
}

main()
  .catch((e) => log(`fatal: ${e?.message ?? e}`))
  .finally(() => process.exit(0))
