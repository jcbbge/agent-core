#!/usr/bin/env bun
// Exercises the real production write path against a scratch JSONL file.
// No mocks. No live board.
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import {
  append,
  appendLine,
  jsonlRowRejectReason,
} from '/Users/jrg/agent-core/primitives/hooks/tower-ledger.mjs'

const scratch = mkdtempSync(join(tmpdir(), 'tower-door-refusal-'))
const file = join(scratch, 'board.jsonl')
let failed = 0

function record(name, ok, detail) {
  if (!ok) failed++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`)
}

function threw(fn) {
  try {
    fn()
    return { ok: false, err: null }
  } catch (e) {
    return { ok: true, err: String(e.message ?? e) }
  }
}

try {
  const good = { id: 'door-ok', type: 'note', from: 'agnt-board-door', body: 'well-formed' }

  const noNl = threw(() => appendLine(file, '{"id":"no-nl"}'))
  record(
    'newline-less write refused',
    noNl.ok && /terminating newline/.test(noNl.err) && jsonlRowRejectReason('{"id":"no-nl"}') === 'row has no terminating newline',
    noNl.err,
  )

  const concat = threw(() => appendLine(file, '{"id":"a"}n{"id":"b"}\n'))
  record(
    'concatenated / non-single-object write refused',
    concat.ok && /not parseable JSON/.test(concat.err),
    concat.err,
  )

  const notObj = threw(() => append(file, ['not', 'an', 'object']))
  record(
    'non-object append() refused',
    notObj.ok && /not a JSON object/.test(notObj.err),
    notObj.err,
  )

  const text = threw(() => appendLine(file, '1 matches in 1F:\n'))
  record(
    'non-JSON text write refused',
    text.ok && /not parseable JSON/.test(text.err),
    text.err,
  )

  append(file, good)
  const raw = readFileSync(file, 'utf8')
  const parsed = JSON.parse(raw.trimEnd())
  record(
    'well-formed append() accepted',
    raw.endsWith('\n') && raw.split('\n').filter(Boolean).length === 1 && parsed.id === 'door-ok',
    `bytes=${raw.length} endsWithNL=${raw.endsWith('\n')}`,
  )

  appendLine(file, JSON.stringify({ id: 'door-line', type: 'note' }) + '\n')
  const raw2 = readFileSync(file, 'utf8')
  const lines = raw2.split('\n').filter(Boolean)
  record(
    'well-formed appendLine() accepted',
    lines.length === 2 && JSON.parse(lines[1]).id === 'door-line',
    `lines=${lines.length}`,
  )

  console.log(failed === 0 ? 'RESULT  all refusals proven against tower-ledger.mjs' : `RESULT  ${failed} failure(s)`)
  process.exit(failed === 0 ? 0 : 1)
} finally {
  rmSync(scratch, { recursive: true, force: true })
}
