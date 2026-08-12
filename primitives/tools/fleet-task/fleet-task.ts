#!/usr/bin/env bun
// fleet-task — CORD/ORCH whiteboard CLI (global store ~/.fleet-tasks/state.json).
// Writes: cord|orch only. Reads/render: all roles. Tower finding on rollup change.
import { realpathSync } from "node:fs";
import { rollupFromRollups, rollupFromTasks } from "./rollup.ts";
import { canWrite, denyWriteMessage, resolveRole } from "./role.ts";
import { fleetTasksHome, initStore, mutateStore, readStore } from "./store.ts";
import { postRollupTransition } from "./tower.ts";
import {
  assertGlobalUnitUnique,
  assertLegalTransition,
  assertMissionCordInProgress,
  assertOneInProgress,
  findMission,
  findUnit,
  needsInProgressForScope,
  requiredTaskFields,
  type TaskPatch,
} from "./validate.ts";
import { renderOptions, renderStore } from "./render.ts";
import { nowIso, type Mission, type OwnerRole, type Store, type Task, type Unit } from "./types.ts";

const rawArgv = process.argv.slice(2);

function stripGlobalFlags(args: string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--role") {
      i += 1;
      continue;
    }
    out.push(args[i]);
  }
  return out;
}

const argv = stripGlobalFlags(rawArgv);

function usage(): never {
  console.error(`usage: fleet-task <verb> [options]

verbs:
  init
  mission open|close|show
  unit open|close|show
  write --unit <id> --merge true|false --json '<array>'
  read [--unit <id>|--mission <id>|--status <status>]
  render [--unit <id>|--mission <id>] [--ids]
  prune --unit <id> --completed|--cancelled

global: --role cord|orch|agnt|sagt  FLEET_TASK_ROLE  FLEET_TASKS_HOME`);
  process.exit(1);
}

function opt(name: string): string | undefined {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : undefined;
}

function hasFlag(name: string): boolean {
  return argv.includes(name);
}

function requireWriteRole(): void {
  const role = resolveRole(rawArgv);
  if (!role.ok || !canWrite(role.role)) {
    console.error(denyWriteMessage());
    process.exit(1);
  }
}

function recomputeUnit(unit: Unit): void {
  const r = rollupFromTasks(unit.tasks);
  unit.rollup_status = r.rollup_status;
  unit.progress = r.progress;
  unit.updated_at = nowIso();
}

function recomputeMission(mission: Mission): void {
  const rollups = Object.values(mission.units).map((u) => u.rollup_status);
  const r = rollupFromRollups(rollups);
  mission.rollup_status = r.rollup_status;
  mission.progress = r.progress;
  mission.updated_at = nowIso();
}

function applyRollupTransitions(
  store: Store,
  mission: Mission,
  unit: Unit,
  prevUnitRollup: string,
  prevMissionRollup: string,
): void {
  if (unit.rollup_status !== prevUnitRollup) {
    postRollupTransition(mission.project, mission.project_root, unit.id, prevUnitRollup as any, unit.rollup_status);
  }
  if (mission.rollup_status !== prevMissionRollup) {
    postRollupTransition(
      mission.project,
      mission.project_root,
      mission.id,
      prevMissionRollup as any,
      mission.rollup_status,
    );
  }
}

function mergeTasks(existing: Task[], patches: TaskPatch[], merge: boolean): Task[] {
  const byId = new Map(existing.map((t) => [t.id, { ...t }]));
  const ts = nowIso();

  if (!merge) {
    const next: Task[] = [];
    for (const patch of patches) {
      requiredTaskFields(patch, true);
      next.push({
        id: patch.id,
        content: patch.content!,
        status: patch.status!,
        active_form: patch.active_form,
        owner_role: patch.owner_role!,
        owner_pane: patch.owner_pane,
        owner_agent: patch.owner_agent,
        deps: patch.deps ?? [],
        created_at: ts,
        updated_at: ts,
      });
    }
    return next;
  }

  for (const patch of patches) {
    requiredTaskFields(patch, !byId.has(patch.id));
    const prev = byId.get(patch.id);
    if (!prev) {
      byId.set(patch.id, {
        id: patch.id,
        content: patch.content!,
        status: patch.status!,
        active_form: patch.active_form,
        owner_role: patch.owner_role!,
        owner_pane: patch.owner_pane,
        owner_agent: patch.owner_agent,
        deps: patch.deps ?? [],
        created_at: ts,
        updated_at: ts,
      });
      continue;
    }

    const nextStatus = patch.status ?? prev.status;
    assertLegalTransition(prev.status, nextStatus, patch.id);

    byId.set(patch.id, {
      ...prev,
      content: patch.content ?? prev.content,
      status: nextStatus,
      active_form: patch.active_form !== undefined ? patch.active_form : prev.active_form,
      owner_role: patch.owner_role ?? prev.owner_role,
      owner_pane: patch.owner_pane !== undefined ? patch.owner_pane : prev.owner_pane,
      owner_agent: patch.owner_agent !== undefined ? patch.owner_agent : prev.owner_agent,
      deps: patch.deps ?? prev.deps,
      updated_at: ts,
    });
  }

  return [...byId.values()];
}

function cmdInit(): void {
  requireWriteRole();
  initStore(fleetTasksHome());
  console.log(JSON.stringify({ ok: true, home: fleetTasksHome() }));
}

function cmdMissionOpen(): void {
  requireWriteRole();
  const id = opt("--id");
  const project = opt("--project");
  const projectRoot = opt("--project-root");
  const title = opt("--title");
  if (!id || !project || !projectRoot || !title) {
    console.error("fleet-task: mission open requires --id --project --project-root --title");
    process.exit(1);
  }

  const absRoot = realpathSync(projectRoot);
  const home = fleetTasksHome();
  mutateStore(home, (store) => {
    if (store.missions[id]) throw new Error(`fleet-task: mission already exists: ${id}`);
    const ts = nowIso();
    store.missions[id] = {
      id,
      project,
      project_root: absRoot,
      title,
      rollup_status: "pending",
      progress: { pending: 0, in_progress: 0, completed: 0, cancelled: 0, total: 0 },
      created_at: ts,
      updated_at: ts,
      units: {},
    };
    return store.missions[id];
  });
  console.log(JSON.stringify({ ok: true, id }));
}

function cmdMissionClose(): void {
  requireWriteRole();
  const id = opt("--id");
  if (!id) {
    console.error("fleet-task: mission close requires --id");
    process.exit(1);
  }

  const home = fleetTasksHome();
  mutateStore(home, (store) => {
    const mission = findMission(store, id);
    const prevMission = mission.rollup_status;
    const prevUnits = new Map<string, string>();
    for (const unit of Object.values(mission.units)) {
      prevUnits.set(unit.id, unit.rollup_status);
      assertOneInProgress(unit.tasks, `unit ${unit.id}`);
      recomputeUnit(unit);
    }
    recomputeMission(mission);

    for (const unit of Object.values(mission.units)) {
      const prev = prevUnits.get(unit.id)!;
      if (unit.rollup_status !== prev) {
        postRollupTransition(mission.project, mission.project_root, unit.id, prev as any, unit.rollup_status);
      }
    }
    if (mission.rollup_status !== prevMission) {
      postRollupTransition(mission.project, mission.project_root, mission.id, prevMission, mission.rollup_status);
    }
    return mission;
  });
  console.log(JSON.stringify({ ok: true, id }));
}

function cmdMissionShow(): void {
  const id = opt("--id");
  if (!id) {
    console.error("fleet-task: mission show requires --id");
    process.exit(1);
  }
  const mission = findMission(readStore(), id);
  console.log(JSON.stringify(mission, null, 2));
}

function cmdUnitOpen(): void {
  requireWriteRole();
  const missionId = opt("--mission");
  const id = opt("--id");
  const title = opt("--title");
  const ownerAgent = opt("--owner-agent");
  if (!missionId || !id || !title || !ownerAgent) {
    console.error("fleet-task: unit open requires --mission --id --title --owner-agent");
    process.exit(1);
  }

  const home = fleetTasksHome();
  mutateStore(home, (store) => {
    const mission = findMission(store, missionId);
    assertGlobalUnitUnique(store, id);
    const ts = nowIso();
    mission.units[id] = {
      id,
      title,
      owner_agent: ownerAgent,
      rollup_status: "pending",
      progress: { pending: 0, in_progress: 0, completed: 0, cancelled: 0, total: 0 },
      created_at: ts,
      updated_at: ts,
      tasks: [],
    };
    const prevMission = mission.rollup_status;
    recomputeMission(mission);
    if (mission.rollup_status !== prevMission) {
      postRollupTransition(mission.project, mission.project_root, mission.id, prevMission, mission.rollup_status);
    }
    return mission.units[id];
  });
  console.log(JSON.stringify({ ok: true, id }));
}

function cmdUnitClose(): void {
  requireWriteRole();
  const missionId = opt("--mission");
  const id = opt("--id");
  if (!missionId || !id) {
    console.error("fleet-task: unit close requires --mission --id");
    process.exit(1);
  }

  const home = fleetTasksHome();
  mutateStore(home, (store) => {
    const mission = findMission(store, missionId);
    const unit = mission.units[id];
    if (!unit) throw new Error(`fleet-task: unit not found in mission: ${id}`);

    const prevUnit = unit.rollup_status;
    const prevMission = mission.rollup_status;
    assertOneInProgress(unit.tasks, `unit ${unit.id}`);
    recomputeUnit(unit);
    recomputeMission(mission);
    applyRollupTransitions(store, mission, unit, prevUnit, prevMission);
    return unit;
  });
  console.log(JSON.stringify({ ok: true, id }));
}

function cmdUnitShow(): void {
  const id = opt("--id");
  if (!id) {
    console.error("fleet-task: unit show requires --id");
    process.exit(1);
  }
  const { unit } = findUnit(readStore(), id);
  console.log(JSON.stringify(unit, null, 2));
}

function cmdWrite(): void {
  requireWriteRole();
  const unitId = opt("--unit");
  const mergeRaw = opt("--merge");
  const jsonRaw = opt("--json");
  if (!unitId || mergeRaw === undefined || !jsonRaw) {
    console.error("fleet-task: write requires --unit --merge true|false --json '<array>'");
    process.exit(1);
  }
  const merge = mergeRaw === "true";
  if (mergeRaw !== "true" && mergeRaw !== "false") {
    console.error("fleet-task: --merge must be true or false");
    process.exit(1);
  }

  let patches: TaskPatch[];
  try {
    patches = JSON.parse(jsonRaw);
    if (!Array.isArray(patches)) throw new Error("not an array");
  } catch (e) {
    console.error(`fleet-task: invalid --json: ${(e as Error).message}`);
    process.exit(1);
  }

  const home = fleetTasksHome();
  const result = mutateStore(home, (store) => {
    const { mission, unit } = findUnit(store, unitId);
    const prevUnit = unit.rollup_status;
    const prevMission = mission.rollup_status;

    const existing = merge ? unit.tasks : [];
    if (merge) {
      for (const patch of patches) {
        const prev = unit.tasks.find((t) => t.id === patch.id);
        if (prev && patch.status) assertLegalTransition(prev.status, patch.status, patch.id);
      }
    }

    unit.tasks = mergeTasks(existing, patches, merge);
    assertOneInProgress(unit.tasks, `unit ${unit.id}`);
    assertMissionCordInProgress(mission);
    recomputeUnit(unit);
    recomputeMission(mission);
    applyRollupTransitions(store, mission, unit, prevUnit, prevMission);

    const ownerRoles = new Set<OwnerRole>();
    for (const patch of patches) {
      if (patch.owner_role) ownerRoles.add(patch.owner_role);
      else if (merge) {
        const prev = existing.find((t) => t.id === patch.id);
        if (prev) ownerRoles.add(prev.owner_role);
      }
    }
    let needs = false;
    for (const role of ownerRoles) {
      if (needsInProgressForScope(unit.tasks, role)) needs = true;
    }

    return { unit: { ...unit }, mission: { ...mission }, needs_in_progress: needs };
  });

  console.log(JSON.stringify({ ok: true, needs_in_progress: result.needs_in_progress, unit: result.unit, mission: result.mission }));
}

function cmdRead(): void {
  const unitId = opt("--unit");
  const missionId = opt("--mission");
  const status = opt("--status");
  const store = readStore();

  if (unitId) {
    const { unit } = findUnit(store, unitId);
    console.log(JSON.stringify(unit, null, 2));
    return;
  }

  if (missionId) {
    console.log(JSON.stringify(findMission(store, missionId), null, 2));
    return;
  }

  const tasks: Array<Task & { unit_id: string; mission_id: string }> = [];
  for (const mission of Object.values(store.missions)) {
    for (const unit of Object.values(mission.units)) {
      for (const task of unit.tasks) {
        if (!status || task.status === status) {
          tasks.push({ ...task, unit_id: unit.id, mission_id: mission.id });
        }
      }
    }
  }
  console.log(JSON.stringify(tasks, null, 2));
}

function cmdRender(): void {
  const unitId = opt("--unit");
  const missionId = opt("--mission");
  const store = readStore();
  const renderOpt = renderOptions(argv);
  const scope = unitId ? { unitId } : missionId ? { missionId } : undefined;
  process.stdout.write(renderStore(store, renderOpt, scope));
}

function cmdPrune(): void {
  requireWriteRole();
  const unitId = opt("--unit");
  const completed = hasFlag("--completed");
  const cancelled = hasFlag("--cancelled");
  if (!unitId || (!completed && !cancelled)) {
    console.error("fleet-task: prune requires --unit <id> and --completed and/or --cancelled");
    process.exit(1);
  }

  const home = fleetTasksHome();
  mutateStore(home, (store) => {
    const { mission, unit } = findUnit(store, unitId);
    const prevUnit = unit.rollup_status;
    const prevMission = mission.rollup_status;

    unit.tasks = unit.tasks.filter((t) => {
      if (completed && t.status === "completed") return false;
      if (cancelled && t.status === "cancelled") return false;
      return true;
    });

    recomputeUnit(unit);
    recomputeMission(mission);
    applyRollupTransitions(store, mission, unit, prevUnit, prevMission);
    return unit;
  });
  console.log(JSON.stringify({ ok: true, unit: unitId }));
}

// ── dispatch ─────────────────────────────────────────────────────────────────
const verb = argv[0];
if (!verb || verb.startsWith("--")) usage();

try {
  if (verb === "init") cmdInit();
  else if (verb === "mission") {
    const sub = argv[1];
    if (sub === "open") cmdMissionOpen();
    else if (sub === "close") cmdMissionClose();
    else if (sub === "show") cmdMissionShow();
    else usage();
  } else if (verb === "unit") {
    const sub = argv[1];
    if (sub === "open") cmdUnitOpen();
    else if (sub === "close") cmdUnitClose();
    else if (sub === "show") cmdUnitShow();
    else usage();
  } else if (verb === "write") cmdWrite();
  else if (verb === "read") cmdRead();
  else if (verb === "render") cmdRender();
  else if (verb === "prune") cmdPrune();
  else usage();
} catch (e) {
  console.error((e as Error).message);
  process.exit(1);
}
