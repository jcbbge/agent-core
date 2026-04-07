import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { execSync, spawnSync } from "child_process";
import { Type } from "@sinclair/typebox";

/**
 * smart-search — 3-layer hybrid search extension for pi.
 *
 * Routing logic:
 *   Layer 1 (colgrep)  — project code, semantic + hybrid. Primary.
 *   Layer 2 (kotadb)   — dependencies, structural queries, cross-repo, "what breaks if…"
 *   Layer 3 (ripgrep)  — exact regex, verification, fallback when layers 1+2 are weak.
 *
 * kotadb is called directly at localhost:3099 (HTTP MCP, no executor overhead).
 * This is intentional: the tool is a plugin, not an LLM tool registration — no context bloat.
 */

const KOTADB_URL = "http://localhost:3099/mcp";
const COLGREP_BIN = "colgrep";
const RG_BIN = "rg";

// Health cache — avoids 1.5s timeout on every call when kotadb is down
let _kotadbHealthy: boolean | null = null;
let _kotadbHealthCheckedAt = 0;
const HEALTH_TTL_MS = 30_000;

// ── helpers ──────────────────────────────────────────────────────────────────

function binaryAvailable(bin: string): boolean {
  try {
    execSync(`which ${bin}`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

async function kotadbHealth(): Promise<boolean> {
  const now = Date.now();
  if (_kotadbHealthy !== null && now - _kotadbHealthCheckedAt < HEALTH_TTL_MS) {
    return _kotadbHealthy;
  }
  try {
    const res = await fetch("http://localhost:3099/health", { signal: AbortSignal.timeout(1500) });
    _kotadbHealthy = res.ok;
  } catch {
    _kotadbHealthy = false;
  }
  _kotadbHealthCheckedAt = Date.now();
  return _kotadbHealthy;
}

async function kotadbSearch(query: string, limit: number): Promise<string> {
  const body = {
    method: "execute_tool",
    params: {
      name: "search",
      arguments: {
        query,
        scope: ["code", "symbols"],
        output: "snippet",
        limit,
      },
    },
  };

  const res = await fetch(KOTADB_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(8000),
  });

  const data = (await res.json()) as any;
  if (data?.isError) return "";
  const text = data?.content?.[0]?.text ?? "";
  try {
    const parsed = JSON.parse(text);
    const results = parsed?.results?.code ?? parsed?.results ?? [];
    if (!Array.isArray(results) || results.length === 0) return "";
    return results
      .slice(0, limit)
      .map((r: any) => `[${r.file ?? r.path ?? "?"}]\n${r.snippet ?? r.content ?? ""}`)
      .join("\n\n");
  } catch {
    return text;
  }
}

function colgrep(query: string, args: string[]): string {
  const result = spawnSync(COLGREP_BIN, [query, "--json", ...args], {
    encoding: "utf8",
    timeout: 10_000,
  });
  if (result.status !== 0 || !result.stdout) return "";
  try {
    const hits = JSON.parse(result.stdout) as any[];
    if (!Array.isArray(hits) || hits.length === 0) return "";
    return hits
      .map((h: any) => {
        const file = h?.unit?.file ?? h?.file ?? "?";
        const snippet = h?.unit?.content ?? h?.content ?? "";
        return `[${file}]\n${snippet}`;
      })
      .join("\n\n");
  } catch {
    return result.stdout.trim();
  }
}

function ripgrep(pattern: string, cwd: string, extra: string[]): string {
  const result = spawnSync(RG_BIN, [pattern, "--max-count=5", "--context=3", ...extra], {
    encoding: "utf8",
    timeout: 8_000,
    cwd,
  });
  return result.stdout?.trim() ?? "";
}

// ── routing logic ─────────────────────────────────────────────────────────────

/**
 * Classify the query to pick starting layer.
 * Heuristics — not magic:
 *   - "node_modules", "vendor", "depends", "import", "what breaks", "dependency"
 *     → start with kotadb
 *   - regex chars or "exact" / file extension patterns
 *     → start with ripgrep
 *   - everything else → colgrep
 */
function classifyScope(query: string): "project" | "deps" | "exact" {
  const q = query.toLowerCase();
  if (/node_modules|vendor|depend|import|what breaks|impact|usage across|cross.repo/.test(q)) {
    return "deps";
  }
  if (/exact|regex|pattern|literal|\\\w|\.ts$|\.rs$|\.go$/.test(q)) {
    return "exact";
  }
  return "project";
}

// ── extension ─────────────────────────────────────────────────────────────────

export default function (pi: ExtensionAPI) {
  const hasCG = binaryAvailable(COLGREP_BIN);
  const hasRG = binaryAvailable(RG_BIN);

  pi.registerTool({
    name: "smart_search",
    label: "Smart Search",
    description: [
      "Unified 3-layer code search. Auto-routes based on query intent:",
      "• Layer 1 (colgrep) — project source code, semantic + hybrid. Best for 'what does X do?' in your repo.",
      "• Layer 2 (kotadb) — dependencies, node_modules, cross-repo structural queries, impact analysis.",
      "• Layer 3 (ripgrep) — exact regex, verification, fallback.",
      "",
      "For exact/regex patterns use the `pattern` field alongside the natural-language `query`.",
      "Set `scope` to force a specific layer: 'project' | 'deps' | 'exact' | 'auto' (default).",
    ].join("\n"),
    parameters: Type.Object({
      query: Type.String({ description: "Natural language search query" }),
      pattern: Type.Optional(Type.String({ description: "Regex/literal pattern for ripgrep hybrid" })),
      scope: Type.Optional(
        Type.Union(
          [
            Type.Literal("auto"),
            Type.Literal("project"),
            Type.Literal("deps"),
            Type.Literal("exact"),
          ],
          { description: "Force a specific layer. Defaults to 'auto' (inferred from query)." }
        )
      ),
      limit: Type.Optional(Type.Number({ description: "Max results per layer (default 10)" })),
    }),
    execute: async (params, _ctx) => {
      const { query, pattern, scope: forceScope, limit = 10 } = params;
      const scope = forceScope ?? "auto";
      const effective = scope === "auto" ? classifyScope(query) : scope;

      const sections: string[] = [];

      // ── Layer 1: colgrep (project) ──
      if (effective === "project" || effective === "auto") {
        if (hasCG) {
          const cgArgs = ["--exclude-dir=node_modules", "--exclude-dir=vendor", `-k`, String(limit)];
          if (pattern) cgArgs.push("-e", pattern);
          const out = colgrep(query, cgArgs);
          if (out) sections.push(`## colgrep (project semantic)\n\n${out}`);
        }
      }

      // ── Layer 2: kotadb (deps / structural) ──
      if (effective === "deps" || (effective === "auto" && sections.length === 0)) {
        const healthy = await kotadbHealth();
        if (healthy) {
          const out = await kotadbSearch(query, limit).catch(() => "");
          if (out) sections.push(`## kotadb (structural / dependency)\n\n${out}`);
        } else {
          sections.push(`## kotadb\n\n⚠️ kotadb not reachable at localhost:3099`);
        }
      }

      // ── Layer 3: ripgrep (exact / fallback) ──
      const needsRg = effective === "exact" || pattern !== undefined || sections.length === 0;
      if (needsRg && hasRG) {
        const rgPattern = pattern ?? query;
        const extra = ["--glob=!node_modules/**", "--glob=!vendor/**", "--glob=!dist/**"];
        const out = ripgrep(rgPattern, process.cwd(), extra);
        if (out) sections.push(`## ripgrep (exact / fallback)\n\n${out}`);
      }

      if (sections.length === 0) {
        return `No results found across all layers for: "${query}"`;
      }

      return sections.join("\n\n---\n\n");
    },
  });
}
