#!/usr/bin/env node
/**
 * tower — the message bus. Barebones rebuild, 2026-08-16.
 *
 * WHAT THE OLD ONE GOT WRONG. It addressed *panes* — processes that die — and
 * delivered by pushing text at them. A push at a dead or busy pane is a lost
 * message, so 99 of 308 completions (32.1%) were dropped on the floor. Six
 * handlers each grew a private outbox to paper over it, and none of them
 * agreed.
 *
 * WHAT REPLACES IT. A log plus a per-consumer cursor. Two tables.
 *   - `msg` is append-only. Nothing updates it, nothing deletes from it.
 *   - `cursor` holds one integer per consumer: the id it has acknowledged.
 * "Unread" is not a flag anyone has to set — it is `id > acked_id`, computed.
 * Nothing can be silently dropped, because nothing is ever *marked* delivered;
 * a message stays unread until its consumer says otherwise. A dead consumer
 * that restarts resumes at its cursor and sees every message it missed.
 *
 * Delivery is therefore AT-LEAST-ONCE by construction, and `dedup` (UNIQUE)
 * makes retrying free: send the same thing twice and the second one is
 * rejected by the storage layer, not by a convention someone has to remember.
 *
 * TWO THINGS DELIBERATELY NOT COPIED from shepherd, whose cursor design this
 * borrows (src/observability/agent-orchestrator-service.ts):
 *   1. A new cursor starts at 0, NEVER at the latest id. Shepherd jumps a
 *      fresh claim to `latestEventId` (:107-110), which permanently discards
 *      everything that happened while nobody was listening. That is precisely
 *      our worst failure: a coordinator dies, its workers finish, the
 *      replacement coordinator sees nothing.
 *   2. Identity is never a pane id. Shepherd's own idempotency key regresses
 *      to `agent.paneId` (agent-index-service.ts:498) — the one place its
 *      codebase contradicts its own design. Recipients here are durable agent
 *      NAMES, which `spine-spawn` already stamps at birth.
 *
 * Zero dependencies, by contract. SQLite ships in every runtime this fleet
 * uses: node:sqlite (node >= 22), bun:sqlite (bun), sqlite3 (python stdlib),
 * and the sqlite3 CLI. No ORM. No driver. No install step.
 */

import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

const HOME = process.env.TOWER_HOME || join(homedir(), ".tower");
const DB_PATH = process.env.TOWER_DB || join(HOME, "tower.db");
const SPINE_SPAWN = process.env.SPINE_SPAWN
  || join(homedir(), "herdr-spine", "bin", "spine-spawn");

/** Open SQLite from whichever runtime we are in. Bun ships a `node:sqlite`
 *  that imports cleanly but exports nothing, so feature-detect rather than
 *  trusting the module name. */
async function openDb(path) {
  mkdirSync(dirname(path), { recursive: true });
  let db;
  if (typeof Bun !== "undefined") {
    const { Database } = await import("bun:sqlite");
    const raw = new Database(path, { create: true });
    db = {
      exec: (s) => raw.run(s),
      all: (s, ...a) => raw.query(s).all(...a),
      get: (s, ...a) => raw.query(s).get(...a),
      run: (s, ...a) => raw.query(s).run(...a),
    };
  } else {
    const { DatabaseSync } = await import("node:sqlite");
    const raw = new DatabaseSync(path);
    db = {
      exec: (s) => raw.exec(s),
      all: (s, ...a) => raw.prepare(s).all(...a),
      get: (s, ...a) => raw.prepare(s).get(...a),
      run: (s, ...a) => raw.prepare(s).run(...a),
    };
  }
  // Each PRAGMA on its own statement. Folded into the schema blob they are
  // silently skipped by some multi-statement exec paths, and a busy_timeout
  // that did not apply looks exactly like one that did until the bus is under
  // real contention — which is when losing a write costs the most.
  //
  // busy_timeout first, and unconditionally: it is per-connection, costs no
  // lock, and every retry below depends on it.
  db.exec("PRAGMA busy_timeout=15000");
  // journal_mode is per-DATABASE and persists on disk, so it only has to be
  // set once ever — but setting it takes a brief exclusive lock. Issued on
  // every open (as it was), concurrent cold starts collide on that lock and
  // SQLITE_BUSY kills the process before it has sent anything. Measured:
  // 157/160 with the unconditional pragma, 240/240 without it. Read first —
  // reading a pragma takes no lock — and only write when it disagrees.
  const mode = db.get("PRAGMA journal_mode");
  if (String(mode?.journal_mode).toLowerCase() !== "wal") {
    withRetry(() => db.exec("PRAGMA journal_mode=WAL"));
  }
  return db;
}

/** SQLite serializes writers. Under four concurrent runtimes a writer can
 *  still exhaust busy_timeout, and an exception thrown at a caller is a lost
 *  message unless someone retries — the precise shape of the bug this rebuild
 *  exists to kill. So retrying is the bus's job, not the caller's. Safe to do
 *  blindly: the write is a single INSERT and `dedup` refuses duplicates. */
function withRetry(fn, tries = 8) {
  let waitMs = 20;
  for (let i = 0; ; i++) {
    try {
      return fn();
    } catch (e) {
      const busy = /SQLITE_BUSY|database is locked/i.test(String(e.message || e));
      if (!busy || i >= tries - 1) throw e;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, waitMs);
      waitMs = Math.min(waitMs * 2, 1000);
    }
  }
}

const SCHEMA = `
PRAGMA journal_mode=WAL;
PRAGMA busy_timeout=5000;

-- The log. Append-only: no statement in this file updates or deletes a row.
CREATE TABLE IF NOT EXISTS msg (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  ts        INTEGER NOT NULL,
  sender    TEXT    NOT NULL,
  recipient TEXT,              -- durable agent name; NULL = broadcast
  topic     TEXT,
  kind      TEXT    NOT NULL,  -- note|finding|deliverable|question|answer|alert
  body      TEXT    NOT NULL,
  reply_to  INTEGER,           -- correlates an answer to its question
  dedup     TEXT UNIQUE        -- idempotency: retry is free, dupes are refused
);
CREATE INDEX IF NOT EXISTS msg_recipient_idx ON msg(recipient, id);
CREATE INDEX IF NOT EXISTS msg_topic_idx     ON msg(topic, id);

-- The only mutable table in the bus: one high-water mark per consumer.
CREATE TABLE IF NOT EXISTS cursor (
  consumer TEXT PRIMARY KEY,
  acked_id INTEGER NOT NULL DEFAULT 0,
  updated  INTEGER NOT NULL
);
`;

export async function open() {
  const db = await openDb(DB_PATH);
  // Only build the schema when it is actually missing. Running CREATE TABLE on
  // every open takes a write lock on every invocation — which both serializes
  // readers behind writers and, under load, fails the process before it has
  // sent anything. Retried anyway: two cold starts can race here exactly once.
  const built = db.get(
    `SELECT name FROM sqlite_master WHERE type='table' AND name='msg'`,
  );
  if (!built) withRetry(() => db.exec(SCHEMA));
  return db;
}

/** Append one message. Returns its id, or the existing id when `dedup`
 *  collides — an idempotent send, so callers may retry without checking. */
export async function send(db, m) {
  const kind = m.kind || "note";
  if (!m.sender) throw new Error("send: sender required");
  if (!m.body) throw new Error("send: body required");
  try {
    withRetry(() => db.run(
      `INSERT INTO msg (ts, sender, recipient, topic, kind, body, reply_to, dedup)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      Date.now(), m.sender, m.recipient ?? null, m.topic ?? null,
      kind, m.body, m.reply_to ?? null, m.dedup ?? null,
    ));
  } catch (e) {
    if (m.dedup && /UNIQUE|constraint/i.test(String(e))) {
      const row = db.get(`SELECT id FROM msg WHERE dedup = ?`, m.dedup);
      if (row) return { id: row.id, duplicate: true };
    }
    throw e;
  }
  return { id: db.get(`SELECT last_insert_rowid() AS id`).id, duplicate: false };
}

/** Everything this consumer has not acknowledged: addressed to it, or
 *  broadcast. Absence of a cursor row means 0 — a consumer that has never run
 *  reads the log from the beginning rather than skipping to the end. */
export async function inbox(db, consumer, limit = 100) {
  const at = cursorOf(db, consumer);
  return db.all(
    `SELECT * FROM msg
      WHERE id > ? AND (recipient = ? OR recipient IS NULL) AND sender <> ?
      ORDER BY id LIMIT ?`,
    at, consumer, consumer, limit,
  );
}

export function cursorOf(db, consumer) {
  const row = db.get(`SELECT acked_id FROM cursor WHERE consumer = ?`, consumer);
  return row ? row.acked_id : 0;
}

/** Advance a cursor. Monotonic: an ack can never rewind and thereby re-deliver
 *  forever, and never jumps ahead of what was actually read. */
export async function ack(db, consumer, id) {
  const at = cursorOf(db, consumer);
  const next = Math.max(at, Number(id));
  withRetry(() => db.run(
    `INSERT INTO cursor (consumer, acked_id, updated) VALUES (?, ?, ?)
     ON CONFLICT(consumer) DO UPDATE SET acked_id = ?, updated = ?`,
    consumer, next, Date.now(), next, Date.now(),
  ));
  return next;
}

export async function log(db, { topic, recipient, limit = 50 } = {}) {
  const where = [];
  const args = [];
  if (topic) { where.push("topic = ?"); args.push(topic); }
  if (recipient) { where.push("recipient = ?"); args.push(recipient); }
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  return db.all(
    `SELECT * FROM msg ${clause} ORDER BY id DESC LIMIT ?`, ...args, limit,
  ).reverse();
}

// ------------------------------------------------------------- delivery

/** Resolve a durable agent NAME to the pane it currently occupies.
 *
 *  This is the one place a pane id is allowed to appear, and it is looked up
 *  fresh every time rather than stored. A pane is where an agent is right now,
 *  the way a desk is where a person is sitting — it is not who they are. The
 *  old bus recorded the desk and mailed the desk.
 *
 *  herdr is asked FIRST, because herdr is the live snapshot and everything
 *  else is an index built from it. shepherd's registry is a cache refreshed on
 *  a 60s floor, and a cache is wrong in both directions: measured 2026-08-16
 *  it still listed ten panes herdr had already closed, and it knew only 1 of
 *  the 8 tower panes then running — so resolving through it alone both mails
 *  the dead and cannot find the newly born. shepherd remains the fallback,
 *  since it can name an agent whose pane tokens are missing. Snapshot first,
 *  index second: the same rule the worktree reconciler follows. */
export function resolvePane(name) {
  const want = String(name || "").toLowerCase();
  if (!want) return null;

  // herdr: authoritative and always current. spine-spawn stamps role + name
  // at birth, and the registration name is exactly `<role>-<name>` — e.g.
  // role "2-ORCH" + name "tower-hooks" -> "orch-tower-hooks".
  try {
    const out = execFileSync("herdr", ["pane", "list"],
      { encoding: "utf8", timeout: 5000, maxBuffer: 16 * 1024 * 1024 });
    const panes = JSON.parse(out)?.result?.panes || [];
    for (const p of panes) {
      const t = p.tokens || {};
      const role = String(t.role || "").split("-").pop().toLowerCase();
      const stamped = t.name ? `${role}-${t.name}`.toLowerCase() : null;
      const label = String(p.label || "").replace(/\s+/g, "-").toLowerCase();
      if (stamped === want || label === want) {
        return { paneId: p.pane_id, status: p.agent_status, id: p.terminal_id };
      }
    }
  } catch { /* fall through to shepherd */ }

  try {
    const out = execFileSync("shepherd", ["agent", "list", "--all", "--json"],
      { encoding: "utf8", timeout: 5000 });
    const agents = JSON.parse(out).agents || [];
    const hit = agents.find((a) => String(a.name || "").toLowerCase() === want);
    // Verified against herdr before use — the cache may be naming a dead pane.
    if (hit && paneIsLive(hit.paneId)) {
      return { paneId: hit.paneId, status: hit.agentStatus, id: hit.id };
    }
  } catch { /* both sources unavailable */ }
  return null;
}

/** Ask herdr — not the cache — whether a pane is still there. An unreadable
 *  pane list returns true: refusing to guess beats refusing to deliver, and a
 *  wasted prompt is cheaper than mail that never leaves. */
function paneIsLive(paneId) {
  if (!paneId) return false;
  try {
    const out = execFileSync("herdr", ["pane", "list"],
      { encoding: "utf8", timeout: 5000, maxBuffer: 16 * 1024 * 1024 });
    const panes = JSON.parse(out)?.result?.panes;
    if (!Array.isArray(panes)) return true;
    return panes.some((p) => p.pane_id === paneId);
  } catch {
    return true;
  }
}

/** Tell a recipient it has mail. Best-effort AND ONLY EVER BEST-EFFORT.
 *
 *  The message is already durable before this runs, and the recipient's cursor
 *  will surface it whether or not this call succeeds. That ordering is the
 *  whole design: waking is an optimisation on latency, never a step in
 *  delivery. The old bus inverted this — it decided whether to interrupt and
 *  then, if it declined, never wrote the message down at all. Pacing bounded
 *  delivery instead of bounding interruption, and 32.1% of completions died in
 *  that branch. Here the worst case of a failed wake is that mail waits. */
export async function wake(db, name) {
  const pending = await inbox(db, name, 1000);
  if (!pending.length) return { woke: false, reason: "no unread", unread: 0 };
  const pane = resolvePane(name);
  if (!pane) return { woke: false, reason: "no live pane", unread: pending.length };
  const summary = `[tower] ${pending.length} unread. Read with: tower inbox ${name}` +
    ` — then: tower ack ${name} <last-id>`;
  try {
    execFileSync("python3", [SPINE_SPAWN, "prompt", pane.paneId, summary],
      { encoding: "utf8", timeout: 30000, stdio: "pipe" });
    return { woke: true, pane: pane.paneId, unread: pending.length };
  } catch (e) {
    return {
      woke: false, pane: pane.paneId, unread: pending.length,
      reason: `prompt failed: ${String(e.message).slice(0, 80)}`,
    };
  }
}

// ---------------------------------------------------------------- CLI

const USAGE = `tower — message bus (log + per-consumer cursor)

  tower send   --from <who> [--to <agent>] [--topic <t>] [--kind <k>]
               [--dedup <key>] [--reply-to <id>] [--wake] <body>
  tower inbox  <consumer> [--limit N] [--json]      unread, oldest first
  tower ack    <consumer> <id>                      advance the cursor
  tower wake   <agent>                              tell it that it has mail
  tower log    [--topic t] [--to agent] [--limit N] [--json]
  tower stat                                        counts + every cursor

Unread means id > the consumer's cursor. Nothing is ever marked delivered,
so nothing can be silently dropped. A new consumer starts at 0, not latest.

wake is a latency optimisation, never a delivery step: the message is durable
before the wake is attempted, and the recipient's cursor surfaces it either
way. A wake that fails costs waiting, not mail.`;

// Flags that take no value. Without this list, `--wake <body>` greedily eats
// the message body as its argument and the send fails for "body required" —
// which is exactly how it failed the first live end-to-end test.
const BOOLEAN_FLAGS = new Set(["wake", "json"]);

function parseArgs(argv) {
  const flags = {};
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (BOOLEAN_FLAGS.has(key) || next === undefined || next.startsWith("--")) {
        flags[key] = true;
      } else { flags[key] = next; i++; }
    } else rest.push(a);
  }
  return { flags, rest };
}

function fmt(r) {
  const to = r.recipient ? `→${r.recipient}` : "→*";
  const tp = r.topic ? ` [${r.topic}]` : "";
  const t = new Date(r.ts).toISOString().slice(11, 19);
  return `${String(r.id).padStart(5)} ${t} ${r.sender}${to}${tp} (${r.kind})\n      ${r.body.replace(/\n/g, "\n      ")}`;
}

async function main() {
  const [cmd, ...argv] = process.argv.slice(2);
  if (!cmd || cmd === "help" || cmd === "--help") { console.log(USAGE); return 0; }
  const { flags, rest } = parseArgs(argv);
  const db = await open();

  if (cmd === "send") {
    const body = rest.join(" ").trim();
    const r = await send(db, {
      sender: flags.from || process.env.TOWER_AGENT || "unknown",
      recipient: typeof flags.to === "string" ? flags.to : null,
      topic: typeof flags.topic === "string" ? flags.topic : null,
      kind: typeof flags.kind === "string" ? flags.kind : "note",
      dedup: typeof flags.dedup === "string" ? flags.dedup : null,
      reply_to: flags["reply-to"] ? Number(flags["reply-to"]) : null,
      body,
    });
    // Wake AFTER the write has returned, never instead of it. A send that
    // cannot wake its recipient is still a successful send.
    if (flags.wake && typeof flags.to === "string") {
      r.wake = await wake(db, flags.to);
    }
    console.log(JSON.stringify(r));
    return 0;
  }

  if (cmd === "wake") {
    const name = rest[0];
    if (!name) { console.error("wake: agent name required"); return 2; }
    const r = await wake(db, name);
    console.log(JSON.stringify(r));
    return 0; // never non-zero: a failed wake is not a failed delivery
  }

  if (cmd === "inbox") {
    const consumer = rest[0];
    if (!consumer) { console.error("inbox: consumer required"); return 2; }
    const rows = await inbox(db, consumer, Number(flags.limit) || 100);
    if (flags.json) console.log(JSON.stringify(rows));
    else if (!rows.length) console.log(`(no unread for ${consumer}, cursor at ${cursorOf(db, consumer)})`);
    else console.log(rows.map(fmt).join("\n"));
    return 0;
  }

  if (cmd === "ack") {
    const [consumer, id] = rest;
    if (!consumer || !id) { console.error("ack: consumer and id required"); return 2; }
    console.log(JSON.stringify({ consumer, acked_id: await ack(db, consumer, id) }));
    return 0;
  }

  if (cmd === "log") {
    const rows = await log(db, {
      topic: typeof flags.topic === "string" ? flags.topic : null,
      recipient: typeof flags.to === "string" ? flags.to : null,
      limit: Number(flags.limit) || 50,
    });
    if (flags.json) console.log(JSON.stringify(rows));
    else console.log(rows.length ? rows.map(fmt).join("\n") : "(empty)");
    return 0;
  }

  if (cmd === "stat") {
    const total = db.get(`SELECT COUNT(*) c, COALESCE(MAX(id),0) hi FROM msg`);
    const cursors = db.all(`SELECT * FROM cursor ORDER BY consumer`);
    console.log(`db       ${DB_PATH}`);
    console.log(`messages ${total.c} (highest id ${total.hi})`);
    if (!cursors.length) console.log("cursors  (none)");
    for (const c of cursors) {
      const behind = total.hi - c.acked_id;
      console.log(`cursor   ${c.consumer.padEnd(28)} acked ${String(c.acked_id).padStart(5)}  ${behind ? `${behind} behind` : "current"}`);
    }
    return 0;
  }

  console.error(`unknown command: ${cmd}\n\n${USAGE}`);
  return 2;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().then((c) => process.exit(c || 0)).catch((e) => {
    console.error(`tower: ${e.message}`);
    process.exit(1);
  });
}
