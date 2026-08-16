#!/usr/bin/env bun
/**
 * utensil-guard — PreToolUse door so pantry utensils actually run.
 * Canonical body. CC + cursor emit dual deny schemas (spawn-door pattern).
 * Fail-open on any parse/IO error. Bypass: UTENSIL_GUARD=off in the command
 * or the environment.
 *
 * Read  of 3k+ PHP/JS/TS/TSX  → bigfile MCP
 * Grep  natural-language query → colgrep
 * Shell bare sleep / sleep-poll → latch
 */
const fs = await import("node:fs");
const path = await import("node:path");
const { spawnSync } = await import("node:child_process");

const HUGE = 3000;
const CODE_EXT = new Set([
  ".php",
  ".phtml",
  ".js",
  ".mjs",
  ".cjs",
  ".jsx",
  ".ts",
  ".tsx",
]);

function failOpen() {
  process.exit(0);
}

function deny(reason) {
  const payload = {
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: reason,
    },
    permission: "deny",
    user_message: reason,
    agent_message: reason,
  };
  process.stdout.write(JSON.stringify(payload));
  process.exit(0);
}

function lineCount(filePath) {
  try {
    const st = fs.statSync(filePath);
    if (!st.isFile() || st.size < HUGE) return 0;
    const r = spawnSync("wc", ["-l", filePath], { encoding: "utf8", timeout: 2000 });
    if (r.status !== 0 || !r.stdout) return 0;
    return parseInt(r.stdout.trim().split(/\s+/)[0], 10) || 0;
  } catch {
    return 0;
  }
}

function isTranscriptGrep(cmd) {
  if (!/\b(rg|grep)\b/.test(cmd) || /\bpickbrain\b/.test(cmd)) return false;
  return (
    cmd.includes(".claude/projects") ||
    cmd.includes(".pi/agent/sessions") ||
    cmd.includes("agent-transcripts") ||
    cmd.includes(".cursor/projects")
  );
}

function isNlQuery(pattern) {
  if (!pattern || typeof pattern !== "string") return false;
  const p = pattern.trim();
  if (!p.includes(" ")) return false;
  if (/[.*+?^${}()|[\]\\]/.test(p)) return false;
  return p.split(/\s+/).length >= 2 && p.length >= 8;
}

function isBareSleep(cmd) {
  return /^\s*sleep\s+\d+[smh]?\s*$/.test(cmd);
}

function isSleepPoll(cmd) {
  const flat = cmd.replace(/\n/g, " ");
  if (/\bsleep\s+\d+/.test(flat) && /\bwhile\b/.test(flat)) return true;
  if (/\bfor\s+\w+\s+in\b/.test(flat) && /\bsleep\s+\d+/.test(flat) && /\bherdr pane get\b/.test(flat))
    return true;
  return false;
}

function decide(input) {
  const envOff =
    process.env.UTENSIL_GUARD === "off" ||
    String(input?.tool_input?.command ?? "").includes("UTENSIL_GUARD=off");
  if (envOff) return null;

  const tool = String(
    input.tool_name ?? input.toolName ?? input.tool ?? "",
  );
  const ti = input.tool_input ?? input.toolInput ?? input.input ?? {};
  const filePath = ti.file_path ?? ti.filePath ?? ti.path ?? input.path ?? "";
  const pattern = ti.pattern ?? ti.query ?? ti.search ?? "";
  const command = ti.command ?? ti.cmd ?? "";

  if (/^(Read|TabRead)$/i.test(tool) && filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (CODE_EXT.has(ext)) {
      const n = lineCount(filePath);
      if (n >= HUGE) {
        return (
          `File is ${n} lines (${ext}). Do not Read the body. Use bigfile MCP: ` +
          `bigfile_load → bigfile_symbols or bigfile_grep or bigfile_peek ` +
          `(400-line cap). Path: ${filePath}`
        );
      }
    }
  }

  if (/^Grep$/i.test(tool) && isNlQuery(pattern)) {
    return (
      `That Grep pattern is natural language, not a regex. Run: ` +
      `colgrep ${JSON.stringify(pattern)}`
    );
  }

  if (/^(Bash|Shell)$/i.test(tool) && command) {
    if (isBareSleep(command) || isSleepPoll(command)) {
      return (
        "Do not sleep-poll. Use latch: " +
        "`latch wait --pane <id> --until done --until idle --timeout 30m` " +
        "(or --file / --board). Exit 0 match, 3 timeout, 4 vanished."
      );
    }
    if (isTranscriptGrep(command)) {
      return (
        "That is a session-transcript search. Run: pickbrain \"<what you are recalling>\" " +
        "(past sessions, not source). vein mines CC/pi JSONL; pickbrain is the recall tool."
      );
    }
    const m = command.match(/\b(?:colgrep|rg|grep)\s+['"]([^'"]+)['"]/);
    if (m && isNlQuery(m[1]) && !/\bcolgrep\b/.test(command)) {
      return `Natural-language search. Run: colgrep ${JSON.stringify(m[1])}`;
    }
  }

  return null;
}

let raw = "";
try {
  raw = fs.readFileSync(0, "utf8");
} catch {
  failOpen();
}
if (!raw.trim()) failOpen();

let input;
try {
  input = JSON.parse(raw);
} catch {
  failOpen();
}

try {
  const reason = decide(input);
  if (reason) deny(reason);
} catch {
  failOpen();
}
failOpen();
