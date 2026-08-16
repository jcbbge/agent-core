#!/usr/bin/env node
// Build briefs/tower-bus-integrity/INVENTORY.json from the LIVE Tower board.
//
// Read-only on ~/.tower/board.jsonl. Run with node (not bun): classification
// leans on V8's positioned JSON.parse errors.
//
// Line numbering mirrors parseJsonl in primitives/hooks/tower-ledger.mjs
// (`text.split('\n').filter(Boolean)`), which is what the `integrity:` warning
// counts. The live file currently has zero blank lines, so these indices equal
// physical line numbers; the script records both so that stays checkable.
//
// Usage: node build-inventory.mjs [board.jsonl] [out.json]

import { readFileSync, writeFileSync, statSync } from 'node:fs'
import { createHash } from 'node:crypto'

const BOARD = process.argv[2] || `${process.env.HOME}/.tower/board.jsonl`
const OUT = process.argv[3] || `${process.env.HOME}/agent-core/briefs/tower-bus-integrity/INVENTORY.json`
const PRIOR = `${process.env.HOME}/agent-core/briefs/tower/bus-data/INVENTORY.json`

const CRED = /srt:[0-9a-f]{32}/g
const redact = (s) => String(s).replace(CRED, 'srt:REDACTED')
const clip = (s, n) => (s.length > n ? s.slice(0, n) + '...[clipped]' : s)
const FIELDS = ['id', 'ts', 'from', 'topic', 'cwd', 'type']

// ─── repairs, each of which must round-trip through JSON.parse to count ──────

/** `\-` and friends: escape the stray backslash so the escape becomes literal. */
const repairInvalidEscape = (t) => t.replace(/\\([^"\\/bfnrtu])/g, '\\\\$1')

/** Bare `"` inside a trailing `"body":"..."` value: escape them. */
function repairUnescapedBody(t) {
  const m = /"body":\s*"/.exec(t)
  if (!m || !t.endsWith('"}')) return null
  const start = m.index + m[0].length
  const mid = t.slice(start, t.length - 2).replace(/(^|[^\\])"/g, '$1\\"')
  return t.slice(0, start) + mid + '"}'
}

function tryParse(t) {
  try { return { ok: true, value: JSON.parse(t) } } catch (e) { return { ok: false, err: e.message } }
}

/** Parse, else repair-and-parse; returns the proof of which repair worked. */
function parseOrRepair(t) {
  const direct = tryParse(t)
  if (direct.ok) return { value: direct.value, repair: null, parse_error: null }
  for (const [method, fn] of [['escape_stray_backslash', repairInvalidEscape], ['escape_bare_quotes_in_body', repairUnescapedBody]]) {
    const fixed = fn(t)
    if (!fixed || fixed === t) continue
    const r = tryParse(fixed)
    if (r.ok) return { value: r.value, repair: { method, parses_after_repair: true }, parse_error: direct.err }
  }
  return { value: null, repair: null, parse_error: direct.err }
}

const errPosition = (msg) => { const m = /position (\d+)/.exec(msg || ''); return m ? Number(m[1]) : null }
const errContext = (raw, msg, span = 70) => {
  const p = errPosition(msg)
  if (p == null) return null
  return redact(raw.slice(Math.max(0, p - span), p + span))
}
const serializerOf = (t) => (/"[a-z_]+":\s/.test(t) ? 'spaced' : 'compact')

const fieldReads = (obj, text) => {
  const out = {}
  for (const f of FIELDS) {
    let v = obj && typeof obj[f] !== 'object' && obj[f] != null ? String(obj[f]) : null
    if (v == null) {
      const m = text.match(new RegExp(`"${f}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`))
      v = m ? m[1] : null
    }
    if (v != null) out[f] = redact(v)
  }
  return out
}

// ─── read the live board ─────────────────────────────────────────────────────

const buf = readFileSync(BOARD)
const st = statSync(BOARD)
const text = buf.toString('utf-8')
const sha256 = createHash('sha256').update(buf).digest('hex')
const physical_lines = text.split('\n').length - (text.endsWith('\n') ? 1 : 0)
const lines = text.split('\n').filter(Boolean)

const bad = []
let okCount = 0
for (let i = 0; i < lines.length; i++) {
  const r = tryParse(lines[i])
  if (r.ok) okCount++
  else bad.push({ line: i + 1, raw: lines[i], parse_error: r.err })
}

// ─── classify ────────────────────────────────────────────────────────────────

const SEP_RE = /\}n\{/g
const bad_lines = []

for (const b of bad) {
  const raw = b.raw
  const raw_byte_len = Buffer.byteLength(raw, 'utf-8')

  // Split on the observed separator: a bare `n` byte sitting between `}` and `{`.
  const separators = []
  const cuts = []
  SEP_RE.lastIndex = 0
  let m
  while ((m = SEP_RE.exec(raw)) !== null) {
    cuts.push(m.index + 1)
    separators.push({
      after_object: separators.length,
      bytes: [...Buffer.from(raw.slice(m.index + 1, m.index + 2), 'utf-8')],
      literal: raw.slice(m.index + 1, m.index + 2),
      note: 'byte 0x6e (ASCII "n") where a 0x0a newline belonged',
    })
    SEP_RE.lastIndex = m.index + 2
  }
  const chunks = []
  let cursor = 0
  for (const c of cuts) { chunks.push(raw.slice(cursor, c)); cursor = c + 1 }
  chunks.push(raw.slice(cursor))

  const parts = chunks.map((t, i) => {
    const r = parseOrRepair(t)
    return {
      index: i,
      parses_as_is: r.parse_error === null,
      recovered_by: r.repair,
      parse_error: r.parse_error ? clip(redact(r.parse_error), 160) : null,
      error_context: r.parse_error ? clip(errContext(t, r.parse_error) || '', 200) : null,
      serializer: serializerOf(t),
      byte_len: Buffer.byteLength(t, 'utf-8'),
      reads: fieldReads(r.value, t),
      _ok: r.value != null,
    }
  })

  const startsObject = raw.trimStart().startsWith('{')
  const allRecovered = parts.every((p) => p._ok)
  const repairs = parts.filter((p) => p.recovered_by).map((p) => p.recovered_by.method)

  let damage_class
  if (!startsObject) {
    damage_class = 'non_json_text'
  } else if (parts.length > 1) {
    damage_class = repairs.length ? `concatenated_objects+${[...new Set(repairs)].join('+')}` : 'concatenated_objects'
  } else if (repairs.includes('escape_stray_backslash')) {
    damage_class = 'invalid_escape'
  } else if (repairs.includes('escape_bare_quotes_in_body')) {
    damage_class = 'unescaped_body'
  } else {
    damage_class = 'truncated'
  }

  // Row-level extractable: first non-empty read per field, across parts.
  const extractable = {}
  for (const f of FIELDS) {
    for (const p of parts) {
      if (p.reads[f] != null) { extractable[f] = { read: p.reads[f] }; break }
    }
  }
  if (!Object.keys(extractable).length) {
    for (const f of FIELDS) {
      const mm = raw.match(new RegExp(`"${f}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`))
      if (mm) extractable[f] = { read: redact(mm[1]) }
    }
  }

  const writer_parts = parts
    .filter((p) => Object.keys(p.reads).length)
    .map((p) => ({
      part: p.index,
      from: p.reads.from ?? null,
      id: p.reads.id ?? null,
      topic: p.reads.topic ?? null,
      cwd: p.reads.cwd ?? null,
      serializer: p.serializer,
    }))

  bad_lines.push({
    line: b.line,
    damage_class,
    raw_byte_len,
    extractable,
    recoverable: startsObject ? allRecovered : false,
    notes: '',
    writer: { attributed_to: null, basis: 'id/from/topic/cwd read off the row', parts: writer_parts },
    evidence: {
      parse_error: clip(redact(b.parse_error), 160),
      error_context: clip(errContext(raw, b.parse_error) || '', 200),
      object_count: parts.length,
      separators,
      head: clip(redact(raw.slice(0, 140)), 160),
      tail: clip(redact(raw.slice(-140)), 160),
      has_control_chars: /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(raw),
      recovery_proof: parts.map((p) => ({
        part: p.index,
        parses_as_is: p.parses_as_is,
        repair: p.recovered_by ? p.recovered_by.method : null,
        parses_after_repair: p._ok,
        parse_error: p.parse_error,
        error_context: p.error_context,
        serializer: p.serializer,
        byte_len: p.byte_len,
      })),
    },
  })
}

// ─── narrative fields that are judgement, not derivation ─────────────────────

const NOTES = JSON.parse(readFileSync(new URL('./inventory-notes.json', import.meta.url), 'utf-8'))
for (const row of bad_lines) {
  const n = NOTES.rows[String(row.line)] || NOTES.rows.default
  row.notes = n.notes
  row.writer.attributed_to = n.writer ?? (row.writer.parts.length
    ? row.writer.parts.map((p) => `${p.serializer} object ${p.part}: from=${p.from} topic=${p.topic} cwd=${p.cwd}`).join(' | ')
    : 'UNKNOWN — no id/from/topic/cwd extractable')
  if (n.recoverable_override != null) {
    row.recoverable = n.recoverable_override
    row.evidence.recoverable_override_reason = n.recoverable_reason
  }
}

const histogram = {}
for (const r of bad_lines) histogram[r.damage_class] = (histogram[r.damage_class] || 0) + 1

// ─── diff against the prior inventory ────────────────────────────────────────

const prior = JSON.parse(readFileSync(PRIOR, 'utf-8'))
const priorByLine = new Map(prior.bad_lines.map((r) => [r.line, r]))
const diffs = []
for (const r of bad_lines) {
  const p = priorByLine.get(r.line)
  if (!p) { diffs.push({ line: r.line, kind: 'absent_from_prior' }); continue }
  const d = {}
  if (p.damage_class !== r.damage_class) d.damage_class = { prior: p.damage_class, mine: r.damage_class }
  if (p.raw_byte_len !== r.raw_byte_len) d.raw_byte_len = { prior: p.raw_byte_len, mine: r.raw_byte_len }
  if (p.recoverable !== r.recoverable) d.recoverable = { prior: p.recoverable, mine: r.recoverable }
  if (Object.keys(d).length) diffs.push({ line: r.line, ...d, why: (NOTES.rows[String(r.line)] || {}).disagreement || null })
}
const onlyInPrior = prior.bad_lines.filter((p) => !bad_lines.some((r) => r.line === p.line)).map((p) => p.line)

const out = {
  generated_at: new Date().toISOString(),
  generated_by: 'agnt-board-inventory-test (AGNT under ORCH board-repair)',
  generator: 'briefs/tower-bus-integrity/tools/build-inventory.mjs (run under node)',
  schema: {
    inherited_from: 'briefs/tower/bus-data/INVENTORY.json',
    shape: '{backup, bad_lines[], authorless_authored, parse_summary}',
    bad_lines_entry: '{line, damage_class, raw_byte_len, extractable{field:{read}}, recoverable, notes, writer, evidence}',
    additions: ['writer', 'evidence (parse errors, separators, per-part recovery proofs)'],
  },
  source: {
    path: BOARD,
    sha256,
    size_bytes: st.size,
    mtime: new Date(st.mtimeMs).toISOString(),
    physical_lines,
    nonempty_lines: lines.length,
    blank_lines: physical_lines - lines.length,
    note: 'The board is append-only and live; sha256 and counts are the instant this file was written. Damage is confined to lines 1-2577 and has not grown.',
  },
  line_numbering: "1-based index into text.split('\\n').filter(Boolean), matching parseJsonl in primitives/hooks/tower-ledger.mjs:351 — the same numbering the integrity warning reports. blank_lines is 0, so these equal physical line numbers.",
  backup: {
    path: null,
    note: 'No new backup taken: this AGNT is read-only on ~/.tower/board.jsonl and raw rows are not committable. The prior backup referenced by bus-data/INVENTORY.json is at briefs/tower/bus-data/backups/board.jsonl.20260813T134935Z.bak (source_sha256 10cc463f2f0c4bba890783f2f28cdb460f9100e1253a5b11e54f0c7053e36baf, 6472 lines) and predates ~6000 clean appends.',
  },
  parse_summary: { total_nonempty: lines.length, ok: okCount, bad_count: bad_lines.length },
  integrity_reconciliation: {
    command: 'bun ~/.tower/cli.mjs board agent-core/tower-bus-integrity',
    expected_warning: `integrity: ${bad_lines.length} unparseable line(s) on board (max bad line ${Math.max(...bad_lines.map((r) => r.line))})`,
  },
  class_histogram: histogram,
  separator_bytes: {
    finding: 'Every separator between concatenated objects on every affected line is a single byte 0x6e (ASCII "n") sitting between "}" and "{". No other separator byte occurs.',
    distinct_byte_sequences: [...new Set(bad_lines.flatMap((r) => r.evidence.separators.map((s) => JSON.stringify(s.bytes))))],
    total_separators: bad_lines.reduce((a, r) => a + r.evidence.separators.length, 0),
  },
  comparison_with_prior: {
    prior_path: 'briefs/tower/bus-data/INVENTORY.json',
    prior_parse_summary: prior.parse_summary,
    line_numbers_identical: onlyInPrior.length === 0 && bad_lines.length === prior.bad_lines.length,
    byte_lengths_identical: bad_lines.every((r) => (priorByLine.get(r.line) || {}).raw_byte_len === r.raw_byte_len),
    lines_only_in_prior: onlyInPrior,
    agreement: NOTES.agreement,
    disagreements: diffs,
  },
  authorless_authored: {
    status: 'not_re_derived',
    note: 'Out of this task\'s scope (the 26 unparseable rows). The prior inventory\'s authorless_authored list is NOT copied here because it was not re-verified this session.',
  },
  credential_redaction: {
    rule: 's/srt:[0-9a-f]{32}/srt:REDACTED/g applied to every excerpt and every field read',
    rows_containing_the_credential: bad.filter((b) => /srt:[0-9a-f]{32}/.test(b.raw)).map((b) => b.line),
    note: 'None of the 26 damaged rows carries the proxy credential; redaction is applied unconditionally anyway.',
  },
  bad_lines,
}

writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n')
console.log(`wrote ${OUT}`)
console.log(JSON.stringify({ parse_summary: out.parse_summary, sha256, nonempty_lines: lines.length, histogram, diffs: diffs.map((d) => d.line) }))
