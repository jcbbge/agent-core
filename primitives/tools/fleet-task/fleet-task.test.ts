// fleet-task acceptance tests — derived from make brief AC1–AC12 only.
// AC criterion tagged in each test name. No implementation reads.
import { describe, test, expect, afterEach } from "bun:test";
import { existsSync, mkdtempSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  CLI,
  AGENT_CORE_ROOT,
  freshHome,
  runFleetTask,
  readStore,
  seedMissionUnit,
  tailBoardFindings,
  boardLineCount,
  cleanupHome,
  loadHerdrPaneFixture,
  runFleetTaskWithHerdr,
} from "./test-helpers";

const GLYPH = {
  pending: "○",
  in_progress: "◐",
  completed: "✓",
  cancelled: "⊘",
} as const;

let homes: string[] = [];
afterEach(() => {
  for (const h of homes) cleanupHome(h);
  homes = [];
});

function home(): string {
  const h = freshHome();
  homes.push(h);
  return h;
}

describe("fleet-task acceptance", () => {
  test("AC1 — init creates state.json; mission/unit open persist schema; duplicate mission fails", () => {
    const h = home();
    const init = runFleetTask(["init", "--role", "cord"], h);
    expect(init.status).toBe(0);
    expect(existsSync(join(h, "state.json"))).toBe(true);

    const store0 = readStore(h);
    expect(store0.version).toBe(1);
    expect(store0.missions).toEqual({});

    const mo = runFleetTask(
      [
        "mission",
        "open",
        "--id",
        "m-ac1",
        "--project",
        "agent-core",
        "--project-root",
        AGENT_CORE_ROOT,
        "--title",
        "AC1 mission",
      ],
      h,
      { FLEET_TASK_ROLE: "cord" },
    );
    expect(mo.status).toBe(0);

    const uo = runFleetTask(
      [
        "unit",
        "open",
        "--mission",
        "m-ac1",
        "--id",
        "u-ac1",
        "--title",
        "AC1 unit",
        "--owner-agent",
        "orch-ac1",
      ],
      h,
      { FLEET_TASK_ROLE: "orch" },
    );
    expect(uo.status).toBe(0);

    const store = readStore(h);
    const mission = (store.missions as Record<string, Record<string, unknown>>)["m-ac1"];
    expect(mission).toBeDefined();
    expect(mission.id).toBe("m-ac1");
    expect(mission.project).toBe("agent-core");
    expect(mission.project_root).toBe(AGENT_CORE_ROOT);
    expect(mission.title).toBe("AC1 mission");
    expect(mission.rollup_status).toBe("pending");
    expect(mission.progress).toEqual({
      pending: 1,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
      total: 1,
    });
    expect(typeof mission.created_at).toBe("string");
    expect(typeof mission.updated_at).toBe("string");

    const unit = (mission.units as Record<string, Record<string, unknown>>)["u-ac1"];
    expect(unit).toBeDefined();
    expect(unit.id).toBe("u-ac1");
    expect(unit.title).toBe("AC1 unit");
    expect(unit.owner_agent).toBe("orch-ac1");
    expect(unit.rollup_status).toBe("pending");
    expect(Array.isArray(unit.tasks)).toBe(true);
    expect((unit.tasks as unknown[]).length).toBe(0);

    const dup = runFleetTask(
      [
        "mission",
        "open",
        "--id",
        "m-ac1",
        "--project",
        "agent-core",
        "--project-root",
        AGENT_CORE_ROOT,
        "--title",
        "duplicate",
      ],
      h,
      { FLEET_TASK_ROLE: "cord" },
    );
    expect(dup.status).not.toBe(0);
    expect(dup.stderr.length).toBeGreaterThan(0);
  });

  test("AC2 — write seed + merge patch; read/unit show + rollups per §1.5", () => {
    const h = home();
    seedMissionUnit(h, "m-ac2", "u-ac2");

    const seedJson = JSON.stringify([
      { id: "t1", content: "first", status: "pending", owner_role: "orch" },
      { id: "t2", content: "second", status: "pending", owner_role: "orch" },
    ]);
    const seed = runFleetTask(
      ["write", "--unit", "u-ac2", "--merge", "false", "--json", seedJson, "--role", "orch"],
      h,
    );
    expect(seed.status).toBe(0);

    const patchJson = JSON.stringify([
      { id: "t1", content: "first patched", status: "in_progress", owner_role: "orch" },
    ]);
    const patch = runFleetTask(
      ["write", "--unit", "u-ac2", "--merge", "true", "--json", patchJson, "--role", "orch"],
      h,
    );
    expect(patch.status).toBe(0);

    const show = runFleetTask(["unit", "show", "--id", "u-ac2"], h);
    expect(show.status).toBe(0);
    const unitShow = JSON.parse(show.stdout);
    expect(unitShow.tasks).toHaveLength(2);
    const t1 = unitShow.tasks.find((t: { id: string }) => t.id === "t1");
    const t2 = unitShow.tasks.find((t: { id: string }) => t.id === "t2");
    expect(t1.content).toBe("first patched");
    expect(t1.status).toBe("in_progress");
    expect(t2.content).toBe("second");
    expect(t2.status).toBe("pending");

    const read = runFleetTask(["read", "--unit", "u-ac2"], h);
    expect(read.status).toBe(0);
    const readBody = JSON.parse(read.stdout);
    expect(readBody.units?.["u-ac2"]?.tasks?.length ?? readBody.tasks?.length).toBeGreaterThan(0);

    const store = readStore(h);
    const unit = (
      (store.missions as Record<string, Record<string, unknown>>)["m-ac2"].units as Record<
        string,
        Record<string, unknown>
      >
    )["u-ac2"];
    expect(unit.progress).toEqual({
      pending: 1,
      in_progress: 1,
      completed: 0,
      cancelled: 0,
      total: 2,
    });
    expect(unit.rollup_status).toBe("in_progress");

    const mission = (store.missions as Record<string, Record<string, unknown>>)["m-ac2"];
    expect(mission.rollup_status).toBe("in_progress");
    expect(mission.progress).toEqual({
      pending: 0,
      in_progress: 1,
      completed: 0,
      cancelled: 0,
      total: 1,
    });
  });

  test("AC3 — render prints ○ ◐ ✓ ⊘ for mixed statuses", () => {
    const h = home();
    seedMissionUnit(h, "m-ac3", "u-ac3");

    const tasks = JSON.stringify([
      { id: "tp", content: "pending row", status: "pending", owner_role: "orch" },
      { id: "ti", content: "active row", status: "in_progress", owner_role: "orch" },
      { id: "tc", content: "done row", status: "completed", owner_role: "orch" },
      { id: "tx", content: "cancel row", status: "cancelled", owner_role: "orch" },
    ]);
    runFleetTask(
      ["write", "--unit", "u-ac3", "--merge", "false", "--json", tasks, "--role", "orch"],
      h,
    );

    const render = runFleetTask(["render", "--unit", "u-ac3"], h);
    expect(render.status).toBe(0);
    expect(render.stderr).toBe("");
    const out = render.stdout;
    expect(out).toContain(GLYPH.pending);
    expect(out).toContain(GLYPH.in_progress);
    expect(out).toContain(GLYPH.completed);
    expect(out).toContain(GLYPH.cancelled);
    expect(out).toContain("pending row");
    expect(out).toContain("active row");
    expect(out).toContain("done row");
    expect(out).toContain("cancel row");
  });

  test("AC4 — illegal transition rejected; store unchanged for that task", () => {
    const h = home();
    seedMissionUnit(h, "m-ac4", "u-ac4");

    const seed = JSON.stringify([
      { id: "t1", content: "done", status: "completed", owner_role: "orch" },
    ]);
    runFleetTask(
      ["write", "--unit", "u-ac4", "--merge", "false", "--json", seed, "--role", "orch"],
      h,
    );

    const badPending = JSON.stringify([
      { id: "t1", content: "done", status: "pending", owner_role: "orch" },
    ]);
    const r1 = runFleetTask(
      ["write", "--unit", "u-ac4", "--merge", "true", "--json", badPending, "--role", "orch"],
      h,
    );
    expect(r1.status).not.toBe(0);
    expect(r1.stderr.toLowerCase()).toMatch(/transition|illegal|reject|invalid/);

    const badActive = JSON.stringify([
      { id: "t1", content: "done", status: "in_progress", owner_role: "orch" },
    ]);
    const r2 = runFleetTask(
      ["write", "--unit", "u-ac4", "--merge", "true", "--json", badActive, "--role", "orch"],
      h,
    );
    expect(r2.status).not.toBe(0);

    const store = readStore(h);
    const tasks = (
      (store.missions as Record<string, Record<string, unknown>>)["m-ac4"].units as Record<
        string,
        Record<string, unknown>
      >
    )["u-ac4"].tasks as Array<{ id: string; status: string }>;
    expect(tasks.find((t) => t.id === "t1")?.status).toBe("completed");
  });

  test("AC5 — second orch in_progress in one unit rejected", () => {
    const h = home();
    seedMissionUnit(h, "m-ac5", "u-ac5");

    const bothActive = JSON.stringify([
      { id: "a", content: "A", status: "in_progress", owner_role: "orch" },
      { id: "b", content: "B", status: "in_progress", owner_role: "orch" },
    ]);
    const r = runFleetTask(
      ["write", "--unit", "u-ac5", "--merge", "false", "--json", bothActive, "--role", "orch"],
      h,
    );
    expect(r.status).not.toBe(0);
    expect(r.stderr.length).toBeGreaterThan(0);

    const store = readStore(h);
    const tasks = (
      (store.missions as Record<string, Record<string, unknown>>)["m-ac5"].units as Record<
        string,
        Record<string, unknown>
      >
    )["u-ac5"].tasks as Array<{ status: string }>;
    const inProg = tasks.filter((t) => t.status === "in_progress");
    expect(inProg.length).toBeLessThanOrEqual(1);
  });

  test("AC6 — needs_in_progress true when owner scope has pending and no in_progress", () => {
    const h = home();
    seedMissionUnit(h, "m-ac6", "u-ac6");

    const pendingOnly = JSON.stringify([
      { id: "p1", content: "only pending", status: "pending", owner_role: "orch" },
      { id: "p2", content: "also pending", status: "pending", owner_role: "orch" },
    ]);
    const w = runFleetTask(
      ["write", "--unit", "u-ac6", "--merge", "false", "--json", pendingOnly, "--role", "orch"],
      h,
    );
    expect(w.status).toBe(0);
    const body = JSON.parse(w.stdout);
    expect(body.ok).toBe(true);
    expect(body.needs_in_progress).toBe(true);
    expect(body.unit).toBeDefined();
    expect(body.mission).toBeDefined();
  });

  test("AC7 — prune removes completed/cancelled; rollups recompute", () => {
    const h = home();
    seedMissionUnit(h, "m-ac7", "u-ac7");

    const tasks = JSON.stringify([
      { id: "done", content: "finished", status: "completed", owner_role: "orch" },
      { id: "dead", content: "cancelled", status: "cancelled", owner_role: "orch" },
      { id: "live", content: "still open", status: "pending", owner_role: "orch" },
    ]);
    runFleetTask(
      ["write", "--unit", "u-ac7", "--merge", "false", "--json", tasks, "--role", "orch"],
      h,
    );

    let store = readStore(h);
    let unitTasks = (
      (store.missions as Record<string, Record<string, unknown>>)["m-ac7"].units as Record<
        string,
        Record<string, unknown>
      >
    )["u-ac7"].tasks as Array<{ id: string }>;
    expect(unitTasks.map((t) => t.id).sort()).toEqual(["dead", "done", "live"]);

    const pruneDone = runFleetTask(
      ["prune", "--unit", "u-ac7", "--completed", "--role", "orch"],
      h,
    );
    expect(pruneDone.status).toBe(0);

    store = readStore(h);
    unitTasks = (
      (store.missions as Record<string, Record<string, unknown>>)["m-ac7"].units as Record<
        string,
        Record<string, unknown>
      >
    )["u-ac7"].tasks as Array<{ id: string }>;
    expect(unitTasks.map((t) => t.id).sort()).toEqual(["dead", "live"]);

    const pruneCancel = runFleetTask(
      ["prune", "--unit", "u-ac7", "--cancelled", "--role", "orch"],
      h,
    );
    expect(pruneCancel.status).toBe(0);

    store = readStore(h);
    const unit = (
      (store.missions as Record<string, Record<string, unknown>>)["m-ac7"].units as Record<
        string,
        Record<string, unknown>
      >
    )["u-ac7"];
    unitTasks = unit.tasks as Array<{ id: string }>;
    expect(unitTasks.map((t) => t.id)).toEqual(["live"]);
    expect(unit.progress).toEqual({
      pending: 1,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
      total: 1,
    });
    expect(unit.rollup_status).toBe("pending");
  });

  test("AC8 — role gate: agnt write denied; orch write ok; undeterminable denied; agnt read ok", () => {
    const h = home();
    seedMissionUnit(h, "m-ac8", "u-ac8");

    const payload = JSON.stringify([
      { id: "t1", content: "x", status: "pending", owner_role: "orch" },
    ]);

    const agntWrite = runFleetTask(
      ["write", "--unit", "u-ac8", "--merge", "false", "--json", payload, "--role", "agnt"],
      h,
    );
    expect(agntWrite.status).not.toBe(0);

    const orchWrite = runFleetTask(
      ["write", "--unit", "u-ac8", "--merge", "false", "--json", payload, "--role", "orch"],
      h,
    );
    expect(orchWrite.status).toBe(0);

    const undetWrite = runFleetTask(
      ["write", "--unit", "u-ac8", "--merge", "true", "--json", payload],
      h,
      {},
    );
    expect(undetWrite.status).not.toBe(0);
    expect(undetWrite.stderr).toMatch(/--role/i);

    const agntRead = runFleetTask(["read", "--unit", "u-ac8", "--role", "agnt"], h);
    expect(agntRead.status).toBe(0);
    expect(agntRead.stdout.length).toBeGreaterThan(0);
  });

  test("AC9 — rollup-changing write posts Tower finding with contract topic/from/body", () => {
    const h = home();
    const beforeLines = boardLineCount();
    seedMissionUnit(h, "m-ac9", "u-ac9", AGENT_CORE_ROOT);

    const seed = JSON.stringify([
      { id: "only", content: "one task", status: "pending", owner_role: "orch" },
    ]);
    runFleetTask(
      ["write", "--unit", "u-ac9", "--merge", "false", "--json", seed, "--role", "orch"],
      h,
    );

    const start = JSON.stringify([
      { id: "only", content: "one task", status: "in_progress", owner_role: "orch" },
    ]);
    const wStart = runFleetTask(
      ["write", "--unit", "u-ac9", "--merge", "true", "--json", start, "--role", "orch"],
      h,
    );
    expect(wStart.status).toBe(0);

    const complete = JSON.stringify([
      { id: "only", content: "one task", status: "completed", owner_role: "orch" },
    ]);
    const w = runFleetTask(
      ["write", "--unit", "u-ac9", "--merge", "true", "--json", complete, "--role", "orch"],
      h,
    );
    expect(w.status).toBe(0);

    const findings = tailBoardFindings("agent-core/fleet-tasks", beforeLines);
    const match = findings.find(
      (row) =>
        String(row.from ?? "").startsWith("fleet-task@agent-core") &&
        String(row.body ?? "").includes("→"),
    );
    expect(match).toBeDefined();
    expect(String(match?.body ?? "")).toMatch(/u-ac9|m-ac9/i);
  });

  test("AC10 — /tmp project_root: rollup write exits 0 with Tower post failure warning", () => {
    const h = home();
    const tmpRoot = mkdtempSync(join(tmpdir(), "fleet-task-projroot-"));
    homes.push(tmpRoot);
    runFleetTask(["init", "--role", "cord"], h);
    runFleetTask(
      [
        "mission",
        "open",
        "--id",
        "m-ac10",
        "--project",
        "agent-core",
        "--project-root",
        tmpRoot,
        "--title",
        "tmp mission",
      ],
      h,
      { FLEET_TASK_ROLE: "cord" },
    );
    runFleetTask(
      [
        "unit",
        "open",
        "--mission",
        "m-ac10",
        "--id",
        "u-ac10",
        "--title",
        "tmp unit",
        "--owner-agent",
        "orch-ac10",
      ],
      h,
      { FLEET_TASK_ROLE: "orch" },
    );

    const seed = JSON.stringify([
      { id: "t", content: "task", status: "pending", owner_role: "orch" },
    ]);
    runFleetTask(
      ["write", "--unit", "u-ac10", "--merge", "false", "--json", seed, "--role", "orch"],
      h,
    );

    const rollupChange = JSON.stringify([
      { id: "t", content: "task", status: "in_progress", owner_role: "orch" },
    ]);
    const w = runFleetTask(
      ["write", "--unit", "u-ac10", "--merge", "true", "--json", rollupChange, "--role", "orch"],
      h,
    );
    expect(w.status).toBe(0);
    expect(w.stderr.toLowerCase()).toMatch(/tower|post|refused|warn|fail/);
  });

  test("AC11 — concurrent writers: valid JSON, no lost updates", async () => {
    const h = home();
    seedMissionUnit(h, "m-ac11", "u-ac11");

    const env = { ...process.env, FLEET_TASKS_HOME: h, FLEET_TASK_ROLE: "orch" };
    const writeArgs = (id: string, content: string) => [
      CLI,
      "write",
      "--unit",
      "u-ac11",
      "--merge",
      "true",
      "--role",
      "orch",
      "--json",
      JSON.stringify([{ id, content, status: "pending", owner_role: "orch" }]),
    ];

    const waitClose = (child: ReturnType<typeof spawn>) =>
      new Promise<number | null>((resolve) => child.on("close", (code) => resolve(code)));

    const c1 = spawn("bun", writeArgs("w1", "writer one"), { env });
    const c2 = spawn("bun", writeArgs("w2", "writer two"), { env });
    const [s1, s2] = await Promise.all([waitClose(c1), waitClose(c2)]);

    expect(s1).toBe(0);
    expect(s2).toBe(0);
    expect(existsSync(join(h, "state.json.lock"))).toBe(false);

    const store = readStore(h);
    const tasks = (
      (store.missions as Record<string, Record<string, unknown>>)["m-ac11"].units as Record<
        string,
        Record<string, unknown>
      >
    )["u-ac11"].tasks as Array<{ id: string }>;
    const ids = tasks.map((t) => t.id).sort();
    expect(ids).toEqual(["w1", "w2"]);
  });

  test("AC12 — entry runnable via bun path with FLEET_TASKS_HOME", () => {
    const h = home();
    const r = spawnSync("bun", [CLI, "init", "--role", "cord"], {
      encoding: "utf8",
      env: { ...process.env, FLEET_TASKS_HOME: h, FLEET_TASK_ROLE: "cord" },
    });
    expect(r.status).toBe(0);
    expect(existsSync(join(h, "state.json"))).toBe(true);
  });

  test("AC-role-envelope-cord — herdr pane get envelope resolves 1-CORD; write succeeds without --role", () => {
    const h = home();
    seedMissionUnit(h, "m-herdr-env", "u-herdr-env");

    const payload = JSON.stringify([
      { id: "t1", content: "from herdr cord", status: "pending", owner_role: "orch" },
    ]);
    const r = runFleetTaskWithHerdr(
      ["write", "--unit", "u-herdr-env", "--merge", "false", "--json", payload],
      h,
      { envelope: loadHerdrPaneFixture("1-CORD") },
    );
    r.cleanupHerdr();
    expect(r.status).toBe(0);
  });

  test("AC-role-envelope-agnt — herdr pane get envelope resolves 3-AGNT; write denied without --role", () => {
    const h = home();
    seedMissionUnit(h, "m-herdr-env-deny", "u-herdr-env-deny");

    const payload = JSON.stringify([
      { id: "t1", content: "from herdr agnt", status: "pending", owner_role: "orch" },
    ]);
    const r = runFleetTaskWithHerdr(
      ["write", "--unit", "u-herdr-env-deny", "--merge", "false", "--json", payload],
      h,
      { envelope: loadHerdrPaneFixture("3-AGNT") },
    );
    r.cleanupHerdr();
    expect(r.status).not.toBe(0);
    expect(r.stderr).toMatch(/--role|role/i);
  });
});
