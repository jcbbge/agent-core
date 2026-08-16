#!/usr/bin/env bun
// Read-only inventory of the damaged board.jsonl lines. Never writes to board.jsonl.
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

const BOARD = "/Users/jrg/.tower/board.jsonl";
const TARGET_LINES = [1, 2, 3, 553, 2113, 2502, 2504, 2507, 2511, 2513, 2514, 2515, 2516, 2521, 2523, 2525, 2527, 2530, 2542, 2556, 2559, 2569, 2571, 2573, 2574, 2577];

const buf = readFileSync(BOARD);
const sha256 = createHash("sha256").update(buf).digest("hex");
const text = buf.toString("utf8");
// split preserving exact line content; a trailing final newline yields one trailing empty string
const rawLines = text.split("\n");
const hasTrailingNewline = rawLines[rawLines.length - 1] === "";
const lines = hasTrailingNewline ? rawLines.slice(0, -1) : rawLines;

let ok = 0, bad = 0, total_nonempty = 0;
const badLineSet = new Set(TARGET_LINES);
const badFound = [];
for (let i = 0; i < lines.length; i++) {
  const lineNo = i + 1;
  const content = lines[i];
  if (content.length === 0) continue;
  total_nonempty++;
  try {
    JSON.parse(content);
    ok++;
  } catch (e) {
    bad++;
    badFound.push(lineNo);
  }
}

const report = {
  meta: {
    board_path: BOARD,
    inventoried_at: new Date().toISOString(),
    line_count_wc: lines.length,
    total_nonempty,
    sha256,
    byte_length: buf.length,
  },
  parse_summary: { total_nonempty, ok, bad_count: bad },
  bad_lines_found: badFound,
  target_matches_found: badFound.length === TARGET_LINES.length && TARGET_LINES.every(l => badFound.includes(l)),
};

console.log(JSON.stringify(report, null, 2));

// Now dump each target line's raw bytes (as JSON-string-escaped) + byte length for detailed analysis
const detail = {};
for (const lineNo of TARGET_LINES) {
  const content = lines[lineNo - 1];
  const byteLen = Buffer.byteLength(content, "utf8");
  detail[lineNo] = {
    raw_byte_len: byteLen,
    content_json_escaped: JSON.stringify(content),
  };
}
console.error("---DETAIL---");
console.error(JSON.stringify(detail, null, 2));
