import { emptyProgress, type Progress, type RollupStatus, type Task, type TaskStatus } from "./types.ts";

// design §1.5 — exact rollup from child statuses.
export function rollupFromStatuses(statuses: TaskStatus[]): RollupStatus {
  if (statuses.length === 0) return "pending";
  const all = (s: TaskStatus) => statuses.every((x) => x === s);
  const any = (s: TaskStatus) => statuses.some((x) => x === s);
  if (all("cancelled")) return "cancelled";
  if (statuses.every((s) => s === "completed" || s === "cancelled") && any("completed")) return "completed";
  if (any("in_progress") || (any("completed") && any("pending"))) return "in_progress";
  return "pending";
}

export function progressFromStatuses(statuses: TaskStatus[]): Progress {
  const p = emptyProgress();
  for (const s of statuses) {
    p[s] += 1;
    p.total += 1;
  }
  return p;
}

export function rollupFromTasks(tasks: Task[]): { rollup_status: RollupStatus; progress: Progress } {
  const statuses = tasks.map((t) => t.status);
  return {
    rollup_status: rollupFromStatuses(statuses),
    progress: progressFromStatuses(statuses),
  };
}

export function rollupFromRollups(rollups: RollupStatus[]): { rollup_status: RollupStatus; progress: Progress } {
  return {
    rollup_status: rollupFromStatuses(rollups),
    progress: progressFromRollups(rollups),
  };
}

function progressFromRollups(rollups: RollupStatus[]): Progress {
  const p = emptyProgress();
  for (const s of rollups) {
    p[s] += 1;
    p.total += 1;
  }
  return p;
}
