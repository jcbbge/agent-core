import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "@sinclair/typebox";

/**
 * kotadb — Code intelligence extension for Pi.
 * 
 * Connects to KotaDB HTTP server on localhost:7001.
 * Provides: search, find_usages, search_dependencies, analyze_change_impact
 */

const KOTADB_URL = "http://localhost:7001/mcp";

interface MCPResponse {
  result?: any;
  error?: { code: number; message: string };
}

async function callMCP(tool: string, args: Record<string, any>): Promise<any> {
  const response = await fetch(KOTADB_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json, text/event-stream",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "tools/call",
      params: { name: tool, arguments: args },
      id: Date.now(),
    }),
  });

  if (!response.ok) {
    throw new Error(`KotaDB request failed: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as MCPResponse;
  if (data.error) {
    throw new Error(`KotaDB error: ${data.error.message}`);
  }

  return data.result;
}

function formatSearchResults(result: any): string {
  if (!result?.content?.[0]?.text) {
    return "No results found.";
  }
  return result.content[0].text;
}

export default function (pi: ExtensionAPI) {
  // Check if KotaDB is available
  fetch("http://localhost:7001/health")
    .then((r) => r.ok && pi.log?.info?.("KotaDB connected on :7001"))
    .catch(() => pi.log?.warn?.("KotaDB not available on :7001"));

  // ── kotadb_search ──────────────────────────────────────────────────────────
  pi.registerTool({
    name: "kotadb_search",
    label: "KotaDB Search",
    description: [
      "Search indexed code, symbols, decisions, and patterns via KotaDB.",
      "",
      "Scopes: code, symbols, decisions, patterns, failures",
      "Output modes: paths, compact, snippet (default), full",
      "",
      "Indexed repos: solidjs/solid, ziglang/zig, bento/pagoda, bento/notify",
    ].join("\n"),
    parameters: Type.Object({
      query: Type.String({ description: "Search query" }),
      scope: Type.Optional(
        Type.Array(
          Type.Union([
            Type.Literal("code"),
            Type.Literal("symbols"),
            Type.Literal("decisions"),
            Type.Literal("patterns"),
            Type.Literal("failures"),
          ]),
          { description: "Search scopes (default: ['code'])" }
        )
      ),
      output: Type.Optional(
        Type.Union(
          [Type.Literal("paths"), Type.Literal("compact"), Type.Literal("snippet"), Type.Literal("full")],
          { description: "Output format (default: snippet)" }
        )
      ),
      repository: Type.Optional(Type.String({ description: "Filter to repository (e.g. 'solidjs/solid')" })),
      limit: Type.Optional(Type.Number({ description: "Max results (default: 20)" })),
      language: Type.Optional(Type.String({ description: "Filter by language (e.g. 'typescript')" })),
    }),
    execute: async (_toolCallId, params) => {
      try {
        const args: Record<string, any> = {
          query: params.query,
          output: params.output ?? "snippet",
          limit: params.limit ?? 20,
        };
        if (params.scope) args.scope = params.scope;
        if (params.repository) args.filters = { ...args.filters, repository: params.repository };
        if (params.language) args.filters = { ...args.filters, language: params.language };

        const result = await callMCP("search", args);
        return { content: [{ type: "text", text: formatSearchResults(result) }], details: null };
      } catch (e: any) {
        return { content: [{ type: "text", text: `Error: ${e.message}` }], details: null };
      }
    },
  });

  // ── kotadb_find_usages ─────────────────────────────────────────────────────
  pi.registerTool({
    name: "kotadb_find_usages",
    label: "KotaDB Find Usages",
    description: [
      "Find all usages of a symbol (function, class, type) across indexed repos.",
      "Returns call sites, imports, re-exports with file locations and context.",
      "Essential for safe refactoring.",
    ].join("\n"),
    parameters: Type.Object({
      symbol: Type.String({ description: "Symbol name to find usages for" }),
      file: Type.Optional(Type.String({ description: "File path to disambiguate if symbol exists in multiple files" })),
      repository: Type.Optional(Type.String({ description: "Repository to search within" })),
      include_tests: Type.Optional(Type.Boolean({ description: "Include test files (default: true)" })),
    }),
    execute: async (_toolCallId, params) => {
      try {
        const args: Record<string, any> = { symbol: params.symbol };
        if (params.file) args.file = params.file;
        if (params.repository) args.repository = params.repository;
        if (params.include_tests !== undefined) args.include_tests = params.include_tests;

        const result = await callMCP("find_usages", args);
        return { content: [{ type: "text", text: formatSearchResults(result) }], details: null };
      } catch (e: any) {
        return { content: [{ type: "text", text: `Error: ${e.message}` }], details: null };
      }
    },
  });

  // ── kotadb_deps ────────────────────────────────────────────────────────────
  pi.registerTool({
    name: "kotadb_deps",
    label: "KotaDB Dependencies",
    description: [
      "Search the dependency graph for a file.",
      "Find files that depend on (dependents) or are depended on by (dependencies) a target.",
      "Useful for impact analysis, test scope discovery, circular dependency detection.",
    ].join("\n"),
    parameters: Type.Object({
      file_path: Type.String({ description: "Relative file path (e.g. 'src/auth/context.ts')" }),
      direction: Type.Optional(
        Type.Union(
          [Type.Literal("dependents"), Type.Literal("dependencies"), Type.Literal("both")],
          { description: "Search direction (default: both)" }
        )
      ),
      depth: Type.Optional(Type.Number({ description: "Recursion depth 1-5 (default: 1)" })),
      repository: Type.Optional(Type.String({ description: "Repository ID to search within" })),
    }),
    execute: async (_toolCallId, params) => {
      try {
        const args: Record<string, any> = { file_path: params.file_path };
        if (params.direction) args.direction = params.direction;
        if (params.depth) args.depth = params.depth;
        if (params.repository) args.repository = params.repository;

        const result = await callMCP("search_dependencies", args);
        return { content: [{ type: "text", text: formatSearchResults(result) }], details: null };
      } catch (e: any) {
        return { content: [{ type: "text", text: `Error: ${e.message}` }], details: null };
      }
    },
  });

  // ── kotadb_impact ──────────────────────────────────────────────────────────
  pi.registerTool({
    name: "kotadb_impact",
    label: "KotaDB Impact Analysis",
    description: [
      "Analyze the impact of proposed code changes.",
      "Returns affected files, test recommendations, architectural warnings, risk assessment.",
      "Use before major refactors or feature additions.",
    ].join("\n"),
    parameters: Type.Object({
      description: Type.String({ description: "Brief description of the proposed change" }),
      change_type: Type.Union(
        [Type.Literal("feature"), Type.Literal("refactor"), Type.Literal("fix"), Type.Literal("chore")],
        { description: "Type of change" }
      ),
      files_to_modify: Type.Optional(Type.Array(Type.String(), { description: "Files to be modified" })),
      files_to_create: Type.Optional(Type.Array(Type.String(), { description: "Files to be created" })),
      files_to_delete: Type.Optional(Type.Array(Type.String(), { description: "Files to be deleted" })),
      repository: Type.Optional(Type.String({ description: "Repository to analyze" })),
    }),
    execute: async (_toolCallId, params) => {
      try {
        const args: Record<string, any> = {
          description: params.description,
          change_type: params.change_type,
        };
        if (params.files_to_modify) args.files_to_modify = params.files_to_modify;
        if (params.files_to_create) args.files_to_create = params.files_to_create;
        if (params.files_to_delete) args.files_to_delete = params.files_to_delete;
        if (params.repository) args.repository = params.repository;

        const result = await callMCP("analyze_change_impact", args);
        return { content: [{ type: "text", text: formatSearchResults(result) }], details: null };
      } catch (e: any) {
        return { content: [{ type: "text", text: `Error: ${e.message}` }], details: null };
      }
    },
  });

  // ── kotadb_stats ───────────────────────────────────────────────────────────
  pi.registerTool({
    name: "kotadb_stats",
    label: "KotaDB Statistics",
    description: "Get statistics about indexed data (files, symbols, references, decisions).",
    parameters: Type.Object({}),
    execute: async () => {
      try {
        const result = await callMCP("get_index_statistics", {});
        return { content: [{ type: "text", text: formatSearchResults(result) }], details: null };
      } catch (e: any) {
        return { content: [{ type: "text", text: `Error: ${e.message}` }], details: null };
      }
    },
  });

  // ── kotadb_index ───────────────────────────────────────────────────────────
  pi.registerTool({
    name: "kotadb_index",
    label: "KotaDB Index Repository",
    description: "Index a git repository. Clone from URL or use local path.",
    parameters: Type.Object({
      repository: Type.String({ description: "Repository identifier (e.g. 'owner/repo' or git URL)" }),
      localPath: Type.Optional(Type.String({ description: "Local directory path instead of cloning" })),
      ref: Type.Optional(Type.String({ description: "Git ref/branch (default: main)" })),
    }),
    execute: async (_toolCallId, params) => {
      try {
        const args: Record<string, any> = { repository: params.repository };
        if (params.localPath) args.localPath = params.localPath;
        if (params.ref) args.ref = params.ref;

        const result = await callMCP("index_repository", args);
        return { content: [{ type: "text", text: formatSearchResults(result) }], details: null };
      } catch (e: any) {
        return { content: [{ type: "text", text: `Error: ${e.message}` }], details: null };
      }
    },
  });
}
