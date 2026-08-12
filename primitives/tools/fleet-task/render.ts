import { findMission, findUnit } from "./validate.ts";
import { GLYPH, type Mission, type Store, type Task, type Unit } from "./types.ts";

const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

export type RenderOptions = {
  showIds: boolean;
  useColor: boolean;
};

export function renderOptions(argv: string[]): RenderOptions {
  return {
    showIds: argv.includes("--ids"),
    useColor: Boolean(process.stdout.isTTY) && !process.env.NO_COLOR,
  };
}

function dim(text: string, opt: RenderOptions): string {
  return opt.useColor ? `${DIM}${text}${RESET}` : text;
}

function sortedMissions(store: Store): Mission[] {
  return Object.values(store.missions).sort((a, b) => a.id.localeCompare(b.id));
}

function sortedUnits(mission: Mission): Unit[] {
  return Object.values(mission.units).sort((a, b) => a.id.localeCompare(b.id));
}

function sortedTasks(unit: Unit): Task[] {
  return [...unit.tasks].sort((a, b) => a.id.localeCompare(b.id));
}

function missionTaskCount(mission: Mission): string {
  let completed = 0;
  let total = 0;
  for (const unit of Object.values(mission.units)) {
    for (const task of unit.tasks) {
      total += 1;
      if (task.status === "completed") completed += 1;
    }
  }
  if (total === 0) return "";
  return `  ${completed}/${total}`;
}

function missionLine(mission: Mission, opt: RenderOptions): string {
  const glyph = GLYPH[mission.rollup_status];
  const count = missionTaskCount(mission);
  if (opt.showIds) return `${glyph} ${mission.id}: ${mission.title}${count}`;
  return `${glyph} ${mission.title}${count}`;
}

function unitLine(unit: Unit, mission: Mission, indent: string, opt: RenderOptions): string {
  const glyph = GLYPH[unit.rollup_status];
  if (opt.showIds) return `${indent}${glyph} ${mission.id} / ${unit.id}: ${unit.title}`;
  return `${indent}${glyph} ${unit.title}`;
}

function emptyUnitMessage(unit: Unit): string {
  switch (unit.rollup_status) {
    case "completed":
      return "tasks pruned — complete";
    case "cancelled":
      return "tasks pruned — cancelled";
    default:
      return "no tasks";
  }
}

function renderUnit(unit: Unit, mission: Mission, indent: string, lines: string[], opt: RenderOptions): void {
  lines.push(unitLine(unit, mission, indent, opt));
  if (unit.tasks.length === 0) {
    lines.push(dim(`${indent}  ${emptyUnitMessage(unit)}`, opt));
    return;
  }
  for (const task of sortedTasks(unit)) {
    const line = `${indent}  ${GLYPH[task.status]} ${task.content}`;
    lines.push(task.status === "completed" ? dim(line, opt) : line);
  }
}

function renderMission(mission: Mission, lines: string[], opt: RenderOptions, unitIndent = "  "): void {
  lines.push(missionLine(mission, opt));
  for (const unit of sortedUnits(mission)) {
    renderUnit(unit, mission, unitIndent, lines, opt);
  }
}

export function renderStore(
  store: Store,
  opt: RenderOptions,
  scope?: { missionId?: string; unitId?: string },
): string {
  const lines: string[] = [];

  if (scope?.unitId) {
    const { mission, unit } = findUnit(store, scope.unitId);
    renderUnit(unit, mission, "", lines, opt);
  } else if (scope?.missionId) {
    const mission = findMission(store, scope.missionId);
    renderMission(mission, lines, opt);
  } else {
    for (const mission of sortedMissions(store)) {
      renderMission(mission, lines, opt);
    }
  }

  return lines.length > 0 ? `${lines.join("\n")}\n` : "";
}
