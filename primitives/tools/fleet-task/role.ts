import type { FleetRole } from "./types.ts";

const HERDR_MAP: Record<string, FleetRole> = {
  "1-CORD": "cord",
  "2-ORCH": "orch",
  "3-AGNT": "agnt",
  "4-SAGT": "sagt",
};

export type RoleResolution =
  | { ok: true; role: FleetRole }
  | { ok: false; reason: "undeterminable" | "invalid" };

export function parseRoleFlag(value: string | undefined): RoleResolution {
  if (!value) return { ok: false, reason: "undeterminable" };
  const role = value.toLowerCase() as FleetRole;
  if (role === "cord" || role === "orch" || role === "agnt" || role === "sagt") {
    return { ok: true, role };
  }
  return { ok: false, reason: "invalid" };
}

function roleFromHerdr(): RoleResolution {
  const paneId = process.env.HERDR_PANE_ID;
  if (!paneId) return { ok: false, reason: "undeterminable" };

  const r = Bun.spawnSync(["herdr", "pane", "get", paneId], {
    stdout: "pipe",
    stderr: "pipe",
  });
  if (r.exitCode !== 0) return { ok: false, reason: "undeterminable" };

  try {
    const data = JSON.parse(r.stdout.toString()) as { tokens?: { role?: string } };
    const raw = data.tokens?.role;
    if (!raw || !(raw in HERDR_MAP)) return { ok: false, reason: "undeterminable" };
    return { ok: true, role: HERDR_MAP[raw] };
  } catch {
    return { ok: false, reason: "undeterminable" };
  }
}

export function resolveRole(args: string[]): RoleResolution {
  const i = args.indexOf("--role");
  if (i >= 0 && args[i + 1]) return parseRoleFlag(args[i + 1]);
  const env = process.env.FLEET_TASK_ROLE;
  if (env) return parseRoleFlag(env);
  return roleFromHerdr();
}

export function canWrite(role: FleetRole): boolean {
  return role === "cord" || role === "orch";
}

export function denyWriteMessage(): string {
  return "fleet-task: write denied — role undeterminable or insufficient; use --role cord|orch";
}
