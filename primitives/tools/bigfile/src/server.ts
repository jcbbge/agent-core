#!/usr/bin/env bun
/**
 * bigfile MCP server — navigate huge source files without emitting them.
 *
 * Exposes 7 tools. State is a per-process cache keyed by absolute path +
 * mtime, so `bigfile_load` parses once and every subsequent call is O(1).
 *
 *   bigfile_load     — parse + cache; returns quick summary
 *   bigfile_stats    — line/byte/symbol counts + 10 largest symbols
 *   bigfile_symbols  — list symbols (optionally filtered)
 *   bigfile_peek     — return one symbol's body or a line range (capped)
 *   bigfile_grep     — regex search; each hit tagged with its enclosing symbol
 *   bigfile_context  — reverse lookup: what am I inside at line N?
 *   bigfile_slice    — bounded raw line-range read (up to 400 lines)
 *
 * Languages (v1): PHP, JavaScript, TypeScript, TSX.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { bigfile } from "./bigfile.js";

const server = new Server(
	{ name: "bigfile", version: "0.1.0" },
	{ capabilities: { tools: {} } },
);

const tools = [
	{
		name: "bigfile_load",
		description:
			"Parse a huge source file into the server cache (tree-sitter) and return a quick summary. Cheap to call — subsequent bigfile_* calls hit the cache. USE THIS FIRST for any file over ~3000 lines instead of Read. Supported: .php .js .mjs .cjs .jsx .ts .tsx .phtml",
		inputSchema: {
			type: "object",
			required: ["path"],
			properties: {
				path: { type: "string", description: "Absolute or CWD-relative path to the file." },
			},
		},
	},
	{
		name: "bigfile_stats",
		description: "Return line count, byte count, symbol count, language, and the 10 largest symbols (name, kind, lines).",
		inputSchema: {
			type: "object",
			required: ["path"],
			properties: { path: { type: "string" } },
		},
	},
	{
		name: "bigfile_symbols",
		description:
			"List symbols in the file. Optionally filter by kind (class|interface|trait|enum|function|method|type|namespace|const) or by name substring.",
		inputSchema: {
			type: "object",
			required: ["path"],
			properties: {
				path: { type: "string" },
				kind: { type: "string", description: "Filter to one symbol kind." },
				name_contains: { type: "string", description: "Case-insensitive substring match on symbol name." },
				min_lines: { type: "number", description: "Only return symbols with body >= N lines." },
				limit: { type: "number", description: "Max results (default 200)." },
			},
		},
	},
	{
		name: "bigfile_peek",
		description:
			"Return the body of ONE symbol, or a bounded line range. Reference symbols by name ('validate'), qualified ('OrderService.validate'), or PHP-style ('Namespace\\\\Class::method'). Output is capped at 400 lines.",
		inputSchema: {
			type: "object",
			required: ["path"],
			properties: {
				path: { type: "string" },
				symbol: { type: "string", description: "Symbol reference. Mutually exclusive with start/end." },
				start: { type: "number", description: "1-indexed start line." },
				end: { type: "number", description: "1-indexed end line (inclusive)." },
			},
		},
	},
	{
		name: "bigfile_grep",
		description:
			"Regex search inside the file. Each hit includes the enclosing symbol path, so you know WHERE the match lives, not just which line. Returns up to 200 hits.",
		inputSchema: {
			type: "object",
			required: ["path", "pattern"],
			properties: {
				path: { type: "string" },
				pattern: { type: "string", description: "JS regex source or a literal string." },
				case_sensitive: { type: "boolean", description: "Default false." },
				limit: { type: "number", description: "Max hits (default 50, max 200)." },
			},
		},
	},
	{
		name: "bigfile_context",
		description: "Reverse lookup: at line N, what symbol path am I inside? Returns the enclosing symbol chain.",
		inputSchema: {
			type: "object",
			required: ["path", "line"],
			properties: {
				path: { type: "string" },
				line: { type: "number" },
			},
		},
	},
	{
		name: "bigfile_slice",
		description: "Return a raw line-range slice (no parsing). Bounded to 400 lines. Prefer bigfile_peek(symbol) when possible.",
		inputSchema: {
			type: "object",
			required: ["path", "start", "end"],
			properties: {
				path: { type: "string" },
				start: { type: "number" },
				end: { type: "number" },
			},
		},
	},
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

function ok(data: unknown) {
	const text = typeof data === "string" ? data : JSON.stringify(data, null, 2);
	return { content: [{ type: "text" as const, text }] };
}
function err(message: string) {
	return { content: [{ type: "text" as const, text: `ERROR: ${message}` }], isError: true };
}

server.setRequestHandler(CallToolRequestSchema, async (req) => {
	const { name, arguments: args } = req.params;
	const a = (args ?? {}) as Record<string, any>;
	try {
		switch (name) {
			case "bigfile_load": {
				const f = bigfile.load(a.path);
				return ok({ path: f.path, lang: f.lang, lines: f.lines, symbols: f.symbols.length });
			}
			case "bigfile_stats": {
				return ok(bigfile.load(a.path).stats);
			}
			case "bigfile_symbols": {
				const f = bigfile.load(a.path);
				let syms = f.symbols;
				if (a.kind) syms = syms.filter((s) => s.kind === a.kind);
				if (a.name_contains) {
					const needle = String(a.name_contains).toLowerCase();
					syms = syms.filter((s) => s.name.toLowerCase().includes(needle));
				}
				if (typeof a.min_lines === "number") syms = syms.filter((s) => s.lines >= a.min_lines);
				const limit = Math.min(a.limit ?? 200, 500);
				return ok(
					syms.slice(0, limit).map((s) => ({
						kind: s.kind,
						name: s.name,
						qualified: s.path.concat(s.name).join("."),
						line: s.line,
						endLine: s.endLine,
						lines: s.lines,
					})),
				);
			}
			case "bigfile_peek": {
				const f = bigfile.load(a.path);
				if (a.symbol) return ok(f.peek(a.symbol));
				if (typeof a.start === "number") return ok(f.peek(a.start, a.end));
				return err("bigfile_peek requires either `symbol` or `start` (with optional `end`).");
			}
			case "bigfile_grep": {
				const f = bigfile.load(a.path);
				return ok(
					f.grep(a.pattern, {
						limit: a.limit,
						caseSensitive: a.case_sensitive === true,
					}),
				);
			}
			case "bigfile_context": {
				const f = bigfile.load(a.path);
				return ok(f.context(a.line));
			}
			case "bigfile_slice": {
				const f = bigfile.load(a.path);
				return ok(f.slice(a.start, a.end));
			}
			default:
				return err(`Unknown tool: ${name}`);
		}
	} catch (e) {
		return err(e instanceof Error ? e.message : String(e));
	}
});

async function main() {
	const transport = new StdioServerTransport();
	await server.connect(transport);
	// stderr only — stdout is the MCP transport
	console.error(`[bigfile-mcp] ready. Supported: ${bigfile.supported().join(" ")}`);
}

main().catch((e) => {
	console.error("[bigfile-mcp] fatal:", e);
	process.exit(1);
});
