/**
 * bigfile — tree-sitter powered navigator for huge source files.
 *
 * Exposed inside the scratchpad as the global `bigfile`. The file is
 * parsed ONCE (cached by path+mtime) and lives in the sandbox. Only the
 * result of the agent's expression crosses back into agent context.
 *
 * Supported languages (v1): PHP, JavaScript, TypeScript, TSX.
 *
 * Design rules:
 *   - No verb ever returns the whole file.
 *   - Symbols are lightweight rows: { kind, name, line, endLine, lines, path[] }.
 *   - `peek` bounds output to at most MAX_PEEK_LINES.
 *   - `grep` returns hits tagged with their enclosing symbol path.
 */

import { readFileSync, statSync } from "node:fs";
import { extname, resolve } from "node:path";
import Parser from "tree-sitter";
import PHP from "tree-sitter-php";
import JavaScript from "tree-sitter-javascript";
import TS from "tree-sitter-typescript";

const MAX_PEEK_LINES = 400;
const MAX_GREP_HITS = 200;

type Lang = "php" | "javascript" | "typescript" | "tsx";

const LANG_BY_EXT: Record<string, Lang> = {
	".php": "php",
	".phtml": "php",
	".js": "javascript",
	".mjs": "javascript",
	".cjs": "javascript",
	".jsx": "javascript",
	".ts": "typescript",
	".tsx": "tsx",
};

const parsers = new Map<Lang, Parser>();
function getParser(lang: Lang): Parser {
	let p = parsers.get(lang);
	if (p) return p;
	p = new Parser();
	switch (lang) {
		case "php":
			// tree-sitter-php exports { php, php_only }
			p.setLanguage((PHP as any).php ?? PHP);
			break;
		case "javascript":
			p.setLanguage(JavaScript as any);
			break;
		case "typescript":
			p.setLanguage((TS as any).typescript);
			break;
		case "tsx":
			p.setLanguage((TS as any).tsx);
			break;
	}
	parsers.set(lang, p);
	return p;
}

// Node kinds that count as "symbols" per language.
const SYMBOL_KINDS: Record<Lang, Record<string, string>> = {
	php: {
		class_declaration: "class",
		interface_declaration: "interface",
		trait_declaration: "trait",
		enum_declaration: "enum",
		function_definition: "function",
		method_declaration: "method",
		namespace_definition: "namespace",
	},
	javascript: {
		class_declaration: "class",
		function_declaration: "function",
		method_definition: "method",
		generator_function_declaration: "function",
		lexical_declaration: "const", // filtered to arrow/function values below
		variable_declaration: "var",
	},
	typescript: {
		class_declaration: "class",
		interface_declaration: "interface",
		type_alias_declaration: "type",
		enum_declaration: "enum",
		function_declaration: "function",
		method_definition: "method",
		method_signature: "method",
		abstract_method_signature: "method",
		lexical_declaration: "const",
	},
	tsx: {
		class_declaration: "class",
		interface_declaration: "interface",
		type_alias_declaration: "type",
		enum_declaration: "enum",
		function_declaration: "function",
		method_definition: "method",
		lexical_declaration: "const",
	},
};

export interface Symbol {
	kind: string;
	name: string;
	line: number; // 1-indexed start
	endLine: number; // 1-indexed end
	lines: number; // endLine - line + 1
	path: string[]; // enclosing symbol names, outermost first
}

interface CachedFile {
	absPath: string;
	lang: Lang;
	mtimeMs: number;
	source: string;
	lineOffsets: number[]; // byte offset of each line start
	tree: Parser.Tree;
	symbols: Symbol[];
}

const cache = new Map<string, CachedFile>();

function detectLang(path: string): Lang {
	const ext = extname(path).toLowerCase();
	const lang = LANG_BY_EXT[ext];
	if (!lang) throw new Error(`bigfile: unsupported extension '${ext}'. Supported: ${Object.keys(LANG_BY_EXT).join(", ")}`);
	return lang;
}

function computeLineOffsets(src: string): number[] {
	const offsets = [0];
	for (let i = 0; i < src.length; i++) {
		if (src.charCodeAt(i) === 10 /* \n */) offsets.push(i + 1);
	}
	return offsets;
}

function nameOf(node: Parser.SyntaxNode): string | null {
	// Try common name field first.
	const named = node.childForFieldName("name");
	if (named) return named.text;
	// lexical_declaration → variable_declarator → identifier
	if (node.type === "lexical_declaration" || node.type === "variable_declaration") {
		for (const c of node.namedChildren) {
			if (c.type === "variable_declarator") {
				const id = c.childForFieldName("name") ?? c.namedChildren[0];
				const val = c.childForFieldName("value");
				// Only surface if value is an arrow/function — otherwise it's noise.
				if (val && (val.type === "arrow_function" || val.type === "function_expression" || val.type === "function")) {
					return id?.text ?? null;
				}
			}
		}
		return null;
	}
	return null;
}

function collectSymbols(root: Parser.SyntaxNode, lang: Lang): Symbol[] {
	const table = SYMBOL_KINDS[lang];
	const out: Symbol[] = [];
	const walk = (node: Parser.SyntaxNode, path: string[]) => {
		const kind = table[node.type];
		let currentName: string | null = null;
		if (kind) {
			currentName = nameOf(node);
			if (currentName) {
				out.push({
					kind,
					name: currentName,
					line: node.startPosition.row + 1,
					endLine: node.endPosition.row + 1,
					lines: node.endPosition.row - node.startPosition.row + 1,
					path: [...path],
				});
			}
		}
		const nextPath = currentName ? [...path, currentName] : path;
		for (let i = 0; i < node.namedChildCount; i++) {
			walk(node.namedChild(i)!, nextPath);
		}
	};
	walk(root, []);
	return out;
}

function loadFile(pathIn: string): CachedFile {
	const absPath = resolve(pathIn);
	const st = statSync(absPath);
	const cached = cache.get(absPath);
	if (cached && cached.mtimeMs === st.mtimeMs) return cached;

	const lang = detectLang(absPath);
	const source = readFileSync(absPath, "utf-8");
	const lineOffsets = computeLineOffsets(source);
	const parser = getParser(lang);
	// tree-sitter's default internal buffer is 32 KiB — bump it for huge
	// files or the native binding throws "Invalid argument". 32 MiB is
	// enough for any single source file we'll realistically see.
	const tree = parser.parse(source, undefined, { bufferSize: 32 * 1024 * 1024 } as any);
	const symbols = collectSymbols(tree.rootNode, lang);
	const entry: CachedFile = {
		absPath,
		lang,
		mtimeMs: st.mtimeMs,
		source,
		lineOffsets,
		tree,
		symbols,
	};
	cache.set(absPath, entry);
	return entry;
}

function lineSlice(f: CachedFile, startLine: number, endLine: number): string {
	const total = f.lineOffsets.length;
	const s = Math.max(1, startLine);
	const e = Math.min(total, endLine);
	const startByte = f.lineOffsets[s - 1] ?? 0;
	const endByte = e >= total ? f.source.length : f.lineOffsets[e] ?? f.source.length;
	return f.source.slice(startByte, endByte);
}

function findSymbol(f: CachedFile, ref: string): Symbol | null {
	// Support "Class.method" / "Class::method" / "Namespace\Class::method" / bare name.
	const normalized = ref.replace(/::/g, ".").replace(/\\/g, ".");
	const parts = normalized.split(".").filter(Boolean);
	const target = parts[parts.length - 1];
	const candidates = f.symbols.filter((s) => s.name === target);
	if (candidates.length === 0) return null;
	if (parts.length === 1) return candidates[0];
	// Prefer one whose path ends with the prefix parts.
	const prefix = parts.slice(0, -1);
	for (const c of candidates) {
		const tail = c.path.slice(-prefix.length);
		if (tail.length === prefix.length && tail.every((v, i) => v === prefix[i])) return c;
	}
	return candidates[0];
}

// ── Public API (exposed to the scratchpad) ──────────────────────────────

export interface BigFileHandle {
	path: string;
	lang: Lang;
	lines: number;
	get stats(): {
		path: string;
		lang: Lang;
		lines: number;
		bytes: number;
		symbols: number;
		largest: Array<{ name: string; kind: string; lines: number; line: number }>;
	};
	get symbols(): Symbol[];
	peek(refOrStart: string | number, endLine?: number): string;
	grep(pattern: string | RegExp, opts?: { limit?: number; caseSensitive?: boolean }): Array<{
		line: number;
		text: string;
		symbol: string | null;
	}>;
	context(line: number): { path: string[]; enclosing: Symbol | null };
	slice(startLine: number, endLine: number): string;
}

function makeHandle(f: CachedFile): BigFileHandle {
	return {
		path: f.absPath,
		lang: f.lang,
		lines: f.lineOffsets.length,
		get stats() {
			const largest = [...f.symbols]
				.sort((a, b) => b.lines - a.lines)
				.slice(0, 10)
				.map((s) => ({ name: s.path.concat(s.name).join("."), kind: s.kind, lines: s.lines, line: s.line }));
			return {
				path: f.absPath,
				lang: f.lang,
				lines: f.lineOffsets.length,
				bytes: Buffer.byteLength(f.source, "utf-8"),
				symbols: f.symbols.length,
				largest,
			};
		},
		get symbols() {
			return f.symbols;
		},
		peek(refOrStart, endLine) {
			if (typeof refOrStart === "number") {
				const start = refOrStart;
				const end = endLine ?? Math.min(start + MAX_PEEK_LINES - 1, f.lineOffsets.length);
				const capped = Math.min(end, start + MAX_PEEK_LINES - 1);
				return lineSlice(f, start, capped);
			}
			const sym = findSymbol(f, refOrStart);
			if (!sym) throw new Error(`bigfile.peek: symbol not found: ${refOrStart}`);
			const capped = Math.min(sym.endLine, sym.line + MAX_PEEK_LINES - 1);
			return lineSlice(f, sym.line, capped);
		},
		grep(pattern, opts = {}) {
			const limit = Math.min(opts.limit ?? 50, MAX_GREP_HITS);
			const re =
				pattern instanceof RegExp
					? pattern
					: new RegExp(pattern, opts.caseSensitive ? "g" : "gi");
			const flags = re.flags.includes("g") ? re.flags : re.flags + "g";
			const rx = new RegExp(re.source, flags);
			const hits: Array<{ line: number; text: string; symbol: string | null }> = [];
			const lines = f.source.split("\n");
			for (let i = 0; i < lines.length && hits.length < limit; i++) {
				if (rx.test(lines[i])) {
					const lineNo = i + 1;
					const enc = f.symbols
						.filter((s) => s.line <= lineNo && s.endLine >= lineNo)
						.sort((a, b) => b.line - a.line)[0];
					hits.push({
						line: lineNo,
						text: lines[i].slice(0, 240),
						symbol: enc ? enc.path.concat(enc.name).join(".") : null,
					});
					rx.lastIndex = 0;
				}
			}
			return hits;
		},
		context(line) {
			const enclosing =
				f.symbols
					.filter((s) => s.line <= line && s.endLine >= line)
					.sort((a, b) => b.line - a.line)[0] ?? null;
			return {
				path: enclosing ? enclosing.path.concat(enclosing.name) : [],
				enclosing,
			};
		},
		slice(startLine, endLine) {
			const capped = Math.min(endLine, startLine + MAX_PEEK_LINES - 1);
			return lineSlice(f, startLine, capped);
		},
	};
}

export const bigfile = {
	load(path: string): BigFileHandle {
		const f = loadFile(path);
		return makeHandle(f);
	},
	supported(): string[] {
		return Object.keys(LANG_BY_EXT);
	},
	clear(): void {
		cache.clear();
	},
};
