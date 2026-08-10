#!/usr/bin/env bun
// statem — gen_statem-style tracker for Made Well state (.madewell/).
// Explicit state enums, explicit logged transitions, nothing implicit.
// Every transition = one board row (~/.tower/board.jsonl, type "finding",
// topic "statem") + optional herdr tab-title glyphs. stdout is the trace.
// Brief: ~/agent-core/briefs/agnt-statem-core.md
import { readFileSync, writeFileSync, appendFileSync, existsSync, realpathSync } from "node:fs";
import { join, basename } from "node:path";
import { homedir } from "node:os";

// ── States (the enums ARE the spec; source: future/.madewell/guides/STATE-SHAPE.md) ──
const OUTER = ["discovery", "commit", "build", "land"]; // outer stage
const INNER = ["imagine", "plan", "make", "verify"]; //    inner phase
const ABSENT = "absent"; // a cycle/item not present in the state at all

// ── CLI ──────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
if (!argv[0] || argv[0].startsWith("--")) {
  console.error(
    "usage: bun statem.ts <project-root> [--interval ms] [--once] [--board path] [--tabs path] [--no-tabs] [--baseline path]",
  );
  process.exit(1);
}
const opt = (name, def) => {
  const i = argv.indexOf(name);
  return i > 0 && argv[i + 1] ? argv[i + 1] : def;
};
const ROOT = realpathSync(argv[0]);
const PROJECT = basename(ROOT);
const ONCE = argv.includes("--once");
const NO_TABS = argv.includes("--no-tabs");
const INTERVAL = Number(opt("--interval", "2000"));
const BOARD = opt("--board", join(homedir(), ".tower", "board.jsonl"));
const TABS = opt("--tabs", join(homedir(), ".tower", "statem-tabs.json"));
const BASELINE = opt("--baseline", join(homedir(), ".tower", `statem-${PROJECT}.json`));

// ── readState: pure read of .madewell/, no side effects ─────────────────────
// Cycle files have two shapes in the wild; both are tolerated:
//   c004-style: imagine[] items carry their own `status`
//   c001-style: item state comes from bare done[]/active[] id arrays
//   (observed hybrid: imagine[] items with NO status — fall through to the arrays)
function readState(root) {
  const mw = JSON.parse(readFileSync(join(root, ".madewell", "madewell.json"), "utf8"));
  const state = { outer: mw.stage, cycles: {} };
  const seen = new Set(); // two parent d-items may share one cycle file: dedupe
  for (const entry of mw.active ?? []) {
    if (!entry.cycle || seen.has(entry.cycle)) continue;
    seen.add(entry.cycle);
    const c = JSON.parse(readFileSync(join(root, entry.cycle), "utf8"));
    const done = c.done ?? [], act = c.active ?? [];
    const items = {};
    if (Array.isArray(c.imagine)) {
      for (const it of c.imagine)
        items[it.id] = it.status ?? (done.includes(it.id) ? "done" : act.includes(it.id) ? "active" : ABSENT);
    } else {
      for (const id of done) items[id] = "done";
      for (const id of act) items[id] = "active";
    }
    state.cycles[c.id ?? basename(entry.cycle, ".json")] = { phase: c.phase, items };
  }
  return state;
}

// ── transitions: THE transition table. Pure: (prev, next) -> records ────────
// `ok:false` marks a state value outside its enum (logged as-is, `?`-flagged).
function transitions(prev, next, project) {
  const out = [];
  const rec = (body, ok = true) => out.push({ body, ok });
  const inEnum = (v, en) => en.includes(v);
  if (prev.outer !== next.outer)
    rec(`${project} OUTER ${prev.outer}→${next.outer}`, inEnum(prev.outer, OUTER) && inEnum(next.outer, OUTER));
  for (const cid of new Set([...Object.keys(prev.cycles), ...Object.keys(next.cycles)])) {
    const p = prev.cycles[cid], n = next.cycles[cid];
    if (!p) { rec(`${project} INNER ${cid} ${ABSENT}→${n.phase} (opened)`, inEnum(n.phase, INNER)); continue; }
    if (!n) { rec(`${project} INNER ${cid} ${p.phase}→${ABSENT} (closed)`, inEnum(p.phase, INNER)); continue; }
    if (p.phase !== n.phase)
      rec(`${project} INNER ${cid} ${p.phase}→${n.phase}`, inEnum(p.phase, INNER) && inEnum(n.phase, INNER));
    for (const iid of new Set([...Object.keys(p.items), ...Object.keys(n.items)])) {
      const ps = p.items[iid] ?? ABSENT, ns = n.items[iid] ?? ABSENT;
      if (ps !== ns) rec(`${project} INNER ${cid} ${ps}→${ns} (${iid})`);
    }
  }
  return out;
}

// ── plumbing: board append, tab glyphs, poll loop ────────────────────────────
function appendBoard(body) {
  const row = {
    id: "statem-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6),
    ts: new Date().toISOString(),
    cwd: ROOT,
    type: "finding",
    from: `statem@${PROJECT}`,
    topic: "statem",
    body,
  };
  appendFileSync(BOARD, JSON.stringify(row) + "\n");
}

const glyphs = (v, en) => "▰".repeat(en.indexOf(v) + 1).padEnd(4, "▱"); // unknown -> ▱▱▱▱

function renameTabs(state) {
  let cfg;
  try {
    cfg = JSON.parse(readFileSync(TABS, "utf8"));
  } catch (e) {
    console.error(`statem: tabs config unreadable, skipping renames: ${e.message}`);
    return;
  }
  for (const t of cfg[ROOT] ?? []) {
    let extra;
    if (!t.cycle || t.cycle === "*") {
      extra = [glyphs(state.outer, OUTER)];
    } else {
      const c = state.cycles[t.cycle];
      if (!c) continue;
      extra = [glyphs(c.phase, INNER)];
      const st = Object.values(c.items);
      const nDone = st.filter((s) => s === "done").length;
      if (st.length) extra.push(`●${nDone}◐${st.length - nDone}`);
    }
    const r = Bun.spawnSync(["herdr", "tab", "rename", t.tab_id, t.label, ...extra]);
    if (r.exitCode !== 0)
      console.error(`statem: tab rename ${t.tab_id} failed: ${r.stderr.toString().trim()}`);
  }
}

let prev = existsSync(BASELINE) ? JSON.parse(readFileSync(BASELINE, "utf8")) : null;
const wasCold = prev === null;

function poll() {
  let next;
  try {
    next = readState(ROOT);
  } catch (e) {
    console.error(`statem: poll skipped: ${e.message}`);
    return;
  }
  if (prev === null) {
    // Cold start: seed the baseline, no transition spam.
    console.log(`statem: cold start, baseline seeded — ${JSON.stringify(next)}`);
  } else {
    const trs = transitions(prev, next, PROJECT);
    for (const t of trs) {
      appendBoard(t.body);
      console.log(`${new Date().toISOString()} ${t.ok ? "" : "?"}${t.body}`);
    }
    if (trs.length && !NO_TABS) renameTabs(next);
  }
  prev = next;
  try {
    writeFileSync(BASELINE, JSON.stringify(next)); // restart resumes from here
  } catch (e) {
    console.error(`statem: baseline write failed: ${e.message}`);
  }
}

poll();
if (ONCE) {
  if (!wasCold && prev) console.log(`statem: state — ${JSON.stringify(prev)}`);
  process.exit(0);
}
setInterval(poll, INTERVAL);
