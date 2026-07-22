// bigfile-tool — exposes the agent-core bigfile engine as pi TOOL-SURFACE
// primitives (registerTool), NOT as an MCP server. pi does not consume MCP the
// way Claude Code does, so structural monster-file navigation must ride the
// extension tool API to be reachable by the model's trained tool-call reflex.
//
// Backs directly onto ~/agent-core/primitives/tools/bigfile/src/bigfile.ts —
// same tree-sitter engine the MCP server uses, imported in-process (no stdio).
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { bigfile } from "/Users/jrg/agent-core/primitives/tools/bigfile/src/bigfile.ts";

export default function (pi: ExtensionAPI) {
  const asText = (v: unknown) => ({
    content: [{ type: "text" as const, text: typeof v === "string" ? v : JSON.stringify(v, null, 2) }],
  });
  const asErr = (m: string) => ({ content: [{ type: "text" as const, text: `error: ${m}` }], isError: true });
  const guard = <T>(fn: () => T) => {
    try {
      return asText(fn());
    } catch (e) {
      return asErr(e instanceof Error ? e.message : String(e));
    }
  };

  pi.registerTool({
    name: "bigfile_load",
    label: "Bigfile Load",
    description:
      "Parse a huge source file (tree-sitter) into cache and return a summary (path, lang, lines, symbol count). USE THIS FIRST for any file over ~3000 lines instead of read. Supported: .php .js .mjs .cjs .jsx .ts .tsx .phtml",
    parameters: Type.Object({ path: Type.String() }),
    execute: async (_id: string, a: { path: string }) => {
      return guard(() => {
        const f = bigfile.load(a.path);
        return { path: f.path, lang: f.lang, lines: f.lines, symbols: f.symbols.length };
      });
    },
  } as never);

  pi.registerTool({
    name: "bigfile_stats",
    label: "Bigfile Stats",
    description: "Line count, byte count, symbol count, language, and the 10 largest symbols.",
    parameters: Type.Object({ path: Type.String() }),
    execute: async (_id: string, a: { path: string }) => {
      return guard(() => bigfile.load(a.path).stats);
    },
  } as never);

  pi.registerTool({
    name: "bigfile_symbols",
    label: "Bigfile Symbols",
    description:
      "List symbols in the file. Optionally filter by kind (class|interface|trait|enum|function|method|type|namespace|const) or name substring.",
    parameters: Type.Object({
      path: Type.String(),
      kind: Type.Optional(Type.String()),
      name_contains: Type.Optional(Type.String()),
      min_lines: Type.Optional(Type.Number()),
      limit: Type.Optional(Type.Number()),
    }),
    execute: async (_id: string, a: { path: string; kind?: string; name_contains?: string; min_lines?: number; limit?: number }) => {
      return guard(() => {
        const f = bigfile.load(a.path);
        let syms = f.symbols;
        if (a.kind) syms = syms.filter((s) => s.kind === a.kind);
        if (a.name_contains) {
          const n = a.name_contains.toLowerCase();
          syms = syms.filter((s) => s.name.toLowerCase().includes(n));
        }
        if (typeof a.min_lines === "number") syms = syms.filter((s) => s.lines >= a.min_lines!);
        const limit = Math.min(a.limit ?? 200, 500);
        return syms.slice(0, limit).map((s) => ({
          kind: s.kind, name: s.name, qualified: s.path.concat(s.name).join("."),
          line: s.line, endLine: s.endLine, lines: s.lines,
        }));
      });
    },
  } as never);

  pi.registerTool({
    name: "bigfile_peek",
    label: "Bigfile Peek",
    description:
      "Return the body of ONE symbol, or a bounded line range. Reference by name ('validate'), qualified ('OrderService.validate'), or PHP-style ('Ns\\\\Class::method'). Capped at 400 lines.",
    parameters: Type.Object({
      path: Type.String(),
      symbol: Type.Optional(Type.String()),
      start: Type.Optional(Type.Number()),
      end: Type.Optional(Type.Number()),
    }),
    execute: async (_id: string, a: { path: string; symbol?: string; start?: number; end?: number }) => {
      return guard(() => {
        const f = bigfile.load(a.path);
        if (a.symbol) return f.peek(a.symbol);
        if (typeof a.start === "number") return f.peek(a.start, a.end);
        throw new Error("bigfile_peek requires `symbol` or `start`.");
      });
    },
  } as never);

  pi.registerTool({
    name: "bigfile_grep",
    label: "Bigfile Grep",
    description:
      "Regex search inside the file. Each hit includes the enclosing symbol path, so you know WHERE the match lives. Up to 200 hits.",
    parameters: Type.Object({
      path: Type.String(),
      pattern: Type.String(),
      limit: Type.Optional(Type.Number()),
      case_sensitive: Type.Optional(Type.Boolean()),
    }),
    execute: async (_id: string, a: { path: string; pattern: string; limit?: number; case_sensitive?: boolean }) => {
      return guard(() => {
        const f = bigfile.load(a.path);
        return f.grep(a.pattern, { limit: a.limit, caseSensitive: a.case_sensitive === true });
      });
    },
  } as never);

  pi.registerTool({
    name: "bigfile_context",
    label: "Bigfile Context",
    description: "Reverse lookup: at line N, what symbol path am I inside? Returns the enclosing symbol chain.",
    parameters: Type.Object({ path: Type.String(), line: Type.Number() }),
    execute: async (_id: string, a: { path: string; line: number }) => {
      return guard(() => bigfile.load(a.path).context(a.line));
    },
  } as never);

  pi.registerTool({
    name: "bigfile_slice",
    label: "Bigfile Slice",
    description: "Raw line-range slice (no parsing), bounded to 400 lines. Prefer bigfile_peek(symbol) when possible.",
    parameters: Type.Object({ path: Type.String(), start: Type.Number(), end: Type.Number() }),
    execute: async (_id: string, a: { path: string; start: number; end: number }) => {
      return guard(() => bigfile.load(a.path).slice(a.start, a.end));
    },
  } as never);
}
