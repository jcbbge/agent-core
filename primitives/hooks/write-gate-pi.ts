/**
 * write-gate-pi — pi port of the Tower write-gate (canonical gate logic
 * stays in ONE place: ~/.tower/hooks/write-gate.mjs; this adapter only
 * translates the harness surface).
 *
 * pi has no blocking stop surface (`agent_end` is observational), but
 * `pi.sendUserMessage()` "always triggers a turn" — so an unreleased claim
 * turns the end of the loop into an injected continuation carrying the
 * exact release command. Same semantics as the CC exit-2 refusal; the
 * gate's own 3-refusal audited bypass caps the loop.
 *
 * Identity: $TOWER_FROM or $HERDR_PANE_ID (resolved inside the gate).
 * No identity → the gate no-ops, so ad-hoc terminal pi is untouched.
 * Kill switch: TOWER_WRITE_GATE=off. Fail open on every error.
 *
 * Deployed as a shim: ~/.pi/agent/extensions/write-gate.ts re-exports this
 * file (slim-rewrite pattern — one source of truth).
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { spawnSync } from "node:child_process";
import { homedir } from "node:os";

const GATE = `${homedir()}/.tower/hooks/write-gate.mjs`;

export default function (pi: ExtensionAPI) {
  pi.on("agent_end", async (_event, ctx) => {
    try {
      if (process.env.TOWER_WRITE_GATE === "off") return;
      const sessionId =
        (ctx as { sessionManager?: { getSessionFile?: () => string | undefined } })
          .sessionManager?.getSessionFile?.() ?? "pi-unknown";
      const evt = JSON.stringify({
        cwd: process.cwd(),
        session_id: sessionId,
        stop_hook_active: false,
      });
      const r = spawnSync("bun", [GATE], {
        input: evt,
        encoding: "utf-8",
        timeout: 10_000,
      });
      const stderr = (r.stderr ?? "").trim();
      if (r.status === 2 && stderr) {
        pi.sendUserMessage(stderr, { deliverAs: "followUp" });
      }
    } catch {
      /* fail open */
    }
  });
}
