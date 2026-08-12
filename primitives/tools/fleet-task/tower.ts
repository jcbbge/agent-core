import { join } from "node:path";
import { homedir } from "node:os";
import type { RollupStatus } from "./types.ts";

const TMP_PREFIXES = ["/tmp", "/private/tmp", "/scratchpad", "/var/folders"];

export function isTmpProjectRoot(projectRoot: string): boolean {
  const norm = projectRoot.replace(/\/+$/, "");
  return TMP_PREFIXES.some((p) => norm === p || norm.startsWith(`${p}/`));
}

export function postRollupTransition(
  project: string,
  projectRoot: string,
  entityId: string,
  oldStatus: RollupStatus,
  newStatus: RollupStatus,
): void {
  if (oldStatus === newStatus) return;

  const topic = `${project}/fleet-tasks`;
  const body = `${entityId} ${oldStatus}→${newStatus}`;
  const from = `fleet-task@${project}`;
  const cli = join(homedir(), ".tower", "cli.mjs");

  const r = Bun.spawnSync(
    ["bun", cli, "post", "finding", topic, body, "--from", from],
    { cwd: projectRoot, stdout: "pipe", stderr: "pipe" },
  );

  if (r.exitCode !== 0) {
    const err = r.stderr.toString().trim() || r.stdout.toString().trim() || "unknown error";
    console.error(`fleet-task: warning: Tower post failed (${err})`);
  }
}
