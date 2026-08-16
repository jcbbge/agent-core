#!/usr/bin/env bun
// Differential test: incremental cursor path must match full parse.
import { mkdtempSync, writeFileSync, appendFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const {
  readAllFull,
  readAll,
  inboxState,
  boardFor,
  LEDGER,
  BOARD,
  TOWER,
  _test,
} = await import('./tower-ledger.mjs')

let failed = 0
const assertEq = (label, a, b) => {
  const aj = JSON.stringify(a)
  const bj = JSON.stringify(b)
  if (aj !== bj) {
    console.error(`FAIL ${label}`)
    failed++
    return false
  }
  console.log(`ok ${label}`)
  return true
}

const CWD = '/Users/jrg/agent-core'

// Clear stale cursors so we exercise cold + warm paths
import { unlinkSync, readdirSync } from 'node:fs'
const cursorDir = join(TOWER, 'cursors')
try {
  for (const f of readdirSync(cursorDir)) {
    if (f.includes('inbox') || f.includes('scope') || f.endsWith('.lock')) {
      try {
        unlinkSync(join(cursorDir, f))
      } catch {
        /* ok */
      }
    }
  }
} catch {
  /* no dir */
}

assertEq('readAll live ledger', readAll(LEDGER), readAllFull(LEDGER))
assertEq('readAll live board', readAll(BOARD), readAllFull(BOARD))

assertEq('inboxState cold', inboxState(CWD), _test.inboxStateFromFull(CWD))
assertEq('inboxState warm', inboxState(CWD), _test.inboxStateFromFull(CWD))
assertEq('inboxState all', inboxState(null), _test.inboxStateFromFull(null))

assertEq('boardFor cold', boardFor(CWD), _test.boardForFromFull(CWD))
assertEq('boardFor warm', boardFor(CWD), _test.boardForFromFull(CWD))
assertEq('boardFor topic', boardFor(CWD, { topic: 'agent-core/tower-perf', limit: 10 }), _test.boardForFromFull(CWD, { topic: 'agent-core/tower-perf', limit: 10 }))

// truncation reset
const trunc = join(cursorDir, '_trunc-ledger.jsonl')
writeFileSync(trunc, JSON.stringify({ id: 'a', kind: 'progress', cwd: CWD, message: 'x' }) + '\n')
process.env.TOWER_LEDGER_NO_CURSOR = '1'
const fullBefore = readAllFull(trunc)
process.env.TOWER_LEDGER_NO_CURSOR = '0'
writeFileSync(trunc, JSON.stringify({ id: 'z', kind: 'note', cwd: CWD, message: 'after' }) + '\n')

if (failed > 0) {
  console.error(`\n${failed} differential test(s) failed`)
  process.exit(1)
}
console.log('\nall differential tests passed')
process.exit(0)
