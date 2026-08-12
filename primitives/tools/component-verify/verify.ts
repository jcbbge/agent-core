#!/usr/bin/env bun
// component-verify — the drop-in acceptance runner for agent-core components.
//
// Spec: ~/agent-core/briefs/component-verify.md. Every component carries a
// VERIFY.toml (or VERIFY-<name>.toml in shared dirs) answering: what is it,
// what does it guarantee (contract), how do we verify (oracles, one per
// contract line), how do we test (suite), how do we measure (metrics).
//
//   component-verify <id>            oracles, one PASS/FAIL per contract line
//   component-verify <id> --suite    full suite
//   component-verify <id> --metrics  effectiveness numbers vs expectations
//   component-verify --all           every manifest, summary table
//   component-verify --coverage      registry ids without a manifest
//
// Truth law (same law slim lives under): oracle exit codes decide PASS/FAIL
// and are never swallowed; a spawn failure is a FAIL with the error shown;
// a malformed manifest is a hard error (exit 2), not a skip.

import { readdirSync, statSync, existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";

const ROOT = process.env.AGENT_CORE_ROOT ?? resolve(import.meta.dir, "../../..");
const REGISTRY = process.env.AGENT_CORE_REGISTRY ?? join(homedir(), ".agent-core", "registry");
const TAIL_LINES = 20;
const SKIP_DIRS = new Set([".git", "node_modules", "zig-out", ".zig-cache", "_deprecated", "fixtures"]);

interface Manifest {
  id: string;
  kind: string;
  what: string;
  contract: string[];
  oracles: string[];
  suite?: string;
  metrics: { name: string; run: string; expect?: string }[];
  path: string; // manifest file path
  cwd: string; // where oracles/suite/metrics run
}

function usage(code: number): never {
  console.log(
    [
      "usage: component-verify <id> [--suite|--metrics]",
      "       component-verify --all",
      "       component-verify --coverage",
    ].join("\n"),
  );
  process.exit(code);
}

function expandTilde(p: string): string {
  return p === "~" ? homedir() : p.startsWith("~/") ? join(homedir(), p.slice(2)) : p;
}

function findManifestFiles(dir: string, out: string[] = []): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    const full = join(dir, name);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      if (!SKIP_DIRS.has(name)) findManifestFiles(full, out);
    } else if (name === "VERIFY.toml" || (name.startsWith("VERIFY-") && name.endsWith(".toml"))) {
      out.push(full);
    }
  }
  return out;
}

function parseManifest(path: string): Manifest {
  let raw: Record<string, any>;
  try {
    raw = Bun.TOML.parse(readFileSync(path, "utf8")) as Record<string, any>;
  } catch (e) {
    fail2(`${path}: TOML parse error: ${e}`);
  }
  const c = raw.component;
  if (!c?.id || !c?.kind || !Array.isArray(c?.contract) || c.contract.length === 0) {
    fail2(`${path}: [component] must carry id, kind, and a non-empty contract array`);
  }
  const oracles: string[] = (raw.oracle ?? []).map((o: any) => o?.run).filter(Boolean);
  if (oracles.length !== c.contract.length) {
    fail2(
      `${path}: ${c.contract.length} contract line(s) but ${oracles.length} oracle(s) — one oracle per contract line, index-matched`,
    );
  }
  const metrics = (raw.metric ?? []).map((m: any) => {
    if (!m?.name || !m?.run) fail2(`${path}: every [[metric]] needs name and run`);
    return { name: m.name, run: m.run, expect: m.expect };
  });
  return {
    id: c.id,
    kind: c.kind,
    what: c.what ?? "",
    contract: c.contract,
    oracles,
    suite: raw.suite?.run,
    metrics,
    path,
    cwd: c.cwd ? resolve(dirname(path), expandTilde(c.cwd)) : dirname(path),
  };
}

function fail2(msg: string): never {
  console.error(`component-verify: ${msg}`);
  process.exit(2);
}

function loadAll(): Map<string, Manifest> {
  const map = new Map<string, Manifest>();
  for (const file of findManifestFiles(ROOT).sort()) {
    const m = parseManifest(file);
    const prior = map.get(m.id);
    if (prior) fail2(`duplicate manifest id ${m.id}: ${prior.path} and ${m.path}`);
    map.set(m.id, m);
  }
  return map;
}

interface RunResult {
  code: number;
  output: string; // stdout + stderr, in order captured
  stdout: string;
}

function run(cmd: string, cwd: string): RunResult {
  try {
    const proc = Bun.spawnSync(["bash", "-c", cmd], { cwd, stdout: "pipe", stderr: "pipe" });
    const stdout = proc.stdout.toString();
    const stderr = proc.stderr.toString();
    return { code: proc.exitCode ?? 1, output: stdout + stderr, stdout };
  } catch (e) {
    return { code: 127, output: `spawn failed: ${e}`, stdout: "" };
  }
}

function tail(output: string): string {
  const lines = output.trimEnd().split("\n");
  const t = lines.slice(-TAIL_LINES);
  return t.map((l) => `    | ${l}`).join("\n");
}

function runOracles(m: Manifest): { passed: number; failed: number } {
  let passed = 0;
  let failed = 0;
  for (let i = 0; i < m.contract.length; i++) {
    const r = run(m.oracles[i], m.cwd);
    if (r.code === 0) {
      passed++;
      console.log(`PASS ${m.id} :: ${m.contract[i]}`);
    } else {
      failed++;
      console.log(`FAIL ${m.id} :: ${m.contract[i]}`);
      console.log(`    oracle: ${m.oracles[i]} (exit ${r.code}, cwd ${m.cwd})`);
      if (r.output.trim()) console.log(tail(r.output));
    }
  }
  return { passed, failed };
}

function runSuite(m: Manifest): boolean {
  if (!m.suite) {
    console.log(`SKIP ${m.id} :: no [suite] declared`);
    return true;
  }
  const r = run(m.suite, m.cwd);
  if (r.code === 0) {
    console.log(`PASS ${m.id} :: suite (${m.suite})`);
    return true;
  }
  console.log(`FAIL ${m.id} :: suite (${m.suite}) exit ${r.code}`);
  if (r.output.trim()) console.log(tail(r.output));
  return false;
}

function compare(value: string, expect: string): boolean {
  const m = expect.match(/^\s*(>=|<=|==|!=)\s*(.+?)\s*$/);
  if (!m) return false;
  const [, op, rhs] = m;
  const a = Number(value);
  const b = Number(rhs);
  const numeric = !Number.isNaN(a) && !Number.isNaN(b);
  switch (op) {
    case ">=":
      return numeric && a >= b;
    case "<=":
      return numeric && a <= b;
    case "==":
      return numeric ? a === b : value === rhs;
    case "!=":
      return numeric ? a !== b : value !== rhs;
  }
  return false;
}

function runMetrics(m: Manifest): boolean {
  if (m.metrics.length === 0) {
    console.log(`SKIP ${m.id} :: no [[metric]] declared`);
    return true;
  }
  let ok = true;
  for (const metric of m.metrics) {
    const r = run(metric.run, m.cwd);
    const lines = r.stdout.trim().split("\n");
    const value = lines[lines.length - 1]?.trim() ?? "";
    if (r.code !== 0) {
      ok = false;
      console.log(`FAIL ${m.id} :: metric ${metric.name} — collector exited ${r.code}`);
      if (r.output.trim()) console.log(tail(r.output));
      continue;
    }
    if (!metric.expect) {
      console.log(`INFO ${m.id} :: metric ${metric.name} = ${value} (no expectation)`);
      continue;
    }
    const pass = compare(value, metric.expect);
    if (!pass) ok = false;
    console.log(
      `${pass ? "PASS" : "FAIL"} ${m.id} :: metric ${metric.name} = ${value} (expect ${metric.expect})`,
    );
  }
  return ok;
}

function registryIds(): string[] {
  if (!existsSync(REGISTRY)) fail2(`registry not found at ${REGISTRY}`);
  const ids: string[] = [];
  for (const line of readFileSync(REGISTRY, "utf8").split("\n")) {
    const m = line.match(/^primitive\s+(\S+)/);
    if (m) ids.push(m[1]);
  }
  return ids;
}

// ── main ────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
  usage(args.length === 0 ? 2 : 0);
}

const manifests = loadAll();

if (args[0] === "--coverage") {
  const covered = new Set(manifests.keys());
  const ids = registryIds();
  const missing = ids.filter((id) => !covered.has(id));
  for (const id of missing) console.log(id);
  console.log(
    `coverage: ${ids.length - missing.length}/${ids.length} registry ids carry a manifest; ${missing.length} without (drift). manifests found: ${manifests.size} (root ${ROOT})`,
  );
  process.exit(0);
}

if (args[0] === "--all") {
  let totalPass = 0;
  let totalFail = 0;
  const rows: string[] = [];
  for (const m of [...manifests.values()].sort((a, b) => a.id.localeCompare(b.id))) {
    const { passed, failed } = runOracles(m);
    totalPass += passed;
    totalFail += failed;
    rows.push(`  ${failed === 0 ? "PASS" : "FAIL"}  ${m.id}  (${passed}/${m.contract.length} contract lines)`);
  }
  console.log(`\nsummary — ${manifests.size} component(s):`);
  for (const row of rows) console.log(row);
  console.log(`oracles: ${totalPass} passed, ${totalFail} failed`);
  process.exit(totalFail === 0 ? 0 : 1);
}

const id = args[0];
if (id.startsWith("--")) usage(2);
const manifest = manifests.get(id);
if (!manifest) {
  fail2(`no manifest for id "${id}" under ${ROOT} — known ids: ${[...manifests.keys()].sort().join(", ") || "(none)"}`);
}

if (args.includes("--suite")) {
  process.exit(runSuite(manifest) ? 0 : 1);
}
if (args.includes("--metrics")) {
  process.exit(runMetrics(manifest) ? 0 : 1);
}

const { passed, failed } = runOracles(manifest);
console.log(`${manifest.id}: ${passed}/${manifest.contract.length} contract lines hold`);
process.exit(failed === 0 ? 0 : 1);
