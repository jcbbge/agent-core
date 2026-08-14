#!/usr/bin/env bun
// session-boundary-pi.oracle.ts — oracles for the pi before_agent_start
// extension (../session-boundary-pi.ts). One subcommand per VERIFY
// contract line. Run with bun.
//
//   import-clean : the module imports without throwing (bun -e equivalent)
//   fired-once   : with a fake pi/ctx over a fixture git repo carrying a
//                  TODO: handoff commit, the handler returns the documented
//                  injection shape on the first turn and nothing on the
//                  second (module-scope fired-once guard).
//
// component-verify manifest: ../VERIFY-session-boundary-pi.toml

import { execSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const EXT = resolve(import.meta.dir, "..", "session-boundary-pi.ts");
const mode = process.argv[2];

function die(msg: string): never {
  console.error(`${mode}: FAIL — ${msg}`);
  process.exit(1);
}

if (mode === "import-clean") {
  const mod = await import(EXT);
  if (typeof mod.default !== "function") die("default export is not a function");
  console.log("import-clean: PASS");
  process.exit(0);
}

if (mode === "fired-once") {
  // Fixture: a git repo whose HEAD commit carries a TODO: handoff line, so
  // leg 2 always has something to say regardless of machine state.
  const fixture = mkdtempSync(join(tmpdir(), "sbpi-fixture-"));
  try {
    const git = (cmd: string) =>
      execSync(`git ${cmd}`, { cwd: fixture, stdio: ["ignore", "pipe", "pipe"] });
    git("init -q");
    git("-c user.email=oracle@test -c user.name=oracle commit -q --allow-empty " +
        "-m 'test(fixture): seed' -m 'TODO: verify the fired-once guard'");

    const mod = await import(EXT);
    let handler: ((event: any, ctx: any) => Promise<any>) | undefined;
    const fakePi = {
      on(event: string, fn: any) {
        if (event === "before_agent_start") handler = fn;
      },
    };
    mod.default(fakePi);
    if (!handler) die("extension never registered a before_agent_start handler");

    const first = await handler({}, { cwd: fixture });
    if (!first?.message) die(`first turn returned no message: ${JSON.stringify(first)}`);
    const msg = first.message;
    if (msg.customType !== "session-boundary")
      die(`customType is ${JSON.stringify(msg.customType)}, want "session-boundary"`);
    if (typeof msg.content !== "string" || !msg.content.includes("TODO: verify the fired-once guard"))
      die(`content does not carry the fixture handoff: ${JSON.stringify(msg.content)}`);

    const second = await handler({}, { cwd: fixture });
    if (second !== undefined)
      die(`second turn injected again (fired-once guard broken): ${JSON.stringify(second)}`);

    console.log("fired-once: PASS");
    process.exit(0);
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
}

console.error("usage: bun session-boundary-pi.oracle.ts {import-clean|fired-once}");
process.exit(2);
