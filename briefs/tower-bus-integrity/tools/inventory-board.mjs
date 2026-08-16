#!/usr/bin/env bun
// Re-derive the damaged-row inventory for a Tower board.jsonl snapshot.
//
// Line numbering mirrors readJsonlStats/parseJsonl in
// primitives/hooks/tower-ledger.mjs: text.split('\n').filter(Boolean), so a
// "line number" is a 1-based index into the NON-EMPTY lines, which is what the
// `integrity:` warning reports.
//
// Read-only. Prints a JSON report on stdout; writes nothing.
//
// Usage: bun inventory-board.mjs <board.jsonl>

import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'

const CRED = /srt:[0-9a-f]{32}/g
const redact = (s) => String(s).replace(CRED, 'srt:REDACTED')

const file = process.argv[2]
if (!file) {
  console.error('usage: inventory-board.mjs <board.jsonl>')
  process.exit(2)
}

const buf = readFileSync(file)
const text = buf.toString('utf-8')
const sha256 = createHash('sha256').update(buf).digest('hex')
const physical_lines = text.split('\n').length - (text.endsWith('\n') ? 1 : 0)
const lines = text.split('\n').filter(Boolean)

const ok = []
const bad = []
for (let i = 0; i < lines.length; i++) {
  try {
    JSON.parse(lines[i])
    ok.push(i + 1)
  } catch (e) {
    bad.push({ line: i + 1, raw: lines[i], parse_error: e.message })
  }
}

const FIELDS = ['id', 'ts', 'from', 'topic', 'cwd', 'type', 'kind', 'scent']

/** Greedy scan for complete top-level JSON objects, honoring strings/escapes. */
function scanObjects(s) {
  const objs = []
  let depth = 0
  let start = -1
  let inStr = false
  let esc = false
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (inStr) {
      if (esc) esc = false
      else if (c === '\\') esc = true
      else if (c === '"') inStr = false
      continue
    }
    if (c === '"') { inStr = true; continue }
    if (c === '{') { if (depth === 0) start = i; depth++; continue }
    if (c === '}') {
      depth--
      if (depth === 0 && start >= 0) { objs.push({ start, end: i + 1, text: s.slice(start, i + 1) }); start = -1 }
      if (depth < 0) depth = 0
    }
  }
  return { objects: objs, trailing_open: depth > 0 ? s.slice(start) : null }
}

/** Pull a scalar field out of a possibly-unparseable row body. */
function extractField(raw, field) {
  const re = new RegExp(`"${field}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`)
  const m = raw.match(re)
  return m ? m[1] : null
}

const results = []
for (const b of bad) {
  const raw = b.raw
  const raw_byte_len = Buffer.byteLength(raw, 'utf-8')
  const { objects, trailing_open } = scanObjects(raw)

  // Which of the scanned objects actually parse on their own?
  const parts = objects.map((o) => {
    let parsed = null
    let err = null
    try { parsed = JSON.parse(o.text) } catch (e) { err = e.message }
    return { ...o, parsed, err }
  })
  const parsed_parts = parts.filter((p) => p.parsed)

  // Separator bytes between consecutive scanned objects.
  const separators = []
  for (let i = 1; i < parts.length; i++) {
    const sep = raw.slice(parts[i - 1].end, parts[i].start)
    separators.push({
      between: [i - 1, i],
      bytes: [...Buffer.from(sep, 'utf-8')],
      literal: sep,
    })
  }
  const prefix = parts.length ? raw.slice(0, parts[0].start) : raw
  const suffix = parts.length ? raw.slice(parts[parts.length - 1].end) : ''

  // Extraction: prefer parsed objects, fall back to regex over the raw body.
  const extractable = {}
  for (const f of FIELDS) {
    let v = null
    for (const p of parsed_parts) {
      if (p.parsed && typeof p.parsed[f] === 'string') { v = p.parsed[f]; break }
      if (p.parsed && p.parsed[f] != null && typeof p.parsed[f] !== 'object') { v = String(p.parsed[f]); break }
    }
    if (v == null) v = extractField(raw, f)
    if (v != null) extractable[f] = { read: redact(v) }
  }

  // Classification.
  let damage_class
  let recoverable
  if (!raw.trimStart().startsWith('{')) {
    damage_class = parts.length === 0 ? 'non_json_text' : 'non_json_prefix'
    recoverable = parts.length > 0 && parsed_parts.length === parts.length
  } else if (parsed_parts.length >= 2 && parsed_parts.length === parts.length && !trailing_open && suffix.trim() === '') {
    damage_class = 'concatenated_objects'
    recoverable = true
  } else if (trailing_open || (parts.length === 0 && raw.trimStart().startsWith('{'))) {
    damage_class = 'truncated'
    recoverable = false
  } else {
    damage_class = 'other'
    recoverable = parsed_parts.length === parts.length && parts.length > 0
  }
  // Escape-level damage is a stronger signal than object structure.
  if (/Invalid escape/i.test(b.parse_error)) damage_class = 'invalid_escape'

  results.push({
    line: b.line,
    damage_class,
    raw_byte_len,
    parse_error: b.parse_error,
    object_count: parts.length,
    parsed_object_count: parsed_parts.length,
    separators,
    prefix: redact(prefix.slice(0, 120)),
    suffix: redact(suffix.slice(0, 120)),
    trailing_open_preview: trailing_open ? redact(trailing_open.slice(0, 200)) : null,
    head: redact(raw.slice(0, 160)),
    tail: redact(raw.slice(-160)),
    part_errors: parts.filter((p) => p.err).map((p, i) => ({ index: i, err: p.err, head: redact(p.text.slice(0, 120)) })),
    part_reads: parts.map((p) => {
      const o = {}
      for (const f of FIELDS) {
        const v = p.parsed ? p.parsed[f] : extractField(p.text, f)
        if (v != null && typeof v !== 'object') o[f] = redact(String(v))
      }
      o._parses = !!p.parsed
      return o
    }),
    extractable,
    has_control_chars: /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(raw),
    recoverable,
  })
}

console.log(JSON.stringify({
  source: file,
  sha256,
  physical_lines,
  nonempty_lines: lines.length,
  blank_lines: physical_lines - lines.length,
  parse_summary: { total_nonempty: lines.length, ok: ok.length, bad_count: bad.length },
  bad_line_numbers: bad.map((b) => b.line),
  rows: results,
}, null, 2))
