import { LEGAL_TRANSITIONS, type Mission, type OwnerRole, type Task, type TaskStatus, type Unit } from "./types.ts";

export function assertLegalTransition(from: TaskStatus, to: TaskStatus, taskId: string): void {
  if (from === to) return;
  if (!LEGAL_TRANSITIONS[from].includes(to)) {
    throw new Error(`fleet-task: illegal transition for task ${taskId}: ${from} → ${to}`);
  }
}

export function findUnit(store: { missions: Record<string, Mission> }, unitId: string): { mission: Mission; unit: Unit } {
  for (const mission of Object.values(store.missions)) {
    const unit = mission.units[unitId];
    if (unit) return { mission, unit };
  }
  throw new Error(`fleet-task: unit not found: ${unitId}`);
}

export function findMission(store: { missions: Record<string, Mission> }, missionId: string): Mission {
  const mission = store.missions[missionId];
  if (!mission) throw new Error(`fleet-task: mission not found: ${missionId}`);
  return mission;
}

export function assertGlobalUnitUnique(store: { missions: Record<string, Mission> }, unitId: string): void {
  for (const mission of Object.values(store.missions)) {
    if (mission.units[unitId]) throw new Error(`fleet-task: unit id already exists: ${unitId}`);
  }
}

// design §1.4 — one in_progress per owner scope.
export function assertOneInProgress(tasks: Task[], scope: string): void {
  for (const role of ["orch", "cord"] as OwnerRole[]) {
    const inProg = tasks.filter((t) => t.owner_role === role && t.status === "in_progress");
    if (inProg.length > 1) {
      throw new Error(
        `fleet-task: at most one in_progress ${role} task in ${scope}; found: ${inProg.map((t) => t.id).join(", ")}`,
      );
    }
  }
}

export function assertMissionCordInProgress(mission: Mission): void {
  const cordTasks: Task[] = [];
  for (const unit of Object.values(mission.units)) {
    for (const t of unit.tasks) {
      if (t.owner_role === "cord") cordTasks.push(t);
    }
  }
  const inProg = cordTasks.filter((t) => t.status === "in_progress");
  if (inProg.length > 1) {
    throw new Error(
      `fleet-task: at most one in_progress cord task in mission ${mission.id}; found: ${inProg.map((t) => t.id).join(", ")}`,
    );
  }
}

export function needsInProgressForScope(tasks: Task[], ownerRole: OwnerRole): boolean {
  const scoped = tasks.filter((t) => t.owner_role === ownerRole);
  const pending = scoped.filter((t) => t.status === "pending").length;
  const inProgress = scoped.filter((t) => t.status === "in_progress").length;
  return pending > 0 && inProgress === 0;
}

export type TaskPatch = Partial<Task> & { id: string };

export function requiredTaskFields(input: TaskPatch, creating: boolean): void {
  if (!input.id) throw new Error("fleet-task: task id required");
  if (creating) {
    if (!input.content) throw new Error(`fleet-task: task ${input.id}: content required`);
    if (!input.status) throw new Error(`fleet-task: task ${input.id}: status required`);
    if (!input.owner_role) throw new Error(`fleet-task: task ${input.id}: owner_role required`);
  }
}
