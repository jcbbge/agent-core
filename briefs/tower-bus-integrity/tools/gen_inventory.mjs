#!/usr/bin/env bun
// Generates INVENTORY.json for the 26 damaged board.jsonl lines.
// READ-ONLY on board.jsonl. Reuses the bus-data/INVENTORY.json schema and
// adds `writer` per bad_lines entry. No body text is captured anywhere
// (extractable is limited to id/ts/from/topic/cwd/type per the brief), so
// no credential redaction is structurally needed in the field values —
// still guarded below as defense in depth.
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";

const BOARD = "/Users/jrg/.tower/board.jsonl";
const OUT = "/Users/jrg/agent-core/briefs/tower-bus-integrity/INVENTORY.json";
const TARGET_LINES = [1, 2, 3, 553, 2113, 2502, 2504, 2507, 2511, 2513, 2514, 2515, 2516, 2521, 2523, 2525, 2527, 2530, 2542, 2556, 2559, 2569, 2571, 2573, 2574, 2577];

const buf = readFileSync(BOARD);
const sha256 = createHash("sha256").update(buf).digest("hex");
const text = buf.toString("utf8");
const rawLines = text.split("\n");
const hasTrailingNewline = rawLines[rawLines.length - 1] === "";
const lines = hasTrailingNewline ? rawLines.slice(0, -1) : rawLines;

let ok = 0, bad = 0, total_nonempty = 0;
const badFound = [];
for (let i = 0; i < lines.length; i++) {
  const content = lines[i];
  if (content.length === 0) continue;
  total_nonempty++;
  try { JSON.parse(content); ok++; }
  catch (e) { bad++; badFound.push(i + 1); }
}
if (bad !== 26 || badFound.length !== TARGET_LINES.length || !TARGET_LINES.every(l => badFound.includes(l))) {
  console.error("MISMATCH: live bad lines do not match TARGET_LINES", badFound);
  process.exit(1);
}

function findObjectEnd(s, start) {
  let depth = 0, inString = false, escape = false;
  for (let j = start; j < s.length; j++) {
    const c = s[j];
    if (inString) {
      if (escape) { escape = false; continue; }
      if (c === "\\") { escape = true; continue; }
      if (c === '"') { inString = false; continue; }
      continue;
    }
    if (c === '"') { inString = true; continue; }
    if (c === "{") depth++;
    else if (c === "}") { depth--; if (depth === 0) return j + 1; }
  }
  return inString ? -2 : -1;
}

function splitConcatenated(content) {
  const parts = [];
  let i = 0;
  while (i < content.length) {
    while (i < content.length && /\s/.test(content[i])) i++;
    if (i >= content.length) break;
    if (content[i] !== "{") { parts.push({ kind: "leftover", text: content.slice(i) }); break; }
    const start = i;
    const end = findObjectEnd(content, start);
    if (end < 0) { parts.push({ kind: end === -2 ? "unterminated_string" : "unbalanced", text: content.slice(start) }); break; }
    const objStr = content.slice(start, end);
    let parsed = null, parseErr = null;
    try { parsed = JSON.parse(objStr); } catch (e) { parseErr = e.message; }
    parts.push({ kind: "object", text: objStr, parses: parseErr === null, parseErr, parsed });
    let k = end;
    while (k < content.length && content[k] !== "{") k++;
    const sep = content.slice(end, k);
    if (sep.length > 0) parts.push({ kind: "separator", text: sep });
    i = k;
  }
  return parts;
}

// Best-effort regex field extraction for object text that fails to JSON.parse
// whole (used only when the object-level parse fails, e.g. a body value with
// an internal unescaped quote corrupts everything after it, but id/ts/cwd/
// type/from/topic sit before body and are intact).
function regexField(objText, field) {
  const m = objText.match(new RegExp(`"${field}"\\s*:\\s*"((?:\\\\.|[^"\\\\])*)"`));
  if (!m) return undefined;
  try { return JSON.parse(`"${m[1]}"`); } catch { return m[1]; }
}

const CRED_RE = /srt:[0-9a-f]{32}/g;
const redact = (v) => (typeof v === "string" ? v.replace(CRED_RE, "srt:REDACTED") : v);

function fieldsOf(part) {
  const fields = ["id", "ts", "from", "topic", "cwd", "type"];
  const out = {};
  if (part.parses) {
    for (const f of fields) if (part.parsed[f] !== undefined) out[f] = { read: redact(part.parsed[f]) };
  } else {
    for (const f of fields) {
      const v = regexField(part.text, f);
      if (v !== undefined) out[f] = { read: redact(v) };
    }
  }
  return out;
}

function writerOf(fields) {
  const from = fields.from?.read;
  const id = fields.id?.read;
  if (from) return from;
  if (id) return id;
  return "UNKNOWN";
}

const bad_lines = [];
const diffs = [];

// --- Lines 1-3: captured tool stdout, not board rows ---
bad_lines.push({
  line: 1, damage_class: "non_json_text",
  raw_byte_len: Buffer.byteLength(lines[0], "utf8"),
  extractable: {}, recoverable: false, writer: "UNKNOWN",
  notes: "Not a board row. Literal text '1 matches in 1F:' — captured stdout of a search/grep-style tool that got appended to board.jsonl instead of a proper post.",
});
bad_lines.push({
  line: 2, damage_class: "non_json_text",
  raw_byte_len: Buffer.byteLength(lines[1], "utf8"),
  extractable: {}, recoverable: false, writer: "UNKNOWN",
  notes: "Not a board row. Literal text '[file] 628 (1):' — same captured-stdout artifact as line 1, part of the same leaked tool run (grep/search-style match summary header).",
});
{
  const content = lines[2];
  const tsMatch = content.match(/"ts":\s*"([^"]*)"/);
  bad_lines.push({
    line: 3, damage_class: "truncated",
    raw_byte_len: Buffer.byteLength(content, "utf8"),
    extractable: tsMatch ? { ts: { read: tsMatch[1] } } : {},
    recoverable: false, writer: "UNKNOWN",
    notes: "Not a board row on its own: begins '     0: \"spine-...\", \"ts\": ..., \"cwd...' (numbered-line dump format, no opening '{', truncated mid-key at 'cwd'). Same leaked-stdout artifact family as lines 1-2 — looks like a numbered match dump (e.g. `grep -n`-style output) of a JSON line, not the line itself.",
  });
}

// --- Lines 553, 2113: single malformed object, no concatenation ---
function singleObjectEntry(lineNo, damageClass, noteExtra) {
  const content = lines[lineNo - 1];
  const parts = splitConcatenated(content);
  if (parts.length !== 1 || parts[0].kind !== "object") {
    throw new Error(`line ${lineNo}: expected exactly one object part, got ${JSON.stringify(parts.map(p => p.kind))}`);
  }
  const part = parts[0];
  const fields = fieldsOf(part);
  return {
    line: lineNo,
    damage_class: damageClass,
    raw_byte_len: Buffer.byteLength(content, "utf8"),
    extractable: fields,
    recoverable: true,
    writer: writerOf(fields),
    notes: `whole-object JSON.parse error: "${part.parseErr}". ${noteExtra}`,
  };
}

bad_lines.push(singleObjectEntry(553, "unescaped_body",
  'Body value contains a literal unescaped `"` pair around `"tower ask"` (should be `\\"tower ask\\"`); parser treats the body string as ending there, then errors on trailing content. id/ts/cwd/type/from/topic sit before body and parse cleanly via regex.'));

bad_lines.push(singleObjectEntry(2113, "invalid_escape",
  'Body contains a literal `\\-` sequence (backslash immediately followed by a hyphen, inside a described regex/replace() snippet) — not a legal JSON escape (only " \\\\ / b f n r t u are legal after a backslash). id/ts/cwd/type/from/topic sit before body and parse cleanly.'));

// --- Concatenated rows: 2502,2504,2507,2511,2513,2514,2515,2516,2521,2523,2525,2527,2530,2542,2556,2559,2569,2571,2573,2574,2577 ---
const CONCAT_LINES = [2502, 2504, 2507, 2511, 2513, 2514, 2515, 2516, 2521, 2523, 2525, 2527, 2530, 2542, 2556, 2559, 2569, 2571, 2573, 2574, 2577];
for (const lineNo of CONCAT_LINES) {
  const content = lines[lineNo - 1];
  const parts = splitConcatenated(content);
  const objectParts = parts.filter(p => p.kind === "object");
  const sepParts = parts.filter(p => p.kind === "separator");
  if (objectParts.length < 2) throw new Error(`line ${lineNo}: expected >=2 concatenated objects, found ${objectParts.length}`);

  const seps = sepParts.map(s => ({ chars: s.text, byte_len: Buffer.byteLength(s.text, "utf8"), codepoints: [...s.text].map(ch => ch.codePointAt(0)) }));
  const allSepsAreBareN = seps.every(s => s.chars === "n");

  // extractable = the FIRST object's fields (matches bus-data/INVENTORY.json convention)
  const firstFields = fieldsOf(objectParts[0]);
  const objSummaries = objectParts.map((p, idx) => ({
    index: idx,
    byte_len: Buffer.byteLength(p.text, "utf8"),
    parses_standalone: p.parses,
    parseErr: p.parseErr,
    fields: fieldsOf(p),
  }));

  const brokenPart1 = !objectParts[0].parses;
  let notes = `${objectParts.length} JSON objects concatenated on one physical line; separator between them is a bare "${seps[0]?.chars}" (codepoint(s) ${seps[0]?.codepoints}) — consistent with a "\\n" that lost its backslash. ` +
    `Object 1: ${writerOf(objSummaries[0].fields)} (${objSummaries[0].fields.topic?.read ?? "?"}). ` +
    objSummaries.slice(1).map((o, i) => `Object ${i + 2}: ${writerOf(o.fields)} (${o.fields.topic?.read ?? "?"}).`).join(" ");
  if (!allSepsAreBareN) notes += ` DISAGREES WITH ORCH SPOT-CHECK ASSUMPTION: not every separator on this line is a bare "n" — see separators list.`;
  if (brokenPart1) notes += ` ADDITIONAL DEFECT beyond concatenation: object 1 itself fails to parse standalone (${objSummaries[0].parseErr}) — it has its own internal unescaped-quote defect (same disease as line 553), independent of the concatenation. This is NOT captured by bus-data/INVENTORY.json's "concatenated_objects" label for this line.`;

  bad_lines.push({
    line: lineNo,
    damage_class: "concatenated_objects",
    raw_byte_len: Buffer.byteLength(content, "utf8"),
    extractable: firstFields,
    recoverable: true,
    writer: objSummaries.map(o => writerOf(o.fields)).join(" + "),
    separators: seps,
    objects: objSummaries.map(o => ({ writer: writerOf(o.fields), topic: o.fields.topic?.read, byte_len: o.byte_len, parses_standalone: o.parses_standalone })),
    notes,
  });

  if (brokenPart1) {
    diffs.push({ line: lineNo, disagreement: "bus-data/INVENTORY.json records only 'concatenated_objects'; object 1 on this line ALSO has an internal unescaped-quote defect (fails to JSON.parse standalone) independent of the concatenation — two compounding defects, not one." });
  }
}

// --- Reconcile against prior inventory ---
const PRIOR_CLASSES = {
  1: "non_json_text", 2: "non_json_text", 3: "truncated",
  553: "unescaped_body", 2113: "invalid_escape",
  2502: "concatenated_objects", 2504: "concatenated_objects", 2507: "concatenated_objects",
  2511: "concatenated_objects", 2513: "concatenated_objects", 2514: "concatenated_objects",
  2515: "concatenated_objects", 2516: "concatenated_objects", 2521: "concatenated_objects",
  2523: "concatenated_objects", 2525: "concatenated_objects", 2527: "concatenated_objects",
  2530: "concatenated_objects", 2542: "concatenated_objects", 2556: "concatenated_objects",
  2559: "concatenated_objects", 2569: "concatenated_objects", 2571: "concatenated_objects",
  2573: "concatenated_objects", 2574: "concatenated_objects", 2577: "concatenated_objects",
};
for (const entry of bad_lines) {
  if (PRIOR_CLASSES[entry.line] !== entry.damage_class) {
    diffs.push({ line: entry.line, disagreement: `damage_class differs: prior=${PRIOR_CLASSES[entry.line]} ours=${entry.damage_class}` });
  }
}
bad_lines.sort((a, b) => a.line - b.line);

const histogram = {};
for (const e of bad_lines) histogram[e.damage_class] = (histogram[e.damage_class] || 0) + 1;

const out = {
  meta: {
    board_path: BOARD,
    inventoried_at: new Date().toISOString(),
    line_count: lines.length,
    sha256,
    byte_length: buf.length,
  },
  agreement_with_bus_data_inventory: {
    same_26_line_numbers: true,
    same_damage_class_per_line_except: diffs.length ? diffs : "none — full agreement on damage_class for all 26 lines",
    note: "bus-data/INVENTORY.json omits `writer`, the exact separator bytes, and (for the concatenated rows) does not check whether object 1 itself independently fails to parse. This inventory adds all three.",
  },
  histogram,
  bad_lines,
  parse_summary: { total_nonempty, ok, bad_count: bad },
};

writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n");
console.log("wrote", OUT);
console.log("bad_count:", bad, "diffs:", diffs.length);
