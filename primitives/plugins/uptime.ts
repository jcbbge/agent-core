/**
 * Uptime Extension
 *
 * Adds a /uptime command that displays how long the current session has been running.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
	let sessionStart = Date.now();

	pi.on("session_start", () => {
		sessionStart = Date.now();
	});

	pi.registerCommand("uptime", {
		description: "Show how long the current session has been running",
		handler: async (_args, ctx) => {
			const elapsed = Date.now() - sessionStart;
			const seconds = Math.floor(elapsed / 1000) % 60;
			const minutes = Math.floor(elapsed / 60000) % 60;
			const hours = Math.floor(elapsed / 3600000);

			const parts: string[] = [];
			if (hours > 0) parts.push(`${hours}h`);
			if (minutes > 0) parts.push(`${minutes}m`);
			parts.push(`${seconds}s`);

			const uptime = parts.join(" ");
			ctx.ui.notify(`Session uptime: ${uptime}`, "info");
			ctx.ui.setStatus("uptime", `⏱ ${uptime}`);
		},
	});
}
