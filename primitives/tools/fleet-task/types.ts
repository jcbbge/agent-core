// fleet-task store types — schema is binding (brief make-impl).

export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled";
export type RollupStatus = TaskStatus;
export type OwnerRole = "cord" | "orch";
export type FleetRole = OwnerRole | "agnt" | "sagt";

export type Progress = {
  pending: number;
  in_progress: number;
  completed: number;
  cancelled: number;
  total: number;
};

export type Task = {
  id: string;
  content: string;
  status: TaskStatus;
  active_form?: string;
  owner_role: OwnerRole;
  owner_pane?: string;
  owner_agent?: string;
  deps: string[];
  created_at: string;
  updated_at: string;
};

export type Unit = {
  id: string;
  title: string;
  owner_agent: string;
  rollup_status: RollupStatus;
  progress: Progress;
  created_at: string;
  updated_at: string;
  tasks: Task[];
};

export type Mission = {
  id: string;
  project: string;
  project_root: string;
  title: string;
  rollup_status: RollupStatus;
  progress: Progress;
  created_at: string;
  updated_at: string;
  units: Record<string, Unit>;
};

export type Store = {
  version: 1;
  missions: Record<string, Mission>;
};

export const GLYPH: Record<TaskStatus, string> = {
  pending: "○",
  in_progress: "◐",
  completed: "✓",
  cancelled: "⊘",
};

export const LEGAL_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  pending: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export function emptyProgress(): Progress {
  return { pending: 0, in_progress: 0, completed: 0, cancelled: 0, total: 0 };
}

export function nowIso(): string {
  return new Date().toISOString();
}
