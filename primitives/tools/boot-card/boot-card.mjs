#!/usr/bin/env bun
// boot-card — standalone deep-audit of the Session Boundary Contract
// (~/agent-core/primitives/rules/session-lifecycle.md).
//
// The per-leg [boot] stamps each adapter appends at session start report
// only what that adapter itself did. This command is the other half: run
// on demand, it re-checks every leg's actual evidence from scratch —
// directive composition, registry health, Tower reachability, the git
// handoff, the flight snapshot pointer, the circadian probe, and each
// harness's own wiring — and prints one ✓/✗ line per check.
//
// SIDE-EFFECT-FREE by contract: every check either reads a file/directory
// or runs a command already documented elsewhere as a read-only probe
// (`bun cli.mjs status`, `CIRCADIAN_INTERNAL=1 bun wake.ts`). No board
// posts, no wake payload, no writes outside this process's own stdout.
//
//   boot-card [--harness pi|claude-code|cursor]
//
// Exit 0 when every check is ✓; exit 1 (failing checks also listed on
// stderr) otherwise.

import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const ROOT = process.env.AGENT_CORE_ROOT ?? join(homedir(), "agent-core");
const BUN = process.env.BUN_BIN_PATH ?? join(homedir(), ".bun", "bin", "bun");
const HOME = homedir();
const RULE = "━".repeat(49);
const OK = "✓";
const FAIL = "✗";

const HARNESSES = ["pi", "claude-code", "cursor"];

const ENTRYPOINT = {
  "claude-code": join(HOME, ".claude", "CLAUDE.md"),
  pi: join(HOME, ".pi", "agent", "AGENTS.md"),
  cursor: join(HOME, "AGENTS.md"),
};

function parseArgs(argv) {
  const out = { harness: undefined };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--harness") out.harness = argv[++i];
  }
  return out;
}

// Env signals first (reliable, cheap); if none fire, fall back to the
// most-recently-composed entrypoint as a last-resort guess — documented
// explicitly rather than silently defaulting to one harness.
function detectHarness() {
  if (process.env.CLAUDECODE === "1") return "claude-code";
  if (Object.keys(process.env).some((k) => k.startsWith("CURSOR_"))) return "cursor";
  if (process.env.PI_APP_NAME) return "pi";

  let newest;
  for (const [harness, path] of Object.entries(ENTRYPOINT)) {
    try {
      const mtime = statSync(path).mtimeMs;
      if (!newest || mtime > newest.mtime) newest = { harness, mtime };
    } catch {
      // entrypoint absent on this machine — not a candidate
    }
  }
  return newest?.harness ?? "claude-code";
}

function stripAnsi(s) {
  return s.replace(/\x1b\[[0-9;]*m/g, "");
}

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { encoding: "utf8", timeout: 10_000, ...opts });
  return { code: r.status ?? (r.error ? 1 : 0), stdout: r.stdout ?? "", stderr: r.stderr ?? "", error: r.error };
}

function checkDirective(harness) {
  const path = ENTRYPOINT[harness];
  if (!existsSync(path)) return { ok: false, reason: `missing (${path})` };
  const body = readFileSync(path, "utf8");
  if (!body.includes("<!-- agent-core: composed")) {
    return { ok: false, reason: `no composed marker in ${path}` };
  }
  return { ok: true, reason: `composed marker present (${path})` };
}

function checkRegistry() {
  const bin = join(ROOT, "cli", "zig-out", "bin", "agent-core");
  if (!existsSync(bin)) return { ok: false, reason: `binary missing (${bin})` };
  const r = run(bin, ["status"]);
  if (r.code !== 0) return { ok: false, reason: `agent-core status exited ${r.code}` };
  const summary = stripAnsi(r.stdout)
    .split("\n")
    .reverse()
    .find((l) => l.includes("ok") && l.includes("stale") && l.includes("missing"));
  if (!summary) return { ok: false, reason: "no summary line in agent-core status output" };
  const m = summary.match(/(\d+)\s+ok\s+(\d+)\s+stale\s+(\d+)\s+missing/);
  if (!m) return { ok: false, reason: `unparseable summary: ${summary.trim()}` };
  const [, ok, stale, missing] = m;
  if (stale !== "0" || missing !== "0") {
    return { ok: false, reason: `${ok} ok, ${stale} stale, ${missing} missing` };
  }
  return { ok: true, reason: `${ok} ok · 0 stale · 0 missing` };
}

function checkTower() {
  const cli = join(HOME, ".tower", "cli.mjs");
  if (!existsSync(cli)) return { ok: false, reason: `cli.mjs missing (${cli})` };
  const r = run(BUN, [cli, "status"]);
  if (r.code !== 0) return { ok: false, reason: `bun cli.mjs status exited ${r.code}` };
  return { ok: true, reason: "bun cli.mjs status exits 0" };
}

function checkHandoff(cwd) {
  let log;
  try {
    log = execFileSync("git", ["log", "--format=%h %s%n%b", "-5"], {
      cwd,
      stdio: ["ignore", "pipe", "ignore"],
    }).toString();
  } catch {
    return { ok: false, reason: "not a git repo (or no commits) here" };
  }
  const m = log.match(/^([0-9a-f]+ .+)$[\s\S]*?^TODO: (.+)$/m);
  if (m && m[2].trim() !== "—") {
    return { ok: true, reason: `TODO: ${m[2].trim()}` };
  }
  return { ok: true, reason: "none declared (TODO: —)" };
}

function checkFlight() {
  const dir = join(HOME, ".tower", "flight");
  if (!existsSync(dir)) return { ok: false, reason: `flight dir missing (${dir})` };
  const snaps = readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => ({ f, m: statSync(join(dir, f)).mtimeMs }))
    .sort((a, b) => b.m - a.m);
  if (snaps.length === 0) return { ok: false, reason: "no *.md snapshots" };
  const ageMs = Date.now() - snaps[0].m;
  const ageMin = Math.round(ageMs / 60_000);
  if (ageMs >= 24 * 60 * 60 * 1000) {
    return { ok: false, reason: `newest snapshot ${snaps[0].f} is stale (${ageMin}m old, >=24h)` };
  }
  return { ok: true, reason: `${snaps[0].f} (${ageMin}m ago)` };
}

function checkMemory() {
  const wake = join(HOME, "circadian", "src", "wake.ts");
  if (!existsSync(wake)) return { ok: false, reason: `wake.ts missing (${wake})` };
  const r = run(BUN, [wake], { env: { ...process.env, CIRCADIAN_INTERNAL: "1" } });
  if (r.code !== 0) return { ok: false, reason: `probe exited ${r.code}` };
  return { ok: true, reason: "CIRCADIAN_INTERNAL probe exits 0, silent" };
}

function checkWiring(harness) {
  if (harness === "claude-code") {
    const path = join(HOME, ".claude", "settings.json");
    if (!existsSync(path)) return { ok: false, reason: `missing (${path})` };
    const body = readFileSync(path, "utf8");
    const hasStart = body.includes("session-start.mjs");
    const hasWake = body.includes("wake.ts");
    if (hasStart && hasWake) return { ok: true, reason: "session-start.mjs + wake.ts in settings.json hooks" };
    const missing = [!hasStart && "session-start.mjs", !hasWake && "wake.ts"].filter(Boolean).join(", ");
    return { ok: false, reason: `missing from settings.json hooks: ${missing}` };
  }
  if (harness === "pi") {
    const dir = join(HOME, ".pi", "agent", "extensions");
    if (!existsSync(dir)) return { ok: false, reason: `extensions dir missing (${dir})` };
    const files = new Set(readdirSync(dir));
    const want = ["session-boundary.ts", "tower-auto.ts", "circadian-mind.ts"];
    const missing = want.filter((f) => !files.has(f));
    if (missing.length === 0) return { ok: true, reason: `${want.join(" + ")} present` };
    return { ok: false, reason: `missing from extensions/: ${missing.join(", ")}` };
  }
  if (harness === "cursor") {
    const path = join(HOME, ".cursor", "hooks.json");
    if (!existsSync(path)) return { ok: false, reason: `missing (${path})` };
    let hooks;
    try {
      hooks = JSON.parse(readFileSync(path, "utf8")).hooks ?? {};
    } catch {
      return { ok: false, reason: `${path} is not valid JSON` };
    }
    const want = ["sessionStart", "sessionEnd", "preCompact"];
    const missing = want.filter((k) => !Array.isArray(hooks[k]) || hooks[k].length === 0);
    if (missing.length === 0) return { ok: true, reason: `${want.join("/")} entries present in hooks.json` };
    return { ok: false, reason: `missing/empty in hooks.json: ${missing.join(", ")}` };
  }
  return { ok: false, reason: `unknown harness ${harness}` };
}

function main() {
  const { harness: explicit } = parseArgs(process.argv.slice(2));
  const harness = explicit ?? detectHarness();
  if (!HARNESSES.includes(harness)) {
    console.error(`boot-card: unknown harness "${harness}" (want ${HARNESSES.join("|")})`);
    process.exit(2);
  }

  const checks = [
    ["directive", () => checkDirective(harness)],
    ["registry", checkRegistry],
    ["tower", checkTower],
    ["handoff", () => checkHandoff(process.cwd())],
    ["flight", checkFlight],
    ["memory", checkMemory],
    ["wiring", () => checkWiring(harness)],
  ];

  const results = checks.map(([name, fn]) => {
    try {
      return [name, fn()];
    } catch (e) {
      return [name, { ok: false, reason: `threw: ${e?.message ?? e}` }];
    }
  });

  const label = "directive registry tower handoff flight memory wiring".split(" ");
  const width = Math.max(...label.map((l) => l.length));

  console.log(RULE);
  console.log(`BOOT CARD · ${harness} · ${new Date().toISOString().slice(0, 10)}`);
  console.log(RULE);
  for (const [name, r] of results) {
    const glyph = r.ok ? OK : FAIL;
    console.log(`${glyph} ${name.padEnd(width)}  ${r.reason}`);
  }
  console.log(RULE);
  const passed = results.filter(([, r]) => r.ok).length;
  console.log(`${passed}/${results.length} checks ✓`);

  const failed = results.filter(([, r]) => !r.ok);
  if (failed.length > 0) {
    console.error(`boot-card: ${failed.length} failing check(s): ${failed.map(([n]) => n).join(", ")}`);
    process.exit(1);
  }
  process.exit(0);
}

main();
