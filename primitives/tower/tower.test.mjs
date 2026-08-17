#!/usr/bin/env node
/**
 * tower tests — each one pins a specific way the previous bus lost messages.
 * Run: node primitives/tower/tower.test.mjs
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const HERE = new URL(".", import.meta.url).pathname;
const TOWER = join(HERE, "tower.mjs");

let pass = 0, fail = 0;
function check(name, cond, detail = "") {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ""}`); }
}

async function withDb(fn) {
  const dir = mkdtempSync(join(tmpdir(), "tower-test-"));
  process.env.TOWER_DB = join(dir, "t.db");
  const mod = await import(`${TOWER}?v=${Math.random()}`);
  try { await fn(mod); } finally { rmSync(dir, { recursive: true, force: true }); }
}

// The headline defect: 99/308 completions dropped because a push at a pane
// that was dead or busy went nowhere. Here nothing is pushed at all.
await withDb(async ({ open, send, inbox, ack, cursorOf }) => {
  console.log("\nno consumer alive when the work finishes");
  const db = await open();
  for (const w of ["w1", "w2", "w3"]) {
    await send(db, { sender: `agnt-${w}`, recipient: "cord", kind: "deliverable", body: `${w} done` });
  }
  const first = await inbox(db, "cord");
  check("a consumer that never existed still receives every message", first.length === 3, `got ${first.length}`);
  check("a brand-new cursor starts at 0, not at the latest id", cursorOf(db, "cord") === 0);

  await ack(db, "cord", first[1].id);
  const second = await inbox(db, "cord");
  check("acked messages do not reappear", second.length === 1, `got ${second.length}`);
  check("the unacked one survives a consumer restart", second[0].body === "w3 done");
});

// Retry has to be free, or callers invent their own outboxes — which is how
// the old bus ended up with six mutually inconsistent ones.
await withDb(async ({ open, send, inbox }) => {
  console.log("\nidempotency");
  const db = await open();
  const a = await send(db, { sender: "w", recipient: "c", body: "done", dedup: "w-done" });
  const b = await send(db, { sender: "w", recipient: "c", body: "done", dedup: "w-done" });
  check("a re-send returns the original id", a.id === b.id, `${a.id} vs ${b.id}`);
  check("the re-send is reported as a duplicate", b.duplicate === true);
  check("the log holds one copy, not two", (await inbox(db, "c")).length === 1);
});

// A cursor that can move backwards redelivers forever; one that can jump
// forward skips. Both are silent.
await withDb(async ({ open, send, ack, cursorOf }) => {
  console.log("\ncursor is monotonic");
  const db = await open();
  await send(db, { sender: "w", recipient: "c", body: "one" });
  await send(db, { sender: "w", recipient: "c", body: "two" });
  await ack(db, "c", 2);
  await ack(db, "c", 1);
  check("an ack cannot rewind", cursorOf(db, "c") === 2, `got ${cursorOf(db, "c")}`);
});

// Fanout must reach every tier: CORD -> ORCH -> AGNT. Shepherd's
// single-owner-per-scope model cannot express this, which is why it is not
// the bus.
await withDb(async ({ open, send, inbox }) => {
  console.log("\naddressing");
  const db = await open();
  await send(db, { sender: "op", recipient: "cord", body: "direct" });
  await send(db, { sender: "op", topic: "house/all", body: "broadcast" });
  const cord = await inbox(db, "cord");
  const orch = await inbox(db, "orch");
  check("a direct message reaches its recipient", cord.some((m) => m.body === "direct"));
  check("a broadcast reaches everyone", orch.some((m) => m.body === "broadcast"));
  check("a direct message reaches nobody else", !orch.some((m) => m.body === "direct"));
  check("a sender does not read its own messages", !(await inbox(db, "op")).some((m) => m.sender === "op"));
});

// Every runtime in this fleet writes to the bus. A write lost to lock
// contention is a lost message, so contention is the bus's problem to solve.
await withDb(async () => {
  console.log("\nconcurrent cold-start writers (the pattern hooks use)");
  const db = process.env.TOWER_DB;
  execFileSync(process.execPath, [TOWER, "stat"], { env: process.env });
  const N = 25;
  const { spawn } = await import("node:child_process");
  const kids = ["node", "bun"].flatMap((rt) =>
    Array.from({ length: N }, (_, i) =>
      new Promise((res) => {
        const p = spawn(rt, [TOWER, "send", "--from", rt, "--to", "c", `${rt}-${i}`], {
          env: { ...process.env, TOWER_DB: db }, stdio: "ignore",
        });
        p.on("close", (code) => res(code));
        p.on("error", () => res(-1));
      })),
  );
  const codes = await Promise.all(kids);
  const bad = codes.filter((c) => c !== 0).length;
  check(`${N * 2} concurrent cold-start sends all exit 0`, bad === 0, `${bad} failed`);
  const { open, log } = await import(`${TOWER}?v=${Math.random()}`);
  const d = await open();
  const rows = await log(d, { limit: 500 });
  check("every send landed exactly once", rows.length === N * 2, `got ${rows.length}`);
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
