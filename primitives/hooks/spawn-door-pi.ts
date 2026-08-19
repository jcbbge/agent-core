/**
 * spawn-door-pi — pi port of spawn-door.sh (identical law, tool_call
 * surface): raw fleet-mutating herdr verbs are refused via
 * `{ block: true, reason }` and pointed at their door. Messages, bypass,
 * and quote-stripping are kept in lockstep with spawn-door.sh.
 *
 * Deployed as a shim: ~/.pi/agent/extensions/spawn-door.ts re-exports this
 * file (slim-rewrite pattern — one source of truth).
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { spawn } from "node:child_process";
import { homedir } from "node:os";

const DENY_START =
  "raw 'herdr agent start' is closed. Spawn through the door: ~/muster/bin/muster-spawn (orch|worker|fanout|prompt); compatibility name ~/bin/spine-spawn. Docs: ~/muster/docs/agent-spawn-sop.md. Deliberate low-level need: prefix SPAWN_DOOR=off (audited).";
const DENY_CLOSE =
  "raw 'herdr workspace close' is closed. Close only at Done or Parked-on-disk — see control-flow.md and the herdr skill. Diagnosis is not Land. Deliberate low-level need: prefix SPAWN_DOOR=off (audited).";

/** Flatten newlines FIRST (quote pairs spanning heredoc lines mis-pair
 *  otherwise — caught live 2026-08-14), then strip quoted segments so
 *  doc-greps and commit messages never match. */
function stripQuoted(cmd: string): string {
  return cmd
    .replace(/\n/g, " ")
    .replace(/'[^']*'/g, "")
    .replace(/"[^"]*"/g, "");
}

function auditBypass(cmd: string): void {
  try {
    spawn(
      "bun",
      [
        `${homedir()}/.tower/cli.mjs`,
        "post",
        "note",
        "house/spawn-door",
        `bypass: ${cmd.slice(0, 160)}`,
        "--from",
        "spawn-door",
      ],
      { stdio: "ignore", detached: true },
    ).unref();
  } catch {
    /* audit is best-effort */
  }
}

export default function (pi: ExtensionAPI) {
  pi.on("tool_call", async (event, _ctx) => {
    if (event.toolName !== "bash") return;
    const cmd = (event.input as { command?: string })?.command ?? "";
    if (!cmd) return;

    if (cmd.includes("SPAWN_DOOR=off")) {
      auditBypass(cmd);
      return;
    }

    const s = stripQuoted(cmd);
    let reason = "";
    if (s.includes("herdr agent start")) reason = DENY_START;
    else if (s.includes("herdr workspace close")) reason = DENY_CLOSE;
    if (!reason) return;

    return { block: true, reason };
  });
}
