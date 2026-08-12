// Shared subprocess helpers for fleet-task acceptance tests.
// Tests invoke the CLI entry via bun; never touch live ~/.fleet-tasks/.
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const CLI = join(dirname(fileURLToPath(import.meta.url)), "fleet-task.ts");
export const AGENT_CORE_ROOT = "/Users/jrg/agent-core";
export const TOWER_BOARD = join(process.env.HOME ?? "", ".tower", "board.jsonl");

export type RunResult = {
  status: number | null;
  stdout: string;
  stderr: string;
};

export function freshHome(): string {
  return mkdtempSync(join(tmpdir(), "fleet-task-test-"));
}

export function runFleetTask(
  args: string[],
  home: string,
  extraEnv: Record<string, string | undefined> = {},
): RunResult {
  const env: Record<string, string | undefined> = {
    ...process.env,
    FLEET_TASKS_HOME: home,
    ...extraEnv,
  };
  delete env.HERDR_PANE_ID;
  delete env.FLEET_TASK_ROLE;
  if ("HERDR_PANE_ID" in extraEnv) env.HERDR_PANE_ID = extraEnv.HERDR_PANE_ID;
  if ("FLEET_TASK_ROLE" in extraEnv) env.FLEET_TASK_ROLE = extraEnv.FLEET_TASK_ROLE;

  const proc = spawnSync("bun", [CLI, ...args], {
    encoding: "utf8",
    env,
  });
  return {
    status: proc.status,
    stdout: proc.stdout ?? "",
    stderr: proc.stderr ?? "",
  };
}

export function readStore(home: string): Record<string, unknown> {
  const raw = readFileSync(join(home, "state.json"), "utf8");
  return JSON.parse(raw);
}

export function seedMissionUnit(
  home: string,
  missionId = "m-ac",
  unitId = "u-ac",
  projectRoot = AGENT_CORE_ROOT,
): void {
  runFleetTask(["init", "--role", "cord"], home);
  runFleetTask(
    [
      "mission",
      "open",
      "--id",
      missionId,
      "--project",
      "agent-core",
      "--project-root",
      projectRoot,
      "--title",
      "acceptance mission",
    ],
    home,
    { FLEET_TASK_ROLE: "cord" },
  );
  runFleetTask(
    [
      "unit",
      "open",
      "--mission",
      missionId,
      "--id",
      unitId,
      "--title",
      "acceptance unit",
      "--owner-agent",
      "orch-ac",
    ],
    home,
    { FLEET_TASK_ROLE: "orch" },
  );
}

export function tailBoardFindings(topic: string, sinceLine = 0): Array<Record<string, unknown>> {
  const lines = readFileSync(TOWER_BOARD, "utf8").trim().split("\n").filter(Boolean);
  const rows: Array<Record<string, unknown>> = [];
  for (let i = sinceLine; i < lines.length; i++) {
    try {
      const row = JSON.parse(lines[i]) as Record<string, unknown>;
      if (row.type === "finding" && row.topic === topic) rows.push(row);
    } catch {
      // skip malformed lines
    }
  }
  return rows;
}

export function boardLineCount(): number {
  try {
    return readFileSync(TOWER_BOARD, "utf8").trim().split("\n").filter(Boolean).length;
  } catch {
    return 0;
  }
}

export function cleanupHome(home: string): void {
  rmSync(home, { recursive: true, force: true });
}
