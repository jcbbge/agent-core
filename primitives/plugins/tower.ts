/**
 * Tower Orchestration Extension
 * 
 * Fleet message bus for multi-agent coordination.
 * Wraps ~/.tower/cli.mjs for Pi integration.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { execSync } from "child_process";
import { Type } from "@sinclair/typebox";

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "tower",
    description: "Fleet orchestration control panel — check pending messages, open questions, blackboard, token burn. Use at turn start to see if subagents surfaced anything.",
    parameters: Type.Object({
      command: Type.Optional(Type.String({
        description: "Command: status (default), inbox, board, burn"
      }))
    }),
    execute: async ({ command = "status" }) => {
      try {
        const validCommands = ["status", "inbox", "board", "burn", "all"];
        const cmd = validCommands.includes(command) ? command : "status";
        
        const result = execSync(`bun ~/.tower/cli.mjs ${cmd}`, {
          encoding: "utf-8",
          cwd: process.cwd(),
          timeout: 10000
        });
        
        return result.trim() || "Tower clear.";
      } catch (err: any) {
        if (err.status === 1 && err.stdout) {
          return err.stdout.trim();
        }
        return `Tower error: ${err.message}`;
      }
    }
  });

  // Widget showing tower status
  pi.on("session_start", async (_event, ctx) => {
    if (ctx.mode !== "tui") return;
    
    try {
      const result = execSync("bun ~/.tower/cli.mjs status", {
        encoding: "utf-8",
        cwd: process.cwd(),
        timeout: 5000
      });
      
      const lines = result.trim().split("\n");
      const summary = lines.find(l => l.includes("unrelayed:")) || "";
      
      if (summary.includes("unrelayed: 0") && summary.includes("open questions: 0")) {
        // Silent when clear
        return;
      }
      
      // Show indicator when there's pending items
      ctx.ui.setWidget("tower", [ctx.ui.theme.fg("warning", "◆ tower pending")]);
    } catch {
      // Silent on error
    }
  });
}
