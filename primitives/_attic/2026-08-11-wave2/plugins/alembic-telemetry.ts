import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import * as http from "node:http";
import { Buffer } from "node:buffer";

export default function (pi: ExtensionAPI) {
  let isChecking = false;

  const checkAlembic = async (ctx: any) => {
    if (isChecking || ctx.mode !== "tui") return;
    isChecking = true;

    try {
      const isHealthy = await new Promise((resolve) => {
        const req = http.request({
          hostname: "127.0.0.1",
          port: 6000,
          path: "/sql",
          method: "POST",
          headers: {
            "Accept": "application/json",
            "surreal-ns": "agent_os",
            "surreal-db": "alembic",
            "Content-Type": "text/plain",
            "Authorization": "Basic " + Buffer.from(process.env.SURREALDB_AUTH || "root:surreal").toString("base64")
          },
          timeout: 2000
        }, (res) => {
          resolve(res.statusCode === 200);
        });
        
        req.on("error", () => resolve(false));
        req.on("timeout", () => { req.destroy(); resolve(false); });
        
        req.write("SELECT id FROM shard LIMIT 1;");
        req.end();
      });

      if (isHealthy) {
        // HEALTHY: Unambiguous but quiet presence
        ctx.ui.setWidget("alembic-telemetry", [ctx.ui.theme.fg("success", "● alembic")]);
      } else {
        // UNHEALTHY: Check Engine Light ON
        ctx.ui.setWidget("alembic-telemetry", [ctx.ui.theme.fg("error", "○ alembic disconnected")]);
      }
    } catch (err: any) {
      // UNREACHABLE: Check Engine Light ON with actual error
      ctx.ui.setWidget("alembic-telemetry", [ctx.ui.theme.fg("error", `○ alembic unreachable: ${err.message || err}`)]);
    } finally {
      isChecking = false;
    }
  };

  pi.on("session_start", async (_event, ctx) => {
    if (ctx.mode !== "tui") return;

    // Check immediately on boot
    await checkAlembic(ctx);

    // Poll every 3 minutes (180000ms) - completely out of the way
    const interval = setInterval(() => checkAlembic(ctx), 180000);

    // Clean up on shutdown
    pi.on("session_shutdown", () => {
      clearInterval(interval);
      if (ctx.mode === "tui") {
        ctx.ui.setWidget("alembic-telemetry", undefined);
      }
    });
  });
}