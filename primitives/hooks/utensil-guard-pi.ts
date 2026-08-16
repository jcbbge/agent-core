/**
 * utensil-guard-pi — pi port of utensil-guard.mjs (identical law, tool_call
 * surface). Blocks Read of huge PHP/JS/TS files, NL Grep, sleep-polls, and
 * transcript-dir greps. Bypass: UTENSIL_GUARD=off. Fail-open: return
 * undefined on error.
 *
 * Deployed as a shim: ~/.pi/agent/extensions/utensil-guard.ts re-exports this
 * file (spawn-door pattern — one source of truth).
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { extname } from "node:path";

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

function lineCount(filePath: string): number {
  try {
    const st = statSync(filePath);
    if (!st.isFile() || st.size < HUGE) return 0;
    const r = spawnSync("wc", ["-l", filePath], { encoding: "utf8", timeout: 2000 });
    if (r.status !== 0 || !r.stdout) return 0;
    return parseInt(r.stdout.trim().split(/\s+/)[0], 10) || 0;
  } catch {
    return 0;
  }
}

function isNlQuery(pattern: string): boolean {
  const p = pattern.trim();
  if (!p.includes(" ")) return false;
  if (/[.*+?^${}()|[\]\\]/.test(p)) return false;
  return p.split(/\s+/).length >= 2 && p.length >= 8;
}

function isBareSleep(cmd: string): boolean {
  return /^\s*sleep\s+\d+[smh]?\s*$/.test(cmd);
}

function isSleepPoll(cmd: string): boolean {
  const flat = cmd.replace(/\n/g, " ");
  if (/\bsleep\s+\d+/.test(flat) && /\bwhile\b/.test(flat)) return true;
  if (
    /\bfor\s+\w+\s+in\b/.test(flat) &&
    /\bsleep\s+\d+/.test(flat) &&
    /\bherdr pane get\b/.test(flat)
  )
    return true;
  return false;
}

function isTranscriptGrep(cmd: string): boolean {
  if (!/\b(rg|grep)\b/.test(cmd) || /\bpickbrain\b/.test(cmd)) return false;
  return (
    cmd.includes(".claude/projects") ||
    cmd.includes(".pi/agent/sessions") ||
    cmd.includes("agent-transcripts") ||
    cmd.includes(".cursor/projects")
  );
}

export default function (pi: ExtensionAPI) {
  pi.on("tool_call", async (event, _ctx) => {
    try {
      const name = event.toolName ?? "";
      const input = (event.input ?? {}) as Record<string, unknown>;
      const cmd = String(input.command ?? "");
      if (process.env.UTENSIL_GUARD === "off" || cmd.includes("UTENSIL_GUARD=off"))
        return;

      if (name === "read") {
        const filePath = String(input.file_path ?? input.path ?? "");
        const ext = extname(filePath).toLowerCase();
        if (CODE_EXT.has(ext)) {
          const n = lineCount(filePath);
          if (n >= HUGE) {
            return {
              block: true,
              reason:
                `File is ${n} lines (${ext}). Do not Read the body. Use bigfile: ` +
                `the bigfile MCP/library (load → symbols/grep/peek, 400-line cap). Path: ${filePath}`,
            };
          }
        }
      }

      if (name === "grep" && isNlQuery(String(input.pattern ?? input.query ?? input.search ?? ""))) {
        const pattern = String(input.pattern ?? input.query ?? input.search ?? "");
        return {
          block: true,
          reason: `That Grep pattern is natural language, not a regex. Run: colgrep ${JSON.stringify(pattern)}`,
        };
      }

      if (name === "bash" && cmd) {
        if (isBareSleep(cmd) || isSleepPoll(cmd)) {
          return {
            block: true,
            reason:
              "Do not sleep-poll. Use latch: `latch wait --pane <id> --until done --until idle --timeout 30m` (or --file / --board).",
          };
        }
        if (isTranscriptGrep(cmd)) {
          return {
            block: true,
            reason:
              'That is a session-transcript search. Run: pickbrain "<what you are recalling>" (past sessions, not source).',
          };
        }
        const m = cmd.match(/\b(?:rg|grep)\s+['"]([^'"]+)['"]/);
        if (m && isNlQuery(m[1]) && !/\bcolgrep\b/.test(cmd)) {
          return {
            block: true,
            reason: `Natural-language search. Run: colgrep ${JSON.stringify(m[1])}`,
          };
        }
      }
    } catch {
      return;
    }
  });
}
