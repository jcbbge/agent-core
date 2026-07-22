// colgrep-tool — flat semantic-search tool surface for pi.
// Unbundled from smart_search's nested router: exposes colgrep (semantic "find
// by meaning") as its own registerTool primitive so the model's tool-call
// reflex binds directly AND tool_call_sequence records it by name (per-tool
// telemetry, no router opacity). Pairs with bigfile-tool.ts + kotadb.ts as the
// three genuinely-additive primitives over pi's native search/find/ast_grep.
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { spawnSync } from "node:child_process";

const COLGREP_BIN = "/Users/jrg/.cargo/bin/colgrep";

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "colgrep",
    label: "Semantic Grep",
    description:
      "Semantic code search — find code by MEANING, not just literal text. Query in natural language ('tenant isolation enforcement', 'error handling for failed charges') and get relevant code even when keywords don't match. Use this over the builtin `search` (ripgrep) when you don't know the exact string, only the concept. Auto-indexes the project on first use.",
    parameters: Type.Object({
      query: Type.String({ description: "Natural-language description of the code you want" }),
      path: Type.Optional(Type.String({ description: "Path to search (default: cwd)" })),
      limit: Type.Optional(Type.Number({ description: "Max hits (default 15)" })),
    }),
    execute: async (_id: string, a: { query: string; path?: string; limit?: number }) => {
      const args = [a.query, "--json"];
      if (a.path) args.push(a.path);
      const r = spawnSync(COLGREP_BIN, args, { encoding: "utf8", timeout: 30_000 });
      if (r.status !== 0 || !r.stdout) {
        const msg = (r.stderr || "").trim() || "no results";
        return { content: [{ type: "text" as const, text: `colgrep: ${msg}` }], isError: r.status !== 0 };
      }
      let hits: unknown;
      try {
        hits = JSON.parse(r.stdout);
      } catch {
        return { content: [{ type: "text" as const, text: r.stdout.slice(0, 4000) }] };
      }
      const arr = Array.isArray(hits) ? hits.slice(0, a.limit ?? 15) : hits;
      return { content: [{ type: "text" as const, text: JSON.stringify(arr, null, 2).slice(0, 8000) }] };
    },
  } as never);
}
