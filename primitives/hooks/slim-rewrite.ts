import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { spawnSync } from "child_process";

/**
 * slim rewrite extension for pi.
 *
 * Intercepts bash tool calls and rewrites commands through `slim rewrite`
 * (the 6-verb output compactor, ~/agent-core/primitives/tools/slim/),
 * allowlisted to the measured-safe verbs. Replaced the rtk pipeline
 * 2026-08-11 (rtk removed from the machine — no fallback). Keep the
 * allowlist in lockstep with the CC hook slim-guard.sh.
 */

const SLIM_BIN = `${process.env.HOME}/.local/bin/slim`;

const ALLOWED_REWRITE = /^slim (ls|ps|wc|df|git (status|log))\b/;
const BLOCKED_ORIGINAL = /[|;&`]|\$\(|--porcelain|--format|--pretty/;

function slimAvailable(): boolean {
  const result = spawnSync(SLIM_BIN, ["rewrite", "ls"], { stdio: "ignore" });
  return result.status === 0;
}

function rewrite(command: string): string {
  // slim rewrite: exit 0 + rewritten command if a rewrite exists, exit 1 if not.
  const result = spawnSync(SLIM_BIN, ["rewrite", command], {
    encoding: "utf8",
    timeout: 2000,
  });
  if (result.status !== 0 || !result.stdout) return command;
  const out = result.stdout.trim();
  return out.length > 0 ? out : command;
}

export default function (pi: ExtensionAPI) {
  if (!slimAvailable()) {
    console.warn("[slim-rewrite] slim not found at", SLIM_BIN, "— extension disabled");
    return;
  }

  pi.on("tool_call", async (event, _ctx) => {
    if (event.toolName !== "bash") return undefined;

    const original = event.input.command as string;
    if (!original) return undefined;

    const rewritten = rewrite(original);
    if (
      rewritten !== original &&
      ALLOWED_REWRITE.test(rewritten) &&
      !BLOCKED_ORIGINAL.test(original)
    ) {
      event.input.command = rewritten;
    }

    return undefined;
  });
}
