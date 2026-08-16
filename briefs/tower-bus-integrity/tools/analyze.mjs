#!/usr/bin/env bun
// Read-only forensic analysis of the 26 damaged board.jsonl lines.
// Never writes to board.jsonl. Splits concatenated JSON objects via a
// brace/string-aware scanner (not regex-on-separator), extracts fields,
// and captures bun's real JSON.parse error message per line/part.
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";

const BOARD = "/Users/jrg/.tower/board.jsonl";
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

// Brace/string-aware scanner: finds the extent of one JSON object starting
// at index `start` (must be '{'). Returns end index (exclusive, just past
// the matching '}') or -1 if never balances before EOF, or -2 if an
// unterminated/invalid string prevents balancing.
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
    else if (c === "}") {
      depth--;
      if (depth === 0) return j + 1;
    }
  }
  return inString ? -2 : -1;
}

function splitConcatenated(content) {
  const parts = [];
  let i = 0;
  while (i < content.length) {
    while (i < content.length && /\s/.test(content[i])) i++;
    if (i >= content.length) break;
    if (content[i] !== "{") {
      parts.push({ kind: "leftover", text: content.slice(i) });
      break;
    }
    const start = i;
    const end = findObjectEnd(content, start);
    if (end < 0) {
      parts.push({ kind: end === -2 ? "unterminated_string_from_here" : "unbalanced_from_here", text: content.slice(start) });
      break;
    }
    const objStr = content.slice(start, end);
    let parsed = null, parseErr = null;
    try { parsed = JSON.parse(objStr); } catch (e) { parseErr = e.message; }
    parts.push({ kind: "object", text: objStr, parses: parseErr === null, parseErr, parsed });
    // capture separator bytes up to next '{'
    let k = end;
    while (k < content.length && content[k] !== "{") k++;
    const sep = content.slice(end, k);
    if (sep.length > 0) {
      parts.push({ kind: "separator", text: sep, bytes: [...sep].map(ch => ch.codePointAt(0)) });
    }
    i = k;
  }
  return parts;
}

function extractFields(obj) {
  if (!obj || typeof obj !== "object") return {};
  const out = {};
  for (const f of ["id", "ts", "from", "topic", "cwd", "type"]) {
    if (obj[f] !== undefined) out[f] = obj[f];
  }
  return out;
}

const CRED_RE = /srt:[0-9a-f]{32}/g;
function redact(s) {
  if (typeof s !== "string") return s;
  return s.replace(CRED_RE, "srt:REDACTED");
}

const results = {};
for (const lineNo of TARGET_LINES) {
  const content = lines[lineNo - 1];
  const byteLen = Buffer.byteLength(content, "utf8");
  let wholeErr = null;
  try { JSON.parse(content); } catch (e) { wholeErr = e.message; }
  const parts = splitConcatenated(content);
  results[lineNo] = {
    raw_byte_len: byteLen,
    starts_with_brace: content[0] === "{",
    whole_line_parse_error: wholeErr,
    parts: parts.map(p => {
      if (p.kind === "object") {
        return {
          kind: "object",
          byte_len: Buffer.byteLength(p.text, "utf8"),
          parses: p.parses,
          parseErr: p.parseErr,
          fields: p.parses ? Object.fromEntries(Object.entries(extractFields(p.parsed)).map(([k, v]) => [k, redact(v)])) : undefined,
          preview: redact(p.text.slice(0, 140)),
        };
      }
      if (p.kind === "separator") {
        return { kind: "separator", bytes: p.bytes, chars: p.text };
      }
      return { kind: p.kind, byte_len: Buffer.byteLength(p.text, "utf8"), preview: redact(p.text.slice(0, 160)), tail_preview: redact(p.text.slice(-80)) };
    }),
  };
}

writeFileSync("/tmp/analysis.json", JSON.stringify({
  meta: { line_count: lines.length, total_nonempty, sha256, byte_length: buf.length },
  parse_summary: { total_nonempty, ok, bad_count: bad },
  bad_found_matches_target: badFound.length === TARGET_LINES.length && TARGET_LINES.every(l => badFound.includes(l)),
  results,
}, null, 2));
console.log("wrote /tmp/analysis.json");
