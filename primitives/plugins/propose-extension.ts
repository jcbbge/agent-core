/**
 * Propose Extension — Autophagic Tool Builder
 *
 * Lets the LLM agent propose new capabilities, but requires explicit human
 * approval via TUI before installing them. Consensual autonomy: the agent
 * writes tools, the human decides whether to install them.
 *
 * Strudel is the base: everything runs through strudel. Approved proposals are
 * written into strudel's pantry as a plugin primitive
 * (~/agent-core/primitives/plugins/<name>/index.ts) — NOT into pi's extension
 * dir. Pi stays vanilla and loads only strudel; strudel's pantry indexes and
 * surfaces the new capability on the next reload.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { getMarkdownTheme } from "@earendil-works/pi-coding-agent";
import { Key, Markdown, matchesKey, Text, wrapTextWithAnsi } from "@earendil-works/pi-tui";
import { access, mkdir, unlink, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { Type } from "typebox";

const NAME_PATTERN = /^[a-z0-9-]+$/;

export default function (pi: ExtensionAPI) {
	// Register the reload-runtime command (Pi handles duplicates with suffixes)
	pi.registerCommand("reload-runtime", {
		description: "Reload extensions, skills, prompts, and themes",
		handler: async (_args, ctx) => {
			await ctx.reload();
			return;
		},
	});

	pi.registerTool({
		name: "propose_extension",
		label: "Propose Extension",
		description:
			"Propose a new capability (a strudel pantry plugin) for user review and approval. Writes the code to a temp file, shows a TUI confirmation dialog, and installs it into ~/agent-core/primitives/plugins/<name>/index.ts (strudel's pantry) only if the user explicitly approves. Pi stays vanilla — strudel surfaces the new capability.",
		promptSnippet:
			"Propose a new capability as a strudel pantry plugin for user review and approval. The agent writes the code; the user decides whether to install it. Everything runs through strudel.",
		promptGuidelines: [
			"Use propose_extension when you identify a repeating friction point, capability gap, or workflow that would benefit from a persistent tool — not for one-off tasks.",
			"propose_extension code must be a complete, self-contained pi extension module: default export function receiving ExtensionAPI, with all imports, tool registrations, and event handlers included. It is installed as a plugin primitive in strudel's pantry (~/agent-core/primitives/plugins/<name>/index.ts), which strudel indexes and surfaces — it is NOT written to pi's extension dir.",
			"propose_extension requires the user's explicit approval before any code is installed — never assume acceptance.",
			"If propose_extension returns a collision error, choose a different name or ask the user if they want to replace the existing plugin.",
		],
		parameters: Type.Object({
			name: Type.String({
				description: "Plugin name without extension (e.g. db-inspector). Becomes plugins/<name>/index.ts in the strudel pantry. Must match /^[a-z0-9-]+$/.",
			}),
			description: Type.String({
				description: "What the extension does and why it was proposed.",
			}),
			code: Type.String({
				description: "The full TypeScript extension source code.",
			}),
		}),

		async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
			const { name, description, code } = params;

			// 1. Validate name
			if (!NAME_PATTERN.test(name)) {
				return {
					content: [
						{
							type: "text",
							text: `Invalid extension name "${name}". Must match /^[a-z0-9-]+$/ (lowercase letters, digits, hyphens only).`,
						},
					],
					details: { error: true, reason: "invalid_name" },
				};
			}

			// 2. Check for TUI mode
			if (ctx.mode !== "tui") {
				return {
					content: [
						{
							type: "text",
							text: "propose_extension requires interactive TUI mode for user consent.",
						},
					],
					details: { error: true, reason: "not_tui" },
				};
			}

			// 3. Check for collision in strudel's pantry (plugins/ kind dir)
			const pluginsDir = join(homedir(), "agent-core", "primitives", "plugins", name);
			const targetPath = join(pluginsDir, "index.ts");

			try {
				await access(targetPath);
				// Plugin already exists
				return {
					content: [
						{
							type: "text",
							text: `Collision: ~/agent-core/primitives/plugins/${name}/index.ts already exists in the strudel pantry. Choose a different name or ask the user about replacing it.`,
						},
					],
					details: { error: true, reason: "collision", path: targetPath },
				};
			} catch {
				// Does not exist — proceed
			}

			// 4. Write to temp file for inspection
			const tempPath = `/tmp/pi-proposal-${name}.ts`;
			await writeFile(tempPath, code, "utf8");

			// 5. Show TUI confirmation dialog
			const approved = await ctx.ui.custom<boolean>((tui, theme, _kb, done) => {
				let cachedLines: string[] | undefined;

				const mdTheme = getMarkdownTheme();
				const codeMarkdown = new Markdown("```typescript\n" + code + "\n```", 1, 0, mdTheme);

				function refresh() {
					cachedLines = undefined;
					tui.requestRender();
				}

				return {
					render(width: number): string[] {
						if (cachedLines) return cachedLines;

						const lines: string[] = [];
						const w = Math.max(1, width);

						// Top border in warning color
						lines.push(theme.fg("warning", "═".repeat(w)));

						// Title
						lines.push(theme.fg("warning", " ⚡ Extension Proposal"));
						lines.push("");

						// Extension name
						lines.push(" " + theme.fg("muted", "Name: ") + theme.fg("accent", name));
						lines.push("");

						// Description (word-wrapped)
						const descLines = wrapTextWithAnsi(description, Math.max(1, w - 2));
						for (const line of descLines) {
							lines.push(" " + line);
						}
						lines.push("");

						// Hint: temp file location
						const hint1 = `Full source: ${tempPath} — inspect in your editor before approving`;
						for (const line of wrapTextWithAnsi(theme.fg("dim", hint1), Math.max(1, w - 2))) {
							lines.push(" " + line);
						}
						lines.push("");

						// Hint: escape hatch
						const hint2 = `Escape hatch: rm -rf ~/agent-core/primitives/plugins/${name} && /reload`;
						for (const line of wrapTextWithAnsi(theme.fg("dim", hint2), Math.max(1, w - 2))) {
							lines.push(" " + line);
						}
						lines.push("");

						// Code preview section header
						lines.push(" " + theme.fg("muted", "Source preview:"));

						// Render markdown code block
						const codeLines = codeMarkdown.render(w);
						for (const line of codeLines) {
							lines.push(line);
						}

						lines.push("");

						// Navigation hint
						lines.push(
							" " +
								theme.fg("success", "y") +
								theme.fg("dim", "/") +
								theme.fg("success", "Enter") +
								theme.fg("dim", " approve  •  ") +
								theme.fg("warning", "n") +
								theme.fg("dim", "/") +
								theme.fg("warning", "Esc") +
								theme.fg("dim", " reject"),
						);

						// Bottom border
						lines.push(theme.fg("warning", "═".repeat(w)));

						cachedLines = lines;
						return lines;
					},
					invalidate() {
						cachedLines = undefined;
					},
					handleInput(data: string) {
						if (data === "y" || matchesKey(data, Key.enter)) {
							done(true);
						} else if (data === "n" || matchesKey(data, Key.escape)) {
							done(false);
						}
					},
				};
			});

			// 6. Handle rejection
			if (!approved) {
				try {
					await unlink(tempPath);
				} catch {
					// best-effort
				}
				return {
					content: [{ type: "text", text: "User rejected the proposal. Code discarded." }],
					details: { approved: false, name },
				};
			}

			// 7. Handle approval — write into strudel's pantry as a plugin primitive
			await mkdir(pluginsDir, { recursive: true });
			await writeFile(targetPath, code, "utf8");

			try {
				await unlink(tempPath);
			} catch {
				// best-effort
			}

			// Queue reload — strudel re-indexes the pantry and surfaces the new plugin
			pi.sendUserMessage("/reload-runtime", { deliverAs: "followUp" });

			return {
				content: [
					{
						type: "text",
						text: `User approved. Plugin '${name}' written to ~/agent-core/primitives/plugins/${name}/index.ts (strudel pantry) and reload queued.`,
					},
				],
				details: { approved: true, name, path: targetPath },
			};
		},

		renderCall(args, theme) {
			const name = typeof args.name === "string" ? args.name : "?";
			const desc = typeof args.description === "string" ? args.description : "";
			return new Text(
				theme.fg("toolTitle", theme.bold("propose_extension ")) +
					theme.fg("accent", name) +
					"  " +
					theme.fg("muted", desc),
				0,
				0,
			);
		},

		renderResult(result, _options, theme) {
			const details = result.details as { approved?: boolean; name?: string; error?: boolean; reason?: string } | undefined;
			const firstContent = result.content[0];
			const text = firstContent?.type === "text" ? firstContent.text : "";

			if (!details) {
				return new Text(theme.fg("error", text), 0, 0);
			}

			if (details.error) {
				return new Text(theme.fg("error", "✗ " + text), 0, 0);
			}

			if (details.approved === true) {
				return new Text(
					theme.fg("success", "✓ ") + theme.fg("success", `Installed: ${details.name}.ts — reload queued`),
					0,
					0,
				);
			}

			if (details.approved === false) {
				return new Text(theme.fg("warning", `✗ Rejected: ${details.name}`), 0, 0);
			}

			return new Text(theme.fg("muted", text), 0, 0);
		},
	});
}
