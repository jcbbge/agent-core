#!/usr/bin/env bun
// Tower code drift check — T4a (agnt-w0-driftcheck).
//
// Walks the canonical Tower code home and, for every file there, compares
// its bytes against the deployed path that is supposed to mirror it. Three
// files (server.mjs, hooks/stop-verdict.mjs, hooks/ask-bridge.mjs) are also
// compared against herdr-spine/cc-hooks/, install.sh's fallback source —
// those are the only files a second deploy mechanism still competes over
// (see server-drift.criteria.md and E1-install-sh-clobber-proof.md).
//
// Exit 0: every comparison that is in scope for pass/fail agrees.
// Exit 1: at least one FAIL (a location that should mirror another doesn't).
// WARN lines never affect the exit code — they flag risk (a stale orphan
// copy, an unpushed canonical commit) that isn't live drift yet.
//
// No args, no network, no writes anywhere (least of all under ~/.tower/).
// All roots are overridable by env var so this can be pointed at a sandbox
// fixture instead of the real machine (see T4b's proof run).

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, relative, sep } from 'node:path'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'

const HOME = homedir()

const CANONICAL_DIR =
  process.env.TOWER_DRIFT_CANONICAL_DIR || join(HOME, 'agent-core/primitives/mcps/tower')
const DEPLOYED_DIR = process.env.TOWER_DRIFT_DEPLOYED_DIR || join(HOME, '.tower')
const SPINE_SOURCE_DIR =
  process.env.TOWER_DRIFT_SPINE_DIR || join(HOME, 'herdr-spine/cc-hooks')
const ORPHAN_FILE =
  process.env.TOWER_DRIFT_ORPHAN_FILE ||
  join(HOME, 'agent-core/primitives/hooks/stop-verdict.mjs')

// Files a second deploy mechanism (install.sh) still competes over — the
// only ones checked against SPINE_SOURCE_DIR. Everything else in the
// canonical manifest is deployed-vs-canonical only.
const CONTESTED = new Map([
  ['server.mjs', 'server.mjs'],
  ['hooks/stop-verdict.mjs', 'stop-verdict.mjs'],
  ['hooks/ask-bridge.mjs', 'ask-bridge.mjs'],
])

// Directory entries that are not part of the deployed code mirror: `attic/`
// is preserved-backup storage (never deployed), the two `.jsonl` files are
// live state that happens to have been copied in during the initial
// canonicalization, and dotfiles (.gitignore) aren't code.
const EXCLUDE_DIRS = new Set(['attic'])
const EXCLUDE_FILES = new Set(['board.jsonl', 'ledger.jsonl'])

function discoverManifest(root) {
  const out = []
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue
      const abs = join(dir, entry.name)
      if (entry.isDirectory()) {
        if (EXCLUDE_DIRS.has(entry.name)) continue
        walk(abs)
      } else if (entry.isFile()) {
        if (EXCLUDE_FILES.has(entry.name)) continue
        out.push(relative(root, abs).split(sep).join('/'))
      }
    }
  }
  walk(root)
  return out.sort()
}

function sha8(buf) {
  return createHash('sha256').update(buf).digest('hex').slice(0, 8)
}

// fs.readFileSync opens through the final symlink target — a symlinked
// deployed path and a real-file deployed path are read identically here,
// so comparison is always on effective content, never inode/link identity.
function readBytes(path) {
  try {
    return { ok: true, buf: readFileSync(path) }
  } catch (err) {
    return { ok: false, err: err.code || String(err) }
  }
}

// .mjs files are load-bearing at the deployed path — hooks and the server
// are executed from there, so any divergence is live drift (FAIL). .md
// docs are read by humans, never by runtime code; a missing or stale
// deployed doc can't break anything at runtime, so it's a WARN, not a
// FAIL — a deliberate scope decision (see the report-back for the
// README.md gap this classification actually caught live).
function severityFor(relPath) {
  return relPath.endsWith('.mjs') ? 'FAIL' : 'WARN'
}

function compare(label, aPath, bPath, severity) {
  const a = readBytes(aPath)
  const b = readBytes(bPath)
  if (!a.ok && !b.ok) return { status: severity, detail: `${label}: both missing (${aPath}, ${bPath})` }
  if (!a.ok) return { status: severity, detail: `${label}: missing at ${aPath} (${a.err})` }
  if (!b.ok) return { status: severity, detail: `${label}: missing at ${bPath} (${b.err})` }
  if (Buffer.compare(a.buf, b.buf) === 0) return { status: 'OK', detail: null }
  return {
    status: severity,
    detail: `${label}: ${aPath} (${sha8(a.buf)}) != ${bPath} (${sha8(b.buf)})`,
  }
}

function checkUnpushedCanonical() {
  try {
    const opts = { cwd: CANONICAL_DIR, stdio: ['ignore', 'pipe', 'pipe'] }
    const head = execFileSync('git', ['rev-parse', 'HEAD'], opts).toString().trim()
    let upstream
    try {
      upstream = execFileSync('git', ['rev-parse', '@{u}'], opts).toString().trim()
    } catch {
      return { status: 'WARN', detail: 'canonical home has no upstream configured — skipped (no network call made)' }
    }
    if (head === upstream) return null
    return {
      status: 'WARN',
      detail: `canonical home is ahead of its upstream: HEAD ${head.slice(0, 8)} vs ${upstream.slice(0, 8)} (local commits unpushed — a branch/checkout op elsewhere can dangle every deployed symlink)`,
    }
  } catch (err) {
    return { status: 'WARN', detail: `could not read canonical git state — skipped (${err.code || err})` }
  }
}

function main() {
  const start = process.hrtime.bigint()
  const results = []

  if (!existsSync(CANONICAL_DIR)) {
    console.error(`FATAL: canonical dir does not exist: ${CANONICAL_DIR}`)
    process.exit(1)
  }

  const manifest = discoverManifest(CANONICAL_DIR)
  const contestedCount = manifest.filter((rel) => CONTESTED.has(rel)).length

  for (const rel of manifest) {
    const canonicalPath = join(CANONICAL_DIR, rel)
    const deployedPath = join(DEPLOYED_DIR, rel)
    const severity = severityFor(rel)
    results.push({ rel, ...compare(rel, deployedPath, canonicalPath, severity) })

    if (CONTESTED.has(rel)) {
      const spinePath = join(SPINE_SOURCE_DIR, CONTESTED.get(rel))
      results.push({
        rel: `${rel} (vs spine fallback)`,
        ...compare(`${rel} vs spine`, spinePath, canonicalPath, severity),
      })
    }
  }

  // Orphan check — informational only. Nothing reads primitives/hooks/*.mjs
  // at runtime any more (see E1), so a mismatch here is stale-file risk,
  // not live drift, and must never fail the check on its own.
  if (existsSync(ORPHAN_FILE)) {
    const canonicalHookPath = join(CANONICAL_DIR, 'hooks/stop-verdict.mjs')
    const a = readBytes(ORPHAN_FILE)
    const b = readBytes(canonicalHookPath)
    if (a.ok && b.ok) {
      if (Buffer.compare(a.buf, b.buf) === 0) {
        results.push({
          rel: 'orphan primitives/hooks/stop-verdict.mjs',
          status: 'WARN',
          detail: `orphan is byte-identical to canonical hooks/stop-verdict.mjs — harmless but still dead weight, still git-tracked`,
        })
      } else {
        results.push({
          rel: 'orphan primitives/hooks/stop-verdict.mjs',
          status: 'WARN',
          detail: `stale orphan diverges from canonical (${sha8(a.buf)} vs ${sha8(b.buf)}) — dead file from a reverted consolidation (3deb7e7), still git-tracked, nothing imports it`,
        })
      }
    }
  }

  const unpushed = checkUnpushedCanonical()
  if (unpushed) results.push({ rel: 'canonical git state', ...unpushed })

  const fails = results.filter((r) => r.status === 'FAIL')
  const warns = results.filter((r) => r.status === 'WARN')
  const oks = results.filter((r) => r.status === 'OK')

  console.log(`Tower drift check`)
  console.log(`  canonical: ${CANONICAL_DIR}`)
  console.log(`  deployed:  ${DEPLOYED_DIR}`)
  console.log(`  spine src: ${SPINE_SOURCE_DIR} (checked for ${contestedCount} contested file(s))`)
  console.log('')
  for (const r of results) {
    console.log(`${r.status.padEnd(4)} ${r.detail || r.rel}`)
  }
  console.log('')
  console.log(
    `${manifest.length} manifest file(s), ${oks.length} ok, ${fails.length} FAIL, ${warns.length} warn`
  )
  const elapsedMs = Number(process.hrtime.bigint() - start) / 1e6
  console.log(`runtime: ${elapsedMs.toFixed(1)}ms`)

  process.exit(fails.length > 0 ? 1 : 0)
}

main()
