#!/usr/bin/env bun
/**
 * super-search — standalone port of the pi `smart_search` extension
 * (~/.pi/agent/extensions/smart-search.ts).
 * Same binaries, no pi ExtensionAPI / no daemon. Pure CLI: args in, md out.
 *
 * Routing:
 *   Layer 1 (colgrep)  — current project, semantic + hybrid.
 *   Layer 2 (coraline) — Rust/Zig/Python/Swift/Go/C repos in ~/source.
 *   Layer 3 (pickbrain)— past sessions, memory, context.
 *   Layer 4 (ripgrep)  — exact regex, fallback.
 *   Layer 5 (bigfile)  — in-file structural search on huge PHP/JS/TS/TSX files
 *                        (10k+ lines). Auto-fires when `--file` is provided
 *                        AND the file is > 3000 lines AND supported extension.
 *
 * (KotaDB layer retired 2026-08-06 — nothing listens on :7001 anymore; removed
 * 2026-08-14 rather than left dialing a dead port.)
 *
 * Usage:
 *   bun search.ts "<query>" [--pattern <re>] [--repo <name>] [--file <path>]
 *                           [--scope auto|project|source|exact|memory|bigfile]
 *                           [--limit <n>]
 */
import { execSync, spawnSync } from "child_process";
import { readFileSync, statSync } from "fs";
import { extname } from "path";

const SOURCE_ROOT = "/Users/jrg/source";
const COLGREP_BIN = "colgrep";
const RG_BIN = "rg";
const PICKBRAIN_BIN = "pickbrain";
const CORALINE_BIN = "coraline";
const BIGFILE_LIB = "/Users/jrg/agent-core/primitives/tools/bigfile/src/bigfile.ts";
const BIGFILE_EXTS = new Set([".php", ".phtml", ".js", ".mjs", ".cjs", ".jsx", ".ts", ".tsx"]);
const BIGFILE_MIN_LINES = 3000;

// ── helpers ──────────────────────────────────────────────────────────────────

function binaryAvailable(bin: string): boolean {
  try {
    execSync(`which ${bin}`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function colgrep(query: string, args: string[]): string {
  // 120s: a cold project triggers a full index build on first query
  // ("📂 Building index..."), which easily exceeds a 10s budget. Subsequent
  // queries are fast (incremental). Better to wait once than whiff.
  const result = spawnSync(COLGREP_BIN, [query, "--json", ...args], {
    encoding: "utf8",
    timeout: 120_000,
  });
  if (result.status !== 0 || !result.stdout) return "";
  // colgrep prints a human banner ("🤖 Model: ...", "📂 Building index...")
  // to stdout BEFORE the JSON array. Slice from the first '[' so JSON.parse
  // doesn't choke on the banner.
  const jsonStart = result.stdout.indexOf("[");
  const payload = jsonStart >= 0 ? result.stdout.slice(jsonStart) : result.stdout;
  try {
    const hits = JSON.parse(payload) as any[];
    if (!Array.isArray(hits) || hits.length === 0) return "";
    return hits
      .map((h: any) => {
        const u = h?.unit ?? {};
        const file = u.file ?? h?.file ?? "?";
        const line = u.line ? `:${u.line}` : "";
        const sig = (u.signature ?? u.name ?? "").toString().split("\n")[0].slice(0, 100);
        // clickable file:line, then signature, then a few trimmed content lines
        const body = (u.content ?? h?.content ?? "")
          .toString()
          .split("\n")
          .slice(0, 6)
          .join("\n")
          .trim();
        return `${file}${line}${sig ? `  — ${sig}` : ""}${body ? `\n${body}` : ""}`;
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

function pickbrain(query: string, limit: number): string {
  const result = spawnSync(PICKBRAIN_BIN, [query], {
    encoding: "utf8",
    timeout: 60_000,
  });
  if (result.status !== 0 || !result.stdout) return "";
  const lines = result.stdout.trim().split("\n");
  return lines.slice(0, limit * 15).join("\n");
}

function coraline(query: string, repo: string, limit: number): string {
  const cwd = `${SOURCE_ROOT}/${repo}`;
  const result = spawnSync(CORALINE_BIN, ["query", query], {
    encoding: "utf8",
    timeout: 60_000,
    cwd,
  });
  if (result.status !== 0 || !result.stdout) return "";
  const lines = result.stdout.trim().split("\n");
  return lines.slice(0, limit * 3).join("\n");
}

// bigfile — huge-file structural search (tree-sitter, PHP/JS/TS/TSX).
// Invokes the same library the bigfile MCP server wraps, via a one-shot bun
// subprocess so this stays a stateless CLI. Returns hits tagged with their
// enclosing symbol path.
async function bigfile(query: string, filePath: string, limit: number): Promise<string> {
  const script = `
    import { bigfile } from ${JSON.stringify(BIGFILE_LIB)};
    const f = bigfile.load(${JSON.stringify(filePath)});
    const hits = f.grep(${JSON.stringify(query)}, { limit: ${limit}, caseSensitive: false });
    const out = [
      \`[\${f.path}] \${f.lang} \u2022 \${f.lines} lines \u2022 \${f.symbols.length} symbols\`,
      ...hits.map(h => \`  L\${String(h.line).padStart(6)} [\${h.symbol ?? "-"}]  \${h.text.trim().slice(0, 140)}\`)
    ];
    console.log(out.join("\\n"));
  `;
  const result = spawnSync("bun", ["-e", script], { encoding: "utf8", timeout: 30_000 });
  if (result.status !== 0) return "";
  return (result.stdout ?? "").trim();
}

function isBigfileTarget(filePath: string): boolean {
  try {
    if (!BIGFILE_EXTS.has(extname(filePath).toLowerCase())) return false;
    const st = statSync(filePath);
    if (st.size < 60_000) return false;
    const buf = readFileSync(filePath, "utf8");
    let n = 0;
    for (let i = 0; i < buf.length; i++) if (buf.charCodeAt(i) === 10) n++;
    return n >= BIGFILE_MIN_LINES;
  } catch {
    return false;
  }
}

// ── routing logic ─────────────────────────────────────────────────────────────

// The footgun fix. The old classifier substring-matched bare nouns — "memory"
// inside "memory allocation" or "memory leak" forced the whole query onto the
// session-memory layer and starved the code layers. The cure is two-fold:
//   1. classify on recall *intent* (phrases a human uses when asking about a
//      past session), never on a noun that legitimately appears in code; and
//   2. make auto additive (see main) — the project code layers ALWAYS run in
//      auto, so even a misclassification can never rob you of code results.
function classifyScope(query: string): "project" | "source" | "exact" | "memory" {
  const q = query.toLowerCase();
  // recall intent — "what did we decide", "last session", "we discussed", …
  if (
    /\b(last|previous|prior|earlier)\s+(session|conversation|chat|time)\b/.test(q) ||
    /\bdid we\b|\bwe (decided|discussed|talked about|agreed|chose|said)\b/.test(q) ||
    /\bremember (when|that|the|how)\b|\brecall (when|that|the)\b/.test(q) ||
    /\bpast (session|conversation|chat)s?\b|\bin (our|the) last\b/.test(q)
  ) {
    return "memory";
  }
  // exact-match intent (the --pattern flag is the primary exact path; this is
  // only the verbal version, scoped to avoid matching code nouns)
  if (/\bregex\b|\bexact match\b|\bliteral string\b/.test(q)) {
    return "exact";
  }
  if (/\bsurrealdb\b|\bzig\b|\brust\b|in\s+source|~\/source/i.test(q)) {
    return "source";
  }
  return "project";
}

// ── arg parsing ─────────────────────────────────────────────────────────────

function parseArgs(argv: string[]) {
  const positional: string[] = [];
  const opts: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      opts[key] = argv[++i] ?? "";
    } else {
      positional.push(a);
    }
  }
  return { query: positional.join(" "), opts };
}

// ── main (faithful port of the pi extension's execute body) ───────────────────

async function main() {
  const { query, opts } = parseArgs(process.argv.slice(2));
  if (!query) {
    console.error('usage: bun search.ts "<query>" [--pattern <re>] [--repo <name>] [--file <path>] [--scope auto|project|source|exact|memory|bigfile] [--limit <n>]');
    process.exit(2);
  }
  const pattern = opts.pattern || undefined;
  const repo = opts.repo || undefined;
  const file = opts.file || undefined;
  const forceScope = (opts.scope as any) || "auto";
  const limit = opts.limit ? Number(opts.limit) : 10;

  const hasCG = binaryAvailable(COLGREP_BIN);
  const hasRG = binaryAvailable(RG_BIN);
  const hasPB = binaryAvailable(PICKBRAIN_BIN);
  const hasCR = binaryAvailable(CORALINE_BIN);

  // Two distinct modes:
  //   • forced (--scope X)  → run ONLY layer X (+ ripgrep fallback if empty).
  //   • auto (default)      → ADDITIVE: the project code layers ALWAYS run, and
  //                           memory/source/exact layers are *added* on signal.
  // This is the structural cure for the classifier footgun: a noun collision
  // can shift which extra layers fire, but it can never starve the code layers.
  const scope = forceScope ?? "auto";
  const isAuto = scope === "auto";
  const cls = isAuto ? classifyScope(query) : scope;

  const sections: string[] = [];

  // bigfile — in-file structural search on huge files. Fires when the caller
  // provides --file AND (scope=bigfile OR auto+file-qualifies). If forced to
  // scope=bigfile without a --file, it's a user error and we surface it.
  const bigfileForced = scope === "bigfile";
  const bigfileAuto = isAuto && file && isBigfileTarget(file);
  if ((bigfileForced || bigfileAuto) && file) {
    const out = await bigfile(query, file, limit);
    if (out) sections.push(`## bigfile (in-file)\n\n${out}`);
  } else if (bigfileForced && !file) {
    sections.push("## bigfile\n\nERROR: --scope bigfile requires --file <path>");
  }

  // coraline — ~/source repos. Forced via --repo or scope=source; in auto only
  // when the query names a known source repo.
  if (hasCR && repo) {
    const out = coraline(query, repo, limit);
    if (out) sections.push(`## coraline (${repo})\n\n${out}`);
  } else if (hasCR && (scope === "source" || (isAuto && cls === "source"))) {
    const repoMatch = query.match(/\b(surrealdb|zig)\b/i);
    if (repoMatch) {
      const out = coraline(query, repoMatch[1].toLowerCase(), limit);
      if (out) sections.push(`## coraline (${repoMatch[1]})\n\n${out}`);
    }
  }

  // colgrep — current project. Runs for forced project AND always in auto.
  if (hasCG && !repo && (scope === "project" || isAuto)) {
    const cgArgs = [
      "--exclude-dir=node_modules",
      "--exclude-dir=vendor",
      "--exclude-dir=.claude",
      "--exclude-dir=.graveyard",
      "--exclude-dir=dist",
      "--exclude-dir=.git",
      `-k`,
      String(limit),
    ];
    if (pattern) cgArgs.push("-e", pattern);
    const out = colgrep(query, cgArgs);
    if (out) sections.push(`## colgrep (project)\n\n${out}`);
  }

  // pickbrain — session memory. Forced via scope=memory; in auto ONLY on a
  // real recall-intent phrase (never on a bare code noun like "memory").
  if (hasPB && (scope === "memory" || (isAuto && cls === "memory"))) {
    const out = pickbrain(query, limit);
    if (out) sections.push(`## pickbrain (memory)\n\n${out}`);
  }

  // ripgrep — exact/literal, and the universal fallback when nothing else hit.
  const needsRg =
    scope === "exact" || pattern !== undefined || (isAuto && cls === "exact") || sections.length === 0;
  if (needsRg && hasRG) {
    const rgPattern = pattern ?? query;
    const searchPath = repo ? `${SOURCE_ROOT}/${repo}` : process.cwd();
    const extra = [
      "--glob=!node_modules/**",
      "--glob=!vendor/**",
      "--glob=!dist/**",
      "--glob=!target/**",
      "--glob=!zig-cache/**",
      "--glob=!.claude/**",
      "--glob=!.graveyard/**",
      "--glob=!.git/**",
    ];
    const out = ripgrep(rgPattern, searchPath, extra);
    if (out) sections.push(`## ripgrep (exact)\n\n${out}`);
  }

  const text = sections.length === 0
    ? `No results found for: "${query}"`
    : sections.join("\n\n---\n\n");

  console.log(text);
}

main();
