import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { spawnSync } from "child_process";

/**
 * RTK rewrite extension for pi.
 *
 * Intercepts bash tool calls and rewrites commands through `rtk rewrite`
 * before execution — identical to what the Claude Code / OpenCode hooks do.
 *
 * rtk binary: ~/.local/bin/rtk (v0.34.3+)
 */

const RTK_BIN = `${process.env.HOME}/.local/bin/rtk`;

// ── Allowlist guard (2026-08-11, audit P0-1) ────────────────────────────────
// rtk 0.34.3 corrupts several rewrite shapes (multi-file cat→read, diff false
// "identical", find silent 0-results, grep -c, head -N short reads; upstream
// #3469/#1849/#2861/#2487 still open at v0.45.0). Only verbs measured
// lossless/acceptable pass through; everything else runs raw. Keep in lockstep
// with the guard in rtk-rewrite.sh.
const ALLOWED_REWRITE = /^rtk (ls|ps|wc|df|git (status|log))\b/;
const BLOCKED_ORIGINAL = /[|;&`]|\$\(|--porcelain|--format|--pretty/;
function allowlisted(orig: string, rew: string): boolean {
  return ALLOWED_REWRITE.test(rew) && !BLOCKED_ORIGINAL.test(orig);
}

function rtkAvailable(): boolean {
  const result = spawnSync(RTK_BIN, ["--version"], { stdio: "ignore" });
  return result.status === 0;
}

function rewrite(command: string): string {
  // rtk rewrite exits 0 + prints rewritten command if supported, exits 1 if no rewrite.
  const result = spawnSync(RTK_BIN, ["rewrite", command], {
    encoding: "utf8",
    timeout: 2000,
  });
  if (result.status !== 0 || !result.stdout) return command;
  const out = result.stdout.trim();
  return out.length > 0 ? out : command;
}

export default function (pi: ExtensionAPI) {
  if (!rtkAvailable()) {
    console.warn("[rtk-rewrite] rtk not found at", RTK_BIN, "— extension disabled");
    return;
  }

  pi.on("tool_call", async (event, _ctx) => {
    if (event.toolName !== "bash") return undefined;

    const original = event.input.command as string;
    if (!original) return undefined;

    const rewritten = rewrite(original);
    if (rewritten !== original && allowlisted(original, rewritten)) {
      event.input.command = rewritten;
    }

    return undefined;
  });
}
