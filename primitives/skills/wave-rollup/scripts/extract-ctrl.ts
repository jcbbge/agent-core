#!/usr/bin/env bun
/**
 * extract-ctrl — mechanical CTRL extractor for wave-rollup.
 * Computes from git only. Never estimates.
 *
 * Usage:
 *   bun ~/agent-core/primitives/skills/wave-rollup/scripts/extract-ctrl.ts \
 *     --repo <path> --range <base>..<head> [--top N] [--json]
 *
 * Exit: 0 ok · 2 usage · 3 git/io failure
 */

const USAGE = `usage: extract-ctrl.ts --repo <path> --range <base>..<head> [--top N] [--json]
  --repo   git repository root
  --range  rev range (e.g. c203706..origin/main)
  --top    top-N files by churn (default 15)
  --json   machine-readable JSON (default: markdown tables)
`

type AreaStat = { files: number; insertions: number; deletions: number }
type FileStat = {
  path: string
  insertions: number
  deletions: number
  churn: number
}
type Migration = { path: string; number: string; description: string }

function die(code: number, msg: string): never {
  console.error(msg)
  process.exit(code)
}

function parseArgs(argv: string[]) {
  let repo = ""
  let range = ""
  let top = 15
  let json = false
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === "--repo") repo = argv[++i] ?? ""
    else if (a === "--range") range = argv[++i] ?? ""
    else if (a === "--top") top = Number(argv[++i] ?? "15")
    else if (a === "--json") json = true
    else if (a === "-h" || a === "--help") die(2, USAGE)
    else die(2, `unknown arg: ${a}\n${USAGE}`)
  }
  if (!repo || !range) die(2, USAGE)
  if (!range.includes("..")) die(2, `--range must be base..head\n${USAGE}`)
  if (!Number.isFinite(top) || top < 1) die(2, `--top must be positive integer`)
  return { repo, range, top, json }
}

async function git(repo: string, args: string[]): Promise<string> {
  const proc = Bun.spawn(["git", "-C", repo, ...args], {
    stdout: "pipe",
    stderr: "pipe",
  })
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ])
  if (exitCode !== 0) {
    die(3, `git ${args.join(" ")} failed (${exitCode}): ${stderr.trim()}`)
  }
  return stdout
}

function areaOf(path: string): string {
  const parts = path.split("/")
  if (parts[0] === "apps" || parts[0] === "packages") {
    return `${parts[0]}/${parts[1] ?? ""}`
  }
  if (parts[0] === "docs") return "docs"
  return parts[0] ?? path
}

function parseNumstat(text: string): FileStat[] {
  const out: FileStat[] = []
  for (const line of text.split("\n")) {
    if (!line.trim()) continue
    const [a, d, ...rest] = line.split("\t")
    const path = rest.join("\t")
    if (!path) continue
    const insertions = a === "-" ? 0 : Number(a)
    const deletions = d === "-" ? 0 : Number(d)
    if (!Number.isFinite(insertions) || !Number.isFinite(deletions)) continue
    out.push({
      path,
      insertions,
      deletions,
      churn: insertions + deletions,
    })
  }
  return out
}

function rollupAreas(files: FileStat[]): Record<string, AreaStat> {
  const areas: Record<string, AreaStat> = {}
  for (const f of files) {
    const area = areaOf(f.path)
    const cur = areas[area] ?? { files: 0, insertions: 0, deletions: 0 }
    cur.files++
    cur.insertions += f.insertions
    cur.deletions += f.deletions
    areas[area] = cur
  }
  return areas
}

async function migrationDescription(repo: string, head: string, path: string): Promise<string> {
  const body = await git(repo, ["show", `${head}:${path}`])
  const lines = body.split("\n")
  const comments: string[] = []
  for (const line of lines) {
    const t = line.trim()
    if (!t) {
      if (comments.length) break
      continue
    }
    if (t.startsWith("--")) {
      comments.push(t.replace(/^--\s*/, "").replace(/─+/g, "").trim())
      continue
    }
    break
  }
  const joined = comments.filter(Boolean).join(" ").replace(/\s+/g, " ").trim()
  if (joined) return joined.slice(0, 160)
  const base = path.split("/").pop() ?? path
  return base.replace(/\.sql$/, "").replace(/^\d+_/, "").replace(/_/g, " ")
}

async function listMigrations(
  repo: string,
  range: string,
  head: string
): Promise<Migration[]> {
  const names = (
    await git(repo, [
      "diff",
      "--name-only",
      "--diff-filter=A",
      range,
      "--",
      "*.sql",
    ])
  )
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((p) => /\/\d{4}_[^/]+\.sql$/.test(p) || /(^|\/)drizzle\/\d{4}_/.test(p))

  const out: Migration[] = []
  for (const path of names.sort()) {
    const base = path.split("/").pop() ?? path
    const m = base.match(/^(\d{4})_/)
    const number = m?.[1] ?? "????"
    const description = await migrationDescription(repo, head, path)
    out.push({ path, number, description })
  }
  return out
}

function mdTable(headers: string[], rows: string[][]): string {
  const head = `| ${headers.join(" | ")} |`
  const sep = `| ${headers.map(() => "---").join(" | ")} |`
  const body = rows.map((r) => `| ${r.join(" | ")} |`).join("\n")
  return [head, sep, body].filter(Boolean).join("\n")
}

async function main() {
  const { repo, range, top, json } = parseArgs(process.argv.slice(2))
  const [base, head] = range.split("..")
  if (!base || !head) die(2, USAGE)

  const commitsAll = Number(
    (await git(repo, ["rev-list", "--count", range])).trim()
  )
  const commitsNoMerge = Number(
    (await git(repo, ["rev-list", "--count", "--no-merges", range])).trim()
  )
  const shortstat = (await git(repo, ["diff", "--shortstat", range])).trim()
  const files = parseNumstat(await git(repo, ["diff", "--numstat", range]))
  const areas = rollupAreas(files)
  const migrations = await listMigrations(repo, range, head)
  const topFiles = [...files].sort((a, b) => b.churn - a.churn).slice(0, top)

  let insertions = 0
  let deletions = 0
  for (const f of files) {
    insertions += f.insertions
    deletions += f.deletions
  }

  const payload = {
    repo,
    range,
    head_sha: (await git(repo, ["rev-parse", head])).trim(),
    base_sha: (await git(repo, ["rev-parse", base])).trim(),
    commits: { all: commitsAll, no_merges: commitsNoMerge },
    shortstat,
    totals: {
      files: files.length,
      insertions,
      deletions,
    },
    areas: Object.entries(areas)
      .map(([name, s]) => ({ name, ...s }))
      .sort((a, b) => b.files - a.files),
    migrations,
    top_files: topFiles,
  }

  if (json) {
    console.log(JSON.stringify(payload, null, 2))
    return
  }

  console.log(`# CTRL — ${range}`)
  console.log()
  console.log(`Repo: \`${repo}\``)
  console.log(`Head: \`${payload.head_sha}\``)
  console.log(`Base: \`${payload.base_sha}\``)
  console.log()
  console.log(`## Totals (git, not estimated)`)
  console.log()
  console.log(`- Commits: **${commitsAll}** (${commitsNoMerge} non-merge)`)
  console.log(
    `- Files / LOC: **${files.length}** files, **+${insertions}** / **−${deletions}**`
  )
  console.log(`- \`git diff --shortstat\`: ${shortstat || "(empty)"}`)
  console.log()
  console.log(`## Churn by area`)
  console.log()
  console.log(
    mdTable(
      ["Area", "Files", "+", "−"],
      payload.areas.map((a) => [
        a.name,
        String(a.files),
        String(a.insertions),
        String(a.deletions),
      ])
    )
  )
  console.log()
  console.log(`## Migrations added`)
  console.log()
  if (!migrations.length) console.log("_None._")
  else {
    console.log(
      mdTable(
        ["#", "File", "Description"],
        migrations.map((m) => [
          m.number,
          `\`${m.path.split("/").pop()}\``,
          m.description.replace(/\|/g, "\\|"),
        ])
      )
    )
  }
  console.log()
  console.log(`## Top ${top} files by churn`)
  console.log()
  console.log(
    mdTable(
      ["Churn", "+", "−", "Path"],
      topFiles.map((f) => [
        String(f.churn),
        String(f.insertions),
        String(f.deletions),
        `\`${f.path}\``,
      ])
    )
  )
}

main().catch((e) => die(3, String(e)))
