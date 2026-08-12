import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { Store } from "./types.ts";

const LOCK_STALE_MS = 30_000;
const LOCK_WAIT_MS = 5_000;
const LOCK_RETRY_MS = 50;

export function fleetTasksHome(): string {
  return process.env.FLEET_TASKS_HOME ?? join(homedir(), ".fleet-tasks");
}

export function statePath(home = fleetTasksHome()): string {
  return join(home, "state.json");
}

export function lockPath(home = fleetTasksHome()): string {
  return join(home, "state.json.lock");
}

export function emptyStore(): Store {
  return { version: 1, missions: {} };
}

export function readStore(home = fleetTasksHome()): Store {
  const path = statePath(home);
  if (!existsSync(path)) {
    throw new Error(`fleet-task: store missing at ${path} — run fleet-task init`);
  }
  return JSON.parse(readFileSync(path, "utf8")) as Store;
}

export function writeStoreAtomic(home: string, store: Store): void {
  const path = statePath(home);
  const tmp = `${path}.tmp.${process.pid}`;
  writeFileSync(tmp, `${JSON.stringify(store, null, 2)}\n`, "utf8");
  renameSync(tmp, path);
}

function sleep(ms: number): void {
  Bun.sleepSync(ms);
}

export function withStoreLock<T>(home: string, fn: () => T): T {
  mkdirSync(home, { recursive: true });
  const lp = lockPath(home);
  const deadline = Date.now() + LOCK_WAIT_MS;
  let fd: number | null = null;

  while (Date.now() < deadline) {
    try {
      if (existsSync(lp)) {
        const st = statSync(lp);
        if (Date.now() - st.mtimeMs > LOCK_STALE_MS) unlinkSync(lp);
      }
      fd = openSync(lp, "wx");
      break;
    } catch {
      sleep(LOCK_RETRY_MS);
    }
  }

  if (fd === null) throw new Error("fleet-task: could not acquire state lock within 5s");

  try {
    return fn();
  } finally {
    closeSync(fd);
    try {
      unlinkSync(lp);
    } catch {
      /* lock may already be gone */
    }
  }
}

export function mutateStore<T>(home: string, fn: (store: Store) => T): T {
  return withStoreLock(home, () => {
    const store = readStore(home);
    const result = fn(store);
    writeStoreAtomic(home, store);
    return result;
  });
}

export function initStore(home = fleetTasksHome()): void {
  mkdirSync(home, { recursive: true });
  const path = statePath(home);
  if (existsSync(path)) throw new Error(`fleet-task: store already exists at ${path}`);
  writeStoreAtomic(home, emptyStore());
}
